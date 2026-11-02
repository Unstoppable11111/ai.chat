import { NextResponse } from "next/server";
import { clientKey, readJsonBody, sameOrigin, takeQuota } from "@/lib/server-security";
import { getZiweiQuotaStatus, consumeZiweiQuota, GUEST_COOKIE_NAME } from "@/lib/chat-quota";
import { detectPatterns } from "@/lib/ziwei/patterns";
import { generate13DimensionAnalysis, computeLocalHemingMatch } from "@/lib/ziwei/db-analysis";
import { HEMING_METHODOLOGY } from "@/lib/ziwei/heming-knowledge";
import { STEMS, BRANCHES } from "@/lib/ziwei/constants";
import { getSiHuaByStem } from "@/lib/ziwei/sihua";
import type { ZiweiChart } from "@/lib/ziwei/types";

type ChatMessage = { role: "user" | "assistant"; content: string };

const fail = (text: string, status: number) => NextResponse.json({ success: false, text }, { status });
const encoder = new TextEncoder();

function formatChartForPrompt(chart: ZiweiChart, label = "命主"): string {
  const mingPalace = chart.palaces.find((p) => p.branch === chart.mingGongBranch);
  const shenPalace = chart.palaces.find((p) => p.branch === chart.shenGongBranch);
  const patterns = detectPatterns(chart);
  const dimensions = generate13DimensionAnalysis(chart);
  const natalSiHua = getSiHuaByStem(chart.lunarInfo.yearStem);

  const palacesSummary = chart.palaces
    .map((p) => {
      const majors =
        p.stars
          .filter((s) => s.type === "major")
          .map((s) => `${s.name}(${s.brightnessRaw || "平"}${s.siHua ? "·化" + s.siHua : ""})`)
          .join("、") || (p.borrowedStars?.length ? `无主星(借对宫：${p.borrowedStars.join("、")})` : "无主星(借对宫)");
      const luckyAndSha =
        p.stars
          .filter((s) => s.type === "lucky" || s.type === "sha")
          .map((s) => `${s.name}${s.siHua ? "(化" + s.siHua + ")" : ""}`)
          .join("、") || "无";
      const minors =
        p.stars
          .filter((s) => s.type === "minor")
          .map((s) => s.name)
          .join("、") || "无";
      const shenMark = p.isShenGong ? " [身宫]" : "";
      const dxRange = p.daXianAge ? `${p.daXianAge[0]}-${p.daXianAge[1]}岁` : "-";
      return `- 【${p.name}${shenMark}】(${STEMS[p.stem]}${BRANCHES[p.branch]}宫 | 大限 ${dxRange})：主星[${majors}] | 六吉六煞[${luckyAndSha}] | 杂曜[${minors}]`;
    })
    .join("\n");

  const patternSummary = patterns.length
    ? patterns
        .map(
          (pt) =>
            `- 【${pt.name}】(${pt.level === "excellent" ? "上格" : pt.level === "good" ? "吉格" : pt.level === "caution" ? "磨砺格" : "特殊格"})：${pt.description}${pt.source ? `（${pt.source}）` : ""}`
        )
        .join("\n")
    : "- 暂无典型特殊格局，以本宫及三方四正星曜组合论断";

  const dimSummary = Object.values(dimensions)
    .slice(0, 6)
    .map((d) => `- 【${d.label}】${d.dingdiao}`)
    .join("\n");

  const baziStr = chart.lunarInfo.fourPillars?.join(" ") || "";

  return `### ${label}命盘核心档案
- 姓名/称呼：${chart.birthInfo.name || label}
- 性别与阴阳：${chart.yinYangGender || (chart.birthInfo.gender === "male" ? "男命" : "女命")}
- 出生公历：${chart.birthInfo.year}年${chart.birthInfo.month}月${chart.birthInfo.day}日（${BRANCHES[chart.birthInfo.hour]}时）
- 农历与四柱：农历${chart.lunarInfo.lunarYear}年(${STEMS[chart.lunarInfo.yearStem]}${BRANCHES[chart.lunarInfo.yearBranch]}年) ${chart.lunarInfo.isLeapMonth ? "闰" : ""}${Math.abs(chart.lunarInfo.lunarMonth)}月${chart.lunarInfo.lunarDay}日 ${baziStr ? `| 四柱：${baziStr}` : ""}
- 五行局：${chart.wuxingJuName} | 命主：${chart.mingZhu || "-"} | 身主：${chart.shenZhu || "-"} | 当前虚岁：${chart.currentAge}岁
- 命宫：${mingPalace ? `${STEMS[mingPalace.stem]}${BRANCHES[mingPalace.branch]}` : ""} | 身宫：${shenPalace ? `${shenPalace.name}(${STEMS[shenPalace.stem]}${BRANCHES[shenPalace.branch]})` : ""}
- 生年四化（${STEMS[chart.lunarInfo.yearStem]}干）：化禄[${natalSiHua["禄"]}]、化权[${natalSiHua["权"]}]、化科[${natalSiHua["科"]}]、化忌[${natalSiHua["忌"]}]

#### 十二宫全息星曜分布
${palacesSummary}

#### 命盘识别格局
${patternSummary}

#### 13维引擎基线摘要
${dimSummary}`;
}

