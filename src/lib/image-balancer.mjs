/**
 * AI Image Generation Load Balancer
 * 双通道高可用生图负载均衡器：
 * - 通道 1: Cloudflare Workers AI (@cf/black-forest-labs/flux-1-schnell / SDXL)
 * - 通道 2: Pollinations.ai (FLUX.1 / Turbo 真实推理引擎)
 * 
 * 支持 Round-Robin 轮询均衡 + 毫秒级故障自动容灾降级切换 (Automatic Failover)
 */

let roundRobinCounter = 0;

/**
 * 格式化提示词，去除特殊控制字符并确保长度安全
 */
export function sanitizePrompt(prompt) {
  if (typeof prompt !== "string") return "";
  return prompt.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, "").slice(0, 4000);
}

/**
 * 检查 Cloudflare Workers AI 服务凭据是否就绪
 */
export function isCloudflareConfigured() {
  const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
  const token = (process.env.CLOUDFLARE_API_TOKEN || "").trim();
  return Boolean(accountId && token);
}

/**
 * 获取当前负载均衡集群的可用通道状态
 */
export function getBalancerStatus() {
  const cfReady = isCloudflareConfigured();
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
  const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
  const token = (process.env.CLOUDFLARE_API_TOKEN || "").trim();

  if (!accountId || !token) {
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
 */
export async function generateImageWithBalancer(options = {}) {
  const startTime = Date.now();
  const cfReady = isCloudflareConfigured();
  const userPreference = options.provider || "auto";
  const allowFailover = options.allowFailover !== false;

  // 确定主通道与备用通道的尝试顺序
  let providerQueue = [];

  if (userPreference === "cloudflare") {
    providerQueue = cfReady ? ["cloudflare", "pollinations"] : ["pollinations"];
  } else if (userPreference === "pollinations") {
    providerQueue = cfReady ? ["pollinations", "cloudflare"] : ["pollinations"];
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
