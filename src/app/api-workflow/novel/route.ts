import { NextRequest } from "next/server";
import type {
  BibleData,
  ChapterData,
  PitchNoteData,
  VideoPromptItem,
  WorkflowConfig,
  WorkflowResult,
  WorkflowSSEEvent,
} from "@/types/workflow";

// 强制动态路由
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 支持长耗时处理

import {
  resolveValidBaseUrl,
  generateFallbackSvgCover,
  buildCinematicCoverPrompt,
  callGeminiImageGeneration,
  buildFluxImageUrl,
  probeImageUrl,
} from "@/lib/workflow-utils.mjs";
import {
  reportImageSuccess,
} from "@/lib/workflow-cooldown.mjs";
import {
  requestOwner,
  detectPromptInjection,
  checkWorkflowRateLimit,
} from "@/lib/server-security";
import { countUserDailyNovels, verifyProjectOwnership } from "@/lib/workflow-db";
import { isSuperAdmin } from "@/lib/auth-db";

const encoder = new TextEncoder();

/**
 * 根据全书大纲与核心冲突生成电影级商业海报封面 (统一接入站长 gemini-3-pro-image 模型)
 */
async function generateNovelCoverImage(options: {
  title: string;
  genre: string;
  style?: string;
  worldview?: string;
  protagonist?: string;
  mainScene?: string;
  coreConflict?: string;
  customPrompt?: string;
  baseUrl: string;
  apiKey: string;
  isAdmin?: boolean;
}): Promise<string> {
  const protagonistDesc = options.protagonist || "沉着内敛的逆光探索者";
  const sceneDesc = options.mainScene || "破晓都市与深邃光影交织的核心场景";

  // 基于全书大纲、世界观与核心冲突提炼出版级小说封面 Prompt
  const defaultPrompt = buildCinematicCoverPrompt({
    title: options.title,
    genre: options.genre,
    style: options.style || "电影质感",
    worldview: options.worldview || "",
    protagonist: protagonistDesc,
    mainScene: sceneDesc,
    coreConflict: options.coreConflict || "",
  });

  const cinematicPrompt =
    options.customPrompt && options.customPrompt.trim().length > 30
      ? options.customPrompt.trim()
      : defaultPrompt;

  // 1. 统一优先调用本地 4981 官方 gemini-3-pro-image 服务 (免密直连、自动重试与落盘)
  const effectiveApiKey = options.apiKey?.trim() || process.env.IMAGE_API_KEY || process.env.OPENAI_API_KEY || "";
  const effectiveBaseUrl =
    process.env.IMAGE_API_BASE_URL ||
    (options.baseUrl && options.baseUrl !== "https://api.openai.com/v1" && options.baseUrl !== process.env.OPENAI_BASE_URL ? options.baseUrl : "") ||
    "http://127.0.0.1:4981/openai/v1";

  try {
    const coverUrl = await callGeminiImageGeneration({
      prompt: cinematicPrompt,
      apiKey: effectiveApiKey,
      baseUrl: effectiveBaseUrl,
      model: "gemini-3-pro-image",
      size: "1024x1024",
      timeoutMs: 45000,
      prefix: "novel",
    });

    if (coverUrl) {
      reportImageSuccess();
      return coverUrl;
    }
  } catch (err: unknown) {
    console.warn("[NovelCover] 官方生图通道未成功，自动启用安全保底方案:", err);
  }

  // 2. 只有当官方 4981 经重试后完全无法出图时，才尝试免费高精位图，但必须经 6 秒探测通过才返回，杜绝假死
  try {
    const fluxCover = buildFluxImageUrl(cinematicPrompt, { width: 768, height: 1024 });
    const probe = await probeImageUrl(fluxCover, 6000);
    if (probe.ok) {
      return fluxCover;
    }
  } catch {
    // 忽略异常并进入本地零时延矢量封面保底
  }

  // 3. 极端网络异常本地保底（毫秒级响应，永不卡死）
  return generateFallbackSvgCover(
    options.title,
    options.genre,
    protagonistDesc,
    sceneDesc
  );
}

function cleanJsonString(str: string): string {
  return str
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/g, "")
    .replace(/,\s*([}\]])/g, "$1") // 去除常见的 JSON 悬挂尾部逗号
    .trim();
}

