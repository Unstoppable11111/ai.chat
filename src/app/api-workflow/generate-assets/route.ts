import { NextRequest, NextResponse } from "next/server";
import {
  generateCharacterPortraitSvg,
  generateSceneConceptSvg,
  buildEnglishAssetPrompt,
  callGeminiImageGeneration,
  buildFluxImageUrl,
  probeImageUrl,
} from "@/lib/workflow-utils.mjs";
import {
  reportImageSuccess,
} from "@/lib/workflow-cooldown.mjs";
import {
  requestOwner,
  detectPromptInjection,
  checkWorkflowRateLimit,
} from "@/lib/server-security";
import { countUserDailyAssets, verifyProjectOwnership } from "@/lib/workflow-db";
import { isSuperAdmin } from "@/lib/auth-db";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  let body: {
    projectId?: string;
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

  // 1. 服务端强制 Session 登录鉴权 (严防外部脚本绕过前端白嫖 gemini-3-pro-image)
  const userId = await requestOwner(request);
  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        code: "UNAUTHORIZED",
        error: "未登录或登录会话已过期，请先登录账户后再生成视觉资产。",
      },
      { status: 401 }
    );
  }

  const {
    projectId,
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

  // 2. 校验资产所属工程所有权 (防止越权操作他人小说资产)
  if (projectId) {
    const isOwner = await verifyProjectOwnership(userId, projectId);
    if (!isOwner) {
      return NextResponse.json(
        {
          success: false,
          code: "FORBIDDEN",
          error: "无权访问或修改该小说项目的视觉资产。",
        },
        { status: 403 }
      );
    }
  }

  // 3. 提示词注入与越狱对抗检测
  const checkName = detectPromptInjection(name);
  const checkDesc = detectPromptInjection(description || appearance);
  const checkGenre = detectPromptInjection(genre);
  if (!checkName.isSafe || !checkDesc.isSafe || !checkGenre.isSafe) {
    return NextResponse.json(
      {
        success: false,
        code: "PROMPT_INJECTION_DETECTED",
        error: "资产描述或名称中包含疑似越狱或违规指令，系统已安全终止出图。",
      },
      { status: 400 }
    );
  }

  // 4. 服务端多维滑动窗口高频请求防御 (每 60 秒限 4 次，超级管理员免频控)
  const rateLimitRes = await checkWorkflowRateLimit(request, userId, "asset");
  if (!rateLimitRes.allowed) {
    return NextResponse.json(
      {
        success: false,
        code: "RATE_LIMITED",
        error: rateLimitRes.message || "生成过于频繁，请稍候再试。",
      },
      { status: 429 }
    );
  }

  // 5. 单账户单日资产生成配额限制 (每天最多 10 张，超级管理员无限生成)
  const isAdmin = await isSuperAdmin(userId);
  const dailyAssets = await countUserDailyAssets(userId);
  if (!isAdmin && dailyAssets >= 10) {
    return NextResponse.json(
      {
        success: false,
        code: "DAILY_ASSET_QUOTA_EXCEEDED",
        error: "您今日的视觉资产生成额度已达上限（单账户每日限额 10 张视觉资产），请明日再来。",
      },
      { status: 429 }
    );
  }

  // 6. 构造专为 gemini-3-pro-image 优化的纯英文无水印提示词
  const prompt = buildEnglishAssetPrompt({
    type,
    name,
    role,
    personality,
    appearance: appearance || description,
    genre,
  });

  // 7. 优先使用本地 4981 官方生图中间件（免密直连、多模型兼容自适应）
  const effectiveApiKey = apiKey.trim() || process.env.IMAGE_API_KEY || process.env.OPENAI_API_KEY || "";
  const effectiveBaseUrl =
    process.env.IMAGE_API_BASE_URL ||
    (baseUrl && baseUrl !== "https://api.openai.com/v1" && baseUrl !== process.env.OPENAI_BASE_URL ? baseUrl : "") ||
    "http://127.0.0.1:4981/openai/v1";

  // 8. 调用官方生图服务 (优先 4981 gemini-3-pro-image，自动重试、落盘、异常抛出)
  try {
    const imageUrl = await callGeminiImageGeneration({
      prompt,
      apiKey: effectiveApiKey,
      baseUrl: effectiveBaseUrl,
      model: "gemini-3-pro-image",
      size: type === "character" ? "1024x1024" : "1024x1024",
      timeoutMs: 45000,
      prefix: type === "character" ? "character" : "scene",
    });

    // 成功出图，汇报健康状态
    reportImageSuccess();

    return NextResponse.json({
      success: true,
      image_url: imageUrl,
      model: "gemini-3-pro-image",
      isFallback: false,
    });
  } catch (err: unknown) {
    const errorObj = err as { status?: number; message?: string; name?: string };
    console.warn("[GenerateAssets] 官方生图通道抛出异常，启动安全保底流程:", errorObj);

    // 1. 尝试海外 Flux，但严控 6 秒探测超时。若海外拥堵或挂起，绝不将死链返回给前端拖垮浏览器
    try {
      const fluxAssetUrl = buildFluxImageUrl(prompt, {
        width: type === "character" ? 768 : 1024,
        height: type === "character" ? 1024 : 576,
      });
      const probe = await probeImageUrl(fluxAssetUrl, 6000);
      if (probe.ok) {
        return NextResponse.json({
          success: true,
          image_url: fluxAssetUrl,
          model: "flux-cinema",
          isFallback: true,
        });
      }
    } catch {
      // 忽略并进入极端矢量 SVG 零等待保底
    }

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
      model: "vector-svg-fallback",
    });
  }
}
