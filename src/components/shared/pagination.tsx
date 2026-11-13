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
    <div className="mt-12 flex items-center justify-center gap-2 font-mono">
      <button
        type="button"
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 bg-[#070b16] text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-300 disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
        title="上一页"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-1.5">
        {renderPageNumbers().map((p, idx) => {
          if (p === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="inline-flex h-10 w-8 items-center justify-center text-sm text-slate-500"
              >
                ...
              </span>
            );
          }

          const pageNum = p as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              type="button"
              key={pageNum}
              onClick={() => handlePageClick(pageNum)}
              className={`inline-flex h-10 min-w-[40px] px-3 items-center justify-center rounded-lg text-xs font-bold transition cursor-pointer ${
                isActive
                  ? "bg-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(0,240,255,0.28)]"
                  : "border border-white/10 bg-[#070b16] text-slate-300 hover:border-cyan-400/40 hover:text-white"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 bg-[#070b16] text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-300 disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
        title="下一页"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
