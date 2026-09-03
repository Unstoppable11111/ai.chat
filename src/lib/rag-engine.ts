import { executeQuery } from "./db";
import { getBuildLogs, getBuildLogBySlug } from "./content";

export interface KnowledgeChunk {
  id?: number;
  postSlug: string;
  title: string;
  sectionHeading: string;
  content: string;
}

export interface RagSearchResult {
  chunk: KnowledgeChunk;
  score: number;
  sourceUrl: string;
}

/**
 * 确保知识库分块表存在
 */
export async function ensureKnowledgeTableExists(): Promise<void> {
  const sql = `
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
  `;
  await executeQuery(sql).catch(() => {});
}

/**
 * 从数据库中高精度检索与用户提问最相关的知识块
 */
export async function searchKnowledgeBase(query: string, limit = 3): Promise<RagSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const cleanQuery = query.trim().slice(0, 100);

  // 1. 优先尝试从 MySQL 数据库检索
  try {
    const keywords = cleanQuery
      .split(/[\s,，.。？?！!、]+/)
      .filter((k) => k.length >= 2)
      .slice(0, 5);

    if (keywords.length > 0) {
      const conditions = keywords.map(() => "(title LIKE ? OR section_heading LIKE ? OR content LIKE ?)").join(" OR ");
      const params: string[] = [];
      keywords.forEach((k) => {
        const pattern = `%${k}%`;
        params.push(pattern, pattern, pattern);
      });

      const sql = `
        SELECT id, post_slug as postSlug, title, section_heading as sectionHeading, content
        FROM knowledge_chunks
        WHERE ${conditions}
        LIMIT 10
      `;

      const rows = await executeQuery<KnowledgeChunk>(sql, params);

      if (rows && rows.length > 0) {
        const scored = rows.map((row) => {
          let score = 0;
          const fullText = `${row.title} ${row.sectionHeading} ${row.content}`.toLowerCase();
          keywords.forEach((k) => {
            const kl = k.toLowerCase();
            if (row.title.toLowerCase().includes(kl)) score += 5;
            if (row.sectionHeading.toLowerCase().includes(kl)) score += 4;
            const matches = (fullText.match(new RegExp(kl, "g")) || []).length;
            score += Math.min(matches, 5);
          });

          return {
            chunk: row,
            score,
            sourceUrl: `/build-log/${row.postSlug}`,
          };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limit);
      }
    }
  } catch (error) {
    console.warn("[RAG Engine Warning]: 数据库检索异常，已自动降级为本地长文知识检索:", error);
  }

  // 2. 离线/本地开发降级：直接在本地 12 篇万字长文内容中进行内存检索
  try {
    const localLogs = getBuildLogs();
    const candidates: RagSearchResult[] = [];
    const lowerQuery = cleanQuery.toLowerCase();

    for (const log of localLogs) {
      const fullEntry = getBuildLogBySlug(log.slug);
      if (!fullEntry || !fullEntry.content) continue;

      const sections = fullEntry.content.split(/\n(?=##\s+)/);
      for (const section of sections) {
        const headingMatch = section.match(/^##\s+(.+)$/m);
        const heading = headingMatch ? headingMatch[1].trim() : "核心技术解析";
        const body = section.replace(/^##\s+.+$/m, "").trim();

        const fullText = `${log.title} ${heading} ${body}`.toLowerCase();
        if (fullText.includes(lowerQuery) || lowerQuery.split("").some((c) => fullText.includes(c))) {
          let score = 0;
          if (log.title.toLowerCase().includes(lowerQuery)) score += 10;
          if (heading.toLowerCase().includes(lowerQuery)) score += 8;
          if (body.toLowerCase().includes(lowerQuery)) score += 5;

          if (score > 0) {
            candidates.push({
              chunk: {
                postSlug: log.slug,
                title: log.title,
                sectionHeading: heading,
                content: body.slice(0, 800),
              },
              score,
              sourceUrl: `/build-log/${log.slug}`,
            });
          }
        }
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, limit);
  } catch {
    return [];
  }
}