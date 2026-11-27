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
  const [input, setInput] = useState("");
  const [defaultPrompt, setDefaultPrompt] = useState(() => initialDraft.trim());
  const [curatingMessage, setCuratingMessage] = useState<{ title: string; content: string } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const autoScroll = useRef(true);

  const isGuestExhausted = !isAuthenticated && !chat.quota.unlimited && chat.quota.remaining <= 0;
  const effectivePrompt = input.trim() || defaultPrompt;

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
    const value = input.trim() || defaultPrompt;
    if (!value || chat.loading || !chat.ready) return;
    setInput("");
    setDefaultPrompt("");
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
        className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[#E4E4E8] bg-[#FFFFFF]/90 backdrop-blur-sm p-4 space-y-5"
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
              <div className="animate-float-slow inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E0E7D9]/80 text-[#184120] border border-[#184120]/20 mb-1 shadow-2xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-[#042328]">你好，我是 JARVIS</h2>
              <p className="text-xs text-[#5C6873]">今天想研究什么？可以点击下方快捷问题或直接输入：</p>
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
                  className="shimmer-beam rounded-xl border border-[#E4E4E8] bg-[#F8F8F4] hover:bg-[#FFFFFF] hover:border-[#184120]/35 hover:shadow-sm p-3 text-left text-xs font-medium text-[#282828] hover:text-[#042328] transition-all cursor-pointer"
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#042328] text-[#E1F209] shadow-xs mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E0E7D9]/80 text-[#184120] border border-[#184120]/20 shadow-xs mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              {/* 消息气泡内容 */}
              {isUser ? (
                <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
                  <div className="rounded-2xl rounded-tr-xs bg-gradient-to-br from-[#042328] to-[#263844] px-4 py-2.5 text-sm text-[#FFFFFF] shadow-sm break-words whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-start min-w-0 max-w-[92%] sm:max-w-[85%]">
                  <div className="rounded-2xl rounded-tl-xs bg-[#FFFFFF] border border-[#E4E4E8] p-4 text-sm text-[#282828] shadow-sm leading-relaxed w-full">
                    <div className="flex items-center gap-2 mb-2 text-[11px] font-mono text-[#5C6873] border-b border-[#E4E4E8] pb-1.5">
                      <span className="font-semibold text-[#184120] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#184120]" />
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
                          const phaseText = message.reasoning_content
                            ? "正在组织最终回答…"
                            : chat.streamStatus.elapsedMs >= 3000
                              ? `正在思考中（${sec}s）…`
                              : "正在思考中…";
                          return (
                            <div className="flex items-center gap-2 text-xs font-mono text-[#5C6873]">
                              <span className="h-2 w-2 rounded-full bg-[#33DD18] animate-pulse" />
                              <span>{phaseText}</span>
                            </div>
                          );
                        }

                        return null;
                      })()}
                    </div>

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3.5 pt-2.5 border-t border-[#E4E4E8]">
                        <p className="mb-2 text-[11px] font-mono text-[#5C6873] flex items-center gap-1">
                          <Bookmark className="w-3 h-3 text-[#184120]" />
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
                              className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F2F7F9] hover:bg-[#E0E7D9]/45 border border-[#D8D8E4] hover:border-[#184120]/30 text-xs text-[#263844] hover:text-[#042328] transition-all truncate"
                            >
                              <span className="truncate">{source.title} · {source.heading}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 text-[#5C6873]" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {!chat.loading && message.content && !message.error && (
                      <div className="mt-2.5 pt-2 border-t border-[#E4E4E8] flex items-center justify-between text-xs">
                        <span className="text-[10px] font-mono text-[#5C6873]">JARVIS INTELLIGENCE</span>
                        <button
                          type="button"
                          onClick={() => {
                            const prevUser = chat.messages.slice(0, index).reverse().find(m => m.role === "user");
                            setCuratingMessage({
                              title: prevUser?.content.slice(0, 36) || "前沿架构与技术研报",
                              content: message.content
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E0E7D9]/60 hover:bg-[#E0E7D9] text-[#184120] text-[11px] font-medium border border-[#184120]/20 transition-all cursor-pointer shadow-2xs"
                        >
                          <BookOpen className="w-3 h-3 text-[#184120]" />
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
                    <span className="w-1.5 h-1.5 rounded-full bg-[#33DD18] animate-pulse" />
                    <span>今日免费: {chat.quota.remaining}/{chat.quota.total}</span>
                    <span className="text-[10px] text-[#5C6873] hidden sm:inline">0点重置</span>
                  </>
                )}
              </button>
            ) : (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E0E7D9]/70 text-[#184120] border border-[#184120]/20 text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-[#184120]" />
                <span>站长 chen · 无限畅享</span>
              </div>
            )}
            <a href="/privacy" className="text-xs text-[#5C6873] hover:text-[#042328] underline hidden sm:inline">
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
          className="relative flex flex-col rounded-2xl border border-[#E4E4E8] bg-[#FFFFFF]/96 backdrop-blur-xl shadow-md transition-all focus-within:border-[#184120]/60 focus-within:ring-4 focus-within:ring-[#E0E7D9]/60 p-2 sm:p-2.5"
        >
          <textarea
            aria-label="输入问题"
            placeholder={
              isGuestExhausted
                ? "今日 3 次免费提问额度已用尽，超级管理员 chen 享有无限特权…"
                : defaultPrompt || "输入您的问题，向 JARVIS 提问…"
            }
            maxLength={4000}
            rows={compact ? 2 : 3}
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
            className="w-full max-h-44 min-h-[76px] resize-none bg-transparent px-2 py-1.5 text-sm sm:text-base placeholder:text-[#5C6873]/70 focus:outline-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1.5 px-1 border-t border-[#E4E4E8]/80">
            <span className="text-[11px] text-[#5C6873] hidden sm:inline">
              Enter 发送，Shift + Enter 换行
            </span>

            <div className="flex items-center gap-2 ml-auto">
              {chat.loading ? (
                <button
                  type="button"
                  aria-label="停止生成"
                  title="停止生成"
                  onClick={chat.stop}
                  className="flex h-8 items-center gap-1.5 px-3 rounded-xl bg-[#263844] hover:bg-[#D71018] text-[#FFFFFF] text-xs font-medium transition-colors cursor-pointer shadow-xs"
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
                  className="flex h-8 items-center gap-1.5 px-3.5 rounded-xl bg-[#042328] hover:bg-[#184120] text-[#FFFFF2] text-xs font-medium transition-all shadow-xs cursor-pointer"
                >
                  <LockKeyhole className="h-3.5 w-3.5 text-[#E1F209]" />
                  <span>登录后提问</span>
                </button>
              ) : (
                <button
                  type="submit"
                  aria-label="发送消息"
                  title={input.trim() ? "发送消息" : defaultPrompt ? "直接发送默认提示词" : "发送消息"}
                  disabled={!chat.ready || !effectivePrompt}
                  className="flex h-8 items-center gap-1.5 px-3.5 rounded-xl bg-[#042328] hover:bg-[#184120] text-[#FFFFF2] text-xs font-medium transition-all shadow-xs disabled:opacity-40 disabled:hover:bg-[#042328] cursor-pointer"
                >
                  <span>发送</span>
                  <Send className="h-3 w-3 text-[#E1F209]" />
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
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#042328]/45 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#E4E4E8] bg-[#FFFFFF]/98 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    chat.issue.code === "UPSTREAM_STALLED"
                      ? "bg-[#FFFFF2] text-[#263844] border border-[#E0E7D9]"
                      : "bg-[#D71018]/[0.08] text-[#D71018]"
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F0F0F]">
                    {chat.issue.code === "UPSTREAM_STALLED" ? "思考时间较长，是否继续等待？" : "模型调用出现异常"}
                  </h3>
                  <p className="text-[11px] font-mono text-[#5C6873]">
                    MODEL: {chat.issue.model} · {chat.issue.code}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="关闭提示"
                onClick={chat.dismissIssue}
                className="rounded-full p-1 text-[#5C6873] hover:bg-[#F2F7F9] hover:text-[#042328] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-[#282828]">
              {chat.issue.message}
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {chat.issue.code === "UPSTREAM_STALLED" ? (
                <>
                  <button
                    type="button"
                    onClick={chat.dismissIssue}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#042328] px-3.5 py-2 text-xs font-semibold text-[#FFFFF2] shadow-sm hover:bg-[#184120] transition-all cursor-pointer"
                  >
                    <span>继续等待</span>
                  </button>
                  <div className={`grid gap-2 ${chat.issue.model !== "lumen" ? "grid-cols-2" : "grid-cols-1"}`}>
                    {chat.issue.model !== "lumen" && (
                      <button
                        type="button"
                        onClick={() => void chat.switchModelAndRetry("lumen")}
                        className="flex items-center justify-center gap-1 rounded-xl border border-[#E4E4E8] bg-[#FFFFFF] px-3 py-2 text-xs font-medium text-[#282828] hover:bg-[#F2F7F9] cursor-pointer"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        <span>切换 Lumen 重试</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={chat.stop}
                      className="rounded-xl border border-[#D71018]/25 bg-[#D71018]/[0.06] px-3 py-2 text-xs font-medium text-[#D71018] hover:bg-[#D71018]/12 cursor-pointer"
                    >
                      停止生成
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {chat.issue.model !== "lumen" && (
                    <button
                      type="button"
                      onClick={() => void chat.switchModelAndRetry("lumen")}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#042328] px-3.5 py-2 text-xs font-semibold text-[#FFFFF2] shadow-sm hover:bg-[#184120] transition-all cursor-pointer"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5 text-[#E1F209]" />
                      <span>切换至 Lumen 流光并立即重试</span>
                    </button>
                  )}
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
