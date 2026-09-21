import { NextRequest, NextResponse } from "next/server";
import {
  generateCharacterPortraitSvg,
  generateSceneConceptSvg,
  buildEnglishAssetPrompt,
  callGeminiImageGeneration,
} from "@/lib/workflow-utils.mjs";
import {
  getImageCooldownStatus,
  triggerImageCooldown,
  reportImageSuccess,
} from "@/lib/workflow-cooldown.mjs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let body: {
    type: "character" | "scene";
    name: string;
    role?: string;
    personality?: string;
    appearance?: string;
    description?: string;
    genre?: string;
    apiKey?: string;
    baseUrl?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "无效的请求格式" }, { status: 400 });
  }

  const {
    type,
    name,
    role = "核心角色",
    personality = "沉着冷峻",
    appearance = "修长挺拔，眼神坚毅",
    description = "",
    genre = "都市异能",
    apiKey = "",
    baseUrl = "",
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ success: false, error: "资产名称不能为空" }, { status: 400 });
  }

  // 1. 检查生图通道是否处于冷却保护状态 (5分钟 -> 30分钟)
  const cooldown = getImageCooldownStatus();
  if (cooldown.active) {
    const minutes = Math.floor(cooldown.remainingSeconds / 60);
    const seconds = cooldown.remainingSeconds % 60;
    const timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
    return NextResponse.json(
      {
        success: false,
        code: "COOLDOWN_ACTIVE",
        remainingSeconds: cooldown.remainingSeconds,
        tier: cooldown.tier,
        error: `生图接口并发已达上限或超时，当前处于${cooldown.tier === 2 ? "30" : "5"}分钟冷却保护中。还剩 ${timeText}，在此期间暂停生成视觉资产。`,
      },
      { status: 429 }
    );
  }

  // 2. 构造专为 gemini-3.1-pro-image 优化的纯英文无水印提示词
  const prompt = buildEnglishAssetPrompt({
    type,
    name,
    role,
    personality,
    appearance: appearance || description,
    genre,
  });

  // 3. 优先使用用户自定义 Key，若无则坚决使用站长 Key 与网关 (彻底解决之前未配置站长 Key 的问题)
  const effectiveApiKey = apiKey.trim() || process.env.OPENAI_API_KEY || "";
  const effectiveBaseUrl = baseUrl.trim() || process.env.OPENAI_BASE_URL || "https://newapi.chenyc.chat/v1";

  if (!effectiveApiKey) {
    return NextResponse.json(
      {
        success: false,
        error: "未配置 API Key。请在控制台设置抽屉中填写您的 API Key，或联系管理员配置服务端 OPENAI_API_KEY。",
      },
      { status: 400 }
    );
  }

  // 4. 调用 gemini-3.1-pro-image 进行高质量无水印出图
  try {
    const imageUrl = await callGeminiImageGeneration({
      prompt,
      apiKey: effectiveApiKey,
      baseUrl: effectiveBaseUrl,
      model: "gemini-3.1-pro-image",
      size: type === "character" ? "1024x1024" : "1024x1024",
      timeoutMs: 15000,
    });

    // 成功出图，汇报健康状态
    reportImageSuccess();

    return NextResponse.json({
      success: true,
      image_url: imageUrl,
      model: "gemini-3.1-pro-image",
    });
  } catch (err: unknown) {
    const errorObj = err as { status?: number; message?: string; name?: string };
    const isRateLimit =
      errorObj.status === 429 ||
      errorObj.status === 503 ||
      String(errorObj.message).includes("CONCURRENCY") ||
      String(errorObj.message).includes("RATE_LIMIT");
    const isTimeout =
      errorObj.status === 408 ||
      errorObj.name === "AbortError" ||
      String(errorObj.message).includes("TIMEOUT");

    // 用户要求：当检测超时或者并发上限的时候，暂停生图接口五分钟，如果五分钟后还是超时并发，那就延长到30分钟
    if (isRateLimit || isTimeout) {
      const penalty = triggerImageCooldown(isTimeout ? "TIMEOUT" : "CONCURRENCY_LIMIT");
      const minutes = Math.floor(penalty.remainingSeconds / 60);
      const seconds = penalty.remainingSeconds % 60;
      const timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;

      return NextResponse.json(
        {
          success: false,
          code: "COOLDOWN_ACTIVE",
          remainingSeconds: penalty.remainingSeconds,
          tier: penalty.tier,
          error: `生图接口检测到${isTimeout ? "响应超时" : "并发上限"}，已触发${
            penalty.tier === 2 ? "30" : "5"
          }分钟冷却保护。还剩 ${timeText}，在此期间暂停生成视觉资产。`,
        },
        { status: 429 }
      );
    }

    // 其它常规错误，优雅提供专属矢量保底
    let fallbackUrl = "";
    if (type === "character") {
      fallbackUrl = generateCharacterPortraitSvg({
        name,
        role,
        personality,
        appearance: appearance || description,
        genre,
      });
    } else {
      fallbackUrl = generateSceneConceptSvg({
        sceneTitle: name,
        atmosphere: personality || "暗夜暴雨，光影交错",
        elements: appearance || description || "核心交锋地貌",
        genre,
      });
    }

    return NextResponse.json({
      success: true,
      image_url: fallbackUrl,
      isFallback: true,
    });
  }
}
