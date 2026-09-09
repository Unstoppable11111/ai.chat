import nextEnv from "@next/env";
import mysql from "mysql2/promise";
nextEnv.loadEnvConfig(process.cwd());
export async function connectDatabase() {
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_DATABASE) throw new Error("DB_HOST, DB_USER and DB_DATABASE are required");
  return mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD || "", database: process.env.DB_DATABASE, charset: "utf8mb4", connectTimeout: 5000 });
}
export async function migrateDatabase(db) {
  const statements = [
    "CREATE TABLE IF NOT EXISTS request_quotas (id CHAR(64) PRIMARY KEY,used INT UNSIGNED NOT NULL,expires_at DATETIME(3) NOT NULL,INDEX(expires_at)) ENGINE=InnoDB",
    "CREATE TABLE IF NOT EXISTS user_research_reports (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id VARCHAR(64) NOT NULL,report_type VARCHAR(16) NOT NULL,report_date DATE NOT NULL,payload JSON NOT NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,report_type,report_date)) ENGINE=InnoDB",
    "CREATE TABLE IF NOT EXISTS studio_users (id VARCHAR(64) PRIMARY KEY,email VARCHAR(254) NOT NULL UNIQUE,password_hash VARCHAR(200) NOT NULL,disabled BOOLEAN NOT NULL DEFAULT 0,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB",
    "CREATE TABLE IF NOT EXISTS studio_sessions (token_hash CHAR(64) PRIMARY KEY,user_id VARCHAR(64) NOT NULL,expires_at DATETIME NOT NULL,INDEX(expires_at),FOREIGN KEY(user_id) REFERENCES studio_users(id) ON DELETE CASCADE) ENGINE=InnoDB",
    "CREATE TABLE IF NOT EXISTS user_chat_histories (user_id VARCHAR(64) PRIMARY KEY,history JSON NOT NULL,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES studio_users(id) ON DELETE CASCADE) ENGINE=InnoDB",
    "CREATE TABLE IF NOT EXISTS user_portfolios (id INT AUTO_INCREMENT PRIMARY KEY,user_id VARCHAR(64) NOT NULL,stock_code VARCHAR(16) NOT NULL,stock_name VARCHAR(64) NOT NULL,quantity INT NOT NULL,cost_price DECIMAL(16,3) NOT NULL,hold_type VARCHAR(32) NOT NULL,notes TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX(user_id)) ENGINE=InnoDB",
    "CREATE TABLE IF NOT EXISTS arena_snapshots (user_id VARCHAR(64) PRIMARY KEY,snapshot JSON NOT NULL,last_run_key VARCHAR(100),updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES studio_users(id) ON DELETE CASCADE) ENGINE=InnoDB",
    "CREATE TABLE IF NOT EXISTS arena_requests (user_id VARCHAR(64) NOT NULL,request_key VARCHAR(64) NOT NULL,PRIMARY KEY(user_id,request_key),FOREIGN KEY(user_id) REFERENCES studio_users(id) ON DELETE CASCADE) ENGINE=InnoDB",
    "CREATE TABLE IF NOT EXISTS posts (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,slug VARCHAR(191) NOT NULL UNIQUE,collection VARCHAR(64) NOT NULL,title VARCHAR(255) NOT NULL,excerpt TEXT,cover VARCHAR(1024),tags JSON,content LONGTEXT,views INT UNSIGNED NOT NULL DEFAULT 0,likes INT UNSIGNED NOT NULL DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
  ];
  for (const sql of statements) await db.execute(sql);
  const [columns] = await db.query("SHOW COLUMNS FROM posts");
  if (columns.find(column => column.Field === "tags")?.Type !== "json") {
    await db.execute("UPDATE posts SET tags=JSON_ARRAY(tags) WHERE tags IS NOT NULL AND NOT JSON_VALID(tags)");
    await db.query("ALTER TABLE posts MODIFY COLUMN tags JSON NULL");
  }
  if (columns.find(column => column.Field === "cover")?.Type !== "varchar(1024)") await db.query("ALTER TABLE posts MODIFY COLUMN cover VARCHAR(1024) NULL");
  const postIdType = columns.find(column => column.Field === "id")?.Type;
  if (!/^(?:bigint|int)(?:\(\d+\))?(?: unsigned)?$/i.test(postIdType || "")) throw new Error("Unsupported posts.id type");
  await db.query(`CREATE TABLE IF NOT EXISTS knowledge_chunks_v2 (chunk_id VARCHAR(255) PRIMARY KEY,post_id ${postIdType} NOT NULL,content_hash CHAR(64) NOT NULL,metadata JSON NOT NULL,content LONGTEXT NOT NULL,INDEX(post_id),FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS post_reactions (post_id ${postIdType} NOT NULL,visitor_hash CHAR(64) NOT NULL,liked BOOLEAN NOT NULL DEFAULT 0,viewed_at DATETIME,PRIMARY KEY(post_id,visitor_hash),FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE) ENGINE=InnoDB`);
  for (const [name, type] of Object.entries({ metadata: "JSON NULL", status: "VARCHAR(20) NOT NULL DEFAULT 'published'", rag_ready: "BOOLEAN NOT NULL DEFAULT 0", featured: "BOOLEAN NOT NULL DEFAULT 0", published_at: "DATETIME NULL" })) {
    if (!columns.some(column => column.Field === name)) await db.query(`ALTER TABLE posts ADD COLUMN ${name} ${type}`);
  }
  await db.execute("UPDATE posts SET published_at=created_at WHERE published_at IS NULL");
}
export async function persistPost(db, post) {
  await db.execute("INSERT INTO posts (slug,collection,title,excerpt,cover,tags,content,status,rag_ready,featured,published_at,updated_at,metadata) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE collection=VALUES(collection),title=VALUES(title),excerpt=VALUES(excerpt),cover=VALUES(cover),tags=VALUES(tags),content=VALUES(content),status=VALUES(status),rag_ready=VALUES(rag_ready),featured=VALUES(featured),published_at=VALUES(published_at),updated_at=VALUES(updated_at),metadata=VALUES(metadata)", [post.slug,post.collection,post.title,post.excerpt,post.cover,JSON.stringify(post.tags),post.content,post.status,post.ragReady,post.featured,post.publishedAt ? new Date(post.publishedAt) : null,post.updatedAt ? new Date(post.updatedAt) : new Date(),JSON.stringify(post.metadata)]);
}
