"use client";

import React, { useState } from "react";
import { Sparkles, Clapperboard, Layers, Cpu, Zap, ArrowRight, RotateCw } from "lucide-react";
import { WORKFLOW_INSPIRATIONS, type WorkflowInspiration } from "@/data/workflow-inspirations";

interface WorkflowIntroProps {
  onSelectPreset?: (prompt: string, genre: string, style: string) => void;
}

const INITIAL_INSPIRATIONS = WORKFLOW_INSPIRATIONS.slice(0, 4);

function getRandomInspirations(count = 4): WorkflowInspiration[] {
  const shuffled = [...WORKFLOW_INSPIRATIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export const WorkflowIntro = React.memo(function WorkflowIntro({ onSelectPreset }: WorkflowIntroProps) {
  // 服务端与客户端初次渲染必须保持完全一致，严禁在初始状态中使用 Math.random() 造成水合错误 (React error #418)
  const [inspirations, setInspirations] = useState<WorkflowInspiration[]>(INITIAL_INSPIRATIONS);
  const [isRotating, setIsRotating] = useState(false);

  const handleRefresh = () => {
    setIsRotating(true);
    setInspirations(getRandomInspirations(4));
    setTimeout(() => setIsRotating(false), 500);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-900/10 bg-gradient-to-b from-white/90 via-white/70 to-white/50 p-6 md:p-8  shadow-xs">
      {/* 装饰光斑背景 */}

      <div className="relative z-10 space-y-6">
        {/* 顶部标签与标题 */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-800">
            <Sparkles className="h-3.5 w-3.5 text-cyan-600 animate-pulse" />
            <span>工业级内容生产流水线 · 电影级视觉分镜与角色立绘</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            自动化小说与{" "}
            <span className="text-gradient">AI 视频分镜工业化工作流</span>
          </h1>

          <p className="max-w-3xl text-sm sm:text-base text-slate-600 leading-relaxed">
            将初始故事灵感无缝转化为高商业价值的网文全案与电影级视频分镜。
            贯穿<strong>「世界观细纲 Bible」</strong>、<strong>「长文本连续正文」</strong>、
            <strong>「主角立绘与电影海报」</strong>、<strong>「可灵/Runway 分镜提示词」</strong>、
            <strong>「去 AI 味短句重构」</strong>与<strong>「云端书架资产绑定」</strong>工业节点。
          </p>
        </div>

        {/* 工业化核心特性微徽标 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/60 p-3 shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">上下文接力</p>
              <p className="text-[11px] text-muted-foreground">事实滚动摘要记忆</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/60 p-3 shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clapperboard className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">电影级分镜</p>
              <p className="text-[11px] text-muted-foreground">高精度中英视频Prompt</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/60 p-3 shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">去 AI 味短句</p>
              <p className="text-[11px] text-muted-foreground">15字短句+对白攻击性</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/60 p-3 shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">云端书架绑定</p>
              <p className="text-[11px] text-muted-foreground">专属账户全资产持久化</p>
            </div>
          </div>
        </div>

        {/* 100+ 随机推荐赛道灵感（支持手动刷新） */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                100+ 爆款赛道灵感库（点击一键载入设定）
              </span>
              <span className="text-[10px] text-slate-400 font-mono">随机抽取中</span>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/80 border border-slate-200 text-slate-700 hover:text-cyan-700 hover:border-cyan-500/40 text-xs font-medium shadow-2xs transition-all cursor-pointer"
              title="换一批爆款灵感"
            >
              <RotateCw
                className={`w-3.5 h-3.5 transition-transform duration-500 ${
                  isRotating ? "rotate-180 text-cyan-600" : ""
                }`}
              />
              <span>换一批灵感</span>
            </button>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {inspirations.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset?.(preset.prompt, preset.genre, preset.style)}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/70 p-3.5 text-left transition-all hover:border-cyan-500/40 hover:bg-white hover:shadow-sm cursor-pointer"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      {preset.genre}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h2 className="text-xs font-bold text-slate-800 group-hover:text-cyan-700 transition-colors">
                    {preset.title}
                  </h2>
                  <p className="line-clamp-2 text-[11px] text-slate-500 leading-relaxed">
                    {preset.prompt}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate max-w-[150px]">{preset.protagonist}</span>
                  <span className="text-cyan-600 font-semibold group-hover:underline">载入 &rarr;</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
