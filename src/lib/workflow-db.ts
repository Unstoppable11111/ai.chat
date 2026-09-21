import { executeQuery, executeWrite } from "./db";
import type { WorkflowProject } from "@/types/workflow";

interface WorkflowProjectRow {
  id: string;
  user_id: string;
  title: string;
  cover_url: string;
  prompt: string;
  genre: string;
  style: string;
  config: unknown;
  bible: unknown;
  chapters: unknown;
  pitch: unknown;
  visual_assets: unknown;
  created_at: Date;
  updated_at: Date;
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

let isTableEnsured = false;

/**
 * 确保 workflow_projects 表结构存在，若不存在则自愈建表
 */
async function ensureWorkflowTable(): Promise<void> {
  if (isTableEnsured) return;
  try {
    const ddl = `
      CREATE TABLE IF NOT EXISTS workflow_projects (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        cover_url TEXT,
        prompt TEXT,
        genre VARCHAR(64),
        style VARCHAR(64),
        config JSON,
        bible JSON,
        chapters JSON,
        pitch JSON,
        visual_assets JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_updated_at (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await executeWrite(ddl);
    isTableEnsured = true;
  } catch (err) {
    console.warn("[workflow-db] ensureWorkflowTable warning:", err);
  }
}

/**
 * 获取指定登录用户的所有小说项目
 */
export async function listUserProjects(userId: string): Promise<WorkflowProject[]> {
  try {
    await ensureWorkflowTable();
    const rows = await executeQuery<WorkflowProjectRow>(
      "SELECT * FROM workflow_projects WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100",
      [userId]
    );

    if (!rows || !Array.isArray(rows)) return [];

    return rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      cover_url: r.cover_url || "",
      prompt: r.prompt || "",
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      config: parseJsonField(r.config, { prompt: r.prompt, genre: r.genre, style: r.style }),
      bible: parseJsonField(r.bible, {
        title: r.title,
        logline: "",
        worldview: "",
        characters: [],
        foreshadowing: [],
        outlines: [],
      }),
      chapters: parseJsonField(r.chapters, []),
      pitch: parseJsonField(r.pitch, {
        title: r.title,
        logline: "",
        target_audience: "",
        benchmarks: "",
        selling_points: [],
        retention_hooks: [],
        character_highlights: "",
        synopsis: "",
      }),
      visual_assets: parseJsonField(r.visual_assets, []),
    }));
  } catch (error) {
    console.error("[workflow-db] listUserProjects error:", error);
    return [];
  }
}

/**
 * 保存或更新用户小说项目
 */
export async function saveUserProject(
  userId: string,
  project: WorkflowProject
): Promise<boolean> {
  try {
    await ensureWorkflowTable();
    const sql = `
      INSERT INTO workflow_projects (
        id, user_id, title, cover_url, prompt, genre, style,
        config, bible, chapters, pitch, visual_assets, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        cover_url = VALUES(cover_url),
        prompt = VALUES(prompt),
        genre = VALUES(genre),
        style = VALUES(style),
        config = VALUES(config),
        bible = VALUES(bible),
        chapters = VALUES(chapters),
        pitch = VALUES(pitch),
        visual_assets = VALUES(visual_assets),
        updated_at = NOW()
    `;

    await executeWrite(sql, [
      project.id,
      userId,
      project.title || "未命名故事",
      project.cover_url || "",
      project.prompt || "",
      project.config?.genre || "都市异能",
      project.config?.style || "快节奏爽感",
      JSON.stringify(project.config || {}),
      JSON.stringify(project.bible || {}),
      JSON.stringify(project.chapters || []),
      JSON.stringify(project.pitch || {}),
      JSON.stringify(project.visual_assets || []),
    ]);

    return true;
  } catch (error) {
    console.error("[workflow-db] saveUserProject error:", error);
    return false;
  }
}

/**
 * 删除用户指定小说项目
 */
export async function deleteUserProject(userId: string, projectId: string): Promise<boolean> {
  try {
    await ensureWorkflowTable();
    await executeWrite(
      "DELETE FROM workflow_projects WHERE id = ? AND user_id = ?",
      [projectId, userId]
    );
    return true;
  } catch (error) {
    console.error("[workflow-db] deleteUserProject error:", error);
    return false;
  }
}
