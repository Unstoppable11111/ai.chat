"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Message } from "./chat-types";
import { useAuth } from "@/components/auth/auth-provider";

export type Thread = { id: string; title: string; messages: Message[] };
export type History = { current: string; threads: Thread[] };
const initial: History = { current: "welcome", threads: [{ id: "welcome", title: "新对话", messages: [] }] };

export type ChatState = {
  history: History;
  messages: Message[];
  loading: boolean;
  ready: boolean;
  storageError: string;
  model: string;
  setModel: (model: string) => void;
  send: (text: string, retry?: boolean) => Promise<void>;
  stop: () => void;
  newThread: () => void;
  selectThread: (id: string) => void;
  deleteThread: (id: string) => void;
  clear: () => void;
};

const ChatContext = createContext<ChatState | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [history, setHistory] = useState<History>(initial);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [model, setModel] = useState("jarvis-balanced");
  const [storageError, setStorageError] = useState("");
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const abort = useRef<AbortController | null>(null);
  const storageKey = useRef("");
  const storageScope = useRef("");

  // 当当前登录用户 ID 变更时（登录/登出/换账号），重新初始化加载专属记忆
  useEffect(() => {
    let active = true;
    setReady(false);
    setStorageError("");
    abort.current?.abort();

    const loadHistory = async () => {
      const isAuthenticated = !!user?.id;
      storageKey.current = isAuthenticated ? "server" : "studio-chat-v2:anonymous";
      storageScope.current = isAuthenticated ? user.id : "";

      try {
        let raw: string | null = null;
        if (isAuthenticated) {
          const res = await fetch("/api-chat-history", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            raw = data.history ? JSON.stringify(data.history) : null;
          } else {
            throw new Error("History unavailable");
          }
        } else {
          raw = typeof window !== "undefined" ? localStorage.getItem(storageKey.current) : null;
        }

        if (!active) return;

        if (raw && raw.length < 1000000) {
          const parsed = JSON.parse(raw) as History;
          if (
            parsed &&
            Array.isArray(parsed.threads) &&
            parsed.threads.length &&
            parsed.threads.every(
              (t) =>
                typeof t.id === "string" &&
                typeof t.title === "string" &&
                Array.isArray(t.messages) &&
                t.messages.every((m) => ["user", "assistant"].includes(m.role) && typeof m.content === "string")
            )
          ) {
            setHistory({
              current: parsed.threads.some((t) => t.id === parsed.current) ? parsed.current : parsed.threads[0].id,
              threads: parsed.threads.slice(0, 10).map((t) => ({ ...t, messages: t.messages.slice(-30) })),
            });
            setReady(true);
            return;
          }
        }

        // 没有历史时初始化新对话
        const freshId = crypto.randomUUID();
        setHistory({ current: freshId, threads: [{ id: freshId, title: "新对话", messages: [] }] });
      } catch {
        if (!active) return;
        setStorageError("记忆库载入暂不可用，本次对话不会自动保存");
        const freshId = crypto.randomUUID();
        setHistory({ current: freshId, threads: [{ id: freshId, title: "新对话", messages: [] }] });
      } finally {
        if (active) setReady(true);
      }
    };

    void loadHistory();

    return () => {
      active = false;
      abort.current?.abort();
    };
  }, [user?.id]);

  // 对话变动时防抖保存
  useEffect(() => {
    if (!ready || !storageKey.current) return;
    if (loading) return;

    const timer = setTimeout(() => {
      try {
        if (storageKey.current === "server") {
          saveQueue.current = saveQueue.current
            .catch(() => {})
            .then(async () => {
              if (storageKey.current !== "server") return;
              const response = await fetch("/api-chat-history", {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  "X-Workspace-Scope": storageScope.current,
                },
                body: JSON.stringify(history),
              });
              if (response.status === 401 || response.status === 409) {
                storageKey.current = "";
                setHistory(initial);
                setReady(false);
                setStorageError("账户已变化或登录已过期，请刷新页面后继续");
                return;
              }
              if (!response.ok) throw new Error();
              setStorageError("");
            })
            .catch(() => setStorageError("最新记忆尚未同步，请检查连接"));
        } else {
          localStorage.setItem(storageKey.current, JSON.stringify(history));
        }
      } catch {
        setStorageError("存储不可用，本次对话不会自动保存");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [history, ready, loading]);

  const messages = history.threads.find((t) => t.id === history.current)?.messages || [];
  const stop = useCallback(() => abort.current?.abort(), []);

  const send = async (text: string, retry = false) => {
    if (abort.current || !ready || (!text.trim() && !retry)) return;
    let previous = messages;
    if (retry) {
      const lastUser = messages.findLastIndex((message) => message.role === "user");
      if (lastUser < 0) return;
      previous = messages.slice(0, lastUser);
      text = messages[lastUser].content;
    }
    text = text.trim();
    if (text.length > 4000) return;
    const threadId = history.current;
    const requestMessages: Message[] = [...previous.filter((m) => !m.error), { role: "user" as const, content: text }].slice(-15);
    const displayMessages: Message[] = [
      ...previous,
      { role: "user" as const, content: text },
      { role: "assistant" as const, content: "" },
    ].slice(-30);

    setHistory((current) => ({
      ...current,
      threads: current.threads.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              title: thread.messages.length ? thread.title : text.slice(0, 28),
              messages: displayMessages,
            }
          : thread
      ),
    }));

    const controller = new AbortController();
    abort.current = controller;
    setLoading(true);

    let answer = "";
    let reasoning = "";
    let sawDone = false;
    let sources: Message["sources"] = [];

    const update = (error = false) =>
      setHistory((current) => ({
        ...current,
        threads: current.threads.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                messages: [
                  ...displayMessages.slice(0, -1),
                  { role: "assistant", content: answer, reasoning_content: reasoning, sources, error },
                ],
              }
            : thread
        ),
      }));

    try {
      const response = await fetch("/api-chat-backend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: requestMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.text || "请求失败，请重试");
      }
      if (!response.body) throw new Error("回答为空，请重试");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let event = "";
      let dataLines: string[] = [];

      const dispatch = () => {
        if (!dataLines.length) {
          event = "";
          return;
        }
        const data = dataLines.join("\n");
        dataLines = [];
        if (data === "[DONE]") {
          sawDone = true;
          return;
        }
        const parsed = JSON.parse(data);
        if (event === "sources") {
          sources = Array.isArray(parsed)
            ? parsed.filter((source) => typeof source.url === "string" && /^\/(build-log|news|projects|experiments)\//.test(source.url))
            : [];
        } else if (event === "error" || parsed.error) {
          throw new Error(parsed.message || "回答中断，请重试");
        } else {
          answer += parsed.choices?.[0]?.delta?.content || "";
          reasoning += parsed.choices?.[0]?.delta?.reasoning_content || "";
        }
        event = "";
        update();
      };

      try {
        while (true) {
          const { value, done } = await reader.read();
          buffer += done ? decoder.decode() + "\n\n" : decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line === "") dispatch();
            else if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
          }
          if (done) break;
        }
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
      if (!sawDone || !answer) throw new Error("回答未完整结束，请重试");
    } catch (error) {
      if (!controller.signal.aborted) {
        answer += `${answer ? "\n\n" : ""}${error instanceof Error ? error.message : "请求失败，请重试"}`;
        update(true);
      } else {
        answer ||= "已停止生成";
        update();
      }
    } finally {
      abort.current = null;
      setLoading(false);
    }
  };

  const newThread = () => {
    if (loading) return;
    const id = crypto.randomUUID();
    setHistory((current) => ({
      current: id,
      threads: [{ id, title: "新对话", messages: [] }, ...current.threads].slice(0, 10),
    }));
  };

  const selectThread = (id: string) => {
    if (!loading) setHistory((current) => ({ ...current, current: id }));
  };

  const deleteThread = (id: string) => {
    if (loading) return;
    setHistory((current) => {
      const remaining = current.threads.filter((t) => t.id !== id);
      if (!remaining.length) {
        const freshId = crypto.randomUUID();
        return { current: freshId, threads: [{ id: freshId, title: "新对话", messages: [] }] };
      }
      const nextCurrent = current.current === id ? remaining[0].id : current.current;
      return { current: nextCurrent, threads: remaining };
    });
  };

  const clear = () => {
    if (!loading) {
      const freshId = crypto.randomUUID();
      const freshHistory: History = { current: freshId, threads: [{ id: freshId, title: "新对话", messages: [] }] };
      setHistory(freshHistory);
      try {
        if (storageKey.current && storageKey.current !== "server") {
          localStorage.removeItem(storageKey.current);
        }
      } catch {}
    }
  };

  return (
    <ChatContext.Provider
      value={{
        history,
        messages,
        loading,
        ready,
        storageError,
        model,
        setModel,
        send,
        stop,
        newThread,
        selectThread,
        deleteThread,
        clear,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const chat = useContext(ChatContext);
  if (!chat) throw new Error("ChatProvider is missing");
  return chat;
}
