import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

// 自动加载 .env.local 或 .env
function loadEnv() {
  const candidates = [".env.local", ".env"];
  for (const filename of candidates) {
    const fullPath = path.join(process.cwd(), filename);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).replace(/^["']|["']$/g, "").trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

async function main() {
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_DATABASE || "ai_studio";

  console.log(`[Migration] 正在连接 MySQL (${host}:${port}/${database}, user=${user})...`);

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
  });

  try {
    console.log("[Migration] 正在检查 studio_users 表结构...");
    const [cols] = await connection.query("SHOW COLUMNS FROM studio_users");
    const colNames = cols.map((c) => c.Field);
    console.log("[Migration] 当前表字段列表:", colNames.join(", "));

    if (!colNames.includes("is_admin")) {
      console.log("[Migration] 正在执行: ALTER TABLE studio_users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0;");
      await connection.query("ALTER TABLE studio_users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0");
      console.log("✅ 字段 is_admin 添加成功！");
    } else {
      console.log("ℹ️ 字段 is_admin 已存在，跳过添加。");
    }

    if (!colNames.includes("isadmin")) {
      console.log("[Migration] 正在执行: ALTER TABLE studio_users ADD COLUMN isadmin BOOLEAN NOT NULL DEFAULT 0;");
      await connection.query("ALTER TABLE studio_users ADD COLUMN isadmin BOOLEAN NOT NULL DEFAULT 0");
      console.log("✅ 字段 isadmin 添加成功！");
    } else {
      console.log("ℹ️ 字段 isadmin 已存在，跳过添加。");
    }

    console.log("[Migration] 正在赋予 chen 账户超级管理员权限 (is_admin=1, isadmin=1)...");
    const [updateRes] = await connection.query(
      "UPDATE studio_users SET is_admin = 1, isadmin = 1 WHERE email = 'chen' OR email LIKE 'chen@%' OR email LIKE '%chen%'"
    );
    console.log(`✅ 赋权完毕，受影响行数: ${updateRes.affectedRows}`);

    const [users] = await connection.query(
      "SELECT id, email, is_admin, isadmin FROM studio_users WHERE email LIKE '%chen%' OR is_admin = 1"
    );
    console.log("[Migration] 当前超级管理员账户信息:");
    console.table(users);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.warn("⚠️ 数据库字段自愈检查已跳过（若为离线构建环境可忽略）:", err.message);
  process.exit(0);
});
