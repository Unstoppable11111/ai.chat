/**
 * AI Image Generation Load Balancer
 * 双通道高可用生图负载均衡器：
 * - 通道 1: Cloudflare Workers AI (@cf/black-forest-labs/flux-1-schnell / SDXL)
 * - 通道 2: Pollinations.ai (FLUX.1 / Turbo 真实推理引擎)
 * 
 * 支持 Round-Robin 轮询均衡 + 毫秒级故障自动容灾降级切换 (Automatic Failover)
 */

import fs from "node:fs";
import path from "node:path";

let roundRobinCounter = 0;

/**
 * 格式化提示词，去除特殊控制字符并确保长度安全
 */
export function sanitizePrompt(prompt) {
  if (typeof prompt !== "string") return "";
  return prompt.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, "").slice(0, 4000);
}

/**
 * 针对 FLUX.1 (T5-XXL 编码器) 核心视觉模型的高精度提示词智能翻译、光影增强与防文字污染过滤器
 * @param {string} rawPrompt 原始用户提示词
 * @param {string} [style="none"] 预设风格
 * @returns {string} 优化后的高质量 FLUX 英文提示词
 */
export function enhancePromptForFlux(rawPrompt, style = "none") {
  const sanitized = sanitizePrompt(rawPrompt);
  if (!sanitized) return "";

  let prompt = sanitized;

  // 1. 中文常见概念智能转写（消除 T5 编码器对中文汉字的文字招牌幻觉）
  const TRANSLATIONS = [
    [/咖啡猫|加菲猫/g, "Garfield, adorable plump orange tabby cat, fluffy ginger fur, expressive charming eyes, cozy warm lighting"],
    [/波斯猫/g, "fluffy white Persian cat, striking copper eyes, silky long coat"],
    [/布偶猫/g, "gorgeous Ragdoll cat, sapphire blue eyes, fluffy plush coat"],
    [/小猫|猫咪|猫/g, "cute domestic cat, detailed fur texture, curious glowing eyes, soft natural lighting"],
    [/柯基/g, "cute Welsh Corgi dog, fluffy coat, happy smiling expression, perky ears"],
    [/柴犬/g, "adorable Shiba Inu dog, spirited expression, curled tail, natural lighting"],
    [/小狗|狗狗|狗/g, "adorable domestic dog, glossy fur, expressive eyes, playful stance"],
    [/白衣仙侠|剑仙|仙侠|修真|修仙/g, "charismatic Chinese immortal cultivator in flowing pure white silk robes, ethereal glowing jade sword, misty mountain peaks, ethereal aura"],
    [/赛博朋克|赛博/g, "cyberpunk aesthetic, vibrant neon reflections, futuristic megacity street, holographic displays, volumetric haze"],
    [/戴森球|戴森环/g, "colossal sci-fi Dyson ring megastructure encircling a radiant star, epic interstellar cosmic scale, hard sci-fi"],
    [/微距|露珠/g, "macro photography, crystal clear morning water dew drop on succulent plant, reflective mini galaxy, soft morning bokeh"],
    [/水墨|国风/g, "traditional Chinese ink wash painting aesthetic, poetic misty atmosphere, dynamic black and vermilion brushwork, elegant negative space"],
    [/机甲|机器人/g, "sleek futuristic battle exoskeleton robot, carbon fiber plating, glowing cyan energy core, intricate mechanical joints"],
    [/飞艇|蒸汽朋克/g, "steampunk brass airship breaking through storm clouds, intricate copper gears and steam exhaust, sunset golden hour"],
    [/美女|少女|女孩/g, "stunningly beautiful young woman, graceful posture, natural skin texture, delicate facial features, gentle rim lighting"],
    [/帅哥|少年|男主/g, "handsome charismatic young protagonist, sharp determined gaze, cinematic lighting"],
    [/星空|深空|宇宙/g, "breathtaking deep space cosmos, swirling colorful nebulae, distant glowing galaxies"],
    [/海报|封面/g, "cinematic master key visual, epic composition, dramatic lighting"],
    [/雨夜/g, "nocturnal rainy street, asphalt reflections, cinematic rim lighting"],
  ];

  for (const [regex, replacement] of TRANSLATIONS) {
    if (regex.test(prompt)) {
      prompt = prompt.replace(regex, replacement);
    }
  }

  // 2. 风格增益修饰词
  const STYLE_MODIFIERS = {
    cinematic: "cinematic film still, 35mm photograph, dramatic volumetric rim lighting, shallow depth of field, anamorphic lens flare, award-winning cinematography, photorealistic 8k",
    anime: "Makoto Shinkai anime aesthetic, vibrant high-contrast colors, atmospheric luminous lighting, exquisitely detailed digital artwork, master illustration",
    photorealistic: "hyperrealistic 8k photography, Hasselblad medium format camera, natural authentic textures, soft studio lighting, ultra-sharp focus, highly detailed",
    cyberpunk: "cyberpunk neo-noir visual, dense rainy street, glowing neon signs reflections, dark moody atmosphere, volumetric haze, octane render",
    fantasy: "epic high-fantasy digital concept art, glowing magical particles, majestic scale, ethereal lighting, grand atmosphere, ArtStation trending",
    ink: "traditional Chinese master ink wash painting, dynamic black and vermilion brushwork, atmospheric mist, elegant negative space, museum quality",
    none: "masterpiece, ultra-detailed, sharp focus, 8k resolution, professional photography, natural lighting",
  };

  const modifier = STYLE_MODIFIERS[style] || STYLE_MODIFIERS.none;

  // 3. 严格排斥文字的 Guardrail（防止 FLUX 生成乱码汉字、字体招牌和水印）
  const qualityGuardrail = "masterpiece, best quality, highly detailed, clean composition";
  const antiTextGuardrail = "no text, no letters, no words, no signs, no typography, no watermark, no signature, no username, no logo";

  // 组合最终提示词
  return `${prompt}, ${modifier}, ${qualityGuardrail}, ${antiTextGuardrail}`;
}

