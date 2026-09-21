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
    style = "电影质感",
    worldview = "",
    protagonist = "",
    mainScene = "",
    coreConflict = "",
  } = options;

  const artStyle = getGenreArtStyle(genre, style);

  // 清洗主角与场景描述中的中文杂质，转换为核心视觉描述
  const heroDescription = protagonist
    ? protagonist.replace(/[《》（）()]/g, " ").slice(0, 100)
    : "lone charismatic protagonist";
  const sceneDescription = mainScene
    ? mainScene.replace(/[《》（）()]/g, " ").slice(0, 100)
    : artStyle.era;

  const cleanTitle = String(title).replace(/[《》]/g, "").trim();
  const prompt = [
    `Award-winning cinematic official movie poster key visual.`,
    cleanTitle ? `Story theme: "${cleanTitle}".` : "",
    `Genre & Era: ${artStyle.era}.`,
    `Protagonist: ${heroDescription}, wearing ${artStyle.costume}, ${artStyle.props}.`,
    `Setting & Environment: ${sceneDescription}.`,
    `Cinematic Atmosphere: ${artStyle.atmosphere}.`,
    `Visual Specs: dynamic low-angle wide shot, volumetric atmospheric lighting, deep contrast chiaroscuro, Unreal Engine 5 render, ray-tracing, photorealistic 8k resolution, masterpiece, intricate textures, IMAX cinematic film still.`,
    `Strict Negative: ${artStyle.negative}, no text, no title, no letters, no typography, no subtitles, no watermark, no logo, no frame, clean pure artwork only.`,
  ].filter(Boolean).join(" ");

  return prompt.trim();
}

/**
 * 构造全英文影视级立绘与场景概念图 Prompt (彻底剔除中文乱码，注入具体电影级视觉要素)
 */
export function buildEnglishAssetPrompt(options = {}) {
  const {
    type = "character",
    role = "",
    personality = "",
    appearance = "",
    genre = "都市异能",
  } = options;

  const artStyle = getGenreArtStyle(genre);

  if (type === "character") {
    const traitDesc = [role, personality, appearance].filter(Boolean).join(", ");
    return [
      `Award-winning cinematic character portrait photography.`,
      `Subject: charismatic character in ${artStyle.costume}, detailed facial expression, sharp gaze.`,
      traitDesc ? `Visual Character Aura: ${traitDesc}.` : "",
      `Genre & Setting: ${artStyle.era}.`,
      `Key props: ${artStyle.props}.`,
      `Lighting & Mood: cinematic dramatic rim lighting, atmospheric volumetric lighting, shallow depth of field, 85mm portrait lens, ${artStyle.atmosphere}.`,
      `Quality: photorealistic 8k, highly detailed skin texture, Unreal Engine 5 render, Octane Render masterpiece.`,
      `Strict Negative: ${artStyle.negative}, no text, no letters, no watermark, no logo, clean artwork only.`,
    ].filter(Boolean).join(" ");
  }

  // 场景概念图
  return [
    `Cinematic wide-angle environment concept art.`,
    `Environment: panoramic cinematic view of ${artStyle.era}.`,
    `Key landmarks & details: rain-slicked surfaces, towering architectural depth, atmospheric mist, ${artStyle.props}.`,
    `Lighting & Atmosphere: ${artStyle.atmosphere}, dramatic volumetric shafts of light, cinematic chiaroscuro, 35mm wide lens.`,
    `Quality: 8k resolution, IMAX film still, photorealistic textures, Unreal Engine 5 render, award-winning illustration.`,
    `Strict Negative: ${artStyle.negative}, no text, no title, no letters, no watermark, no logo, clean artwork only.`,
  ].join(" ");
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

