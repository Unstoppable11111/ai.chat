import { resolveWorkflowTextConfig } from "@/lib/workflow-output.mjs";
import type { ClsTelegraphItem } from "@/lib/quotes-service";
import type {
  HoldingSwingEvaluation,
  MarketTrafficLightState,
  WatchItemSwingEvaluation,
} from "@/lib/quant-arena/swing-rules";

function getCandidateModels(primaryModel: string): string[] {
  return [
    primaryModel,
    process.env.UPSTREAM_BALANCED_MODEL,
    "gemini-3.5-flash-lite",
    "gemini-3.1-pro",
    process.env.UPSTREAM_SPEED_MODEL,
    process.env.UPSTREAM_ULTRA_MODEL,
  ].filter((m, idx, arr): m is string => typeof m === "string" && m.trim().length > 0 && arr.indexOf(m) === idx);
}

/**
 * 带候选模型容灾回退的非流式 LLM 文本请求
 */
async function callChatCompletionWithFallback(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1400
): Promise<{ text: string; model: string } | null> {
  let cfg: { apiKey: string; baseUrl: string; model: string };
  try {
    cfg = resolveWorkflowTextConfig({}, process.env);
  } catch {
    return null;
  }

  const models = getCandidateModels(cfg.model);
  for (const model of models) {
    try {
      const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.35,
          max_tokens: maxTokens,
        }),
        signal: AbortSignal.timeout(35000),
      });
      if (!res.ok) {
        await res.body?.cancel();
        continue;
      }
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data?.choices?.[0]?.message?.content?.trim();
      if (content && content.length >= 20) {
        return { text: content, model };
      }
    } catch {
      // 切换下一个候选模型
    }
  }
  return null;
}

export async function generatePremarketPlanWithAI(input: {
  reportDate: string;
  trafficLight: MarketTrafficLightState;
  news: ClsTelegraphItem[];
  holdings: Array<{
    code: string;
    name: string;
    cost_price: number;
    position_mode: string;
    stop_loss_price: number;
    support_defense_price: number | null;
    rebound_watch_prices: number[] | null;
    thesis: string | null;
  }>;
  watchlist: Array<{
    code: string;
    name: string;
    board: string;
    observed_days: number;
    max_days: number;
    buy_low: number | null;
    buy_high: number | null;
    breakout_price: number | null;
    invalid_price: number | null;
  }>;
}): Promise<{ markdown: string; aiUsed: boolean; modelUsed?: string }> {
  const newsText = input.news.length
    ? input.news
        .slice(0, 8)
        .map((n, i) => `${i + 1}. [${n.time}] ${n.title} — ${n.content}`)
        .join("\n")
    : "暂未抓到最新电报快讯，按量价与持仓纪律执行。";

  const holdingsText = input.holdings.length
    ? input.holdings
        .map(
          (h) =>
            `- ${h.name}(${h.code})：成本 ${h.cost_price}，模式=${h.position_mode}，防守/止损位=${h.support_defense_price ?? h.stop_loss_price}，修复观察位=${h.rebound_watch_prices?.join("/") || "无"}。逻辑：${h.thesis || "波段跟踪"}`
        )
        .join("\n")
    : "- 当前空仓";

  const watchText = input.watchlist.length
    ? input.watchlist
        .map(
          (w) =>
            `- ${w.name}(${w.code}, ${w.board}) Day ${w.observed_days}/${w.max_days}：低吸区 [${w.buy_low ?? "--"}, ${w.buy_high ?? "--"}]，突破位 ${w.breakout_price ?? "--"}，失效线 ${w.invalid_price ?? "--"}`
        )
        .join("\n")
    : "- 5日观察池暂无标的";

  const systemPrompt =
    "你是一位严谨的 A 股主板与创业板科技成长波段交易顾问。基于前一日消息面、市场情绪红绿灯与用户预置纪律，生成今日盘前全天执行计划。输出使用清晰的中文 Markdown，严禁编造未经提供的数据，末尾标注“辅助决策参考，不构成持牌投资建议”。";

  const userPrompt = `日期：${input.reportDate}
市场情绪闸门：${input.trafficLight.label}（${input.trafficLight.summary}）

【隔夜与早盘要闻】
${newsText}

【当前实盘持仓】
${holdingsText}

【5日轮动观察池】
${watchText}

请输出：
1. 今日大盘情绪与操作总基调（仓位控制建议与买卖点闸门约束）
2. 隔夜消息面主线催化与风险提示
3. 实盘持仓今日重点盯防价位与应对预案
4. 5日观察池今日买点A(缩量低吸)/买点B(放量突破)执行纪律`;

  const ai = await callChatCompletionWithFallback(systemPrompt, userPrompt, 1500);
  if (ai) {
    return { markdown: ai.text, aiUsed: true, modelUsed: ai.model };
  }

  // 结构化规则降级兜底
  const fallback = `### ${input.reportDate} 盘前全天波段执行计划（规则引擎生成）

- **市场情绪闸门**：**${input.trafficLight.label}** — ${input.trafficLight.summary}
- **实盘持仓预案**：
${holdingsText}
- **5日观察池盯盘计划**：
${watchText}
- **隔夜要闻摘要**：
${newsText}

> 提示：当前上游大模型通道暂未响应，以上计划已由本地波段规则引擎完整生成；系统将在盘中每 5 分钟静默核对点位并在关键异动时自动唤醒 AI。个人研究辅助工具，不构成持牌投资建议。`;

  return { markdown: fallback, aiUsed: false };
}

