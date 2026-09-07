"use client";

import { useEffect, useState } from "react";
import { Flame, Zap, BarChart3, ArrowUpRight } from "lucide-react";

interface SectorItem {
  code: string;
  name: string;
  change_pct: number;
  stock_count: number;
  amount: number;
  leader_name: string;
  leader_code: string;
  leader_change: number;
  inflow_status: "净流入" | "温和流入" | "流出";
}

interface SentimentRadarVisualProps {
  volumeMetrics?: any;
}

export function SentimentRadarVisual({ volumeMetrics }: SentimentRadarVisualProps) {
  const [sectors, setSectors] = useState<SectorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSectors() {
      try {
        const res = await fetch("/api-market/sectors");
        if (res.ok) {
          const json = await res.json();
          if (json.top_sectors) {
            setSectors(json.top_sectors);
          }
        }
      } catch (err) {
        console.error("加载板块数据失败:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSectors();
  }, []);

  const brokenRate = volumeMetrics?.broken_limit_ratio ?? 16.4;
  const brokenMa20 = volumeMetrics?.broken_limit_ma20 ?? 22.5;
  const brokenDiff = (brokenRate - brokenMa20).toFixed(1);
  const highestHeight = volumeMetrics?.highest_limit_height ?? 7;
  const highestPeak = volumeMetrics?.highest_limit_ma20_peak ?? 8;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
      {/* 1. 主力资金博弈动向 */}
      <div className="p-4 rounded-2xl bg-[#0c1626]/80 border border-cyan-500/20 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-cyan-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            主力资金博弈动向
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
            大单·机构席位
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-emerald-400 tracking-tight font-mono">
              +158.4 亿
            </span>
            <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-0.5 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              主力大幅净流入
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            超大单席位聚焦算力PCB与光通信主线，北向通道呈现连续增仓，主力承接动能稳定。
          </p>
        </div>

        {/* 主力资金流向刻度柱 */}
        <div className="space-y-1 pt-2 border-t border-cyan-900/40">
          <div className="flex justify-between text-[10px] text-slate-300 font-mono">
            <span>主力买入 62.4%</span>
            <span>散户流出 37.6%</span>
          </div>
          <div className="w-full bg-[#091220] rounded-full h-1.5 flex overflow-hidden border border-cyan-950">
            <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-1.5 w-[62.4%] transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
            <div className="bg-slate-800 h-1.5 w-[37.6%]" />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>机构主导进攻</span>
            <span>筹码充分换手</span>
          </div>
        </div>
      </div>

      {/* 2. 短线情绪周期温度计 (近期动态对比) */}
      <div className="p-4 rounded-2xl bg-[#0c1626]/80 border border-cyan-500/20 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-cyan-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            短线情绪基准对比
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
            近20日中枢对比
          </span>
        </div>

        {/* 情绪指标卡 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-xl bg-[#0f1d35]/70 border border-cyan-500/20 text-center">
            <div className="text-[10px] text-slate-400">今日涨停</div>
            <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">72 家</div>
          </div>
          <div className="p-2 rounded-xl bg-[#0f1d35]/70 border border-cyan-500/20 text-center">
            <div className="text-[10px] text-slate-400">今日跌停</div>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">2 家</div>
          </div>
          <div className="p-2 rounded-xl bg-[#0f1d35]/70 border border-cyan-500/20 text-center">
            <div className="text-[10px] text-slate-400">日内炸板率</div>
            <div className="text-sm font-bold text-white font-mono mt-0.5">{brokenRate}%</div>
          </div>
        </div>

        {/* 炸板率与连板高度近期中枢对比标注 */}
        <div className="pt-2 border-t border-cyan-900/40 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">炸板率对比:</span>
            <span className="text-emerald-400 font-mono font-medium">
              低于近月均值 {brokenDiff}% (中枢{brokenMa20}%)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">最高连板空间:</span>
            <span className="text-white font-mono font-medium">
              {highestHeight} 连板龙头 (近月极值 {highestPeak} 板)
            </span>
          </div>
        </div>
      </div>

      {/* 3. 领涨主线与板块排行 Top 6 */}
      <div className="p-4 rounded-2xl bg-[#0c1626]/80 border border-cyan-500/20 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-cyan-300 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            领涨行业板块 Top 6
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {loading ? "更新中..." : "新浪实盘"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {sectors.slice(0, 6).map((sec, idx) => (
            <div
              key={sec.code || idx}
              className="p-1.5 px-2 rounded-xl bg-[#0f1d35]/70 border border-cyan-500/20 hover:border-cyan-400/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-white truncate max-w-[70px]">
                  {sec.name}
                </span>
                <span className="text-[11px] font-bold text-rose-400 font-mono">
                  +{sec.change_pct}%
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                <span className="truncate max-w-[65px] text-slate-300">
                  {sec.leader_name}
                </span>
                <span className="text-rose-400 font-mono">
                  +{sec.leader_change}%
                </span>
              </div>
            </div>
          ))}
          {sectors.length === 0 && !loading && (
            <div className="col-span-2 text-center py-3 text-xs text-slate-400">
              暂无板块数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
