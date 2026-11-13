"use client";

import Link from "next/link";
import {
  Globe2,
  Droplets,
  Terminal,
  Users,
  Compass,
  Hand,
  Sparkles,
  ArrowUpRight,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/shared/reveal";

const BENTO_LABS = [
  {
    id: "LAB_01",
    title: "天纪 · 紫微斗数与双人合盘",
    tag: "ASTRO // AI MASTER",
    desc: "融合倪海厦《天纪》与《斗数全书》金标准盘，支持真太阳时校准、四化飞星叠层、双人合盘与 AI 宗师流式批断。",
    href: "/experiments/ziwei",
    icon: Compass,
    span: "md:col-span-2",
    accent: "text-amber-400 border-amber-500/35 bg-amber-950/35",
  },
  {
    id: "LAB_02",
    title: "AI 创意视觉生图工坊",
    tag: "FLUX // DUAL ENGINE",
    desc: "双通道 FLUX 极速生图负载均衡，融合 Cloudflare AI 算力与智能故障切换，实时渲染高清艺术资产。",
    href: "/experiments/image-studio",
    icon: Sparkles,
    span: "md:col-span-2",
    accent: "text-purple-400 border-purple-500/35 bg-purple-950/35",
  },
  {
    id: "LAB_03",
    title: "上帝之眼 · 3D 全球态势",
    tag: "CESIUM 4K",
    desc: "Cesium 直连 4K 高清卫星遥感，全球空天态势大屏与实时轨道遥测。",
    href: "/experiments/gods-eye",
    icon: Globe2,
    span: "md:col-span-1",
    accent: "text-cyan-400 border-cyan-500/35 bg-cyan-950/35",
  },
  {
    id: "LAB_04",
    title: "霓虹流体物理画布",
    tag: "NAVIER-STOKES",
    desc: "WebGL 流体力学模拟，指尖触控丝绸光束与能量涡旋。",
    href: "/experiments/fluid",
    icon: Droplets,
    span: "md:col-span-1",
    accent: "text-pink-400 border-pink-500/35 bg-pink-950/35",
  },
  {
    id: "LAB_05",
    title: "赛博黑客渗透终端",
    tag: "TERMINAL OS",
    desc: "沉浸式命令行入侵与节点探测，全息数字雨与 CRT 音效。",
    href: "/experiments/cyber-hack",
    icon: Terminal,
    span: "md:col-span-1",
    accent: "text-emerald-400 border-emerald-500/35 bg-emerald-950/35",
  },
  {
    id: "LAB_06",
    title: "AI 智能体虚拟小镇",
    tag: "MULTI-AGENT",
    desc: "像素风自治社区，NPC 自主社交漫游、交谈与全镇广播。",
    href: "/experiments/ai-town",
    icon: Users,
    span: "md:col-span-1",
    accent: "text-amber-400 border-amber-500/35 bg-amber-950/35",
  },
  {
    id: "LAB_07",
    title: "地理大侦探 · 街景寻踪",
    tag: "GEOLOCATION",
    desc: "实景线索勘查与世界地图插旗竞猜，考验空间地理直觉。",
    href: "/experiments/geo-detective",
    icon: Compass,
    span: "md:col-span-2",
    accent: "text-sky-400 border-sky-500/35 bg-sky-950/35",
  },
  {
    id: "LAB_08",
    title: "手势多模态视效空间",
    tag: "COMPUTER VISION",
    desc: "摄像头实时手势识别，张开/握拳导引万颗发光粒子与音画律动。",
    href: "/gesture",
    icon: Hand,
    span: "md:col-span-2",
    accent: "text-violet-400 border-violet-500/35 bg-violet-950/35",
  },
];

export function InteractiveLabShowcase() {
  return (
    <section className="studio-section bg-[#04060b]">
      <div className="container-shell">
        <Reveal className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8 border-b border-white/10 pb-5">
          <div>
            <div className="tech-tag mb-2.5">
              <FlaskConical className="w-3 h-3 text-cyan-400" />
              <span>SEC_04 // ASYMMETRIC BENTO PLAYGROUNDS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              前沿交互工坊与空间沙盒
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl">
              WebGL 流体力学、三维地球遥感、命理排盘与多智能体沙盒，即点即启动。
            </p>
          </div>

          <Link
            href="/experiments"
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/35 bg-cyan-950/40 px-4 py-2 text-xs font-mono font-semibold text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 transition-all"
          >
            <span>VIEW ALL 09 LABS</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </Reveal>

        {/* 4-Column Asymmetric Bento Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {BENTO_LABS.map((lab, idx) => {
            const Icon = lab.icon;
            return (
              <Reveal key={lab.id} delay={idx * 0.04} className={lab.span}>
                <Link
                  href={lab.href}
                  className="arch-frame group flex h-full flex-col justify-between rounded-xl overflow-hidden"
                >
                  <div className="hud-header">
                    <span>{lab.id}</span>
                    <span className="text-cyan-300">{lab.tag}</span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg border transition-transform group-hover:scale-105",
                            lab.accent
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 group-hover:border-cyan-400/50 group-hover:text-cyan-300 transition-colors">
                          <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {lab.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                          {lab.desc}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/[0.07] flex items-center justify-between font-mono text-[10px] text-slate-500 group-hover:text-cyan-300 transition-colors">
                      <span>STATUS: INTERACTIVE</span>
                      <span>LAUNCH →</span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
