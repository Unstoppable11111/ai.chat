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
      if (token === "admin-session-token") return "chen";
      return token === "valid-user-token" ? "user-mock-id" : null;
    },
    clientKey: (req) => {
      return req.headers.get("x-forwarded-for") || "ip-mock-client";
    },
  };

  const mockAuthDb = {
    isSuperAdmin: async (uid) => uid === "chen" || uid === "admin-user-id",
  };

  const sandbox = {
    module: targetModule,
    exports,
    require: (id) => {
      if (id === "./db") return mockDb;
      if (id === "./server-security") return mockServerSecurity;
      if (id === "./auth-db") return mockAuthDb;
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

test("consumeChatQuota restricts guest to 3 questions per day and requires login on 4th", async () => {
  const {
    GUEST_CHAT_DAILY_LIMIT,
    GUEST_COOKIE_NAME,
    consumeChatQuota,
    getChatQuotaStatus,
    resetMemoryQuotaStore,
  } = loadChatQuotaModule();

  resetMemoryQuotaStore();
  assert.equal(GUEST_CHAT_DAILY_LIMIT, 3);

  const testGuestToken = "test-guest-device-unique-token-999";
  const mockReq = new Request("http://localhost:3000/api-chat-backend", {
    headers: {
      cookie: `${GUEST_COOKIE_NAME}=${testGuestToken}`,
      "x-forwarded-for": "192.168.1.100",
    },
  });

  // 前 3 次提问必须全部成功，remaining 依次从 2 递减到 0
  for (let i = 1; i <= GUEST_CHAT_DAILY_LIMIT; i++) {
    const result = await consumeChatQuota(mockReq);
    assert.equal(result.allowed, true, `Attempt #${i} should be allowed`);
    assert.equal(result.authenticated, false, "Should be guest");
    assert.equal(result.remaining, GUEST_CHAT_DAILY_LIMIT - i, `Remaining should be ${GUEST_CHAT_DAILY_LIMIT - i}`);
  }

  // 状态查询应显示 0 次可用
  const status = await getChatQuotaStatus(mockReq);
  assert.equal(status.remaining, 0, "Guest remaining quota should be 0");
  assert.equal(status.used, 3, "Guest used quota should be 3");

  // 第 4 次提问必须被拦截，并返回 requireLogin
  const blockedResult = await consumeChatQuota(mockReq);
  assert.equal(blockedResult.allowed, false, "Attempt #4 must be blocked");
  assert.equal(blockedResult.requireLogin, true, "Must require login");
  assert.equal(blockedResult.remaining, 0);
  assert.ok(blockedResult.message.includes("登录"), "Message should mention login");
});

test("super admin chen bypasses daily limit completely", async () => {
  const { consumeChatQuota, getChatQuotaStatus } = loadChatQuotaModule();

  // 携带管理员 session token
  const adminReq = new Request("http://localhost:3000/api-chat-backend", {
    headers: {
      cookie: "studio_session=admin-session-token",
      "x-forwarded-for": "192.168.1.100",
    },
  });

  // 连续提问 15 次，全部放行不受限制
  for (let i = 1; i <= 15; i++) {
    const res = await consumeChatQuota(adminReq);
    assert.equal(res.allowed, true, "Super admin user should be allowed");
    assert.equal(res.authenticated, true, "User must be authenticated");
    assert.equal(res.unlimited, true, "User quota should be unlimited");
  }

  const status = await getChatQuotaStatus(adminReq);
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

  // 访客 A 提问 2 次
  for (let i = 0; i < 2; i++) {
    await consumeChatQuota(guestAReq);
  }
  const statusA = await getChatQuotaStatus(guestAReq);
  assert.equal(statusA.remaining, 1);

  // 访客 B 依然拥有满额 3 次
  const statusB = await getChatQuotaStatus(guestBReq);
  assert.equal(statusB.remaining, 3);
});

test("consumeZiweiQuota restricts guest to 3 free AI interpretations and requires login on 4th", async () => {
  const {
    GUEST_ZIWEI_LIMIT,
    GUEST_COOKIE_NAME,
    consumeZiweiQuota,
    getZiweiQuotaStatus,
    resetMemoryQuotaStore,
  } = loadChatQuotaModule();

  resetMemoryQuotaStore();
  assert.equal(GUEST_ZIWEI_LIMIT, 3);

  const guestReq = new Request("http://localhost:3000/api-ziwei", {
    headers: {
      cookie: `${GUEST_COOKIE_NAME}=ziwei-guest-token-1234567890`,
      "x-forwarded-for": "192.168.88.10",
    },
  });

  // 前 3 次必须放行，remaining 从 2 递减到 0
  for (let i = 1; i <= 3; i++) {
    const res = await consumeZiweiQuota(guestReq);
    assert.equal(res.allowed, true, `Ziwei attempt #${i} should be allowed`);
    assert.equal(res.authenticated, false);
    assert.equal(res.remaining, 3 - i);
  }

  const statusAfter3 = await getZiweiQuotaStatus(guestReq);
  assert.equal(statusAfter3.remaining, 0);
  assert.equal(statusAfter3.used, 3);

  // 第 4 次必须拦截并要求登录
  const fourthAttempt = await consumeZiweiQuota(guestReq);
  assert.equal(fourthAttempt.allowed, false, "4th attempt must be blocked");
  assert.equal(fourthAttempt.requireLogin, true, "4th attempt must require login");
  assert.equal(fourthAttempt.remaining, 0);

  // 超级管理员 chen 不受 3 次限制
  const adminReq = new Request("http://localhost:3000/api-ziwei", {
    headers: {
      cookie: "studio_session=admin-session-token",
      "x-forwarded-for": "192.168.88.10",
    },
  });
  for (let i = 1; i <= 5; i++) {
    const authedRes = await consumeZiweiQuota(adminReq);
    assert.equal(authedRes.allowed, true);
    assert.equal(authedRes.authenticated, true);
    assert.equal(authedRes.unlimited, true);
  }
});
