"use client";

import { useState } from "react";
import Link from "next/link";
import { Terminal, Copy, Check, Code2, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SnippetItem {
  id: string;
  title: string;
  category: string;
  tag: string;
  code: string;
  language: string;
  relatedSlug: string;
  note: string;
}

const SNIPPETS: SnippetItem[] = [
  {
    id: "snip-1",
    title: "FlashAttention 在线分块 Softmax 递推",
    category: "算子加速",
    tag: "CUDA/Math",
    language: "ts",
    relatedSlug: "flashattention-3-hopper-tma-acceleration",
    note: "避免保存庞大 N×N 注意力矩阵，利用局部最大值在常数显存下在线合并",
    code: `const mNew = Math.max(mPrev, mBlock);
const dNew = dPrev * Math.exp(mPrev - mNew)
  + dBlock * Math.exp(mBlock - mNew);`,
  },
  {
    id: "snip-2",
    title: "RAG 倒数排名融合 (RRF) 混合打分",
    category: "向量检索",
    tag: "RAG/RRF",
    language: "ts",
    relatedSlug: "hybrid-search-bm25-dense-rerank",
    note: "融合 BM25 与 Dense 向量排名，解决量纲不一，提升稀疏与语义召回精度",
    code: `const prevScore = scoreMap.get(id) || 0;
scoreMap.set(id, prevScore + 1 / (60 + rank));`,
  },
  {
    id: "snip-3",
    title: "布林带 (Bollinger) 动态上下轨标准差",
    category: "量化投研",
    tag: "Quant/Alpha",
    language: "ts",
    relatedSlug: "ashare-quant-dual-ma-bollinger-strategy",
    note: "20 日均线叠加 2 倍标准差，顺趋势而为，逆微观波动高抛低吸",
    code: `const upper = sma20 + 2.0 * Math.sqrt(variance);
const lower = sma20 - 2.0 * Math.sqrt(variance);`,
  },
  {
    id: "snip-4",
    title: "Prompt Cache 稳定前缀静态对齐",
    category: "推理优化",
    tag: "Cache/Prefix",
    language: "ts",
    relatedSlug: "prompt-cache-hit-ratio-optimization",
    note: "静态规则与知识库前置，动态变量后置，实现 80%+ 显存 KV 状态秒级命中",
    code: `const kb = kbDocs.sort().join('\\n');
const prompt = \`SYS:\${system}\\n\\nKB:\${kb}\\n\\nQ:\${userQuery}\`;`,
  },
  {
    id: "snip-5",
    title: "WebGL GPU 粒子并行运动方程",
    category: "图形渲染",
    tag: "Three.js/GLSL",
    language: "glsl",
    relatedSlug: "webgl-instanced-particles-vertex-shader",
    note: "单次 Draw Call 实例化百万粒子，运动全量交给 GPU 顶点着色器",
    code: `vec3 pos = position;
pos.x += sin(pos.y * 3.0 + uTime) * 0.2;
gl_Position = projMatrix * mvMatrix * vec4(pos, 1.0);`,
  },
];

export function TechBento() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="container-shell py-8">
      {/* 模块标头 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-3 border-b border-slate-900/5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 text-xs font-mono font-medium mb-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-600" />
            <span>TECH BENTO // MICRO-SNIPPETS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            极客便签 · 核心微代码矩阵
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            不用长篇大论，提炼算子加速、RAG 融合、量化策略与图形学的关键代码片段。
          </p>
        </div>

        <Link
          href="/build-log"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-700 hover:text-cyan-800 transition-colors group shrink-0"
        >
          <span>查看全部 65 篇技术白皮书</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* Bento Grid 布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SNIPPETS.map((snip, index) => {
          const isCopied = copiedId === snip.id;

          return (
            <div
              key={snip.id}
              className={cn(
                "group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-sm p-4 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5",
                index === 0 && "md:col-span-2 lg:col-span-1"
              )}
            >
              <div>
                {/* 顶部标签 */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-mono font-medium text-slate-700 border border-slate-200">
                    <Code2 className="w-3 h-3 text-cyan-600" />
                    {snip.category}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    {snip.tag}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 group-hover:text-cyan-700 transition-colors leading-snug">
                  {snip.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {snip.note}
                </p>

                {/* 代码卡片 */}
                <div className="relative mt-3 rounded-xl bg-slate-950 p-3 font-mono text-[11px] text-slate-200 shadow-inner overflow-hidden">
                  <pre className="whitespace-pre-wrap break-words leading-relaxed overflow-hidden pr-6">
                    <code>{snip.code}</code>
                  </pre>
                  <button
                    type="button"
                    onClick={() => handleCopy(snip.id, snip.code)}
                    aria-label="复制代码"
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* 底部关联文章跳转 */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link
                  href={`/build-log/${snip.relatedSlug}`}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
                >
                  <span>阅读深度原理解析</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
                <span className="text-[10px] font-mono text-slate-400">RAG READY</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
