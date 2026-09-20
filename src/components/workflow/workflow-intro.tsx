"use client";

import React from "react";
import { Sparkles, Clapperboard, Layers, Cpu, Zap, ArrowRight } from "lucide-react";

interface WorkflowIntroProps {
  onSelectPreset?: (prompt: string, genre: string, style: string) => void;
}

const PRESETS = [
  {
    genre: "都市异能 / 脑洞反转",
    style: "极简电影质感、快节奏爽感",
    title: "纳米级时空倒流",
    prompt:
      "普通外科医生在一次车祸中觉醒了‘微观时间倒流三秒’的能力，他本只想救活女儿，却在医院深处无意撞破跨国药企活体克隆与长生实验的惊天阴谋……",
  },
  {
    genre: "科幻悬疑 / 赛博朋克",
    style: "冷硬派白描、高压迫感对白",
    title: "霓虹雨夜的机械仿生人",
    prompt:
      "雨夜的第三下水道区，一位退休的义体清道夫接到一笔赏金：追捕一个偷走巨头财阀核心算法代码的艺伎仿生人，然而当他追上目标时，仿生人体内传出的却是他五年前失踪妻子的记忆音频……",
  },
  {
    genre: "爆款短剧 / 爽剧逆袭",
    style: "短句密集、强冲突反差、三章一爆发",
    title: "隐姓埋名的守国者",
    prompt:
      "华夏龙帅为护妻隐退三年，甘当林家赘婿受尽白眼与屈辱。今日，千亿财团携百万战部兵临城下，只为迎接他荣归执掌帅印，而势利岳母刚刚将一纸离婚协议摔在他脸上……",
  },
  {
    genre: "悬疑古风 / 权谋谍影",
    style: "肃杀凛冽、细节伏笔密布",
    title: "大理寺午夜锁龙令",
    prompt:
      "天元三年，上元灯节夜，当朝宰相在皇城重重守卫之中被斩首弃市，现场唯留一枚失传百年的前朝玄铁密令。大理寺少卿奉旨彻查，却发现所有线索都指向了当今天子……",
  },
];

export function WorkflowIntro({ onSelectPreset }: WorkflowIntroProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-900/10 bg-gradient-to-b from-white/90 via-white/70 to-white/50 p-6 md:p-8 backdrop-blur-xl shadow-xs">
      {/* 装饰光斑背景 */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative z-10 space-y-6">
        {/* 顶部标签与标题 */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-800">
            <Sparkles className="h-3.5 w-3.5 text-cyan-600 animate-pulse" />
            <span>工业级内容生产流水线 · 电影级视觉分镜</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            自动化小说与{" "}
            <span className="text-gradient">AI 视频分镜工业化工作流</span>
          </h1>

          <p className="max-w-3xl text-sm sm:text-base text-slate-600 leading-relaxed">
            将初始故事灵感无缝转化为高商业价值的网文全案与电影级视频分镜。
            贯穿<strong>「世界观细纲 Bible」</strong>、<strong>「长文本连续正文」</strong>、
            <strong>「可灵/Runway 分镜提示词」</strong>、<strong>「去 AI 味短句重构」</strong>与
            <strong>「商业投稿包装」</strong>五大标准工业节点。
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
              <p className="text-xs font-bold text-slate-900">SSE 长连推流</p>
              <p className="text-[11px] text-muted-foreground">无惧超时实时打字机</p>
            </div>
          </div>
        </div>

        {/* 快速体验预设赛道卡片 */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              推荐赛道灵感（点击一键载入参数）
            </span>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {PRESETS.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => onSelectPreset?.(preset.prompt, preset.genre, preset.style)}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/70 p-3.5 text-left transition-all hover:border-cyan-500/40 hover:bg-white hover:shadow-sm cursor-pointer"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      {preset.genre.split("/")[0]}
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
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
