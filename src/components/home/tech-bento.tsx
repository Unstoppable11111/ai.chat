"use client";

import { useState } from "react";
import Link from "next/link";
import { Terminal, Copy, Check, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/shared/reveal";

interface SnippetItem {
  id: string;
  codeIndex: string;
  title: string;
  category: string;
  tag: string;
  code: string;
  relatedSlug: string;
  note: string;
}

const SNIPPETS: SnippetItem[] = [
  {
    id: "snip-1",
    codeIndex: "ALG_01",
    title: "FlashAttention 在线分块 Softmax 递推",
    category: "算子加速",
    tag: "CUDA // MATH",
    relatedSlug: "flashattention-3-hopper-tma-acceleration",
    note: "避免保存庞大 N×N 注意力矩阵，利用局部最大值在常数显存下在线合并。",
    code: `const mNew = Math.max(mPrev, mBlock);
const dNew = dPrev * Math.exp(mPrev - mNew)
  + dBlock * Math.exp(mBlock - mNew);`,
  },
  {
    id: "snip-2",
    codeIndex: "ALG_02",
    title: "RAG 倒数排名融合 (RRF) 混合打分",
    category: "向量检索",
    tag: "RAG // RRF",
    relatedSlug: "hybrid-search-bm25-dense-rerank",
    note: "融合 BM25 与 Dense 向量排名，解决量纲不一，提升稀疏与语义召回精度。",
    code: `const prevScore = scoreMap.get(id) || 0;
scoreMap.set(id, prevScore + 1 / (60 + rank));`,
  },
  {
    id: "snip-3",
    codeIndex: "ALG_03",
    title: "布林带 (Bollinger) 动态上下轨标准差",
    category: "量化投研",
    tag: "QUANT // ALPHA",
    relatedSlug: "ashare-quant-dual-ma-bollinger-strategy",
    note: "20 日均线叠加 2 倍标准差，顺趋势而为，逆微观波动高抛低吸。",
    code: `const upper = sma20 + 2.0 * Math.sqrt(variance);
const lower = sma20 - 2.0 * Math.sqrt(variance);`,
  },
  {
    id: "snip-4",
    codeIndex: "ALG_04",
    title: "Prompt Cache 稳定前缀静态对齐",
    category: "推理优化",
    tag: "KV // CACHE",
    relatedSlug: "prompt-cache-hit-ratio-optimization",
    note: "静态规则与知识库前置，动态变量后置，实现 80%+ 显存 KV 状态秒级命中。",
    code: `const kb = kbDocs.sort().join('\\n');
const prompt = \`SYS:\${system}\\n\\nKB:\${kb}\\n\\nQ:\${userQuery}\`;`,
  },
  {
    id: "snip-5",
    codeIndex: "ALG_05",
    title: "WebGL GPU 粒子并行运动方程",
    category: "图形渲染",
    tag: "GLSL // SHADER",
    relatedSlug: "webgl-instanced-particles-vertex-shader",
    note: "单次 Draw Call 实例化百万粒子，运动全量交给 GPU 顶点着色器。",
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
    <section className="studio-section bg-[#04060b]">
      <div className="container-shell">
        <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-5 border-b border-white/10">
          <div>
            <div className="tech-tag mb-2.5">
              <Terminal className="w-3 h-3 text-cyan-400" />
              <span>SEC_06 // ALGORITHM BLUEPRINTS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              极客便签 · 核心微代码矩阵
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
              提炼算子加速、RAG 融合、量化策略与图形学的关键核心代码公式，直链背后深度白皮书。
            </p>
          </div>

          <Link
            href="/build-log"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.03] px-3.5 py-2 text-xs font-mono text-cyan-300 hover:border-cyan-400/50 transition-colors shrink-0"
          >
            <span>VIEW 65+ WHITEPAPERS</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SNIPPETS.map((snip, index) => {
            const isCopied = copiedId === snip.id;

            return (
              <Reveal
                key={snip.id}
                delay={index * 0.05}
                className={cn(index === 0 && "lg:col-span-2")}
              >
                <div className="arch-frame group flex h-full flex-col justify-between rounded-xl overflow-hidden">
                  <div className="hud-header">
                    <span className="text-cyan-300">
                      {`${snip.codeIndex} // ${snip.category}`}
                    </span>
                    <span>{snip.tag}</span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors">
                        {snip.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{snip.note}</p>

                      <div className="relative mt-4 rounded-lg bg-[#04060b] border border-white/10 p-3.5 font-mono text-[11px] text-cyan-100 overflow-hidden">
                        <pre className="whitespace-pre-wrap break-words leading-relaxed pr-8">
                          <code>{snip.code}</code>
                        </pre>
                        <button
                          type="button"
                          onClick={() => handleCopy(snip.id, snip.code)}
                          aria-label="复制代码"
                          className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded border border-white/10 bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-400/40 text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
                      <Link
                        href={`/build-log/${snip.relatedSlug}`}
                        className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-cyan-300 hover:text-white transition-colors"
                      >
                        <span>READ FULL PAPER</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                      <span className="font-mono text-[10px] text-emerald-400">RAG INDEXED</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
