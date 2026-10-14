"use client";

import { useState, useRef, useEffect } from "react";
import {
  Globe2,
  Maximize2,
  Minimize2,
  RotateCw,
  ExternalLink,
  ShieldAlert,
  Radio,
  SlidersHorizontal,
  Satellite,
  Compass,
  Sparkles,
} from "lucide-react";

interface GodsEyeConsoleProps {
  initialUrl?: string;
}

export function GodsEyeConsole({ initialUrl }: GodsEyeConsoleProps) {
  const defaultUrl =
    initialUrl ||
    process.env.NEXT_PUBLIC_GODS_EYE_URL ||
    "/apps/gods-eye/index.html?embed=1";

  const [targetUrl, setTargetUrl] = useState(defaultUrl);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [showTips, setShowTips] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 全屏切换处理
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error("Failed to enter fullscreen:", err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error("Failed to exit fullscreen:", err);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl transition-all duration-300 overflow-hidden ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none h-screen w-screen"
          : "min-h-[640px] h-[78vh] w-full"
      }`}
    >
      {/* 顶部军工科幻 HUD 控制条 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/90 px-4 py-2.5 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Globe2 className="h-4 w-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold tracking-wider text-slate-200">
                GODS-EYE-CONSOLE // 3D ORBIT
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-400 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                STANDALONE NODE
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 hidden sm:block">
              CESIUMJS 3D TILES · OSINT REAL-TIME FEEDS · OPTIC FLIR
            </p>
          </div>
        </div>

        {/* 右侧交互动作栏 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTips(!showTips)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono transition ${
              showTips
                ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                : "border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
            title="快捷操作说明"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">HUD 特性</span>
          </button>

          <button
            onClick={handleReload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs font-mono text-slate-300 hover:bg-slate-800 hover:text-white transition"
            title="重新加载地球视窗"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">重载</span>
          </button>

          <a
            href={targetUrl.replace("?embed=1", "").replace("&embed=1", "")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs font-mono text-slate-300 hover:bg-slate-800 hover:text-white transition"
            title="新窗口独立运行完整版"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">独立窗口</span>
          </a>

          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-mono font-medium text-cyan-300 hover:bg-cyan-500/20 transition"
            title={isFullscreen ? "退出全屏" : "全屏沉浸体验"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span>退出</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span>全屏</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 快捷特性折叠抽屉 */}
      {showTips && (
        <div className="border-b border-slate-800 bg-slate-900/95 px-4 py-3 text-xs text-slate-300 backdrop-blur-md z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-start gap-2.5">
            <Satellite className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-200">空间多维图层</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                实时追踪全球航班（ADS-B）、远洋船舶（AIS）、近地轨道卫星群及 NASA 野火热源。
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Radio className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-200">军用级光学滤镜</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                支持 FLIR 热成像、微光夜视、CRT 扫描线着色器及座舱视角（Cockpit View）。
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Compass className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-200">贾维斯联动</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                作为 Chen Tech Studio 空间情报大屏，后续支持通过对话终端下达指令自动导引经纬度。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3D 视窗主体与加载遮罩 */}
      <div className="relative flex-1 bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xs z-20 text-center px-4">
            <div className="relative mb-4 flex h-14 w-14 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/20" />
              <div className="h-10 w-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
              <Globe2 className="absolute h-5 w-5 text-cyan-400" />
            </div>
            <div className="font-mono text-sm font-semibold tracking-wider text-slate-200">
              CONNECTING TO GOD&apos;S EYE VIEW // 正在连接三维视窗
            </div>
            <p className="mt-1 text-xs text-slate-400 font-mono">
              加载全球瓦片、WebGL 着色器与实时数据节点...
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 font-mono bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>若本地开发环境未启动，请在 gods-eye-view 运行 npm run dev</span>
            </div>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={targetUrl}
          className="h-full w-full border-0"
          onLoad={() => setIsLoading(false)}
          allow="fullscreen; geolocation; microphone; camera"
          title="God's Eye View 3D Globe"
        />
      </div>

      {/* 底部 HUD 状态与版权 */}
      <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950/90 px-4 py-1.5 text-[11px] font-mono text-slate-400 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-medium">OSINT CONSOLE</span>
          <span>·</span>
          <span>SRC: BILAWAL SIDHU</span>
          <span>·</span>
          <span>POWERED BY CESIUM & NEXT.JS</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span>PORT: 4173</span>
          <span>·</span>
          <span className="text-emerald-400">LAT/LON ENGINE READY</span>
        </div>
      </div>
    </div>
  );
}