/**
 * 解析并获取 Cloudflare 凭据（优先级：显式入参 > 环境变量 > .runtime 持久化配置）
 */
export function resolveCloudflareCredentials(options = {}) {
  let accountId = (options.cfAccountId || process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
  let token = (options.cfApiToken || process.env.CLOUDFLARE_API_TOKEN || "").trim();

  if (!accountId || !token) {
    try {
      const runtimePath = path.resolve(process.cwd(), ".runtime", "image-credentials.json");
      if (fs.existsSync(runtimePath)) {
        const raw = fs.readFileSync(runtimePath, "utf8");
        const parsed = JSON.parse(raw);
        accountId = accountId || (parsed.CLOUDFLARE_ACCOUNT_ID || "").trim();
        token = token || (parsed.CLOUDFLARE_API_TOKEN || "").trim();
      }
    } catch {
      // 容错处理
    }
  }

  return { accountId, token, ready: Boolean(accountId && token) };
}

/**
 * 持久化 Cloudflare 凭据至服务器内存与运行时配置
 */
export function saveCloudflareCredentials({ accountId, token }) {
  const cleanId = (accountId || "").trim();
  const cleanToken = (token || "").trim();
  if (!cleanId || !cleanToken) {
    throw new Error("Cloudflare Account ID 与 Token 不能为空");
  }

  // 1. 同步到内存环境变量
  process.env.CLOUDFLARE_ACCOUNT_ID = cleanId;
  process.env.CLOUDFLARE_API_TOKEN = cleanToken;

  // 2. 持久化到 .runtime/image-credentials.json
  try {
    const runtimeDir = path.resolve(process.cwd(), ".runtime");
    if (!fs.existsSync(runtimeDir)) fs.mkdirSync(runtimeDir, { recursive: true });
    const configPath = path.join(runtimeDir, "image-credentials.json");
    fs.writeFileSync(configPath, JSON.stringify({
      CLOUDFLARE_ACCOUNT_ID: cleanId,
      CLOUDFLARE_API_TOKEN: cleanToken,
      updatedAt: new Date().toISOString(),
    }, null, 2), "utf8");
  } catch (err) {
    console.warn("[ImageBalancer] 写入 runtime 配置失败:", err.message);
  }

  // 3. 尝试更新或创建 .env.local（测试环境下跳过以避免文件污染）
  if (process.env.NODE_ENV !== "test") {
    try {
      const envPath = path.resolve(process.cwd(), ".env.local");
      let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
      if (content.includes("CLOUDFLARE_ACCOUNT_ID")) {
        content = content
          .replace(/CLOUDFLARE_ACCOUNT_ID=.*/g, `CLOUDFLARE_ACCOUNT_ID="${cleanId}"`)
          .replace(/CLOUDFLARE_API_TOKEN=.*/g, `CLOUDFLARE_API_TOKEN="${cleanToken}"`);
      } else {
        content += `\nCLOUDFLARE_ACCOUNT_ID="${cleanId}"\nCLOUDFLARE_API_TOKEN="${cleanToken}"\n`;
      }
      fs.writeFileSync(envPath, content, "utf8");
    } catch (err) {
      console.warn("[ImageBalancer] 尝试更新 .env.local 失败:", err.message);
    }
  }

  return true;
}

/**
 * 检查 Cloudflare Workers AI 服务凭据是否就绪
 */
export function isCloudflareConfigured(options = {}) {
  const { ready } = resolveCloudflareCredentials(options);
  return ready;
}

/**
 * 获取当前负载均衡集群的可用通道状态
 */
export function getBalancerStatus(options = {}) {
  const cfReady = isCloudflareConfigured(options);
  return {
    cloudflareConfigured: cfReady,
    pollinationsAvailable: true,
    activeProviders: cfReady ? ["cloudflare", "pollinations"] : ["pollinations"],
  };
}

/**
 * 通道 1: Cloudflare Workers AI 生图实现
 */
export async function callCloudflareWorkersAI(options = {}) {
  const { accountId, token, ready } = resolveCloudflareCredentials(options);

  if (!ready) {
    const err = new Error("Cloudflare 凭证未配置（需提供 CLOUDFLARE_ACCOUNT_ID 和 CLOUDFLARE_API_TOKEN）。");
    err.code = "CF_CREDENTIALS_MISSING";
    throw err;
  }

  const prompt = sanitizePrompt(options.prompt);
  if (!prompt) {
    const err = new Error("提示词不能为空");
    err.code = "PROMPT_EMPTY";
    throw err;
  }

  const primaryModel = options.model || "@cf/black-forest-labs/flux-1-schnell";
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${primaryModel}`;

  const timeoutMs = Number(options.timeoutMs || 45000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("Cloudflare Workers AI 请求超时")), timeoutMs);

  const signal = options.signal
    ? AbortSignal.any([options.signal, controller.signal])
    : controller.signal;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      // 注意：flux-1-schnell 严格校验请求体，严禁传入多余字段如 num_steps
      body: JSON.stringify({ prompt }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      const err = new Error(`Cloudflare Workers AI 调用失败 (HTTP ${response.status}): ${errText.slice(0, 200)}`);
      err.code = `CF_HTTP_${response.status}`;
      err.status = response.status;
      throw err;
    }

    const contentType = response.headers.get("content-type") || "";
    let base64 = "";

    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (data?.result?.image) {
        base64 = data.result.image;
      } else if (data?.errors?.length) {
        throw new Error(`Cloudflare AI 报错: ${JSON.stringify(data.errors)}`);
      } else {
        throw new Error("Cloudflare AI 未返回有效图像数据");
      }
    } else {
      // 若直接返回二进制流
      const arrayBuf = await response.arrayBuffer();
      base64 = Buffer.from(arrayBuf).toString("base64");
    }

    return {
      b64: base64,
      mimeType: "image/jpeg",
      provider: "cloudflare",
      model: primaryModel,
      width: options.width || 1024,
      height: options.height || 1024,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 通道 2: Pollinations.ai FLUX.1 / Turbo 生图实现
 */
export async function callPollinationsAI(options = {}) {
  const prompt = sanitizePrompt(options.prompt);
  if (!prompt) {
    const err = new Error("提示词不能为空");
    err.code = "PROMPT_EMPTY";
    throw err;
  }

  const width = options.width || 1024;
  const height = options.height || 1024;
  const seed = options.seed || Math.floor(Math.random() * 1000000);
  const preferredModel = options.model || "flux";

  const timeoutMs = Number(options.timeoutMs || 45000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("Pollinations.ai 请求超时")), timeoutMs);

  const signal = options.signal
    ? AbortSignal.any([options.signal, controller.signal])
    : controller.signal;

  // 尝试首选模型（如 flux），若遇到 402/429 或限流则自动降级到 turbo 免费模型
  const modelsToTry = preferredModel === "turbo" ? ["turbo"] : [preferredModel, "turbo"];
  let lastErr = null;

  try {
    for (const currentModel of modelsToTry) {
      try {
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${encodeURIComponent(currentModel)}&width=${width}&height=${height}&nologo=true&seed=${seed}`;

        const response = await fetch(url, {
          method: "GET",
          signal,
        });

        if (!response.ok) {
          if (response.status === 402) {
            const err = new Error("Pollinations 公共算力池对当前机房 IP 限制 (HTTP 402)。请在服务器端配置 Cloudflare 专属凭据即可畅享稳定高速出图。");
            err.code = "POLLINATIONS_HTTP_402";
            err.status = 402;
            throw err;
          }
          const err = new Error(`Pollinations.ai (${currentModel}) 调用失败 (HTTP ${response.status})`);
          err.code = `POLLINATIONS_HTTP_${response.status}`;
          err.status = response.status;
          throw err;
        }

        const arrayBuf = await response.arrayBuffer();
        if (!arrayBuf || arrayBuf.byteLength === 0) {
          throw new Error("Pollinations.ai 返回了空图像数据");
        }

        const base64 = Buffer.from(arrayBuf).toString("base64");
        const mimeType = response.headers.get("content-type") || "image/jpeg";

        return {
          b64: base64,
          mimeType: mimeType.split(";")[0].trim(),
          provider: "pollinations",
          model: `pollinations-${currentModel}`,
          width,
          height,
        };
      } catch (err) {
        lastErr = err;
        if (signal.aborted) throw err;
        // 如果是最后一个尝试的模型，则向上抛出
        if (currentModel === modelsToTry[modelsToTry.length - 1]) {
          throw err;
        }
        console.warn(`[ImageBalancer] Pollinations 模型 ${currentModel} 请求异常，降级重试备选模型:`, err.message);
      }
    }
    throw lastErr || new Error("Pollinations.ai 所有可用模型均请求失败");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 核心调度器：双通道负载均衡 + 故障自动容灾切换
 * @param {Object} options
 * @param {string} options.prompt 提示词
 * @param {number} [options.width=1024] 宽度
 * @param {number} [options.height=1024] 高度
 * @param {"auto" | "cloudflare" | "pollinations"} [options.provider="auto"] 偏好通道
 * @param {AbortSignal} [options.signal] 取消信号
 * @param {number} [options.timeoutMs=45000] 单通道超时时间
 * @param {boolean} [options.allowFailover=true] 是否在首选通道失败时自动切换另一通道
 * @param {string} [options.cfAccountId] 显式传入的 Cloudflare Account ID
 * @param {string} [options.cfApiToken] 显式传入的 Cloudflare API Token
 */
