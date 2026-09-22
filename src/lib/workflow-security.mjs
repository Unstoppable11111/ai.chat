/**
 * 工作流安全防御核心模块 (Anti-Prompt Injection & Memory Rate Limiting)
 */

// Restrict the guard to assistant control or secret extraction, not story revisions.
const INJECTION_PATTERNS = [
  {
    pattern: /(?:ignore|forget|override|discard)\s+(?:all\s+|previous\s+|prior\s+)*(?:system|developer)\s+(?:instructions|prompts|rules)/i,
    reason: "检测到覆盖系统指令的请求",
  },
  {
    pattern: /(?:忽略|覆盖|绕过)(?:所有|之前|以上|既有|全部|的|\s)*(?:系统|开发者)(?:提示词?|指令|规则)/i,
    reason: "检测到覆盖系统指令的请求",
  },
  {
    pattern: /(you\s+are\s+now|act\s+as|pretend\s+to\s+be)\s+(an?\s+)?(unrestricted|jailbroken|dan|evil|god\s+mode|developer\s+mode)/i,
    reason: "检测到角色越狱/解除限制模式",
  },
  {
    pattern: /(你现在是|扮演一个|进入|切换到)(一个)?(不受限制|无审查|越狱|开发者|dan|上帝)模式/i,
    reason: "检测到尝试开启无审查或越狱模式",
  },
  {
    pattern: /(?:output|print|display|reveal|leak|show|read|send)\s+(?:me\s+)?(?:your\s+|the\s+)?(?:system\s+prompt|initial\s+prompt|hidden\s+rules|api[_\s]?key|process\.env(?:\.[\w]+)?|openai_api_key|deepseek_api_key|database_password|db_password)/i,
    reason: "检测到嗅探系统提示词或核心密钥指令",
  },
  {
    pattern: /(?:打印|输出|透露|显示|泄露|读取|发给我)\s*(?:你的|服务端的?|服务器的?)?(?:系统提示词|系统指令|初始设定|环境变量|api[_\s]?key|密钥|process\.env(?:\.[\w]+)?|openai_api_key|deepseek_api_key|database_password|db_password)/i,
    reason: "检测到嗅探系统指令或密钥的请求",
  },
  {
    pattern: /(?:把|将)(?:你的|服务端的?|服务器的?)?(?:系统提示词|系统指令|环境变量|api[_\s]?key|密钥)(?:完整|全部|原样|直接)?(?:输出|打印|显示|发给我|告诉我)/i,
    reason: "检测到索取系统指令或凭据的请求",
  },
  {
    pattern: /(?:解除所有限制[，,\s]*破除审查|切换到?(?:DAN|越狱|无审查)模式|act\s+as\s+(?:a\s+)?developer\s+mode)/i,
    reason: "检测到突破安全合规限制的指令",
  },
];

/**
 * 提示词注入与越狱对抗检测器 (Anti-Prompt Injection & Jailbreak Guard)
 */
export function detectPromptInjection(input) {
  if (!input || typeof input !== "string") {
    return { isSafe: true };
  }

  const text = input.trim();
  if (!text) return { isSafe: true };

  const normalized = text.toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, "");
  // Dialogue/examples are data; an explicit instruction outside the quote is still checked.
  const instructionText = normalized.replace(/((?:台词|对白|引用|示例|警告|写道|说道|说|一句)[^。\n]{0,12})[“「『"]([^”」』"\n]*)[”」』"]/g, "$1[引用内容]");

  for (const { pattern, reason } of INJECTION_PATTERNS) {
    const matches = instructionText.matchAll(new RegExp(pattern.source, "gi"));
    for (const match of matches) {
      const prefix = instructionText.slice(Math.max(0, match.index - 30), match.index);
      if (/(?:不要|不得|严禁|绝不|不会|不应|禁止|不允许|do\s+not|don't|never|must\s+not)\s*(?:再|去)?\s*$/i.test(prefix)) continue;
      return { isSafe: false, reason };
    }
  }

  return { isSafe: true };
}

// 内存滑动窗口限流缓存
const memoryRateLimits = new Map();

/**
 * 内存滑动窗口频控校验
 */
export function checkMemoryRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const record = memoryRateLimits.get(key);
  if (!record || record.resetAt <= now) {
    memoryRateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count += 1;
  return true;
}

/**
 * 清理或重置限流状态 (仅用于自动化测试或运维维护)
 */
export function resetMemoryRateLimits() {
  memoryRateLimits.clear();
}
