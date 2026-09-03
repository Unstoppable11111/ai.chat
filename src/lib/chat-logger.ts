import { executeQuery } from "./db";

export interface ChatLogPayload {
  sessionId?: string;
  model: string;
  userQuery: string;
  assistantReply: string;
  ragSources?: any[] | string[];
  ipAddress?: string;
  userAgent?: string;
  durationMs?: number;
}

let hasEnsuredTable = false;

async function ensureChatLogTable() {
  if (hasEnsuredTable) return;
  const createSql = `
    CREATE TABLE IF NOT EXISTS \`ai_chat_logs\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`session_id\` VARCHAR(64) NOT NULL,
      \`model\` VARCHAR(64) NOT NULL,
      \`user_query\` TEXT NOT NULL,
      \`assistant_reply\` LONGTEXT NOT NULL,
      \`rag_sources\` JSON NULL,
      \`ip_address\` VARCHAR(45) NULL,
      \`user_agent\` VARCHAR(255) NULL,
      \`duration_ms\` INT UNSIGNED DEFAULT 0,
      \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX \`idx_session_id\` (\`session_id\`),
      INDEX \`idx_created_at\` (\`created_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  try {
    await executeQuery(createSql);
    hasEnsuredTable = true;
  } catch {
    // 容错
  }
}

export async function logChatMessageAsync(payload: ChatLogPayload): Promise<void> {
  try {
    await ensureChatLogTable();

    const {
      sessionId = "anonymous-session",
      model,
      userQuery,
      assistantReply,
      ragSources = [],
      ipAddress = "127.0.0.1",
      userAgent = "",
      durationMs = 0,
    } = payload;

    const sql = `
      INSERT INTO ai_chat_logs 
      (session_id, model, user_query, assistant_reply, rag_sources, ip_address, user_agent, duration_ms) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      sessionId.slice(0, 64),
      model.slice(0, 64),
      userQuery,
      assistantReply,
      JSON.stringify(ragSources),
      ipAddress.slice(0, 45),
      userAgent.slice(0, 255),
      durationMs,
    ];

    await executeQuery(sql, values);
  } catch (err) {
    console.warn("[ChatLogger Notice]: 对话日志持久化跳过 (数据库未就绪):", err);
  }
}
