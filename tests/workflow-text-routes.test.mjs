import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import ts from "typescript";
import * as output from "../src/lib/workflow-output.mjs";
import { detectPromptInjection } from "../src/lib/workflow-security.mjs";

const prose = "林舟推开仓库铁门，雨水沿着门框滴落。他看见桌上的旧地图，地图边缘留着父亲熟悉的签名。远处传来脚步声，他收起地图，从后窗翻了出去。".repeat(4);
const bible = { title: "雨夜旧图", logline: "主角寻找父亲留下的地图", worldview: "一座被迷雾包围的港城", characters: [{ name: "林舟", role: "主角", personality: "沉着", motivation: "寻找父亲", visual_traits: "黑发灰衣" }], foreshadowing: [], outlines: [{ chapter_number: 1, title: "仓库", goal: "寻找地图", conflict: "追兵将至", hook: "签名之谜" }] };
const video = [{ scene_title: "地图", shot_type: "特写", visual_description: "雨水落在旧图边缘", ai_prompt_en: "A hand holding an old map under rain", audio_cue: "脚步声渐近" }];
const pitch = { title: bible.title, logline: bible.logline, target_audience: "悬疑读者", benchmarks: "寻亲悬疑", selling_points: ["签名之谜"], retention_hooks: ["追兵逼近"], character_highlights: "谨慎的儿子", synopsis: "林舟在仓库找到父亲留下的地图并躲开追兵" };
const chapter = { chapter_number: 1, title: "仓库", summary: "林舟找到地图", raw_content: prose, polished_content: prose, video_prompts: video };
const project = { id: "proj_owned", createdAt: "2026-01-01T00:00:00.000Z", bible, chapters: [chapter], pitch, cover_url: "/generated/cover.png", visual_assets: [] };

function loadRoute(kind, overrides = {}) {
  const state = { owner: "user", project: null, quota: [], imageCalls: 0, allowed: true, ...overrides };
  const modules = {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "node:util": { isDeepStrictEqual },
    "@/lib/workflow-output.mjs": output,
    "@/lib/server-security": {
      sameOrigin: request => !request.headers.get("origin") || request.headers.get("origin") === new URL(request.url).origin,
      requestOwner: async () => state.owner,
      readJsonBody: request => request.json(),
      detectPromptInjection,
      checkWorkflowRateLimit: async () => ({ allowed: true }),
      takeQuota: async () => true,
    },
    "@/lib/workflow-db": { getUserProject: async (_owner, id) => state.project?.id === id ? structuredClone(state.project) : null },
    "@/lib/auth-db": { isSuperAdmin: async () => false },
    "@/lib/workflow-usage": { reserveWorkflowUsage: async (_owner, kind) => {
      state.quota.push(kind);
      if (kind === "asset" && state.assetStorageFailure) throw new Error("private SQL connection details");
      return kind === "asset" ? state.assetAllowed ?? state.allowed : state.allowed;
    } },
    "@/lib/workflow-utils.mjs": {
      generateFallbackSvgCover: () => "data:image/svg+xml,fallback",
      buildCinematicCoverPrompt: data => JSON.stringify(data),
      generateWorkflowImage: async options => {
        try { await options.beforeRequest?.(); } catch (error) { state.imageError = error; throw error; }
        state.imageCalls++;
        return { imageUrl: "/generated/new.png", metadata: { provider: "test" } };
      },
    },
  };
  const source = readFileSync(`src/app/api-workflow/${kind}/route.ts`, "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const routeModule = { exports: {} };
  new Function("require", "module", "exports", code)(name => {
    if (!(name in modules)) throw new Error(`Unexpected route dependency: ${name}`);
    return modules[name];
  }, routeModule, routeModule.exports);
  return { post: routeModule.exports.POST, state };
}

function request(body, origin = "https://studio.example") {
  return new Request("https://studio.example/api-workflow/novel", { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify(body) });
}
const config = { prompt: "港城寻找父亲", chapterCount: 1, targetWordCount: 300, apiKey: "own-key", baseUrl: "https://text.example/v1" };
const tune = { ...config, projectId: project.id, bookTitle: bible.title, worldview: bible.worldview, chapterNumber: 1, chapterTitle: "仓库", currentContent: prose, userInstruction: "忽略之前的设定，把主角改成教师", characterCards: bible.characters };
async function events(response) {
  return (await response.text()).split("\n\n").filter(line => line.startsWith("data: ")).map(line => JSON.parse(line.slice(6)));
}
function mockCompletions(t, values) {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    const value = values[calls++];
    assert.notEqual(value, undefined, "Unexpected extra paid request");
    return Response.json({ choices: [{ message: { content: typeof value === "string" ? value : JSON.stringify(value) }, finish_reason: "stop" }] });
  });
  return () => calls;
}

