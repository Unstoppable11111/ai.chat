"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  User,
  MapPin,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Eye,
} from "lucide-react";
import type { BibleData, CharacterCard, VisualAssetItem, WorkflowConfig } from "@/types/workflow";

interface VisualAssetsBoardProps {
  bible: BibleData | null;
  coverUrl?: string;
  visualAssets: VisualAssetItem[];
  config: WorkflowConfig;
  onSaveVisualAsset: (asset: VisualAssetItem) => void;
  onQueueBusy?: (message?: string) => void;
}

export function VisualAssetsBoard({
  bible,
  coverUrl,
  visualAssets = [],
  config,
  onSaveVisualAsset,
  onQueueBusy,
}: VisualAssetsBoardProps) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

  // 手动确认生成人物立绘画像
  const handleGenerateCharacterPortrait = async (char: CharacterCard, idx: number) => {
    const assetId = `char_${char.name}_${idx}`;
    setGeneratingId(assetId);

    try {
      const res = await fetch("/api-workflow/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "character",
          name: char.name,
          role: char.role,
          personality: char.personality,
          appearance: char.appearance || char.visual_traits || "英姿挺拔，眼神如炬",
          genre: config.genre || "都市异能",
          apiKey: config.apiKey || "",
          baseUrl: config.baseUrl || "",
        }),
      });

      if (res.status === 429) {
        const errData = await res.json().catch(() => null);
        onQueueBusy?.(errData?.error || "当前生图算力队列繁忙，已停止等待，请稍后再试。");
        return;
      }

      const data = await res.json().catch(() => null);
      if (data?.code === "QUEUE_BUSY") {
        onQueueBusy?.(data?.error || "当前生图算力队列繁忙，已停止等待，请稍后再试。");
        return;
      }

      if (data?.success && data.image_url) {
        onSaveVisualAsset({
          id: assetId,
          type: "character",
          title: char.name,
          subtitle: char.role,
          description: `${char.personality} | ${char.appearance || char.visual_traits || ""}`,
          image_url: data.image_url,
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("生成人物立绘失败:", err);
    } finally {
      setGeneratingId(null);
    }
  };

  // 手动确认生成场景概念图
  const handleGenerateSceneConcept = async (sceneTitle: string, idx: number) => {
    const assetId = `scene_${idx}`;
    setGeneratingId(assetId);

    try {
      const res = await fetch("/api-workflow/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "scene",
          name: sceneTitle,
          role: "核心高能发生地",
          personality: "高压迫感，光影交叠",
          appearance: "宏大建筑群与深邃景深",
          genre: config.genre || "都市异能",
          apiKey: config.apiKey || "",
          baseUrl: config.baseUrl || "",
        }),
      });

      if (res.status === 429) {
        const errData = await res.json().catch(() => null);
        onQueueBusy?.(errData?.error || "当前生图算力队列繁忙，已停止等待，请稍后再试。");
        return;
      }

      const data = await res.json().catch(() => null);
      if (data?.code === "QUEUE_BUSY") {
        onQueueBusy?.(data?.error || "当前生图算力队列繁忙，已停止等待，请稍后再试。");
        return;
      }

      if (data?.success && data.image_url) {
        onSaveVisualAsset({
          id: assetId,
          type: "scene",
          title: sceneTitle,
          subtitle: "核心剧情场景",
          description: "宏大场景透视与光影氛围概念图",
          image_url: data.image_url,
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("生成场景图失败:", err);
    } finally {
      setGeneratingId(null);
    }
  };

  // 提取小说中的主要场景列表
  const scenes = bible.outlines?.map((o) => o.title) || ["第一章 核心交锋地", "第二章 阴谋深处"];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 顶部通告条 */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-cyan-500/10 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-700 shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              小说视觉资产库 · 按需专属生成
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
            <span className="text-[10px] text-slate-400 font-mono">已融合主角剪影与主场景</span>
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
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  type="button"
                  onClick={() => setPreviewImage(coverUrl)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>查看原图</span>
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                <span>第一章生成后自动出炉</span>
              </div>
            )}
          </div>

          <div className="space-y-2.5 text-center sm:text-left">
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
              {config.genre || "都市异能"} · 精装封面
            </div>
            <h4 className="text-lg font-black text-slate-900">{bible.title}</h4>
            <p className="text-xs text-slate-600 max-w-md leading-relaxed">
              {bible.logline || "暂无一句话故事钩子"}
            </p>
            <div className="text-[11px] text-slate-400 space-y-1 pt-1 font-mono">
              <p>主角：{bible.characters?.[0]?.name || "核心逆行者"}</p>
              <p>核心发生地：{scenes[0] || "高能剧情现场"}</p>
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
            const isGenerating = generatingId === assetId;

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
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs gap-2 z-10">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                      <span>正在渲染角色立绘...</span>
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
                    disabled={isGenerating}
                    onClick={() => handleGenerateCharacterPortrait(char, idx)}
                    className="w-full mt-2 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border shadow-2xs disabled:opacity-50 border-purple-500/30 bg-purple-50 hover:bg-purple-100 text-purple-700"
                  >
                    {existingAsset ? (
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
            const isGenerating = generatingId === assetId;

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
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs gap-2 z-10">
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                      <span>正在绘制场景概念图...</span>
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
                    disabled={isGenerating}
                    onClick={() => handleGenerateSceneConcept(sceneTitle, idx)}
                    className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs disabled:opacity-50 border-cyan-500/30 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 cursor-pointer"
                  >
                    {existingAsset ? "重新生成" : "生成场景图"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 原图弹窗查看 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
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
            <div className="pt-3 pb-1 flex items-center justify-between w-full px-4 text-white text-xs">
              <span className="text-slate-400">AI 工业化工作流独家认证视觉资产</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
