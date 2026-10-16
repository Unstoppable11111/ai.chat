"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  Wand2,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Layers,
  Zap,
  Cpu,
  Maximize2,
  X,
  History,
  AlertTriangle,
} from "lucide-react";

interface GenerationHistoryItem {
  id: string;
  url: string;
  prompt: string;
  provider: string;
  model: string;
  aspectRatio: string;
  durationMs: number;
  failover?: boolean;
  createdAt: string;
}

const INSPIRATION_PROMPTS = [
  "赛博雨夜街头，霓虹水洼倒映着全息广告牌与机械仿生义体行者，电影级逆光氛围",
  "深空深处围绕双星运转的巨型戴森环结构，星际巡洋舰在引力光辉中破空而行，史诗级天体物理尺度",
  "东方仙侠悬浮仙岛宗门，白衣剑修御剑穿行于千丈云海与破晓金色朝霞之间，高精度国风奇幻",
  "水墨工笔与重工业赛博机甲融合，青铜铭文战铠，在深山幽篁竹林落叶中肃穆峙立，大师级笔触",
  "微距摄影，晨露晶莹剔透的水滴凝结在夜光多肉植物尖端，内部折射微型星系，85mm镜头光斑",
  "复古蒸汽朋克飞艇破开暴风云层，黄铜齿轮与高压蒸汽喷射，落日余晖洒在木质甲板上，吉卜力光影质感",
];

const STYLES = [
  { id: "none", name: "原汁原味", desc: "纯粹遵循提示词" },
  { id: "cinematic", name: "电影光影", desc: "胶片质感与大片色调" },
  { id: "anime", name: "二次元", desc: "新海诚唯美动漫风" },
  { id: "photorealistic", name: "超写实", desc: "85mm镜头与逼真细节" },
  { id: "cyberpunk", name: "赛博朋克", desc: "霓虹光影与高科技感" },
  { id: "fantasy", name: "史诗奇幻", desc: "魔幻粒子与恢弘画卷" },
  { id: "ink", name: "国风水墨", desc: "诗意留白与传统韵味" },
];

const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1", name: "正方形", desc: "经典社交头像与插画" },
  { id: "16:9", label: "16:9", name: "宽画幅", desc: "桌面壁纸与电影画卷" },
  { id: "9:16", label: "9:16", name: "移动竖屏", desc: "手机全面屏锁屏壁纸" },
  { id: "4:3", label: "4:3", name: "复古画幅", desc: "典雅摄影构图" },
  { id: "3:4", label: "3:4", name: "海报竖屏", desc: "小说封面与角色立绘" },
];

