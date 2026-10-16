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
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
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
  "深空双星运转的巨型戴森环结构，星际巡洋舰在引力光辉中破空而行，史诗级天体物理尺度",
  "东方仙侠悬浮仙岛宗门，白衣剑修御剑穿行于千丈云海与破晓金色朝霞之间，高精度国风奇幻",
  "水墨工笔与重工业赛博机甲融合，青铜铭文战铠在深山幽篁竹林落叶中肃穆峙立，大师级笔触",
  "微距摄影，晨露晶莹剔透的水滴凝结在夜光多肉植物尖端，折射微型星系，85mm镜头光斑",
  "复古蒸汽朋克飞艇破开暴风云层，黄铜齿轮与高压蒸汽喷射，落日余晖洒在木质甲板上，吉卜力光影质感",
];

const STYLES = [
  { id: "none", name: "原味", desc: "纯粹遵循" },
  { id: "cinematic", name: "电影光影", desc: "大片色调" },
  { id: "anime", name: "二次元", desc: "新海诚风" },
  { id: "photorealistic", name: "超写实", desc: "85mm质感" },
  { id: "cyberpunk", name: "赛博朋克", desc: "霓虹光影" },
  { id: "fantasy", name: "史诗奇幻", desc: "魔幻粒子" },
  { id: "ink", name: "国风水墨", desc: "诗意留白" },
];

