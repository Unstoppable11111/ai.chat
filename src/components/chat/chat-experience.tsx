"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Bot, User, Send, Square, RotateCcw, Sparkles, Bookmark, ExternalLink, BookOpen, LockKeyhole, ShieldCheck, AlertTriangle, ArrowRightLeft, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "./chat-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { markdownComponents } from "./chat-types";
import { MemorySelector } from "./memory-selector";
import { ModelSelector } from "./model-selector";
import { ThinkingSelector } from "./thinking-selector";
import { ThinkingBlock } from "./thinking-block";
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
        <p role="status" className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
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
        className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200/90 bg-white/70 backdrop-blur-sm p-4 space-y-5"
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
              <div className="animate-float-slow inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-600 border border-cyan-500/30 mb-1 shadow-2xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">你好，我是 JARVIS</h2>
              <p className="text-xs text-muted-foreground">今天想研究什么？可以点击下方快捷问题或直接输入：</p>
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
                  className="shimmer-beam rounded-xl border border-slate-200/90 bg-white/85 hover:bg-white hover:border-cyan-500/40 hover:shadow-sm p-3 text-left text-xs font-medium text-slate-700 hover:text-cyan-700 transition-all cursor-pointer"
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-xs mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600 border border-cyan-500/30 shadow-xs mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              {/* 消息气泡内容 */}
              {isUser ? (
                <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
                  <div className="rounded-2xl rounded-tr-xs bg-gradient-to-br from-cyan-600 via-cyan-500 to-blue-600 px-4 py-2.5 text-sm text-white shadow-sm break-words whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-start min-w-0 max-w-[92%] sm:max-w-[85%]">
                  <div className="rounded-2xl rounded-tl-xs bg-white/95 dark:bg-zinc-800/95 border border-slate-200/80 dark:border-zinc-700/80 p-4 text-sm text-slate-800 dark:text-slate-100 shadow-sm leading-relaxed w-full">
                    <div className="flex items-center gap-2 mb-2 text-[11px] font-mono text-muted-foreground border-b border-slate-100 dark:border-zinc-700/60 pb-1.5">
                      <span className="font-semibold text-cyan-600 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-500" />
                        JARVIS
                      </span>
                      <span>·</span>
                      <span>智能投研核心</span>
                    </div>

                    <ThinkingBlock
                      reasoningContent={message.reasoning_content}
                      isThinking={
                        chat.loading &&
                        index === chat.messages.length - 1 &&
                        !message.content &&
                        Boolean(message.reasoning_content)
                      }
                    />

                    <div className="min-w-0 break-words leading-7">
                      {(() => {
                        const cleanContent = (message.content || "")
                          .replace(/<ElicitationsGroup>[\s\S]*?<\/ElicitationsGroup>/gi, "")
                          .replace(/<\/?(?:ElicitationsGroup|Elicitation)\b[^>]*>/gi, "")
                          .trim();

                        if (cleanContent) {
                          return (
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                              {cleanContent}
                            </ReactMarkdown>
                          );
                        }

                        if (chat.loading && index === chat.messages.length - 1) {
                          const sec = Math.max(1, Math.round(chat.streamStatus.elapsedMs / 1000));
                          const phaseText =
                            chat.streamStatus.phase === "stalled"
                              ? `模型响应较慢，疑似卡住（已等待 ${sec}s）…`
                              : chat.streamStatus.phase === "waiting"
                                ? `正在等待 ${chat.streamStatus.model} 上游响应（已等待 ${sec}s）…`
                                : message.reasoning_content
                                  ? "正在组织最终回答…"
                                  : "正在深度思考生成中…";
                          return (
                            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  chat.streamStatus.phase === "stalled"
                                    ? "bg-amber-500 animate-ping"
                                    : "bg-cyan-500 animate-pulse"
                                }`}
                              />
                              <span>{phaseText}</span>
                            </div>
                          );
                        }

                        return null;
                      })()}
                    </div>

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-zinc-700/80">
                        <p className="mb-2 text-[11px] font-mono text-slate-500 flex items-center gap-1">
                          <Bookmark className="w-3 h-3 text-cyan-600" />
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
                              className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-cyan-50/60 border border-slate-200/60 hover:border-cyan-500/30 text-xs text-slate-700 hover:text-cyan-700 transition-all truncate"
                            >
                              <span className="truncate">{source.title} · {source.heading}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {!chat.loading && message.content && !message.error && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-700/60 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-mono text-slate-400">JARVIS INTELLIGENCE</span>
                        <button
                          type="button"
                          onClick={() => {
                            const prevUser = chat.messages.slice(0, index).reverse().find(m => m.role === "user");
                            setCuratingMessage({
                              title: prevUser?.content.slice(0, 36) || "前沿架构与技术研报",
                              content: message.content
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 text-[11px] font-medium border border-cyan-500/20 transition-all cursor-pointer shadow-2xs"
                        >
                          <BookOpen className="w-3 h-3 text-cyan-600" />
                          <span>沉淀为白皮书</span>
                        </button>
                      </div>
                    )}

                    {message.error && index === chat.messages.length - 1 && !chat.loading && (
                      <button
                        type="button"
                        onClick={() => void chat.send("", true)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium hover:bg-rose-100 transition-colors cursor-pointer"
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
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-medium"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
                title="默认每日限提问3次，北京时间0点重置。超级管理员 chen 享有无限特权"
              >
                {isGuestExhausted ? (
                  <>
                    <LockKeyhole className="w-3.5 h-3.5 text-amber-600" />
                    <span>今日额度已用尽 (0/{chat.quota.total}) · 登录解锁</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    <span>今日免费: {chat.quota.remaining}/{chat.quota.total}</span>
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">0点重置</span>
                  </>
                )}
              </button>
            ) : (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>站长 chen · 无限畅享</span>
              </div>
            )}
            <a href="/privacy" className="text-xs text-muted-foreground hover:text-slate-700 underline hidden sm:inline">
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
          className="relative flex flex-col rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-md transition-all focus-within:border-cyan-500/70 focus-within:ring-4 focus-within:ring-cyan-500/10 p-2 sm:p-2.5"
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
            className="w-full max-h-36 min-h-[44px] resize-none bg-transparent px-2 py-1 text-sm sm:text-base placeholder:text-slate-400 focus:outline-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1.5 px-1 border-t border-slate-100/80">
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Enter 发送，Shift + Enter 换行
            </span>

            <div className="flex items-center gap-2 ml-auto">
              {chat.loading ? (
                <button
                  type="button"
                  aria-label="停止生成"
                  title="停止生成"
                  onClick={chat.stop}
                  className="flex h-8 items-center gap-1.5 px-3 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
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
                  className="flex h-8 items-center gap-1.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium transition-all shadow-xs disabled:opacity-40 disabled:hover:from-cyan-600 disabled:hover:to-blue-600 cursor-pointer"
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

      {/* 模型卡顿 / 异常交互弹窗 */}
      {chat.issue && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="模型状态提示"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200/90 bg-white/98 p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    chat.issue.code === "UPSTREAM_STALLED"
                      ? "bg-amber-500/15 text-amber-600"
                      : "bg-rose-500/15 text-rose-600"
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {chat.issue.code === "UPSTREAM_STALLED" ? "模型响应较慢 / 疑似卡住" : "模型调用出现异常"}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    MODEL: {chat.issue.model} · {chat.issue.code}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="关闭提示"
                onClick={chat.dismissIssue}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {chat.issue.message}
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {chat.issue.model !== "4hydrogen" && (
                <button
                  type="button"
                  onClick={() => void chat.switchModelAndRetry("4hydrogen")}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:from-cyan-500 hover:to-blue-500 transition-all cursor-pointer"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  <span>切换至 4 Hydrogen 并立即重试</span>
                </button>
              )}

              {chat.issue.code === "UPSTREAM_STALLED" ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={chat.dismissIssue}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    继续等待
                  </button>
                  <button
                    type="button"
                    onClick={chat.stop}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 cursor-pointer"
                  >
                    停止生成
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      chat.dismissIssue();
                      void chat.send("", true);
                    }}
                    className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>重新尝试</span>
                  </button>
                  <button
                    type="button"
                    onClick={chat.dismissIssue}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    暂不处理
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
