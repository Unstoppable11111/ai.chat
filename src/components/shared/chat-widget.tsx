"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Bot, MessageSquarePlus, Sparkles, X } from "lucide-react";
import { useChat } from "@/components/chat/chat-provider";

// 性能优化：ChatExperience 依赖 react-markdown / remark-gfm 及多个选择器组件，体积较大。
// 浮窗默认关闭，因此改为按需懒加载，不再计入每个页面的首屏 JS；悬停按钮时提前预加载，保证打开无感。
const loadChatExperience = () => import("@/components/chat/chat-experience");
const ChatExperience = dynamic(() => loadChatExperience().then((m) => m.ChatExperience), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center text-xs text-slate-400">正在连接 JARVIS…</div>
  ),
});

const PROACTIVE_COOLDOWN_KEY = "jarvis-proactive-cooldown-until";
const PROACTIVE_COOLDOWN_MS = 3 * 60 * 1000;

function getMessageSignature(messages: { role: string; content: string }[]) {
  const last = messages[messages.length - 1];
  if (!last) return "empty";
  return `${messages.length}:${last.role}:${last.content.slice(0, 48)}:${last.content.length}`;
}

function buildProactiveGreeting(pathname: string, messages: { role: string; content: string }[]) {
  const pageHeading =
    typeof document !== "undefined"
      ? document.querySelector("main h1")?.textContent?.trim() || document.title.split("|")[0]?.trim() || ""
      : "";
  const cleanTitle = pageHeading.slice(0, 26);

  // 若用户有近期有效对话记录，随机有概率结合历史对话主动搭话
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user" && m.content.trim().length > 2);
  if (lastUserMsg && Math.random() < 0.45) {
    const snippet = lastUserMsg.content.trim().slice(0, 22);
    return {
      text: `刚才我们聊到「${snippet}${lastUserMsg.content.trim().length > 22 ? "…" : ""}」，需要我继续帮你深入拆解或整理吗？`,
      prompt: `继续刚才的话题：${lastUserMsg.content.trim().slice(0, 120)}`,
    };
  }

  if (pathname.startsWith("/build-log") || pathname.startsWith("/blog")) {
    return {
      text: cleanTitle
        ? `正在看「${cleanTitle}」？我可以帮你提炼核心架构或解答实现细节。`
        : "正在看技术文章？有什么架构细节想一起探讨吗？",
      prompt: cleanTitle ? `请帮我总结并解读《${cleanTitle}》的核心要点` : "帮我总结当前文章的核心技术点",
    };
  }
  if (pathname.startsWith("/news")) {
    return {
      text: cleanTitle
        ? `这篇资讯「${cleanTitle}」很有意思，要聊聊它背后的行业影响吗？`
        : "正在浏览科技资讯？我可以帮你快速梳理关键趋势。",
      prompt: cleanTitle ? `结合「${cleanTitle}」分析一下核心技术趋势与影响` : "帮我分析这条科技资讯的延伸影响",
    };
  }
  if (pathname.startsWith("/experiments") || pathname.startsWith("/projects")) {
    return {
      text: cleanTitle
        ? `在体验「${cleanTitle}」吗？随时可以问我它的底层原理或源码设计。`
        : "对这个项目实验感兴趣吗？我可以为你拆解它的实现思路。",
      prompt: cleanTitle ? `介绍一下「${cleanTitle}」的技术实现原理` : "介绍一下这个项目的核心技术架构",
    };
  }
  if (pathname.startsWith("/workflow")) {
    return {
      text: "正在使用创作工作流？我可以帮你润色大纲、优化提示词或排查生成问题。",
      prompt: "帮我优化一下当前工作流的创作大纲和提示词思路",
    };
  }
  return {
    text: cleanTitle
      ? `正在浏览「${cleanTitle}」？有任何问题都可以随时戳我聊聊。`
      : "Hi，我是 JARVIS！今天想探索站内的哪部分技术内容？",
    prompt: cleanTitle ? `关于当前页面「${cleanTitle}」，能为我介绍一下重点吗？` : "介绍一下 Chen Tech Studio 站内最值得体验的内容",
  };
}

