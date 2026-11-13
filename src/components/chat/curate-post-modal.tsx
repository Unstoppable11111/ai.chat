"use client";

import { useState } from "react";
import { BookOpen, Check, Loader2, Sparkles, X, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface CuratePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle: string;
  assistantContent: string;
}

export function CuratePostModal({
  isOpen,
  onClose,
  defaultTitle,
  assistantContent,
}: CuratePostModalProps) {
  const [title, setTitle] = useState(defaultTitle || "对话沉淀：前沿技术研报");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState("AI研报, 贾维斯沉淀, 技术白皮书");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCurate = async () => {
    setLoading(true);
    setError(null);

    try {
      const tagList = tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
      const res = await fetch("/api/curate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: `基于贾维斯深度对话沉淀的前沿技术研报：${title.trim()}`,
          tags: tagList,
          content: `## 核心议题背景\n\n本文基于与贾维斯 AI 助手的深度研讨，聚焦于：**${title.trim()}**。\n\n## 深度推导与核心阐述\n\n${assistantContent.trim()}\n\n## 生产实践建议\n\n在将上述方案投入生产环境时，建议进行灰度放量并密切监控延迟与准确率指标。\n`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "沉淀失败");

      setResult({ url: data.url, title: title.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">沉淀为技术白皮书</h3>
            <p className="text-[11px] text-muted-foreground">将此条优质对话转化为站内正式白皮书并接入 RAG 知识库</p>
          </div>
        </div>

        {result ? (
          <div className="space-y-4 py-3">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-xs">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <Check className="w-4 h-4 text-emerald-600" />
                成功归档并切块注入 RAG 引擎！
              </p>
              <p className="text-emerald-700">文章已在站内技术白皮书模块正式发布，随时可供所有人查阅与语义索引。</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                关闭
              </button>
              <Link
                href={result.url}
                target="_blank"
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-medium hover:bg-cyan-500 transition-colors shadow-xs"
              >
                <span>前往查看文章</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                {error}
              </p>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">文章标题</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：KV Cache 动态压缩工程实战"
                className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">自定义 URL Slug（可选）</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="例如：kv-cache-compression-guide"
                className="w-full text-xs font-mono rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">文章标签（逗号隔开）</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="AI对话, 架构分析, 性能优化"
                className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCurate}
                disabled={loading || !title.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>确认沉淀为白皮书</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