export async function generateAnomalyAnalysisWithAI(input: {
  reportDate: string;
  timeStr: string;
  triggerType: "auto" | "manual";
  focusCode?: string;
  focusName?: string;
  reasons: string[];
  trafficLight: MarketTrafficLightState;
  holdings: HoldingSwingEvaluation[];
  watchlist: WatchItemSwingEvaluation[];
  news: ClsTelegraphItem[];
}): Promise<{ markdown: string; aiUsed: boolean; modelUsed?: string }> {
  const holdingsBlock = input.holdings.length
    ? input.holdings
        .map(
          (h) =>
            `- ${h.name}(${h.code})：现价 ¥${h.price.toFixed(2)} (${h.change_pct >= 0 ? "+" : ""}${h.change_pct.toFixed(2)}%)，浮盈 ${h.pnl_pct >= 0 ? "+" : ""}${h.pnl_pct.toFixed(2)}%，日内振幅 ${h.amplitude_pct}%，高点回撤 -${h.pullback_from_high_pct}%，MA20=${h.technicals?.ma20 ?? "--"}，量比=${h.vol_ratio}，规则建议=${h.recommendation}，触发=${h.signals.map((s) => s.message).join("；") || "无"}`
        )
        .join("\n")
    : "- 无实盘持仓";

  const watchBlock = input.watchlist.length
    ? input.watchlist
        .map(
          (w) =>
            `- ${w.name}(${w.code}) Day ${w.observed_days}/${w.max_days}：现价 ${w.price ? `¥${w.price.toFixed(2)}` : "--"} (${w.change_pct >= 0 ? "+" : ""}${w.change_pct.toFixed(2)}%)，量比 ${w.vol_ratio}，状态=${w.status_summary}`
        )
        .join("\n")
    : "- 观察池为空";

  const newsText = input.news
    .slice(0, 5)
    .map((n) => `- [${n.time}] ${n.title}`)
    .join("\n");

  const systemPrompt =
    "你是一位专业的 A 股盘中异动与波段风控分析师。结合实时量价异动、日内振幅/回撤、板块强弱与市场情绪红绿灯，分析主力资金意图并给出明确、可执行的波段应对方案（观望/低吸/减仓/止盈/止损条件）。必须紧扣给定真实数据，严禁虚构数字。";

  const userPrompt = `时间：${input.reportDate} ${input.timeStr}
触发类型：${input.triggerType === "auto" ? "盘中异动自动唤醒" : "用户主动召唤深度研判"}${input.focusName ? `（聚焦标的：${input.focusName} ${input.focusCode || ""}）` : ""}
触发原因：${input.reasons.join("；") || "盘中综合诊断"}
情绪闸门：${input.trafficLight.label} — ${input.trafficLight.summary}

【实盘持仓实时快照】
${holdingsBlock}

【5日观察池实时快照】
${watchBlock}

【最新市场电报】
${newsText || "暂无最新快讯"}

请给出结构化研判（Markdown）：
1. 异动/盘面核心定性（真突破 / 洗盘 / 高开低走派发 / 恐慌错杀）
2. 重点标的应对策略（给出清晰价位与仓位动作建议）
3. 接下来需要紧盯的失效/确认条件`;

  const ai = await callChatCompletionWithFallback(systemPrompt, userPrompt, 1200);
  if (ai) {
    return { markdown: ai.text, aiUsed: true, modelUsed: ai.model };
  }

  const fallback = `### ${input.timeStr} 盘中量化规则研判（大模型通道降级）

- **触发原因**：${input.reasons.join("；")}
- **情绪闸门**：${input.trafficLight.label}（${input.trafficLight.summary}）
- **持仓快照**：
${holdingsBlock}
- **观察池快照**：
${watchBlock}

> 上游大模型服务当前繁忙，已自动输出精确量化规则状态供风控参考。`;

  return { markdown: fallback, aiUsed: false };
}
