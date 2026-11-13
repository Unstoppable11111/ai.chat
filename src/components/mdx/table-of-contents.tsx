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
    <aside className="glass-panel sticky top-28 rounded-[24px] p-5">
      <p className="mb-4 text-xs uppercase tracking-[0.22em] text-muted-foreground">
        目录
      </p>
      <nav className="space-y-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              "block text-sm text-muted-foreground hover:text-foreground",
              item.level === 3 && "pl-4",
            )}
          >
            {item.text}
          </a>
        ))}
      </nav>
    </aside>
  );
}
