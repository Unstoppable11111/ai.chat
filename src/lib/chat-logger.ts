import { executeQuery } from "./db";

export interface ChatLogPayload {
  sessionId?: string;
  model: string;
  userQuery: string;
  assistantReply: string;
  ragSources?: string[];
  ipAddress?: string;
  userAgent?: string;
  durationMs?: number;
}

export async function logChatMessageAsync(payload: ChatLogPayload): Promise<void> {
  try {
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
    console.error("[ChatLogger Error]: Failed to save chat log:", err);
  }
}
