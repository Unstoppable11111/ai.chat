import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);

// 动态使用 TypeScript 转译并加载 src/lib/chat-quota.ts
const tsSource = fs.readFileSync(new URL("../src/lib/chat-quota.ts", import.meta.url), "utf8");
const compiledJs = ts.transpileModule(tsSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function loadChatQuotaModule(customVerifySession = null) {
  const exports = {};
  const targetModule = { exports };

  const mockDb = {
    getDbPool: () => null, // 测试内存降级高可用模式
  };

  const mockServerSecurity = {
    sessionToken: (req) => {
      const cookie = req.headers.get("cookie") || "";
      const match = cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith("studio_session="));
      return match ? match.slice("studio_session=".length) : null;
    },
    verifySession: async (token) => {
      if (customVerifySession) return customVerifySession(token);
      return token === "valid-user-token" ? "user-mock-id" : null;
    },
    clientKey: (req) => {
      return req.headers.get("x-forwarded-for") || "ip-mock-client";
    },
  };

  const sandbox = {
    module: targetModule,
    exports,
    require: (id) => {
      if (id === "./db") return mockDb;
      if (id === "./server-security") return mockServerSecurity;
      return require(id);
    },
    Intl,
    Date,
    Math,
    Map,
    Request,
    Response,
    Headers,
    console,
  };

  vm.runInNewContext(compiledJs, sandbox);
  return targetModule.exports;
}

test("getBeijingDateString returns valid YYYY-MM-DD in Asia/Shanghai timezone", () => {
  const { getBeijingDateString } = loadChatQuotaModule();
  const dateStr = getBeijingDateString();
  assert.match(dateStr, /^\d{4}-\d{2}-\d{2}$/, "Must match YYYY-MM-DD pattern");

  // 验证显式传入特定 UTC 时间时正确换算至北京时间
  // 2026-10-14 23:30:00 UTC 对应北京时间 2026-10-15 07:30:00
  const utcDate = new Date("2026-10-14T23:30:00Z");
  assert.equal(getBeijingDateString(utcDate), "2026-10-15");
});

test("getMsUntilNextBeijingMidnight returns accurate TTL to next 00:00:00", () => {
  const { getMsUntilNextBeijingMidnight } = loadChatQuotaModule();
  const ttl = getMsUntilNextBeijingMidnight();
  assert.ok(ttl >= 60000, "TTL must be at least 1 minute");
  assert.ok(ttl <= 24 * 60 * 60 * 1000, "TTL must not exceed 24 hours");
});

test("consumeChatQuota restricts guest to 10 questions per day and requires login on 11th", async () => {
  const {
    GUEST_CHAT_DAILY_LIMIT,
    GUEST_COOKIE_NAME,
    consumeChatQuota,
    getChatQuotaStatus,
    resetMemoryQuotaStore,
  } = loadChatQuotaModule();

  resetMemoryQuotaStore();

  const testGuestToken = "test-guest-device-unique-token-999";
  const mockReq = new Request("http://localhost:3000/api-chat-backend", {
    headers: {
      cookie: `${GUEST_COOKIE_NAME}=${testGuestToken}`,
      "x-forwarded-for": "192.168.1.100",
    },
  });

  // 前 10 次提问必须全部成功，remaining 依次从 9 递减到 0
  for (let i = 1; i <= GUEST_CHAT_DAILY_LIMIT; i++) {
    const result = await consumeChatQuota(mockReq);
    assert.equal(result.allowed, true, `Attempt #${i} should be allowed`);
    assert.equal(result.authenticated, false, "Should be guest");
    assert.equal(result.remaining, GUEST_CHAT_DAILY_LIMIT - i, `Remaining should be ${GUEST_CHAT_DAILY_LIMIT - i}`);
  }

  // 状态查询应显示 0 次可用
  const status = await getChatQuotaStatus(mockReq);
  assert.equal(status.remaining, 0, "Guest remaining quota should be 0");
  assert.equal(status.used, 10, "Guest used quota should be 10");

  // 第 11 次提问必须被拦截，并返回 requireLogin
  const blockedResult = await consumeChatQuota(mockReq);
  assert.equal(blockedResult.allowed, false, "Attempt #11 must be blocked");
  assert.equal(blockedResult.requireLogin, true, "Must require login");
  assert.equal(blockedResult.remaining, 0);
  assert.ok(blockedResult.message.includes("登录"), "Message should mention login");
});

test("valid authenticated users bypass guest daily limit completely", async () => {
  const { consumeChatQuota, getChatQuotaStatus } = loadChatQuotaModule();

  // 携带合法有效的 session token
  const authedReq = new Request("http://localhost:3000/api-chat-backend", {
    headers: {
      cookie: "studio_session=valid-user-token",
      "x-forwarded-for": "192.168.1.100",
    },
  });

  // 连续提问 15 次，全部放行不受 10 次限制
  for (let i = 1; i <= 15; i++) {
    const res = await consumeChatQuota(authedReq);
    assert.equal(res.allowed, true, "Authenticated user should be allowed");
    assert.equal(res.authenticated, true, "User must be authenticated");
    assert.equal(res.unlimited, true, "User quota should be unlimited");
  }

  const status = await getChatQuotaStatus(authedReq);
  assert.equal(status.authenticated, true);
  assert.equal(status.unlimited, true);
});

test("independent guests have separate daily quotas", async () => {
  const {
    GUEST_COOKIE_NAME,
    consumeChatQuota,
    getChatQuotaStatus,
    resetMemoryQuotaStore,
  } = loadChatQuotaModule();

  resetMemoryQuotaStore();

  const guestAReq = new Request("http://localhost:3000/api-chat-backend", {
    headers: {
      cookie: `${GUEST_COOKIE_NAME}=guest-device-A-12345678`,
      "x-forwarded-for": "10.0.0.1",
    },
  });

  const guestBReq = new Request("http://localhost:3000/api-chat-backend", {
    headers: {
      cookie: `${GUEST_COOKIE_NAME}=guest-device-B-87654321`,
      "x-forwarded-for": "10.0.0.2",
    },
  });

  // 访客 A 提问 3 次
  for (let i = 0; i < 3; i++) {
    await consumeChatQuota(guestAReq);
  }
  const statusA = await getChatQuotaStatus(guestAReq);
  assert.equal(statusA.remaining, 7);

  // 访客 B 依然拥有满额 10 次
  const statusB = await getChatQuotaStatus(guestBReq);
  assert.equal(statusB.remaining, 10);
});