const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1", name: "方形" },
  { id: "16:9", label: "16:9", name: "宽屏" },
  { id: "9:16", label: "9:16", name: "竖屏" },
  { id: "4:3", label: "4:3", name: "经典" },
  { id: "3:4", label: "3:4", name: "海报" },
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

  // Cloudflare 凭据配置状态（支持本地存储与一键同步）
  const [cfAccountId, setCfAccountId] = useState("");
  const [cfApiToken, setCfApiToken] = useState("");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // 初始化加载负载均衡健康状态与凭证自动同步（遵循 React 19 规范）
  useEffect(() => {
    let active = true;
    const initStudio = async () => {
      let currentId = "";
      let currentToken = "";

      try {
        currentId = localStorage.getItem("chen_cf_account_id") || "";
        currentToken = localStorage.getItem("chen_cf_api_token") || "";
      } catch {
        // 容错处理
      }

      if (active) {
        setCfAccountId(currentId);
        setCfApiToken(currentToken);
      }

      try {
        const res = await fetch("/api-generate-image");
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;

        if (data.success && data.status) {
          const isConfigured = Boolean(data.status.cloudflareConfigured);
          setBalancerStatus({
            cloudflareConfigured: isConfigured,
            pollinationsAvailable: Boolean(data.status.pollinationsAvailable),
          });

          // 若服务端尚未读取到凭证，自动静默同步写入服务器运行时，实现 0 门槛开箱即用
          if (!isConfigured && currentId && currentToken) {
            try {
              const syncRes = await fetch("/api-generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "save-credentials",
                  cfAccountId: currentId,
                  cfApiToken: currentToken,
                }),
              });
              const syncData = await syncRes.json();
              if (syncData.success && active) {
                setBalancerStatus((prev) => ({ ...prev, cloudflareConfigured: true }));
              }
            } catch {
              // 静默容错
            }
          }
        }
      } catch {
        // 忽略网络初始读取异常
      }
    };

    void initStudio();
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

  // 手动保存凭据
  const handleSaveCredentials = async () => {
    if (!cfAccountId.trim() || !cfApiToken.trim()) {
      setErrorMsg("Cloudflare Account ID 与 API Token 不能为空。");
      return;
    }
    setIsSavingCreds(true);
    setSaveSuccessMsg("");
    try {
      const res = await fetch("/api-generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-credentials",
          cfAccountId: cfAccountId.trim(),
          cfApiToken: cfApiToken.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "保存凭据失败");
      }

      try {
        localStorage.setItem("chen_cf_account_id", cfAccountId.trim());
        localStorage.setItem("chen_cf_api_token", cfApiToken.trim());
      } catch {
        // 忽略
      }

      setBalancerStatus((prev) => ({ ...prev, cloudflareConfigured: true }));
      setSaveSuccessMsg("凭证已成功保存并激活！");
      setTimeout(() => {
        setShowConfigModal(false);
        setSaveSuccessMsg("");
      }, 1200);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "激活凭证失败");
    } finally {
      setIsSavingCreds(false);
    }
  };

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
      const res = await fetch("/api-generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          style: selectedStyle,
          aspectRatio: selectedRatio,
          provider: selectedProvider,
          cfAccountId: cfAccountId.trim() || undefined,
          cfApiToken: cfApiToken.trim() || undefined,
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
    <div className="w-full">
      {/* 左右对齐双栏工作台：采用同一高度弹性栅格，彻底避免左长右短 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 左侧：控制面板（统一在同一个现代玻璃态卡片中） */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-slate-900/10 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow backdrop-blur-xl space-y-4">
          <div className="space-y-4">
            {/* 提示词输入区 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>画面描述 (Prompt)</span>
                </label>
                <button
                  type="button"
                  onClick={pickRandomInspiration}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>随机灵感</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="输入你想生成的画面场景，例如：赛博雨夜街头、白衣仙侠长老、深空星环巡洋舰..."
                  rows={3}
                  maxLength={1000}
                  className="w-full px-3.5 py-2.5 text-sm rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none shadow-2xs leading-relaxed"
                />
                <div className="absolute right-3 bottom-2.5 text-[10px] text-slate-400 dark:text-slate-600 font-mono">
                  {prompt.length}/1000
                </div>
              </div>

              {/* 紧凑快捷灵感药丸 */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-slate-400 font-medium">推荐:</span>
                {["赛博雨夜", "戴森环", "白衣仙侠", "微距露珠", "水墨机甲"].map((kw, idx) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => setPrompt(INSPIRATION_PROMPTS[idx])}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/70 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 border border-slate-200/70 dark:border-slate-700/60 transition-colors cursor-pointer"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            {/* 艺术质感风格选择（紧凑 Pill 矩阵） */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>艺术风格</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={`px-2 py-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedStyle === style.id
                        ? "bg-purple-600 text-white border-purple-600 font-semibold shadow-xs"
                        : "bg-slate-50/80 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-xs leading-none">{style.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 画幅比例与通道策略（并排紧凑排版） */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* 画幅比例 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>画幅尺寸</span>
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setSelectedRatio(ratio.id)}
                      className={`py-1.5 text-center rounded-lg border transition-all cursor-pointer ${
                        selectedRatio === ratio.id
                          ? "bg-purple-600 text-white border-purple-600 font-bold shadow-xs text-xs"
                          : "bg-slate-50/80 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 text-xs"
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 调度通道策略 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>调度引擎</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(true)}
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${
                      balancerStatus.cloudflareConfigured
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-bold animate-pulse"
                    }`}
                    title="点击配置 / 激活 Cloudflare 凭据"
                  >
                    <Key className="w-2.5 h-2.5" />
                    <span>{balancerStatus.cloudflareConfigured ? "● 双通道就绪" : "● 待配CF (点击激活)"}</span>
                  </button>
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProvider("auto");
                      setErrorMsg("");
                    }}
                    className={`py-1.5 text-center rounded-lg border transition-all cursor-pointer ${
                      selectedProvider === "auto"
                        ? "bg-purple-600 text-white border-purple-600 font-bold shadow-xs text-xs"
                        : "bg-slate-50/80 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 text-xs"
                    }`}
                  >
                    智能均衡
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!balancerStatus.cloudflareConfigured) {
                        setShowConfigModal(true);
                      }
                      setSelectedProvider("cloudflare");
                    }}
                    className={`py-1.5 text-center rounded-lg border transition-all cursor-pointer ${
                      selectedProvider === "cloudflare"
                        ? "bg-purple-600 text-white border-purple-600 font-bold shadow-xs text-xs"
                        : !balancerStatus.cloudflareConfigured
                        ? "bg-amber-500/5 border-amber-300 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 text-xs"
                        : "bg-slate-50/80 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 text-xs"
                    }`}
                    title={balancerStatus.cloudflareConfigured ? "使用 Cloudflare 极速生成" : "点击一键激活 CF 专属凭据"}
                  >
                    仅 CF {!balancerStatus.cloudflareConfigured && "⚠️"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProvider("pollinations");
                      setErrorMsg("");
                    }}
                    className={`py-1.5 text-center rounded-lg border transition-all cursor-pointer ${
                      selectedProvider === "pollinations"
                        ? "bg-purple-600 text-white border-purple-600 font-bold shadow-xs text-xs"
                        : "bg-slate-50/80 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 text-xs"
                    }`}
                  >
                    仅 FLUX
                  </button>
                </div>
              </div>
            </div>

            {/* 当服务端尚未就绪时显示轻量激活浮条 */}
            {!balancerStatus.cloudflareConfigured && (
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 text-[11px]">
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>已预填您的 Cloudflare 凭证，点击一键激活</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-xs transition-colors"
                >
                  一键激活
                </button>
              </div>
            )}
          </div>

          {/* 底部：错误提示与提交生成按钮 */}
          <div className="space-y-3 pt-2">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
            )}

            <button
              type="button"
              disabled={isGenerating || !prompt.trim()}
              onClick={() => void handleGenerate()}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                isGenerating || !prompt.trim()
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 text-white shadow-purple-500/20 hover:shadow-purple-500/30 cursor-pointer active:scale-[0.99]"
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
        </div>

        {/* 右侧：画布监视与画廊输出区（高度与左侧完全对齐） */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-slate-900/10 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow backdrop-blur-xl">
          {/* 核心画布展示区 */}
          <div className="relative flex-1 min-h-[360px] sm:min-h-[420px] rounded-2xl bg-slate-950/90 border border-slate-900/20 flex flex-col justify-center items-center overflow-hidden p-3">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">正在调度 AI 渲染引擎</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    {selectedProvider === "cloudflare"
                      ? "Cloudflare Workers AI 专属节点极速生成..."
                      : selectedProvider === "pollinations"
                      ? "Pollinations FLUX.1 引擎多步降噪推理..."
                      : "双通道智能轮询已分派，全速神经运算中..."}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-purple-300">
                  耗时: {elapsedSeconds} 秒
                </div>
              </div>
            ) : currentResult ? (
              <div className="relative w-full h-full flex flex-col justify-between items-center group">
                {/* 图像容器 */}
                <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden rounded-xl">
                  <Image
                    src={currentResult.url}
                    alt={currentResult.prompt}
                    width={1024}
                    height={1024}
                    unoptimized
                    priority
                    className="max-h-[380px] w-auto max-w-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  {/* 全屏放大按钮 */}
                  <button
                    type="button"
                    onClick={() => setPreviewModalUrl(currentResult.url)}
                    className="absolute top-2.5 right-2.5 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="全屏查看原图"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 悬浮/底栏操作栏 */}
                <div className="w-full mt-3 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-medium flex items-center gap-1">
                      <Zap className="w-3 h-3 text-purple-400" />
                      {currentResult.provider === "cloudflare" ? "Cloudflare AI" : "Pollinations"}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {(currentResult.durationMs / 1000).toFixed(1)}s
                    </span>
                    {currentResult.failover && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                        容灾切换
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 cursor-pointer text-xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "已复制" : "复制"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDownload()}
                      className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors flex items-center gap-1 shadow-xs cursor-pointer text-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>下载原图</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2.5">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <Sparkles className="w-7 h-7 text-purple-400" />
                </div>
                <div className="text-sm font-semibold text-slate-200">画面就绪中</div>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  在左侧输入或点击「随机灵感」，轻触「立即生成」即可在右侧实时预览 FLUX 级艺术画作。
                </p>
              </div>
            )}
          </div>

          {/* 会话历史缩略条（位于卡片最底部，紧凑优雅） */}
          {history.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 font-medium">
                <span className="flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-purple-500" />
                  <span>最近生成 ({history.length})</span>
                </span>
                <span className="text-[10px]">点击切换比对</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentResult(item)}
                    className={`relative shrink-0 w-12 h-12 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                      currentResult?.id === item.id
                        ? "border-purple-600 ring-2 ring-purple-500/40 scale-105"
                        : "border-slate-200 dark:border-slate-800 hover:border-purple-400 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={item.url}
                      alt={item.prompt}
                      fill
                      unoptimized
                      className="object-cover"
                    />
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
              className="absolute -top-12 right-0 p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative w-full max-h-[85vh] aspect-square flex items-center justify-center">
              <Image
                src={previewModalUrl}
                alt="AI Art Preview"
                fill
                unoptimized
                className="object-contain rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Cloudflare Workers AI 凭证一键配置与激活 Modal */}
      {showConfigModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowConfigModal(false)}
        >
          <div
            className="relative max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Cloudflare Workers AI 凭证</h3>
                  <p className="text-[11px] text-slate-400">接入 FLUX.1 Schnell 极速出图引擎</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Account ID
                </label>
                <input
                  type="text"
                  value={cfAccountId}
                  onChange={(e) => setCfAccountId(e.target.value)}
                  placeholder="例如: 812d4f91a75d..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  API Token
                </label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={cfApiToken}
                    onChange={(e) => setCfApiToken(e.target.value)}
                    placeholder="输入 Cloudflare Workers AI Token (例如: cfut_...)"
                    className="w-full px-3.5 py-2 pr-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/10 text-[11px] text-slate-500 dark:text-slate-400 space-y-1 leading-relaxed">
                <div className="flex items-center gap-1.5 font-medium text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>零终端交互 · 安全写入服务器运行时</span>
                </div>
                <p>
                  填入您的 Cloudflare Workers AI 专属凭据（Account ID 与 API Token）。点击保存后将直接同步至服务器运行时与本地缓存，小说工作流与生图实验室即刻可用，无需登录 SSH 终端！
                </p>
              </div>

              {saveSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                disabled={isSavingCreds}
                onClick={() => void handleSaveCredentials()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isSavingCreds ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>正在激活...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>保存并激活凭证</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
