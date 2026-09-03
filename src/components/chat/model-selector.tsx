"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Sparkles, Zap, BrainCircuit } from "lucide-react";
import { CHAT_MODELS, type ChatModelId } from "./chat-types";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  selectedModel: string;
  onSelect: (modelId: string) => void;
  disabled?: boolean;
  align?: "left" | "right";
}

const MODEL_ICONS: Record<string, typeof Sparkles> = {
  "jarvis-balanced": Sparkles,
  "jarvis-speed": Zap,
  "jarvis-ultra": BrainCircuit,
};

const MODEL_TAGS: Record<string, string> = {
  "jarvis-balanced": "推荐",
  "jarvis-speed": "毫秒级",
  "jarvis-ultra": "高智力",
};

export function ModelSelector({
  selectedModel,
  onSelect,
  disabled = false,
  align = "left",
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = CHAT_MODELS.find((m) => m.id === selectedModel) || CHAT_MODELS[0];
  const CurrentIcon = MODEL_ICONS[current.id] || Sparkles;

  // 点击外部自动关闭
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* 触发按钮：胶囊圆角，微透光泽，现代科技感 */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none shadow-2xs outline-none",
          isOpen
            ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xs"
            : "bg-white/90 dark:bg-zinc-800/90 text-slate-700 dark:text-slate-200 border-slate-900/10 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-zinc-700/80"
        )}
      >
        <CurrentIcon className="h-3.5 w-3.5 text-brand-cyan shrink-0" />
        <span className="font-semibold tracking-tight">{current.name}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform duration-200 shrink-0",
            isOpen && "rotate-180 text-foreground"
          )}
        />
      </button>

      {/* 浮动菜单：毛玻璃卡片，向上弹出，避免遮挡输入区 */}
      {isOpen && (
        <div
          className={cn(
            "absolute bottom-full mb-2 z-50 w-72 sm:w-80 rounded-2xl border border-slate-200/90 dark:border-zinc-700/90 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-1.5 shadow-xl transition-all animate-in fade-in zoom-in-95 duration-150",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              JARVIS AI CORES // 选择核心
            </span>
            <span className="text-[10px] font-mono text-brand-cyan">自研模型体系</span>
          </div>

          <div className="mt-1 space-y-1">
            {CHAT_MODELS.map((model) => {
              const isSelected = model.id === current.id;
              const Icon = MODEL_ICONS[model.id] || Sparkles;
              const tag = MODEL_TAGS[model.id];

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onSelect(model.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer group",
                    isSelected
                      ? "bg-brand-cyan/10 dark:bg-brand-cyan/15 text-slate-900 dark:text-white"
                      : "hover:bg-slate-100/80 dark:hover:bg-zinc-800/80 text-slate-600 dark:text-slate-300"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg shadow-2xs",
                      isSelected
                        ? "bg-brand-cyan text-white shadow-xs"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-500 group-hover:text-brand-cyan"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold tracking-tight">{model.name}</span>
                      {tag && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-slate-200/70 dark:bg-zinc-700/70 text-slate-700 dark:text-slate-300">
                          {tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">
                      {model.desc}
                    </p>
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4 text-brand-cyan shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}