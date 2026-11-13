"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
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
      <div className="arch-frame rounded-xl overflow-hidden">
        <div className="hud-header">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold">
            <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>PROJECT REPOSITORY // ARCHIVE MATRIX</span>
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
              placeholder="搜索项目名称、技术栈、架构关键词..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/12 bg-[#04060b] text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {types.map((type) => {
              const isSelected = activeType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors duration-200 cursor-pointer border ${
                    isSelected
                      ? "text-slate-950 font-bold border-cyan-400"
                      : "bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25 hover:text-white"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="projects-filter-pill"
                      className="absolute inset-0 rounded-lg bg-cyan-400"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{type}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredItems.map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.04} once>
              <ProjectCard item={item} eager={index === 0} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-xl border border-dashed border-white/15 bg-[#070b16]">
          <Layers className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white">未找到符合条件的精选项目</p>
          <p className="text-xs text-slate-400 mt-1">请尝试更换检索关键词或重置筛选类别</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveType("全部");
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
