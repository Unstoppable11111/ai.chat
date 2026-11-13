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

  useEffect(() => {
    let active = true;

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
          if (typeof window !== "undefined") {
            if (data.data.liked) {
              localStorage.setItem(`studio_liked_${slug}`, "1");
            } else {
              localStorage.removeItem(`studio_liked_${slug}`);
            }
          }
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [slug]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError("");

    const nextLiked = !stats.liked;
    const nextLikes = Math.max(0, stats.likes + (nextLiked ? 1 : -1));

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
      setError("点赞同步暂时受阻，已先在本地为您记录");
    } finally {
      setBusy(false);
    }
  }

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
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#04060b]/90 p-4 sm:p-5 text-sm">
      <div className="flex items-center gap-4 text-xs sm:text-sm font-mono text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <Eye className="h-4 w-4 text-cyan-400" />
          <span>{stats.views} READS</span>
        </span>
        <span className="text-white/15">|</span>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>{stats.likes} LIKES</span>
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          disabled={busy}
          aria-pressed={stats.liked}
          onClick={toggle}
          className={cn(
            "group inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer border active:scale-95",
            stats.liked
              ? "bg-rose-950/60 border-rose-500/45 text-rose-300 hover:bg-rose-900/60"
              : "bg-white/[0.04] border-white/15 text-slate-200 hover:border-cyan-400/50 hover:text-white"
          )}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
              stats.liked ? "fill-rose-500 text-rose-500" : "text-slate-400 group-hover:text-rose-400"
            )}
          />
          <span>{stats.liked ? "已点赞" : "点赞支持"}</span>
        </button>

        <button
          type="button"
          title="复制文章链接"
          aria-label="复制文章链接"
          onClick={copyLink}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-slate-300 hover:border-cyan-400/50 hover:text-cyan-300 transition-all cursor-pointer active:scale-95"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {error && (
        <p role="status" className="w-full text-xs text-amber-300 bg-amber-950/40 border border-amber-500/35 rounded-lg px-3 py-1.5">
          {error}
        </p>
      )}
    </div>
  );
}
