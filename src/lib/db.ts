import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool | null {
  if (!process.env.DB_HOST || !process.env.DB_USER) {
    return null;
  }

  if (!pool) {
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
    });
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
  } catch (error) {
    console.error("[Database Error]:", error);
    return null;
  }
}
