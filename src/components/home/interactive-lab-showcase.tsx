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
  ArrowRight,
  Play,
  Flame,
} from "lucide-react";

const FEATURED_LABS = [
  {
    title: "上帝之眼 · 3D 全球态势",
    tag: "3D SATELLITE",
    desc: "Cesium 直连 4K 高清卫星遥感，全球空天态势大屏与实时遥测。",
    href: "/experiments/gods-eye",
    icon: Globe2,
    gradient: "from-cyan-500/20 to-blue-600/10",
    color: "text-cyan-500",
  },
  {
    title: "霓虹流体与物理粒子",
    tag: "PHYS-LAB",
    desc: "Navier-Stokes 流体力学模拟，指尖触控丝绸光束与能量涡旋。",
    href: "/experiments/fluid",
    icon: Droplets,
    gradient: "from-purple-500/20 to-pink-600/10",
    color: "text-pink-500",
  },
  {
    title: "赛博黑客渗透终端",
    tag: "TERMINAL OS",
    desc: "沉浸式命令行入侵与节点探测，全息数字雨与 CRT 显像管音效。",
    href: "/experiments/cyber-hack",
    icon: Terminal,
    gradient: "from-emerald-500/20 to-teal-600/10",
    color: "text-emerald-500",
  },
  {
    title: "AI 智能体虚拟小镇",
    tag: "MULTI-AGENT",
    desc: "像素风自治社区，NPC 自主社交八卦，可直接交谈或发起广播。",
    href: "/experiments/ai-town",
    icon: Users,
    gradient: "from-amber-500/20 to-orange-600/10",
    color: "text-amber-500",
  },
  {
    title: "地理大侦探 · 街景寻踪",
    tag: "GEOLOCATION",
    desc: "GeoGuessr 风格探案竞猜，勘查实景蛛丝马迹在世界地图插旗。",
    href: "/experiments/geo-detective",
    icon: Compass,
    gradient: "from-sky-500/20 to-indigo-600/10",
    color: "text-sky-500",
  },
  {
    title: "手势多模态视效空间",
    tag: "COMPUTER VISION",
    desc: "摄像头实时手势识别，张开/握拳导引万颗发光粒子与音画律动。",
    href: "/gesture",
    icon: Hand,
    gradient: "from-violet-500/20 to-purple-600/10",
    color: "text-violet-500",
  },
];

export function InteractiveLabShowcase() {
  return (
    <section className="relative my-20 w-full overflow-hidden">
      {/* 模块标题与描述 */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-600 uppercase tracking-widest mb-1.5">
            <Sparkles className="w-4 h-4 text-sky-500 animate-pulse" />
            <span>PLAYABLE EXPERIMENTS // 强互动极客工坊</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            前沿交互与空间玩具
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
            纯前端驱动的微观物理流体、三维空间遥感、赛博渗透终端与 AI 智能体沙盒，即点即玩。
          </p>
        </div>

        <Link
          href="/experiments"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-sky-500/30 bg-sky-500/10 text-xs font-semibold text-sky-700 hover:bg-sky-500/20 hover:border-sky-500/50 shadow-2xs transition-all"
        >
          <span>探索全部 7 款实验</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Bento 互动卡片阵列 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURED_LABS.map((lab) => {
          const Icon = lab.icon;
          return (
            <Link
              key={lab.title}
              href={lab.href}
              className="group relative flex flex-col justify-between rounded-3xl border border-slate-900/10 bg-white/70 backdrop-blur-xl p-5 sm:p-6 shadow-2xs hover:shadow-xl hover:border-sky-500/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* 背景 Hover 光晕 */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${lab.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
              />

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md group-hover:scale-110 transition-transform">
                    <Icon className={`h-5 w-5 ${lab.color}`} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {lab.tag}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                    {lab.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {lab.desc}
                  </p>
                </div>
              </div>

              {/* 底部启动体验引导 */}
              <div className="relative z-10 pt-4 mt-4 border-t border-slate-900/5 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-sky-700 transition-colors">
                <span className="flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-cyan-600 fill-cyan-600" />
                  <span>立即启动试玩</span>
                </span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-sky-600" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
