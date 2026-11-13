"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ModernBlogCard } from "@/components/cards/modern-blog-card";
import { Pagination } from "@/components/shared/pagination";
import { Reveal } from "@/components/shared/reveal";
import type { BuildLogEntry } from "@/lib/types";
import { Search, BookOpen } from "lucide-react";

interface PaginatedBlogListProps {
  items: BuildLogEntry[];
  pageSize?: number;
  basePath?: string;
}

export function PaginatedBlogList({
  items,
  pageSize = 6,
  basePath = "/build-log",
}: PaginatedBlogListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("全部");

  const tags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      it.tags?.forEach((t) => set.add(t));
    });
    return ["全部", ...Array.from(set).slice(0, 8)];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchTag = activeTag === "全部" || item.tags?.includes(activeTag);
      const text = [item.title, item.excerpt, ...(item.tags || [])].join(" ").toLowerCase();
      const matchQuery = text.includes(query.toLowerCase());
      return matchTag && matchQuery;
    });
  }, [items, activeTag, query]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const currentItems = filteredItems.slice(startIndex, startIndex + pageSize);

  return (
    <div className="w-full space-y-8">
      <div className="arch-frame rounded-xl overflow-hidden">
        <div className="hud-header">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>CORPUS INDEX // RAG DOCUMENTS</span>
          </div>
          <span>MATCHED: {filteredItems.length}</span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="搜索白皮书架构、算法解析、技术关键词..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/12 bg-[#04060b] text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {tags.map((tag) => {
              const isSelected = activeTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setActiveTag(tag);
                    setCurrentPage(1);
                  }}
                  className={`relative px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                    isSelected
                      ? "text-slate-950 font-bold border-cyan-400"
                      : "bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25 hover:text-white"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="blog-tag-pill"
                      className="absolute inset-0 rounded-lg bg-cyan-400"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tag}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.04} once>
              <ModernBlogCard item={item} basePath={basePath} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-xl border border-dashed border-white/15 bg-[#070b16]">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white">未检索到匹配的深度白皮书</p>
          <p className="text-xs text-slate-400 mt-1">请尝试更换检索关键词或点击重置</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveTag("全部");
              setCurrentPage(1);
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 transition-colors cursor-pointer"
          >
            重置筛选
          </button>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