function buildInterpretSystemPrompt(chart: ZiweiChart): string {
  return `你是精通倪海厦《天纪》易学体系与《紫微斗数全书》《骨髓赋》的紫微斗数宗师。
请基于以下排盘引擎精确计算出的命盘数据，为命主提供格局清朗、直指核心、兼具古典法度与现代人本指导意义的深度批断。

## 核心论命准则（倪海厦《天纪》心法）
1. **三方四正与夹宫并重**：看任何一宫，绝不可独看本宫，必须结合对宫（迁移/冲照）与三合宫（财帛、官禄等）以及辅弼/昌曲/空劫夹宫综合论断。本宫无主星时，必须明言“借对宫主星入宫参看”。
2. **婚姻必参福德宫**：「看婚姻光看夫妻宫大错特错，必须同时看福德宫」——夫妻宫看显性互动与配偶特质，福德宫看深层福泽与白头偕老之根基。
3. **健康结合子午流注与地支脏腑**：疾厄宫及全盘煞忌最集中之十二地支对应中医十二经络与脏腑（子胆、丑肝、寅肺、卯大肠、辰胃、巳脾、午心、未小肠、申膀胱、酉肾、戌心包、亥三焦），结合煞忌星曜给出切实的养生与作息建议。
4. **命理旨在趋吉避凶**：倪师强调「算命是为了知命改运，三分天注定，七分靠人间修为与地理调理」。遇到化忌或煞星聚会，直陈其风险与磨砺本质，同时务必给出可执行的破局之道（专业转化为权技、晚婚避煞、方位调整、修心养性），严禁恐吓宿命论。
5. **排版清晰易读**：善用 Markdown 二级/三级标题、重点加粗与条理化列表，引经据典（适当引用《骨髓赋》或《天纪》原话）并转化为现代可执行建议。

${formatChartForPrompt(chart, "当前命主")}`;
}

function buildHemingSystemPrompt(chartA: ZiweiChart, chartB: ZiweiChart): string {
  const localMatch = computeLocalHemingMatch(chartA, chartB);
  const matchHighlights = localMatch.steps
    .map((s) => `- 【${s.title}】(${s.tag})：${s.detail}`)
    .join("\n");

  return `你是精通倪海厦《天纪》婚姻合参法与《紫微斗数全书》的双人合盘宗师。
请根据以下甲方与乙方的完整紫微斗数命盘数据，结合「倪海厦双宫联参（夫妻宫+福德宫）」与「生年四化飞星互参」五步法，为两人进行深度合盘推演。

${HEMING_METHODOLOGY}

## 本地排盘引擎预检结果（综合契合度：${localMatch.score}分 · ${localMatch.ratingTitle}）
${localMatch.summary}
${matchHighlights}

${formatChartForPrompt(chartA, "甲方（命主 A）")}

${formatChartForPrompt(chartB, "乙方（命主 B）")}

请用清晰、温润且直指核心的 Markdown 结构输出分析，不仅指出双方吸引点与潜在摩擦点（如四化冲照、杀破狼碰撞），更要给出具体的相处沟通建议与矛盾化解之道。`;
}

