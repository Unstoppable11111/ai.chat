"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, User, Send, Square, RotateCcw, Sparkles, Bookmark, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "./chat-provider";
import { markdownComponents } from "./chat-types";
import { MemorySelector } from "./memory-selector";
import { ModelSelector } from "./model-selector";

export function ChatExperience({
  compact = false,
  initialDraft = "",
}: {
  compact?: boolean;
  initialDraft?: string;
}) {
  const chat = useChat();
  const [input, setInput] = useState(initialDraft);
  const scroller = useRef<HTMLDivElement>(null);
  const autoScroll = useRef(true);

  useEffect(() => {
    if (autoScroll.current && scroller.current) {
      scroller.current.scrollTop = scroller.current.scrollHeight;
    }
  }, [chat.messages, chat.loading]);

  const submit = () => {
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
          <div className="space-y-4 py-4 sm:py-6">
            <div className="text-center space-y-1.5">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-600 border border-cyan-500/30 mb-1 shadow-2xs">
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
              ].map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => setInput(text)}
                  className="rounded-xl border border-slate-200/90 bg-white/80 hover:bg-white hover:border-cyan-500/40 hover:shadow-xs p-3 text-left text-xs font-medium text-slate-700 hover:text-cyan-700 transition-all cursor-pointer"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 消息气泡列表 */}
        {chat.messages.map((message, index) => {
          const isUser = message.role === "user";

          return (
            <div
              key={index}
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

                    <div className="min-w-0 break-words leading-7">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {message.content || (chat.loading ? "正在深度思考生成中…" : "")}
                      </ReactMarkdown>
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
            </div>
          );
        })}
      </div>

      {/* 底部控制区：模型选择与现代化输入框 */}
      <div className="shrink-0 space-y-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between gap-3 px-0.5">
          <ModelSelector selectedModel={chat.model} onSelect={chat.setModel} disabled={chat.loading} />
          <a href="/privacy" className="text-xs text-muted-foreground hover:text-slate-700 underline">
            隐私与数据
          </a>
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
            placeholder="输入您的问题，向 JARVIS 提问…"
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
    </div>
  );
}
