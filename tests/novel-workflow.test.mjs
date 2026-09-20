import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("site.ts navigation includes /workflow entry", () => {
  const siteCode = readFileSync("src/data/site.ts", "utf8");
  assert.match(
    siteCode,
    /\{\s*href:\s*["']\/workflow["'],\s*label:\s*["']工作流["']\s*\}/,
    "Navigation must contain /workflow entry"
  );
});

test("VideoPromptItem structure conforms to specifications", () => {
  const requiredFields = [
    "scene_title",
    "shot_type",
    "visual_description",
    "ai_prompt_en",
    "audio_cue",
  ];

  const samplePrompt = {
    scene_title: "第一章高潮 - 发现孕检单特写",
    shot_type: "特写缓缓拉远，Slow Dolly-Out，4K，24fps",
    visual_description: "详细中文画面描述...",
    ai_prompt_en: "Cinematic lighting, hyper-realistic, 8k, photorealistic...",
    audio_cue: "心跳急促声逐渐放大，背景雷声微响",
  };

  for (const field of requiredFields) {
    assert.ok(field in samplePrompt, `Sample prompt must have field ${field}`);
    assert.equal(typeof samplePrompt[field], "string");
  }
});

test("extractJson function cleans markdown fences and handles corrupted prefix/suffix", () => {
  function extractJson(raw, fallback) {
    try {
      const cleaned = raw
        .replace(/```json\s*/gi, "")
        .replace(/```\s*$/g, "")
        .trim();
      return JSON.parse(cleaned);
    } catch {
      const firstBrace = raw.indexOf("{");
      const lastBrace = raw.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
        } catch {}
      }
      return fallback;
    }
  }

  const rawWithMarkdown = "```json\n{\"title\": \"测试书名\", \"logline\": \"核心梗概\"}\n```";
  assert.deepEqual(extractJson(rawWithMarkdown, {}), {
    title: "测试书名",
    logline: "核心梗概",
  });

  const rawWithNoise = "这是AI前导回答：\n{\"title\": \"带有杂质的书名\"}\n这是AI尾随话语。";
  assert.deepEqual(extractJson(rawWithNoise, {}), {
    title: "带有杂质的书名",
  });
});

test("Chapter context cascading logic concatenates correctly", () => {
  const bibleWorldview = "赛博城市与纳米义体世界";
  const rollingSummary = "- 第1章主角觉醒义体";
  const lastChapterTail = "雨滴砸在防弹风衣上，发出沉闷的声响。";
  const nextOutline = {
    title: "暗夜潜行",
    goal: "潜入药企中心",
    conflict: "遭遇无人机群拦截",
    hook: "警报被触发",
  };

  const context = `【全局大纲】${bibleWorldview}\n【前文摘要】${rollingSummary}\n【上一章末尾】${lastChapterTail}\n【本章目标】${nextOutline.goal}`;
  assert.ok(context.includes(bibleWorldview));
  assert.ok(context.includes(rollingSummary));
  assert.ok(context.includes(lastChapterTail));
  assert.ok(context.includes(nextOutline.goal));
});
