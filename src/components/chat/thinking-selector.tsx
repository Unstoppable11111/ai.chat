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
            ? "bg-[#042328] text-[#FFFFF2] border-[#042328] shadow-xs"
            : current.id === "off"
            ? "bg-[#FFFFFF]/95 text-[#5C6873] border-[#E4E4E8] hover:bg-[#F2F7F9] hover:text-[#263844]"
            : "bg-[#F2F7F9] text-[#263844] border-[#263844]/25 hover:bg-[#E0E7D9]/55 hover:text-[#042328] font-semibold"
        )}
        title="设置模型的思考推导深度 (Thinking Level)"
      >
        <Cpu className={cn("h-3.5 w-3.5 shrink-0", isOpen ? "text-[#E1F209]" : current.id !== "off" ? "text-[#184120]" : "text-[#5C6873]")} />
        <span className="tracking-tight">{current.name}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-[#5C6873] transition-transform duration-200 shrink-0",
            isOpen && "rotate-180 text-[#FFFFF2]"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 z-50 w-64 rounded-2xl border border-[#E4E4E8] bg-[#FFFFFF]/96 backdrop-blur-xl p-1.5 shadow-xl transition-all animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 border-b border-[#E4E4E8] flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#5C6873]">
              THINKING LEVEL // 思考档位
            </span>
            <span className="text-[10px] font-mono text-[#184120] font-semibold">原生支持</span>
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
                      ? "bg-[#E0E7D9]/65 text-[#042328] font-medium"
                      : "hover:bg-[#F2F7F9] text-[#282828]"
                  )}
                >
                  <div>
                    <div className="text-xs font-semibold">{level.name}</div>
                    <div className="text-[10px] text-[#5C6873]">{level.desc}</div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#184120] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
