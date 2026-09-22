export function publicWorkflowConfig(config) {
  const { apiKey, imageApiKey, resumeBible, resumeChapters, ...publicConfig } = config || {};
  void apiKey;
  void imageApiKey;
  void resumeBible;
  void resumeChapters;
  return publicConfig;
}

export function projectSummary(project) {
  return {
    id: project.id,
    title: project.title,
    cover_url: project.cover_url?.startsWith("data:") ? "" : project.cover_url,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    prompt: (project.prompt || "").slice(0, 200),
    config: { prompt: "", genre: project.config?.genre, style: project.config?.style },
    chapters: [],
    chapterCount: project.chapterCount ?? project.chapters?.length ?? 0,
    wordCount: project.isSummary ? project.wordCount : project.wordCount ?? (project.chapters || []).reduce((total, chapter) => total + (chapter.polished_content || chapter.raw_content || "").length, 0),
    revision: project.revision,
    isSummary: true,
  };
}

export function mergeProjectPatch(project, patch) {
  if (project.isSummary) throw new Error("正文尚未加载，无法保存，请重新打开此小说。");
  return { ...project, ...patch, ...(patch.chapters ? {
    chapterCount: patch.chapters.length,
    wordCount: patch.chapters.reduce((total, chapter) => total + (chapter.polished_content || chapter.raw_content || "").length, 0),
  } : {}), id: project.id, revision: project.revision, updatedAt: new Date().toISOString() };
}

export function remainingDraft(current, saved) {
  return Object.fromEntries(Object.entries(current).filter(([key, value]) => !Object.is(value, saved[key])));
}

export function mergeInitialProjectSummaries(current, incoming) {
  const byId = new Map(current.map((project) => [project.id, project]));
  const incomingIds = new Set(incoming.map((project) => project.id));
  return [
    ...incoming.map((summary) => {
      const existing = byId.get(summary.id);
      return existing && !existing.isSummary ? existing : summary;
    }),
    ...current.filter((project) => !project.isSummary && !incomingIds.has(project.id)),
  ];
}

export function canResumeWorkflow(project) {
  if (!project.bible) return false;
  const chapters = project.chapters || [];
  const required = project.bible.outlines?.length || project.config?.chapterCount || 3;
  return chapters.length < required
    || chapters.some((chapter) => !chapter.raw_content?.trim() || !chapter.polished_content?.trim() || !chapter.video_prompts?.length)
    || !project.pitch?.synopsis?.trim()
    || !project.cover_url
    || /^data:image\/svg\+xml/i.test(project.cover_url)
    || /\.svg(?:[?#]|$)/i.test(project.cover_url);
}
