import { createHash, randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { getDbPool } from "./db";
import { sessionToken, verifySession, clientKey } from "./server-security";

// 内存降级存储（针对无数据库环境或数据库偶发闪断）
const memoryQuotaStore = new Map<string, { used: number; expiresAt: number }>();

export const GUEST_CHAT_DAILY_LIMIT = 10;
export const GUEST_COOKIE_NAME = "studio_guest_token";

/**
 * 重置内存配额存储（用于测试）
 */
export function resetMemoryQuotaStore() {
  memoryQuotaStore.clear();
}

/**
 * 获取北京时间 (Asia/Shanghai) 的当前日期字符串，形如 "2026-10-14"
 */
export function getBeijingDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

/**
 * 计算距离下一个北京时间 0 点（次日 00:00:00）的毫秒数
 */
export function getMsUntilNextBeijingMidnight(date: Date = new Date()): number {
  const beijingTimeStr = date.toLocaleString("en-US", { timeZone: "Asia/Shanghai" });
  const beijingDate = new Date(beijingTimeStr);
  const nextMidnight = new Date(beijingDate);
  nextMidnight.setDate(nextMidnight.getDate() + 1);
  nextMidnight.setHours(0, 0, 0, 0);
  const diffMs = nextMidnight.getTime() - beijingDate.getTime();
  return Math.max(60 * 1000, Math.min(24 * 60 * 60 * 1000, diffMs));
}

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function getGuestIdentifierKey(request: Request): { key: string; guestTokenToSet?: string } {
  const beijingDate = getBeijingDateString();
  const cookies = request.headers.get("cookie");
  let guestToken = parseCookie(cookies, GUEST_COOKIE_NAME);
  let guestTokenToSet: string | undefined = undefined;

  if (!guestToken || guestToken.length < 16) {
    guestToken = randomUUID();
    guestTokenToSet = guestToken;
  }

  const ipHash = clientKey(request);
  // 结合北京时间日期、设备Token与客户端IP哈希生成每日唯一配额标识
  const rawKey = `chat:guest:daily:${beijingDate}:${guestToken}:${ipHash}`;
  const hashedId = createHash("sha256").update(rawKey).digest("hex");
  return { key: hashedId, guestTokenToSet };
}

async function getUsedCount(id: string): Promise<number> {
  let db = null;
  try {
    db = getDbPool();
  } catch {}

  if (!db) {
    const mem = memoryQuotaStore.get(id);
    if (!mem || mem.expiresAt <= Date.now()) return 0;
    return mem.used;
  }
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT used, expires_at <= NOW(3) AS expired FROM request_quotas WHERE id = ?",
      [id]
    );
    if (!rows || rows.length === 0 || rows[0].expired) {
      return 0;
    }
    return Number(rows[0].used);
  } catch {
    const mem = memoryQuotaStore.get(id);
    if (!mem || mem.expiresAt <= Date.now()) return 0;
    return mem.used;
  }
}

async function consumeQuota(id: string, limit: number, windowMs: number): Promise<{ success: boolean; used: number }> {
  let db = null;
  try {
    db = getDbPool();
  } catch {}

  if (!db) {
    const now = Date.now();
    const record = memoryQuotaStore.get(id);
    if (!record || record.expiresAt <= now) {
      memoryQuotaStore.set(id, { used: 1, expiresAt: now + windowMs });
      return { success: true, used: 1 };
    }
    if (record.used >= limit) {
      return { success: false, used: record.used };
    }
    record.used += 1;
    return { success: true, used: record.used };
  }

  let connection = null;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    await connection.execute(
      "INSERT IGNORE INTO request_quotas (id, used, expires_at) VALUES (?, 0, DATE_ADD(NOW(3), INTERVAL ? MICROSECOND))",
      [id, windowMs * 1000]
    );
    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT used, expires_at <= NOW(3) AS expired FROM request_quotas WHERE id = ? FOR UPDATE",
      [id]
    );
    const count = rows[0]?.expired ? 0 : Number(rows[0]?.used || 0);
    if (count >= limit) {
      await connection.rollback();
      return { success: false, used: count };
    }
    const newCount = count + 1;
    await connection.execute(
      "UPDATE request_quotas SET used = ?, expires_at = IF(expires_at <= NOW(3), DATE_ADD(NOW(3), INTERVAL ? MICROSECOND), expires_at) WHERE id = ?",
      [newCount, windowMs * 1000, id]
    );
    await connection.commit();
    return { success: true, used: newCount };
  } catch {
    if (connection) {
      try { await connection.rollback(); } catch {}
    }
    // 降级回退到内存
    const now = Date.now();
    const record = memoryQuotaStore.get(id);
    if (!record || record.expiresAt <= now) {
      memoryQuotaStore.set(id, { used: 1, expiresAt: now + windowMs });
      return { success: true, used: 1 };
    }
    if (record.used >= limit) {
      return { success: false, used: record.used };
    }
    record.used += 1;
    return { success: true, used: record.used };
  } finally {
    if (connection) {
      try { connection.release(); } catch {}
    }
  }
}