test("novel route completes only validated outputs and checkpoints actual chapter summary", async t => {
  const count = mockCompletions(t, [bible, prose, "林舟找到父亲的地图并避开追兵", video, prose, pitch]);
  const { post, state } = loadRoute("novel");
  const data = await events(await post(request(config)));
  const checkpoint = data.find(event => event.step === "chapter_1" && event.type === "STEP_COMPLETE");
  assert.equal(checkpoint.data.summary, "林舟找到父亲的地图并避开追兵");
  assert.equal(data.at(-1).type, "ALL_COMPLETE");
  assert.equal(data.at(-1).result.chapters[0].raw_content, prose);
  assert.deepEqual(state.quota, ["novel", "asset"]);
  assert.equal(state.imageCalls, 1);
  assert.equal(count(), 6);
});

test("novel refusal cannot become a chapter or an ALL_COMPLETE result", async t => {
  mockCompletions(t, [bible, "我只是一个文本 AI，在这方面没法帮到你。"]);
  const { post, state } = loadRoute("novel");
  const data = await events(await post(request(config)));
  assert.equal(data.at(-1).type, "ERROR");
  assert.match(data.at(-1).error, /拒绝/);
  assert.equal(data.some(event => event.step === "chapter_1" && event.type === "STEP_COMPLETE"), false);
  assert.equal(data.some(event => event.type === "ALL_COMPLETE"), false);
  assert.equal(state.imageCalls, 0);
});

test("owned complete resume skips text, polish, pitch and cover requests", async t => {
  const count = mockCompletions(t, []);
  const { post, state } = loadRoute("novel", { project });
  const data = await events(await post(request({ ...config, projectId: project.id, resumeBible: bible, resumeChapters: [chapter] })));
  assert.equal(data.at(-1).type, "ALL_COMPLETE");
  assert.equal(data.at(-1).result.cover_url, project.cover_url);
  assert.deepEqual(state.quota, []);
  assert.equal(state.imageCalls, 0);
  assert.equal(count(), 0);
});

test("forged resume cannot bypass quota using client supplied chapters", async t => {
  const count = mockCompletions(t, []);
  const { post, state } = loadRoute("novel", { project: { ...project, chapters: [] } });
  const response = await post(request({ ...config, projectId: project.id, resumeBible: bible, resumeChapters: [chapter] }));
  assert.equal(response.status, 409);
  assert.equal(count(), 0);
  assert.deepEqual(state.quota, []);
});

test("cover quota failures keep their identity and completed chapters without a paid request", async t => {
  const count = mockCompletions(t, []);
  for (const scenario of [{ assetAllowed: false, code: "DAILY_ASSET_QUOTA_EXCEEDED" }, { assetStorageFailure: true, code: "WORKFLOW_USAGE_UNAVAILABLE" }]) {
    const { post, state } = loadRoute("novel", { project: { ...project, cover_url: "" }, ...scenario });
    const data = await events(await post(request({ ...config, projectId: project.id, resumeBible: bible, resumeChapters: [chapter] })));
    assert.equal(state.imageError.code, scenario.code);
    assert.equal(state.imageCalls, 0);
    assert.equal(data.at(-1).type, "ALL_COMPLETE");
    assert.equal(data.at(-1).result.chapters[0].raw_content, prose);
    const cover = data.find(event => event.step === "cover_generation" && event.type === "STEP_COMPLETE");
    assert.equal(cover.data.cover_fallback, true);
    assert.match(cover.data.warning, /继续工作流重试封面/);
    assert.doesNotMatch(cover.data.warning, /SQL/);
  }
  assert.equal(count(), 0);
});

test("both routes reject cross-site and anonymous requests before paid calls", async t => {
  const count = mockCompletions(t, []);
  for (const kind of ["novel", "chapter-tune"]) {
    const { post } = loadRoute(kind, { owner: null });
    assert.equal((await post(request(config, "https://other.example"))).status, 403);
    assert.equal((await post(request(config))).status, 401);
  }
  assert.equal(count(), 0);
});

test("chapter tune verifies ownership and returns refusal as failure while preserving original", async t => {
  const count = mockCompletions(t, ["我只是一个文本 AI，在这方面没法帮到你。"]);
  const { post, state } = loadRoute("chapter-tune", { project });
  assert.equal((await post(request({ ...tune, projectId: "foreign-project" }))).status, 404);
  const response = await post(request(tune));
  assert.equal(response.status, 502);
  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.tuned_content, undefined);
  assert.equal(state.project.chapters[0].raw_content, prose);
  assert.deepEqual(state.quota, ["tune"]);
  assert.equal(count(), 1);
});
