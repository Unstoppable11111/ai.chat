"use client";

import type { TocItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type TableOfContentsProps = {
  items: TocItem[];
};

export function TableOfContents({ items }: TableOfContentsProps) {
  if (!items.length) {
    return null;
  }

  return (
    <aside className="arch-frame sticky top-28 rounded-xl overflow-hidden">
      <div className="hud-header">
        <span className="text-cyan-300">INDEX // OUTLINE</span>
        <span>{items.length} SECTIONS</span>
      </div>
      <nav className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              "block text-xs leading-relaxed text-slate-400 hover:text-cyan-300 transition-colors border-l border-white/10 pl-3 hover:border-cyan-400",
              item.level === 3 && "ml-3 text-[11px]"
            )}
          >
            {item.text}
          </a>
        ))}
      </nav>
    </aside>
  );
}
