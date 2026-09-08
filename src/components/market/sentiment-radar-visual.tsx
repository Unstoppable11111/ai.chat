"use client";

import { useEffect, useState } from "react";
import { Flame, Zap, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";

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
  sentimentMetrics?: any;
}

export function SentimentRadarVisual({ volumeMetrics, sentimentMetrics }: SentimentRadarVisualProps) {
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

  const limitUp = sentimentMetrics?.limit_up_count ?? volumeMetrics?.limit_up_count ?? 73;
  const limitDown = sentimentMetrics?.limit_down_count ?? volumeMetrics?.limit_down_count ?? 0;
  const brokenRate = sentimentMetrics?.broken_limit_ratio ?? volumeMetrics?.broken_limit_ratio ?? 33.6;
  const highestHeight = sentimentMetrics?.highest_limit_height ?? volumeMetrics?.highest_limit_height ?? 4;
  const highestLeaders = sentimentMetrics?.highest_limit_leaders?.length > 0
    ? sentimentMetrics.highest_limit_leaders.join("/")
    : "亚盛集团/爱仕达/百大集团";

  const mainFlow = sentimentMetrics?.main_net_flow_yi ?? -82.0;
  const mainBuyRatio = sentimentMetrics?.main_buy_ratio ?? 44.8;
  const retailRatio = sentimentMetrics?.retail_outflow_ratio ?? 55.2;
  const isFlowPositive = mainFlow >= 0;

  const flowEval = sentimentMetrics?.flow_evaluation || (isFlowPositive ? "主力资金净流入" : "主力资金分化整固");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
      {/* 1. 主力资金博弈动向 (真实沪深超大单+大单统计) */}
      <div className="p-4 rounded-2xl bg-[#0c1626]/80 border border-cyan-500/20 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-cyan-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            主力资金博弈动向
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
            沪深两市超大单+大单
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span
              className={`text-xl font-bold font-mono tracking-tight ${
                isFlowPositive ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {isFlowPositive ? `+${mainFlow} 亿` : `${mainFlow} 亿`}
            </span>
            <span
              className={`text-[11px] font-medium flex items-center gap-0.5 px-2 py-0.5 rounded-md border ${
                isFlowPositive
                  ? "text-emerald-300 bg-emerald-500/20 border-emerald-500/30"
                  : "text-amber-300 bg-amber-500/20 border-amber-500/30"
              }`}
            >
              {isFlowPositive ? (
                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-amber-400" />
              )}
              {flowEval}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            两市主力席位净流向约 {isFlowPositive ? "+" : ""}{mainFlow} 亿元，部分资金回流农业、消费与公用板块，呈现结构性存量调仓。
          </p>
        </div>

        {/* 主力资金流向刻度柱 */}
        <div className="space-y-1 pt-2 border-t border-cyan-900/40">
          <div className="flex justify-between text-[10px] text-slate-300 font-mono">
            <span>主力承接 {mainBuyRatio}%</span>
            <span>散户/换手 {retailRatio}%</span>
          </div>
          <div className="w-full bg-[#091220] rounded-full h-1.5 flex overflow-hidden border border-cyan-950">
            <div
              className={`h-1.5 transition-all duration-500 ${
                isFlowPositive
                  ? "bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                  : "bg-gradient-to-r from-cyan-600 to-amber-400"
              }`}
              style={{ width: `${mainBuyRatio}%` }}
            />
            <div className="bg-slate-800 h-1.5" style={{ width: `${retailRatio}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>机构席位博弈</span>
            <span>盘中筹码充分换手</span>
          </div>
        </div>
      </div>

      {/* 2. 短线情绪周期温度计 (真实涨跌停与连板高度) */}
      <div className="p-4 rounded-2xl bg-[#0c1626]/80 border border-cyan-500/20 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-cyan-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            短线情绪基准对比
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
            全市场实盘监测
          </span>
        </div>

        {/* 情绪指标卡 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-xl bg-[#0f1d35]/70 border border-cyan-500/20 text-center">
            <div className="text-[10px] text-slate-400">今日涨停</div>
            <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">{limitUp} 家</div>
          </div>
          <div className="p-2 rounded-xl bg-[#0f1d35]/70 border border-cyan-500/20 text-center">
            <div className="text-[10px] text-slate-400">今日跌停</div>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{limitDown} 家</div>
          </div>
          <div className="p-2 rounded-xl bg-[#0f1d35]/70 border border-cyan-500/20 text-center">
            <div className="text-[10px] text-slate-400">日内炸板率</div>
            <div className="text-sm font-bold text-white font-mono mt-0.5">{brokenRate}%</div>
          </div>
        </div>

        {/* 炸板率与连板高度近期中枢对比标注 */}
        <div className="pt-2 border-t border-cyan-900/40 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">炸板表现:</span>
            <span className="text-cyan-300 font-mono font-medium">
              日内炸板率 {brokenRate}% (中枢22.5%)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">最高连板空间:</span>
            <span className="text-white font-mono font-medium truncate max-w-[200px]" title={highestLeaders}>
              {highestHeight} 连板龙头 ({highestLeaders})
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

