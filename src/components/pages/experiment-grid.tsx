"use client";

import { useMemo, useState } from "react";
import { ExperimentCard } from "@/components/cards/experiment-card";
import { Reveal } from "@/components/shared/reveal";
import type { ExperimentCategory, ExperimentEntry } from "@/lib/types";

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

  const filteredItems = useMemo(() => {
    if (activeFilter === "全部") return items;
    return items.filter((item) => item.category === activeFilter);
  }, [activeFilter, items]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        {filters.map((filter) => (
          <button
            type="button"
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-full px-4 py-2 text-sm shadow-sm ${
              activeFilter === filter
                ? "bg-foreground text-background"
                : "border border-slate-900/8 bg-white/72 text-muted-foreground hover:border-brand-cyan/22 hover:text-foreground"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item, index) => (
          <Reveal key={item.slug} delay={index * 0.04} once>
            <ExperimentCard item={item} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
