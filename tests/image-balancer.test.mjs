import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  sanitizePrompt,
  isCloudflareConfigured,
  getBalancerStatus,
  generateImageWithBalancer,
  resolveCloudflareCredentials,
  saveCloudflareCredentials,
} from "../src/lib/image-balancer.mjs";

test("sanitizePrompt handles boundaries and cleans invalid control characters", () => {
  assert.equal(sanitizePrompt("  hello world  "), "hello world");
  assert.equal(sanitizePrompt("line\x00break\x1Ftest"), "linebreaktest");
  assert.equal(sanitizePrompt(null), "");
  assert.equal(sanitizePrompt(123), "");
  const longText = "a".repeat(5000);
  assert.equal(sanitizePrompt(longText).length, 4000);
});

test("isCloudflareConfigured checks both accountId and token", (t) => {
  const origAccount = process.env.CLOUDFLARE_ACCOUNT_ID;
  const origToken = process.env.CLOUDFLARE_API_TOKEN;
  const runtimePath = path.resolve(process.cwd(), ".runtime", "image-credentials.json");
  let runtimeBackup = null;
  if (fs.existsSync(runtimePath)) {
    runtimeBackup = fs.readFileSync(runtimePath, "utf8");
    fs.unlinkSync(runtimePath);
  }

  t.after(() => {
    if (origAccount !== undefined) process.env.CLOUDFLARE_ACCOUNT_ID = origAccount;
    else delete process.env.CLOUDFLARE_ACCOUNT_ID;
    if (origToken !== undefined) process.env.CLOUDFLARE_API_TOKEN = origToken;
    else delete process.env.CLOUDFLARE_API_TOKEN;
    if (runtimeBackup !== null) {
      fs.writeFileSync(runtimePath, runtimeBackup, "utf8");
    }
  });

  delete process.env.CLOUDFLARE_ACCOUNT_ID;
  delete process.env.CLOUDFLARE_API_TOKEN;
  assert.equal(isCloudflareConfigured(), false);

  process.env.CLOUDFLARE_ACCOUNT_ID = "acc-123";
  assert.equal(isCloudflareConfigured(), false);

  process.env.CLOUDFLARE_API_TOKEN = "tok-456";
  assert.equal(isCloudflareConfigured(), true);

  const status = getBalancerStatus();
  assert.equal(status.cloudflareConfigured, true);
  assert.equal(status.pollinationsAvailable, true);
  assert.deepEqual(status.activeProviders, ["cloudflare", "pollinations"]);
});

test("balancer automatically fails over to alternative provider when primary fails", async (t) => {
  const origAccount = process.env.CLOUDFLARE_ACCOUNT_ID;
  const origToken = process.env.CLOUDFLARE_API_TOKEN;
  const origFetch = globalThis.fetch;

  process.env.CLOUDFLARE_ACCOUNT_ID = "mock-account";
  process.env.CLOUDFLARE_API_TOKEN = "mock-token";

  t.after(() => {
    globalThis.fetch = origFetch;
    if (origAccount !== undefined) process.env.CLOUDFLARE_ACCOUNT_ID = origAccount;
    else delete process.env.CLOUDFLARE_ACCOUNT_ID;
    if (origToken !== undefined) process.env.CLOUDFLARE_API_TOKEN = origToken;
    else delete process.env.CLOUDFLARE_API_TOKEN;
  });

  let cloudflareAttempts = 0;
  let pollinationsAttempts = 0;

  // Mock fetch: CF throws 500 error, Pollinations succeeds
  globalThis.fetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.includes("cloudflare.com")) {
      cloudflareAttempts++;
      return new Response(JSON.stringify({ errors: ["Internal GPU error"] }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (urlStr.includes("pollinations.ai")) {
      pollinationsAttempts++;
      // Return 1x1 dummy image buffer
      const dummyBuffer = Buffer.from("mock-binary-image");
      return new Response(dummyBuffer, {
        status: 200,
        headers: { "Content-Type": "image/jpeg" },
      });
    }
    return new Response(null, { status: 404 });
  };

  const result = await generateImageWithBalancer({
    prompt: "Cyberpunk neon warrior",
    provider: "cloudflare", // Explicitly request CF
    allowFailover: true,
  });

  assert.equal(cloudflareAttempts, 1);
  assert.equal(pollinationsAttempts, 1);
  assert.equal(result.provider, "pollinations");
  assert.equal(result.failover, true);
  assert.match(result.failoverReason, /cloudflare/i);
});

test("balancer aborts gracefully when signal is triggered", async (t) => {
  const origFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = origFetch; });

  const controller = new AbortController();
  controller.abort(new Error("User stopped generation"));

  await assert.rejects(
    generateImageWithBalancer({
      prompt: "Floating castle",
      signal: controller.signal,
    }),
    /User stopped generation/
  );
});

test("resolveCloudflareCredentials prioritizes explicit options over process.env", () => {
  const origAccount = process.env.CLOUDFLARE_ACCOUNT_ID;
  const origToken = process.env.CLOUDFLARE_API_TOKEN;

  delete process.env.CLOUDFLARE_ACCOUNT_ID;
  delete process.env.CLOUDFLARE_API_TOKEN;

  // Options override
  const resolved = resolveCloudflareCredentials({
    cfAccountId: "custom-acc",
    cfApiToken: "custom-tok",
  });
  assert.equal(resolved.accountId, "custom-acc");
  assert.equal(resolved.token, "custom-tok");
  assert.equal(resolved.ready, true);

  if (origAccount !== undefined) process.env.CLOUDFLARE_ACCOUNT_ID = origAccount;
  if (origToken !== undefined) process.env.CLOUDFLARE_API_TOKEN = origToken;
});

test("saveCloudflareCredentials updates process.env safely", (t) => {
  const origAccount = process.env.CLOUDFLARE_ACCOUNT_ID;
  const origToken = process.env.CLOUDFLARE_API_TOKEN;
  const runtimePath = path.resolve(process.cwd(), ".runtime", "image-credentials.json");
  let runtimeBackup = null;
  if (fs.existsSync(runtimePath)) {
    runtimeBackup = fs.readFileSync(runtimePath, "utf8");
  }

  t.after(() => {
    if (origAccount !== undefined) process.env.CLOUDFLARE_ACCOUNT_ID = origAccount;
    else delete process.env.CLOUDFLARE_ACCOUNT_ID;
    if (origToken !== undefined) process.env.CLOUDFLARE_API_TOKEN = origToken;
    else delete process.env.CLOUDFLARE_API_TOKEN;

    if (runtimeBackup !== null) {
      fs.writeFileSync(runtimePath, runtimeBackup, "utf8");
    } else if (fs.existsSync(runtimePath)) {
      fs.unlinkSync(runtimePath);
    }
  });

  assert.throws(() => saveCloudflareCredentials({ accountId: "", token: "" }));

  const saved = saveCloudflareCredentials({ accountId: "saved-acc", token: "saved-tok" });
  assert.equal(saved, true);
  assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID, "saved-acc");
  assert.equal(process.env.CLOUDFLARE_API_TOKEN, "saved-tok");
});

