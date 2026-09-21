/**
 * 自动化小说 & AI 视频分镜工业化工作流类型定义
 */

export interface CharacterCard {
  name: string;
  role: string;
  personality: string;
  motivation: string;
  appearance?: string;
  visual_traits?: string;
  portrait_url?: string;
}

export interface ForeshadowingItem {
  clue: string;
  target_chapter: number | string;
  revelation: string;
}

export interface ChapterOutline {
  chapter_number: number;
  title: string;
  goal: string;
  conflict: string;
  hook: string;
}

export interface BibleData {
  title: string;
  logline: string;
  worldview: string;
  characters: CharacterCard[];
  foreshadowing: ForeshadowingItem[];
  outlines: ChapterOutline[];
}

/**
 * AI 视频生成提示词规范（严格遵循任务 3 规范）
 */
export interface VideoPromptItem {
  scene_title: string; // 场景标题（如：第一章高潮 - 发现孕检单特写）
  shot_type: string; // 镜头景别与运镜（如：特写缓缓拉远，Slow Dolly-Out，4K，24fps）
  visual_description: string; // 详细中文画面描述（主体、动作、服装纹理、微表情、环境光影、雨滴/烟雾等物理细节）
  ai_prompt_en: string; // 适配可灵 (Kling) / Runway Gen-3 / Midjourney 的高精度英文提示词
  audio_cue: string; // 氛围音效与台词建议（如：心跳急促声逐渐放大，背景雷声微响）
}

export interface ChapterData {
  chapter_number: number;
  title: string;
  summary: string;
  raw_content: string;
  polished_content: string;
  video_prompts: VideoPromptItem[];
}

export interface PitchNoteData {
  title: string;
  logline: string;
  target_audience: string;
  benchmarks: string;
  selling_points: string[];
  retention_hooks: string[];
  character_highlights: string;
  synopsis: string;
}

export interface VisualAssetItem {
  id: string;
  type: "character" | "scene";
  title: string;
  subtitle?: string;
  description: string;
  image_url: string;
  created_at: string;
}

export interface WorkflowResult {
  id: string;
  createdAt: string;
  prompt: string;
  cover_url?: string;
  bible: BibleData;
  chapters: ChapterData[];
  pitch: PitchNoteData;
  visual_assets?: VisualAssetItem[];
}

export interface WorkflowConfig {
  projectId?: string;
  prompt: string;
  genre?: string;
  style?: string;
  chapterCount?: number;
  targetWordCount?: number;
  deAiLevel?: "light" | "medium" | "aggressive";
  customSystemPrompt?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

/**
 * 完整小说工程对象（用于多小说书架与各小说专属参数绑定）
 */
export interface WorkflowProject {
  id: string;
  user_id?: string;
  title: string;
  cover_url: string;
  createdAt: string;
  updatedAt: string;
  prompt: string;
  config: WorkflowConfig; // 专属绑定的创作参数与上下文约束
  bible: BibleData;
  chapters: ChapterData[];
  pitch: PitchNoteData;
  visual_assets?: VisualAssetItem[];
}

export type WorkflowStepId =
  | "step_1_bible"
  | "step_2_chapters"
  | "step_3_video_prompts"
  | "step_4_polish"
  | "step_5_pitch";

export interface WorkflowSSEEvent {
  type: "STEP_START" | "CHUNK" | "STEP_COMPLETE" | "ALL_COMPLETE" | "ERROR";
  step: string;
  label?: string;
  text?: string;
  data?: unknown;
  result?: WorkflowResult;
  error?: string;
}

/**
 * 单章按提示词调优请求参数
 */
export interface ChapterTuneRequest {
  bookTitle: string;
  worldview: string;
  characterCards?: CharacterCard[];
  chapterOutline?: ChapterOutline;
  chapterNumber: number;
  chapterTitle: string;
  currentContent: string;
  userInstruction: string;
  style?: string;
  deAiLevel?: "light" | "medium" | "aggressive";
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}
