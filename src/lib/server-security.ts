import { createHash } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { getDbPool } from "./db";
import { sessionUser, isSuperAdmin } from "./auth-db";

export const SESSION_COOKIE = "studio_session";
export const SESSION_SECONDS = 60 * 60 * 8;

export function authConfigured() { return !!getDbPool(); }
export const verifySession = sessionUser;
export function sessionToken(request: Request) {
  return request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
}
export function requestOwner(request: Request) { return sessionUser(sessionToken(request)); }
export async function isRequestSuperAdmin(request: Request) {
  const userId = await requestOwner(request);
  return isSuperAdmin(userId);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  const origins = [new URL(request.url).origin];
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (request.url.startsWith("https") ? "https" : "http");
  if (host) {
    origins.push(`${proto}://${host}`);
    origins.push(`http://${host}`);
    origins.push(`https://${host}`);
  }
  if (process.env.SITE_URL) {
    try { origins.push(new URL(process.env.SITE_URL).origin); } catch {}
  }
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

import {
  detectPromptInjection,
  checkMemoryRateLimit,
} from "./workflow-security.mjs";

export {
  detectPromptInjection,
  checkMemoryRateLimit,
};

/**
 * 工作流服务端多维高频请求防护 (Anti-Spam / Rate Limiting)
 */
export async function checkWorkflowRateLimit(
  request: Request,
  userId: string,
  type: "novel" | "asset"
): Promise<{ allowed: boolean; message?: string }> {
  // 超级管理员特权：完全不受高频请求频控限制
  if (await isSuperAdmin(userId)) {
    return { allowed: true };
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "ip-anonymous";
  const ipKey = `rate:ip:${type}:${clientIp}`;
  const userKey = `rate:user:${type}:${userId}`;

  // novel 流程: 单用户 60s 内限 1 次，单 IP 60s 内限 2 次
  // asset 流程: 单用户 60s 内限 4 次，单 IP 60s 内限 6 次
  const userLimit = type === "novel" ? 1 : 4;
  const ipLimit = type === "novel" ? 2 : 6;
  const windowMs = 60 * 1000;

  // 1. 内存滑动窗口高速校验 (拦截大部分恶意脚本)
  if (!checkMemoryRateLimit(userKey, userLimit, windowMs)) {
    return {
      allowed: false,
      message:
        type === "novel"
          ? "操作过于频繁，生成小说工业化全案每 60 秒仅限启动一次，请稍候再试。"
          : "生成视觉资产过于频繁，每 60 秒最多生成 4 张，请稍候再试。",
    };
  }

  if (!checkMemoryRateLimit(ipKey, ipLimit, windowMs)) {
    return {
      allowed: false,
      message: "检测到当前网络环境请求过于高频，已触发安全防御，请 1 分钟后再试。",
    };
  }

  // 2. 数据库滑动窗口持久校验 (防御跨实例刷接口)
  try {
    const ok = await takeQuota(userKey, userLimit, windowMs);
    if (!ok) {
      return { allowed: false, message: "操作过于频繁，已触发高频安全保护，请稍后重试。" };
    }
  } catch {
    // 数据库抖动时自动沿用内存校验结果
  }

  return { allowed: true };
}

