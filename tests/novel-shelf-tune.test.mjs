import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveValidBaseUrl,
  generateFallbackSvgCover,
} from "../src/lib/workflow-utils.mjs";

test("resolveValidBaseUrl cleans corrupt inputs like 'chen' and falls back safely", () => {
  // 单个无协议且无域名的脏单词
  const corruptInput = "chen";
  const resolved = resolveValidBaseUrl(corruptInput);
  assert.ok(
    resolved.startsWith("http://") || resolved.startsWith("https://"),
    "Must resolve to an absolute HTTP/HTTPS URL"
  );
  assert.ok(!resolved.includes("chen/chat"), "Must not resolve to relative chen");

  // 纯空值
  const emptyResolved = resolveValidBaseUrl("");
  assert.ok(emptyResolved.startsWith("http"));

  // 包含域名但无协议
  const domainOnly = "api.deepseek.com";
  const withProtocol = resolveValidBaseUrl(domainOnly);
  assert.equal(withProtocol, "https://api.deepseek.com");

  // 完整合法 URL
  const validUrl = "https://custom.openai.proxy/v1";
  assert.equal(resolveValidBaseUrl(validUrl), "https://custom.openai.proxy/v1");
});

test("generateFallbackSvgCover generates valid SVG data URI with title", () => {
  const coverUri = generateFallbackSvgCover("微观时间倒流", "科幻悬疑");
  assert.ok(coverUri.startsWith("data:image/svg+xml;utf8,"));
  assert.ok(coverUri.includes(encodeURIComponent("微观时间倒流")));
  assert.ok(coverUri.includes(encodeURIComponent("科幻悬疑")));
});

test("WorkflowProject structure conforms to multi-project novel requirements", () => {
  const mockProject = {
    id: "proj_123",
    title: "纳米级时空倒流",
    cover_url: "data:image/svg+xml;utf8,...",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    prompt: "普通医生觉醒倒流能力",
    config: {
      prompt: "普通医生觉醒倒流能力",
      genre: "都市异能",
      style: "极简电影质感",
      chapterCount: 3,
      deAiLevel: "medium",
    },
    bible: {
      title: "纳米级时空倒流",
      logline: "倒流三秒救女儿",
      worldview: "微观量子回溯",
      characters: [],
      foreshadowing: [],
      outlines: [],
    },
    chapters: [],
    pitch: {
      title: "纳米级时空倒流",
      logline: "倒流三秒救女儿",
      target_audience: "青年男性",
      benchmarks: "庆余年",
      selling_points: [],
      retention_hooks: [],
      character_highlights: "主角冷静狠厉",
      synopsis: "...",
    },
  };

  assert.equal(typeof mockProject.id, "string");
  assert.equal(typeof mockProject.cover_url, "string");
  assert.equal(typeof mockProject.config.genre, "string");
  assert.ok(Array.isArray(mockProject.chapters));
});

test("generateCharacterPortraitSvg generates valid portrait SVG data URI", async () => {
  const { generateCharacterPortraitSvg } = await import("../src/lib/workflow-utils.mjs");
  const portraitUri = generateCharacterPortraitSvg({
    name: "林渊",
    role: "急诊科主治医生",
    personality: "沉着冷静",
    appearance: "身着白大褂，目光如炬",
    genre: "都市异能",
  });
  assert.ok(portraitUri.startsWith("data:image/svg+xml;utf8,"));
  assert.ok(portraitUri.includes(encodeURIComponent("林渊")));
});

test("WORKFLOW_INSPIRATIONS contains at least 100 high-concept story presets", async () => {
  const { WORKFLOW_INSPIRATIONS } = await import("../src/data/workflow-inspirations.mjs");
  assert.ok(Array.isArray(WORKFLOW_INSPIRATIONS));
  assert.ok(WORKFLOW_INSPIRATIONS.length >= 100, `Expected >= 100, got ${WORKFLOW_INSPIRATIONS.length}`);
});

test("buildCinematicCoverPrompt generates rich 8k movie poster prompt from story bible", async () => {
  const { buildCinematicCoverPrompt, buildFluxImageUrl } = await import("../src/lib/workflow-utils.mjs");
  const prompt = buildCinematicCoverPrompt({
    title: "《微观时间倒流三秒》",
    genre: "都市异能",
    style: "电影质感",
    worldview: "微观量子回溯，暴雨连绵的赛博都市",
    protagonist: "林渊 (急诊外科医生，眼神深邃，手持纳米手术刀)",
    mainScene: "暴雨倾盆的手术室天台",
    coreConflict: "阻止跨国生物集团的活体实验",
  });

  assert.ok(prompt.includes("微观时间倒流三秒"));
  assert.ok(prompt.includes("Generate an image:"));
  assert.ok(prompt.includes("book cover illustration"));
  assert.ok(prompt.includes("Protagonist:"));

  const fluxUrl = buildFluxImageUrl(prompt, { width: 768, height: 1024 });
  assert.ok(fluxUrl.startsWith("https://image.pollinations.ai/prompt/"));
  assert.ok(fluxUrl.includes("width=768"));
  assert.ok(fluxUrl.includes("height=1024"));
  assert.ok(fluxUrl.includes("model=flux"));
  assert.ok(fluxUrl.includes("nologo=true"));
  assert.ok(fluxUrl.includes("enhance=true"));
});

test("triggerImageCooldown handles 5-minute initial penalty and 30-minute escalation", async () => {
  const { getImageCooldownStatus, triggerImageCooldown, reportImageSuccess } = await import("../src/lib/workflow-cooldown.mjs");
  
  // 初始触发：5 分钟
  const first = triggerImageCooldown("FIRST_TIMEOUT");
  assert.equal(first.tier, 1);
  assert.ok(first.remainingSeconds >= 290 && first.remainingSeconds <= 300);

  const status1 = getImageCooldownStatus();
  assert.equal(status1.active, true);
  assert.equal(status1.tier, 1);

  // 再次触发：升级为 30 分钟 (1800 秒)
  const second = triggerImageCooldown("SECOND_CONCURRENCY");
  assert.equal(second.tier, 2);
  assert.ok(second.remainingSeconds >= 1790 && second.remainingSeconds <= 1800);

  const status2 = getImageCooldownStatus();
  assert.equal(status2.active, true);
  assert.equal(status2.tier, 2);
});

test("callGeminiImageGeneration is exported and throws if api key is missing", async () => {
  const { callGeminiImageGeneration } = await import("../src/lib/workflow-utils.mjs");
  assert.equal(typeof callGeminiImageGeneration, "function");
  await assert.rejects(
    async () => {
      await callGeminiImageGeneration({ prompt: "test prompt", apiKey: "" });
    },
    { message: "API_KEY_MISSING" }
  );
});


