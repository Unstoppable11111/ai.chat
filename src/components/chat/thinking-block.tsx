'use client';

import { useState } from 'react';
import { Brain, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThinkingBlockProps {
  reasoningContent?: string;
  isThinking?: boolean;
  className?: string;
}

export function ThinkingBlock({
  reasoningContent,
  isThinking = false,
  className,
}: ThinkingBlockProps) {
  const [userCollapsed, setUserCollapsed] = useState(false);
  const isExpanded = isThinking ? true : !userCollapsed;

  if (!reasoningContent && !isThinking) {
    return null;
  }

  return (
    <div
      className={cn(
        'mb-3 overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50/80 text-xs shadow-xs transition-all dark:border-zinc-700/60 dark:bg-zinc-800/60',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setUserCollapsed((prev) => !prev)}
        className="flex w-full cursor-pointer select-none items-center justify-between px-3.5 py-2.5 text-left text-slate-600 transition-colors hover:bg-slate-100/70 dark:text-slate-300 dark:hover:bg-zinc-700/40"
      >
        <div className="flex items-center gap-2">
          {isThinking ? (
            <div className="flex items-center gap-1.5 text-brand-cyan font-medium">
              <Brain className="h-4 w-4 animate-pulse shrink-0" />
              <span className="animate-pulse">正在深度思考中...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300 font-medium">
              <Brain className="h-4 w-4 text-brand-cyan/80 shrink-0" />
              <span>已完成深度思考</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-zinc-500">
          <span>{isExpanded ? '收起' : '展开'}</span>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-200',
              !isExpanded && '-rotate-90'
            )}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-200/60 px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-600 dark:border-zinc-700/50 dark:text-slate-300">
          {reasoningContent ? (
            <div className="max-h-[360px] overflow-y-auto whitespace-pre-wrap font-mono text-[12.5px] select-text">
              {reasoningContent}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-ping" />
              <span>思考组织中...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
