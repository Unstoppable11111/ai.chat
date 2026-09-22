export class WorkflowOutputError extends Error {
  constructor(message) {
    super(message);
    this.name = "WorkflowOutputError";
  }
}

export function isAbortError(error, signal) {
  return Boolean(signal?.aborted || error?.name === "AbortError");
}

export function assertCreativeText(content, options = {}) {
  const { finishReason, refusal, minimumLength = 1 } = options;
  if (refusal || finishReason === "content_filter") {
    throw new WorkflowOutputError("上游模型拒绝了本次创作，已有正文已保留。请调整当前创作要求后重试。");
  }
  if (finishReason === "length") {
    throw new WorkflowOutputError("上游输出达到长度上限，本次结果不完整，已有正文已保留。请减少单章字数或切换模型重试。");
  }
  if (finishReason !== undefined && finishReason !== "stop") {
    throw new WorkflowOutputError("上游未正常完成文本输出，已有正文已保留，请重试。");
  }
  if (typeof content !== "string" || !content.trim()) {
    throw new WorkflowOutputError("上游没有返回有效文本，已有正文已保留，请重试。");
  }
  const text = content.trim();
  // Only recognize short assistant refusals, never a keyword such as "AI" inside fiction.
  if (text.length < 650 && (
    /^(?:很?抱歉[，,。!！\s]*)?(?:我(?:只是|是)(?:一个|一款|一名)?(?:文本\s*AI|人工智能(?:助手|模型)?|AI(?:\s*语言)?模型)|作为(?:一个|一款)?(?:AI|人工智能|语言模型))[\s\S]{0,240}(?:无法|不能|没法|不(?:能|会)提供)/i.test(text) ||
    /^(?:很?抱歉|对不起)[，,。!！\s]*(?:但)?我(?:不能|无法|没法)(?:帮助|协助|提供|完成|满足|生成|继续)/.test(text) ||
    /^(?:(?:i(?:'m| am) sorry|sorry)[,.!\s]*)?(?:as an? (?:ai(?: language model)?|language model)[,.\s]*)?i (?:am (?:just |only )?(?:a |an )?(?:text(?:-based)? ai|language model)[\s\S]{0,100}|cannot |can't |am unable to )(?:[\s\S]{0,160})(?:help|assist|generate|provide|fulfill)/i.test(text)
  )) {
    throw new WorkflowOutputError("上游返回了拒绝回复，并未生成正文，已有版本已保留。请调整当前要求或切换文本模型重试。");
  }
  if (text.length < minimumLength) {
    throw new WorkflowOutputError("上游返回的正文过短，未通过完整性检查，已有版本已保留。请重试。");
  }
  return text;
}

export function parseWorkflowJson(raw, validator, label) {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let data;
  try { data = JSON.parse(text); } catch {
    throw new WorkflowOutputError(`${label}未返回完整有效的 JSON，请重试。已完成的内容已保留。`);
  }
  if (!validator(data)) {
    throw new WorkflowOutputError(`${label}缺少必要内容，请重试。已完成的内容已保留。`);
  }
  return data;
}

const object = value => Boolean(value && typeof value === "object" && !Array.isArray(value));
const textFields = (value, fields) => object(value) && fields.every(key => typeof value[key] === "string" && value[key].trim().length > 0);
export const validVideoPrompts = value => Array.isArray(value) && value.length >= 1 && value.length <= 12 && value.every(item => textFields(item, ["scene_title", "shot_type", "visual_description", "ai_prompt_en", "audio_cue"]));
export const validPitch = value => textFields(value, ["title", "logline", "target_audience", "benchmarks", "character_highlights", "synopsis"]) && ["selling_points", "retention_hooks"].every(key => Array.isArray(value[key]) && value[key].length > 0 && value[key].every(item => typeof item === "string" && item.trim()));
export function validBible(value, chapterCount) {
  return textFields(value, ["title", "logline", "worldview"]) &&
    Array.isArray(value.characters) && value.characters.length > 0 && value.characters.every(item => textFields(item, ["name", "role", "personality", "motivation"])) &&
    Array.isArray(value.foreshadowing) && value.foreshadowing.every(item => textFields(item, ["clue", "revelation"]) && (typeof item.target_chapter === "number" || typeof item.target_chapter === "string")) &&
    Array.isArray(value.outlines) && value.outlines.length >= 1 && value.outlines.length <= 5 &&
    (chapterCount === undefined || value.outlines.length === chapterCount) &&
    value.outlines.every((item, index) => textFields(item, ["title", "goal", "conflict", "hook"]) && item.chapter_number === index + 1);
}

export function validateNovelInput(body) {
  if (!object(body) || typeof body.prompt !== "string" || !body.prompt.trim()) return false;
  const limits = { prompt: 12000, genre: 200, style: 1000, customSystemPrompt: 6000, apiKey: 2000, baseUrl: 2000, model: 200, projectId: 64 };
  if (!Object.entries(limits).every(([key, max]) => body[key] === undefined || (typeof body[key] === "string" && body[key].length <= max))) return false;
  if (body.chapterCount !== undefined && (!Number.isInteger(body.chapterCount) || body.chapterCount < 1 || body.chapterCount > 5)) return false;
  if (body.targetWordCount !== undefined && (!Number.isInteger(body.targetWordCount) || body.targetWordCount < 300 || body.targetWordCount > 5000)) return false;
  if (body.deAiLevel !== undefined && !["light", "medium", "aggressive"].includes(body.deAiLevel)) return false;
  if (body.resumeBible !== undefined && !validBible(body.resumeBible)) return false;
  if (body.resumeChapters !== undefined && (!Array.isArray(body.resumeChapters) || body.resumeChapters.length > 5 || !body.resumeChapters.every((chapter, index) => object(chapter) && chapter.chapter_number === index + 1 && typeof chapter.raw_content === "string" && typeof chapter.polished_content === "string" && typeof chapter.title === "string" && typeof chapter.summary === "string" && Array.isArray(chapter.video_prompts)))) return false;
  return body.resumeFromChapter === undefined || (Number.isInteger(body.resumeFromChapter) && body.resumeFromChapter >= 1 && body.resumeFromChapter <= 6);
}

export function resolveWorkflowTextConfig(body = {}, env = process.env) {
  const ownKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  if (!ownKey && typeof body.baseUrl === "string" && body.baseUrl.trim()) {
    throw new Error("使用自定义文本网关时必须同时填写自己的 API Key，站点密钥不会发送到自定义地址。");
  }
  const rawBaseUrl = ownKey ? body.baseUrl?.trim() || "https://api.openai.com/v1" : env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  let parsed;
  try { parsed = new URL(rawBaseUrl); } catch { throw new Error("文本服务地址格式无效。"); }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error("文本服务地址必须是有效的 HTTP(S) API 地址。");
  if (ownKey && parsed.protocol !== "https:") throw new Error("自定义文本网关必须使用 HTTPS 保护密钥。");
  const apiKey = ownKey || env.OPENAI_API_KEY || env.DEEPSEEK_API_KEY || "";
  if (!apiKey) throw new Error("未配置文本 API Key，请填写自定义文本服务配置或联系管理员。");
  return {
    apiKey,
    baseUrl: parsed.toString().replace(/\/+$/, ""),
    model: ownKey ? body.model?.trim() || "gpt-4o-mini" : env.UPSTREAM_BALANCED_MODEL || env.UPSTREAM_SPEED_MODEL || "gemini-3.7-flash",
  };
}

export function proseStyleInstruction(level = "medium") {
  return {
    light: "轻度润色：保留原有句式和作者声线，仅删除明显重复和空洞套话。",
    medium: "适度润色：用具体动作、感官细节和自然对白替换套话，保留叙事节奏与人物声线。",
    aggressive: "深度润色：重塑僵硬句式、对白和节奏，以具体细节承载情绪；保留全部关键情节与人物动机。",
  }[level] || "";
}

/**
 * Read complete SSE events and require an explicit normal finish before committing output.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} options
 * @param {(text: string) => void} onChunk
 */
export async function callLLMStream(messages, options, onChunk = () => {}, maxRetries = 2) {
  const timeoutSignal = AbortSignal.timeout(options.timeoutMs ?? 90000);
  const signal = options.signal ? AbortSignal.any([options.signal, timeoutSignal]) : timeoutSignal;
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    signal.throwIfAborted();
    let accumulated = "";
    try {
      const response = await fetch(`${options.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${options.apiKey}` },
        body: JSON.stringify({ model: options.model, messages, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens ?? 7000, stream: true }),
        signal,
        redirect: "error",
      });
      if (!response.ok) {
        await response.body?.cancel();
        const error = new Error(`文本服务暂时不可用（HTTP ${response.status}），请稍后重试。`);
        error.retryable = response.status === 429 || response.status >= 500;
        throw error;
      }
      if (response.headers.get("content-type")?.includes("application/json")) {
        const data = await response.json();
        const choice = data.choices?.[0];
        const text = assertCreativeText(choice?.message?.content, { finishReason: choice?.finish_reason ?? null, refusal: choice?.message?.refusal });
        onChunk(text);
        return text;
      }
      if (!response.body) throw new WorkflowOutputError("上游没有返回文本数据流，请重试。");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finishReason;
      let completed = false;
      const consume = event => {
        const payload = event.split(/\r?\n/).filter(line => line.startsWith("data:")).map(line => line.slice(5).trimStart()).join("\n");
        if (!payload) return;
        if (payload === "[DONE]") { completed = true; return; }
        if (completed) throw new WorkflowOutputError("上游数据流结束后仍返回内容，请重试。");
        let data;
        try { data = JSON.parse(payload); } catch { throw new WorkflowOutputError("上游文本数据流格式异常，请重试。"); }
        if (data.error) throw new WorkflowOutputError("上游文本生成失败，请调整要求或稍后重试。");
        const choice = data.choices?.[0];
        if (!choice) return;
        if (choice.delta?.refusal) assertCreativeText("", { refusal: choice.delta.refusal });
        if (choice.finish_reason != null) {
          finishReason = choice.finish_reason;
          if (finishReason !== "stop") assertCreativeText(accumulated, { finishReason });
        }
        const delta = choice.delta?.content;
        if (typeof delta === "string") { accumulated += delta; onChunk(delta); }
      };
      try {
        while (true) {
          signal.throwIfAborted();
          const { value, done } = await reader.read();
          buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() || "";
          events.forEach(consume);
          if (done) { if (buffer.trim()) consume(buffer); break; }
          if (completed) break;
        }
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
      signal.throwIfAborted();
      if (finishReason !== "stop") throw new WorkflowOutputError("上游连接在正文完成前中断，已有内容已保留，请继续生成或重试。");
      return assertCreativeText(accumulated, { finishReason });
    } catch (error) {
      if (isAbortError(error, options.signal)) throw error;
      if (timeoutSignal.aborted) throw new WorkflowOutputError("文本生成超时，已完成内容已保留，请继续生成或重试。");
      lastError = error;
      if (accumulated || error instanceof WorkflowOutputError || !error.retryable || attempt + 1 >= maxRetries) throw error;
      await new Promise((resolve, reject) => {
        const cancel = () => { clearTimeout(timer); reject(signal.reason); };
        const timer = setTimeout(() => { signal.removeEventListener("abort", cancel); resolve(); }, 600 * (attempt + 1));
        signal.addEventListener("abort", cancel, { once: true });
      });
    }
  }
  throw lastError;
}
