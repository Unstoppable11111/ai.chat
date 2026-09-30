"use client";

import { useMemo, useState } from "react";
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

  // 计算各分类数量
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
      {/* 科技感实验控制舱状态条 */}
      <div className="glass-panel p-5 sm:p-6 rounded-[28px] border border-slate-900/10 shadow-[0_4px_24px_rgba(15,23,42,0.03)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-900/5">
          <div className="flex items-center gap-2 font-mono text-xs text-brand-violet font-semibold uppercase tracking-wider">
            <FlaskConical className="w-4 h-4 text-brand-violet" />
            <span>VISUAL LAB // SHADER & PROMPT SPECIMENS</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5 text-foreground font-semibold">
              <span className="w-2 h-2 rounded-full bg-brand-violet animate-pulse" />
              <span>TOTAL SPECIMENS: {items.length}</span>
            </span>
            <span className="text-slate-300">|</span>
            <span>FILTERED: {filteredItems.length}</span>
          </div>
        </div>

        {/* 搜索框与分类过滤器 */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索实验名称、提示词、工具、风格..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-900/10 bg-white/80 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => {
              const isSelected = activeFilter === filter;
              const count = countMap[filter] || 0;
              return (
                <button
                  type="button"
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-sm font-semibold scale-105"
                      : "bg-white/70 border border-slate-900/8 text-muted-foreground hover:bg-white hover:text-foreground"
                  }`}
                >
                  <span>{filter}</span>
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

      {/* 实验网格 */}
      {filteredItems.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.04} once>
              <ExperimentCard item={item} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-3xl border border-dashed border-slate-200 bg-white/40">
          <FlaskConical className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">未找到符合该维度的实验记录</p>
          <p className="text-xs text-slate-400 mt-1">请尝试更换检索关键词或选择其它实验分类</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveFilter("全部");
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