export async function GET(request: Request) {
  const status = await getZiweiQuotaStatus(request);
  const response = NextResponse.json(status);
  if (status.guestTokenToSet) {
    response.cookies.set(GUEST_COOKIE_NAME, status.guestTokenToSet, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return response;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("请求来源不允许", 403);

  let body: Record<string, unknown>;
  try {
    body = await readJsonBody(request);
  } catch {
    return fail("请求数据格式无效或超过大小限制", 400);
  }

  const mode = body.mode === "heming" ? "heming" : "interpret";
  if (
    !Array.isArray(body.messages) ||
    !body.messages.length ||
    body.messages.length > 24 ||
    body.messages.some(
      (item) =>
        !item ||
        !["user", "assistant"].includes((item as ChatMessage).role) ||
        typeof (item as ChatMessage).content !== "string" ||
        (item as ChatMessage).content.length > 4000
    )
  ) {
    return fail("消息格式或长度不正确", 400);
  }

  const messages = (body.messages as ChatMessage[]).slice(-12);
  if (messages[messages.length - 1].role !== "user") {
    return fail("最后一条消息必须是提问", 400);
  }

  if (mode === "interpret" && (!body.chart || typeof body.chart !== "object")) {
    return fail("缺少命盘数据", 400);
  }
  if (
    mode === "heming" &&
    (!body.chartA || typeof body.chartA !== "object" || !body.chartB || typeof body.chartB !== "object")
  ) {
    return fail("缺少双人合盘数据", 400);
  }

  // 1. 校验并扣减紫微斗数 AI 额度（游客免费 3 次，超出要求登录；登录用户无限制）
  const quota = await consumeZiweiQuota(request);
  if (!quota.allowed) {
    const res = NextResponse.json(
      {
        success: false,
        requireLogin: true,
        text:
          quota.message ||
          "您的 3 次游客免费 AI 命理批断额度已用尽。请登录账号以解锁无限次 AI 紫微命盘解读与双人合盘！",
        remaining: 0,
        total: quota.total,
      },
      { status: 401 }
    );
    if (quota.guestTokenToSet) {
      res.cookies.set(GUEST_COOKIE_NAME, quota.guestTokenToSet, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }
    return res;
  }

  const model =
    process.env.UPSTREAM_BALANCED_MODEL ||
    process.env.UPSTREAM_SPEED_MODEL ||
    process.env.UPSTREAM_ULTRA_MODEL;

  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_BASE_URL || !model) {
    return fail("AI 命理服务暂未就绪，请检查模型配置", 503);
  }

  try {
    const daily = Math.max(1, Math.min(10000, Number(process.env.CHAT_DAILY_REQUESTS) || 200));
    if (
      !(await takeQuota("ziwei:global-minute", 30, 60000)) ||
      !(await takeQuota("ziwei:global-day", daily, 86400000)) ||
      !(await takeQuota(`ziwei:${clientKey(request)}`, 8, 60000))
    ) {
      return fail("当前请求过于频繁，请稍后再试", 429);
    }
  } catch {
    return fail("请求额度服务暂不可用", 503);
  }

  let systemPrompt = "";
  try {
    systemPrompt =
      mode === "heming"
        ? buildHemingSystemPrompt(body.chartA as ZiweiChart, body.chartB as ZiweiChart)
        : buildInterpretSystemPrompt(body.chart as ZiweiChart);
  } catch {
    return fail("命盘结构解析失败，请重新排盘后再试", 400);
  }

  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(new Error("Upstream timeout")), 60000);
  const onAbort = () => abort.abort();
  request.signal.addEventListener("abort", onAbort, { once: true});
  const cleanup = () => {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", onAbort);
  };

  try {
    const upstream = await fetch(`${process.env.OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal: abort.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        max_tokens: Math.max(512, Math.min(4096, Number(process.env.CHAT_MAX_OUTPUT_TOKENS) || 2500)),
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      cleanup();
      await upstream.body?.cancel();
      return fail("AI 命理服务响应异常，请稍后重试", 502);
    }

    const reader = upstream.body.getReader();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `event: quota\ndata: ${JSON.stringify({
              remaining: quota.remaining ?? -1,
              unlimited: Boolean(quota.unlimited),
              total: quota.total ?? 3,
            })}\n\n`
          )
        );
      },
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            cleanup();
            reader.releaseLock();
            controller.close();
          } else {
            controller.enqueue(value);
          }
        } catch {
          cleanup();
          reader.releaseLock();
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ message: "批断流传输中断，请重试" })}\n\n`)
          );
          controller.close();
        }
      },
      async cancel() {
        abort.abort();
        cleanup();
        await reader.cancel().catch(() => {});
      },
    });

    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
      "X-Ziwei-Remaining": String(quota.remaining ?? -1),
    });

    if (quota.guestTokenToSet) {
      headers.append(
        "Set-Cookie",
        `${GUEST_COOKIE_NAME}=${quota.guestTokenToSet}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`
      );
    }

    return new Response(stream, { headers });
  } catch {
    cleanup();
    return fail(abort.signal.aborted ? "AI 批断响应超时，请重试" : "AI 命理服务连接失败", 504);
  }
}
