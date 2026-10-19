import { NextRequest, NextResponse } from "next/server";
import {
  generateImageWithBalancer,
  getBalancerStatus,
  sanitizePrompt,
  saveCloudflareCredentials,
  enhancePromptForFlux,
} from "@/lib/image-balancer.mjs";
import { saveBase64ImageLocally } from "@/lib/workflow-utils.mjs";
import {
  sameOrigin,
  readJsonBody,
  detectPromptInjection,
  clientKey,
  takeQuota,
} from "@/lib/server-security";

export const dynamic = "force-dynamic";
export const maxDuration = 120;


const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1024, height: 576 },
  "9:16": { width: 576, height: 1024 },
  "4:3": { width: 1024, height: 768 },
  "3:4": { width: 768, height: 1024 },
};

export async function GET() {
  const status = getBalancerStatus();
  return NextResponse.json({
    success: true,
    status,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "不允许跨域发起生图请求。" },
      { status: 403 }
    );
  }

  // IP 级别速率保护：每 60 秒最多 20 次请求
  const key = `img_studio:${clientKey(request)}`;
  const allowed = await takeQuota(key, 20, 60000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "生图请求过于频繁，请稍候 1 分钟后再试。" },
      { status: 429 }
    );
  }

  let body: {
    action?: string;
    cfAccountId?: string;
    cfApiToken?: string;
    prompt?: string;
    aspectRatio?: string;
    style?: string;
    provider?: "auto" | "cloudflare" | "pollinations";
  };

  try {
    body = (await readJsonBody(request, 64 * 1024)) as typeof body;
    if (!body || typeof body !== "object") throw new Error("invalid json");
  } catch {
    return NextResponse.json(
      { success: false, error: "无效的请求格式。" },
      { status: 400 }
    );
  }

  // 1. 支持前端直接保存凭据至服务器端运行时与 .env.local（无需 SSH 登录终端操作）
  if (body.action === "save-credentials") {
    try {
      const { cfAccountId, cfApiToken } = body;
      saveCloudflareCredentials({ accountId: cfAccountId, token: cfApiToken });
      return NextResponse.json({
        success: true,
        message: "Cloudflare Workers AI 凭证已成功激活并保存至服务器！",
        status: getBalancerStatus(),
      });
    } catch (err: unknown) {
      const error = err as Error;
      return NextResponse.json({ success: false, error: error.message || "保存失败" }, { status: 400 });
    }
  }

  const rawPrompt = sanitizePrompt(body.prompt || "");
  if (!rawPrompt || rawPrompt.length < 2) {
    return NextResponse.json(
      { success: false, error: "请提供至少 2 个字符的图片描述或提示词。" },
      { status: 400 }
    );
  }

  if (rawPrompt.length > 2000) {
    return NextResponse.json(
      { success: false, error: "提示词长度不能超过 2000 字符。" },
      { status: 400 }
    );
  }

  const injectionCheck = detectPromptInjection(rawPrompt);
  if (!injectionCheck.isSafe) {
    return NextResponse.json(
      { success: false, error: "提示词包含系统越狱指令，请调整后重试。" },
      { status: 400 }
    );
  }

  const styleKey = body.style || "none";
  // 专门针对 FLUX.1 模型进行概念语义直译、风格强化及负向文字抑制
  const enhancedPrompt = enhancePromptForFlux(rawPrompt, styleKey);

  const ratio = body.aspectRatio || "1:1";
  const { width, height } = ASPECT_RATIO_DIMENSIONS[ratio] || { width: 1024, height: 1024 };

  const providerPreference = body.provider || "auto";

  try {
    const result = await generateImageWithBalancer({
      prompt: enhancedPrompt,
      width,
      height,
      provider: providerPreference,
      cfAccountId: body.cfAccountId,
      cfApiToken: body.cfApiToken,
      signal: request.signal,
      timeoutMs: 50000,
    });

    // 安全持久化到本地 public/generated/workflow/ 目录
    const imageUrl = saveBase64ImageLocally(result.b64, "studio");

    return NextResponse.json({
      success: true,
      imageUrl,
      provider: result.provider,
      model: result.model,
      width: result.width,
      height: result.height,
      aspectRatio: ratio,
      durationMs: result.durationMs,
      failover: result.failover,
      failoverReason: result.failoverReason,
      prompt: rawPrompt,
      enhancedPrompt,
    });
  } catch (err: unknown) {
    const error = err as { message?: string; code?: string; status?: number };
    console.error("[ImageStudio] 生成失败:", error.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "生图服务暂时响应异常，请稍后重试。",
        code: error.code || "GENERATION_ERROR",
      },
      { status: error.status && error.status >= 400 && error.status <= 599 ? error.status : 502 }
    );
  }
}
