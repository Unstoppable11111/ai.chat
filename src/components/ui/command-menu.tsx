"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Command, Search } from "lucide-react";
import { navigation } from "@/data/site";

export function CommandMenu() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    return navigation.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query]);

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
          className="fixed inset-0 z-[70] flex items-start justify-center bg-white/55 px-4 pt-24 backdrop-blur-sm"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="glass-panel w-full max-w-2xl overflow-hidden rounded-[28px]"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-slate-900/8 px-5 py-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="快速跳转到页面..."
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <span className="rounded-full border border-slate-900/8 px-2 py-1 text-xs text-muted-foreground">
                ESC
              </span>
            </div>

            <div className="p-3">
              {items.map((item) => (
                <button
                  type="button"
                  key={item.href}
                  className="flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left hover:bg-slate-900/[0.04]"
                  onClick={() => {
                    router.push(item.href);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.href}</p>
                  </div>
                  <Command className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
