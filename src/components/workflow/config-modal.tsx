"use client";

import React, { useState } from "react";
import { X, Settings2, Sliders, Key, Sparkles, Check } from "lucide-react";
import type { WorkflowConfig } from "@/types/workflow";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WorkflowConfig;
  onChange: (updated: Partial<WorkflowConfig>) => void;
}

const GENRE_OPTIONS = [
  "都市异能",
  "科幻悬疑",
  "爆款短剧",
  "无限流脑洞",
  "悬疑古风",
  "赛博修仙",
];

const STYLE_OPTIONS = [
  "快节奏爽感、电影质感",
  "冷硬派白描、高压迫感对白",
  "极简短句、强戏剧冲突",
  "黑色幽默、脑洞反转",
];

const MODEL_OPTIONS = [
  { label: "全站 AI 对话内置引擎 (推荐，默认使用无需填 Key)", value: "" },
  { label: "DeepSeek V3 (需填自定义 Key)", value: "deepseek-chat" },
  { label: "GPT-4o Mini (超快推理，需填自定义 Key)", value: "gpt-4o-mini" },
  { label: "GPT-4o (全能旗舰，需填自定义 Key)", value: "gpt-4o" },
  { label: "Claude 3.5 Sonnet (需填自定义 Key)", value: "claude-3-5-sonnet-20241022" },
];

export function ConfigModal({
  isOpen,
  onClose,
  config,
  onChange,
}: ConfigModalProps) {
  const [activeTab, setActiveTab] = useState<"creative" | "model">("creative");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40  animate-in fade-in duration-200">
      <div
        className="glass-panel w-full max-w-xl rounded-3xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">工作流参数与引擎配置</h2>
              <p className="text-xs text-muted-foreground">调优创作风格、章节规模与后端模型接口</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-2 pt-4 pb-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("creative")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "creative"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>创作规范调优</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("model")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "model"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span>模型与 API 接入</span>
          </button>
        </div>

        {/* 表单内容区 */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {activeTab === "creative" ? (
            <>
              {/* 题材类型 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">题材赛道</label>
                <div className="flex flex-wrap gap-1.5">
                  {GENRE_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => onChange({ genre: g })}
                      className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                        config.genre === g
                          ? "border-cyan-500 bg-cyan-50 text-cyan-800 font-semibold"
                          : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* 写作风格 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">写作语言风格</label>
                <div className="space-y-1.5">
                  {STYLE_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onChange({ style: s })}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center justify-between ${
                        config.style === s
                          ? "border-cyan-500 bg-cyan-50 text-cyan-800 font-semibold"
                          : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span>{s}</span>
                      {config.style === s && <Check className="h-3.5 w-3.5 text-cyan-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 章节生成数量 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">单次生成章节数</label>
                  <span className="text-xs font-mono font-bold text-cyan-700">
                    {config.chapterCount || 3} 章
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => onChange({ chapterCount: count })}
                      className={`py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all ${
                        (config.chapterCount || 3) === count
                          ? "border-cyan-500 bg-cyan-500 text-white shadow-xs"
                          : "border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {count} 章
                    </button>
                  ))}
                </div>
              </div>

              {/* 去 AI 味强度 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">去 AI 味短句化强度</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "light", label: "轻度 (推荐)", desc: "保留修辞，微调长句" },
                    { key: "medium", label: "中度", desc: "剔除套词，15字短句" },
                    { key: "aggressive", label: "重度", desc: "极限白描，高压冷峻" },
                  ].map((level) => (
                    <button
                      key={level.key}
                      type="button"
                      onClick={() =>
                        onChange({
                          deAiLevel: level.key as "light" | "medium" | "aggressive",
                        })
                      }
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        (config.deAiLevel || "light") === level.key
                          ? "border-violet-500 bg-violet-50/70 text-violet-900"
                          : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-xs font-bold">{level.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{level.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 自定义 System Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  附加自定义 Prompt 指令 (可选)
                </label>
                <textarea
                  rows={3}
                  value={config.customSystemPrompt || ""}
                  onChange={(e) => onChange({ customSystemPrompt: e.target.value })}
                  placeholder="例如：男主切勿圣母；反派智商在线；加入更多赛博义体或机械构造术语……"
                  className="w-full rounded-xl border border-slate-200 bg-white/90 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
            </>
          ) : (
            <>
              {/* 模型选择 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">目标大模型 (Model)</label>
                <div className="space-y-1.5">
                  {MODEL_OPTIONS.map((m) => {
                    const isSelected = (config.model || "") === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => onChange({ model: m.value })}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-50 text-cyan-800 font-semibold"
                            : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <span>{m.label}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {m.value || "内置引擎"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={config.model || ""}
                  onChange={(e) => onChange({ model: e.target.value })}
                  placeholder="或自定义输入模型标识 (如 qwen-max, deepseek-reasoner)"
                  className="w-full mt-1 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              {/* API 接入点 Base URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  OpenAI 兼容 Base URL (留空默认使用站长云端通道)
                </label>
                <input
                  type="text"
                  value={config.baseUrl || ""}
                  onChange={(e) => onChange({ baseUrl: e.target.value.trim() })}
                  placeholder="留空默认使用服务器端高速接口 (无需填写)"
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-muted-foreground">
                  若填入自定义中转端点，必须是以 http:// 或 https:// 开头的完整 URL。
                </p>
              </div>

              {/* 自定义 API Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    自定义第三方 API Key (可选)
                  </label>
                  {config.apiKey ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-medium text-cyan-700">
                      <Check className="h-3 w-3" />
                      已启用自定义第三方 Key
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      <Check className="h-3 w-3" />
                      默认使用站长 AI 对话服务
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  value={config.apiKey || ""}
                  onChange={(e) => onChange({ apiKey: e.target.value.trim() })}
                  placeholder="留空即默认使用站长内置 AI 对话服务生成"
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {config.apiKey
                    ? "您已配置个人 API Key，将优先使用您的 Key 及指定模型。"
                    : "默认无需填写任何 Key，系统已无缝接入全站 AI 助手的高速通道进行全流程创作。"}
                </p>
              </div>
            </>
          )}
        </div>

        {/* 底部确认按钮 */}
        <div className="pt-3 border-t border-slate-200/80 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-opacity"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>保存并返回</span>
          </button>
        </div>
      </div>
    </div>
  );
}
