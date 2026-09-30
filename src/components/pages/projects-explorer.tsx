"use client";

import { useMemo, useState } from "react";
import { Search, FolderGit2, Layers } from "lucide-react";
import { ProjectCard } from "@/components/cards/project-card";
import { Reveal } from "@/components/shared/reveal";
import type { ProjectEntry } from "@/lib/types";

type ProjectsExplorerProps = {
  items: ProjectEntry[];
};

export function ProjectsExplorer({ items }: ProjectsExplorerProps) {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<string>("全部");

  const types = useMemo(() => {
    return ["全部", ...Array.from(new Set(items.map((it) => it.type).filter(Boolean)))];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchType = activeType === "全部" || item.type === activeType;
      const text = [item.title, item.description, item.type, ...item.stack].join(" ").toLowerCase();
      const matchQuery = text.includes(query.toLowerCase());
      return matchType && matchQuery;
    });
  }, [items, activeType, query]);

  return (
    <div className="space-y-8">
      {/* 科技感项目控制台状态栏 */}
      <div className="glass-panel p-5 sm:p-6 rounded-[28px] border border-slate-900/10 shadow-[0_4px_24px_rgba(15,23,42,0.03)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-900/5">
          <div className="flex items-center gap-2 font-mono text-xs text-brand-cyan font-semibold uppercase tracking-wider">
            <FolderGit2 className="w-4 h-4 text-brand-cyan" />
            <span>PROJECT REPOSITORY // ARCHIVE MATRIX</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5 text-foreground font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>TOTAL ITEMS: {items.length}</span>
            </span>
            <span className="text-slate-300">|</span>
            <span>FILTERED: {filteredItems.length}</span>
          </div>
        </div>

        {/* 搜索框与类型胶囊 */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索项目名称、技术栈、架构关键词..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-900/10 bg-white/80 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {types.map((type) => {
              const isSelected = activeType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-sm font-semibold scale-105"
                      : "bg-white/70 border border-slate-900/8 text-muted-foreground hover:bg-white hover:text-foreground"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 项目网格 */}
      {filteredItems.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredItems.map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.05} once>
              <ProjectCard item={item} eager={index === 0} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-3xl border border-dashed border-slate-200 bg-white/40">
          <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">未找到符合条件的精选项目</p>
          <p className="text-xs text-slate-400 mt-1">请尝试更换检索关键词或重置筛选类别</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveType("全部");
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
