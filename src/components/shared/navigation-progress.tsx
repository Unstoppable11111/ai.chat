"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Instant visual feedback bar on Next.js App Router link clicks.
 * Uses only usePathname() so it never triggers Suspense de-opt warnings on static pages.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);
  const [slow, setSlow] = useState(false);
  const timerRef = useRef<number | null>(null);
  const prevPathRef = useRef(pathname);

  // navigating 为 true 超过 250ms 才显示提示胶囊（快速跳转不打扰）
  useEffect(() => {
    if (!navigating) {
      const reset = window.setTimeout(() => setSlow(false), 0);
      return () => window.clearTimeout(reset);
    }
    const timer = window.setTimeout(() => setSlow(true), 250);
    return () => window.clearTimeout(timer);
  }, [navigating]);

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      const doneTimer = window.setTimeout(() => {
        setNavigating(false);
      }, 0);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return () => window.clearTimeout(doneTimer);
    }
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return;
        }
      } catch {
        return;
      }

      setNavigating(true);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      // Failsafe: auto-reset if navigation was aborted
      timerRef.current = window.setTimeout(() => {
        setNavigating(false);
        timerRef.current = null;
      }, 8000);
    };

    document.addEventListener("click", handleClick, { capture: true, passive: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!navigating) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-[3px] overflow-hidden bg-sky-500/15"
      >
        <div className="h-full w-1/2 animate-[nav-progress_0.9s_ease-in-out_infinite] bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-400" />
      </div>
      {/* 点击后超过 250ms 仍未完成跳转时，显示明确的“正在打开”提示，避免用户误以为点击无效 */}
      {slow && (
        <div
          role="status"
          className="pointer-events-none fixed left-1/2 top-20 z-[80] -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/95 px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-lg backdrop-blur-xl">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            <span>正在打开页面…</span>
          </div>
        </div>
      )}
    </>
  );
}
