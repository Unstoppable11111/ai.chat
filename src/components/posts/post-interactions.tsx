"use client";

import { useEffect, useState } from "react";
import { Eye, Heart, Share2, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  postId?: number;
  slug: string;
  title: string;
  initialViews?: number;
  initialLikes?: number;
};

export function PostInteractions({
  slug,
  initialViews = 0,
  initialLikes = 0,
}: Props) {
  const [stats, setStats] = useState(() => ({
    views: initialViews,
    likes: initialLikes,
    liked:
      typeof window !== "undefined"
        ? localStorage.getItem(`studio_liked_${slug}`) === "1"
        : false,
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // 1. 初始化：向后端上报 view 统计并同步最新阅读量与点赞数
  useEffect(() => {
    let active = true;

    // 向后端上报阅读事件并同步数据库最新阅读量与点赞数
    fetch("/api-post-like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, action: "view" }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        if (active && data?.data) {
          setStats(data.data);
          // 同步本地存储状态
          if (typeof window !== "undefined") {
            if (data.data.liked) {
              localStorage.setItem(`studio_liked_${slug}`, "1");
            } else {
              localStorage.removeItem(`studio_liked_${slug}`);
            }
          }
        }
      })
      .catch(() => {
        // 静默容错，不干扰用户正常阅读
      });

    return () => {
      active = false;
    };
  }, [slug]);

  // 2. 点赞 / 取消点赞（乐观更新 + 数据库持久化）
  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError("");

    const nextLiked = !stats.liked;
    const nextLikes = Math.max(0, stats.likes + (nextLiked ? 1 : -1));

    // 乐观立即更新 UI
    setStats((prev) => ({ ...prev, liked: nextLiked, likes: nextLikes }));
    if (typeof window !== "undefined") {
      if (nextLiked) {
        localStorage.setItem(`studio_liked_${slug}`, "1");
      } else {
        localStorage.removeItem(`studio_liked_${slug}`);
      }
    }

    try {
      const response = await fetch("/api-post-like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action: nextLiked ? "like" : "unlike" }),
      });

      if (!response.ok) throw new Error();
      const result = await response.json();
      if (result?.data) {
        setStats(result.data);
      }
    } catch {
      // 若网络或后端写入失败，回退状态
      setError("点赞同步暂时受阻，已先在本地为您记录");
    } finally {
      setBusy(false);
    }
  }

  // 3. 复制分享链接
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("复制链接失败，请手动复制地址栏");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white/70 backdrop-blur-sm p-4 sm:p-5 text-sm shadow-xs transition-all">
      {/* 浏览量与获赞统计 */}
      <div className="flex items-center gap-4 text-xs sm:text-sm font-medium text-slate-700">
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          <Eye className="h-4 w-4 text-slate-400" />
          <span>{stats.views} 次阅读</span>
        </span>
        <span className="text-slate-300">|</span>
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
          <span>{stats.likes} 人赞过</span>
        </span>
      </div>

      {/* 交互按钮区 */}
      <div className="flex items-center gap-2.5">
        {/* 点赞按钮 */}
        <button
          type="button"
          disabled={busy}
          aria-pressed={stats.liked}
          onClick={toggle}
          className={cn(
            "group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border shadow-2xs active:scale-95",
            stats.liked
              ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100/80 shadow-rose-500/5"
              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
              stats.liked
                ? "fill-rose-500 text-rose-500 animate-in zoom-in-75 duration-150"
                : "text-slate-400 group-hover:text-rose-500"
            )}
          />
          <span>{stats.liked ? "已点赞" : "点赞支持"}</span>
        </button>

        {/* 分享复制按钮 */}
        <button
          type="button"
          title="复制文章链接"
          aria-label="复制文章链接"
          onClick={copyLink}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-600 animate-in zoom-in-75 duration-150" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {error && (
        <p role="status" className="w-full text-xs text-amber-600 bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-1.5">
          {error}
        </p>
      )}
    </div>
  );
}
