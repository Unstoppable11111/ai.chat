import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { executeQuery, executeWrite } from "./db";

const scrypt = promisify(scryptCallback);
export interface StudioUser { id: string; email: string; password_hash: string }
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}
export async function checkPassword(password: string, stored: string) {
  const [salt, encoded] = stored.split(":");
  if (!salt || !encoded) return false;
  const key = await scrypt(password, salt, 64) as Buffer;
  const expected = Buffer.from(encoded, "hex");
  return expected.length === key.length && timingSafeEqual(key, expected);
}
export async function findUser(email: string) {
  return (await executeQuery<StudioUser>("SELECT id,email,password_hash FROM studio_users WHERE email=? AND disabled=0 LIMIT 1", [email]))?.[0] ?? null;
}
export async function registerUser(email: string, password: string) {
  const id = randomUUID();
  await executeWrite("INSERT INTO studio_users(id,email,password_hash) VALUES(?,?,?)", [id,email,await hashPassword(password)]);
  return id;
}
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export async function issueSession(userId: string, seconds: number) {
  const token = randomBytes(32).toString("base64url");
  await executeWrite("INSERT INTO studio_sessions(token_hash,user_id,expires_at) VALUES(?,?,?)", [tokenHash(token),userId,new Date(Date.now() + seconds * 1000)]);
  return token;
}
export async function sessionUser(token: string | undefined) {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  try {
    return (await executeQuery<{ user_id: string }>("SELECT s.user_id FROM studio_sessions s JOIN studio_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>NOW() AND u.disabled=0 LIMIT 1", [tokenHash(token)]))?.[0]?.user_id ?? null;
  } catch { return null; }
}
export async function revokeSession(token: string) {
  await executeWrite("DELETE FROM studio_sessions WHERE token_hash=?", [tokenHash(token)]);
}