/**
 * 强化级安全解析 JSON，支持尾部逗号自愈、括号自动补全与杂质截断恢复
 */
function extractJson<T>(raw: string, fallback: T): T {
  const cleaned = cleanJsonString(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const sliced = cleanJsonString(cleaned.slice(firstBrace, lastBrace + 1));
        return JSON.parse(sliced) as T;
      } catch {
        // 尝试自动补齐未闭合的括号
        try {
          let fixed = cleaned.slice(firstBrace);
          const openCount = (fixed.match(/\{/g) || []).length;
          const closeCount = (fixed.match(/\}/g) || []).length;
          if (openCount > closeCount) {
            fixed = fixed + "}".repeat(openCount - closeCount);
          }
          return JSON.parse(cleanJsonString(fixed)) as T;
        } catch {}
      }
    }
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        const sliced = cleanJsonString(cleaned.slice(firstBracket, lastBracket + 1));
        return JSON.parse(sliced) as T;
      } catch {}
    }
    return fallback;
  }
}

/**
 * 带有指数退避的 OpenAI 规范兼容 LLM 调用函数
 */
async function callLLMStream(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: {
    baseUrl: string;
    apiKey: string;
    model: string;
    signal?: AbortSignal;
    temperature?: number;
    maxTokens?: number;
  },
  onChunk: (text: string) => void,
  maxRetries = 3
): Promise<string> {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < maxRetries) {
    if (options.signal?.aborted) {
      throw new Error("Client aborted");
    }

    try {
      const url = `${options.baseUrl.replace(/\/+$/, "")}/chat/completions`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${options.apiKey}`,
        },
        body: JSON.stringify({
          model: options.model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 3500,
          stream: true,
        }),
        signal: options.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`LLM upstream error ${res.status}: ${errText.slice(0, 300)}`);
      }

      if (!res.body) throw new Error("Empty body from LLM upstream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        if (options.signal?.aborted) {
          await reader.cancel().catch(() => {});
          throw new Error("Client aborted");
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;
          if (trimmed === "data: [DONE]") continue;
          if (trimmed.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              const delta = data.choices?.[0]?.delta?.content || "";
              if (delta) {
                accumulated += delta;
                onChunk(delta);
              }
            } catch {
              // 忽略单行解析错误
            }
          }
        }
      }

      if (accumulated.trim().length > 0) {
        return accumulated;
      }
      throw new Error("Received empty stream content");
    } catch (err: unknown) {
      lastError = err;
      const isAbort =
        options.signal?.aborted ||
        (err instanceof Error && (err.name === "AbortError" || err.message === "Client aborted"));
      if (isAbort) {
        throw err;
      }
      attempt++;
      if (attempt < maxRetries) {
        // 指数退避重试 (500ms, 1000ms, 2000ms)
        await new Promise((resolve) => setTimeout(resolve, attempt * 600));
      }
    }
  }

  throw lastError || new Error("Failed to call LLM after retries");
}

export async function POST(request: NextRequest) {
  let body: WorkflowConfig;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "无效的请求格式" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return new Response(JSON.stringify({ error: "故事灵感或核心设定不能为空" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 1. 服务端强制 Session 登录鉴权 (绝不信任前端状态，严防黑客绕过鉴权白嫖站长 Key)
  const userId = await requestOwner(request);
  if (!userId) {
    return new Response(
      JSON.stringify({
        error: "未登录或登录会话已失效，请先登录账户后再使用工业化小说创作功能。",
        code: "UNAUTHORIZED",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. 提示词注入与越狱对抗检测 (Anti-Prompt Injection Guard)
  const checkPrompt = detectPromptInjection(prompt);
  if (!checkPrompt.isSafe) {
    return new Response(
      JSON.stringify({
        error: `故事灵感包含疑似越狱或攻击指令（${checkPrompt.reason}），系统已安全拦截。请专注于小说与文学剧情创作。`,
        code: "PROMPT_INJECTION_DETECTED",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const checkGenre = detectPromptInjection(body.genre);
  const checkStyle = detectPromptInjection(body.style);
  const checkSys = detectPromptInjection(body.customSystemPrompt);
  if (!checkGenre.isSafe || !checkStyle.isSafe || !checkSys.isSafe) {
    return new Response(
      JSON.stringify({
        error: "小说设定或流派参数中包含违规越狱模式，系统已拒绝执行。",
        code: "PROMPT_INJECTION_DETECTED",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. 服务端多维滑动窗口高频请求拦截 (Anti-Spam / Rate Limiting)
  const rateLimitRes = await checkWorkflowRateLimit(request, userId, "novel");
  if (!rateLimitRes.allowed) {
    return new Response(
      JSON.stringify({
        error: rateLimitRes.message || "请求过于频繁，请稍候再试。",
        code: "RATE_LIMITED",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. 每个账户每天限额 2 本小说判定 (Daily Quota: 2 Books/Day)
  // 如果不是针对当前用户已存在的小说进行重新微调，则属于新创建小说
  // 超级管理员特权：完全免除每日配额限制，支持无限次创作
  const isAdmin = await isSuperAdmin(userId);
  const dailyNovelCount = await countUserDailyNovels(userId);
  const isExistingBook = body.projectId
    ? await verifyProjectOwnership(userId, body.projectId)
    : false;

  if (!isAdmin && !isExistingBook && dailyNovelCount >= 2) {
    return new Response(
      JSON.stringify({
        error: "您今日的小说创作额度已达上限（每个账户每日限 2 本小说的全案生产与资产制作），请明日再来体验。",
        code: "DAILY_QUOTA_EXCEEDED",
        dailyCount: dailyNovelCount,
        limit: 2,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // 判断是否为用户自定义的第三方 API Key
  const isCustomKey = Boolean(body.apiKey && body.apiKey.trim().length > 0);

  let apiKey = "";
  let baseUrl = "";
  let model = "";

  if (isCustomKey) {
    // 1. 用户填入了第三方自定义 Key
    apiKey = body.apiKey!.trim();
    baseUrl = body.baseUrl ? resolveValidBaseUrl(body.baseUrl) : "https://api.openai.com/v1";
    model = body.model?.trim() || "gpt-4o-mini";
  } else {
    // 2. 默认使用站长内置的 AI 对话高速通道（与 /api-chat-backend 保持 100% 一致）
    apiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || "";
    baseUrl = resolveValidBaseUrl(process.env.OPENAI_BASE_URL) || "https://api.openai.com/v1";
    // 默认模型必须使用站长对话配置的 gemini 模型，严防调用站长通道中未配置的 deepseek-chat 渠道
    model =
      process.env.UPSTREAM_BALANCED_MODEL ||
      process.env.UPSTREAM_SPEED_MODEL ||
      "gemini-3.7-flash";
  }

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "未配置 API Key。请在控制台设置抽屉中填写您的第三方 API Key，或联系管理员检查服务端 OPENAI_API_KEY。",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const genre = body.genre || "都市异能";
  const style = body.style || "快节奏爽文与极简电影质感";
  const targetChapterCount = Math.max(1, Math.min(5, Number(body.chapterCount) || 3));
  const deAiLevel = body.deAiLevel || "medium";
  const customSystemPrompt = body.customSystemPrompt || "";

  // 创建 SSE 流式响应
  const abortController = new AbortController();
  request.signal.addEventListener("abort", () => {
    abortController.abort();
  });

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: WorkflowSSEEvent) => {
        try {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // stream可能已关闭
        }
      };

      const sendPing = () => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          // 忽略
        }
      };

      const llmOptions = {
        baseUrl,
        apiKey,
        model,
        signal: abortController.signal,
      };

      try {
        // ==========================================
        // Step 1: Bible 生成（世界观、人物卡、伏笔、细纲）
        // ==========================================
        // Step 1: Bible 生成（世界观、人物卡、伏笔、细纲）
        // ==========================================
        let bible: BibleData;

        if (body.resumeBible && body.resumeBible.outlines && body.resumeBible.outlines.length > 0) {
          // 断点续写模式：复用已有 Bible，无需重复生成
          bible = body.resumeBible;
          sendEvent({
            type: "STEP_START",
            step: "step_1_bible",
            label: `[断点恢复] 复用设定集: 《${bible.title}》`,
          });
          sendEvent({
            type: "STEP_COMPLETE",
            step: "step_1_bible",
            data: { bible },
          });
        } else {
          sendEvent({
            type: "STEP_START",
            step: "step_1_bible",
            label: "构建世界观与人物细纲 (Bible)",
          });

          const bibleSystemPrompt = `你是一位顶级小说总架构师兼文学策划。
请根据作者的故事灵感，构建结构严谨、人物饱满的小说设定集 (Bible)。
${customSystemPrompt ? `特别规则：${customSystemPrompt}\n` : ""}
必须输出严格的 JSON 格式，不含任何额外说明文字：
{
  "title": "作品震撼书名（4-10字，凝练且富有吸引力）",
  "logline": "一句话核心梗概（30字以内）",
  "worldview": "世界观与底层规则体系（150-250字）",
  "characters": [
    {
      "name": "主角姓名",
      "role": "主角/主要反派/关键配角",
      "personality": "性格核心特质",
      "motivation": "核心欲望与执念",
      "visual_traits": "标志性外貌特征"
    }
  ],
  "foreshadowing": [
    {
      "clue": "伏笔细节或神秘信物",
      "target_chapter": 2,
      "revelation": "戏剧性转折揭晓"
    }
  ],
  "outlines": [
    {
      "chapter_number": 1,
      "title": "章节标题",
      "goal": "本章主角核心目标",
      "conflict": "阻碍目标的直接危机与敌对力量",
      "hook": "章末悬念钩子"
    }
  ]
}
注意：outlines 数组必须严格包含 ${targetChapterCount} 个章节大纲，层层递进。`;

          const bibleRaw = await callLLMStream(
            [
              { role: "system", content: bibleSystemPrompt },
              {
                role: "user",
                content: `【创作需求】\n题材赛道：${genre}\n语言风格：${style}\n章节数：${targetChapterCount} 章\n核心故事灵感：\n${prompt}`,
              },
            ],
            llmOptions,
            (chunk) => {
              sendEvent({ type: "CHUNK", step: "step_1_bible", text: chunk });
            }
          );

          // 智能提取或推导真实书名，杜绝盲目 fallback 到“未命名故事”
          let inferredTitle = "";
          const rawTitleMatch = bibleRaw.match(/"title"\s*:\s*"([^"\r\n]+)"/);
          if (rawTitleMatch && rawTitleMatch[1]?.trim() && !rawTitleMatch[1].includes("未命名")) {
            inferredTitle = rawTitleMatch[1].trim();
          } else {
            const cleanP = prompt.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, " ").trim();
            const firstSnippet = cleanP.split(/\s+/)[0]?.slice(0, 10);
            inferredTitle = firstSnippet ? `《${firstSnippet}》` : "天灾探索者";
          }

          const defaultBible: BibleData = {
            title: inferredTitle,
            logline: prompt.slice(0, 30),
            worldview: "这是一个充满未知的世界。",
            characters: [
              {
                name: "主角",
                role: "主角",
                personality: "沉着冷静",
                motivation: "探寻真相",
                visual_traits: "黑衣冷眸",
              },
            ],
            foreshadowing: [
              { clue: "破碎的信物", target_chapter: 2, revelation: "揭开背叛" },
            ],
            outlines: Array.from({ length: targetChapterCount }).map((_, i) => ({
              chapter_number: i + 1,
              title: `第 ${i + 1} 章`,
              goal: "推进探索",
              conflict: "遭遇危机",
              hook: "更大的谜团",
            })),
          };

          bible = extractJson<BibleData>(bibleRaw, defaultBible);
          if (!bible.title || bible.title === "未命名故事" || bible.title.trim().length === 0) {
            bible.title = inferredTitle;
          }
          if (!bible.outlines || bible.outlines.length === 0) {
            bible.outlines = defaultBible.outlines;
          }

          sendEvent({
            type: "STEP_COMPLETE",
            step: "step_1_bible",
            data: { bible },
          });
        }

        sendPing();

        // ==========================================
        // Step 2: 逐章正文撰写与流式打字输出 (共 ${bible.outlines.length} 章)
        // ==========================================
        sendEvent({
          type: "STEP_START",
          step: "step_2_chapters",
          label: `逐章生成连贯小说正文 (共 ${bible.outlines.length} 章)`,
        });

        const chapters: ChapterData[] =
          body.resumeChapters && body.resumeChapters.length > 0
            ? [...body.resumeChapters]
            : [];
        let rollingSummary = "故事开端，主角入局。";
        let lastChapterTail = "";

        if (chapters.length > 0) {
          const lastCh = chapters[chapters.length - 1];
          lastChapterTail = (lastCh.raw_content || lastCh.polished_content || "").slice(-300);
          rollingSummary = chapters.map((c) => `- 第${c.chapter_number}章: ${c.summary || c.title}`).join("\n");
        }

        const startIdx = chapters.length;

        for (let i = startIdx; i < bible.outlines.length; i++) {
          const outline = bible.outlines[i];
          const chapterNumber = outline.chapter_number || i + 1;
          const chapterStep = `chapter_${chapterNumber}`;

          sendEvent({
            type: "STEP_START",
            step: chapterStep,
            label: `正在撰写第 ${chapterNumber} 章：${outline.title}`,
          });

          const chapterPrompt = `【全局大纲设定】
书名：${bible.title}
世界观要点：${bible.worldview}
主要人物：${bible.characters.map((c) => `${c.name}(${c.role}，${c.personality})`).join("、")}

【前文事实滚动摘要】
${rollingSummary}

【上一章末尾衔接】
${lastChapterTail ? lastChapterTail : "（本章为全书开篇，无需衔接上一章）"}

【本章目标与钩子】
章节序号：第 ${chapterNumber} 章
章节标题：${outline.title}
主角本章目标：${outline.goal}
核心冲突对抗：${outline.conflict}
章末断章悬念(Hook)：${outline.hook}

请遵循写作风格：${style}。
立即输出第 ${chapterNumber} 章的正文内容，字数 1000~1500 字，情节跌宕起伏，画面生动，对白鲜活自然，代入感强。直接输出正文，不要输出任何多余的引言或问候。`;

          const chapterText = await callLLMStream(
            [
              {
                role: "system",
                content:
                  "你是一位白金级小说创作者，擅长极具沉浸感的情节推进和视听化写作。",
              },
              { role: "user", content: chapterPrompt },
            ],
            llmOptions,
            (chunk) => {
              sendEvent({ type: "CHUNK", step: chapterStep, text: chunk });
            }
          );

          // 更新上一章结尾和滚动摘要
          lastChapterTail = chapterText.slice(-300);

          // 简短提取事实摘要
          let newSummaryAddition = `第${chapterNumber}章中，${outline.title}爆发，达成：${outline.goal}。`;
          try {
            const summaryRes = await callLLMStream(
              [
                {
                  role: "system",
                  content:
                    "用一句话（60字以内）提炼本章发生的不可逆核心事实，供后续章节保持逻辑一致性。",
                },
                { role: "user", content: chapterText.slice(0, 1500) },
              ],
              { ...llmOptions, maxTokens: 150 },
              () => {}
            );
            if (summaryRes.trim()) {
              newSummaryAddition = summaryRes.trim();
            }
          } catch {
            // 忽略小摘要生成失败
          }
          rollingSummary += `\n- ${newSummaryAddition}`;

          chapters.push({
            chapter_number: chapterNumber,
            title: outline.title,
            summary: newSummaryAddition,
            raw_content: chapterText,
            polished_content: "",
            video_prompts: [],
          });

          sendEvent({
            type: "STEP_COMPLETE",
            step: chapterStep,
            data: {
              chapter_number: chapterNumber,
              title: outline.title,
              content: chapterText,
            },
          });

          sendPing();
        }

        sendEvent({
          type: "STEP_COMPLETE",
          step: "step_2_chapters",
          data: { chapters },
        });

        // ==========================================
        // Step 3: AI 视频分镜提示词（只生成分镜提示词）
        // ==========================================
        sendEvent({
          type: "STEP_START",
          step: "step_3_video_prompts",
          label: "提炼电影级 AI 视频分镜提示词 (Kling / Runway Gen-3 / Midjourney)",
        });

        for (let i = 0; i < chapters.length; i++) {
          const ch = chapters[i];
          const chStep = `video_ch_${ch.chapter_number}`;

          sendEvent({
            type: "STEP_START",
            step: chStep,
            label: `生成第 ${ch.chapter_number} 章关键视觉镜头提示词`,
          });

          const videoPromptRequest = `请深度剖析以下章节小说正文，提炼出 3~4 个最具视觉冲击力、情绪高潮的电影级 AI 视频镜头提示词。
注意：仅输出分镜提示词结构，不需要生成视频文件。必须严格输出标准的 JSON 数组格式（不含任何其他解释性文字）：
[
  {
    "scene_title": "场景标题（如：第${ch.chapter_number}章高潮 - 发现孕检单特写）",
    "shot_type": "镜头景别与运镜（如：特写缓缓拉远，Slow Dolly-Out，4K，24fps）",
    "visual_description": "详细中文画面描述（主体、动作、服装纹理、微表情、环境光影、雨滴/烟雾等物理细节）",
    "ai_prompt_en": "适配可灵 (Kling) / Runway Gen-3 / Midjourney 的高精度英文提示词（必须包含 Cinematic lighting, hyper-realistic, 8k, photorealistic, Unreal Engine 5 render, volumetric lighting 等参数）",
    "audio_cue": "氛围音效与台词建议（如：心跳急促声逐渐放大，背景雷声微响）"
  }
]

【章节正文】：
${ch.raw_content}`;

          const videoRaw = await callLLMStream(
            [
              {
                role: "system",
                content:
                  "你是一位获得好莱坞赞誉的电影摄影指导兼顶级 AI 视频提示词专家，精通 Kling、Runway Gen-3 和 Midjourney 提示词工程。",
              },
              { role: "user", content: videoPromptRequest },
            ],
            llmOptions,
            (chunk) => {
              sendEvent({ type: "CHUNK", step: chStep, text: chunk });
            }
          );

          const defaultPrompts: VideoPromptItem[] = [
            {
              scene_title: `第 ${ch.chapter_number} 章高潮镜头`,
              shot_type: "特写缓缓拉远，Slow Dolly-Out，4K，24fps",
              visual_description:
                "主角眼神凌厉，雨滴从发梢滑落，背景是霓虹倒影的潮湿街道，侧光勾勒出面部轮廓。",
              ai_prompt_en:
                "Cinematic medium close-up, dramatic side lighting, rain drops falling on hair, sharp eye contact, wet city streets with neon reflections, hyper-realistic, 8k resolution, photorealistic, 24fps, Unreal Engine 5 render.",
              audio_cue: "急促心跳声逐渐放大，伴随低沉的风暴雷声。",
            },
          ];

          const prompts = extractJson<VideoPromptItem[]>(videoRaw, defaultPrompts);
          ch.video_prompts = Array.isArray(prompts) && prompts.length > 0 ? prompts : defaultPrompts;

          sendEvent({
            type: "STEP_COMPLETE",
            step: chStep,
            data: {
              chapter_number: ch.chapter_number,
              video_prompts: ch.video_prompts,
            },
          });

          sendPing();
        }

        sendEvent({
          type: "STEP_COMPLETE",
          step: "step_3_video_prompts",
          data: { chapters },
        });

        // ==========================================
        // Step 4: 去 AI 味精修（短句化与对白重塑）
        // ==========================================
        sendEvent({
          type: "STEP_START",
          step: "step_4_polish",
          label: "去 AI 味深度精修（去除空洞套话，短句化重构）",
        });

        for (let i = 0; i < chapters.length; i++) {
          const ch = chapters[i];
          const polishStep = `polish_ch_${ch.chapter_number}`;

          sendEvent({
            type: "STEP_START",
            step: polishStep,
            label: `精修第 ${ch.chapter_number} 章正文`,
          });

          const polishPrompt = `请对以下小说章节进行精修正文，提升文学表现力与阅读沉浸感：
精修要点：
1. 减少陈词滥调与空洞套话，叙事更加生动自然、画面感强烈；
2. 强化环境细节描写与心理、动作交互，增强读者代入感；
3. 保持对白紧凑有力，使人物性格更饱满鲜明；
4. 严格保留原有故事核心情节与高潮走向，字数相当。

【待精修章节正文】：
${ch.raw_content}

请直接输出精修后的完整正文，不要输出任何引言或额外说明。`;

          const polishedText = await callLLMStream(
            [
              {
                role: "system",
                content:
                  "你是一位资深文学小说总编辑，擅长润色提升正文文笔、场景氛围与情节感染力。",
              },
              { role: "user", content: polishPrompt },
            ],
            llmOptions,
            (chunk) => {
              sendEvent({ type: "CHUNK", step: polishStep, text: chunk });
            }
          );

          ch.polished_content = polishedText;

          sendEvent({
            type: "STEP_COMPLETE",
            step: polishStep,
            data: {
              chapter_number: ch.chapter_number,
              polished_content: polishedText,
            },
          });

          sendPing();
        }

        sendEvent({
          type: "STEP_COMPLETE",
          step: "step_4_polish",
          data: { chapters },
        });

        // ==========================================
        // Step 5: 商业投稿包装与卖点 (Pitch Note)
        // ==========================================
        sendEvent({
          type: "STEP_START",
          step: "step_5_pitch",
          label: "生成面向平台编辑与制片人的商业投稿亮点 (Pitch Note)",
        });

        const pitchPrompt = `你是一位顶级网文 IP 孵化人与影视版权经纪人。
请针对以下小说全案，提炼一份面向阅文/番茄/优爱腾等平台编辑与制片人的【商业投稿包装与卖点提案】。
必须输出标准 JSON 格式：
{
  "title": "${bible.title}",
  "logline": "${bible.logline}",
  "target_audience": "核心受众圈层画像（如：18-35岁男性，悬疑科幻/爽剧爱好者）",
  "benchmarks": "对标市面头部爆款作品（如：《庆余年》+《赛博朋克边缘行者》）",
  "selling_points": [
    "核心卖点 1：极致人设反差",
    "核心卖点 2：三章一爆点的高密度爽感",
    "核心卖点 3：天然契合短剧/AI漫剧视觉呈现"
  ],
  "retention_hooks": [
    "第1章留存卡点分析",
    "第2章付费冲动激发",
    "第3章世界观反转爆点"
  ],
  "character_highlights": "核心主角反差萌与致命吸引力剖析",
  "synopsis": "500字精华版故事梗概与高潮反转路线"
}

【参考世界观与大纲】：
${JSON.stringify(bible.outlines, null, 2)}`;

        const pitchRaw = await callLLMStream(
          [
            {
              role: "system",
              content:
                "你精通网文平台签约审核标准与商业短剧爆款逻辑，擅长撰写让编辑眼前一亮的商业提案。",
            },
            { role: "user", content: pitchPrompt },
          ],
          llmOptions,
          (chunk) => {
            sendEvent({ type: "CHUNK", step: "step_5_pitch", text: chunk });
          }
        );

        const defaultPitch: PitchNoteData = {
          title: bible.title,
          logline: bible.logline,
          target_audience: "青年网文读者、AI漫剧观众",
          benchmarks: "高概念都市爽文",
          selling_points: ["高概念强冲突", "电影级视觉画面", "强张力人设对决"],
          retention_hooks: ["开局逆境悬念", "身份反差暴露", "断崖式章节钩子"],
          character_highlights: "主角冷静狠厉，行事果断无拖泥带水",
          synopsis: bible.worldview,
        };

        const pitch = extractJson<PitchNoteData>(pitchRaw, defaultPitch);

        sendEvent({
          type: "STEP_COMPLETE",
          step: "step_5_pitch",
          data: { pitch },
        });

        // ==========================================
        // Step 6: 全书终极电影海报封面生成 (汇聚全案世界观、全章情节与美术指导提炼)
        // ==========================================
        sendEvent({
          type: "STEP_START",
          step: "cover_generation",
          label: `正在汇聚全书 ${chapters.length} 章完整情节与大纲，由美术指导 Agent 提炼并生成终极电影海报...`,
        });

        let generatedCoverUrl = "";
        let customArtPrompt = "";

        // 尝试由美术指导 Agent 专门基于全书故事提炼一段顶级英文海报 Prompt
        try {
          const firstHero = bible.characters?.[0];
          const protagonistInfo = firstHero
            ? `${firstHero.name} (${firstHero.role || "主角"}，${firstHero.personality || ""}，${firstHero.appearance || firstHero.visual_traits || "英姿挺拔，眼神如炬"})`
            : "核心主角逆光前行";
          const lastOutline = bible.outlines?.[bible.outlines.length - 1];
          const finalConflict = lastOutline?.conflict || bible.logline || "全书宿命高潮对决";
          const mainSetting = lastOutline?.title || bible.worldview.slice(0, 80);

          const artAgentSystem = `你是一位顶级小说概念美术总监兼专业视觉提示词工程专家。请根据小说全书大纲、高潮冲突与核心主角设定，为生图模型【gemini-3-pro-image】定制一段【纯英文标准小说封面视觉生图提示词】。
要求：
1. 必须以 "Generate an image of an epic novel book cover for ..." 开头；
2. 提炼出最具视觉张力的核心封面构图（主角外貌服饰、核心异能或神兵、宏大背景场景与电影光影）；
3. 契合【${genre} - ${style}】题材风貌；
4. 末尾包含高质量描述：Cinematic volumetric lighting, dramatic atmosphere, cinematic 8k masterpiece, photorealistic, no text, no watermark, no logo；
5. 纯英文输出，60-90词，精炼有力，绝对不要包含任何中文或多余废话。`;

          const artAgentRes = await callLLMStream(
            [
              { role: "system", content: artAgentSystem },
              {
                role: "user",
                content: `书名：《${bible.title}》\n题材：${genre} · ${style}\n世界观：${bible.worldview}\n主角：${protagonistInfo}\n全书最高潮：${finalConflict}\n核心场景：${mainSetting}`,
              },
            ],
            { ...llmOptions, maxTokens: 300 },
            () => {}
          );

          if (artAgentRes && artAgentRes.trim().length > 30) {
            customArtPrompt = artAgentRes
              .trim()
              .replace(/```[a-z]*\s*/gi, "")
              .replace(/```\s*$/g, "")
              .trim();
          }
        } catch {
          // 容错降级到静态规则库
        }

        const firstHero = bible.characters?.[0];
        const protagonistInfo = firstHero
          ? `${firstHero.name} (${firstHero.role || "主角"}，${firstHero.personality || ""}，${firstHero.appearance || firstHero.visual_traits || "英姿挺拔，眼神如炬"})`
          : "核心主角逆光前行";
        const lastOutline = bible.outlines?.[bible.outlines.length - 1];
        const finalConflict = lastOutline?.conflict || bible.logline || "全书宿命高潮对决";
        const mainSetting = lastOutline?.title || bible.worldview.slice(0, 80);

        generatedCoverUrl = await generateNovelCoverImage({
          title: bible.title,
          genre,
          style,
          worldview: bible.worldview,
          protagonist: protagonistInfo,
          mainScene: mainSetting,
          coreConflict: finalConflict,
          customPrompt: customArtPrompt,
          baseUrl,
          apiKey,
          isAdmin,
        });

        sendEvent({
          type: "STEP_COMPLETE",
          step: "cover_generation",
          data: { cover_url: generatedCoverUrl },
        });

        // ==========================================
        // 最终聚合与推流完毕 (此时整部小说全案完成并最终入库书架)
        // ==========================================
        const finalResult: WorkflowResult = {
          id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
          prompt,
          cover_url: generatedCoverUrl || generateFallbackSvgCover(bible.title, genre),
          bible,
          chapters,
          pitch,
        };

        sendEvent({
          type: "ALL_COMPLETE",
          step: "all_complete",
          result: finalResult,
        });

        controller.close();
      } catch (err: unknown) {
        const isAbort =
          abortController.signal.aborted ||
          (err instanceof Error && err.message === "Client aborted");
        if (isAbort) {
          try {
            controller.close();
          } catch {
            // 忽略
          }
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : "工作流执行过程中出现未知异常";
        sendEvent({
          type: "ERROR",
          step: "pipeline_error",
          error: errorMessage,
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
