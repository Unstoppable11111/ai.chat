"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, X } from "lucide-react";
import { ChatExperience } from "@/components/chat/chat-experience";

export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const handler = () => setOpen(true);
    const prepare = (event: Event) => {
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt;
      setDraft(typeof prompt === "string" ? prompt.slice(0, 4000) : "");
      setOpen(true);
    };

    window.addEventListener("open-chat-widget", handler);
    window.addEventListener("trigger-ai-chat", prepare);

    return () => {
      window.removeEventListener("open-chat-widget", handler);
      window.removeEventListener("trigger-ai-chat", prepare);
    };
  }, []);

  useEffect(() => {
    if (open) {
      panel.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus();
    }
  }, [open]);

  // 如果是在独立的 /chat 页面或 dev 路由，不渲染右下角小浮窗
  if (pathname === "/chat" || pathname.startsWith("/dev/")) {
    return null;
  }

  return (
    <>
      {/* 右下角浮动呼出按钮 */}
      {!open && (
        <button
          ref={trigger}
          type="button"
          aria-label="打开 AI 助手"
          title="向 JARVIS 提问"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-4 z-40 flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg hover:shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20 sm:right-6 sm:bottom-6 group"
        >
          <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400 group-hover:rotate-6 transition-transform" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
        </button>
      )}

      {/* 弹窗打开时的全屏背景遮罩（点击即可顺滑关闭，彻底防止移动端无法退出） */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] animate-in fade-in duration-200"
          onClick={() => {
            setOpen(false);
            setTimeout(() => trigger.current?.focus(), 0);
          }}
          aria-label="关闭 AI 对话"
          role="button"
          tabIndex={-1}
        />
      )}

      {/* AI 对话浮窗主体：移动端自适应为沉浸式 Bottom Sheet，桌面端为精致右下角悬浮窗 */}
      {open && (
        <div
          ref={panel}
          role="dialog"
          aria-label="AI 助手"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setTimeout(() => trigger.current?.focus(), 0);
            }
          }}
          className="fixed inset-x-0 bottom-0 z-[60] flex h-[86dvh] max-h-[86dvh] w-full flex-col rounded-t-[26px] border-t border-slate-200/90 bg-white/98 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-200 sm:fixed sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[620px] sm:w-[420px] sm:max-h-[calc(100dvh-5rem)] sm:rounded-2xl sm:border sm:border-slate-200/90"
        >
          {/* 移动端顶部的拖拽/滑动手柄（直观呈现可滑动/可收起意图） */}
          <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-2 shrink-0 sm:hidden" />

          {/* 顶部标头栏：包含清晰标题、状态与右上角显眼的关闭按钮（×） */}
          <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-2xs">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-slate-900">JARVIS 贾维斯</span>
                <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ONLINE
                </span>
              </div>
            </div>

            {/* 右上角高对比度、大触控热区关闭按钮 */}
            <button
              type="button"
              aria-label="关闭 AI 助手"
              title="关闭对话"
              onClick={() => {
                setOpen(false);
                setTimeout(() => trigger.current?.focus(), 0);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 对话内容区域 */}
          <div className="min-h-0 flex-1 p-2 sm:p-3 overflow-hidden flex flex-col">
            <ChatExperience compact initialDraft={draft} />
          </div>
        </div>
      )}
    </>
  );
}
