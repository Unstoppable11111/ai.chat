"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Cpu } from "lucide-react";
import { THINKING_LEVELS, type ThinkingLevelId } from "./chat-types";
import { cn } from "@/lib/utils";

interface ThinkingSelectorProps {
  selectedLevel: ThinkingLevelId;
  onSelect: (level: ThinkingLevelId) => void;
  disabled?: boolean;
}

export function ThinkingSelector({
  selectedLevel,
  onSelect,
  disabled = false,
}: ThinkingSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = THINKING_LEVELS.find((l) => l.id === selectedLevel) || THINKING_LEVELS[0];

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
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none shadow-2xs outline-none",
          isOpen
            ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xs"
            : current.id === "off"
            ? "bg-white/90 dark:bg-zinc-800/90 text-slate-600 dark:text-slate-300 border-slate-900/10 dark:border-white/10 hover:bg-slate-100"
            : "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 hover:bg-purple-500/20 font-semibold"
        )}
        title="设置模型的思考推导深度 (Thinking Level)"
      >
        <Cpu className={cn("h-3.5 w-3.5 shrink-0", current.id !== "off" ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground")} />
        <span className="tracking-tight">{current.name}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform duration-200 shrink-0",
            isOpen && "rotate-180 text-foreground"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 z-50 w-64 rounded-2xl border border-slate-200/90 dark:border-zinc-700/90 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-1.5 shadow-xl transition-all animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              THINKING LEVEL // 思考档位
            </span>
            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">原生支持</span>
          </div>

          <div className="mt-1 space-y-1">
            {THINKING_LEVELS.map((level) => {
              const isSelected = level.id === current.id;

              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => {
                    onSelect(level.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left p-2 rounded-xl transition-all flex items-center justify-between cursor-pointer",
                    isSelected
                      ? "bg-purple-500/15 text-purple-900 dark:text-purple-200 font-medium"
                      : "hover:bg-slate-100/80 dark:hover:bg-zinc-800/80 text-slate-600 dark:text-slate-300"
                  )}
                >
                  <div>
                    <div className="text-xs font-semibold">{level.name}</div>
                    <div className="text-[10px] text-muted-foreground">{level.desc}</div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-purple-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
