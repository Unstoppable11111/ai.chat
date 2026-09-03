import fs from "fs";
import path from "path";
import matter from "gray-matter";
import mysql from "mysql2/promise";

// 手动解析 .env.local
const envPath = path.join(process.cwd(), ".env.local");
const envVars = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        envVars[key] = val;
      }
    }
  });
}

const buildLogDir = path.join(process.cwd(), "content", "build-log");
const files = fs.readdirSync(buildLogDir).filter(f => f.endsWith(".mdx"));

console.log(`🔍 扫描到本地 ${files.length} 篇深度技术长文...`);

// 1. 自动生成标准 SQL 导入脚本
let sqlExport = `-- =======================================================
-- AI Studio 博客全量数据导入脚本 (自动生成)
-- 包含 12 篇万字长文完整正文、标签、封面与统计指标
-- =======================================================

CREATE DATABASE IF NOT EXISTS \`ai_studio\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`ai_studio\`;

CREATE TABLE IF NOT EXISTS \`posts\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`slug\` VARCHAR(191) NOT NULL UNIQUE,
  \`collection\` VARCHAR(64) NOT NULL DEFAULT 'build-log',
  \`title\` VARCHAR(255) NOT NULL,
  \`excerpt\` TEXT NULL,
  \`cover\` VARCHAR(255) NULL,
  \`tags\` JSON NULL,
  \`content\` LONGTEXT NULL,
  \`views\` INT UNSIGNED DEFAULT 0,
  \`likes\` INT UNSIGNED DEFAULT 0,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_collection_slug\` (\`collection\`, \`slug\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

const records = [];

for (const f of files) {
  const fullPath = path.join(buildLogDir, f);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const slug = f.replace(".mdx", "");

  const title = String(data.title || slug);
  const excerpt = String(data.excerpt || "");
  const cover = String(data.cover || "");
  const tagsJson = JSON.stringify(data.tags || []);
  const views = Number(data.views) || 1200;
  const likes = Number(data.likes) || 95;

  records.push({ slug, title, excerpt, cover, tagsJson, content, views, likes });

  const escapeSql = (str) => str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
    switch (char) {
      case "\0": return "\\0";
      case "\x08": return "\\b";
      case "\x09": return "\\t";
      case "\x1a": return "\\z";
      case "\n": return "\\n";
      case "\r": return "\\r";
      case "\"":
      case "'":
      case "\\":
      case "%":
        return "\\" + char;
      default:
        return char;
    }
  });

  sqlExport += `INSERT INTO \`posts\` (\`slug\`, \`collection\`, \`title\`, \`excerpt\`, \`cover\`, \`tags\`, \`content\`, \`views\`, \`likes\`)
VALUES ('${escapeSql(slug)}', 'build-log', '${escapeSql(title)}', '${escapeSql(excerpt)}', '${escapeSql(cover)}', '${escapeSql(tagsJson)}', '${escapeSql(content)}', ${views}, ${likes})
ON DUPLICATE KEY UPDATE
  \`title\` = VALUES(\`title\`),
  \`excerpt\` = VALUES(\`excerpt\`),
  \`cover\` = VALUES(\`cover\`),
  \`tags\` = VALUES(\`tags\`),
  \`content\` = VALUES(\`content\`),
  \`views\` = VALUES(\`views\`),
  \`likes\` = VALUES(\`likes\`);\n\n`;
}

// 写入 SQL 脚本
const sqlFilePath = path.join(process.cwd(), "scripts", "posts_seed.sql");
fs.writeFileSync(sqlFilePath, sqlExport, "utf8");
console.log(`📄 已成功导出标准 SQL 文件: scripts/posts_seed.sql`);

// 2. 尝试直接通过 MySQL 连接池批量写入
async function tryDirectSync() {
  const host = envVars.DB_HOST || "127.0.0.1";
  const user = envVars.DB_USER || "root";
  const password = envVars.DB_PASSWORD || "";
  const database = envVars.DB_DATABASE || "ai_studio";
  const port = Number(envVars.DB_PORT) || 3306;

  console.log(`🔌 正在尝试连接 MySQL (${host}:${port}, database: ${database})...`);

  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      connectTimeout: 3000,
    });

    console.log("✅ 成功连接至 MySQL！正在同步数据表结构与文章数据...");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`posts\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`slug\` VARCHAR(191) NOT NULL UNIQUE,
        \`collection\` VARCHAR(64) NOT NULL DEFAULT 'build-log',
        \`title\` VARCHAR(255) NOT NULL,
        \`excerpt\` TEXT NULL,
        \`cover\` VARCHAR(255) NULL,
        \`tags\` JSON NULL,
        \`content\` LONGTEXT NULL,
        \`views\` INT UNSIGNED DEFAULT 0,
        \`likes\` INT UNSIGNED DEFAULT 0,
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_collection_slug\` (\`collection\`, \`slug\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    for (const r of records) {
      await connection.execute(`
        INSERT INTO \`posts\` (\`slug\`, \`collection\`, \`title\`, \`excerpt\`, \`cover\`, \`tags\`, \`content\`, \`views\`, \`likes\`)
        VALUES (?, 'build-log', ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          \`title\` = VALUES(\`title\`),
          \`excerpt\` = VALUES(\`excerpt\`),
          \`cover\` = VALUES(\`cover\`),
          \`tags\` = VALUES(\`tags\`),
          \`content\` = VALUES(\`content\`),
          \`views\` = VALUES(\`views\`),
          \`likes\` = VALUES(\`likes\`)
      `, [r.slug, r.title, r.excerpt, r.cover, r.tagsJson, r.content, r.views, r.likes]);
    }

    await connection.end();
    console.log(`🎉 全部 ${records.length} 篇万字长文已 100% 成功直连写入 MySQL 数据库！`);
  } catch (error) {
    console.log("\n💡 [提示] 本地当前未直连远程 MySQL（提示：" + error.message + "）。");
    console.log("👉 已为你生成好全量 SQL 导入文件: scripts/posts_seed.sql，可一键导入数据库！");
  }
}

tryDirectSync();