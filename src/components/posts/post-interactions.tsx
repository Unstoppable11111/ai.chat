"use client";

import { useState, useEffect } from "react";
import { Eye, Heart, Share2, Check } from "lucide-react";
import { motion } from "motion/react";

interface PostInteractionsProps {
  postId?: number;
  slug: string;
  title: string;
  initialViews?: number;
  initialLikes?: number;
}

export function PostInteractions({
  postId,
  slug,
  title,
  initialViews = 0,
  initialLikes = 0,
}: PostInteractionsProps) {
  const [views] = useState<number>(initialViews);
  const [likes, setLikes] = useState<number>(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  const storageKey = postId ? `post_liked_id_${postId}` : `post_liked_${slug}`;

  useEffect(() => {
    // 读取本地点赞缓存
    if (typeof window !== "undefined") {
      const likedState = localStorage.getItem(storageKey) || localStorage.getItem(`post_liked_${slug}`);
      if (likedState === "true") {
        setHasLiked(true);
      }
    }
  }, [storageKey, slug]);

  const handleToggleLike = async () => {
    if (hasLiked) {
      // 取消点赞 (乐观更新 UI)
      setLikes((prev) => Math.max(0, prev - 1));
      setHasLiked(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(`post_liked_${slug}`);
      }

      try {
        const res = await fetch("/api-post-like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, slug, action: "unlike" }),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.likes === "number") {
            setLikes(data.likes);
          }
        }
      } catch {
        // 容错
      }
    } else {
      // 点赞 (乐观更新 UI)
      setLikes((prev) => prev + 1);
      setHasLiked(true);
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, "true");
      }

      try {
        const res = await fetch("/api-post-like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, slug, action: "like" }),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.likes === "number") {
            setLikes(data.likes);
          }
        }
      } catch {
        // 容错
      }
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-900/8 bg-slate-900/[0.02] p-5 backdrop-blur-sm">
      {/* 浏览量与数据 */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground font-mono">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-brand-cyan" />
          <span>{views !== null ? `${views} 次阅读` : "统计中..."}</span>
        </div>
        <div className="flex items-center gap-2">
          <Heart className={`h-4 w-4 ${hasLiked ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`} />
          <span>{likes !== null ? `${likes} 人赞过` : "0 人赞过"}</span>
        </div>
      </div>

      {/* 按钮组 */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={handleToggleLike}
          whileTap={{ scale: 0.94 }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition shadow-sm ${
            hasLiked
              ? "bg-rose-50 text-rose-600 border border-rose-300 hover:bg-rose-100/70"
              : "bg-white hover:bg-rose-50/60 text-foreground border border-slate-900/10 hover:border-rose-200"
          }`}
          title={hasLiked ? "取消点赞" : "点赞本文"}
        >
          <Heart className={`h-4 w-4 transition-transform ${hasLiked ? "fill-rose-500 text-rose-500 scale-110" : "text-rose-500"}`} />
          <span>{hasLiked ? "已赞" : "点赞"}</span>
        </motion.button>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-slate-900/20 hover:text-foreground shadow-sm"
          title="复制文章链接"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
          <span>{copied ? "已复制" : "分享"}</span>
        </button>
      </div>
    </div>
  );
}