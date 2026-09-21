/**
 * 自动化小说 & AI 视频分镜工作流通用工具函数
 */

/**
 * 严格清洗并解析合法的 Base URL，彻底防止“Failed to parse URL from ...”崩溃
 */
export function resolveValidBaseUrl(rawInput) {
  const envUrl = process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE || "";
  let candidate = (rawInput || "").trim();

  // 若用户未传或传空，优先使用环境变量
  if (!candidate) {
    candidate = envUrl.trim();
  }

  // 尝试规范化 URL 协议
  if (candidate && !/^https?:\/\//i.test(candidate)) {
    // 若 candidate 包含点号或冒号，可能为域名或主机端口，补齐 https://
    if (candidate.includes(".") || candidate.includes(":")) {
      candidate = `https://${candidate}`;
    }
  }

  // 验证 candidate 是否合法
  try {
    if (candidate) {
      const parsed = new URL(candidate);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return candidate.replace(/\/+$/, "");
      }
    }
  } catch {
    // 候选值不合法，继续回退
  }

  // 回退环境变量
  try {
    if (envUrl) {
      let cleanedEnv = envUrl.trim();
      if (!/^https?:\/\//i.test(cleanedEnv)) {
        cleanedEnv = `https://${cleanedEnv}`;
      }
      const parsedEnv = new URL(cleanedEnv);
      if (parsedEnv.protocol === "http:" || parsedEnv.protocol === "https:") {
        return cleanedEnv.replace(/\/+$/, "");
      }
    }
  } catch {
    // 环境变量亦不合法
  }

  // 终极保底
  return "https://api.openai.com/v1";
}

/**
 * 优雅的科技艺术矢量封面生成器（当外部图片 API 失败或未就绪时 100% 降级保障）
 */
export function generateFallbackSvgCover(title, genre) {
  const safeTitle = (title || "未命名作品").replace(/[<>&"]/g, "").slice(0, 16);
  const safeGenre = (genre || "工业小说").replace(/[<>&"]/g, "").slice(0, 12);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="40%" stop-color="#1e1b4b" />
        <stop offset="70%" stop-color="#0369a1" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#c084fc" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="600" height="900" fill="url(#bg)" />
    <!-- 装饰网格与光环 -->
    <circle cx="300" cy="400" r="220" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.25" />
    <circle cx="300" cy="400" r="160" fill="none" stroke="#c084fc" stroke-width="2" stroke-dasharray="8 6" opacity="0.35" />
    <circle cx="300" cy="400" r="80" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.4" />
    <!-- 顶部题材徽章 -->
    <rect x="220" y="80" width="160" height="34" rx="17" fill="rgba(255,255,255,0.08)" stroke="rgba(56,189,248,0.4)" stroke-width="1" />
    <text x="300" y="102" fill="#38bdf8" font-size="14" font-family="sans-serif" font-weight="bold" text-anchor="middle">${safeGenre}</text>
    <!-- 中间作品书名 -->
    <text x="300" y="415" fill="url(#textGrad)" font-size="38" font-family="sans-serif" font-weight="900" text-anchor="middle" filter="url(#glow)">${safeTitle}</text>
    <!-- 底部出版包装线 -->
    <line x1="100" y1="760" x2="500" y2="760" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
    <text x="300" y="800" fill="rgba(255,255,255,0.6)" font-size="13" font-family="monospace" text-anchor="middle" letter-spacing="4">AI INDUSTRIAL NOVEL COLLECTION</text>
    <text x="300" y="830" fill="rgba(56,189,248,0.8)" font-size="12" font-family="sans-serif" text-anchor="middle">CHEN TECH STUDIO EXCLUSIVE</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
