const fields = new Set(['title', 'cover_url', 'prompt', 'config', 'bible', 'chapters', 'pitch', 'visual_assets']);
const configFields = new Set(['prompt', 'genre', 'style', 'chapterCount', 'targetWordCount', 'deAiLevel', 'customSystemPrompt', 'model', 'baseUrl', 'coverMetadata']);
const metadataFields = new Set(['provider', 'model', 'prompt', 'kind', 'size', 'aspectRatio', 'requestedSize', 'requestedAspectRatio', 'width', 'height']);

export class WorkflowProjectError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}

export function validProjectId(id) { return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(id); }

export function cleanProjectConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return {};
  const clean = Object.fromEntries(Object.entries(config).filter(([key, value]) => configFields.has(key) && value !== undefined));
  if ('coverMetadata' in clean) {
    clean.coverMetadata = isRecord(clean.coverMetadata) ? Object.fromEntries(Object.entries(clean.coverMetadata).filter(([key, value]) => metadataFields.has(key) && (typeof value === 'string' || typeof value === 'number'))) : {};
  }
  return clean;
}

function isRecord(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function checkText(value, max) {
  if (typeof value !== 'string' || value.length > max) throw new WorkflowProjectError('INVALID_PROJECT');
}

export function cleanProjectPatch(input) {
  if (!isRecord(input) || input.isSummary === true) throw new WorkflowProjectError('INCOMPLETE_PROJECT');
  const patch = Object.fromEntries(Object.entries(input).filter(([key, value]) => fields.has(key) && value !== undefined));
  if ('title' in patch) { checkText(patch.title, 255); if (!patch.title.trim()) throw new WorkflowProjectError('INVALID_PROJECT'); }
  if ('prompt' in patch) checkText(patch.prompt, 65535);
  if ('cover_url' in patch) checkText(patch.cover_url, 2_000_000);
  if ('config' in patch) {
    if (!isRecord(patch.config)) throw new WorkflowProjectError('INVALID_PROJECT');
    patch.config = cleanProjectConfig(patch.config);
    for (const [key, value] of Object.entries(patch.config)) {
      if (key === 'coverMetadata') {
        if (JSON.stringify(value).length > 65535) throw new WorkflowProjectError('INVALID_PROJECT');
      } else if (key === 'chapterCount' || key === 'targetWordCount') {
        if (!Number.isInteger(value) || value < 1 || value > 20000) throw new WorkflowProjectError('INVALID_PROJECT');
      } else checkText(value, key === 'prompt' || key === 'customSystemPrompt' ? 65535 : 2048);
    }
  }
  for (const field of ['bible', 'pitch']) {
    if (field in patch && patch[field] !== null && !isRecord(patch[field])) throw new WorkflowProjectError('INVALID_PROJECT');
  }
  if ('chapters' in patch) {
    if (!Array.isArray(patch.chapters) || patch.chapters.length > 100) throw new WorkflowProjectError('INVALID_PROJECT');
    const numbers = new Set();
    for (const chapter of patch.chapters) {
      if (!isRecord(chapter) || !Number.isInteger(chapter.chapter_number) || chapter.chapter_number < 1 || numbers.has(chapter.chapter_number)) throw new WorkflowProjectError('INVALID_PROJECT');
      numbers.add(chapter.chapter_number);
      checkText(chapter.title, 255);
      checkText(chapter.raw_content || '', 200000);
      checkText(chapter.polished_content || '', 200000);
      checkText(chapter.summary || '', 20000);
      if (chapter.video_prompts && (!Array.isArray(chapter.video_prompts) || chapter.video_prompts.length > 100)) throw new WorkflowProjectError('INVALID_PROJECT');
    }
  }
  if ('visual_assets' in patch) {
    if (!Array.isArray(patch.visual_assets) || patch.visual_assets.length > 500) throw new WorkflowProjectError('INVALID_PROJECT');
    for (const asset of patch.visual_assets) {
      if (!isRecord(asset) || !['character', 'scene'].includes(asset.type)) throw new WorkflowProjectError('INVALID_PROJECT');
      checkText(asset.id, 128); checkText(asset.title, 255); checkText(asset.image_url, 2_000_000);
    }
  }
  return patch;
}

export function mergeProjectPatch(project, patch) {
  const clean = cleanProjectPatch(patch);
  return { ...project, ...clean, config: { ...cleanProjectConfig(project.config), ...(clean.config || {}) } };
}

export function projectWordCount(chapters = []) {
  return chapters.reduce((total, chapter) => total + (chapter.polished_content || chapter.raw_content || '').length, 0);
}
