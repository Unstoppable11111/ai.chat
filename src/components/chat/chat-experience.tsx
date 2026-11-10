"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Bot, User, Send, Square, RotateCcw, Sparkles, Bookmark, ExternalLink, BookOpen, LockKeyhole, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "./chat-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { markdownComponents } from "./chat-types";
import { MemorySelector } from "./memory-selector";
import { ModelSelector } from "./model-selector";
import { ThinkingSelector } from "./thinking-selector";
import { CuratePostModal } from "./curate-post-modal";

export function ChatExperience({
  compact = false,
  initialDraft = "",
}: {
  compact?: boolean;
  initialDraft?: string;
}) {
  const chat = useChat();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [input, setInput] = useState(initialDraft);
  const [curatingMessage, setCuratingMessage] = useState<{ title: string; content: string } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const autoScroll = useRef(true);

  const isGuestExhausted = !isAuthenticated && !chat.quota.unlimited && chat.quota.remaining <= 0;

  useEffect(() => {
    if (autoScroll.current && scroller.current) {
      scroller.current.scrollTop = scroller.current.scrollHeight;
    }
  }, [chat.messages, chat.loading]);

  const submit = () => {
    if (isGuestExhausted) {
      openAuthModal("login");
      return;
    }
    if (!input.trim() || chat.loading || !chat.ready) return;
    const value = input;
    setInput("");
    autoScroll.current = true;
    void chat.send(value);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* 顶部记忆选择栏 */}
      <div className="shrink-0">
        <MemorySelector />
      </div>

      {chat.storageError && (
        <p role="status" className="text-xs text-amber-300 bg-amber-950/60 border border-amber-500/30 px-3 py-1.5 rounded-xl">
          {chat.storageError}
        </p>
      )}

      {/* 中部对话消息滚动区域（左右一人一边气泡布局） */}
      <div
        ref={scroller}
        onScroll={() => {
          const el = scroller.current;
          if (el) autoScroll.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        }}
        className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1120]/80 backdrop-blur-xl p-4 space-y-5 shadow-2xl"
        role="log"
        aria-label="对话消息"
        aria-live="polite"
      >
        {/* 空状态欢迎界面 */}
        {!chat.messages.length && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4 py-4 sm:py-6"
          >
            <div className="text-center space-y-1.5">
              <div className="animate-float-slow inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 mb-1 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-white">你好，我是 JARVIS</h2>
              <p className="text-xs text-slate-400">今天想研究什么？可以点击下方快捷问题或直接输入：</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 pt-2">
              {[
                "RAG 如何提供可验证的段落引用？",
                "如何设计安全的工具调用？",
                "KV cache 为什么影响推理显存？",
              ].map((text, idx) => (
                <motion.button
                  key={text}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.08 * idx, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -2 }}
                  onClick={() => setInput(text)}
                  className="shimmer-beam rounded-xl border border-white/10 bg-slate-900/80 hover:bg-slate-800 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] p-3 text-left text-xs font-medium text-slate-200 hover:text-cyan-300 transition-all cursor-pointer"
                >
                  {text}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 消息气泡列表 */}
        {chat.messages.map((message, index) => {
          const isUser = message.role === "user";

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* 头像 */}
              {isUser ? (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-white/10 text-white shadow-xs mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-400/40 shadow-[0_0_10px_rgba(0,240,255,0.25)] mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              {/* 消息气泡内容 */}
              {isUser ? (
                <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
                  <div className="rounded-2xl rounded-tr-xs bg-gradient-to-br from-cyan-600 via-cyan-500 to-blue-600 px-4 py-2.5 text-sm text-white shadow-[0_0_15px_rgba(0,240,255,0.2)] break-words whitespace-pre-wrap leading-relaxed font-sans">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-start min-w-0 max-w-[92%] sm:max-w-[85%]">
                  <div className="rounded-2xl rounded-tl-xs bg-[#0f172a]/95 border border-white/10 p-4 text-sm text-slate-100 shadow-md leading-relaxed w-full">
                    <div className="flex items-center gap-2 mb-2 text-[11px] font-mono text-slate-400 border-b border-white/10 pb-1.5">
                      <span className="font-semibold text-cyan-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        JARVIS
                      </span>
                      <span>·</span>
                      <span>智能投研核心</span>
                    </div>

                    <div className="min-w-0 break-words leading-7">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {(message.content || "")
                          .replace(/<ElicitationsGroup>[\s\S]*?<\/ElicitationsGroup>/gi, "")
                          .replace(/<\/?(?:ElicitationsGroup|Elicitation)\b[^>]*>/gi, "")
                          .trim() || (chat.loading ? "正在深度思考生成中…" : "")}
                      </ReactMarkdown>
                    </div>

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3.5 pt-2.5 border-t border-white/10">
                        <p className="mb-2 text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Bookmark className="w-3 h-3 text-cyan-400" />
                          参考引证资料
                        </p>
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          {message.sources.map((source) => (
                            <a
                              key={source.id}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={source.excerpt}
                              className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-cyan-950/40 border border-white/10 hover:border-cyan-400/40 text-xs text-slate-300 hover:text-cyan-300 transition-all truncate"
                            >
                              <span className="truncate">{source.title} · {source.heading}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {!chat.loading && message.content && !message.error && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-mono text-slate-500">JARVIS INTELLIGENCE</span>
                        <button
                          type="button"
                          onClick={() => {
                            const prevUser = chat.messages.slice(0, index).reverse().find(m => m.role === "user");
                            setCuratingMessage({
                              title: prevUser?.content.slice(0, 36) || "前沿架构与技术研报",
                              content: message.content
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-[11px] font-medium border border-cyan-400/30 transition-all cursor-pointer shadow-2xs"
                        >
                          <BookOpen className="w-3 h-3 text-cyan-400" />
                          <span>沉淀为白皮书</span>
                        </button>
                      </div>
                    )}

                    {message.error && index === chat.messages.length - 1 && !chat.loading && (
                      <button
                        type="button"
                        onClick={() => void chat.send("", true)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 text-rose-300 border border-rose-500/40 text-xs font-medium hover:bg-rose-900/60 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        重新尝试生成
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 底部控制区：模型选择、思考等级、提问配额提示与现代化输入框 */}
      <div className="shrink-0 space-y-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <ModelSelector selectedModel={chat.model} onSelect={chat.setModel} disabled={chat.loading} />
            <ThinkingSelector selectedLevel={chat.thinkingLevel} onSelect={chat.setThinkingLevel} disabled={chat.loading} />
          </div>
          
          <div className="flex items-center gap-2">
            {!chat.quota.unlimited ? (
              <button
                type="button"
                onClick={() => !isAuthenticated && openAuthModal("login")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${
                  isGuestExhausted
                    ? "bg-amber-950/60 text-amber-300 border border-amber-500/40 font-medium"
                    : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10"
                }`}
                title="默认每日限提问3次，北京时间0点重置。超级管理员 chen 享有无限特权"
              >
                {isGuestExhausted ? (
                  <>
                    <LockKeyhole className="w-3.5 h-3.5 text-amber-400" />
                    <span>今日额度已用尽 (0/{chat.quota.total}) · 登录解锁</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
                    <span>今日免费: {chat.quota.remaining}/{chat.quota.total}</span>
                    <span className="text-[10px] text-slate-500 hidden sm:inline">0点重置</span>
                  </>
                )}
              </button>
            ) : (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>站长 chen · 无限畅享</span>
              </div>
            )}
            <a href="/privacy" className="text-xs text-slate-400 hover:text-white underline hidden sm:inline">
              隐私
            </a>
          </div>
        </div>

        {/* 现代卡片式输入框 */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="relative flex flex-col rounded-2xl border border-white/10 bg-[#0d162b]/95 backdrop-blur-xl shadow-2xl transition-all focus-within:border-cyan-400/70 focus-within:ring-4 focus-within:ring-cyan-500/20 p-2 sm:p-2.5"
        >
          <textarea
            aria-label="输入问题"
            placeholder={
              isGuestExhausted
                ? "今日 3 次免费提问额度已用尽，超级管理员 chen 享有无限特权…"
                : "输入您的问题，向 JARVIS 提问…"
            }
            maxLength={4000}
            rows={compact ? 1 : 2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing &&
                event.nativeEvent.keyCode !== 229
              ) {
                event.preventDefault();
                submit();
              }
            }}
            className="w-full max-h-36 min-h-[44px] resize-none bg-transparent px-2 py-1 text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1.5 px-1 border-t border-white/10">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Enter 发送，Shift + Enter 换行
            </span>

            <div className="flex items-center gap-2 ml-auto">
              {chat.loading ? (
                <button
                  type="button"
                  aria-label="停止生成"
                  title="停止生成"
                  onClick={chat.stop}
                  className="flex h-8 items-center gap-1.5 px-3 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs border border-white/10"
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>停止</span>
                </button>
              ) : isGuestExhausted ? (
                <button
                  type="button"
                  aria-label="登录后提问"
                  title="今日3次额度已用尽，点击登录账号"
                  onClick={() => openAuthModal("login")}
                  className="flex h-8 items-center gap-1.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-medium transition-all shadow-xs cursor-pointer"
                >
                  <LockKeyhole className="h-3.5 w-3.5" />
                  <span>登录后提问</span>
                </button>
              ) : (
                <button
                  type="submit"
                  aria-label="发送消息"
                  title="发送消息"
                  disabled={!chat.ready || !input.trim()}
                  className="flex h-8 items-center gap-1.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-medium transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)] disabled:opacity-40 disabled:hover:from-cyan-500 disabled:hover:to-blue-600 cursor-pointer"
                >
                  <span>发送</span>
                  <Send className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <CuratePostModal
        isOpen={!!curatingMessage}
        onClose={() => setCuratingMessage(null)}
        defaultTitle={curatingMessage?.title || ""}
        assistantContent={curatingMessage?.content || ""}
      />
    </div>
  );
}
