import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  generateWorkflowImage, callGeminiImageGeneration, resolveImageProviders,
  buildEnglishAssetPrompt, buildCinematicCoverPrompt, inspectGeneratedImage,
  resolveGeneratedAssetPath, saveBase64ImageLocally,
} from "../src/lib/workflow-utils.mjs";
import { reportImageSuccess, getImageCooldownStatus } from "../src/lib/workflow-cooldown.mjs";

const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const validResponse = () => Response.json({ data: [{ b64_json: png }] });
const envNames = ["IMAGE_API_BASE_URL", "IMAGE_API_KEY", "IMAGE_MODEL", "IMAGE_FALLBACK_BASE_URL", "IMAGE_FALLBACK_API_KEY", "IMAGE_FALLBACK_MODEL", "IMAGE_SIZE_COVER", "IMAGE_SIZE_CHARACTER", "IMAGE_SIZE_SCENE", "OPENAI_API_KEY", "OPENAI_BASE_URL", "GENERATED_ASSET_DIR"];

function setup(t, env = {}) {
  const prior = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
  for (const name of envNames) delete process.env[name];
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-image-test-"));
  Object.assign(process.env, env, { GENERATED_ASSET_DIR: directory });
  const oldFetch = globalThis.fetch;
  for (const provider of ["http://127.0.0.1:4981", "https://primary.example", "https://backup.example", "https://custom.example"]) reportImageSuccess(provider);
  t.after(() => {
    globalThis.fetch = oldFetch;
    for (const name of envNames) {
      if (prior[name] === undefined) delete process.env[name];
      else process.env[name] = prior[name];
    }
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return directory;
}

test("independent image provider wins over chat settings and never leaks server keys to custom URLs", t => {
  setup(t, { IMAGE_API_BASE_URL: "https://primary.example/v1", IMAGE_API_KEY: "image-secret", IMAGE_MODEL: "image-model", OPENAI_API_KEY: "chat-secret", OPENAI_BASE_URL: "https://chat.example/v1" });
  assert.deepEqual(resolveImageProviders().map(p => [p.endpoint, p.apiKey, p.model]), [["https://primary.example/v1", "image-secret", "image-model"]]);
  assert.throws(() => resolveImageProviders({ baseUrl: "https://custom.example/v1" }), { code: "IMAGE_CREDENTIAL_REQUIRED" });
  assert.throws(() => resolveImageProviders({ baseUrl: "https://custom.example/v1", apiKey: "image-secret" }), { code: "IMAGE_CREDENTIAL_MISMATCH" });
  assert.throws(() => resolveImageProviders({ baseUrl: "https://custom.example/v1", apiKey: "chat-secret" }), { code: "IMAGE_CREDENTIAL_MISMATCH" });
  assert.equal(resolveImageProviders({ baseUrl: "https://custom.example/v1", apiKey: "custom-secret" })[0].apiKey, "custom-secret");
});

test("default localhost remains one unauthenticated endpoint with no chat fallback", async t => {
  setup(t, { OPENAI_API_KEY: "chat-secret", OPENAI_BASE_URL: "https://chat.example/v1" });
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(url, "http://127.0.0.1:4981/openai/v1/images/generations");
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(options.redirect, "error");
    assert.equal(JSON.parse(options.body).size, "1024x1024");
    return validResponse();
  };
  const result = await callGeminiImageGeneration({ prompt: "A mountain", kind: "scene" });
  assert.match(result, /^\/generated\/workflow\/scene-.*\.png$/);
  assert.equal(calls, 1);
});

test("generation persists validated image with configured dimensions and provenance", async t => {
  const directory = setup(t, { IMAGE_API_BASE_URL: "https://primary.example/v1", IMAGE_API_KEY: "image-secret", IMAGE_MODEL: "my-image-model", IMAGE_SIZE_CHARACTER: "768x1024" });
  let reserved = 0;
  globalThis.fetch = async (_, options) => {
    assert.equal(options.headers.Authorization, "Bearer image-secret");
    assert.deepEqual(JSON.parse(options.body), { model: "my-image-model", prompt: "Generate an image of A character", size: "768x1024", n: 1, response_format: "b64_json" });
    return validResponse();
  };
  const result = await generateWorkflowImage({ prompt: "A character", kind: "character", prefix: "../../escape", beforeRequest: () => { reserved++; } });
  assert.equal(reserved, 1);
  assert.equal(result.metadata.requestedAspectRatio, "3:4");
  assert.equal(result.metadata.requestedSize, "768x1024");
  assert.equal(result.metadata.aspectRatio, "1:1");
  assert.equal(result.metadata.size, "1x1");
  assert.equal(result.metadata.model, "my-image-model");
  assert.equal(result.metadata.provider, "https://primary.example");
  assert.match(result.imageUrl, /^\/generated\/workflow\/[a-zA-Z0-9_-]+\.png$/);
  assert.equal(fs.readFileSync(path.join(directory, "workflow", path.basename(result.imageUrl))).toString("base64"), png);
});

test("timeout includes a stalled response body and does not issue duplicate generations", async t => {
  setup(t);
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{"data":')); } }), { headers: { "content-type": "application/json" } });
  };
  const started = Date.now();
  await assert.rejects(generateWorkflowImage({ prompt: "A mountain", timeoutMs: 25 }), { code: "IMAGE_TIMEOUT" });
  assert.ok(Date.now() - started < 500);
  assert.equal(calls, 1);
  assert.equal(getImageCooldownStatus("http://127.0.0.1:4981").active, true);
});

test("cancellation aborts upstream work and rejects without reporting success", async t => {
  setup(t);
  const controller = new AbortController();
  let upstreamSignal;
  globalThis.fetch = async (_, options) => {
    upstreamSignal = options.signal;
    controller.abort();
    return new Promise(() => {});
  };
  await assert.rejects(generateWorkflowImage({ prompt: "A mountain", signal: controller.signal }), { code: "IMAGE_CANCELLED" });
  assert.equal(upstreamSignal.aborted, true);
});

test("concurrent jobs on the same provider return busy before quota reservation", async t => {
  setup(t);
  let release;
  let started;
  const hasStarted = new Promise(resolve => { started = resolve; });
  globalThis.fetch = async () => { started(); return new Promise(resolve => { release = resolve; }); };
  const first = generateWorkflowImage({ prompt: "First" });
  await hasStarted;
  let reserved = 0;
  await assert.rejects(generateWorkflowImage({ prompt: "Second", beforeRequest: () => { reserved++; } }), { code: "IMAGE_BUSY" });
  assert.equal(reserved, 0);
  release(validResponse());
  await first;
});

test("only an explicitly configured fallback gets its own credential and reserves usage once", async t => {
  setup(t, { IMAGE_API_BASE_URL: "https://primary.example/v1", IMAGE_API_KEY: "primary-key", IMAGE_FALLBACK_BASE_URL: "https://backup.example/v1", IMAGE_FALLBACK_API_KEY: "backup-key", IMAGE_FALLBACK_MODEL: "backup-model" });
  const calls = [];
  let reserved = 0;
  globalThis.fetch = async (url, options) => {
    calls.push([url, options.headers.Authorization, JSON.parse(options.body).model]);
    return calls.length === 1 ? new Response("unavailable", { status: 503 }) : validResponse();
  };
  const result = await generateWorkflowImage({ prompt: "A scene", kind: "scene", beforeRequest: () => { reserved++; } });
  assert.equal(reserved, 1);
  assert.deepEqual(calls.map(call => call[1]), ["Bearer primary-key", "Bearer backup-key"]);
  assert.equal(result.metadata.provider, "https://backup.example");
  assert.equal(result.metadata.model, "backup-model");
});

test("auth and unsupported size errors never retry or fall back", async t => {
  setup(t, { IMAGE_API_BASE_URL: "https://primary.example/v1", IMAGE_API_KEY: "primary-key", IMAGE_FALLBACK_BASE_URL: "https://backup.example/v1", IMAGE_FALLBACK_API_KEY: "backup-key" });
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response("unsupported size", { status: 400 }); };
  await assert.rejects(generateWorkflowImage({ prompt: "A cover" }), { code: "IMAGE_UPSTREAM_400" });
  assert.equal(calls, 1);
  assert.equal(getImageCooldownStatus("https://primary.example").active, false);
  globalThis.fetch = async () => { calls++; return new Response("invalid key", { status: 401 }); };
  await assert.rejects(generateWorkflowImage({ prompt: "A cover" }), { code: "IMAGE_UPSTREAM_401" });
  assert.equal(calls, 2);
});

