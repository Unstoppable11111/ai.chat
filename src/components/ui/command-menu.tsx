"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Command, Search } from "lucide-react";
import { navigation } from "@/data/site";

export function CommandMenu() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results,setResults] = useState<{query:string;items:{href:string;label:string}[];error?:string}>({query:"",items:[]});
  useEffect(()=>{
    if (!open || query.trim().length<2) return;
    const abort=new AbortController();
    const timer=setTimeout(()=>{
      fetch(`/api-search?q=${encodeURIComponent(query.trim())}`,{signal:abort.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);return data;}).then(data=>setResults({query,items:data.items})).catch(error=>{if(!abort.signal.aborted)setResults({query,items:[],error:error.message});});
    },250);
    return()=>{clearTimeout(timer);abort.abort();};
  },[query,open]);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => dialog.current?.querySelector("input")?.focus(), 0);
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const controls = dialog.current?.querySelectorAll<HTMLElement>('input,button,a[href]');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.clearTimeout(timer); document.removeEventListener("keydown", trap); document.body.style.overflow = overflow; previous?.focus(); };
  }, [open]);

  const items = useMemo(() => {
    return [...navigation.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase()),
    ),...(results.query===query?results.items:[])];
  }, [query,results]);

  useEffect(() => {
    function onKeydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function onCustomOpen() {
      setOpen(true);
    }

    window.addEventListener("keydown", onKeydown);
    window.addEventListener("open-command-menu", onCustomOpen);

    return () => {
      window.removeEventListener("keydown", onKeydown);
      window.removeEventListener("open-command-menu", onCustomOpen);
    };
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-[#042328]/35 px-4 pt-24 backdrop-blur-sm"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-label="搜索页面与文章"
            className="glass-panel w-full max-w-2xl overflow-hidden rounded-[28px] border border-[#E0E7D9] bg-[#FFFFFF]/98 shadow-[0_28px_72px_-16px_rgba(4,35,40,0.22)]"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[#E4E4E8] px-5 py-4">
              <Search className="h-4 w-4 text-[#184120]" />
              <input
                aria-label="查找页面"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索页面与文章…"
                className="w-full bg-transparent text-sm text-[#042328] outline-none placeholder:text-[#5C6873]"
              />
              <span className="rounded-full border border-[#D8D8E4] bg-[#F2F7F9] px-2 py-1 text-xs text-[#263844] font-mono">
                ESC
              </span>
            </div>

            <div className="max-h-[60dvh] overflow-y-auto p-3">
              {results.query===query&&results.error&&<p role="status" className="p-4 text-sm text-[#D71018]">{results.error}</p>}
              {!items.length && !results.error && <p role="status" className="p-4 text-sm text-[#5C6873]">{query.trim().length>=2&&results.query!==query?"正在搜索…":"没有匹配的内容"}</p>}
              {items.map((item) => (
                <button
                  type="button"
                  key={item.href}
                  className="flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left hover:bg-[#E0E7D9]/45 group transition-colors"
                  onClick={() => {
                    router.push(item.href);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-[#042328]">{item.label}</p>
                    <p className="text-xs text-[#5C6873]">{item.href}</p>
                  </div>
                  <Command className="h-4 w-4 text-[#5C6873] group-hover:text-[#184120]" />
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
