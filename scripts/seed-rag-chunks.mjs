import fs from "fs";
import path from "path";
import matter from "gray-matter";
import mysql from "mysql2/promise";

// 1. 读取环境配置
const envCandidates = [".env", ".env.production", ".env.local"];
const fileEnvVars = {};

for (const envName of envCandidates) {
  const envPath = path.join(process.cwd(), envName);
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, "utf8");
      content.split("\n").forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const idx = trimmed.indexOf("=");
          if (idx > 0) {
            const key = trimmed.slice(0, idx).trim();
            let val = trimmed.slice(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            fileEnvVars[key] = val;
          }
        }
      });
    } catch {
      // 容错
    }
  }
}

const cliPassword = process.argv[2];
const host = process.env.DB_HOST || fileEnvVars.DB_HOST || "127.0.0.1";
const port = Number(process.env.DB_PORT || fileEnvVars.DB_PORT) || 3306;
const user = process.env.DB_USER || fileEnvVars.DB_USER || "root";
const database = process.env.DB_DATABASE || fileEnvVars.DB_DATABASE || "ai_studio";
let password = cliPassword || process.env.DB_PASSWORD || fileEnvVars.DB_PASSWORD || "";

const buildLogDir = path.join(process.cwd(), "content", "build-log");
const files = fs.readdirSync(buildLogDir).filter(f => f.endswith ? f.endswith(".mdx") : f.endsWith(".mdx"));

console.log(`📚 正在解析 ${files.length} 篇万字长文，开始构建 RAG 结构化知识切片...`);

const chunks = [];

for (const file of files) {
  const slug = file.replace(".mdx", "");
  const fullPath = path.join(buildLogDir, file);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const postTitle = data.title || slug;

  // 按照二级标题分割章节
  const rawSections = content.split(/\n(?=##\s+)/);
  for (const rawSec of rawSections) {
    const headingMatch = rawSec.match(/^##\s+(.+)$/m);
    const heading = headingMatch ? headingMatch[1].trim() : "核心技术概览";
    const body = rawSec.replace(/^##\s+.+$/m, "").trim();

    if (body.length > 50) {
      chunks.push({
        postSlug: slug,
        title: postTitle,
        sectionHeading: heading,
        content: body.slice(0, 1500) // 保持语义高密度块
      });
    }
  }
}

console.log(`✂️ 成功切分出 ${chunks.length} 个高密度 RAG 知识块！`);

// 2. 导出到 SQL 文件
let chunkSql = `\n-- =======================================================
-- RAG 知识分块表与全量数据 (自动生成)
-- =======================================================

CREATE TABLE IF NOT EXISTS \`knowledge_chunks\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`post_slug\` VARCHAR(191) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`section_heading\` VARCHAR(255) NOT NULL,
  \`content\` TEXT NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_post_slug\` (\`post_slug\`),
  INDEX \`idx_section_heading\` (\`section_heading\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

TRUNCATE TABLE \`knowledge_chunks\`;

`;

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

for (const c of chunks) {
  chunkSql += `INSERT INTO \`knowledge_chunks\` (\`post_slug\`, \`title\`, \`section_heading\`, \`content\`)
VALUES ('${escapeSql(c.postSlug)}', '${escapeSql(c.title)}', '${escapeSql(c.sectionHeading)}', '${escapeSql(c.content)}');\n`;
}

const sqlFilePath = path.join(process.cwd(), "scripts", "rag_chunks.sql");
fs.writeFileSync(sqlFilePath, chunkSql, "utf8");
console.log(`📄 已导出标准 RAG SQL 文件: scripts/rag_chunks.sql`);

// 3. 尝试直连数据库同步
async function syncToDb() {
  console.log(`🔌 尝试连接 MySQL (${host}:${port}, database: ${database})...`);
  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      connectTimeout: 3000,
    });

    console.log("✅ 成功连接 MySQL！正在同步 knowledge_chunks 表...");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`knowledge_chunks\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`post_slug\` VARCHAR(191) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`section_heading\` VARCHAR(255) NOT NULL,
        \`content\` TEXT NOT NULL,
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_post_slug\` (\`post_slug\`),
        INDEX \`idx_section_heading\` (\`section_heading\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 清理旧切片并批量插入最新切片
    await connection.execute("TRUNCATE TABLE `knowledge_chunks`");

    for (const c of chunks) {
      await connection.execute(
        "INSERT INTO `knowledge_chunks` (`post_slug`, `title`, `section_heading`, `content`) VALUES (?, ?, ?, ?)",
        [c.postSlug, c.title, c.sectionHeading, c.content]
      );
    }

    await connection.end();
    console.log(`🎉 恭喜！全部 ${chunks.length} 个 RAG 知识块已成功写入 MySQL 数据库！`);
  } catch (err) {
    console.log("💡 [提示] 本地未直连远程 MySQL：" + err.message);
    console.log("👉 你可以直接在服务器上运行 npm run rag:index，或使用 scripts/rag_chunks.sql 一键导入！");
  }
}

syncToDb();