"use client";
import { useEffect, useRef, useState } from "react";
import { Bot, User, Send, Square, Plus, RotateCcw, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "./chat-provider";
import { CHAT_MODELS, markdownComponents } from "./chat-types";

export function ChatExperience({ compact = false, initialDraft = "" }: { compact?: boolean; initialDraft?: string }) {
  const chat=useChat(); const [input,setInput]=useState(initialDraft);
  const scroller=useRef<HTMLDivElement>(null); const autoScroll=useRef(true);
  useEffect(()=>{if(autoScroll.current && scroller.current)scroller.current.scrollTop=scroller.current.scrollHeight;},[chat.messages,chat.loading]);
  const submit=()=>{if(!input.trim() || chat.loading || !chat.ready)return;const value=input;setInput("");autoScroll.current=true;void chat.send(value);};
  return <div className="flex h-full min-h-0 flex-col gap-3">
    <div className="flex items-center gap-2 shrink-0">
      <label className="min-w-0 flex-1"><span className="sr-only">对话历史</span><select className="w-full truncate rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm" value={chat.history.current} disabled={chat.loading} onChange={e=>chat.selectThread(e.target.value)}>{chat.history.threads.map(thread=><option key={thread.id} value={thread.id}>{thread.title}</option>)}</select></label>
      <button type="button" title="新对话" aria-label="新对话" disabled={chat.loading} onClick={chat.newThread} className="p-2 disabled:opacity-40"><Plus className="h-4 w-4"/></button>
      <button type="button" title="清除对话历史" aria-label="清除对话历史" disabled={chat.loading} onClick={chat.clear} className="p-2 disabled:opacity-40"><Trash2 className="h-4 w-4"/></button>
    </div>
    {chat.storageError&&<p role="status" className="text-xs text-amber-700">{chat.storageError}</p>}
    <div ref={scroller} onScroll={()=>{const el=scroller.current;if(el)autoScroll.current=el.scrollHeight-el.scrollTop-el.clientHeight<100;}} className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white/80 p-4" role="log" aria-label="对话消息" aria-live="polite">
      {!chat.messages.length && <div className="space-y-5"><p className="text-sm leading-7">你好，我是 JARVIS。今天想研究什么？</p><div className="grid gap-2">{["RAG 如何提供可验证的段落引用？","如何设计安全的工具调用？","KV cache 为什么影响推理显存？"].map(text=><button key={text} type="button" onClick={()=>setInput(text)} className="rounded-lg border border-slate-200 p-3 text-left text-sm">{text}</button>)}</div></div>}
      {chat.messages.map((message,index)=><div key={index} className="mb-5 flex min-w-0 gap-3 last:mb-0"><span className="mt-1 shrink-0">{message.role==="user" ? <User className="h-4 w-4"/> : <Bot className="h-4 w-4"/>}</span><div className="min-w-0 flex-1 break-words text-sm leading-7">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{message.content || (chat.loading ? "正在生成…" : "")}</ReactMarkdown>
        {message.sources && message.sources.length>0 && <div className="mt-3 border-t border-slate-200 pt-2"><p className="mb-1 text-xs text-muted-foreground">参考资料</p>{message.sources.map(source=><a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" title={source.excerpt} className="mb-1 block text-xs text-sky-700 underline underline-offset-4">{source.title} · {source.heading}</a>)}</div>}
        {message.error && index===chat.messages.length-1 && !chat.loading && <button type="button" onClick={()=>void chat.send("",true)} className="mt-2 inline-flex items-center gap-1 text-sm text-sky-700"><RotateCcw className="h-4 w-4"/>重试</button>}
      </div></div>)}
    </div>
    <div className="shrink-0 space-y-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between gap-3"><label className="min-w-0"><span className="sr-only">回答模式</span><select value={chat.model} disabled={chat.loading} onChange={e=>chat.setModel(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">{CHAT_MODELS.map(model=><option key={model.id} value={model.id}>{model.name}</option>)}</select></label><a href="/privacy" className="text-xs text-muted-foreground underline">隐私与数据</a></div>
      <form onSubmit={event=>{event.preventDefault();submit();}} className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2">
        <textarea aria-label="输入问题" placeholder="输入您的问题…" maxLength={4000} rows={compact?1:2} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey&&!event.nativeEvent.isComposing&&event.nativeEvent.keyCode!==229){event.preventDefault();submit();}}} className="max-h-32 min-w-0 flex-1 resize-none bg-transparent px-2 py-1 text-base outline-none"/>
        {chat.loading ? <button type="button" aria-label="停止生成" title="停止生成" onClick={chat.stop} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white"><Square className="h-4 w-4"/></button> : <button type="submit" aria-label="发送消息" title="发送消息" disabled={!chat.ready||!input.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white disabled:opacity-40"><Send className="h-4 w-4"/></button>}
      </form>
    </div>
  </div>;
}
