/**
 * 自动化小说 & AI 视频分镜工业化工作流类型定义
 */

export interface CharacterCard {
  name: string;
  role: string;
  personality: string;
  motivation: string;
  visual_traits?: string;
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

export interface WorkflowResult {
  id: string;
  createdAt: string;
  prompt: string;
  bible: BibleData;
  chapters: ChapterData[];
  pitch: PitchNoteData;
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

export interface WorkflowConfig {
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
