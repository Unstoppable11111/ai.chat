"use client";

import { useState } from "react";
import Link from "next/link";
import { Terminal, Copy, Check, Code2, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/shared/reveal";
import { SpotlightCard } from "@/components/ui/spotlight-card";

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
    <section className="container-shell py-12">
      {/* 模块标头 */}
      <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-3 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-400/40 text-xs font-mono font-medium mb-2 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>TECH BENTO // MICRO-SNIPPETS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            极客便签 · 核心微代码矩阵
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            不用长篇大论，提炼算子加速、RAG 融合、量化策略与图形学的关键代码片段。
          </p>
        </div>

        <Link
          href="/build-log"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors group shrink-0"
        >
          <span>查看全部 65 篇技术白皮书</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </Reveal>

      {/* Bento Grid 布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SNIPPETS.map((snip, index) => {
          const isCopied = copiedId === snip.id;

          return (
            <Reveal
              key={snip.id}
              delay={index * 0.06}
              className={cn(index === 0 && "md:col-span-2 lg:col-span-1")}
            >
              <SpotlightCard
                enableTilt={false}
                className="group relative flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-[#0d162b]/85 backdrop-blur-xl p-4 transition-all duration-300 hover:border-cyan-400/50 hover:shadow-[0_0_24px_rgba(0,240,255,0.2)] hover:-translate-y-0.5"
              >
                <div>
                  {/* 顶部标签 */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-cyan-950/60 text-[11px] font-mono font-medium text-cyan-300 border border-cyan-400/30">
                      <Code2 className="w-3 h-3 text-cyan-400" />
                      {snip.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {snip.tag}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors leading-snug">
                    {snip.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {snip.note}
                  </p>

                  {/* 代码卡片 */}
                  <div className="relative mt-3 rounded-xl bg-[#060a16] border border-white/10 p-3 font-mono text-[11px] text-cyan-100 shadow-inner overflow-hidden">
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
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                  <Link
                    href={`/build-log/${snip.relatedSlug}`}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <span>阅读深度原理解析</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                  <span className="text-[10px] font-mono text-slate-500">RAG READY</span>
                </div>
              </SpotlightCard>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
