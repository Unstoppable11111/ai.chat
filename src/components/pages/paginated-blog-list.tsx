"use client";

import { useMemo, useState } from "react";
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

  // 当筛选改变时，自动将当前页重置为第一页
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const currentItems = filteredItems.slice(startIndex, startIndex + pageSize);

  return (
    <div className="w-full space-y-8">
      {/* 搜索与标签筛选栏 */}
      <div className="glass-panel p-4 sm:p-5 rounded-[24px] border border-slate-900/10 shadow-[0_4px_20px_rgba(15,23,42,0.03)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="搜索白皮书架构、算法解析、技术关键词..."
            className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-900/10 bg-white/80 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan transition-all"
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
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white font-semibold shadow-xs scale-105"
                    : "bg-white/70 border border-slate-900/8 text-muted-foreground hover:bg-white hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 列优雅现代卡片栅格 */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.04} once>
              <ModernBlogCard item={item} basePath={basePath} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-3xl border border-dashed border-slate-200 bg-white/40">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">未检索到匹配的深度白皮书</p>
          <p className="text-xs text-slate-400 mt-1">请尝试更换检索关键词或点击重置</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveTag("全部");
              setCurrentPage(1);
            }}
            className="mt-4 px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            重置筛选
          </button>
        </div>
      )}

      {/* 底部交互分页器 */}
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
