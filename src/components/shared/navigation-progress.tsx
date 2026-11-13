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
  const timerRef = useRef<number | null>(null);
  const prevPathRef = useRef(pathname);

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
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-[2.5px] overflow-hidden bg-sky-500/15"
    >
      <div className="h-full w-1/2 animate-[nav-progress_0.9s_ease-in-out_infinite] bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-400" />
    </div>
  );
}
