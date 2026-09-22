import test from "node:test";
import assert from "node:assert/strict";
import { assertCreativeText, callLLMStream, parseWorkflowJson, resolveWorkflowTextConfig, validateNovelInput, validBible, validVideoPrompts, proseStyleInstruction } from "../src/lib/workflow-output.mjs";

const options = { baseUrl: "https://text.example/v1", apiKey: "user-test-key", model: "text-model" };
const event = value => `data: ${JSON.stringify(value)}\r\n\r\n`;
const choice = (text, finish = null) => ({ choices: [{ delta: { content: text }, finish_reason: finish }] });
function sse(parts) {
  const bytes = new TextEncoder().encode(parts.join(""));
  return new Response(new ReadableStream({ start(controller) {
    for (let offset = 0; offset < bytes.length; offset += 7) controller.enqueue(bytes.slice(offset, offset + 7));
    controller.close();
  } }), { headers: { "content-type": "text/event-stream" } });
}

test("rejects refusal and incomplete output without rejecting fiction about AI", () => {
  for (const refusal of ["我只是一个文本 AI，在这方面没法帮到你。", "抱歉，我无法帮助你生成这个内容。", "As an AI language model, I cannot help you with that request."]) {
    assert.throws(() => assertCreativeText(refusal), /拒绝/);
  }
  const story = "主角看着屏幕说：‘我只是一个文本AI？’他把显示器移向门口，警报终于停止。";
  assert.equal(assertCreativeText(story, { finishReason: "stop" }), story);
  assert.throws(() => assertCreativeText(story, { finishReason: "content_filter" }), /拒绝/);
  assert.throws(() => assertCreativeText(story, { finishReason: "length" }), /不完整/);
  assert.throws(() => assertCreativeText(story, { refusal: "policy" }), /拒绝/);
});

test("reads UTF-8 SSE split across network chunks and accepts complete final event without newline", async t => {
  t.mock.method(globalThis, "fetch", async () => sse([event(choice("窗外的雨停了。")), `data: ${JSON.stringify(choice("", "stop"))}`]));
  const chunks = [];
  assert.equal(await callLLMStream([], options, text => chunks.push(text)), "窗外的雨停了。");
  assert.equal(chunks.join(""), "窗外的雨停了。");
});

test("a broken stream is not retried or accepted after partial output", async t => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => { calls++; return sse([event(choice("未完成的章节"))]); });
  await assert.rejects(callLLMStream([], options), /中断/);
  assert.equal(calls, 1);
});

test("streamed length/content_filter/refusal/errors fail instead of completing", async t => {
  let payload;
  t.mock.method(globalThis, "fetch", async () => sse(payload));
  for (const value of [choice("残缺的正文", "length"), choice("", "content_filter"), { choices: [{ delta: { refusal: "blocked" } }] }, { error: { message: "upstream failed" } }]) {
    payload = [event(value), "data: [DONE]\n\n"];
    await assert.rejects(callLLMStream([], options));
  }
  payload = [event(choice("我只是一个文本 AI，在这方面没法帮到你。")), event(choice("", "stop")), "data: [DONE]\n\n"];
  await assert.rejects(callLLMStream([], options), /拒绝/);
});

test("abort stops the active request without another call", async t => {
  let calls = 0;
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    calls++;
    controller.abort();
    init.signal.throwIfAborted();
  });
  await assert.rejects(callLLMStream([], { ...options, signal: controller.signal }), { name: "AbortError" });
  assert.equal(calls, 1);
});

test("transient HTTP failures retry only before output and do not expose upstream error bodies", async t => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    assert.equal(init.redirect, "error");
    calls++;
    if (calls === 1) return new Response("secret test gateway body", { status: 503 });
    return sse([event(choice("这是完整的故事。")), event(choice("", "stop")), "data: [DONE]\n\n"]);
  });
  assert.equal(await callLLMStream([], options), "这是完整的故事。");
  assert.equal(calls, 2);
});

test("server text credentials never follow a client-supplied endpoint", () => {
  const env = { OPENAI_API_KEY: "server-secret", OPENAI_BASE_URL: "https://server.example/v1", UPSTREAM_BALANCED_MODEL: "server-model", IMAGE_API_KEY: "image-secret" };
  assert.throws(() => resolveWorkflowTextConfig({ baseUrl: "https://custom.example/v1" }, env), /自己的 API Key/);
  assert.deepEqual(resolveWorkflowTextConfig({}, env), { apiKey: "server-secret", baseUrl: "https://server.example/v1", model: "server-model" });
  assert.deepEqual(resolveWorkflowTextConfig({ apiKey: "user-secret", baseUrl: "https://custom.example/v1/", model: "custom" }, env), { apiKey: "user-secret", baseUrl: "https://custom.example/v1", model: "custom" });
  assert.throws(() => resolveWorkflowTextConfig({ apiKey: "user-secret", baseUrl: "http://custom.example/v1" }, env), /HTTPS/);
});

test("validates structured outputs instead of inventing fallback story data", () => {
  assert.throws(() => parseWorkflowJson('{"title":"故事"', validBible, "设定集"), /JSON/);
  assert.throws(() => parseWorkflowJson("[]", validVideoPrompts, "分镜"), /必要内容/);
  assert.throws(() => parseWorkflowJson('{"title":"故事"}', validBible, "设定集"), /必要内容/);
  assert.equal(validateNovelInput({ prompt: "小说", chapterCount: 3, targetWordCount: 1200, deAiLevel: "light" }), true);
  for (const input of [{ prompt: [] }, { prompt: "故事", chapterCount: "3" }, { prompt: "故事", genre: {} }, { prompt: "故事", targetWordCount: 90000 }, { prompt: "故事", resumeBible: { outlines: [] } }]) assert.equal(validateNovelInput(input), false);
  assert.notEqual(proseStyleInstruction("light"), proseStyleInstruction("aggressive"));
});
