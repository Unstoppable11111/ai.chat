"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { HoverPrefetchLink } from "@/components/shared/hover-prefetch-link";
import {
  Activity,
  ArrowRight,
  Bot,
  Calendar,
  ChevronRight,
  Radar,
  Radio,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Reveal } from "@/components/shared/reveal";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import type { MarketTrafficLightState } from "@/lib/quant-arena/swing-rules";

const emptySubscribe = () => () => {};

interface MarketPulse {
  state: string;
  style: string;
  suggested_position: string;
  turnover_label: string;
  turnover_yi: number | null;
  up_count: number | null;
  down_count: number | null;
  limit_up_count: number | null;
  limit_down_count: number | null;
  broken_ratio: number | null;
  traffic_light?: MarketTrafficLightState;
  mainlines: string[];
}

const WORKFLOW_MODULES = [
  {
    id: "01",
    title: "08:35 盘前全天计划",
    tag: "定纪律",
    icon: Calendar,
    tone: "text-[#0F0F0F] bg-[#F8F8F8] border-[#E4E4E8]",
    desc: "汇总隔夜财联社电报、实盘持仓前低防守线与观察池买点区间，生成当日操作总基调。",
  },
  {
    id: "02",
    title: "盘中 5 分钟静默规则巡检",
    tag: "零Token噪音",
    icon: Radio,
    tone: "text-[#0F0F0F] bg-[#F8F8F8] border-[#E4E4E8]",
    desc: "交易时段每 5 分钟核对持仓振幅、高点回撤与情绪红绿灯，平时静默归档不盲目喊单。",
  },
  {
    id: "03",
    title: "主板+创业板 5 日轮动观察池",
    tag: "账户独立",
    icon: Radar,
    tone: "text-[#0F0F0F] bg-[#F8F8F8] border-[#E4E4E8]",
    desc: "盘后精选放量科技股滚入观察池，紧盯买点 A（缩量低吸）与买点 B（突破共振），满 5 日或破位淘汰。",
  },
  {
    id: "04",
    title: "重大异动自动唤醒 AI 研判",
    tag: "关键介入",
    icon: Bot,
    tone: "text-[#0F0F0F] bg-[#F8F8F8] border-[#E4E4E8]",
    desc: "触发止盈止损、日内冲高回落≥5%、深V反抽或买点触发时唤醒大模型剖析主力意图并归档。",
  },
];

