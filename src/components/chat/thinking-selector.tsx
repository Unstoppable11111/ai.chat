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
          "flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none outline-none",
          isOpen
            ? "bg-purple-500/20 text-white border-purple-500/50"
            : current.id === "off"
            ? "bg-[#04060b] text-slate-300 border-white/15 hover:bg-white/[0.06]"
            : "bg-purple-500/15 text-purple-300 border-purple-500/35 hover:bg-purple-500/25 font-semibold"
        )}
        title="设置模型的思考推导深度 (Thinking Level)"
      >
        <Cpu className={cn("h-3.5 w-3.5 shrink-0", current.id !== "off" ? "text-purple-400" : "text-slate-400")} />
        <span className="tracking-tight">{current.name}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-slate-400 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180 text-purple-300"
          )}
        />
      </button>

      {isOpen && (
        <div className="arch-frame absolute bottom-full mb-2 left-0 z-50 w-64 rounded-2xl border border-white/15 bg-[#060a14]/95 backdrop-blur-xl p-1.5 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 border-b border-white/10 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              THINKING LEVEL // 思考档位
            </span>
            <span className="text-[10px] font-mono text-purple-400">原生支持</span>
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
                      ? "bg-purple-500/20 text-purple-200 border border-purple-500/35 font-medium"
                      : "hover:bg-white/[0.06] text-slate-300"
                  )}
                >
                  <div>
                    <div className="text-xs font-semibold">{level.name}</div>
                    <div className="text-[10px] text-slate-400">{level.desc}</div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
