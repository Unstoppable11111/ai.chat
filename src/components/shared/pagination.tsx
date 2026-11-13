"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageClick = (page: number) => {
    onPageChange(page);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 100, behavior: "smooth" });
    }
  };

  return (
    <div className="mt-12 flex items-center justify-center gap-2">
      {/* 上一页 */}
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-900/10 bg-white/80 text-foreground transition shadow-sm hover:bg-white hover:border-slate-900/20 disabled:pointer-events-none disabled:opacity-30"
        title="上一页"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* 页码 */}
      <div className="flex items-center gap-1.5">
        {renderPageNumbers().map((p, idx) => {
          if (p === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="inline-flex h-10 w-8 items-center justify-center text-sm text-muted-foreground"
              >
                ...
              </span>
            );
          }

          const pageNum = p as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              onClick={() => handlePageClick(pageNum)}
              className={`inline-flex h-10 min-w-[40px] px-3 items-center justify-center rounded-xl text-sm font-medium transition shadow-sm ${
                isActive
                  ? "bg-slate-900 text-white shadow-slate-900/20 shadow-md font-semibold"
                  : "border border-slate-900/8 bg-white/80 text-foreground hover:bg-white hover:border-slate-900/20"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* 下一页 */}
      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-900/10 bg-white/80 text-foreground transition shadow-sm hover:bg-white hover:border-slate-900/20 disabled:pointer-events-none disabled:opacity-30"
        title="下一页"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
