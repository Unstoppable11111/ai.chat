import { createHash } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { getDbPool } from './db';
import type { WorkflowProject } from '@/types/workflow';
import { cleanProjectConfig, cleanProjectPatch, mergeProjectPatch, projectWordCount, validProjectId, WorkflowProjectError } from './workflow-projects.mjs';

type StoredProject = WorkflowProject & { revision: string };

function database() {
  const db = getDbPool();
  if (!db) throw new WorkflowProjectError('STORAGE_UNAVAILABLE', 503);
  return db;
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === 'object') return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}

function fromRow(row: RowDataPacket): StoredProject {
  const project: WorkflowProject = {
    id: row.id, user_id: row.user_id, title: row.title, cover_url: row.cover_url || '', prompt: row.prompt || '',
    createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString(),
    config: cleanProjectConfig(parseJson(row.config, {})) as WorkflowProject['config'],
    bible: parseJson(row.bible, undefined), chapters: parseJson(row.chapters, []),
    pitch: parseJson(row.pitch, undefined), visual_assets: parseJson(row.visual_assets, []),
  };
  const revision = createHash('sha256').update(JSON.stringify(project)).digest('hex');
  return { ...project, revision };
}

export async function listUserProjects(userId: string, offset = 0, limit = 12) {
  const pageSize = Math.min(24, Math.max(1, Math.floor(limit)));
  const start = Math.min(10000, Math.max(0, Math.floor(offset)));
  // Body and assets are intentionally not selected for the bookshelf.
  const [rows] = await database().query<RowDataPacket[]>(
    `SELECT id, title, CASE WHEN OCTET_LENGTH(cover_url) <= 131072 THEN cover_url ELSE '' END AS cover_url,
     genre, style, created_at, updated_at, COALESCE(JSON_LENGTH(chapters), 0) AS chapter_count,
     JSON_EXTRACT(config, '$._wordCount') AS word_count
     FROM workflow_projects WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT ? OFFSET ?`,
    [userId, pageSize + 1, start],
  );
  return {
    projects: rows.slice(0, pageSize).map(row => ({
      id: row.id, title: row.title, cover_url: row.cover_url || '', prompt: '',
      createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString(),
      config: { prompt: '', genre: row.genre || '', style: row.style || '' },
      chapters: [], isSummary: true, revision: '', chapterCount: Number(row.chapter_count) || 0,
      ...(row.word_count !== null ? { wordCount: Number(row.word_count) || 0 } : {}),
    })),
    hasMore: rows.length > pageSize,
  };
}

export async function getUserProject(userId: string, projectId: string): Promise<StoredProject | null> {
  if (!validProjectId(projectId)) return null;
  const [rows] = await database().execute<RowDataPacket[]>(
    'SELECT * FROM workflow_projects WHERE id = ? AND user_id = ? LIMIT 1', [projectId, userId],
  );
  return rows[0] ? fromRow(rows[0]) : null;
}

function writeValues(project: WorkflowProject) {
  const config = { ...cleanProjectConfig(project.config), _wordCount: projectWordCount(project.chapters) };
  return [project.title || '未命名故事', project.cover_url || '', project.prompt || '',
    (project.config?.genre || '').slice(0, 64), (project.config?.style || '').slice(0, 64), JSON.stringify(config),
    JSON.stringify(project.bible || null), JSON.stringify(project.chapters || []),
    JSON.stringify(project.pitch || null), JSON.stringify(project.visual_assets || [])];
}

export async function createUserProject(userId: string, input: WorkflowProject): Promise<StoredProject> {
  if (!validProjectId(input.id)) throw new WorkflowProjectError('INVALID_PROJECT');
  const clean = cleanProjectPatch(input);
  const project = { title: '未命名故事', cover_url: '', prompt: '', config: { prompt: '' }, chapters: [], ...clean, id: input.id, createdAt: '', updatedAt: '' } as WorkflowProject;
  const connection = await database().getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(`INSERT INTO workflow_projects (id,user_id,title,cover_url,prompt,genre,style,config,bible,chapters,pitch,visual_assets)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, [project.id, userId, ...writeValues(project)]);
    const [rows] = await connection.execute<RowDataPacket[]>('SELECT * FROM workflow_projects WHERE id=? AND user_id=?', [project.id, userId]);
    await connection.commit();
    return fromRow(rows[0]);
  } catch (error) {
    await connection.rollback();
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') throw new WorkflowProjectError('PROJECT_CONFLICT', 409);
    throw error;
  } finally { connection.release(); }
}

export async function patchUserProject(userId: string, projectId: string, revision: string, input: unknown): Promise<StoredProject> {
  if (!validProjectId(projectId)) throw new WorkflowProjectError('INVALID_PROJECT');
  if (typeof revision !== 'string' || !revision) throw new WorkflowProjectError('PROJECT_CONFLICT', 409);
  const patch = cleanProjectPatch(input);
  const connection = await database().getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM workflow_projects WHERE id = ? AND user_id = ? FOR UPDATE', [projectId, userId]);
    if (!rows[0]) throw new WorkflowProjectError('PROJECT_NOT_FOUND', 404);
    const current = fromRow(rows[0]);
    if (current.revision !== revision) throw new WorkflowProjectError('PROJECT_CONFLICT', 409);
    const merged = mergeProjectPatch(current, patch) as WorkflowProject;
    await connection.execute(`UPDATE workflow_projects SET title=?,cover_url=?,prompt=?,genre=?,style=?,config=?,bible=?,chapters=?,pitch=?,visual_assets=?,updated_at=NOW()
       WHERE id=? AND user_id=?`, [...writeValues(merged), projectId, userId]);
    const [updated] = await connection.execute<RowDataPacket[]>('SELECT * FROM workflow_projects WHERE id=? AND user_id=?', [projectId, userId]);
    await connection.commit();
    return fromRow(updated[0]);
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function deleteUserProject(userId: string, projectId: string): Promise<void> {
  await database().execute('DELETE FROM workflow_projects WHERE id = ? AND user_id = ?', [projectId, userId]);
}

export async function verifyProjectOwnership(userId: string, projectId: string): Promise<boolean> {
  if (!userId || !validProjectId(projectId)) return false;
  const [rows] = await database().execute<RowDataPacket[]>('SELECT id FROM workflow_projects WHERE id=? AND user_id=? LIMIT 1', [projectId, userId]);
  return rows.length > 0;
}
