import { NextRequest, NextResponse } from "next/server";
import {
  generateCharacterPortraitSvg,
  generateSceneConceptSvg,
  resolveValidBaseUrl,
  buildFluxImageUrl,
  buildEnglishAssetPrompt,
  probeImageUrl,
} from "@/lib/workflow-utils.mjs";

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

  // 构造全英文工业级影视 Prompt (彻底剔除中文字符，避免生图模型 T5 编码器失效与假文字)
  const prompt = buildEnglishAssetPrompt({
    type,
    name,
    role,
    personality,
    appearance: appearance || description,
    genre,
  });

  // 1. 如果配置了可用的第三方生图 Key，尝试调用生图 API (DALL-E-3 高清质量)
  const cleanKey = apiKey.trim();
  const safeBaseUrl = resolveValidBaseUrl(baseUrl);

  if (cleanKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`${safeBaseUrl.replace(/\/+$/, "")}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024",
          quality: "hd",
          style: "vivid",
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const imgUrl = data?.data?.[0]?.url || data?.data?.[0]?.b64_json;
        if (imgUrl) {
          const finalUrl = imgUrl.startsWith("http")
            ? imgUrl
            : `data:image/png;base64,${imgUrl}`;
          return NextResponse.json({ success: true, image_url: finalUrl });
        }
      }
    } catch {
      // 优雅降级到 FLUX.1 真实引擎
    }
  }

  // 2. 核心升级：接入全球顶级开源 FLUX.1 真实出图引擎 (纯英文专业 Prompt 渲染)
  try {
    const fluxUrl = buildFluxImageUrl(prompt, {
      width: type === "character" ? 768 : 1024,
      height: type === "character" ? 1024 : 576,
      enhance: false,
    });

    // 短探测：检测算力节点是否正在排队或限流频繁 (7 秒探测超时)
    const probe = await probeImageUrl(fluxUrl, 7000);

    // 用户明确诉求：如果出现排队的情况就不要生成了，直接提示太频繁稍后重试
    if (probe.isBusy) {
      return NextResponse.json(
        {
          success: false,
          code: "QUEUE_BUSY",
          error: "生图算力节点当前排队繁忙或请求过于频繁，请稍后再试",
        },
        { status: 429 }
      );
    }

    if (probe.ok) {
      return NextResponse.json({
        success: true,
        image_url: fluxUrl,
      });
    }

    // 探测失败但非 busy，执行专属矢量保底
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
  } catch {
    // 3. 本地电影级专属视觉矢量图终极保底
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
    });
  }
}
