import { NextRequest, NextResponse } from "next/server";
import { resolveValidBaseUrl } from "@/lib/workflow-utils.mjs";
import type { ChapterTuneRequest } from "@/types/workflow";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  let body: ChapterTuneRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "无效的请求格式" }, { status: 400 });
  }

  const {
    bookTitle,
    worldview,
    characterCards = [],
    chapterNumber,
    chapterTitle,
    currentContent,
    userInstruction,
    style = "快节奏爽文与极简电影质感",
    deAiLevel = "medium",
  } = body;

  if (!currentContent?.trim() || !userInstruction?.trim()) {
    return NextResponse.json(
      { success: false, error: "章节正文或调优微调提示词不能为空" },
      { status: 400 }
    );
  }

  const baseUrl = resolveValidBaseUrl(body.baseUrl);
  const apiKey = body.apiKey?.trim() || process.env.OPENAI_API_KEY || "";
  const model =
    body.model?.trim() ||
    process.env.UPSTREAM_BALANCED_MODEL ||
    process.env.UPSTREAM_SPEED_MODEL ||
    "gpt-4o-mini";

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "未检测到可用的 API Key" },
      { status: 400 }
    );
  }

  const charactersInfo = characterCards
    .map((c) => `${c.name}(${c.role}，性格：${c.personality}，动机：${c.motivation})`)
    .join("\n- ");

  const systemPrompt = `你是一位白金级小说总编兼精修大师。
你需要根据该小说专属的世界观、人设约束与创作者的专项微调提示词，对当前章节正文进行深度定向重构与风格调优。

【小说专属上下文与人物约束】：
作品名称：《${bookTitle || "未命名故事"}》
核心世界观与规则体系：${worldview || "暂无特别设定"}
绑定主要人物卡：
- ${charactersInfo || "依据正文出场人物"}

【语言风格与精修原则】：
1. 写作风格要求：${style}
2. 去 AI 味级别：${deAiLevel}（坚决摒弃“仿佛、宛如、空气凝固、倒吸一口凉气”等俗套词，多用利落短句和物理动作描写）。
3. 保持故事主线逻辑与人物动机一致，严禁人设坍塌。

【用户专项调优指令】：
${userInstruction}

请直接输出调优修改后的完整章节正文，语言充满张力，不要输出任何额外的开场白、解释或问候。`;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `【第 ${chapterNumber} 章：${chapterTitle} 原正文】：\n${currentContent}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 3500,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        { success: false, error: `大模型上游异常 ${res.status}: ${errText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const tunedContent = data.choices?.[0]?.message?.content?.trim() || "";

    if (!tunedContent) {
      return NextResponse.json(
        { success: false, error: "模型未返回有效文本" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      tuned_content: tunedContent,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "调优请求发生异常";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
