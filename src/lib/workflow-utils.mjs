import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getImageCooldownStatus, triggerImageCooldown, reportImageSuccess } from "./workflow-cooldown.mjs";

export const MAX_GENERATED_IMAGE_BYTES = 15 * 1024 * 1024;

function rasterFormat(extension, mimeType, width, height) {
  if (!width || !height || width > 8192 || height > 8192 || width * height > 32 * 1024 * 1024) return null;
  return { extension, mimeType, width, height };
}

export function inspectGeneratedImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length > MAX_GENERATED_IMAGE_BYTES) return null;
  if (buffer.length >= 45 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && buffer.readUInt32BE(8) === 13 && buffer.toString("ascii", 12, 16) === "IHDR" && buffer.toString("ascii", buffer.length - 8, buffer.length - 4) === "IEND") {
    return rasterFormat(".png", "image/png", buffer.readUInt32BE(16), buffer.readUInt32BE(20));
  }
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9) {
    let offset = 2;
    while (offset + 3 < buffer.length) {
      if (buffer[offset] !== 0xff) return null;
      while (buffer[offset] === 0xff) offset++;
      const marker = buffer[offset++];
      if (marker === 0xda || marker === 0xd9 || offset + 2 > buffer.length) return null;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const length = buffer.readUInt16BE(offset);
      if (length < 2 || offset + length > buffer.length) return null;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return length >= 8 ? rasterFormat(".jpg", "image/jpeg", buffer.readUInt16BE(offset + 5), buffer.readUInt16BE(offset + 3)) : null;
      }
      offset += length;
    }
  }
  if (buffer.length >= 25 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" && buffer.readUInt32LE(4) + 8 === buffer.length) {
    const chunk = buffer.toString("ascii", 12, 16);
    if (chunk === "VP8X" && buffer.length >= 30) return rasterFormat(".webp", "image/webp", buffer.readUIntLE(24, 3) + 1, buffer.readUIntLE(27, 3) + 1);
    if (chunk === "VP8L" && buffer[20] === 0x2f) {
      const dimensions = buffer.readUInt32LE(21);
      return rasterFormat(".webp", "image/webp", (dimensions & 0x3fff) + 1, ((dimensions >>> 14) & 0x3fff) + 1);
    }
    if (chunk === "VP8 " && buffer.length >= 30 && buffer.subarray(23, 26).equals(Buffer.from([0x9d, 0x01, 0x2a]))) {
      return rasterFormat(".webp", "image/webp", buffer.readUInt16LE(26) & 0x3fff, buffer.readUInt16LE(28) & 0x3fff);
    }
  }
  return null;
}

function decodeGeneratedImage(b64Data) {
  if (typeof b64Data !== "string" || b64Data.length > Math.ceil(MAX_GENERATED_IMAGE_BYTES / 3) * 4 + 100) {
    throw imageError("IMAGE_INVALID_DATA", "图片为空或超过 15 MB 限制。", 502);
  }
  const dataUri = b64Data.match(/^data:(image\/(?:png|jpeg|webp));base64,([\s\S]+)$/i);
  const encoded = dataUri ? dataUri[2] : b64Data;
  if (!encoded || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw imageError("IMAGE_INVALID_DATA", "图片服务返回的内容不是有效 Base64 图片。", 502);
  }
  const buffer = Buffer.from(encoded, "base64");
  const format = inspectGeneratedImage(buffer);
  if (!format || (dataUri && dataUri[1].toLowerCase() !== format.mimeType)) {
    throw imageError("IMAGE_INVALID_DATA", "图片内容与 PNG、JPEG 或 WebP 格式不符。", 502);
  }
  return { buffer, format };
}

function imageDestination(prefix, extension) {
  const uploadDir = path.resolve(process.env.GENERATED_ASSET_DIR || path.join(process.cwd(), "public", "generated"), "workflow");
  const safePrefix = String(prefix || "visual").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 48) || "visual";
  const filename = `${safePrefix}-${randomUUID()}${extension}`;
  return { uploadDir, fullPath: path.join(uploadDir, filename), url: `/generated/workflow/${filename}` };
}

/**
 * 将 Base64 图片数据安全存储到项目的 public/generated/workflow/ 目录中，并返回轻量可访问静态路径
 */
export function saveBase64ImageLocally(b64Data, prefix = "visual") {
  const { buffer, format } = decodeGeneratedImage(b64Data);
  const destination = imageDestination(prefix, format.extension);
  fs.mkdirSync(destination.uploadDir, { recursive: true });
  fs.writeFileSync(destination.fullPath, buffer, { flag: "wx" });
  return destination.url;
}

async function persistGeneratedImage(b64Data, prefix, signal) {
  const { buffer, format } = decodeGeneratedImage(b64Data);
  const destination = imageDestination(prefix, format.extension);
  signal.throwIfAborted();
  await fs.promises.mkdir(destination.uploadDir, { recursive: true });
  try {
    await fs.promises.writeFile(destination.fullPath, buffer, { flag: "wx", signal });
    signal.throwIfAborted();
    return { imageUrl: destination.url, width: format.width, height: format.height };
  } catch (error) {
    await fs.promises.unlink(destination.fullPath).catch(() => {});
    throw error;
  }
}

/**
 * 严格清洗并解析合法的 Base URL，彻底防止“Failed to parse URL from ...”崩溃
 */
