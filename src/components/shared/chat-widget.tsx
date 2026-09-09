"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, X } from "lucide-react";
import { ChatExperience } from "@/components/chat/chat-experience";
export function ChatWidget() {
  const path=usePathname();const [open,setOpen]=useState(false);const trigger=useRef<HTMLButtonElement>(null);const panel=useRef<HTMLDivElement>(null);
  const [draft,setDraft] = useState("");
  useEffect(()=>{const handler=()=>setOpen(true);const prepare=(event:Event)=>{const prompt=(event as CustomEvent<{prompt?:string}>).detail?.prompt;setDraft(typeof prompt==="string"?prompt.slice(0,4000):"");setOpen(true);};window.addEventListener("open-chat-widget",handler);window.addEventListener("trigger-ai-chat",prepare);return()=>{window.removeEventListener("open-chat-widget",handler);window.removeEventListener("trigger-ai-chat",prepare);};},[]);
  useEffect(()=>{if(open)panel.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus();},[open]);
  if(path==="/chat"||path.startsWith("/dev/"))return null;
  return <>
    {!open && <button ref={trigger} type="button" aria-label="打开 AI 助手" onClick={()=>setOpen(true)} className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white sm:right-6"><Bot className="h-6 w-6"/></button>}
    {open && <div ref={panel} role="dialog" aria-label="AI 助手" onKeyDown={event=>{if(event.key==="Escape"){setOpen(false);setTimeout(()=>trigger.current?.focus(),0);}}} className="fixed bottom-3 right-3 z-[60] flex h-[min(620px,calc(100dvh-6rem))] w-[min(400px,calc(100vw-1.5rem))] flex-col rounded-2xl border border-slate-200 bg-background p-3 shadow-xl"><div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold">JARVIS</span><button type="button" aria-label="关闭 AI 助手" onClick={()=>{setOpen(false);setTimeout(()=>trigger.current?.focus(),0);}} className="p-2"><X className="h-4 w-4"/></button></div><div className="min-h-0 flex-1"><ChatExperience compact initialDraft={draft}/></div></div>}
  </>;
}
