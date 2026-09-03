import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

let pool: mysql.Pool | null = null;
let hasWarnedDb = false;

// 本地开发离线降级存储文件
const LOCAL_STATS_FILE = path.join(process.cwd(), "src", "data", "local-post-stats.json");

export function getLocalStats(): Record<string, { views: number; likes: number }> {
  try {
    if (fs.existsSync(LOCAL_STATS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_STATS_FILE, "utf8"));
    }
  } catch {
    // 容错
  }
  return {};
}

export function saveLocalStats(stats: Record<string, { views: number; likes: number }>) {
  try {
    const dir = path.dirname(LOCAL_STATS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STATS_FILE, JSON.stringify(stats, null, 2), "utf8");
  } catch {
    // 容错
  }
}

export function getDbPool(): mysql.Pool | null {
  if (!process.env.DB_HOST || !process.env.DB_USER) {
    return null;
  }

  if (!pool) {
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST || "127.0.0.1",
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_DATABASE || "ai_studio",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: "utf8mb4",
        connectTimeout: 2000,
      });
    } catch {
      pool = null;
    }
  }

  return pool;
}

export async function executeQuery<T = unknown>(
  sql: string,
  values: (string | number | boolean | null | undefined | Date | Buffer)[] = []
): Promise<T[] | null> {
  const currentPool = getDbPool();
  if (!currentPool) {
    return null;
  }

  try {
    const [results] = await currentPool.execute(sql, values as any);
    return results as T[];
  } catch (error: any) {
    if (!hasWarnedDb) {
      console.warn("[Database Notice]: 远程/本地 MySQL 未直连，系统已自动启用本地极速状态存储。");
      hasWarnedDb = true;
    }
    return null;
  }
}