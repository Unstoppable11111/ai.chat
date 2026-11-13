"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search, Terminal } from "lucide-react";
import { PromptCard } from "@/components/cards/prompt-card";
import { Reveal } from "@/components/shared/reveal";
import type { PromptEntry } from "@/lib/types";

type PromptLibraryExplorerProps = {
  items: PromptEntry[];
};

export function PromptLibraryExplorer({ items }: PromptLibraryExplorerProps) {
  const categories = useMemo(() => {
    return ["全部", ...Array.from(new Set(items.map((item) => item.category)))];
  }, [items]);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");

  const countMap = useMemo(() => {
    const map: Record<string, number> = { 全部: items.length };
    items.forEach((it) => {
      map[it.category] = (map[it.category] || 0) + 1;
    });
    return map;
  }, [items]);

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
      <div className="arch-frame rounded-xl overflow-hidden">
        <div className="hud-header">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>PROMPT ENGINEERING // REUSABLE PATTERNS</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400">TOTAL: {items.length}</span>
            <span className="text-white/20">|</span>
            <span>MATCHED: {filteredItems.length}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索提示词、模型适用度、场景、参数..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/12 bg-[#04060b] text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((category) => {
              const isSelected = activeCategory === category;
              const count = countMap[category] || 0;
              return (
                <button
                  type="button"
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors duration-200 cursor-pointer border ${
                    isSelected
                      ? "text-slate-950 font-bold border-cyan-400"
                      : "bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25 hover:text-white"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="prompt-category-pill"
                      className="absolute inset-0 rounded-lg bg-cyan-400"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{category}</span>
                  <span
                    className={`relative z-10 text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isSelected ? "bg-black/20 text-slate-950" : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.04} once>
              <PromptCard item={item} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-xl border border-dashed border-white/15 bg-[#070b16]">
          <Terminal className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white">未检索到匹配的提示词范式</p>
          <p className="text-xs text-slate-400 mt-1">请尝试更换检索关键词或选择其它类别</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveCategory("全部");
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 transition-colors cursor-pointer"
          >
            重置筛选
          </button>
        </div>
      )}
    </div>
  );
}
