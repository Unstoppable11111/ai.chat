"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Flame,
  AlertTriangle,
  Activity,
  Gauge,
  Layers,
  ShieldCheck,
  RefreshCw,
  Scale,
  Bot,
  Sparkles,
} from "lucide-react";
import type { MarketSentimentMetrics } from "@/lib/quotes-service";
import { evaluateMarketTrafficLight } from "@/lib/quant-arena/swing-rules";

interface MarketSentimentMetricsBarProps {
  initialMetrics?: MarketSentimentMetrics | null;
}

export function MarketSentimentMetricsBar({ initialMetrics }: MarketSentimentMetricsBarProps) {
  const [metrics, setMetrics] = useState<MarketSentimentMetrics | null>(initialMetrics || null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const handleManualRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api-market/latest", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.sentiment_metrics) {
          setMetrics(json.sentiment_metrics);
          setLastUpdate(json.snapshot_time || new Date().toTimeString().slice(0, 8));
        }
      }
    } catch (err) {
      console.warn("[MarketSentimentMetricsBar] 刷新情绪大屏异常:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const refreshData = async () => {
      try {
        const res = await fetch("/api-market/latest", { cache: "no-store" });
        if (res.ok && isMounted) {
          const json = await res.json();
          if (json.sentiment_metrics) {
            setMetrics(json.sentiment_metrics);
            setLastUpdate(json.snapshot_time || new Date().toTimeString().slice(0, 8));
          }
        }
      } catch (err) {
        console.warn("[MarketSentimentMetricsBar] 轮询异常:", err);
      }
    };

    if (!initialMetrics) {
      void refreshData();
    }
    const timer = setInterval(() => {
      void refreshData();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [initialMetrics]);

  const multiVol = metrics?.multi_day_volume;
  const hasLive = Boolean(metrics);

  // 1. 基础短线盘口实测值
  const limitUp = metrics?.limit_up_count ?? 0;
  const limitDown = metrics?.limit_down_count ?? 0;
  const brokenCount = metrics?.broken_limit_count ?? 0;
  const brokenRatio = metrics?.broken_limit_ratio ?? 0;
  const sealRate =
    metrics?.seal_rate_pct ??
    (limitUp + brokenCount > 0 ? Number(((limitUp / (limitUp + brokenCount)) * 100).toFixed(1)) : 0);
  const tiers = metrics?.limit_up_tiers;
  const upRatioPct = metrics?.up_ratio_pct ?? null;

  // 2. 多周期真实量能与昨日同期对比 (T-1 / MA5 / MA10 / 昨日同期分时)
  const volumeRatio = multiVol?.ma5_ratio ?? metrics?.volume_ma5_ratio ?? 0;
  const volumeDiffPct = multiVol?.ma5_diff_pct ?? metrics?.volume_diff_pct ?? 0;
  const t1Ratio = multiVol?.t1_ratio ?? 0;
  const t1DiffPct = multiVol?.t1_diff_pct ?? 0;
  const ma10Ratio = multiVol?.ma10_ratio ?? 0;
  const ma10DiffPct = multiVol?.ma10_diff_pct ?? 0;

  const todayVolYi = multiVol?.today_volume_yi_shou ?? 0;
  const projectedVolYi = multiVol?.projected_volume_yi_shou ?? todayVolYi;
  const yesterdayVolYi = multiVol?.t1_volume_yi_shou ?? 0;
  const ma5VolYi = multiVol?.ma5_volume_yi_shou ?? 0;
  const ma10VolYi = multiVol?.ma10_volume_yi_shou ?? 0;

  const hasSameTime = Boolean(
    multiVol?.today_amount_yi && multiVol?.yesterday_same_time_yi && multiVol?.as_of_time
  );
  const sameTimeDiffPct = multiVol?.same_time_diff_pct ?? 0;
  const sameTimeDiffYi = multiVol?.same_time_diff_yi ?? 0;
  const dailySeries = multiVol?.daily_series || [];
  const maxSeriesVol = Math.max(
    1,
    ...dailySeries.map((d) => Number(d.volume_yi_shou) || 0)
  );

  // 3. 独家特色量化指标
  const mainlinePct = metrics?.mainline_concentration_pct ?? 0;
  const mainlineName = metrics?.mainline_name ?? "等待行业主线数据...";
  const mainlineEval = metrics?.mainline_evaluation ?? "正在计算行业板块资金集中度";
  const mainlineGainers = metrics?.mainline_top_gainers ?? "--";

  const highRiskIndex = metrics?.high_risk_index ?? 0;
  const highRiskLevel = metrics?.high_risk_level ?? "LOW";
  const highRiskDesc = metrics?.high_risk_desc ?? "正在统计全市场深跌核按钮强度...";

  const temp = metrics?.sentiment_temperature ?? 50;
  const tempPhase = metrics?.temperature_phase ?? "多空情绪实时测算中...";

  const midCapDefense = metrics?.mid_cap_defense_coefficient ?? 0;
  const defenseStatus = metrics?.defense_status ?? "正在监测沪深300与国证2000剪刀差";

  const leaders = metrics?.highest_limit_leaders && metrics.highest_limit_leaders.length > 0
    ? metrics.highest_limit_leaders
    : [];

  const trafficLight = evaluateMarketTrafficLight(temp);
  const trafficStyle =
    trafficLight.light === "RED"
      ? {
          wrap: "bg-[#D71018]/6 border-[#D71018]/30 text-[#0F0F0F]",
          dot: "bg-[#D71018] shadow-[0_0_10px_rgba(215,16,24,0.45)]",
          badge: "bg-[#D71018] text-[#FFFFFF] border-[#D71018]",
        }
      : trafficLight.light === "YELLOW"
      ? {
          wrap: "bg-[#FFFFF2] border-[#C8C8C8] text-[#0F0F0F]",
          dot: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.45)]",
          badge: "bg-[#042328] text-[#E1F209] border-[#184120]",
        }
      : {
          wrap: "bg-[#E0E7D9]/70 border-[#184120]/30 text-[#0F0F0F]",
          dot: "bg-[#33DD18] shadow-[0_0_10px_rgba(51,221,24,0.5)]",
          badge: "bg-[#184120] text-[#E1F209] border-[#184120]",
        };

  const aiSummary = metrics?.ai_summary;

  return (
    <div className="rounded-3xl bg-[#FFFFFF] border border-[#D8D8E4] p-5 shadow-[0_10px_32px_rgba(4,35,40,0.05)] space-y-4">
      {/* 市场情绪红绿灯买点总闸门 */}
      <div className={`rounded-2xl border px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 ${trafficStyle.wrap}`}>
        <div className="flex items-center gap-3">
          <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${trafficStyle.dot}`} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold tracking-wide text-[#0F0F0F]">市场情绪红绿灯总闸门：{trafficLight.label}</span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono font-semibold ${trafficStyle.badge}`}>
                买点A(回踩低吸): {trafficLight.allow_pullback_buy ? "放行" : "屏蔽"} · 买点B(放量突破): {trafficLight.allow_breakout_buy ? "放行" : "屏蔽"}
              </span>
            </div>
            <p className="text-[11px] text-[#282828] mt-0.5">{trafficLight.summary}</p>
          </div>
        </div>
        <div className="text-[11px] font-mono text-[#263844] shrink-0">
          阈值：&lt;30红灯 · 30~55黄灯 · ≥55绿灯
        </div>
      </div>

      {/* 头部标题与即时状态栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E0E0E0] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#D71018]/10 text-[#D71018] border border-[#D71018]/25">
            <Flame className="w-4 h-4 animate-pulse" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#0F0F0F] flex items-center gap-2">
              全市场短线量化盘口与情绪大屏
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#042328] text-[#E1F209] font-mono">
                实时短线盘口 · 独家特色量化雷达
              </span>
            </h2>
            <p className="text-[11px] text-[#263844]">
              整合全市场实时涨跌停、炸板率、多周期量能比(T-1/MA5/MA10)及 4 大特色量化雷达指标 (100% 动态实时计算)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono text-[#263844] flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#33DD18] animate-ping" />
            <span>数据源: 极速双通道 (新浪/腾讯实时日K)</span>
            {lastUpdate && <span className="text-[#042328] font-semibold">({lastUpdate})</span>}
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="px-2.5 py-1 rounded-xl bg-[#F8F8F4] hover:bg-[#E0E7D9]/70 text-[#042328] text-xs font-medium border border-[#D8D8E4] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="手动刷新实时盘口指标"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#042328]" : ""}`} />
            <span>刷新</span>
          </button>
        </div>
      </div>

      {/* 第一行：短线必看 4 大基础盘口要素 (连板梯队 / 涨跌停 / 封板率与赚钱效应 / 昨日同期与5日10日量比) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* 指标 1: 实时涨停与连板梯队 */}
        <div className="p-3.5 rounded-2xl bg-[#F8F8F4] border border-[#D8D8E4] hover:border-[#D71018]/45 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#263844] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D71018]" />
              涨停与连板梯队
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D71018]/10 text-[#D71018] border border-[#D71018]/25 font-mono font-bold">
              最高 {metrics?.highest_limit_height ?? 0} 板
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-black text-[#D71018] font-mono tracking-tight">
              {hasLive ? limitUp : "--"}
              <span className="text-xs font-normal text-[#263844] ml-1">家涨停</span>
            </div>
            {upRatioPct !== null && (
              <span className="text-[11px] font-mono text-[#263844]">
                涨家占比 <strong className={upRatioPct >= 50 ? "text-[#D71018]" : "text-[#184120]"}>{upRatioPct}%</strong>
              </span>
            )}
          </div>
          {tiers && (
            <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] font-mono text-center">
              <div className="rounded bg-[#FFFFFF] py-1 border border-[#E0E0E0]">
                <div className="text-[#263844]/70 text-[9px]">首板</div>
                <div className="text-[#D71018] font-bold">{tiers.first_board}</div>
              </div>
              <div className="rounded bg-[#FFFFFF] py-1 border border-[#E0E0E0]">
                <div className="text-[#263844]/70 text-[9px]">2板</div>
                <div className="text-[#D71018] font-bold">{tiers.second_board}</div>
              </div>
              <div className="rounded bg-[#FFFFFF] py-1 border border-[#E0E0E0]">
                <div className="text-[#263844]/70 text-[9px]">3板</div>
                <div className="text-[#042328] font-bold">{tiers.third_board}</div>
              </div>
              <div className="rounded bg-[#FFFFFF] py-1 border border-[#E0E0E0]">
                <div className="text-[#263844]/70 text-[9px]">4板+</div>
                <div className="text-[#042328] font-bold">{tiers.high_board}</div>
              </div>
            </div>
          )}
          <div className="mt-2 pt-2 border-t border-[#E4E4E8] text-[10.5px] text-[#282828] truncate">
            <span className="text-[#D71018] font-semibold">前排标杆: </span>
            {leaders.length > 0 ? leaders.join(" · ") : "暂无连板高标"}
          </div>
        </div>

        {/* 指标 2: 空头跌停与深跌亏钱效应 */}
        <div className="p-3.5 rounded-2xl bg-[#F8F8F4] border border-[#D8D8E4] hover:border-[#184120]/45 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#263844] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#184120]" />
              跌停与亏钱效应
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                limitDown > 15
                  ? "bg-[#184120] text-[#E1F209] border border-[#184120]"
                  : "bg-[#E0E7D9] text-[#184120] border border-[#184120]/20"
              }`}
            >
              {limitDown > 15 ? "空头杀跌" : "跌停受控"}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-black text-[#184120] font-mono tracking-tight">
              {hasLive ? limitDown : "--"}
              <span className="text-xs font-normal text-[#263844] ml-1">家跌停</span>
            </div>
            <span className="text-[11px] text-[#263844] font-mono">
              深跌(&lt;-5%) {metrics?.deep_drop_count ?? 0} 家
            </span>
          </div>
          {metrics?.up_count !== undefined && metrics?.down_count !== undefined && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#D71018] font-bold">涨 {metrics.up_count}</span>
                <span className="text-[#184120] font-bold">跌 {metrics.down_count}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#E0E7D9] overflow-hidden">
                <div
                  className="h-full bg-[#D71018] transition-all duration-500"
                  style={{ width: `${upRatioPct ?? 50}%` }}
                />
              </div>
            </div>
          )}
          <div className="mt-2 pt-2 border-t border-[#E4E4E8] text-[10.5px] text-[#282828] truncate">
            <span className="text-[#184120] font-semibold">风控研判: </span>
            {limitDown <= 15 ? "跌停较温和，严防高位跟风退潮" : "跌停快速扩容，严禁接力防核按钮"}
          </div>
        </div>

        {/* 指标 3: 实时封板率与炸板率 */}
        <div className="p-3.5 rounded-2xl bg-[#F8F8F4] border border-[#D8D8E4] hover:border-[#042328]/45 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#263844] font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#042328]" />
              封板率与炸板率
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                brokenRatio <= 22
                  ? "bg-[#D71018]/10 text-[#D71018] border border-[#D71018]/25"
                  : "bg-[#042328] text-[#E1F209] border border-[#184120]"
              }`}
            >
              {brokenRatio <= 22 ? "封板坚挺" : "分歧炸板"}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div
              className={`text-3xl font-black font-mono tracking-tight ${
                sealRate >= 75 ? "text-[#D71018]" : "text-[#042328]"
              }`}
            >
              {hasLive ? `${sealRate}%` : "--"}
              <span className="text-xs font-normal text-[#263844] ml-1">封板</span>
            </div>
            <span className="text-[11px] text-[#263844] font-mono">
              炸板 {brokenRatio}% ({brokenCount}/{limitUp + brokenCount})
            </span>
          </div>
          <div className="mt-2 w-full bg-[#E4E4E8] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#D71018] to-[#042328] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, sealRate)}%` }}
            />
          </div>
          <div className="mt-2 pt-2 border-t border-[#E4E4E8] text-[10.5px] text-[#282828] truncate">
            <span className="text-[#042328] font-semibold">接力容错: </span>
            {brokenRatio <= 22 ? "触板封死率高，接力情绪偏良性" : "炸板增多，谨防冲高派发，优先低吸"}
          </div>
        </div>

        {/* 指标 4: 昨日同期 HH:MM + 5日/10日量比 + 近10日量能柱状图 */}
        <div className="p-3.5 rounded-2xl bg-[#F8F8F4] border border-[#D8D8E4] hover:border-[#042328]/45 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#263844] font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#042328]" />
              {hasSameTime ? `昨日同期 (${multiVol?.as_of_time})` : "多周期量能比"}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold ${
                (hasSameTime ? sameTimeDiffPct : volumeDiffPct) >= 0
                  ? "bg-[#D71018]/10 text-[#D71018] border-[#D71018]/25"
                  : "bg-[#E0E7D9] text-[#184120] border-[#184120]/25"
              }`}
            >
              {(hasSameTime ? sameTimeDiffPct : volumeDiffPct) >= 0 ? "放量博弈" : "缩量整固"}
            </span>
          </div>

          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#0F0F0F] font-mono tracking-tight">
              {hasSameTime ? (
                <span className={sameTimeDiffPct >= 0 ? "text-[#D71018]" : "text-[#184120]"}>
                  {sameTimeDiffPct >= 0 ? `+${sameTimeDiffPct}%` : `${sameTimeDiffPct}%`}
                </span>
              ) : (
                <>
                  {volumeRatio}
                  <span className="text-xs font-normal text-[#263844] ml-1">x (MA5)</span>
                </>
              )}
            </div>
            <div className="text-right font-mono text-[10.5px] leading-tight">
              {hasSameTime ? (
                <>
                  <div className={sameTimeDiffYi >= 0 ? "text-[#D71018] font-bold" : "text-[#184120] font-bold"}>
                    {sameTimeDiffYi >= 0 ? `+${sameTimeDiffYi}` : sameTimeDiffYi}亿 较昨同期
                  </div>
                  <div className="text-[#263844]">
                    预计全天 <span className="text-[#042328] font-bold">{multiVol?.projected_full_yi}亿</span>
                  </div>
                </>
              ) : (
                <span className={volumeDiffPct >= 0 ? "text-[#D71018] font-bold" : "text-[#184120] font-bold"}>
                  {volumeDiffPct >= 0 ? `+${volumeDiffPct}%` : `${volumeDiffPct}%`}
                </span>
              )}
            </div>
          </div>

          {/* 昨日(T-1) / 5日(MA5) / 10日(MA10) 同口径量比胶囊 */}
          <div className="mt-2 pt-2 border-t border-[#E4E4E8] grid grid-cols-3 gap-1 text-[9.5px] font-mono">
            <div className="bg-[#FFFFFF] rounded px-1 py-0.5 border border-[#E0E0E0] flex flex-col items-center">
              <span className="text-[#263844]/70 text-[9px]">较昨全天</span>
              <span className={`font-bold ${t1DiffPct >= 0 ? "text-[#D71018]" : "text-[#184120]"}`}>
                {t1Ratio}x ({t1DiffPct >= 0 ? `+${t1DiffPct}%` : `${t1DiffPct}%`})
              </span>
            </div>
            <div className="bg-[#FFFFFF] rounded px-1 py-0.5 border border-[#E0E0E0] flex flex-col items-center">
              <span className="text-[#263844]/70 text-[9px]">5日量比</span>
              <span className={`font-bold ${volumeDiffPct >= 0 ? "text-[#D71018]" : "text-[#184120]"}`}>
                {volumeRatio}x ({volumeDiffPct >= 0 ? `+${volumeDiffPct}%` : `${volumeDiffPct}%`})
              </span>
            </div>
            <div className="bg-[#FFFFFF] rounded px-1 py-0.5 border border-[#E0E0E0] flex flex-col items-center">
              <span className="text-[#263844]/70 text-[9px]">10日量比</span>
              <span className={`font-bold ${ma10DiffPct >= 0 ? "text-[#D71018]" : "text-[#184120]"}`}>
                {ma10Ratio}x ({ma10DiffPct >= 0 ? `+${ma10DiffPct}%` : `${ma10DiffPct}%`})
              </span>
            </div>
          </div>

          {/* 近10日量能微型柱状趋势 + 详情 */}
          {dailySeries.length > 0 && (
            <div className="mt-1.5 flex items-end gap-1 h-5 pt-0.5" title="近10日两市全天/折算量能对比">
              {dailySeries.map((pt) => {
                const h = Math.max(15, Math.round((pt.volume_yi_shou / maxSeriesVol) * 100));
                return (
                  <div
                    key={pt.date}
                    title={`${pt.date}: ${pt.volume_yi_shou}亿手${pt.is_projected ? " (全天折算)" : ""}`}
                    className={`flex-1 rounded-t-xs transition-all ${
                      pt.is_projected ? "bg-[#042328]" : "bg-[#C8C8C8] hover:bg-[#263844]"
                    }`}
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>
          )}

          <div className="mt-1 text-[9.5px] text-[#263844] font-mono truncate">
            {hasSameTime
              ? `实盘 ${multiVol?.today_amount_yi}亿 / 昨同期 ${multiVol?.yesterday_same_time_yi}亿 · 昨全天 ${multiVol?.yesterday_full_yi}亿`
              : `折算 ${projectedVolYi}亿手 · 昨 ${yesterdayVolYi} · 5日均 ${ma5VolYi} · 10日均 ${ma10VolYi}`}
          </div>
        </div>
      </div>

      {/* 第二行：4 大独家特色高级量化指标 (同花顺/东财难一眼看出的独家量化雷达) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
        {/* 独家 1: 主线资金集聚度 (真实新浪49行业板块成交计算) */}
        <div className="p-4 rounded-2xl bg-[#F2F7F9] border border-[#D8D8E4] hover:border-[#042328]/45 transition-all flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F0F0F] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#042328]" />
              主线资金集聚度
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#042328] text-[#E1F209] font-mono font-bold">
              Top3 吸金占比
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-[#042328] font-mono tracking-tight">
              {mainlinePct}%
            </div>
            <span className="text-[10px] text-[#D71018] font-mono font-bold">
              {mainlinePct >= 35 ? "超强主线聚焦" : mainlinePct >= 28 ? "结构性抱团" : "分散轮动"}
            </span>
          </div>

          {/* 进度条 */}
          <div className="w-full bg-[#E4E4E8] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#042328] to-[#184120] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (mainlinePct / 50) * 100)}%` }}
            />
          </div>

          <div className="text-[10.5px] text-[#282828] line-clamp-1">
            <span className="text-[#263844]">吸金行业: </span>
            <span className="text-[#0F0F0F] font-semibold">{mainlineName}</span>
          </div>
          <div className="text-[10px] text-[#D71018] truncate font-medium">
            <span className="text-[#263844] font-normal">领涨板块: </span>
            {mainlineGainers}
          </div>
          <p className="text-[10px] text-[#263844] leading-snug truncate">
            💡 {mainlineEval}
          </p>
        </div>

        {/* 独家 2: 高标核按钮大面风险指数 (真实深跌>-5%个股测算) */}
        <div className="p-4 rounded-2xl bg-[#F2F7F9] border border-[#D8D8E4] hover:border-[#184120]/45 transition-all flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F0F0F] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#184120]" />
              高标核按钮风险指数
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                highRiskLevel === "LOW"
                  ? "bg-[#E0E7D9] text-[#184120] border border-[#184120]/25"
                  : highRiskLevel === "MEDIUM"
                  ? "bg-[#FFFFF2] text-[#0F0F0F] border border-[#C8C8C8]"
                  : "bg-[#D71018] text-[#FFFFFF] border border-[#D71018]"
              }`}
            >
              {highRiskLevel === "LOW" ? "低风险 · 安全" : highRiskLevel === "MEDIUM" ? "中风险 · 分歧" : "高风险 · 预警"}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div
              className={`text-2xl font-black font-mono tracking-tight ${
                highRiskLevel === "LOW" ? "text-[#184120]" : highRiskLevel === "MEDIUM" ? "text-[#263844]" : "text-[#D71018]"
              }`}
            >
              {highRiskIndex}%
            </div>
            <span className="text-[10px] text-[#263844] font-mono">
              全市场深跌强度
            </span>
          </div>

          <div className="w-full bg-[#E4E4E8] rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                highRiskLevel === "LOW" ? "bg-[#184120]" : highRiskLevel === "MEDIUM" ? "bg-[#263844]" : "bg-[#D71018]"
              }`}
              style={{ width: `${Math.min(100, highRiskIndex)}%` }}
            />
          </div>

          <p className="text-[10.5px] text-[#282828] leading-snug line-clamp-2">
            💡 {highRiskDesc}
          </p>
        </div>

        {/* 独家 3: 多空情绪综合温度计 (0~100°C 严格结合涨跌比与盘口推导) */}
        <div className="p-4 rounded-2xl bg-[#F2F7F9] border border-[#D8D8E4] hover:border-[#D71018]/45 transition-all flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F0F0F] flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#D71018]" />
              多空情绪温度计
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#042328] text-[#E1F209] font-mono font-bold">
              全景加权
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div
              className={`text-2xl font-black font-mono tracking-tight flex items-baseline gap-0.5 ${
                temp >= 60 ? "text-[#D71018]" : temp >= 40 ? "text-[#042328]" : "text-[#184120]"
              }`}
            >
              {temp}
              <span className="text-sm font-normal text-[#263844]">°C</span>
            </div>
            <span className="text-[10px] text-[#263844] font-mono">
              0°C 冰点 ~ 100°C 狂热
            </span>
          </div>

          <div className="w-full bg-[#E4E4E8] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#184120] via-[#042328] to-[#D71018] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, temp)}%` }}
            />
          </div>

          <p className="text-[10.5px] text-[#282828] leading-snug line-clamp-2">
            🌡️ <span className="text-[#042328] font-semibold">{tempPhase}</span>
          </p>
        </div>

        {/* 独家 4: 百亿中军大盘护盘系数 (沪深300 vs 国证2000真实剪刀差) */}
        <div className="p-4 rounded-2xl bg-[#F2F7F9] border border-[#D8D8E4] hover:border-[#042328]/45 transition-all flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F0F0F] flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[#042328]" />
              百亿中军护盘系数
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#042328] text-[#E1F209] font-mono font-bold">
              剪刀差监测
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className={`text-2xl font-black font-mono tracking-tight ${midCapDefense >= 0 ? "text-[#D71018]" : "text-[#184120]"}`}>
              {midCapDefense >= 0 ? `+${midCapDefense}%` : `${midCapDefense}%`}
            </div>
            <span className="text-[10px] text-[#263844] font-mono">
              沪深300 vs 国证2000
            </span>
          </div>

          <div className="w-full bg-[#E4E4E8] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#042328] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.abs(midCapDefense) * 50 + 20)}%` }}
            />
          </div>

          <p className="text-[10.5px] text-[#282828] leading-snug line-clamp-2">
            ⚖️ <span className="text-[#042328] font-semibold">结构研判: </span>
            {defenseStatus}
          </p>
        </div>
      </div>

      {/* 第三行：AI 动态全景量化研判与操作纪律 (基于实测数据动态生成，绝不写死) */}
      {aiSummary && (
        <div className="rounded-2xl bg-[#F8F8F4] border border-[#D8D8E4] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#042328] text-[#E1F209]">
                <Bot className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold text-[#0F0F0F] flex items-center gap-1.5">
                AI 盘口研判与量化纪律总结
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E0E7D9] text-[#184120] border border-[#184120]/20 font-mono">
                  全自动多维推导
                </span>
              </span>
            </div>
            <span className="text-[10.5px] text-[#263844] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#042328]" />
              动态交叉验证 · 拒绝假数据
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
            {/* 1. 量能走势分析 */}
            <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#D8D8E4] flex flex-col justify-between">
              <div>
                <span className="font-bold text-[#042328] flex items-center gap-1 mb-1">
                  <Activity className="w-3 h-3 text-[#042328]" />
                  多周期量能真实研判:
                </span>
                <p className="text-[#282828] text-[11px] leading-relaxed">
                  {aiSummary.volume_analysis}
                </p>
              </div>
            </div>

            {/* 2. 多空全景分析 */}
            <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#D8D8E4] flex flex-col justify-between">
              <div>
                <span className="font-bold text-[#263844] flex items-center gap-1 mb-1">
                  <Gauge className="w-3 h-3 text-[#263844]" />
                  多空温度与梯队情绪:
                </span>
                <p className="text-[#282828] text-[11px] leading-relaxed">
                  {aiSummary.breadth_analysis}
                </p>
              </div>
            </div>

            {/* 3. 权重与行业主线分析 */}
            <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#D8D8E4] flex flex-col justify-between">
              <div>
                <span className="font-bold text-[#184120] flex items-center gap-1 mb-1">
                  <Scale className="w-3 h-3 text-[#184120]" />
                  中军大盘与主线赛道:
                </span>
                <p className="text-[#282828] text-[11px] leading-relaxed">
                  {aiSummary.defense_analysis}
                </p>
              </div>
            </div>

            {/* 4. 操盘纪律与建议 */}
            <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#D71018]/25 flex flex-col justify-between">
              <div>
                <span className="font-bold text-[#D71018] flex items-center gap-1 mb-1">
                  <ShieldCheck className="w-3 h-3 text-[#D71018]" />
                  短线接力纪律与仓位指导:
                </span>
                <p className="text-[#282828] text-[11px] leading-relaxed">
                  {aiSummary.tactical_guidance}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