export function ImageStudio() {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("cinematic");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [selectedProvider, setSelectedProvider] = useState<"auto" | "cloudflare" | "pollinations">("auto");
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentResult, setCurrentResult] = useState<GenerationHistoryItem | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [balancerStatus, setBalancerStatus] = useState<{
    cloudflareConfigured: boolean;
    pollinationsAvailable: boolean;
  }>({ cloudflareConfigured: true, pollinationsAvailable: true });

  // 初始化加载负载均衡健康状态（符合 React 19 异步规范，避免同步 setState）
  useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/generate/image");
        if (!res.ok) return;
        const data = await res.json();
        if (active && data.success && data.status) {
          setBalancerStatus({
            cloudflareConfigured: Boolean(data.status.cloudflareConfigured),
            pollinationsAvailable: Boolean(data.status.pollinationsAvailable),
          });
        }
      } catch {
        // 忽略网络初始读取异常，保底继续
      }
    };
    void fetchStatus();
    return () => {
      active = false;
    };
  }, []);

  // 生成中计时器（遵循 React 19 规范，严禁在 effect 主体中直接调用 setState）
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async (targetPrompt?: string) => {
    const finalPrompt = (targetPrompt || prompt).trim();
    if (!finalPrompt) {
      setErrorMsg("请输入画面描述提示词后再生成。");
      return;
    }
    setErrorMsg("");
    setElapsedSeconds(0);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          style: selectedStyle,
          aspectRatio: selectedRatio,
          provider: selectedProvider,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "生成失败，请稍后重试");
      }

      const item: GenerationHistoryItem = {
        id: `img_${Date.now()}`,
        url: data.imageUrl,
        prompt: finalPrompt,
        provider: data.provider,
        model: data.model,
        aspectRatio: data.aspectRatio,
        durationMs: data.durationMs,
        failover: data.failover,
        createdAt: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };

      setCurrentResult(item);
      setHistory((prev) => [item, ...prev.slice(0, 7)]);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "请求失败，所有生图通道暂时不可用。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (!currentResult) return;
    const fullUrl = `${window.location.origin}${currentResult.url}`;
    void navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!currentResult) return;
    try {
      const res = await fetch(currentResult.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `ai-art-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(currentResult.url, "_blank");
    }
  };

  const pickRandomInspiration = () => {
    const random = INSPIRATION_PROMPTS[Math.floor(Math.random() * INSPIRATION_PROMPTS.length)];
    setPrompt(random);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* 顶部标题区 */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 text-purple-300 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>FLUX.1 真实神经渲染 · 双通道高可用集群</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              AI 创意视觉工坊
            </h1>
            <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
              结合 Cloudflare Workers AI 极速推理与 Pollinations 强力算力，支持毫秒级轮询负载均衡与自动容灾故障切换。
            </p>
          </div>

          {/* 集群状态药丸 */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${balancerStatus.cloudflareConfigured ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
              <span>Cloudflare AI: {balancerStatus.cloudflareConfigured ? "就绪" : "未激活"}</span>
            </div>
            <div className="w-px h-3 bg-zinc-700" />
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pollinations FLUX: 就绪</span>
            </div>
          </div>
        </div>
      </div>

      {/* 主工作区 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 左侧控制台 */}
        <div className="lg:col-span-5 space-y-6">
          {/* 提示词输入卡片 */}
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-400" />
                画面提示词 (Prompt)
              </label>
              <button
                type="button"
                onClick={pickRandomInspiration}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 font-medium"
              >
                <Sparkles className="w-3 h-3" />
                随机灵感
              </button>
            </div>

            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述你心中所想的恢弘画面，支持中英文... 例如：破晓晨光中的赛博朋克浮空城、白衣御剑仙宗长老、深空星环巡洋舰"
                rows={4}
                maxLength={1000}
                className="w-full px-4 py-3 text-sm rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
              />
              <div className="absolute right-3 bottom-3 text-[11px] text-zinc-500">
                {prompt.length}/1000
              </div>
            </div>

            {/* 灵感标签推荐 */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-zinc-500 self-center mr-1">快捷预设:</span>
              {["赛博雨夜", "戴森环", "白衣仙侠", "微距露珠", "水墨机甲"].map((kw, idx) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => setPrompt(INSPIRATION_PROMPTS[idx])}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/50 transition-colors"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* 风格预设选择 */}
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-3">
            <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              艺术质感与风格
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedStyle === style.id
                      ? "bg-purple-950/40 border-purple-500/80 text-purple-200 shadow-sm"
                      : "bg-zinc-950/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  <div className="text-xs font-semibold">{style.name}</div>
                  <div className="text-[10px] text-zinc-500 truncate mt-0.5">{style.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 画幅比例与通道策略 */}
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
            {/* 画幅 */}
            <div>
              <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-purple-400" />
                画幅比例
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setSelectedRatio(ratio.id)}
                    className={`py-2 px-1 text-center rounded-lg border transition-all ${
                      selectedRatio === ratio.id
                        ? "bg-purple-950/50 border-purple-500 text-purple-200 font-bold"
                        : "bg-zinc-950/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 text-xs font-medium"
                    }`}
                  >
                    <div className="text-xs">{ratio.label}</div>
                    <div className="text-[9px] text-zinc-500 scale-95">{ratio.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 负载通道策略 */}
            <div className="pt-2 border-t border-zinc-800">
              <label className="text-sm font-semibold text-zinc-200 flex items-center justify-between mb-2">
                <span className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  推理调度策略
                </span>
                <span className="text-[11px] text-zinc-400">智能负载均衡</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "auto", name: "智能均衡", icon: Zap, tip: "双通道轮询+故障自动切换" },
                  { id: "cloudflare", name: "仅 Cloudflare", icon: Cpu, tip: "CF flux-1-schnell 极速" },
                  { id: "pollinations", name: "仅 Pollinations", icon: Layers, tip: "FLUX.1 真实推理" },
                ].map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProvider(p.id as "auto" | "cloudflare" | "pollinations")}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        selectedProvider === p.id
                          ? "bg-purple-950/50 border-purple-500 text-purple-200"
                          : "bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                      }`}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                      <div className="text-xs font-semibold">{p.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 生成主按钮 */}
          <button
            type="button"
            disabled={isGenerating || !prompt.trim()}
            onClick={() => void handleGenerate()}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              isGenerating || !prompt.trim()
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 text-white shadow-purple-500/25 hover:shadow-purple-500/40 cursor-pointer active:scale-[0.99]"
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>正在神经渲染中... ({elapsedSeconds}s)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>立即生成高精视觉画面</span>
              </>
            )}
          </button>
        </div>

        {/* 右侧渲染画布与画廊 */}
        <div className="lg:col-span-7 space-y-6">
          {/* 画布预览容器 */}
          <div className="relative rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl p-4 min-h-[500px] flex flex-col justify-center items-center overflow-hidden">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">正在调度 AI 渲染引擎</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                    {selectedProvider === "cloudflare"
                      ? "正在通过 Cloudflare Workers AI 专属节点加速生成..."
                      : selectedProvider === "pollinations"
                      ? "正在通过 Pollinations FLUX.1 引擎进行图像重构..."
                      : "负载均衡器已分发请求，正在进行并行多步神经降噪..."}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-xs font-mono text-purple-300">
                  耗时: {elapsedSeconds} 秒
                </div>
              </div>
            ) : currentResult ? (
              <div className="w-full flex flex-col items-center space-y-4">
                {/* 图像展示 */}
                <div className="relative w-full rounded-xl overflow-hidden group border border-zinc-800 bg-zinc-950 flex items-center justify-center">
                  <Image
                    src={currentResult.url}
                    alt={currentResult.prompt}
                    width={1024}
                    height={1024}
                    unoptimized
                    priority
                    className="w-full h-auto max-h-[540px] object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  {/* 浮动放大按钮 */}
                  <button
                    type="button"
                    onClick={() => setPreviewModalUrl(currentResult.url)}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="全屏查看原图"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 元数据与操作栏 */}
                <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-purple-400" />
                      {currentResult.provider === "cloudflare" ? "Cloudflare Workers AI" : "Pollinations.ai"}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 font-mono text-[11px]">
                      {currentResult.model}
                    </span>
                    <span className="text-zinc-500 font-mono">
                      {(currentResult.durationMs / 1000).toFixed(1)}s
                    </span>
                    {currentResult.failover && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                        容灾故障切换生效
                      </span>
                    )}
                  </div>

                  {/* 动作按钮 */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors flex items-center gap-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "已复制" : "复制链接"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDownload()}
                      className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>下载高清原图</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 space-y-3">
                <div className="p-4 rounded-full bg-zinc-800/50 border border-zinc-700/50">
                  <Sparkles className="w-8 h-8 text-zinc-400" />
                </div>
                <div className="font-medium text-zinc-300">等待生成画面</div>
                <p className="text-xs text-zinc-500 max-w-xs">
                  在左侧输入或挑选提示词，点击「立即生成高精视觉画面」开启 FLUX 神经渲染。
                </p>
              </div>
            )}
          </div>

          {/* 本地会话历史画廊 */}
          {history.length > 0 && (
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                <div className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-purple-400" />
                  <span>本次会话生成记录 ({history.length})</span>
                </div>
                <span className="text-[11px] text-zinc-500">点击可快速回看与对比</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentResult(item)}
                    className={`relative rounded-lg overflow-hidden border aspect-square group transition-all ${
                      currentResult?.id === item.id ? "border-purple-500 ring-2 ring-purple-500/40" : "border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <Image
                      src={item.url}
                      alt={item.prompt}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                      <span className="text-[9px] text-white truncate">{item.createdAt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 全屏放大 Modal */}
      {previewModalUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center">
            <button
              type="button"
              onClick={() => setPreviewModalUrl(null)}
              className="absolute -top-12 right-0 p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative w-full max-h-[85vh] aspect-square flex items-center justify-center">
              <Image
                src={previewModalUrl}
                alt="AI Art Preview"
                fill
                unoptimized
                className="object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
