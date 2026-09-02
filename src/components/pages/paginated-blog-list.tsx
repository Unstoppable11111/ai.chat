"use client";

import { useState } from "react";
import { ModernBlogCard } from "@/components/cards/modern-blog-card";
import { Pagination } from "@/components/shared/pagination";
import { Reveal } from "@/components/shared/reveal";
import type { BuildLogEntry } from "@/lib/types";

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

  const totalPages = Math.ceil(items.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentItems = items.slice(startIndex, startIndex + pageSize);

  return (
    <div className="w-full">
      {/* 3 列优雅现代卡片栅格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentItems.map((item, index) => (
          <Reveal key={item.slug} delay={index * 0.04} once>
            <ModernBlogCard item={item} basePath={basePath} />
          </Reveal>
        ))}
      </div>

      {/* 底部交互分页器 */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
