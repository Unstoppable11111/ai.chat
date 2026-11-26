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
    "CREATE TABLE IF NOT EXISTS stock_rolling_pool (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id VARCHAR(64) NOT NULL,stock_code VARCHAR(16) NOT NULL,stock_name VARCHAR(64) NOT NULL,board VARCHAR(32) NOT NULL,sector VARCHAR(64) NOT NULL,added_date DATE NOT NULL,last_counted_date DATE NOT NULL,observed_days INT NOT NULL DEFAULT 0,max_days INT NOT NULL DEFAULT 5,entry_ref_price DECIMAL(16,3) NOT NULL,buy_low DECIMAL(16,3) NULL,buy_high DECIMAL(16,3) NULL,breakout_price DECIMAL(16,3) NULL,invalid_price DECIMAL(16,3) NULL,vol_ratio_5_20 DECIMAL(10,2) NULL,limit_up_count_1y INT NULL,moat_score DECIMAL(6,1) NULL,structure_score DECIMAL(6,1) NULL,thesis TEXT NULL,status VARCHAR(24) NOT NULL DEFAULT 'OBSERVING',triggered_signal VARCHAR(32) NULL,drop_date DATE NULL,drop_reason VARCHAR(255) NULL,exit_price DECIMAL(16,3) NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX idx_user_status(user_id,status),INDEX idx_user_added(user_id,added_date)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    "CREATE TABLE IF NOT EXISTS stock_signal_trades (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id VARCHAR(64) NOT NULL,pool_item_id BIGINT UNSIGNED NOT NULL,stock_code VARCHAR(16) NOT NULL,stock_name VARCHAR(64) NOT NULL,board VARCHAR(32) NOT NULL,sector VARCHAR(64) NOT NULL,status VARCHAR(16) NOT NULL DEFAULT 'OPEN',buy_signal VARCHAR(24) NOT NULL,buy_date DATE NOT NULL,buy_time VARCHAR(20) NOT NULL,buy_price DECIMAL(16,3) NOT NULL,buy_reason VARCHAR(255) NOT NULL,stop_loss_price DECIMAL(16,3) NULL,take_profit_1 DECIMAL(16,3) NULL,take_profit_2 DECIMAL(16,3) NULL,peak_price DECIMAL(16,3) NOT NULL,sell_signal VARCHAR(32) NULL,sell_date DATE NULL,sell_time VARCHAR(20) NULL,sell_price DECIMAL(16,3) NULL,sell_reason VARCHAR(255) NULL,hold_days INT NOT NULL DEFAULT 0,pnl_pct DECIMAL(10,2) NOT NULL DEFAULT 0.00,is_win TINYINT(1) NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,UNIQUE KEY uq_user_pool(user_id,pool_item_id),INDEX idx_user_status(user_id,status),INDEX idx_user_code(user_id,stock_code)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    "CREATE TABLE IF NOT EXISTS arena_snapshots (user_id VARCHAR(64) PRIMARY KEY,snapshot JSON NOT NULL,last_run_key VARCHAR(100),updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES studio_users(id) ON DELETE CASCADE) ENGINE=InnoDB",
    "CREATE TABLE IF NOT EXISTS arena_requests (user_id VARCHAR(64) NOT NULL,request_key VARCHAR(64) NOT NULL,PRIMARY KEY(user_id,request_key),FOREIGN KEY(user_id) REFERENCES studio_users(id) ON DELETE CASCADE) ENGINE=InnoDB",
    "CREATE TABLE IF NOT EXISTS posts (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,slug VARCHAR(191) NOT NULL UNIQUE,collection VARCHAR(64) NOT NULL,title VARCHAR(255) NOT NULL,excerpt TEXT,cover VARCHAR(1024),tags JSON,content LONGTEXT,views INT UNSIGNED NOT NULL DEFAULT 0,likes INT UNSIGNED NOT NULL DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "CREATE TABLE IF NOT EXISTS workflow_projects (id VARCHAR(64) PRIMARY KEY,user_id VARCHAR(64) NOT NULL,title VARCHAR(255) NOT NULL,cover_url LONGTEXT,prompt TEXT,genre VARCHAR(64),style VARCHAR(64),config JSON,bible JSON,chapters JSON,pitch JSON,visual_assets JSON,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX idx_user_id(user_id),FOREIGN KEY(user_id) REFERENCES studio_users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
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

  // 迁移：user_portfolios 增加波段纪律与深套修复风控字段
  const [portfolioCols] = await db.query("SHOW COLUMNS FROM user_portfolios");
  for (const [name, type] of Object.entries({
    sector: "VARCHAR(64) NULL",
    position_mode: "VARCHAR(32) NOT NULL DEFAULT 'swing_normal'",
    available_quantity: "INT NULL",
    entry_date: "VARCHAR(20) NULL",
    support_defense_price: "DECIMAL(16,3) NULL",
    rebound_watch_prices: "JSON NULL",
    peak_price_since_entry: "DECIMAL(16,3) NULL",
    take_profit_pct_1: "DECIMAL(8,2) NOT NULL DEFAULT 15.00",
    take_profit_pct_2: "DECIMAL(8,2) NOT NULL DEFAULT 25.00",
    trailing_pullback_pct: "DECIMAL(8,2) NOT NULL DEFAULT 7.00",
    stop_loss_pct: "DECIMAL(8,2) NOT NULL DEFAULT -8.00",
    suppress_cost_stoploss: "BOOLEAN NOT NULL DEFAULT 0",
    thesis: "TEXT NULL",
  })) {
    if (!portfolioCols.some(column => column.Field === name)) {
      await db.query(`ALTER TABLE user_portfolios ADD COLUMN ${name} ${type}`);
    }
  }

  // 迁移与自愈：studio_users 增加 is_admin 超级管理员字段并赋权 chen 账户
  try {
    const [userCols] = await db.query("SHOW COLUMNS FROM studio_users");
    if (!userCols.some(c => c.Field === "is_admin")) {
      await db.query("ALTER TABLE studio_users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0");
    }
    if (!userCols.some(c => c.Field === "isadmin")) {
      await db.query("ALTER TABLE studio_users ADD COLUMN isadmin BOOLEAN NOT NULL DEFAULT 0");
    }
    await db.execute("UPDATE studio_users SET is_admin = 1, isadmin = 1 WHERE email = 'chen' OR email LIKE 'chen@%' OR email LIKE '%chen%'");
  } catch (err) {
    console.warn("[migrateDatabase] studio_users is_admin check warning:", err);
  }

  // 对齐 stock_rolling_pool 排序规则，防止与 studio_users 跨表关联报 Illegal mix of collations
  try {
    await db.query("ALTER TABLE stock_rolling_pool CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
  } catch (err) {
    console.warn("[migrateDatabase] stock_rolling_pool collation align warning:", err);
  }
}
export async function persistPost(db, post) {
  await db.execute("INSERT INTO posts (slug,collection,title,excerpt,cover,tags,content,status,rag_ready,featured,published_at,updated_at,metadata) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE collection=VALUES(collection),title=VALUES(title),excerpt=VALUES(excerpt),cover=VALUES(cover),tags=VALUES(tags),content=VALUES(content),status=VALUES(status),rag_ready=VALUES(rag_ready),featured=VALUES(featured),published_at=VALUES(published_at),updated_at=VALUES(updated_at),metadata=VALUES(metadata)", [post.slug,post.collection,post.title,post.excerpt,post.cover,JSON.stringify(post.tags),post.content,post.status,post.ragReady,post.featured,post.publishedAt ? new Date(post.publishedAt) : null,post.updatedAt ? new Date(post.updatedAt) : new Date(),JSON.stringify(post.metadata)]);
}
