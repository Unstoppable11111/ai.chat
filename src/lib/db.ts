import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

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

  const [results] = await currentPool.execute(sql, values.map(value => value ?? null));
  return results as T[];
}

export async function executeWrite(sql: string, values: (string | number | boolean | null | Date)[] = []): Promise<mysql.ResultSetHeader> {
  const currentPool = getDbPool();
  if (!currentPool) throw new Error("Database is not configured");
  const [result] = await currentPool.execute<mysql.ResultSetHeader>(sql, values);
  return result;
}
