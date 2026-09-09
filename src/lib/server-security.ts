import { createHash } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { getDbPool } from "./db";
import { sessionUser } from "./auth-db";

export const SESSION_COOKIE = "studio_session";
export const SESSION_SECONDS = 60 * 60 * 8;

export function authConfigured() { return !!getDbPool(); }
export const verifySession = sessionUser;
export function sessionToken(request: Request) {
  return request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
}
export function requestOwner(request: Request) { return sessionUser(sessionToken(request)); }
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  const origins = [new URL(request.url).origin];
  if (process.env.SITE_URL) origins.push(new URL(process.env.SITE_URL).origin);
  return origins.includes(origin);
}
export async function readJsonBody(request: Request, maxBytes = 65536): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new Error("INVALID_BODY");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("INVALID_BODY");
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) { await reader.cancel(); throw new Error("BODY_TOO_LARGE"); }
      chunks.push(value);
    }
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("INVALID_BODY");
    return body as Record<string, unknown>;
  } finally { reader.releaseLock(); }
}

export function clientKey(request: Request) {
  const address = process.env.TRUST_PROXY === "true" ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() : null;
  return createHash("sha256").update(address || "shared-public-budget").digest("hex");
}
export async function takeQuota(key: string, limit: number, windowMs: number): Promise<boolean> {
  const db = getDbPool();
  if (!db) throw new Error("Quota storage unavailable");
  const connection = await db.getConnection();
  const id = createHash("sha256").update(key).digest("hex");
  try {
    await connection.beginTransaction();
    await connection.execute("INSERT IGNORE INTO request_quotas (id,used,expires_at) VALUES (?,0,DATE_ADD(NOW(3),INTERVAL ? MICROSECOND))", [id,windowMs * 1000]);
    const [rows] = await connection.execute<RowDataPacket[]>("SELECT used,expires_at<=NOW(3) AS expired FROM request_quotas WHERE id=? FOR UPDATE", [id]);
    const count = rows[0].expired ? 0 : Number(rows[0].used);
    if (count >= limit) { await connection.rollback(); return false; }
    await connection.execute("UPDATE request_quotas SET used=?,expires_at=IF(expires_at<=NOW(3),DATE_ADD(NOW(3),INTERVAL ? MICROSECOND),expires_at) WHERE id=?", [count+1,windowMs*1000,id]);
    await connection.commit();
    return true;
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