export function QuantArenaPreview() {
  const [pulse, setPulse] = useState<MarketPulse | null>(null);
  const { user, openAuthModal } = useAuth();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 5000);

    fetch("/api-market/public-summary", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data?.success && data.market_pulse) {
          setPulse(data.market_pulse);
        }
      })
      .catch(() => {})
      .finally(() => {
        window.clearTimeout(timer);
      });

    return () => {
      ignore = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const light = pulse?.traffic_light;
  const lightDotClass =
    light?.light === "RED"
      ? "bg-[#D71018]"
      : light?.light === "YELLOW"
      ? "bg-amber-500"
      : "bg-[#33DD18]";

  return (
    <section className="container-shell py-12 md:py-16">
      <Reveal className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F7F9] border border-[#D8D8E4] text-[#263844] text-xs font-semibold mb-3">
            <Activity className="w-3.5 h-3.5 text-[#263844]" />
            <span>A股波段交易辅助系统 · 沪深主板与创业板</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0F0F0F]">
            实盘风控纪律、5 日轮动选股与每日四合一看板
          </h2>
          <p className="text-sm text-[#5C6873] mt-1 max-w-2xl">
            盘前定预案、盘中 5 分钟规则硬监控、情绪红绿灯买点总闸门，重大异动或主动召唤时再唤醒 AI 深度研判。
          </p>
        </div>

        <HoverPrefetchLink
          href="/market"
          className="shimmer-beam inline-flex items-center gap-2 self-start md:self-auto px-4 py-2.5 rounded-xl bg-[#0F0F0F] text-[#FFFFFF] text-xs md:text-sm font-medium hover:bg-[#282828] hover:-translate-y-0.5 transition-all group shadow-sm"
        >
          <span>进入波段监控工作台</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </HoverPrefetchLink>
      </Reveal>

      {/* 实时市场环境脉搏条 + 红绿灯 */}
      <Reveal delay={0.05} className="glass-panel rounded-2xl border border-[#E4E4E8] bg-[#FFFFFF] p-4 md:p-5 mb-6 shadow-[0_1px_2px_rgba(15,15,15,0.03),0_8px_24px_-8px_rgba(38,56,68,0.06)]">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
          <div className="col-span-2 md:col-span-1 border-b md:border-b-0 md:border-r border-[#E4E4E8] pb-3 md:pb-0">
            <span className="text-xs text-[#5C6873] font-medium block mb-1">情绪红绿灯总闸门</span>
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${lightDotClass}`} />
              <span className="text-sm font-bold text-[#0F0F0F]">
                {pulse?.state || "情绪计算中"}
              </span>
            </div>
            <span className="text-[11px] text-[#282828] font-medium mt-0.5 block">
              建议仓位 {pulse?.suggested_position || "动态评估"}
            </span>
          </div>

          <div>
            <span className="text-xs text-[#5C6873] block mb-0.5">两市成交总额</span>
            <span className="text-base font-bold text-[#0F0F0F]">
              {pulse?.turnover_label || "--"}
            </span>
            <span className="text-[11px] text-[#5C6873] block">{pulse?.style || "科技成长主线"}</span>
          </div>

          <div>
            <span className="text-xs text-[#5C6873] block mb-0.5">多空比 (涨/跌)</span>
            <div className="text-base font-bold text-[#0F0F0F]">
              <span className="text-[#D71018]">{pulse?.up_count != null ? pulse.up_count : "--"}</span>
              <span className="text-[#C8C8C8] mx-1">/</span>
              <span className="text-[#184120]">{pulse?.down_count != null ? pulse.down_count : "--"}</span>
            </div>
            <span className="text-[11px] text-[#5C6873] block">
              {pulse?.limit_up_count != null
                ? `涨停 ${pulse.limit_up_count} · 炸板 ${pulse.broken_ratio ?? 0}%`
                : "情绪监测中"}
            </span>
          </div>

          <div className="col-span-2 flex flex-col justify-center">
            <span className="text-xs text-[#5C6873] block mb-1">买点闸门与盘面领涨</span>
            <p className="text-xs text-[#282828] font-medium">
              {light?.summary || "等待实时情绪快照加载后自动判定买点A/B放行权限"}
            </p>
          </div>
        </div>
      </Reveal>

      {/* 四大实战模块卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {WORKFLOW_MODULES.map((mod, idx) => {
          const Icon = mod.icon;
          return (
            <Reveal key={mod.id} delay={idx * 0.06}>
              <SpotlightCard className="h-full rounded-2xl border border-[#E4E4E8] bg-[#FFFFFF] p-5 flex flex-col justify-between hover:border-[#C8C8C8] hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`w-9 h-9 rounded-xl border flex items-center justify-center ${mod.tone}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F8F8F8] text-[#5C6873] border border-[#E4E4E8]">
                      {mod.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#0F0F0F] mb-1.5">{mod.title}</h3>
                  <p className="text-xs text-[#5C6873] leading-relaxed">{mod.desc}</p>
                </div>
                <div className="pt-3 mt-3 border-t border-[#E4E4E8] text-[11px] font-mono text-[#5C6873]">
                  STEP {mod.id} · 自动归档至每日看板
                </div>
              </SpotlightCard>
            </Reveal>
          );
        })}
      </div>

      {/* 底部联动提示条 */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-[#0F0F0F] text-[#FFFFFF] text-xs md:text-sm gap-3">
        {mounted && user ? (
          <>
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-[#33DD18] shrink-0" />
              <span>
                已登录账户【<strong className="text-[#FFFFFF] font-mono">{user.username}</strong>】· 专属实盘风控账本、5日观察池与每日看板已就绪。
              </span>
            </div>
            <HoverPrefetchLink
              href="/market"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FFFFFF] text-[#0F0F0F] font-bold hover:bg-[#F2F7F9] transition-colors shrink-0"
            >
              <span>打开今日看板</span>
              <ChevronRight className="w-4 h-4" />
            </HoverPrefetchLink>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#33DD18] shrink-0" />
              <span>
                登录后即可管理个人实盘持仓风控（支持深套修复模式）、独立 5 日轮动观察池与每日四合一看板。
              </span>
            </div>
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FFFFFF] text-[#0F0F0F] font-bold hover:bg-[#F2F7F9] transition-colors shrink-0 cursor-pointer"
            >
              <span>登录工作台</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
