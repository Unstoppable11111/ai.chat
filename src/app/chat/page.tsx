import type { Metadata } from "next";
import { ChatExperience } from "@/components/chat/chat-experience";
import { Bot, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "贾维斯 AI 对话终端",
  description: "基于站内技术白皮书与全栈架构的 RAG 知识检索增强 AI 助手。",
  alternates: { canonical: "/chat" },
};

export default function ChatPage() {
  return (
    <section className="container-shell mx-auto flex h-[calc(100dvh-6.5rem)] min-h-[480px] max-w-4xl flex-col gap-3 py-3 sm:py-4">
      {/* 顶部科技感状态标头 */}
      <div className="flex items-center justify-between gap-3 shrink-0 pb-2 border-b border-slate-900/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-cyan to-blue-600 text-white shadow-xs">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-foreground">贾维斯 · JARVIS</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-mono font-medium border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ONLINE
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              RAG KNOWLEDGE RETRIEVAL // FULL-STACK COPILOT
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-muted-foreground bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
          <span>全站资料库实时索引就绪</span>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ChatExperience />
      </div>
    </section>
  );
}
