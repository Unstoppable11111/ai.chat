import type { Metadata } from "next";
import Link from "next/link";
import { ChatExperience } from "@/components/chat/chat-experience";
import { Bot, Sparkles, X } from "lucide-react";

export const metadata: Metadata = {
  title: "贾维斯 AI 对话终端",
  description: "基于站内技术白皮书与全栈架构的 RAG 知识检索增强 AI 助手。",
  alternates: { canonical: "/chat" },
};

export default function ChatPage() {
  return (
    <section className="container-shell mx-auto flex h-[calc(100dvh-6.5rem)] min-h-[480px] max-w-4xl flex-col gap-3 py-3 sm:py-4">
      {/* 顶部科技感状态标头 */}
      <div className="flex items-center justify-between gap-3 shrink-0 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(0,240,255,0.3)]">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide">贾维斯 · JARVIS</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 text-[10px] font-mono font-medium border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                ONLINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              RAG KNOWLEDGE RETRIEVAL // FULL-STACK COPILOT
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-400/30 shadow-[0_0_10px_rgba(0,240,255,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>全站资料库实时索引就绪</span>
          </div>

          {/* 右上角关闭/返回按钮 */}
          <Link
            href="/"
            aria-label="关闭对话回到首页"
            title="关闭对话回到首页"
            className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-white/10 hover:border-cyan-400/40 cursor-pointer shadow-sm"
          >
            <X className="h-3.5 w-3.5" />
            <span>关闭</span>
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ChatExperience />
      </div>
    </section>
  );
}