test("429 observes short retry-after cooldown before another request can consume quota", async t => {
  setup(t);
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response("busy", { status: 429, headers: { "retry-after": "20" } }); };
  await assert.rejects(generateWorkflowImage({ prompt: "A cover" }), { code: "IMAGE_UPSTREAM_429", retryAfter: 20 });
  let reserved = 0;
  await assert.rejects(generateWorkflowImage({ prompt: "A cover", beforeRequest: () => { reserved++; } }), { code: "IMAGE_COOLDOWN" });
  assert.equal(reserved, 0);
  assert.equal(calls, 1);
});

test("empty, refused, URL-only and spoofed image results cannot succeed", async t => {
  setup(t);
  for (const [payload, code] of [
    [{ data: [] }, "IMAGE_EMPTY_RESULT"],
    [{ choices: [{ message: { content: "I am a text AI" } }] }, "IMAGE_EMPTY_RESULT"],
    [{ data: [{ url: "http://127.0.0.1/private" }] }, "IMAGE_URL_UNSUPPORTED"],
    [{ data: [{ b64_json: Buffer.from("<svg onload='evil'>").toString("base64") }] }, "IMAGE_INVALID_DATA"],
  ]) {
    globalThis.fetch = async () => Response.json(payload);
    await assert.rejects(generateWorkflowImage({ prompt: "A cover" }), { code });
  }
});

test("image validation and path resolution reject forged MIME and traversal", t => {
  setup(t);
  assert.throws(() => saveBase64ImageLocally("data:image/jpeg;base64," + png), { code: "IMAGE_INVALID_DATA" });
  assert.equal(inspectGeneratedImage(Buffer.from("not an image")), null);
  for (const parts of [["workflow", "..\\secret.png"], ["workflow", "../secret.png"], ["workflow", "%2e%2e.png"], ["workflow", "test.svg"], ["workflow", "C:\\private.png"], ["other", "test.png"]]) {
    assert.equal(resolveGeneratedAssetPath(parts), null);
  }
});

test("asset prompts retain full appearance, scene description, style and actual plot", () => {
  const appearance = "A detailed garment. ".repeat(15) + "Distinctive silver eye.";
  const prompt = buildEnglishAssetPrompt({ type: "character", name: "Hero", appearance, style: "ink illustration", worldview: "floating cities", plot: "Returning home after an expedition" });
  assert.ok(prompt.includes(appearance));
  assert.ok(prompt.includes("ink illustration"));
  assert.ok(prompt.includes("floating cities"));
  assert.ok(prompt.includes("Returning home"));
  const scene = buildEnglishAssetPrompt({ type: "scene", description: "The tower collapses at dawn" });
  assert.ok(scene.includes("The tower collapses at dawn"));
  assert.ok(buildCinematicCoverPrompt({ protagonist: appearance }).includes(appearance));
});
