"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, Sparkles, X } from "lucide-react";
import { RobotPet } from "@/components/shared/robot-pet";
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
  const { activateChat } = chat;
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
      activateChat();
      lastSeenSignatureRef.current = getMessageSignature(chat.messages);
      setHasUnreadReply(false);
      setProactiveBubble(null);
      setOpen(true);
    };
    const prepare = (event: Event) => {
      activateChat();
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
  }, [activateChat, chat.messages]);

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
          className="fixed bottom-[5.75rem] right-4 sm:bottom-[6.5rem] sm:right-6 z-40 w-[290px] sm:w-[320px] rounded-2xl border border-[#E0E7D9] bg-[#FFFFFF]/96 backdrop-blur-xl p-3.5 shadow-[0_18px_42px_-12px_rgba(4,35,40,0.18)] animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-tr from-[#042328] to-[#184120] text-[#E1F209] shadow-2xs">
                <Sparkles className="h-3 w-3" />
              </span>
              <span className="text-[11px] font-semibold text-[#042328]">JARVIS 主动搭话</span>
            </div>
            <button
              type="button"
              aria-label="关闭主动提示"
              onClick={dismissProactiveBubble}
              className="rounded-full p-1 text-[#5C6873] hover:bg-[#E0E7D9]/45 hover:text-[#042328] transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="text-xs leading-relaxed text-[#282828]">
            {proactiveBubble.text}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                chat.activateChat();
                const prompt = proactiveBubble.prompt;
                dismissProactiveBubble();
                lastSeenSignatureRef.current = getMessageSignature(chat.messages);
                setHasUnreadReply(false);
                setDraft(prompt);
                setOpen(true);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#042328] hover:bg-[#184120] px-3 py-1.5 text-xs font-semibold text-[#FFFFF2] shadow-xs transition-all cursor-pointer"
            >
              <MessageSquarePlus className="h-3.5 w-3.5 text-[#E1F209]" />
              <span>聊一聊</span>
            </button>
            <button
              type="button"
              onClick={dismissProactiveBubble}
              className="rounded-xl border border-[#E4E4E8] bg-[#F8F8F4] hover:bg-[#E0E7D9]/45 px-3 py-1.5 text-xs text-[#263844] transition-colors cursor-pointer"
            >
              稍后再说
            </button>
          </div>
        </div>
      )}

      {/* 右下角桌宠：小机器人悬浮在地面阴影上，有新回复/主动搭话时挥手；与左侧回到顶部按钮底部齐平 */}
      {!open && (
        <button
          ref={trigger}
          type="button"
          aria-label="打开 AI 助手"
          title="戳一戳，和 JARVIS 聊聊"
          onPointerEnter={() => {
            chat.activateChat();
            void loadChatExperience();
          }}
          onFocus={() => {
            chat.activateChat();
            void loadChatExperience();
          }}
          onClick={() => {
            chat.activateChat();
            lastSeenSignatureRef.current = getMessageSignature(chat.messages);
            setHasUnreadReply(false);
            setProactiveBubble(null);
            setOpen(true);
          }}
          className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex h-14 w-14 sm:h-16 sm:w-16 items-end justify-center cursor-pointer group select-none outline-none transition-transform duration-300 hover:-translate-y-1 hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#184120] rounded-3xl"
        >
          {/* 地面柔影：随悬停收缩，增强悬浮感 */}
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-1/2 h-2 w-9 -translate-x-1/2 rounded-full bg-[#042328]/15 blur-[3px] transition-all duration-300 group-hover:w-6 group-hover:opacity-60"
          />
          <RobotPet waving={hasUnreadReply || Boolean(proactiveBubble)} size={64} className="relative h-full w-full drop-shadow-[0_8px_14px_rgba(4,35,40,0.22)]" />
          {hasUnreadReply && (
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#33DD18] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#184120] border-2 border-[#FFFFFF]"></span>
            </span>
          )}
        </button>
      )}
      {/* 弹窗打开时的全屏背景遮罩（点击即可顺滑关闭，彻底防止移动端无法退出） */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-[#042328]/35 backdrop-blur-[2px] animate-in fade-in duration-200"
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
          className="fixed inset-x-0 bottom-0 z-[60] flex h-[86dvh] max-h-[86dvh] w-full flex-col overflow-hidden rounded-t-[28px] border-t border-[#E0E7D9] bg-gradient-to-b from-[#F2F7F9]/85 via-[#FFFFFF] to-[#FFFFFF] shadow-[0_-20px_60px_-20px_rgba(4,35,40,0.26)] backdrop-blur-xl animate-in slide-in-from-bottom duration-200 sm:fixed sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[640px] sm:w-[420px] sm:max-h-[calc(100dvh-5rem)] sm:rounded-[28px] sm:border sm:border-[#E0E7D9] sm:shadow-[0_30px_80px_-24px_rgba(4,35,40,0.3)]"
        >
          {/* 移动端顶部的拖拽/滑动手柄（直观呈现可滑动/可收起意图） */}
          <div className="w-10 h-1 rounded-full bg-[#C8C8C8] mx-auto mt-2 shrink-0 sm:hidden" />

          {/* 顶部标头：渐变光晕背景 + 桌宠头像 + 在线状态 + 关闭按钮 */}
          <div className="relative flex items-center justify-between px-4 py-3 shrink-0 overflow-hidden border-b border-[#E4E4E8]/80">
            <div aria-hidden="true" className="pointer-events-none absolute -top-10 -left-8 h-28 w-40 rounded-full bg-[#E0E7D9]/55 blur-2xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -top-12 right-0 h-28 w-36 rounded-full bg-[#F2F7F9]/80 blur-2xl" />
            <div className="relative flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFFFFF]/95 shadow-[0_6px_16px_-6px_rgba(4,35,40,0.22)] ring-1 ring-[#E0E7D9]">
                <RobotPet size={38} />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold text-[#042328]">JARVIS 贾维斯</div>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#184120] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#33DD18] animate-pulse" />
                  在线 · 随时为你解答
                </div>
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
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#FFFFFF]/90 hover:bg-[#E0E7D9]/45 active:scale-95 text-[#263844] hover:text-[#042328] transition-all cursor-pointer shadow-sm ring-1 ring-[#E4E4E8]"
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