export async function generateImageWithBalancer(options = {}) {
  const startTime = Date.now();
  const cfReady = isCloudflareConfigured(options);
  const userPreference = options.provider || "auto";
  const allowFailover = options.allowFailover !== false;

  // 若用户明确要求 Cloudflare，但服务器尚未配置凭证，则直接抛出明确指引
  if (userPreference === "cloudflare" && !cfReady) {
    const err = new Error("当前服务器尚未读取到 Cloudflare 凭据。请在服务器端的 .env.local 中添加 CLOUDFLARE_ACCOUNT_ID 与 CLOUDFLARE_API_TOKEN，并执行 pm2 reload chen-ai-studio --update-env。");
    err.code = "CF_CREDENTIALS_MISSING";
    err.status = 503;
    throw err;
  }

  // 确定主通道与备用通道的尝试顺序
  let providerQueue = [];

  if (userPreference === "cloudflare") {
    providerQueue = cfReady && allowFailover ? ["cloudflare", "pollinations"] : ["cloudflare"];
  } else if (userPreference === "pollinations") {
    providerQueue = cfReady && allowFailover ? ["pollinations", "cloudflare"] : ["pollinations"];
  } else {
    // auto 模式：如果有 CF，则在 Cloudflare 与 Pollinations 间轮询均衡
    if (cfReady) {
      const pickFirst = (roundRobinCounter++) % 2 === 0 ? "cloudflare" : "pollinations";
      providerQueue = pickFirst === "cloudflare" ? ["cloudflare", "pollinations"] : ["pollinations", "cloudflare"];
    } else {
      providerQueue = ["pollinations"];
    }
  }

  if (!allowFailover && providerQueue.length > 1) {
    providerQueue = [providerQueue[0]];
  }

  let lastError = null;
  let failoverHappened = false;
  let failoverReason = "";

  for (let i = 0; i < providerQueue.length; i++) {
    const targetProvider = providerQueue[i];

    try {
      if (options.signal?.aborted) {
        throw options.signal.reason || new Error("图片生成已取消");
      }

      let result;
      if (targetProvider === "cloudflare") {
        result = await callCloudflareWorkersAI(options);
      } else {
        result = await callPollinationsAI(options);
      }

      const durationMs = Date.now() - startTime;
      return {
        ...result,
        failover: failoverHappened,
        failoverReason: failoverHappened ? failoverReason : undefined,
        durationMs,
      };
    } catch (err) {
      lastError = err;
      failoverHappened = true;
      failoverReason = `${targetProvider} 通道异常: ${err.message || err.code || "UNKNOWN_ERROR"}`;
      console.warn(`[ImageBalancer] ${targetProvider} 通道执行失败，准备故障切换:`, err.message || err);

      // 若用户主动中断，不再重试备用通道
      if (options.signal?.aborted) {
        throw err;
      }
    }
  }

  throw lastError || new Error("所有生图通道均不可用");
}