export function ChatWidget() {
  const pathname = usePathname();
  const chat = useChat();
  const [open, setOpen] = useState(false);
  const [hasUnreadReply, setHasUnreadReply] = useState(false);
  const [proactiveBubble, setProactiveBubble] = useState<{ text: string; prompt: string } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const prevLoadingRef = useRef(false);
  const lastSeenSignatureRef = useRef("");

  const dismissProactiveBubble = useCallback(() => {
    setProactiveBubble(null);
    try {
      sessionStorage.setItem(PROACTIVE_COOLDOWN_KEY, String(Date.now() + PROACTIVE_COOLDOWN_MS));
    } catch {}
  }, []);

  useEffect(() => {
    const handler = () => {
      lastSeenSignatureRef.current = getMessageSignature(chat.messages);
      setHasUnreadReply(false);
      setProactiveBubble(null);
      setOpen(true);
    };
    const prepare = (event: Event) => {
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt;
      setDraft(typeof prompt === "string" ? prompt.slice(0, 4000) : "");
      lastSeenSignatureRef.current = getMessageSignature(chat.messages);
      setHasUnreadReply(false);
      setProactiveBubble(null);
      setOpen(true);
    };

    window.addEventListener("open-chat-widget", handler);
    window.addEventListener("trigger-ai-chat", prepare);

    return () => {
      window.removeEventListener("open-chat-widget", handler);
      window.removeEventListener("trigger-ai-chat", prepare);
    };
  }, [chat.messages]);

  useEffect(() => {
    if (open) {
      lastSeenSignatureRef.current = getMessageSignature(chat.messages);
      panel.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus();
      return;
    }

    // 仅在浮窗关闭期间，AI 流式真正返回了“新的有效内容”时才亮起蓝色未读点
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = chat.loading;

    if (wasLoading && !chat.loading) {
      const last = chat.messages[chat.messages.length - 1];
      const nextSig = getMessageSignature(chat.messages);
      const hasValidNewReply =
        last &&
        last.role === "assistant" &&
        !last.error &&
        last.content.trim().length > 0 &&
        last.content.trim() !== "已停止生成" &&
        nextSig !== lastSeenSignatureRef.current;

      if (hasValidNewReply) {
        lastSeenSignatureRef.current = nextSig;
        queueMicrotask(() => {
          setHasUnreadReply(true);
        });
      }
    }
  }, [chat.loading, chat.messages, open]);

  // 随机时间主动弹窗搭话（参考当前浏览网页与历史对话），带防打扰冷却
  useEffect(() => {
    if (open || pathname === "/chat" || pathname.startsWith("/dev/")) return;

    let cooldownLeft = 0;
    try {
      const until = Number(sessionStorage.getItem(PROACTIVE_COOLDOWN_KEY) || "0");
      cooldownLeft = Math.max(0, until - Date.now());
    } catch {}

    const randomDelay = 18000 + Math.floor(Math.random() * 27000); // 18s ~ 45s 随机
    const delay = Math.max(randomDelay, cooldownLeft);

    const timer = window.setTimeout(() => {
      if (chat.loading) return;
      const greeting = buildProactiveGreeting(pathname, chat.messages);
      setProactiveBubble(greeting);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, pathname, chat.loading, chat.messages]);

  // 如果是在独立的 /chat 页面或 dev 路由，不渲染右下角小浮窗
  if (pathname === "/chat" || pathname.startsWith("/dev/")) {
    return null;
  }

  return (
    <>
      {/* 主动搭话精致气泡卡片 */}
      {!open && proactiveBubble && (
        <div
          role="dialog"
          aria-label="JARVIS 主动对话邀请"
          className="fixed bottom-20 right-4 sm:bottom-22 sm:right-6 z-40 w-[290px] sm:w-[320px] rounded-2xl border border-sky-200/80 bg-white/95 backdrop-blur-xl p-3.5 shadow-[0_18px_42px_-12px_rgba(14,165,233,0.28)] animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-tr from-sky-500 to-indigo-500 text-white shadow-2xs">
                <Sparkles className="h-3 w-3" />
              </span>
              <span className="text-[11px] font-semibold text-slate-800">JARVIS 主动搭话</span>
            </div>
            <button
              type="button"
              aria-label="关闭主动提示"
              onClick={dismissProactiveBubble}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="text-xs leading-relaxed text-slate-600">
            {proactiveBubble.text}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const prompt = proactiveBubble.prompt;
                dismissProactiveBubble();
                lastSeenSignatureRef.current = getMessageSignature(chat.messages);
                setHasUnreadReply(false);
                setDraft(prompt);
                setOpen(true);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-xs transition-all cursor-pointer"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              <span>聊一聊</span>
            </button>
            <button
              type="button"
              onClick={dismissProactiveBubble}
              className="rounded-xl border border-slate-200/90 bg-slate-50/80 hover:bg-slate-100 px-3 py-1.5 text-xs text-slate-600 transition-colors cursor-pointer"
            >
              稍后再说
            </button>
          </div>
        </div>
      )}

      {/* 右下角浮动呼出按钮：Luminous Pearl 磨砂玻璃方圆徽章，与左侧回到顶部按钮齐平 */}
      {!open && (
        <button
          ref={trigger}
          type="button"
          aria-label="打开 AI 助手"
          title="向 JARVIS 提问"
          onPointerEnter={() => void loadChatExperience()}
          onFocus={() => void loadChatExperience()}
          onClick={() => {
            lastSeenSignatureRef.current = getMessageSignature(chat.messages);
            setHasUnreadReply(false);
            setProactiveBubble(null);
            setOpen(true);
          }}
          className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-2xl border border-sky-200/80 bg-white/95 backdrop-blur-xl text-slate-700 shadow-[0_12px_32px_-8px_rgba(14,165,233,0.28)] hover:border-sky-400 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-8px_rgba(14,165,233,0.4)] active:scale-95 transition-all duration-300 cursor-pointer group"
        >
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 via-cyan-500 to-indigo-500 text-white shadow-sm group-hover:scale-105 transition-transform">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-6 transition-transform" />
          </span>
          {hasUnreadReply && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-500 border-2 border-white"></span>
            </span>
          )}
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
          className="fixed inset-x-0 bottom-0 z-[60] flex h-[86dvh] max-h-[86dvh] w-full flex-col rounded-t-[26px] border-t border-slate-200/90 bg-white/98 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-200 sm:fixed sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[620px] sm:w-[420px] sm:max-h-[calc(100dvh-5rem)] sm:rounded-2xl sm:border sm:border-slate-200/90"
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
