import { NextRequest, NextResponse } from "next/server";
import {
  generateCharacterPortraitSvg,
  generateSceneConceptSvg,
  buildEnglishAssetPrompt,
  generateWorkflowImage,
} from "@/lib/workflow-utils.mjs";
import {
  requestOwner,
  sameOrigin,
  readJsonBody,
  detectPromptInjection,
  checkWorkflowRateLimit,
} from "@/lib/server-security";
import { verifyProjectOwnership } from "@/lib/workflow-db";
import { reserveWorkflowUsage } from "@/lib/workflow-usage";
import { isSuperAdmin } from "@/lib/auth-db";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ success: false, status: "failed", error: "不允许跨站发起图片生成请求。" }, { status: 403 });
  }
  const userId = await requestOwner(request);
  if (!userId) {
    return NextResponse.json(
      { success: false, status: "failed", code: "UNAUTHORIZED", error: "未登录或登录会话已过期，请先登录账户后再生成视觉资产。" },
      { status: 401 }
    );
  }

  let body: {
    projectId?: string;
    type?: "character" | "scene";
    name?: string;
    role?: string;
    personality?: string;
    appearance?: string;
    description?: string;
    genre?: string;
    style?: string;
    worldview?: string;
    plot?: string;
    usePlaceholder?: boolean;
  };
  try {
    body = await readJsonBody(request, 128 * 1024) as typeof body;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid body");
  } catch {
    return NextResponse.json({ success: false, status: "failed", error: "无效的请求格式" }, { status: 400 });
  }

  const { projectId, type, name, role = "", personality = "", appearance = "", description = "", genre = "", style = "cinematic illustration", worldview = "", plot = "" } = body;
  const fields = [name, role, personality, appearance, description, genre, style, worldview, plot];
  if (!["character", "scene"].includes(type || "") || typeof name !== "string" || !name.trim() ||
    fields.some(value => typeof value !== "string" || value.length > 8000) ||
    (projectId !== undefined && (typeof projectId !== "string" || !projectId.trim()))) {
    return NextResponse.json({ success: false, status: "failed", error: "请提供有效的资产类型、名称和描述，每项不超过 8000 字符。" }, { status: 400 });
  }

  if (projectId && !(await verifyProjectOwnership(userId, projectId))) {
    return NextResponse.json(
      { success: false, status: "failed", code: "FORBIDDEN", error: "无权访问或修改该小说项目的视觉资产。" },
      { status: 403 }
    );
  }

  if (fields.some(value => !detectPromptInjection(value || "").isSafe)) {
    return NextResponse.json(
      { success: false, status: "failed", code: "PROMPT_INJECTION_DETECTED", error: "描述中包含修改系统指令或读取服务凭据的请求，请调整后重试。" },
      { status: 400 }
    );
  }

  const rateLimit = await checkWorkflowRateLimit(request, userId, "asset");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, status: "failed", code: "RATE_LIMITED", error: rateLimit.message || "生成过于频繁，请稍候再试。" },
      { status: 429 }
    );
  }

  const prompt = buildEnglishAssetPrompt({ type, name, role, personality, appearance, description, genre, style, worldview, plot });
  if (body.usePlaceholder === true) {
    const imageUrl = type === "character"
      ? generateCharacterPortraitSvg({ name, role, personality, appearance: appearance || description, genre })
      : generateSceneConceptSvg({ sceneTitle: name, atmosphere: personality, elements: description || appearance, genre });
    return NextResponse.json({
      success: true,
      status: "degraded",
      image_url: imageUrl,
      isFallback: true,
      model: "vector-svg-placeholder",
      metadata: { provider: "local", model: "vector-svg-placeholder", prompt, kind: type },
    });
  }

  try {
    const isAdmin = await isSuperAdmin(userId);
    const result = await generateWorkflowImage({
      prompt,
      kind: type,
      signal: request.signal,
      prefix: type,
      beforeRequest: async () => {
        if (!(await reserveWorkflowUsage(userId, "asset", isAdmin))) {
          throw Object.assign(new Error("今日图片生成尝试次数已达上限（每日 10 次，失败或取消也计入已发起次数）。"), {
            code: "DAILY_ASSET_QUOTA_EXCEEDED", status: 429,
          });
        }
      },
    });
    return NextResponse.json({
      success: true,
      status: "generated",
      image_url: result.imageUrl,
      model: result.metadata.model,
      isFallback: false,
      metadata: result.metadata,
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string; code?: string; retryAfter?: number };
    console.warn("[GenerateAssets] generation failed:", error.code || "IMAGE_GENERATION_FAILED");
    return NextResponse.json(
      {
        success: false,
        status: "failed",
        code: error.code || "IMAGE_GENERATION_FAILED",
        error: error.message || "图片生成失败，请稍后重试。",
        retryAfter: error.retryAfter || 0,
      },
      {
        status: error.status && error.status >= 400 && error.status <= 599 ? error.status : 502,
        headers: error.retryAfter ? { "Retry-After": String(error.retryAfter) } : undefined,
      }
    );
  }
}
