"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Command, Search, ArrowRight } from "lucide-react";
import { navigation } from "@/data/site";

export function CommandMenu() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    query: string;
    items: { href: string; label: string }[];
    error?: string;
  }>({ query: "", items: [] });

  useEffect(() => {
    if (!open || query.trim().length < 2) return;
    const abort = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api-search?q=${encodeURIComponent(query.trim())}`, { signal: abort.signal })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          return data;
        })
        .then((data) => setResults({ query, items: data.items }))
        .catch((error) => {
          if (!abort.signal.aborted) setResults({ query, items: [], error: error.message });
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [query, open]);

  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => dialog.current?.querySelector("input")?.focus(), 0);
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const controls = dialog.current?.querySelectorAll<HTMLElement>("input,button,a[href]");
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", trap);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);

  const items = useMemo(() => {
    return [
      ...navigation.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
      ...(results.query === query ? results.items : []),
    ];
  }, [query, results]);

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
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/75 px-4 pt-24 backdrop-blur-md"
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
            className="arch-frame w-full max-w-2xl overflow-hidden rounded-xl border-cyan-500/30 bg-[#070b16]/98 shadow-[0_28px_90px_rgba(0,0,0,0.9)]"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="hud-header">
              <span className="text-cyan-400">STUDIO OS // COMMAND PALETTE</span>
              <span>CTRL+K SEARCH</span>
            </div>

            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <Search className="h-4 w-4 text-cyan-400" />
              <input
                aria-label="查找页面"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="输入关键词检索页面、技术白皮书或实验工坊…"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-400 hover:text-white cursor-pointer"
              >
                ESC
              </button>
            </div>

            <div className="max-h-[58dvh] overflow-y-auto p-2.5 space-y-1">
              {results.query === query && results.error && (
                <p role="status" className="p-4 text-xs font-mono text-rose-400">
                  {results.error}
                </p>
              )}
              {!items.length && !results.error && (
                <p role="status" className="p-4 text-xs font-mono text-slate-400">
                  {query.trim().length >= 2 && results.query !== query
                    ? "QUERYING RAG INDEX…"
                    : "NO MATCHING NODES FOUND"}
                </p>
              )}
              {items.map((item) => (
                <button
                  type="button"
                  key={item.href}
                  className="group flex w-full items-center justify-between rounded-lg border border-transparent px-4 py-3 text-left hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-all cursor-pointer"
                  onClick={() => {
                    router.push(item.href);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-cyan-300">
                      {item.label}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">{item.href}</p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 group-hover:text-cyan-400">
                    <Command className="h-3.5 w-3.5" />
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
