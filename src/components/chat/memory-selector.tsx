"use client";

import { useState, useRef, useEffect } from "react";
import { Brain, ChevronDown, Check, Plus, Trash2, Shield, Cloud, CloudOff, Sparkles, MessageSquare } from "lucide-react";
import { useChat } from "./chat-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

export function MemorySelector() {
  const { history, selectThread, newThread, deleteThread, clear, loading } = useChat();
  const { user, openAuthModal } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取当前激活的记忆 thread
  const currentThread = history.threads.find((t) => t.id === history.current) || history.threads[0];

  // 点击外部收起
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative flex-1 min-w-0" ref={containerRef}>
      {/* 触发主栏 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex-1 min-w-0 flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer text-left",
            isOpen
              ? "bg-[#060a14] border-cyan-500/60 ring-2 ring-cyan-500/20 text-white"
              : "bg-[#060a14]/90 border-white/10 hover:border-cyan-500/40 hover:bg-[#060a14] text-slate-200"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Brain className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2">
                <span className="truncate text-xs sm:text-sm font-medium text-white max-w-[220px] sm:max-w-[340px]">
                  {currentThread ? currentThread.title : "开启新对话"}
                </span>
                {user ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <Cloud className="w-2.5 h-2.5 text-emerald-400" />
                    云端记忆
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-white/[0.06] text-slate-300 border border-white/10">
                    <CloudOff className="w-2.5 h-2.5 text-slate-400" />
                    本地访客
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
              {history.threads.length} 个记忆片段
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-400 transition-transform duration-200",
                isOpen && "rotate-180 text-cyan-400"
              )}
            />
          </div>
        </button>

        {/* 快速新建记忆 */}
        <button
          type="button"
          title="新建对话记忆"
          aria-label="新建对话记忆"
          disabled={loading}
          onClick={() => {
            newThread();
            setIsOpen(false);
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#060a14] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all cursor-pointer disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* 下拉记忆抽屉面板 */}
      {isOpen && (
        <div className="arch-frame absolute left-0 top-full mt-2 z-50 w-full sm:max-w-md rounded-2xl border border-white/15 bg-[#060a14]/95 backdrop-blur-2xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* 记忆库状态头部 */}
          <div className="px-3 py-2.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-bold text-white">贾维斯 AI 记忆中枢</span>
            </div>
            {user ? (
              <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-mono bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>已绑定账户: {user.username}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  openAuthModal("login");
                }}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>未登录(点击登录同步记忆)</span>
              </button>
            )}
          </div>

          {/* 记忆列表 */}
          <div className="mt-1 max-h-64 overflow-y-auto space-y-1 p-0.5">
            {history.threads.map((thread) => {
              const isSelected = thread.id === history.current;
              const msgCount = thread.messages ? thread.messages.length : 0;

              return (
                <div
                  key={thread.id}
                  className={cn(
                    "group relative flex items-center justify-between gap-2 p-2.5 rounded-xl text-xs transition-all cursor-pointer",
                    isSelected
                      ? "bg-cyan-500/15 text-white font-medium border border-cyan-500/35"
                      : "hover:bg-white/[0.06] text-slate-300 border border-transparent"
                  )}
                  onClick={() => {
                    selectThread(thread.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors",
                        isSelected
                          ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40"
                          : "bg-white/[0.06] text-slate-400 group-hover:bg-cyan-500/15 group-hover:text-cyan-300"
                      )}
                    >
                      <MessageSquare className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white">{thread.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {msgCount > 0 ? `${msgCount} 条对话记忆` : "空白对话"}
                        {isSelected && " · 正在对话"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isSelected && <Check className="w-4 h-4 text-cyan-400 mr-1" />}
                    {/* 单条记忆删除按钮 */}
                    {history.threads.length > 1 && (
                      <button
                        type="button"
                        title="删除该记忆"
                        aria-label="删除该记忆"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteThread(thread.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 底部功能栏 */}
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2 px-1">
            <button
              type="button"
              onClick={() => {
                newThread();
                setIsOpen(false);
              }}
              className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded-lg hover:bg-cyan-500/10 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>开启新记忆对话</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm("确定要清空全部历史记忆吗？此操作无法恢复。")) {
                  clear();
                  setIsOpen(false);
                }
              }}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-rose-500/15 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>清空所有记忆</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
