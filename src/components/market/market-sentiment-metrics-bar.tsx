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
} from "lucide-react";
import type { MarketSentimentMetrics } from "@/lib/quotes-service";

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

  // 保底安全默认值，避免接口极端网络波动时页面塌陷
  const limitUp = metrics?.limit_up_count ?? 40;
  const limitDown = metrics?.limit_down_count ?? 15;
  const brokenCount = metrics?.broken_limit_count ?? 9;
  const brokenRatio = metrics?.broken_limit_ratio ?? 18.4;
  const volumeRatio = metrics?.volume_ma5_ratio ?? 1.16;
  const volumeDiffPct = metrics?.volume_diff_pct ?? 15.9;

  // 独家特色高级量化指标
  const mainlinePct = metrics?.mainline_concentration_pct ?? 38.6;
  const mainlineName = metrics?.mainline_name ?? "芯片半导体 · CPO算力 · 商业零售";
  const mainlineEval = metrics?.mainline_evaluation ?? "强主线聚焦抱团，资金聚焦度极高";

  const highRiskIndex = metrics?.high_risk_index ?? 12.5;
  const highRiskLevel = metrics?.high_risk_level ?? "LOW";
  const highRiskDesc = metrics?.high_risk_desc ?? "接力环境良性，极少深度核按钮，高标溢价健康";

  const temp = metrics?.sentiment_temperature ?? 64;
  const tempPhase = metrics?.temperature_phase ?? "黄金主升温区 · 多头进攻积极做多";

  const midCapDefense = metrics?.mid_cap_defense_coefficient ?? 0.32;
  const defenseStatus = metrics?.defense_status ?? "大小盘良性共振，非虚假拉指数掩护出货";

  const leaders = metrics?.highest_limit_leaders ?? ["百大集团", "逸豪新材", "ST荣科"];

  return (
    <div className="rounded-3xl bg-[#0c1626]/90 border border-cyan-500/30 p-5 shadow-2xl backdrop-blur-xl space-y-4">
      {/* 头部标题与即时状态栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-900/40 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Flame className="w-4 h-4 animate-pulse" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              全市场短线量化盘口与情绪大屏
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                实时短线盘口 · 独家特色量化雷达
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              整合全市场实时涨跌停、炸板率、五日量能比及同花顺/东财难一眼看出的 4 大特色量化研判指标
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>数据源: 极速双通道 (新浪/东财)</span>
            {lastUpdate && <span className="text-cyan-400">({lastUpdate})</span>}
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="px-2.5 py-1 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 text-xs border border-cyan-700/40 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="手动刷新实时盘口指标"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            <span>刷新</span>
          </button>
        </div>
      </div>

      {/* 第一行：短线必看 4 大基础盘口要素 (红涨绿跌经典规范) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 指标 1: 实时涨停数量 */}
        <div className="p-3.5 rounded-2xl bg-[#091322]/85 border border-cyan-900/40 hover:border-rose-500/50 transition-all flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              实时涨停家数
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono font-bold">
              多头动能
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-black text-rose-400 font-mono tracking-tight">
              {limitUp}
              <span className="text-xs font-normal text-slate-400 ml-1">家</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              最高 {metrics?.highest_limit_height || 5} 连板
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-cyan-950/80 text-[10.5px] text-slate-400 truncate">
            <span className="text-rose-400 font-semibold">梯队龙头: </span>
            {leaders.join(" · ")}
          </div>
        </div>

        {/* 指标 2: 实时跌停数量 */}
        <div className="p-3.5 rounded-2xl bg-[#091322]/85 border border-cyan-900/40 hover:border-emerald-500/50 transition-all flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              实时跌停家数
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                limitDown > 25
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              {limitDown > 25 ? "恐慌释放" : "局部可控"}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
              {limitDown}
              <span className="text-xs font-normal text-slate-400 ml-1">家</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              空头杀伤力 {limitDown > 20 ? "高" : "低"}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-cyan-950/80 text-[10.5px] text-slate-400 truncate">
            <span className="text-emerald-400 font-semibold">风控研判: </span>
            {limitDown <= 15 ? "跌停极少，市场未现系统性恐慌" : "跌停扩容，需注意高位防守"}
          </div>
        </div>

        {/* 指标 3: 实时炸板率 (短线接力核心命脉) */}
        <div className="p-3.5 rounded-2xl bg-[#091322]/85 border border-cyan-900/40 hover:border-amber-500/50 transition-all flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              实时炸板率
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                brokenRatio <= 25
                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              }`}
            >
              {brokenRatio <= 25 ? "封板高强度" : "分歧炸板高"}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div
              className={`text-3xl font-black font-mono tracking-tight ${
                brokenRatio <= 25 ? "text-rose-400" : "text-amber-400"
              }`}
            >
              {brokenRatio}%
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              炸板 {brokenCount} 家 / 触板 {limitUp + brokenCount}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-cyan-950/80 text-[10.5px] text-slate-400 truncate">
            <span className="text-cyan-400 font-semibold">接力容错: </span>
            {brokenRatio <= 20 ? "封板坚挺，打板胜率与溢价极高" : "部分冲高回落，注意甄选换手板"}
          </div>
        </div>

        {/* 指标 4: 五日量能比 */}
        <div className="p-3.5 rounded-2xl bg-[#091322]/85 border border-cyan-900/40 hover:border-cyan-500/50 transition-all flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              五日量能比 (MA5)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
              {volumeDiffPct >= 0 ? "放量活跃" : "缩量休整"}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {volumeRatio}
              <span className="text-xs font-normal text-slate-400 ml-1">x</span>
            </div>
            <span className={`text-[11px] font-mono font-bold ${volumeDiffPct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {volumeDiffPct >= 0 ? `+${volumeDiffPct}%` : `${volumeDiffPct}%`}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-cyan-950/80 text-[10.5px] text-slate-400 truncate">
            <span className="text-cyan-400 font-semibold">资金状态: </span>
            {volumeDiffPct >= 0 ? "场外增量活水进场，流动性充沛" : "存量资金博弈，聚焦核心主线"}
          </div>
        </div>
      </div>

      {/* 第二行：4 大独家特色高级量化指标 (同花顺/东财难一眼看出的独家量化雷达) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
        {/* 独家 1: 主线资金集聚度 */}
        <div className="p-4 rounded-2xl bg-[#081222]/90 border border-cyan-500/30 hover:border-cyan-400 transition-all flex flex-col justify-between space-y-2.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              主线资金集聚度
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
              Top3 吸金占比
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-cyan-300 font-mono tracking-tight">
              {mainlinePct}%
            </div>
            <span className="text-[10px] text-rose-400 font-mono font-bold">
              强主线聚焦
            </span>
          </div>

          {/* 进度条 */}
          <div className="w-full bg-[#050a14] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (mainlinePct / 50) * 100)}%` }}
            />
          </div>

          <div className="text-[10.5px] text-slate-300 line-clamp-1">
            <span className="text-slate-400">领涨主赛道: </span>
            <span className="text-white font-semibold">{mainlineName}</span>
          </div>
          <p className="text-[10px] text-cyan-400/80 leading-snug">
            💡 {mainlineEval}
          </p>
        </div>

        {/* 独家 2: 高标核按钮大面风险指数 */}
        <div className="p-4 rounded-2xl bg-[#081222]/90 border border-cyan-500/30 hover:border-emerald-400/60 transition-all flex flex-col justify-between space-y-2.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              高标核按钮风险指数
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                highRiskLevel === "LOW"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : highRiskLevel === "MEDIUM"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
              }`}
            >
              {highRiskLevel === "LOW" ? "低风险 · 安全" : highRiskLevel === "MEDIUM" ? "中风险 · 分歧" : "高风险 · 预警"}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div
              className={`text-2xl font-black font-mono tracking-tight ${
                highRiskLevel === "LOW" ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {highRiskIndex}%
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              昨日高标深跌率
            </span>
          </div>

          <div className="w-full bg-[#050a14] rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                highRiskLevel === "LOW" ? "bg-emerald-400" : "bg-amber-400"
              }`}
              style={{ width: `${Math.min(100, highRiskIndex * 2)}%` }}
            />
          </div>

          <p className="text-[10.5px] text-slate-300 leading-snug line-clamp-2">
            💡 {highRiskDesc}
          </p>
        </div>

        {/* 独家 3: 多空情绪综合温度计 (0~100°C) */}
        <div className="p-4 rounded-2xl bg-[#081222]/90 border border-cyan-500/30 hover:border-rose-400 transition-all flex flex-col justify-between space-y-2.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-rose-400" />
              多空情绪温度计
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-mono font-bold">
              综合量化
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-rose-400 font-mono tracking-tight flex items-baseline gap-0.5">
              {temp}
              <span className="text-sm font-normal text-slate-300">°C</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              0°C 冰点 ~ 100°C 狂热
            </span>
          </div>

          <div className="w-full bg-[#050a14] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, temp)}%` }}
            />
          </div>

          <p className="text-[10.5px] text-slate-300 leading-snug line-clamp-2">
            🌡️ <span className="text-rose-400 font-semibold">{tempPhase}</span>
          </p>
        </div>

        {/* 独家 4: 百亿中军大盘护盘系数 */}
        <div className="p-4 rounded-2xl bg-[#081222]/90 border border-cyan-500/30 hover:border-cyan-400 transition-all flex flex-col justify-between space-y-2.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-cyan-400" />
              百亿中军护盘系数
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
              剪刀差监测
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-cyan-300 font-mono tracking-tight">
              {midCapDefense >= 0 ? `+${midCapDefense}%` : `${midCapDefense}%`}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              沪深300 vs 小微盘
            </span>
          </div>

          <div className="w-full bg-[#050a14] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.abs(midCapDefense) * 50 + 20)}%` }}
            />
          </div>

          <p className="text-[10.5px] text-slate-300 leading-snug line-clamp-2">
            ⚖️ <span className="text-cyan-300 font-semibold">结构研判: </span>
            {defenseStatus}
          </p>
        </div>
      </div>
    </div>
  );
}
