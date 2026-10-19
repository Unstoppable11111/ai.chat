"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Globe2,
  Droplets,
  Terminal,
  Users,
  Compass,
  Hand,
  Trophy,
  ArrowRight,
  Sparkles,
  Play,
} from "lucide-react";

export interface PlaygroundItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: "3D与空间" | "物理力学" | "极客模拟" | "AI智能体" | "AI生成视觉";
  tag: string;
  badge: string;
  href: string;
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PLAYGROUND_ITEMS: PlaygroundItem[] = [
  {
    id: "image-studio",
    title: "AI 创意视觉工坊",
    subtitle: "FLUX.1 真实渲染 / Cloudflare AI / 双通道均衡",
    description: "高可用双通道生图集群，结合 Cloudflare Workers AI 极速算力与 Pollinations 强力推理，支持多风格与自由画幅。",
    category: "AI生成视觉",
    tag: "FLUX RENDER",
    badge: "双通道均衡",
    href: "/experiments/image-studio",
    gradient: "from-purple-500/25 via-pink-600/15 to-transparent",
    icon: Sparkles,
  },
  {
    id: "gods-eye",
    title: "上帝之眼 · 全球态势感知",
    subtitle: "Cesium 3D / 必应 4K 遥感 / 遥测 HUD",
    description: "军工级三维数字孪生地球，直连 4K 高清遥感影像，实时经纬度与高度航向态势大屏。",
    category: "3D与空间",
    tag: "3D SATELLITE",
    badge: "空间孪生",
    href: "/experiments/gods-eye",
    gradient: "from-cyan-500/20 via-blue-600/10 to-transparent",
    icon: Globe2,
  },
  {
    id: "fluid-lab",
    title: "霓虹流体与粒子动力学",
    subtitle: "Navier-Stokes / 触控粒子 / 炫光涡流",
    description: "纯前端高性能物理流体力学画布。指尖划过即刻激发五彩霓虹光带、涡旋扰动与能量升腾。",
    category: "物理力学",
    tag: "PHYS-DYNAMICS",
    badge: "解压秒开",
    href: "/experiments/fluid",
    gradient: "from-purple-500/20 via-pink-600/10 to-transparent",
    icon: Droplets,
  },
  {
    id: "cyber-hack",
    title: "赛博朋克黑客渗透终端",
    subtitle: "CLI Terminal / 节点爆破 / 数字雨",
    description: "拟真赛博网络攻防环境。输入极客命令扫描子网、漏洞探测、溢出攻击，伴随 CRT 蜂鸣声效。",
    category: "极客模拟",
    tag: "EXPLOIT SUITE",
    badge: "极客硬核",
    href: "/experiments/cyber-hack",
    gradient: "from-emerald-500/20 via-teal-600/10 to-transparent",
    icon: Terminal,
  },
  {
    id: "ai-town",
    title: "AI 智能体虚拟社交小镇",
    subtitle: "Generative Agents / 像素沙盒 / 八卦社交",
    description: "自主智能体自治社区。居民在小镇漫游、偶遇攀谈，你可以以玩家身份游览互动或发起全镇广播。",
    category: "AI智能体",
    tag: "AGENT SANDBOX",
    badge: "多智能体",
    href: "/experiments/ai-town",
    gradient: "from-amber-500/20 via-orange-600/10 to-transparent",
    icon: Users,
  },
  {
    id: "geo-detective",
    title: "地理大侦探 · 街景寻踪",
    subtitle: "GeoGuessr / 全球实景 / 经纬度测距",
    description: "全球神秘街景探索竞猜。观察植被气候与路牌线索，在世界地图插旗计算公里误差赢取积分。",
    category: "3D与空间",
    tag: "GEOLOCATION",
    badge: "趣味闯关",
    href: "/experiments/geo-detective",
    gradient: "from-sky-500/20 via-indigo-600/10 to-transparent",
    icon: Compass,
  },
  {
    id: "gesture-system",
    title: "手势多模态视效空间",
    subtitle: "Computer Vision / 3D 粒子引力 / 摄像头手势",
    description: "万颗发光粒子三维场，支持摄像头实时手掌张开、握拳捏合与挥手追踪，同步提取音频律动。",
    category: "物理力学",
    tag: "HAND TRACKING",
    badge: "手势识别",
    href: "/gesture",
    gradient: "from-violet-500/20 via-purple-600/10 to-transparent",
    icon: Hand,
  },
  {
    id: "pelican-arena",
    title: "鹈鹕盲测 · LLM性能竞技场",
    subtitle: "LMSYS Arena / 双盲对决 / Elo 积分",
    description: "大语言模型匿名双盲对战评测系统，多模态推理能力对决，客观评定前沿 AI 模型天梯榜单。",
    category: "AI智能体",
    tag: "EVAL ARENA",
    badge: "模型对决",
    href: "/experiments/pelican",
    gradient: "from-blue-500/20 via-cyan-600/10 to-transparent",
    icon: Trophy,
  },
];

const CATEGORIES = ["全部", "AI生成视觉", "3D与空间", "物理力学", "极客模拟", "AI智能体"] as const;

export function InteractivePlaygroundsHub() {
  const [activeCategory, setActiveCategory] = useState<string>("全部");

  const filteredPlaygrounds = PLAYGROUND_ITEMS.filter((item) => {
    if (activeCategory === "全部") return true;
    return item.category === activeCategory;
  });

  return (
    <section className="mb-14 space-y-6">
      {/* 头部导航与分类筛选 */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-900/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-sky-500 animate-pulse" />
            <span>PLAYABLE LABS // 8 款高互动极客实验矩阵</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            高可玩性互动工坊
          </h2>
        </div>

        {/* 分类切换药丸 */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/80">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-white text-slate-900 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 互动卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPlaygrounds.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xs hover:shadow-xl hover:border-sky-500/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* 背景渐变光晕 */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
              />

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-semibold">
                      {item.tag}
                    </span>
                    <span className="text-[10px] font-mono text-sky-700 bg-sky-50 border border-sky-200/60 px-2 py-0.5 rounded-full font-semibold">
                      {item.badge}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>

              {/* 卡片底部操作指引 */}
              <div className="relative z-10 pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-sky-600 transition-colors">
                <span className="flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-cyan-500 fill-cyan-500" />
                  <span>立即启动体验</span>
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
