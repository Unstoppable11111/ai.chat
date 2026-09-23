"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  User,
  MapPin,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Eye,
  Download,
  Maximize2,
  Clock,
  Upload,
  Link as LinkIcon,
  X,
} from "lucide-react";
import type { BibleData, ChapterData, CharacterCard, VisualAssetItem, WorkflowConfig } from "@/types/workflow";

interface VisualAssetsBoardProps {
  projectId?: string;
  bible: BibleData | null;
  coverUrl?: string;
  visualAssets: VisualAssetItem[];
  chapters?: ChapterData[];
  config: WorkflowConfig;
  onSaveVisualAsset: (asset: VisualAssetItem, projectId?: string) => void;
  onUpdateCover?: (newCoverUrl: string, projectId?: string) => void;
  onQueueBusy?: (message?: string) => void;
  onSecurityAlert?: (message: string) => void;
  onQuotaLimit?: (message: string) => void;
}

const COOLDOWN_STORAGE_KEY = "chen_workflow_image_cooldown_until";

/**
 * 前端 Canvas 极速无损压缩，将本地巨型图片限制在 1024px 并压缩为轻量 WebP，杜绝数兆 Base64 卡死主线程
 */
function compressImageFile(file: File, maxDimension = 1024, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // 压缩为轻量 WebP，体积从 5MB 缩减至 80KB~150KB
        const compressedDataUrl = canvas.toDataURL("image/webp", quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function VisualAssetsBoard({
  projectId,
  bible,
  coverUrl,
  visualAssets = [],
  chapters = [],
  config,
  onSaveVisualAsset,
  onUpdateCover,
  onQueueBusy,
  onSecurityAlert,
  onQuotaLimit,
}: VisualAssetsBoardProps) {
  const [generationStates, setGenerationStates] = useState<Record<string, { status: "loading" | "error" | "cancelled" | "fallback"; message?: string }>>({});
  const controllersRef = React.useRef(new Map<string, AbortController>());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cooldownRemaining] = useState<number>(0);

  // 替换封面模态框与输入状态
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [replaceUrlInput, setReplaceUrlInput] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Leaving a book or tab cancels its requests before callbacks can update another book.
  useEffect(() => {
    const controllers = controllersRef.current;
    try {
      localStorage.removeItem(COOLDOWN_STORAGE_KEY);
    } catch {
      // 忽略
    }
    return () => { for (const controller of controllers.values()) controller.abort(); controllers.clear(); };
  }, []);

  // 保存图片到本地
  const handleDownloadImage = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      a.click();
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!bible) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 rounded-3xl border border-dashed border-slate-300/80 bg-white/40">
        <ImageIcon className="w-10 h-10 text-slate-400 mb-3" />
        <h3 className="text-sm font-bold text-slate-800">暂无小说资产</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          在左侧启动工业化工作流生成小说大纲后，此处将解锁主人公立绘画像与核心场景概念图生成功能。
        </p>
      </div>
    );
  }

  const generateAsset = async (
    assetId: string,
    type: "character" | "scene",
    title: string,
    subtitle: string,
    description: string,
    details: { name: string; role: string; personality: string; appearance: string; plot?: string }
  ) => {
    if (!projectId || controllersRef.current.has(assetId)) return;
    const controller = new AbortController();
    controllersRef.current.set(assetId, controller);
    setGenerationStates((previous) => ({ ...previous, [assetId]: { status: "loading" } }));
    const timeout = setTimeout(() => controller.abort(new DOMException("生图请求超时，请重试", "TimeoutError")), 180_000);
    try {
      const response = await fetch("/api-workflow/generate-assets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ projectId, type, ...details, description, style: config.style || "", worldview: bible.worldview, genre: config.genre || "都市异能" }),
      });
      const data = await response.json().catch(() => null);
      if (controller.signal.aborted) return;
      if (!response.ok || !data?.success || !data.image_url) {
        const message =
          data?.error ||
          (response.status === 502
            ? "生图服务暂时不可用或网络异常（HTTP 502），请稍后重试。"
            : response.status === 504
              ? "生图服务响应超时（HTTP 504），请稍后重试。"
              : `生图服务请求未完成（HTTP ${response.status}），请重试。`);
        if (data?.code === "DAILY_ASSET_QUOTA_EXCEEDED") onQuotaLimit?.(message);
        else if (response.status === 401 || data?.code === "PROMPT_INJECTION_DETECTED") onSecurityAlert?.(message);
        else if (response.status === 429) onQueueBusy?.(message);
        throw new Error(message);
      }
      const isFallback = Boolean(data.isFallback || data.status === "fallback");
      onSaveVisualAsset({
        id: assetId, type, title, subtitle, description,
        image_url: data.image_url, created_at: new Date().toISOString(),
        status: isFallback ? "fallback" : "generated",
        metadata: data.metadata,
      }, projectId);
      setGenerationStates((previous) => {
        const next = { ...previous };
        if (isFallback) next[assetId] = { status: "fallback", message: data?.warning || "当前为降级矢量预览图，可随时重新生成。" };
        else delete next[assetId];
        return next;
      });
    } catch (error) {
      const timedOut = controller.signal.reason?.name === "TimeoutError";
      const cancelled = controller.signal.aborted && !timedOut;
      setGenerationStates((previous) => ({ ...previous, [assetId]: {
        status: cancelled ? "cancelled" : "error",
        message: timedOut ? "生成超时，原图已保留，可重试。" : cancelled ? "已取消，原图已保留。" : error instanceof Error ? error.message : "生成失败，原图已保留。",
      } }));
    } finally {
      clearTimeout(timeout);
      controllersRef.current.delete(assetId);
    }
  };

  const handleGenerateCharacterPortrait = (char: CharacterCard, idx: number) =>
    generateAsset(`char_${char.name}_${idx}`, "character", char.name, char.role,
      `${char.personality} | ${char.appearance || char.visual_traits || ""}`,
      { name: char.name, role: char.role, personality: char.personality, appearance: char.appearance || char.visual_traits || char.motivation });

  const handleGenerateSceneConcept = (sceneTitle: string, idx: number) => {
    const outline = bible.outlines?.[idx];
    const chapter = chapters.find((item) => item.chapter_number === outline?.chapter_number);
    const plot = [outline?.goal, outline?.conflict, outline?.hook, chapter?.summary, ...(chapter?.video_prompts || []).map((shot) => `${shot.scene_title}: ${shot.visual_description}`)].filter(Boolean).join("\n").slice(0, 8000);
    return generateAsset(`scene_${idx}`, "scene", sceneTitle, "核心剧情场景",
      [outline?.goal, outline?.conflict, outline?.hook].filter(Boolean).join(" | "),
      { name: sceneTitle, role: outline?.goal || "", personality: outline?.conflict || "", appearance: outline?.hook || "", plot });
  };

  const renderGenerationStatus = (assetId: string, asset?: VisualAssetItem) => {
    const state = generationStates[assetId];
    return (
      <>
        {state?.status === "loading" && <button type="button" onClick={() => controllersRef.current.get(assetId)?.abort()} className="inline-flex items-center gap-1 text-xs text-rose-700"><X className="h-3.5 w-3.5" />取消生成</button>}
        {state?.message && <p role="status" className={state.status === "error" ? "text-xs text-rose-700" : "text-xs text-amber-700"}>{state.message}</p>}
        {!!asset?.previous_versions?.length && <div className="flex flex-wrap gap-2 pt-1">{asset.previous_versions.map((version, index) => <button key={version.created_at + index} type="button" title={`查看候选图 ${index + 1}`} onClick={() => setPreviewImage(version.image_url)} className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-slate-200"><Image src={version.image_url} alt={`候选图 ${index + 1}`} fill unoptimized sizes="48px" className="object-cover" /></button>)}</div>}
      </>
    );
  };

  // 提取小说中的主要场景列表
  const scenes = bible.outlines?.map((o) => o.title) || ["第一章 核心交锋地", "第二章 阴谋深处"];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 冷却警告通知条 */}
      {cooldownRemaining > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 shrink-0">
              <Clock className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <h4 className="text-xs font-bold">生图并发/超时冷却保护生效中</h4>
              <p className="text-[11px] text-amber-700/80">
                由于检测到上游并发上限或超时，系统已启用指数退避保护，期间暂停提交视觉资产生成。
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-800 font-mono text-xs font-bold shrink-0">
            剩余 {formatSeconds(cooldownRemaining)}
          </div>
        </div>
      )}

      {/* 顶部通告条 */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-cyan-500/10 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-700 shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              小说视觉资产库
            </h4>
            <p className="text-[11px] text-slate-500">
              人物画像与场景概念图为可选生成资产。用户手动确认后即时生成，并永久绑定至当前小说的数字资产包。
            </p>
          </div>
        </div>
      </div>

      {/* 1. 商业级小说封面海报 (融合主角与核心场景) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">出版级电影封面海报</h3>
            <span className="text-[10px] text-slate-400 font-mono">已融合主角剪影与主场景 · 支持无损放大与本地保存</span>
          </div>
        </div>

        <div className="p-4 sm:p-6 rounded-3xl bg-white/70 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-6 shadow-xs">
          <div className="relative w-40 h-60 sm:w-48 sm:h-72 rounded-2xl overflow-hidden shadow-xl border border-slate-300/60 shrink-0 bg-slate-900 group">
            {coverUrl ? (
              <>
                <Image
                  src={coverUrl}
                  alt={bible.title}
                  fill
                  unoptimized
                  loading="lazy"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  type="button"
                  onClick={() => setPreviewImage(coverUrl)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>放大封面</span>
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                <span>全书生成完毕后自动精美出炉</span>
              </div>
            )}
          </div>

          <div className="space-y-2.5 text-center sm:text-left flex-1">
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
              {config.genre || "都市异能"} · 出版级精装海报
            </div>
            <h4 className="text-lg font-black text-slate-900">{bible.title}</h4>
            <p className="text-xs text-slate-600 max-w-md leading-relaxed">
              {bible.logline || "暂无一句话故事钩子"}
            </p>
            <div className="text-[11px] text-slate-400 space-y-1 pt-1 font-mono">
              <p>主角：{bible.characters?.[0]?.name || "核心逆行者"}</p>
              <p>核心发生地：{scenes[0] || "高能剧情现场"}</p>
            </div>

            {/* 封面操作区: 替换封面、放大与保存本地 */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReplaceModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>替换封面 (与书架同步)</span>
              </button>

              {coverUrl && (
                <>
                  <button
                    type="button"
                    onClick={() => setPreviewImage(coverUrl)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>放大查看封面</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadImage(coverUrl, `《${bible.title}》_出版级电影封面.png`)
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>保存封面到本地</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. 主要人物立绘画像资产 (按需手动触发) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">主要人物专属立绘画像</h3>
            <span className="text-[10px] text-slate-400">点击卡片下方按钮手动确认生成</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bible.characters?.map((char, idx) => {
            const assetId = `char_${char.name}_${idx}`;
            const existingAsset = visualAssets.find((a) => a.id === assetId);
            const isGenerating = generationStates[assetId]?.status === "loading";

            return (
              <div
                key={char.name}
                className="p-4 rounded-3xl bg-white/80 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* 立绘图像区域 */}
                <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-200/80 flex items-center justify-center">
                  {existingAsset?.image_url ? (
                    <>
                      <Image
                        src={existingAsset.image_url}
                        alt={char.name}
                        fill
                        unoptimized
                        loading="lazy"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewImage(existingAsset.image_url)}
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                        title="查看大图"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4 space-y-2 text-slate-400">
                      <User className="w-8 h-8 mx-auto opacity-40" />
                      <p className="text-xs font-medium">尚未生成视觉立绘</p>
                      <p className="text-[10px] text-slate-500">点击下方按钮手动确认渲染</p>
                    </div>
                  )}

                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/70  flex flex-col items-center justify-center text-white text-xs gap-2 z-10">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                      <span>正在渲染角色立绘...</span>
                      <button type="button" onClick={() => controllersRef.current.get(assetId)?.abort()} title="取消生成" className="rounded p-2 hover:bg-white/20"><X className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>

                {/* 角色信息与手动生成按钮 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{char.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-semibold border border-purple-200">
                      {char.role}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {char.personality} · {char.appearance || char.visual_traits || char.motivation}
                  </p>

                  <button
                    type="button"
                    disabled={isGenerating || cooldownRemaining > 0}
                    onClick={() => handleGenerateCharacterPortrait(char, idx)}
                    className="w-full mt-2 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border shadow-2xs disabled:opacity-50 border-purple-500/30 bg-purple-50 hover:bg-purple-100 text-purple-700 disabled:cursor-not-allowed"
                  >
                    {cooldownRemaining > 0 ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                        <span className="text-amber-700">冷却保护中 ({formatSeconds(cooldownRemaining)})</span>
                      </>
                    ) : existingAsset ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>重新生成立绘画像</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>手动确认生成人物立绘</span>
                      </>
                    )}
                  </button>
                  {renderGenerationStatus(assetId, existingAsset)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 核心场景概念图资产 (按需手动触发) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm font-bold text-slate-900">核心剧情场景概念透视</h3>
            <span className="text-[10px] text-slate-400">点击卡片手动确认生成</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {scenes.slice(0, 4).map((sceneTitle, idx) => {
            const assetId = `scene_${idx}`;
            const existingAsset = visualAssets.find((a) => a.id === assetId);
            const isGenerating = generationStates[assetId]?.status === "loading";

            return (
              <div
                key={sceneTitle}
                className="p-4 rounded-3xl bg-white/80 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-3"
              >
                <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-cyan-950 border border-slate-200/80 flex items-center justify-center">
                  {existingAsset?.image_url ? (
                    <>
                      <Image
                        src={existingAsset.image_url}
                        alt={sceneTitle}
                        fill
                        unoptimized
                        loading="lazy"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewImage(existingAsset.image_url)}
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                        title="查看大图"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4 space-y-1.5 text-slate-400">
                      <MapPin className="w-7 h-7 mx-auto opacity-40" />
                      <p className="text-xs font-medium">尚未渲染场景概念图</p>
                      <p className="text-[10px] text-slate-500">点击下方按钮手动确认生成</p>
                    </div>
                  )}

                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/70  flex flex-col items-center justify-center text-white text-xs gap-2 z-10">
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                      <span>正在绘制场景概念图...</span>
                      <button type="button" onClick={() => controllersRef.current.get(assetId)?.abort()} title="取消生成" className="rounded p-2 hover:bg-white/20"><X className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="truncate">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{sceneTitle}</h5>
                    <p className="text-[10px] text-slate-400">高能剧情场景 · 宽幅概念透视</p>
                  </div>

                  <button
                    type="button"
                    disabled={isGenerating || cooldownRemaining > 0}
                    onClick={() => handleGenerateSceneConcept(sceneTitle, idx)}
                    className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs disabled:opacity-50 border-cyan-500/30 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {cooldownRemaining > 0
                      ? `冷却中 (${formatSeconds(cooldownRemaining)})`
                      : existingAsset
                      ? "重新生成"
                      : "生成场景图"}
                  </button>
                </div>
                {renderGenerationStatus(assetId, existingAsset)}
              </div>
            );
          })}
        </div>
      </div>

      {/* 原图弹窗查看 (支持无损放大与一键本地保存) */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80  animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl max-h-[85vh] w-full p-2 bg-slate-900 rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-[70vh] rounded-2xl overflow-hidden">
              <Image
                src={previewImage}
                alt="预览资产"
                fill
                unoptimized
                className="object-contain"
              />
            </div>
            <div className="pt-3 pb-1 flex flex-wrap items-center justify-between w-full px-4 text-white text-xs gap-2">
              <span className="text-slate-400 font-mono text-[11px]">
                Studio Ultra-HD 工业级超清视觉资产 (无水印认证)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadImage(
                      previewImage,
                      `《${bible.title}》_视觉资产_${Date.now()}.png`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>保存到本地</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors cursor-pointer font-medium"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 替换封面交互模态框 */}
      {isReplaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4  animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">替换小说封面</h3>
                  <p className="text-[11px] text-muted-foreground">
                    替换后与顶部书架封面实时联动双向同步入库
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReplaceModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 途径 1: 本地图片文件上传 */}
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-cyan-600" />
                  从本地电脑上传新封面
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const compressedUrl = await compressImageFile(file);
                      if (compressedUrl) {
                        onUpdateCover?.(compressedUrl, projectId);
                        setIsReplaceModalOpen(false);
                      }
                    } catch (err) {
                      console.error("压缩本地封面图片失败:", err);
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-cyan-400 bg-cyan-50/50 hover:bg-cyan-100/60 text-xs font-semibold text-cyan-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>选择本地图片 (PNG / JPG / WEBP)</span>
              </button>
            </div>

            {/* 途径 2: 输入网络图片链接 */}
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                输入网络图片 URL
              </span>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={replaceUrlInput}
                  onChange={(e) => setReplaceUrlInput(e.target.value)}
                  placeholder="https://example.com/cover.png"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (replaceUrlInput.trim()) {
                      onUpdateCover?.(replaceUrlInput.trim(), projectId);
                      setReplaceUrlInput("");
                      setIsReplaceModalOpen(false);
                    }
                  }}
                  disabled={!replaceUrlInput.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  应用
                </button>
              </div>
            </div>

            {/* 途径 3: 从已生成的视觉资产中选择 */}
            {visualAssets && visualAssets.length > 0 && (
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  从已生成的人物画像或场景图中一键设为封面
                </span>
                <div className="grid grid-cols-3 gap-2.5 max-h-44 overflow-y-auto pr-1">
                  {visualAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => {
                        onUpdateCover?.(asset.image_url, projectId);
                        setIsReplaceModalOpen(false);
                      }}
                      className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-300/80 hover:border-cyan-500 transition-all cursor-pointer shadow-2xs"
                      title={`设为封面: ${asset.title}`}
                    >
                      <Image
                        src={asset.image_url}
                        alt={asset.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[10px] text-white text-center truncate">
                        {asset.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
