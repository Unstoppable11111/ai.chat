"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Bot, X } from "lucide-react";
import { useChat } from "@/components/chat/chat-provider";

const loadChatExperience = () => import("@/components/chat/chat-experience");
const ChatExperience = dynamic(() => loadChatExperience().then((mod) => mod.ChatExperience), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center text-xs font-mono text-cyan-400">
      INITIALIZING JARVIS STREAM…
    </div>
  ),
});

export function ChatWidget() {
  const pathname = usePathname();
  const chat = useChat();
  const [open, setOpen] = useState(false);
  const [hasUnreadReply, setHasUnreadReply] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const prevLoadingRef = useRef(false);

  useEffect(() => {
    const handler = () => {
      setHasUnreadReply(false);
      setOpen(true);
    };
    const prepare = (event: Event) => {
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt;
      setDraft(typeof prompt === "string" ? prompt.slice(0, 4000) : "");
      setHasUnreadReply(false);
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
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = chat.loading;

    if (wasLoading && !chat.loading && !open) {
      const last = chat.messages[chat.messages.length - 1];
      if (last && last.role === "assistant" && last.content && !last.error) {
        queueMicrotask(() => {
          setHasUnreadReply(true);
        });
      }
    }
  }, [chat.loading, chat.messages, open]);

  useEffect(() => {
    if (open) {
      panel.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus();
    }
  }, [open]);

  if (pathname === "/chat" || pathname.startsWith("/dev/")) {
    return null;
  }

  return (
    <>
      {!open && (
        <button
          ref={trigger}
          type="button"
          aria-label="打开 AI 助手"
          title="向 JARVIS 提问"
          onPointerEnter={() => void loadChatExperience()}
          onFocus={() => void loadChatExperience()}
          onClick={() => {
            setHasUnreadReply(false);
            setOpen(true);
          }}
          className="fixed bottom-5 right-4 z-40 flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-xl bg-[#070c18] text-white shadow-[0_12px_36px_rgba(0,240,255,0.22)] hover:border-cyan-400 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-cyan-500/40 sm:right-6 sm:bottom-6 group"
        >
          <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400 group-hover:rotate-6 transition-transform" />
          {hasUnreadReply && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400" />
            </span>
          )}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => {
            setOpen(false);
            setTimeout(() => trigger.current?.focus(), 0);
          }}
          aria-label="关闭 AI 对话"
          role="button"
          tabIndex={-1}
        />
      )}

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
          className="fixed inset-x-0 bottom-0 z-[60] flex h-[86dvh] max-h-[86dvh] w-full flex-col rounded-t-2xl border-t border-cyan-500/35 bg-[#060913]/98 shadow-[0_28px_80px_rgba(0,0,0,0.9)] backdrop-blur-xl animate-in slide-in-from-bottom duration-200 sm:fixed sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[640px] sm:w-[430px] sm:max-h-[calc(100dvh-5rem)] sm:rounded-xl sm:border sm:border-cyan-500/35"
        >
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-2 shrink-0 sm:hidden" />

          <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-white/10 bg-[#080d1a] shrink-0 sm:rounded-t-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-950/50 text-cyan-300">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white font-mono tracking-wider">
                  JARVIS // OS
                </span>
                <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/35">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>
            </div>

            <button
              type="button"
              aria-label="关闭 AI 助手"
              title="关闭对话"
              onClick={() => {
                setOpen(false);
                setTimeout(() => trigger.current?.focus(), 0);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 p-2 sm:p-3 overflow-hidden flex flex-col">
            <ChatExperience compact initialDraft={draft} />
          </div>
        </div>
      )}
    </>
  );
}