export function resolveValidBaseUrl(rawInput) {
  const envUrl = process.env.IMAGE_API_BASE_URL || process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE || "";
  let candidate = (rawInput || "").replace(/^["']|["']$/g, "").trim();

  // 若用户未传或传空，优先使用环境变量
  if (!candidate) {
    candidate = envUrl.replace(/^["']|["']$/g, "").trim();
  }

  // 尝试规范化 URL 协议
  if (candidate && !/^https?:\/\//i.test(candidate)) {
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
 * 题材主题色调配置映射
 */
function getGenreTheme(genre = "") {
  const g = genre.toLowerCase();
  if (g.includes("科幻") || g.includes("深空") || g.includes("星际")) {
    return {
      bg1: "#030712",
      bg2: "#0f172a",
      bg3: "#0284c7",
      accent: "#38bdf8",
      glow: "#06b6d4",
      secondary: "#0284c7",
      silhouetteStyle: "scifi",
    };
  }
  if (g.includes("修仙") || g.includes("仙") || g.includes("玄幻") || g.includes("武侠")) {
    return {
      bg1: "#09090b",
      bg2: "#18181b",
      bg3: "#064e3b",
      accent: "#10b981",
      glow: "#34d399",
      secondary: "#059669",
      silhouetteStyle: "xianxia",
    };
  }
  if (g.includes("悬疑") || g.includes("惊悚") || g.includes("诡异") || g.includes("古风")) {
    return {
      bg1: "#0f051d",
      bg2: "#2e1065",
      bg3: "#4c0519",
      accent: "#f43f5e",
      glow: "#fb7185",
      secondary: "#a855f7",
      silhouetteStyle: "mystery",
    };
  }
  if (g.includes("短剧") || g.includes("爽文") || g.includes("豪门") || g.includes("逆袭")) {
    return {
      bg1: "#180802",
      bg2: "#451a03",
      bg3: "#78350f",
      accent: "#f59e0b",
      glow: "#fbbf24",
      secondary: "#d97706",
      silhouetteStyle: "urban",
    };
  }
  // 默认都市异能 / 电影质感
  return {
    bg1: "#020617",
    bg2: "#0f172a",
    bg3: "#1e1b4b",
    accent: "#6366f1",
    glow: "#818cf8",
    secondary: "#38bdf8",
    silhouetteStyle: "urban_hero",
  };
}

/**
 * 电影海报级小说封面生成器（深度融合主人公剪影、主要场景建筑与光影景深）
 */
export function generateFallbackSvgCover(title, genre, protagonist = "", scene = "") {
  let bookTitle = typeof title === "object" ? title?.title : title;
  let bookGenre = typeof title === "object" ? title?.genre : genre;
  let heroInfo = typeof title === "object" ? title?.protagonist : protagonist;
  let sceneInfo = typeof title === "object" ? title?.scene : scene;

  const safeTitle = (bookTitle || "未命名作品").replace(/[<>&"]/g, "").slice(0, 16);
  const safeGenre = (bookGenre || "都市异能").replace(/[<>&"]/g, "").slice(0, 12);
  const safeHero = (heroInfo || "命运执剑者 · 逆光行者").replace(/[<>&"]/g, "").slice(0, 24);
  const safeScene = (sceneInfo || "破晓都市天际线 · 核心裂隙").replace(/[<>&"]/g, "").slice(0, 28);

  const theme = getGenreTheme(safeGenre);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
    <defs>
      <!-- 背景纵深电影级渐变 -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${theme.bg1}" />
        <stop offset="35%" stop-color="${theme.bg2}" />
        <stop offset="65%" stop-color="${theme.bg3}" />
        <stop offset="100%" stop-color="${theme.bg1}" />
      </linearGradient>

      <!-- 电影光斑与光辉滤镜 -->
      <filter id="cinematicGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="16" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <!-- 烫金/光辉书名文字渐变 -->
      <linearGradient id="goldTitle" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="40%" stop-color="${theme.accent}" />
        <stop offset="80%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="${theme.glow}" />
      </linearGradient>

      <!-- 场景地貌渐变剪影 -->
      <linearGradient id="sceneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#020617" stop-opacity="0.95" />
      </linearGradient>
    </defs>

    <!-- 1. 底层天空与暗部 -->
    <rect width="600" height="900" fill="url(#bgGrad)" />

    <!-- 2. 背景主要场景与纵深建筑/山峦矩阵 (Scene Backdrop) -->
    <g opacity="0.45">
      <!-- 远景透视网格与光轴 -->
      <line x1="300" y1="200" x2="-100" y2="900" stroke="${theme.accent}" stroke-width="1" stroke-dasharray="4 8" />
      <line x1="300" y1="200" x2="700" y2="900" stroke="${theme.accent}" stroke-width="1" stroke-dasharray="4 8" />
      <line x1="300" y1="200" x2="300" y2="900" stroke="${theme.glow}" stroke-width="1.5" stroke-opacity="0.6" />

      <!-- 远景宏大天际线/群峰剪影 -->
      <path d="M0,600 L40,540 L80,570 L130,500 L180,560 L240,480 L300,530 L360,470 L420,550 L480,510 L540,560 L600,520 L600,900 L0,900 Z" fill="url(#sceneGrad)" />
      <!-- 近景巨型建筑/神庙断壁剪影 -->
      <path d="M-20,680 L80,630 L160,650 L220,600 L270,640 L350,590 L440,640 L520,610 L620,660 L620,900 L-20,900 Z" fill="#030712" opacity="0.85" />
    </g>

    <!-- 3. 主场景核心光环与量子裂隙 (Volumetric Lighting) -->
    <circle cx="300" cy="460" r="230" fill="none" stroke="${theme.glow}" stroke-width="1.5" stroke-dasharray="6 14" opacity="0.3" />
    <circle cx="300" cy="460" r="170" fill="none" stroke="${theme.accent}" stroke-width="2" opacity="0.4" />
    <circle cx="300" cy="460" r="90" fill="${theme.accent}" opacity="0.15" filter="url(#cinematicGlow)" />

    <!-- 4. 主人公立绘剪影 (Protagonist Hero Silhouette) - 结合风衣、长袍与破晓光效 -->
    <g transform="translate(300, 520)" filter="url(#cinematicGlow)">
      <!-- 英雄背后气场与轮廓辉光 -->
      <ellipse cx="0" cy="10" rx="42" ry="110" fill="${theme.glow}" opacity="0.3" filter="url(#cinematicGlow)" />

      <!-- 主人公英姿剪影路径 -->
      <!-- 头部与短发/斗篷轮廓 -->
      <ellipse cx="0" cy="-78" rx="14" ry="18" fill="#ffffff" opacity="0.9" />
      <!-- 飘逸风衣/战袍轮廓 -->
      <path d="M-18,-56 C-24,-40 -38,-10 -52,65 C-28,72 28,72 52,65 C38,-10 24,-40 18,-56 Z" fill="#020617" stroke="${theme.accent}" stroke-width="1.5" />
      <!-- 肩部坚毅线条 -->
      <path d="M-28,-54 L28,-54 L20,-10 L-20,-10 Z" fill="#0b132b" />
      <!-- 手中核心信物/光刃/微观时空异能辉光点 -->
      <circle cx="28" cy="-8" r="6" fill="#ffffff" filter="url(#cinematicGlow)" />
      <line x1="28" y1="-8" x2="28" y2="40" stroke="#ffffff" stroke-width="2.5" filter="url(#cinematicGlow)" />
    </g>

    <!-- 5. 顶部题材勋章与世界观注脚 -->
    <g transform="translate(300, 80)">
      <rect x="-90" y="0" width="180" height="30" rx="15" fill="rgba(255,255,255,0.06)" stroke="${theme.accent}" stroke-width="1.2" />
      <text x="0" y="19" fill="${theme.accent}" font-size="12" font-family="system-ui, sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="3">${safeGenre}</text>
    </g>

    <!-- 6. 核心视觉书名 (Book Title - Cinematic Typography) -->
    <g transform="translate(300, 260)">
      <!-- 书名投影光晕 -->
      <text x="0" y="0" fill="${theme.glow}" font-size="44" font-family="'PingFang SC', 'Microsoft YaHei', sans-serif" font-weight="900" text-anchor="middle" filter="url(#cinematicGlow)" opacity="0.8">${safeTitle}</text>
      <!-- 主书名 -->
      <text x="0" y="0" fill="url(#goldTitle)" font-size="44" font-family="'PingFang SC', 'Microsoft YaHei', sans-serif" font-weight="900" text-anchor="middle" letter-spacing="2">${safeTitle}</text>
      <!-- 副标题 / Slogan -->
      <text x="0" y="36" fill="rgba(255,255,255,0.7)" font-size="12" font-family="system-ui, sans-serif" text-anchor="middle" letter-spacing="4">ORIGINAL AI CINEMATIC NOVEL</text>
    </g>

    <!-- 7. 画面下方融合主角设定与主要场景标签 (Hero & Scene Labeling) -->
    <g transform="translate(300, 715)">
      <!-- 主角设定标签 -->
      <rect x="-180" y="0" width="360" height="24" rx="12" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
      <text x="0" y="16" fill="rgba(255,255,255,0.85)" font-size="11" font-family="system-ui, sans-serif" text-anchor="middle">
        主角：${safeHero}
      </text>
      <!-- 主要场景标签 -->
      <text x="0" y="38" fill="${theme.accent}" font-size="11" font-family="system-ui, sans-serif" text-anchor="middle" opacity="0.9">
        场景：${safeScene}
      </text>
    </g>

    <!-- 8. 底部商业精装出版腰封与工业条形码 -->
    <line x1="60" y1="785" x2="540" y2="785" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
    <g transform="translate(300, 830)">
      <text x="-160" y="10" fill="rgba(255,255,255,0.5)" font-size="10" font-family="monospace" letter-spacing="2">ISBN 978-7-900822-AI</text>
      <text x="160" y="10" fill="${theme.accent}" font-size="10" font-family="sans-serif" font-weight="bold" text-anchor="end" letter-spacing="1">CHEN TECH STUDIO</text>
      <!-- 极简工业条形码装饰 -->
      <g transform="translate(-60, -4)" fill="rgba(255,255,255,0.4)">
        <rect x="0" y="0" width="2" height="18" />
        <rect x="4" y="0" width="1" height="18" />
        <rect x="8" y="0" width="3" height="18" />
        <rect x="14" y="0" width="2" height="18" />
        <rect x="18" y="0" width="4" height="18" />
        <rect x="25" y="0" width="1" height="18" />
        <rect x="28" y="0" width="3" height="18" />
        <rect x="34" y="0" width="2" height="18" />
        <rect x="38" y="0" width="1" height="18" />
        <rect x="42" y="0" width="3" height="18" />
        <rect x="48" y="0" width="2" height="18" />
        <rect x="52" y="0" width="4" height="18" />
      </g>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 角色专属半身立绘画像生成器（可选手动确认生成后的资产）
 */
export function generateCharacterPortraitSvg(options = {}) {
  const {
    name = "主要人物",
    role = "核心主角",
    personality = "沉着决绝",
    appearance = "修长挺拔，眼神如炬",
    genre = "都市异能",
  } = options;

  const safeName = String(name).replace(/[<>&"]/g, "").slice(0, 12);
  const safeRole = String(role).replace(/[<>&"]/g, "").slice(0, 12);
  const safeTrait = String(personality).replace(/[<>&"]/g, "").slice(0, 20);
  const safeDesc = String(appearance).replace(/[<>&"]/g, "").slice(0, 28);
  const theme = getGenreTheme(genre);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="700" viewBox="0 0 500 700">
    <defs>
      <linearGradient id="charBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="50%" stop-color="${theme.bg2}" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <filter id="pGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="12" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <rect width="500" height="700" fill="url(#charBg)" rx="24" />
    <!-- 装饰光环与星座星轨 -->
    <circle cx="250" cy="300" r="180" fill="none" stroke="${theme.accent}" stroke-width="1.5" stroke-dasharray="6 8" opacity="0.3" />
    <circle cx="250" cy="300" r="130" fill="none" stroke="${theme.glow}" stroke-width="2" opacity="0.4" />
    
    <!-- 人物半身立绘轮廓 -->
    <g transform="translate(250, 360)" filter="url(#pGlow)">
      <!-- 背后光晕 -->
      <ellipse cx="0" cy="-60" rx="70" ry="110" fill="${theme.accent}" opacity="0.25" />
      <!-- 头像轮廓 -->
      <ellipse cx="0" cy="-140" rx="36" ry="46" fill="#f8fafc" opacity="0.95" />
      <!-- 头发剪影与神韵 -->
      <path d="M-40,-160 C-30,-200 30,-200 40,-160 C30,-120 10,-115 0,-115 C-10,-115 -30,-120 -40,-160 Z" fill="#0f172a" />
      <!-- 身形战袍与领带/领口 -->
      <path d="M-65,-80 C-45,-120 45,-120 65,-80 L80,160 L-80,160 Z" fill="#0f172a" stroke="${theme.accent}" stroke-width="2" />
      <path d="M-30,-75 L0,-10 L30,-75 Z" fill="${theme.bg3}" />
      <!-- 异能核心/信物辉光 -->
      <circle cx="0" cy="-10" r="8" fill="${theme.glow}" filter="url(#pGlow)" />
    </g>

    <!-- 顶部角色身份铭牌 -->
    <rect x="35" y="35" width="430" height="60" rx="16" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" />
    <text x="60" y="72" fill="#ffffff" font-size="22" font-family="system-ui, sans-serif" font-weight="900">${safeName}</text>
    <rect x="180" y="52" width="90" height="24" rx="12" fill="${theme.accent}" opacity="0.2" />
    <text x="225" y="68" fill="${theme.accent}" font-size="11" font-family="system-ui, sans-serif" font-weight="bold" text-anchor="middle">${safeRole}</text>

    <!-- 底部人物属性与外貌卡片 -->
    <rect x="35" y="550" width="430" height="115" rx="18" fill="rgba(2,6,23,0.85)" stroke="${theme.accent}" stroke-width="1.2" />
    <text x="55" y="585" fill="${theme.glow}" font-size="13" font-family="system-ui, sans-serif" font-weight="bold">性格特质：<tspan fill="#f1f5f9" font-weight="normal">${safeTrait}</tspan></text>
    <text x="55" y="615" fill="${theme.glow}" font-size="13" font-family="system-ui, sans-serif" font-weight="bold">外貌气场：<tspan fill="rgba(255,255,255,0.8)" font-weight="normal">${safeDesc}</tspan></text>
    <text x="55" y="645" fill="rgba(255,255,255,0.4)" font-size="10" font-family="monospace">ORIGINAL CHARACTER VISUAL ASSET · AI CERTIFIED</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 场景专属概念图生成器（可选手动确认生成后的资产）
 */
export function generateSceneConceptSvg(options = {}) {
  const {
    sceneTitle = "核心高能场景",
    atmosphere = "暗夜暴雨，警笛回荡",
    elements = "废旧诊所，微观量子光波",
    genre = "都市异能",
  } = options;

  const safeTitle = String(sceneTitle).replace(/[<>&"]/g, "").slice(0, 16);
  const safeAtmo = String(atmosphere).replace(/[<>&"]/g, "").slice(0, 24);
  const safeElem = String(elements).replace(/[<>&"]/g, "").slice(0, 28);
  const theme = getGenreTheme(genre);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="450" viewBox="0 0 700 450">
    <defs>
      <linearGradient id="scBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="50%" stop-color="${theme.bg2}" />
        <stop offset="100%" stop-color="${theme.bg1}" />
      </linearGradient>
      <filter id="scGlow">
        <feGaussianBlur stdDeviation="10" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <rect width="700" height="450" fill="url(#scBg)" rx="20" />
    <!-- 场景光影结构与透视线条 -->
    <g opacity="0.5">
      <line x1="350" y1="120" x2="-50" y2="450" stroke="${theme.accent}" stroke-width="1.5" />
      <line x1="350" y1="120" x2="750" y2="450" stroke="${theme.accent}" stroke-width="1.5" />
      <circle cx="350" cy="180" r="140" fill="none" stroke="${theme.glow}" stroke-width="1" stroke-dasharray="8 8" />
    </g>
    <!-- 场景地貌轮廓与建筑物剪影 -->
    <path d="M0,320 L100,260 L180,280 L280,210 L380,270 L480,230 L580,290 L700,250 L700,450 L0,450 Z" fill="#030712" opacity="0.9" />
    <!-- 核心异象/光束发散 -->
    <line x1="350" y1="0" x2="350" y2="350" stroke="${theme.glow}" stroke-width="3" filter="url(#scGlow)" opacity="0.7" />
    <circle cx="350" cy="270" r="16" fill="#ffffff" filter="url(#scGlow)" />

    <!-- 顶部场景卡片铭牌 -->
    <rect x="30" y="30" width="340" height="46" rx="14" fill="rgba(0,0,0,0.6)" stroke="${theme.accent}" stroke-width="1" />
    <text x="50" y="60" fill="#ffffff" font-size="17" font-family="system-ui, sans-serif" font-weight="bold">${safeTitle}</text>
    <text x="240" y="58" fill="${theme.accent}" font-size="11" font-family="monospace">SCENE CONCEPT</text>

    <!-- 底部环境氛围描述 -->
    <rect x="30" y="360" width="640" height="60" rx="14" fill="rgba(2,6,23,0.85)" stroke="rgba(255,255,255,0.15)" />
    <text x="50" y="386" fill="${theme.glow}" font-size="12" font-family="system-ui, sans-serif" font-weight="bold">环境氛围：<tspan fill="#e2e8f0" font-weight="normal">${safeAtmo}</tspan></text>
    <text x="50" y="406" fill="rgba(255,255,255,0.7)" font-size="11" font-family="system-ui, sans-serif">核心视觉要素：${safeElem}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 题材风格专属艺术词典
 */
function getGenreArtStyle(genre = "", style = "") {
  const g = (genre + " " + style).toLowerCase();

  // 1. 悬疑古风 / 武侠 / 江湖 / 刺客
  if (g.includes("古风") || g.includes("武侠") || g.includes("江湖") || g.includes("刀") || g.includes("剑")) {
    return {
      era: "ancient Ming-Tang dynasty oriental world, rain-soaked ancient tile roofs, traditional wooden architecture, misty night alley",
      costume: "traditional dark embroidered silk Hanfu robes, leather wristguards, flowing black hair with wooden hairpin, bamboo hat silhouette",
      props: "cold glinting curved steel Dao blade, raindrop ripples, eerie dim paper lantern glow",
      atmosphere: "dark oriental gothic aesthetic, atmospheric Jianghu film still, cinematic chiaroscuro, volumetric moonlight through heavy mist",
      negative: "modern clothing, casual clothes, western fantasy, medieval knight, anime, cartoon, deformed hands, distorted face, blurry, text, words, watermark, logo, Chinese characters, calligraphy",
    };
  }

  // 2. 修仙 / 玄幻 / 仙侠
  if (g.includes("修仙") || g.includes("仙侠") || g.includes("玄幻") || g.includes("宗门")) {
    return {
      era: "mythical Eastern celestial realm, floating immortal mountain peaks, towering ancient daoist temples in sea of clouds",
      costume: "flowing white and azure celestial robes with golden embroidery, ethereal jade pendants, wind-swept long hair",
      props: "flying spiritual sword enveloped in blue lightning, glowing golden talisman runes, celestial energy aura",
      atmosphere: "majestic mythical fantasy, god rays breaking through celestial clouds, ethereal lighting, Octane Render, 8k IMAX scale",
      negative: "modern suit, t-shirt, cars, modern architecture, western armor, text, letters, watermark, bad hands, low resolution",
    };
  }

  // 3. 悬疑惊悚 / 诡异怪谈 / 破案
  if (g.includes("悬疑") || g.includes("惊悚") || g.includes("诡异") || g.includes("推理")) {
    return {
      era: "shadowy neo-noir crime scene, gloomy rain-slicked cobblestone street, flickering gas lamp or streetlights",
      costume: "dramatic dark trench coat, shadow-draped silhouette, sharp penetrating gaze",
      props: "mysterious vintage pocket watch, bloody sealed envelope, enigmatic shattered glass",
      atmosphere: "Hitchcockian psychological suspense, deep obsidian shadows, moody cyan and amber split lighting, film grain, photorealistic 8k",
      negative: "bright joyful colors, cartoon, cute, funny, deformed, text, watermark, signature",
    };
  }

  // 4. 科幻 / 赛博朋克 / 星际
  if (g.includes("科幻") || g.includes("赛博") || g.includes("星际") || g.includes("太空")) {
    return {
      era: "futuristic cyberpunk megacity, towering holographic billboards, neon-drenched rainy skyscraper canyons",
      costume: "sleek tactical cyber-exosuit, carbon fiber armor plates, cybernetic ocular implant",
      props: "glowing cyan plasma firearm, quantum energy orb, floating holographic interfaces",
      atmosphere: "dramatic sci-fi neo-noir, anamorphic lens flare, dense volumetric smog, Unreal Engine 5 render, raytracing 8k",
      negative: "ancient temple, horses, swords, medieval robes, cartoon, low quality, text, watermark",
    };
  }

  // 默认：都市异能 / 电影爽文
  return {
    era: "contemporary nocturnal metropolis, rainy glass skyscrapers, asphalt reflecting red and amber city lights",
    costume: "sharp modern tailored dark coat or surgeon surgical attire, intense focused expression",
    props: "subtle glowing blue quantum aura around fingertips, metallic precision surgical blade, floating time-reversal particles",
    atmosphere: "high-budget Hollywood cinematic key visual, dynamic low-angle composition, dramatic rim lighting, photorealistic 8k",
    negative: "amateur drawing, cartoon, anime, lowres, deformed limbs, watermark, text, signature, letters",
  };
}

/**
 * 根据全书大纲 Bible 智能提炼电影级商业海报 Prompt (深度贴合题材风格，杜绝乱码文字)
 */
export function buildCinematicCoverPrompt(options = {}) {
  const {
    title = "未命名故事",
    genre = "都市异能",
    protagonist = "",
    mainScene = "",
    style = "cinematic illustration",
    worldview = "",
    plot = "",
    coreConflict = "",
  } = options;

  const cleanTitle = String(title).replace(/[《》]/g, "").trim();
  const heroDescription = protagonist
    ? String(protagonist).replace(/[《》（）()]/g, " ").trim()
    : "charismatic protagonist";
  const sceneDescription = mainScene
    ? String(mainScene).replace(/[《》（）()]/g, " ").trim()
    : "dramatic key setting";

  // 统一使用已验证成功的 "Generate an image of " 标准前缀，确保 gemini-web-to-api 100% 触发多模态生图通道
  return `Generate an image of a novel book cover for "${cleanTitle}". Genre: ${genre}. Visual style: ${style}. World setting: ${worldview}. Protagonist appearance and identity: ${heroDescription}. Key setting: ${sceneDescription}. Actual story context: ${plot}. Central conflict: ${coreConflict}. Keep the character's described appearance consistent. Portrait cover composition with room for a title overlay, clear focal subject, no rendered text, no watermark, no logo.`;
}

/**
 * 构造全英文影视级立绘与场景概念图 Prompt (精炼聚焦，突出角色与场景特征)
 */
export function buildEnglishAssetPrompt(options = {}) {
  const {
    type = "character",
    name = "角色",
    role = "",
    personality = "",
    appearance = "",
    genre = "都市异能",
    description = "",
    style = "cinematic illustration",
    worldview = "",
    plot = "",
  } = options;

  if (type === "character") {
    const traitDesc = [role, personality, appearance].filter(Boolean).join(", ");
    return `Generate an image of a character portrait illustration of ${name}. Genre: ${genre}. Visual style: ${style}. World setting: ${worldview}. Character identity, personality and full appearance: ${traitDesc}. Additional character details: ${description}. Actual story context: ${plot}. Preserve all specified facial features, clothing, age and identifying details. Portrait composition, coherent lighting, no text, no watermark, no logo.`;
  }

  // 场景概念图
  return `Generate an image of a scene concept illustration of "${name}". Genre: ${genre}. Visual style: ${style}. World setting: ${worldview}. Atmosphere: ${personality}. Environment: ${appearance}. Scene details: ${description}. Actual story context: ${plot}. Show the described location, events and characters consistently with the story. Landscape composition, coherent lighting, no text, no watermark, no logo.`;
}

/**
 * 构造全球顶尖 FLUX.1 开源出图引擎高清渲染 URL
 */
export function buildFluxImageUrl(prompt, options = {}) {
  const width = options.width || 768;
  const height = options.height || 1024;
  const seed = options.seed || Math.floor(Math.random() * 10000000);
  const enhance = options.enhance ?? true;
  const safePrompt = String(prompt || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, 1000);
  const encoded = encodeURIComponent(safePrompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=flux&nologo=true&enhance=${enhance}&private=true&safe=true&seed=${seed}`;
}

/**
 * 探测生图接口响应状态（短超时 7 秒，检测排队与限流，避免无休止挂起）
 */
export async function probeImageUrl(url, timeoutMs = 7000) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "image/*, */*",
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    // 429 过于频繁、503 服务不可用/队列满、500 服务端内部错误
    if (res.status === 429 || res.status === 503 || res.status === 500) {
      return { ok: false, status: res.status, isBusy: true };
    }

    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("image")) {
      return { ok: true, status: 200, isBusy: false };
    }

    return { ok: false, status: res.status, isBusy: true };
  } catch (err) {
    // 超时说明排队过长或网络阻塞
    return { ok: false, status: 408, isBusy: true, error: err?.name || "Timeout" };
  }
}

const LOCAL_IMAGE_ENDPOINT = "http://127.0.0.1:4981/openai/v1";
const activeProviderKey = Symbol.for("chen-workflow-image-active-providers");
const activeProviders = globalThis[activeProviderKey] || (globalThis[activeProviderKey] = new Set());

function imageError(code, message, status = 502, retryAfter = 0) {
  return Object.assign(new Error(message), { code, status, retryAfter });
}

function normalizeImageEndpoint(value) {
  let parsed;
  try {
    parsed = new URL(String(value).trim());
  } catch {
    throw imageError("IMAGE_CONFIG_INVALID", "生图服务地址配置无效。", 503);
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw imageError("IMAGE_CONFIG_INVALID", "生图服务地址不能包含凭据、查询参数或片段。", 503);
  }
  const local = ["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname) && parsed.port === "4981";
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && local)) {
    throw imageError("IMAGE_CONFIG_INVALID", "远程生图服务必须使用 HTTPS。", 503);
  }
  return { endpoint: parsed.href.replace(/\/+$/, ""), local, provider: parsed.origin };
}

export function resolveImageProviders(options = {}) {
  const configuredEndpoint = process.env.IMAGE_API_BASE_URL?.trim() || LOCAL_IMAGE_ENDPOINT;
  const configured = normalizeImageEndpoint(configuredEndpoint);
  const model = String(options.model || process.env.IMAGE_MODEL || "gemini-3-pro-image").trim();
  const explicitEndpoint = typeof options.baseUrl === "string" && options.baseUrl.trim();
  if (explicitEndpoint) {
    const custom = normalizeImageEndpoint(explicitEndpoint);
    const key = typeof options.apiKey === "string" ? options.apiKey.trim() : "";
    const serverKeys = [process.env.IMAGE_API_KEY, process.env.OPENAI_API_KEY, process.env.IMAGE_FALLBACK_API_KEY].filter(Boolean);
    if (serverKeys.includes(key) && custom.endpoint !== configured.endpoint) {
      throw imageError("IMAGE_CREDENTIAL_MISMATCH", "服务端密钥不能用于其他生图网关。", 400);
    }
    if (!custom.local && !key) {
      throw imageError("IMAGE_CREDENTIAL_REQUIRED", "自定义生图网关必须提供与该地址绑定的密钥。", 400);
    }
    return [{ ...custom, apiKey: custom.local ? "" : key, model }];
  }
  if (options.apiKey) {
    throw imageError("IMAGE_CREDENTIAL_MISMATCH", "自定义生图密钥必须与服务地址一起配置。", 400);
  }
  const primaryKey = process.env.IMAGE_API_KEY?.trim() || "";
  if (!configured.local && !primaryKey) {
    throw imageError("IMAGE_CONFIG_INVALID", "请为远程生图服务配置独立的 IMAGE_API_KEY。", 503);
  }
  const providers = [{ ...configured, apiKey: configured.local ? "" : primaryKey, model }];
  if (process.env.IMAGE_FALLBACK_BASE_URL?.trim()) {
    const fallback = normalizeImageEndpoint(process.env.IMAGE_FALLBACK_BASE_URL);
    const fallbackKey = process.env.IMAGE_FALLBACK_API_KEY?.trim() || "";
    if (!fallback.local && !fallbackKey) {
      throw imageError("IMAGE_CONFIG_INVALID", "备用生图网关需要独立的 IMAGE_FALLBACK_API_KEY。", 503);
    }
    if (fallback.provider !== configured.provider && fallbackKey && fallbackKey === primaryKey) {
      throw imageError("IMAGE_CREDENTIAL_MISMATCH", "不同生图网关不能复用同一个服务端密钥。", 503);
    }
    if (fallback.endpoint !== configured.endpoint) {
      providers.push({ ...fallback, apiKey: fallback.local ? "" : fallbackKey, model: process.env.IMAGE_FALLBACK_MODEL?.trim() || model });
    }
  }
  return providers;
}

export async function getCandidateImageEndpoints() {
  return resolveImageProviders().map(({ endpoint }) => endpoint);
}

function abortable(operation, signal) {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    Promise.resolve(operation).then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}

async function readImageResponse(response, signal) {
  const limit = Math.ceil(MAX_GENERATED_IMAGE_BYTES / 3) * 4 + 65536;
  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > limit) throw imageError("IMAGE_RESPONSE_TOO_LARGE", "生图响应超过大小限制。");
  let text;
  if (response.body?.getReader) {
    const reader = response.body.getReader();
    const chunks = [];
    let bytes = 0;
    try {
      while (true) {
        const result = await abortable(reader.read(), signal);
        if (result.done) break;
        bytes += result.value.byteLength;
        if (bytes > limit) throw imageError("IMAGE_RESPONSE_TOO_LARGE", "生图响应超过大小限制。");
        chunks.push(Buffer.from(result.value));
      }
      text = Buffer.concat(chunks).toString("utf8");
    } finally {
      void reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  } else {
    text = await abortable(response.text(), signal);
    if (Buffer.byteLength(text) > limit) throw imageError("IMAGE_RESPONSE_TOO_LARGE", "生图响应超过大小限制。");
  }
  signal.throwIfAborted();
  try {
    return JSON.parse(text);
  } catch {
    throw imageError("IMAGE_INVALID_RESPONSE", "生图服务返回了无效响应，请检查网关地址和模型。");
  }
}

function imageDimensions(kind, explicitSize, actual = false) {
  const defaults = { cover: "1024x1024", character: "1024x1024", scene: "1024x1024" };
  const size = explicitSize || process.env["IMAGE_SIZE_" + kind.toUpperCase()] || defaults[kind];
  const match = String(size).match(actual ? /^(\d{1,4})x(\d{1,4})$/ : /^(\d{3,4})x(\d{3,4})$/);
  const maxSide = actual ? 8192 : 4096;
  if (!match || Number(match[1]) > maxSide || Number(match[2]) > maxSide) {
    throw imageError("IMAGE_SIZE_INVALID", "生图尺寸须为受支持的宽x高格式，单边不超过 4096。", 400);
  }
  const width = Number(match[1]);
  const height = Number(match[2]);
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const divisor = gcd(width, height);
  return { size: String(size), aspectRatio: width / divisor + ":" + height / divisor };
}

/** A single deadline covers queue checks, upstream body reads, fallback and disk writes. */
export async function generateWorkflowImage(options = {}) {
  const kind = options.kind || "cover";
  if (!["cover", "character", "scene"].includes(kind)) throw imageError("IMAGE_KIND_INVALID", "不支持的图片类型。", 400);
  const rawPrompt = String(options.prompt || "").trim();
  if (!rawPrompt || rawPrompt.length > 16000) throw imageError("IMAGE_PROMPT_INVALID", "图片提示词不能为空且不能超过 16000 字符。", 400);
  const prompt = /^generate an image/i.test(rawPrompt) ? rawPrompt : "Generate an image of " + rawPrompt;
  const dimensions = imageDimensions(kind, options.size);
  const providers = resolveImageProviders(options);
  const configuredTimeout = Number(options.timeoutMs || process.env.IMAGE_TIMEOUT_MS || 85000);
  const timeoutMs = Number.isFinite(configuredTimeout) ? Math.max(1, Math.min(110000, configuredTimeout)) : 85000;
  const controller = new AbortController();
  const onCancel = () => controller.abort(imageError("IMAGE_CANCELLED", "已取消图片生成。", 499));
  if (options.signal?.aborted) onCancel();
  else options.signal?.addEventListener("abort", onCancel, { once: true });
  const timer = setTimeout(() => controller.abort(imageError("IMAGE_TIMEOUT", "图片生成超时，请稍后重试；上游可能仍在处理本次请求。", 504)), timeoutMs);
  let lastError;
  let usageReserved = false;
  try {
    controller.signal.throwIfAborted();
    for (const provider of providers) {
      controller.signal.throwIfAborted();
      const cooldown = getImageCooldownStatus(provider.provider);
      if (cooldown.active) {
        lastError = imageError("IMAGE_COOLDOWN", "生图服务正在短暂冷却，请稍后重试。", 429, cooldown.remainingSeconds);
        continue;
      }
      if (activeProviders.has(provider.provider)) {
        lastError = imageError("IMAGE_BUSY", "生图服务正在处理另一个任务，请稍后重试。", 429, 5);
        continue;
      }
      activeProviders.add(provider.provider);
      try {
        if (!usageReserved && options.beforeRequest) {
          await abortable(options.beforeRequest(), controller.signal);
          usageReserved = true;
        }
        controller.signal.throwIfAborted();
        const headers = { "Content-Type": "application/json" };
        if (provider.apiKey) headers.Authorization = "Bearer " + provider.apiKey;
        const url = provider.endpoint.endsWith("/images/generations") ? provider.endpoint : provider.endpoint + "/images/generations";
        const response = await abortable(fetch(url, {
          method: "POST", headers, redirect: "error", signal: controller.signal,
          body: JSON.stringify({ model: provider.model, prompt, size: dimensions.size, n: 1, response_format: "b64_json" }),
        }), controller.signal);
        if (!response.ok) {
          void response.body?.cancel().catch(() => {});
          const retryHeader = response.headers.get("retry-after");
          const retrySeconds = retryHeader && /^\d+$/.test(retryHeader) ? Number(retryHeader) : 0;
          const message = response.status === 401 || response.status === 403
            ? "生图服务鉴权失败，请检查独立的图片密钥。"
            : response.status === 400 || response.status === 404 || response.status === 422
              ? "生图服务不支持当前模型、尺寸或请求参数，请检查 IMAGE_MODEL 和 IMAGE_SIZE 配置。"
              : response.status === 429 ? "上游生图服务请求过多，请稍后重试。"
                : "上游生图服务暂时不可用（HTTP " + response.status + "）。";
          const error = imageError("IMAGE_UPSTREAM_" + response.status, message, response.status === 429 ? 429 : 502, retrySeconds);
          const cooldownResult = triggerImageCooldown(error.code, provider.provider, retrySeconds);
          error.retryAfter = Math.max(error.retryAfter, cooldownResult.remainingSeconds);
          throw error;
        }
        const data = await readImageResponse(response, controller.signal);
        const b64 = data?.data?.[0]?.b64_json;
        if (!b64) {
          if (data?.data?.[0]?.url) {
            throw imageError("IMAGE_URL_UNSUPPORTED", "生图服务仅返回了临时链接；请配置网关返回 b64_json 后重试，当前图片未保存。");
          }
          throw imageError("IMAGE_EMPTY_RESULT", "模型没有返回图片，可能拒绝了请求或网关未启用生图能力。请修改描述或检查图片模型。");
        }
        const saved = await persistGeneratedImage(b64, options.prefix || kind, controller.signal);
        const actualDimensions = imageDimensions(kind, `${saved.width}x${saved.height}`, true);
        reportImageSuccess(provider.provider);
        return {
          imageUrl: saved.imageUrl,
          metadata: {
            provider: provider.provider, model: provider.model, prompt, kind,
            ...actualDimensions, width: saved.width, height: saved.height,
            requestedSize: dimensions.size, requestedAspectRatio: dimensions.aspectRatio,
          },
        };
      } catch (caught) {
        const error = controller.signal.aborted ? controller.signal.reason : caught;
        if (error?.code === "IMAGE_TIMEOUT") triggerImageCooldown("TIMEOUT", provider.provider);
        lastError = error;
        // Only explicit rejection by a busy/unavailable server can use a configured fallback.
        // Network failures and timeouts may have already started a billable generation.
        if (!/^IMAGE_UPSTREAM_(429|500|502|503|504)$/.test(error?.code || "")) throw error;
      } finally {
        activeProviders.delete(provider.provider);
      }
    }
    throw lastError || imageError("IMAGE_UNAVAILABLE", "当前没有可用的生图服务。", 503);
  } catch (error) {
    if (error?.code || error?.status) throw error;
    throw imageError("IMAGE_NETWORK_ERROR", "无法连接生图服务，请检查服务状态。", 502);
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onCancel);
  }
}

export async function callGeminiImageGeneration(options = {}) {
  return (await generateWorkflowImage(options)).imageUrl;
}

/** Resolve only known raster assets beneath a canonical configured storage root. */
export function resolveGeneratedAssetPath(pathSegments) {
  if (!Array.isArray(pathSegments) || pathSegments.length !== 2 || pathSegments[0] !== "workflow") return null;
  if (pathSegments.some(segment => typeof segment !== "string" || !/^[a-zA-Z0-9_.-]+$/.test(segment) || segment === "." || segment === "..")) return null;
  if (!/\.(png|jpe?g|webp)$/i.test(pathSegments[1])) return null;
  const roots = [
    process.env.GENERATED_ASSET_DIR,
    path.join(process.cwd(), "public", "generated"),
    path.join(process.cwd(), "shared", "generated"),
    "/www/wwwroot/chenyc/shared/generated",
    process.env.DEPLOY_PATH ? path.join(process.env.DEPLOY_PATH, "shared", "generated") : null,
  ].filter(Boolean);
  for (const root of roots) {
    try {
      const canonicalRoot = fs.realpathSync(root);
      const candidate = fs.realpathSync(path.resolve(canonicalRoot, ...pathSegments));
      const relative = path.relative(canonicalRoot, candidate);
      if (!relative || relative.startsWith(".." + path.sep) || relative === ".." || path.isAbsolute(relative)) continue;
      const stat = fs.statSync(candidate);
      if (stat.isFile() && stat.size <= MAX_GENERATED_IMAGE_BYTES && stat.size > 0) return candidate;
    } catch {
      // A deployment may expose only one of these storage roots.
    }
  }
  return null;
}
