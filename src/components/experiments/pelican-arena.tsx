"use client";

import { useState } from "react";
import {
  Trophy,
  Sparkles,
  ExternalLink,
  Maximize2,
  Shuffle,
  Check,
  Code,
  Copy,
  Zap,
  Palette,
  Laugh,
  RotateCw,
  X,
  Layers,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModelEntry {
  id: string;
  name: string;
  provider: string;
  country: "CN" | "US";
  flag: string;
  countryName: string;
  src: string;
  lines: number;
  sizeKB: number;
  title: string;
  themeColor: string;
  bgGradient: string;
  features: string[];
  critique: string;
  defaultBadge: string;
}

export const MODELS: ModelEntry[] = [
  {
    id: "deepseek",
    name: "DeepSeek",
    provider: "深度求索 (DeepSeek)",
    country: "CN",
    flag: "🇨🇳",
    countryName: "国内模型",
    src: "/deepseek.html",
    lines: 285,
    sizeKB: 13.2,
    title: "鹈鹕骑自行车 · 2D动画",
    themeColor: "#0284c7",
    bgGradient: "from-sky-500/10 to-blue-600/10",
    features: ["多层次路面景深", "脚踏板曲柄联动", "拟态悬浮卡片舞台"],
    critique: "结构规整，具备出色的工程实现规范。腿部关节与脚踏板在圆周运动中保持了合理的物理连杆关系，路面标线后退动效增强了速度感。",
    defaultBadge: "最佳机械连杆",
  },
  {
    id: "kimi",
    name: "Kimi",
    provider: "月之暗面 (Moonshot AI)",
    country: "CN",
    flag: "🇨🇳",
    countryName: "国内模型",
    src: "/kimi.html",
    lines: 270,
    sizeKB: 16.2,
    title: "骑自行车的鹈鹕 · SVG 动画",
    themeColor: "#8b5cf6",
    bgGradient: "from-violet-500/10 to-purple-600/10",
    features: ["暗夜科技舞台", "渐变羽毛纹理", "平滑车轮辐条动量"],
    critique: "画风精细度极高。暗黑舞台下的色彩对比浓郁，鹈鹕身体与大喙拥有丰富的渐变微光，车把、车架以及辐条均绘制得极为细致。",
    defaultBadge: "最高审美画工",
  },
  {
    id: "gpt",
    name: "GPT",
    provider: "OpenAI",
    country: "US",
    flag: "🇺🇸",
    countryName: "国外模型",
    src: "/gpt.html",
    lines: 142,
    sizeKB: 10.1,
    title: "鹈鹕的海边骑行",
    themeColor: "#10b981",
    bgGradient: "from-emerald-500/10 to-teal-600/10",
    features: ["沙滩椰树场景", "波浪起伏动效", "海滨氛围感全景"],
    critique: "场景化理解能力出众。不仅准确绘制了骑车的鹈鹕，还自主发散补充了烈日、椰子树与波光粼粼的海浪，故事感与趣味性拉满。",
    defaultBadge: "最佳情境构建",
  },
  {
    id: "gemini",
    name: "Gemini",
    provider: "Google",
    country: "US",
    flag: "🇺🇸",
    countryName: "国外模型",
    src: "/gemini.html",
    lines: 498,
    sizeKB: 20.2,
    title: "竞速破风鹈鹕 · 2D动力学",
    themeColor: "#0284c7",
    bgGradient: "from-sky-500/10 to-indigo-600/10",
    features: ["逆向动力学踏板连杆", "果冻弹性喉囊震颤", "复古风镜与视差破风"],
    critique: "最新生成的标杆级物理动力学表现。双足踏板曲柄实现严格的 360° 圆周闭环踩踏，半透明巨喙喉囊具备极具弹性的微颤动效，配合地面飞掠标线与防风镜光泽，兼备机械严谨度与灵动生命力。",
    defaultBadge: "最佳动力学联动",
  },
  {
    id: "grok",
    name: "Grok",
    provider: "xAI",
    country: "US",
    flag: "🇺🇸",
    countryName: "国外模型",
    src: "/gork.html",
    lines: 52,
    sizeKB: 2.0,
    title: "鹈鹕骑车",
    themeColor: "#f59e0b",
    bgGradient: "from-amber-500/10 to-orange-600/10",
    features: ["极致极简代码 (仅50余行)", "超长幽默大嘴", "纯几何极简矢量"],
    critique: "纯粹的极简主义与解构风格。仅用 50 余行代码勾勒出鹈鹕长嘴与自行车的纯几何轮廓，以最小的代码量传达核心特征，诙谐抽象。",
    defaultBadge: "代码极简整活",
  },
];

const UNIFIED_PROMPT = "创建一个HTML，内容是SVG绘制一个鹈鹕骑自行车的2D动画";

const FUN_TAGS = [
  { id: "art", label: "最佳画工", icon: Palette, color: "text-purple-300 bg-purple-500/15" },
  { id: "motion", label: "最丝滑动态", icon: Zap, color: "text-amber-300 bg-amber-500/15" },
  { id: "humor", label: "抽象/幽默", icon: Laugh, color: "text-rose-300 bg-rose-500/15" },
  { id: "code", label: "极简工程", icon: Code, color: "text-emerald-300 bg-emerald-500/15" },
];

export function PelicanArena() {
  const [activeTab, setActiveTab] = useState<"gallery" | "battle" | "specs">("gallery");
  const [copied, setCopied] = useState(false);
  const [fullscreenModel, setFullscreenModel] = useState<ModelEntry | null>(null);

  // 盲测对决状态
  const [battlePair, setBattlePair] = useState<[ModelEntry, ModelEntry]>(() => [MODELS[0], MODELS[2]]);
  const [revealed, setRevealed] = useState(false);
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [battleStats, setBattleStats] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem("chenyc_pelican_battle_stats");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // 趣味勋章投票统计 (本地持久化)
  const [tagVotes, setTagVotes] = useState<Record<string, Record<string, number>>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem("chenyc_pelican_votes");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleVoteTag = (modelId: string, tagId: string) => {
    setTagVotes((prev) => {
      const modelVotes = prev[modelId] || {};
      const current = modelVotes[tagId] || 0;
      const updated = {
        ...prev,
        [modelId]: {
          ...modelVotes,
          [tagId]: current + 1,
        },
      };
      try {
        localStorage.setItem("chenyc_pelican_votes", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // 生成新的随机盲测对决
  const pickNewBattle = () => {
    const shuffled = [...MODELS].sort(() => Math.random() - 0.5);
    setBattlePair([shuffled[0], shuffled[1]]);
    setRevealed(false);
    setUserChoice(null);
  };

  const handleVoteBattle = (chosenId: string) => {
    setUserChoice(chosenId);
    setRevealed(true);
    setBattleStats((prev) => {
      const current = prev[chosenId] || 0;
      const updated = { ...prev, [chosenId]: current + 1 };
      try {
        localStorage.setItem("chenyc_pelican_battle_stats", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(UNIFIED_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="w-full space-y-10">
      {/* 顶部统一 Prompt 卡片 */}
      <div className="arch-frame relative overflow-hidden bg-[#060a14] p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 font-mono text-xs font-semibold text-cyan-300">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                统一测试提示词 (Prompt Benchmark)
              </span>
              <span className="inline-flex items-center rounded-sm border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-mono font-medium text-slate-300">
                5 大模型同场竞技
              </span>
              <span className="inline-flex items-center rounded-sm border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                3 国外 + 2 国内
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white font-mono">
              &ldquo;{UNIFIED_PROMPT}&rdquo;
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-3xl">
              「鹈鹕骑自行车」被称为大语言模型生成矢量动画的试金石（The Pelican Benchmark）。它极为考验大模型对
              <strong className="text-white">生物解剖特征</strong>（大嘴囊袋）、<strong className="text-white">复杂机械连杆</strong>（脚踏板圆周踩踏、曲柄联动）以及
              <strong className="text-white">空间运动拓扑</strong>的协同渲染能力。
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={copyPrompt}
              className="inline-flex items-center gap-2 rounded-sm border border-white/15 bg-[#04060b] px-4 py-2.5 text-xs font-medium text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300 transition-all cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
              <span>{copied ? "已复制提示词" : "复制该 Prompt"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 选项卡导航 */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="inline-flex rounded-sm border border-white/10 bg-[#060a14] p-1">
          <button
            type="button"
            onClick={() => setActiveTab("gallery")}
            className={cn(
              "flex items-center gap-2 rounded-sm px-4 py-2 text-xs md:text-sm font-medium transition-all cursor-pointer",
              activeTab === "gallery"
                ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-200"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Layers className="h-4 w-4 text-cyan-400" />
            <span>五模全景画廊</span>
            <span className="rounded-sm bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-300">5</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("battle")}
            className={cn(
              "flex items-center gap-2 rounded-sm px-4 py-2 text-xs md:text-sm font-medium transition-all cursor-pointer",
              activeTab === "battle"
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-200"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Shuffle className="h-4 w-4 text-amber-400" />
            <span>双模盲测对决</span>
            <span className="rounded-sm bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono text-amber-300">PK</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("specs")}
            className={cn(
              "flex items-center gap-2 rounded-sm px-4 py-2 text-xs md:text-sm font-medium transition-all cursor-pointer",
              activeTab === "specs"
                ? "bg-purple-500/20 border border-purple-500/40 text-purple-200"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Award className="h-4 w-4 text-purple-400" />
            <span>技术指标横评</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>打分数据实时保存在本地浏览器</span>
        </div>
      </div>

      {/* 视图一：五模全景画廊 */}
      {activeTab === "gallery" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODELS.map((model) => {
            const votes = tagVotes[model.id] || {};
            const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

            return (
              <div
                key={model.id}
                className="arch-frame group flex flex-col bg-[#060a14] hover:border-cyan-500/40 transition-all duration-300 overflow-hidden"
              >
                {/* 顶部标题栏 */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#04060b]/80">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl" title={model.countryName}>{model.flag}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-white text-sm">{model.name}</h3>
                        <span className="text-[10px] font-mono text-slate-400">({model.country})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[170px]">{model.provider}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFullscreenModel(model)}
                      className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="放大预览"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                    <a
                      href={model.src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-sm text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/15 transition-colors"
                      title="在新窗口打开独立 HTML"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {/* 实时动画沙箱容器 */}
                <div className="relative aspect-[4/3] w-full bg-[#04060b] overflow-hidden border-b border-white/10">
                  <iframe
                    src={model.src}
                    title={`${model.name} - 鹈鹕骑车`}
                    className="w-full h-full border-0 pointer-events-none select-none"
                    sandbox="allow-scripts allow-same-origin"
                    loading="lazy"
                  />
                  {/* 点击覆盖层：点击直接打开大图 */}
                  <div
                    onClick={() => setFullscreenModel(model)}
                    className="absolute inset-0 bg-transparent hover:bg-black/25 transition-colors cursor-pointer flex items-center justify-center group/btn"
                  >
                    <span className="opacity-0 group-hover/btn:opacity-100 px-3 py-1.5 rounded-sm border border-cyan-500/40 bg-[#060a14]/90 text-cyan-200 text-xs font-medium backdrop-blur-sm transition-opacity flex items-center gap-1.5">
                      <Maximize2 className="h-3.5 w-3.5 text-cyan-400" />
                      全屏大赏
                    </span>
                  </div>
                </div>

                {/* 模型特征与点评 */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {model.features.map((f, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-sm border border-white/10 bg-white/[0.04] text-[10px] font-medium text-slate-300"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {model.critique}
                    </p>
                  </div>

                  {/* 趣味勋章互动 */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>趣味打分</span>
                      <span className="font-mono text-[10px] text-slate-500">已获得 {totalVotes} 票</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FUN_TAGS.map((tag) => {
                        const Icon = tag.icon;
                        const count = votes[tag.id] || 0;
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleVoteTag(model.id, tag.id)}
                            className={cn(
                              "flex items-center justify-between px-2.5 py-1.5 rounded-sm border border-white/10 text-[11px] font-medium transition-all hover:border-cyan-500/40 active:scale-[0.98] cursor-pointer",
                              count > 0 ? "bg-white/[0.06] text-white font-semibold" : "bg-[#04060b] text-slate-400 hover:text-white"
                            )}
                          >
                            <span className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5 text-slate-400" />
                              <span>{tag.label}</span>
                            </span>
                            <span className="font-mono text-[10px] text-cyan-400">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 视图二：双模盲测对决 */}
      {activeTab === "battle" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-sm bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-amber-500 text-slate-950 font-bold">
                <Shuffle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-amber-200 text-sm">盲测规则 (Blind Test)</h3>
                <p className="text-xs text-amber-300/80">
                  双模名称已隐去。请只看动效与画风，选出你心中最优秀的鹈鹕，投票后立即翻牌揭晓！
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={pickNewBattle}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-sm bg-[#04060b] border border-amber-500/40 text-xs font-semibold text-amber-200 hover:bg-amber-500/15 cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>换一组对决</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {battlePair.map((model, idx) => {
              const label = idx === 0 ? "选手 A" : "选手 B";
              const isSelected = userChoice === model.id;

              return (
                <div
                  key={model.id + idx}
                  className={cn(
                    "arch-frame flex flex-col bg-[#060a14] overflow-hidden transition-all duration-500",
                    isSelected ? "ring-1 ring-cyan-500 border-cyan-500/70" : "border-white/10"
                  )}
                >
                  {/* 对决顶部 */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#04060b]">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-cyan-500/40 bg-cyan-500/15 text-cyan-200 font-mono text-xs font-bold">
                        {idx === 0 ? "A" : "B"}
                      </span>
                      <div>
                        {revealed ? (
                          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <span className="text-lg">{model.flag}</span>
                            <span className="font-bold text-white text-sm">{model.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-sm border border-cyan-500/30 bg-cyan-500/15 text-cyan-300 font-medium">
                              {model.countryName}
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-200 text-sm">神秘模型 {label}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {revealed && (
                        <a
                          href={model.src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <span>查看源码</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 动画舞台 */}
                  <div className="relative aspect-[4/3] w-full bg-[#04060b]">
                    <iframe
                      src={model.src}
                      title={`盲测 ${label}`}
                      className="w-full h-full border-0 pointer-events-none select-none"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>

                  {/* 投票与揭晓区域 */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    {revealed ? (
                      <div className="space-y-3 animate-in fade-in zoom-in-95">
                        <div className="p-3.5 rounded-sm bg-[#04060b] border border-white/10 space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-white">{model.provider}</span>
                            <span className="font-mono text-slate-400">{model.lines} 行代码 · {model.sizeKB} KB</span>
                          </div>
                          <p className="text-xs text-slate-300">{model.critique}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                          <span>累计盲测得票</span>
                          <span className="font-mono font-bold text-cyan-300">{battleStats[model.id] || 0} 票</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 text-center text-xs text-slate-400">
                        观察两边的动作连贯度、羽毛与车架绘制细节
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={revealed}
                      onClick={() => handleVoteBattle(model.id)}
                      className={cn(
                        "w-full py-3 px-4 rounded-sm font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer",
                        revealed
                          ? isSelected
                            ? "bg-cyan-600 text-white font-semibold"
                            : "bg-white/[0.04] border border-white/10 text-slate-500 cursor-not-allowed"
                          : "border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200"
                      )}
                    >
                      <Trophy className="h-4 w-4" />
                      <span>{revealed ? (isSelected ? "你的投票选择 ✓" : "未选此项") : `为 ${label} 投一票`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 视图三：技术参数横评 */}
      {activeTab === "specs" && (
        <div className="arch-frame overflow-hidden bg-[#060a14] shadow-2xl">
          <div className="p-6 border-b border-white/10 bg-[#04060b]/80">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">5 大模型 SVG 动画实现机制横向对比</h3>
            <p className="text-xs text-slate-400 mt-1">
              通过统一提示词提取的代码指标、动效方案与风格流派对比
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#04060b] text-slate-400 font-mono text-[11px] uppercase border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">模型名称</th>
                  <th className="px-5 py-3.5">阵营</th>
                  <th className="px-5 py-3.5">代码行数</th>
                  <th className="px-5 py-3.5">文件体积</th>
                  <th className="px-5 py-3.5">视觉流派</th>
                  <th className="px-5 py-3.5">特色连杆动量</th>
                  <th className="px-5 py-3.5 text-right">独立作品</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                {MODELS.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-4 font-semibold text-white flex items-center gap-2">
                      <span>{m.flag}</span>
                      <span>{m.name}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-sm text-[10px] font-semibold",
                        m.country === "CN" ? "bg-rose-500/15 text-rose-300 border border-rose-500/30" : "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                      )}>
                        {m.countryName}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-medium text-cyan-300">{m.lines} 行</td>
                    <td className="px-5 py-4 font-mono text-slate-400">{m.sizeKB} KB</td>
                    <td className="px-5 py-4 text-xs text-slate-200">{m.defaultBadge}</td>
                    <td className="px-5 py-4 text-xs text-slate-400 max-w-xs">{m.critique}</td>
                    <td className="px-5 py-4 text-right">
                      <a
                        href={m.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium hover:underline"
                      >
                        <span>预览</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 全屏放大 Modal 弹层 */}
      {fullscreenModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020409]/85 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="arch-frame relative flex flex-col w-full max-w-5xl h-[88vh] border-white/15 bg-[#060a14] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#04060b]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{fullscreenModel.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{fullscreenModel.name}</h3>
                    <span className="text-xs text-slate-400">· {fullscreenModel.title}</span>
                  </div>
                  <p className="text-xs text-slate-400">{fullscreenModel.provider}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={fullscreenModel.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline">新窗口打开</span>
                </a>
                <button
                  type="button"
                  onClick={() => setFullscreenModel(null)}
                  className="p-2 rounded-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content - Iframe */}
            <div className="flex-1 w-full bg-[#04060b] relative">
              <iframe
                src={fullscreenModel.src}
                title={`${fullscreenModel.name} 全屏演示`}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>

            {/* Modal Footer - 切换按钮 */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-[#04060b] text-xs">
              <span className="text-slate-400 hidden sm:inline">
                支持在弹窗内直接切换其他模型效果：
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFullscreenModel(m)}
                    className={cn(
                      "px-3 py-1.5 rounded-sm font-medium transition-all text-xs shrink-0 cursor-pointer",
                      m.id === fullscreenModel.id
                        ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 font-semibold"
                        : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {m.flag} {m.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
