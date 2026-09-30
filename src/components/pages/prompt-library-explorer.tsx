"use client";

import { useMemo, useState } from "react";
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
      {/* 科技感提示词工程控制台 */}
      <div className="glass-panel p-5 sm:p-6 rounded-[28px] border border-slate-900/10 shadow-[0_4px_24px_rgba(15,23,42,0.03)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-900/5">
          <div className="flex items-center gap-2 font-mono text-xs text-brand-cyan font-semibold uppercase tracking-wider">
            <Terminal className="w-4 h-4 text-brand-cyan" />
            <span>PROMPT ENGINEERING // REUSABLE PATTERNS</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5 text-foreground font-semibold">
              <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
              <span>COLLECTED: {items.length} 组</span>
            </span>
            <span className="text-slate-300">|</span>
            <span>FILTERED: {filteredItems.length}</span>
          </div>
        </div>

        {/* 搜索与分类按钮 */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索提示词、模型适用度、场景、参数..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-900/10 bg-white/80 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categories.map((category) => {
              const isSelected = activeCategory === category;
              const count = countMap[category] || 0;
              return (
                <button
                  type="button"
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-sm font-semibold scale-105"
                      : "bg-white/70 border border-slate-900/8 text-muted-foreground hover:bg-white hover:text-foreground"
                  }`}
                >
                  <span>{category}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
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

      {/* 提示词卡片网格 */}
      {filteredItems.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.04} once>
              <PromptCard item={item} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-3xl border border-dashed border-slate-200 bg-white/40">
          <Terminal className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">未检索到匹配的提示词范式</p>
          <p className="text-xs text-slate-400 mt-1">请尝试更换检索关键词或选择其它类别</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveCategory("全部");
            }}
            className="mt-4 px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            重置筛选
          </button>
        </div>
      )}
    </div>
  );
}
