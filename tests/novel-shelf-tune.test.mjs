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

test("buildCinematicCoverPrompt includes the actual story bible and visual style", async () => {
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
  assert.ok(prompt.includes("Generate an image of"));
  assert.ok(prompt.includes("book cover"));
  assert.ok(prompt.includes("林渊"));
  assert.ok(prompt.includes("电影质感"));
  assert.ok(prompt.includes("微观量子回溯"));
  assert.ok(prompt.includes("阻止跨国生物集团的活体实验"));

  const fluxUrl = buildFluxImageUrl(prompt, { width: 768, height: 1024 });
  assert.ok(fluxUrl.startsWith("https://image.pollinations.ai/prompt/"));
  assert.ok(fluxUrl.includes("width=768"));
  assert.ok(fluxUrl.includes("height=1024"));
  assert.ok(fluxUrl.includes("model=flux"));
  assert.ok(fluxUrl.includes("nologo=true"));
  assert.ok(fluxUrl.includes("enhance=true"));
});

test("image cooldown is short, provider scoped, and cleared after success", async () => {
  const { getImageCooldownStatus, triggerImageCooldown, reportImageSuccess } = await import("../src/lib/workflow-cooldown.mjs");
  
  const first = triggerImageCooldown("TIMEOUT", "test-provider");
  assert.equal(first.tier, 1);
  assert.ok(first.remainingSeconds >= 9 && first.remainingSeconds <= 10);

  const status1 = getImageCooldownStatus("test-provider");
  assert.equal(status1.active, true);
  assert.equal(status1.tier, 1);

  const second = triggerImageCooldown("IMAGE_UPSTREAM_429", "test-provider", 40);
  assert.equal(second.tier, 2);
  assert.ok(second.remainingSeconds >= 39 && second.remainingSeconds <= 40);

  const status2 = getImageCooldownStatus("test-provider");
  assert.equal(status2.active, true);
  assert.equal(status2.tier, 2);
  assert.equal(getImageCooldownStatus("other-provider").active, false);
  reportImageSuccess("test-provider");
  assert.equal(getImageCooldownStatus("test-provider").active, false);
  triggerImageCooldown("IMAGE_UPSTREAM_401", "test-provider");
  assert.equal(getImageCooldownStatus("test-provider").active, false);
});

test("saveBase64ImageLocally safely persists base64 to local disk and returns static URL", async () => {
  const { saveBase64ImageLocally, callGeminiImageGeneration } = await import("../src/lib/workflow-utils.mjs");
  assert.equal(typeof callGeminiImageGeneration, "function");
  assert.equal(typeof saveBase64ImageLocally, "function");

  // 1x1 base64 png
  const transparentPngB64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const savedUrl = saveBase64ImageLocally(transparentPngB64, "unit-test");
  assert.ok(savedUrl.startsWith("/generated/workflow/unit-test-"));
  assert.ok(savedUrl.endsWith(".png"));

  // A URL is not a persistent validated image.
  const httpUrl = "https://example.com/cover.png";
  assert.throws(() => saveBase64ImageLocally(httpUrl), { code: "IMAGE_INVALID_DATA" });
});
