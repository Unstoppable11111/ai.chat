"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PromptCard } from "@/components/cards/prompt-card";
import { Reveal } from "@/components/shared/reveal";
import type { PromptEntry } from "@/lib/types";

type PromptLibraryExplorerProps = {
  items: PromptEntry[];
};

export function PromptLibraryExplorer({ items }: PromptLibraryExplorerProps) {
  const categories = ["全部", ...new Set(items.map((item) => item.category))];
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const categoryMatch = activeCategory === "全部" || item.category === activeCategory;
      const text = [
        item.title,
        item.model,
        item.summary,
        item.useCase,
        item.notes,
        item.tags.join(" "),
        item.prompt,
      ]
        .join(" ")
        .toLowerCase();
      const queryMatch = text.includes(query.toLowerCase());

      return categoryMatch && queryMatch;
    });
  }, [activeCategory, items, query]);

  return (
    <div className="space-y-8">
      <div className="glass-panel rounded-[28px] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 rounded-full border border-slate-900/8 bg-white/72 px-4 py-3 shadow-sm lg:min-w-[360px]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索提示词、场景、标签、模型..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-2 text-sm shadow-sm ${
                  activeCategory === category
                    ? "bg-foreground text-background"
                    : "border border-slate-900/8 bg-white/72 text-muted-foreground hover:border-brand-cyan/22 hover:text-foreground"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item, index) => (
          <Reveal key={item.id} delay={index * 0.04} once>
            <PromptCard item={item} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
