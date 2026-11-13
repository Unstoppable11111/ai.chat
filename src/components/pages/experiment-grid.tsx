"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ExperimentCard } from "@/components/cards/experiment-card";
import { Reveal } from "@/components/shared/reveal";
import type { ExperimentCategory, ExperimentEntry } from "@/lib/types";
import { FlaskConical, Search } from "lucide-react";

const filters: Array<"全部" | ExperimentCategory> = [
  "全部",
  "产品海报",
  "角色人物",
  "工业设计",
  "网站视觉",
  "品牌战役",
  "提示词研究",
];

type ExperimentGridProps = {
  items: ExperimentEntry[];
};

export function ExperimentGrid({ items }: ExperimentGridProps) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("全部");
  const [query, setQuery] = useState("");

  const countMap = useMemo(() => {
    const map: Record<string, number> = { 全部: items.length };
    items.forEach((it) => {
      map[it.category] = (map[it.category] || 0) + 1;
    });
    return map;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchFilter = activeFilter === "全部" || item.category === activeFilter;
      const text = [
        item.title,
        item.excerpt,
        item.category,
        item.promptPreview,
        ...item.tags,
        ...item.tools,
      ]
        .join(" ")
        .toLowerCase();
      const matchQuery = text.includes(query.toLowerCase());
      return matchFilter && matchQuery;
    });
  }, [activeFilter, items, query]);

  return (
    <div className="space-y-8">
      <div className="arch-frame rounded-xl overflow-hidden">
        <div className="hud-header">
          <div className="flex items-center gap-2 text-purple-300 font-semibold">
            <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
            <span>VISUAL LAB // SHADER & PROMPT SPECIMENS</span>
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
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索实验名称、提示词、工具、风格..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/12 bg-[#04060b] text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {filters.map((filter) => {
              const isSelected = activeFilter === filter;
              const count = countMap[filter] || 0;
              return (
                <button
                  type="button"
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors duration-200 cursor-pointer border ${
                    isSelected
                      ? "text-slate-950 font-bold border-cyan-400"
                      : "bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25 hover:text-white"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="experiment-filter-pill"
                      className="absolute inset-0 rounded-lg bg-cyan-400"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{filter}</span>
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
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.04} once>
              <ExperimentCard item={item} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-xl border border-dashed border-white/15 bg-[#070b16]">
          <FlaskConical className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white">未找到符合该维度的实验记录</p>
          <p className="text-xs text-slate-400 mt-1">请尝试更换检索关键词或选择其它实验分类</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveFilter("全部");
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
