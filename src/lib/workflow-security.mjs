/**
 * 工作流安全防御核心模块 (Anti-Prompt Injection & Memory Rate Limiting)
 */

// 常见提示词注入与越狱对抗特征库
const INJECTION_PATTERNS = [
  {
    pattern: /(ignore|forget|override|discard)\s+(all\s+|previous\s+|above\s+|prior\s+|system\s+|existing\s+)*(instructions|prompts|rules|commands|constraints)/i,
    reason: "检测到指令覆盖/忽略既有设定请求",
  },
  {
    pattern: /忽略(所有|之前|以上|既有|过去|全部|\s)*(的)?(指令|系统提示|提示词|设定|规则|限制)/i,
    reason: "检测到忽略既有系统设定的对抗指令",
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
    pattern: /(output|print|display|reveal|leak|show)\s+(your\s+)?(system\s+prompt|instructions|initial\s+prompt|hidden\s+rules|api[_\s]?key)/i,
    reason: "检测到嗅探系统提示词或核心密钥指令",
  },
  {
    pattern: /(打印|输出|透露|显示|泄露)(你的)?(系统提示词|系统指令|初始设定|环境变量|api[_\s]?key|密钥)/i,
    reason: "检测到嗅探系统指令或密钥的请求",
  },
  {
    pattern: /(process\.env|openai_api_key|deepseek_api_key|database_password|db_password)/i,
    reason: "检测到敏感环境变量探测关键字",
  },
  {
    pattern: /(解除所有限制|破除审查|不受任何限制|无视道德准则)/i,
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

  const normalized = text.toLowerCase().replace(/[\s\u200B-\u200D\uFEFF]+/g, " ");

  for (const { pattern, reason } of INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
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