export type ChatQuotaStatus = {
  authenticated: boolean;
  unlimited: boolean;
  total: number;
  used?: number;
  remaining: number;
  resetTime: string;
  guestTokenToSet?: string;
};

/**
 * 查询当前客户端（访客或登录用户）的提问额度状态
 */
export async function getChatQuotaStatus(request: Request): Promise<ChatQuotaStatus> {
  const token = sessionToken(request);
  const userId = await verifySession(token);

  if (userId) {
    return {
      authenticated: true,
      unlimited: true,
      total: GUEST_CHAT_DAILY_LIMIT,
      remaining: Infinity,
      resetTime: "北京时间 00:00:00",
    };
  }

  const { key, guestTokenToSet } = getGuestIdentifierKey(request);
  const used = await getUsedCount(key);
  const remaining = Math.max(0, GUEST_CHAT_DAILY_LIMIT - used);

  return {
    authenticated: false,
    unlimited: false,
    total: GUEST_CHAT_DAILY_LIMIT,
    used,
    remaining,
    resetTime: "北京时间 00:00:00",
    guestTokenToSet,
  };
}

export type ConsumeChatQuotaResult = {
  allowed: boolean;
  authenticated: boolean;
  unlimited?: boolean;
  requireLogin?: boolean;
  total?: number;
  used?: number;
  remaining?: number;
  resetTime?: string;
  guestTokenToSet?: string;
  message?: string;
};

/**
 * 校验并扣减当前客户端提问额度
 * 1. 登录用户经过有效验证：直接放行
 * 2. 游客按每日 10 次限制（北京时间 0 点重置）：超出则要求登录
 */
export async function consumeChatQuota(request: Request): Promise<ConsumeChatQuotaResult> {
  const token = sessionToken(request);
  const userId = await verifySession(token);

  // 1. 必须是有效登录用户才免除游客限额
  if (userId) {
    return {
      allowed: true,
      authenticated: true,
      unlimited: true,
      remaining: Infinity,
      total: GUEST_CHAT_DAILY_LIMIT,
    };
  }

  // 2. 游客每日配额扣减
  const { key, guestTokenToSet } = getGuestIdentifierKey(request);
  const ttlMs = getMsUntilNextBeijingMidnight();

  const { success, used } = await consumeQuota(key, GUEST_CHAT_DAILY_LIMIT, ttlMs);
  const remaining = Math.max(0, GUEST_CHAT_DAILY_LIMIT - used);

  if (!success) {
    return {
      allowed: false,
      authenticated: false,
      requireLogin: true,
      total: GUEST_CHAT_DAILY_LIMIT,
      used,
      remaining: 0,
      resetTime: "北京时间 00:00:00",
      guestTokenToSet,
      message: "今日游客免费提问额度（10次）已用尽，北京时间次日0点自动重置。请登录账号后继续使用！",
    };
  }

  return {
    allowed: true,
    authenticated: false,
    total: GUEST_CHAT_DAILY_LIMIT,
    used,
    remaining,
    resetTime: "北京时间 00:00:00",
    guestTokenToSet,
  };
}
