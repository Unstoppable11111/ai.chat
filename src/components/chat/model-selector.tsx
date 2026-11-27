"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Sparkles, Zap, BrainCircuit, Lock } from "lucide-react";
import { CHAT_MODELS } from "./chat-types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";

interface ModelSelectorProps {
  selectedModel: string;
  onSelect: (modelId: string) => void;
  disabled?: boolean;
  align?: "left" | "right";
}

const MODEL_ICONS: Record<string, typeof Sparkles> = {
  spark: Zap,
  lumen: Sparkles,
  nova: BrainCircuit,
};

const MODEL_TAGS: Record<string, string> = {
  spark: "默认极速",
  lumen: "日常推荐",
  nova: "站长专享",
};

export function ModelSelector({
  selectedModel,
  onSelect,
  disabled = false,
  align = "left",
}: ModelSelectorProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const isAdmin = Boolean(
    user && (user.username?.toLowerCase() === "chen" || user.username?.toLowerCase().startsWith("chen"))
  );

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

  const handleModelClick = (modelId: string, adminOnly?: boolean) => {
    if (adminOnly && !isAdmin) {
      setAlertMsg("Nova 新星为超级管理员 chen 专享推理核心，当前账户仅支持预览，无法体验。");
      setTimeout(() => setAlertMsg(""), 3500);
      return;
    }
    onSelect(modelId);
    setIsOpen(false);
    setAlertMsg("");
  };

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
            ? "bg-[#042328] text-[#FFFFF2] border-[#042328] shadow-xs"
            : "bg-[#FFFFFF]/95 text-[#263844] border-[#E4E4E8] hover:bg-[#F2F7F9] hover:border-[#184120]/30 hover:text-[#042328]"
        )}
      >
        <CurrentIcon className={cn("h-3.5 w-3.5 shrink-0", isOpen ? "text-[#E1F209]" : "text-[#184120]")} />
        <span className="font-semibold tracking-tight">{current.name}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-[#5C6873] transition-transform duration-200 shrink-0",
            isOpen && "rotate-180 text-[#FFFFF2]"
          )}
        />
      </button>

      {/* 浮动菜单：毛玻璃卡片，向上弹出，避免遮挡输入区 */}
      {isOpen && (
        <div
          className={cn(
            "absolute bottom-full mb-2 z-50 w-72 sm:w-80 rounded-2xl border border-[#E4E4E8] bg-[#FFFFFF]/96 backdrop-blur-xl p-1.5 shadow-xl transition-all animate-in fade-in zoom-in-95 duration-150",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="px-2.5 py-1.5 border-b border-[#E4E4E8] flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#5C6873]">
              STUDIO CORES // 智能核心
            </span>
            <span className="text-[10px] font-mono text-[#184120] font-semibold">
              {isAdmin ? "超管权限激活" : "标准账户"}
            </span>
          </div>

          {alertMsg && (
            <div className="mx-1 mt-1 p-2 rounded-xl bg-[#D71018]/[0.06] border border-[#D71018]/20 text-[#D71018] text-[11px] leading-relaxed animate-in fade-in">
              {alertMsg}
            </div>
          )}

          <div className="mt-1 space-y-1">
            {CHAT_MODELS.map((model) => {
              const isSelected = model.id === current.id;
              const Icon = MODEL_ICONS[model.id] || Sparkles;
              const tag = MODEL_TAGS[model.id];
              const isLocked = Boolean(model.adminOnly && !isAdmin);

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleModelClick(model.id, model.adminOnly)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer group",
                    isSelected
                      ? "bg-[#E0E7D9]/50 text-[#042328] border border-[#184120]/20"
                      : isLocked
                      ? "opacity-75 hover:bg-[#F8F8F4] text-[#5C6873] cursor-not-allowed"
                      : "hover:bg-[#F2F7F9] text-[#282828]"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg shadow-2xs",
                      isSelected
                        ? "bg-[#042328] text-[#E1F209] shadow-xs"
                        : isLocked
                        ? "bg-[#FFFFF2] border border-[#E0E7D9] text-[#282828]"
                        : "bg-[#F2F7F9] text-[#263844] group-hover:text-[#184120]"
                    )}
                  >
                    {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold tracking-tight">{model.name}</span>
                      {tag && (
                        <span
                          className={cn(
                            "text-[9px] font-mono px-1.5 py-0.2 rounded-md",
                            isLocked
                              ? "bg-[#FFFFF2] text-[#282828] border border-[#E0E7D9]"
                              : "bg-[#E0E7D9]/65 text-[#184120]"
                          )}
                        >
                          {tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5C6873] mt-0.5 leading-snug line-clamp-1">
                      {isLocked ? "仅超管 chen 账户可体验，普通账户仅供查看" : model.desc}
                    </p>
                  </div>

                  {isSelected && <Check className="h-4 w-4 text-[#184120] shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}