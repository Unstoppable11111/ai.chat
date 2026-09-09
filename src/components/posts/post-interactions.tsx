"use client";
import { useEffect, useState } from "react";
import { Eye, Heart, Share2, Check } from "lucide-react";
type Props = { postId?:number;slug:string;title:string;initialViews?:number;initialLikes?:number };
export function PostInteractions({slug,initialViews=0,initialLikes=0}:Props) {
  const [stats,setStats]=useState({views:initialViews,likes:initialLikes,liked:false});
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[copied,setCopied]=useState(false);
  useEffect(()=>{
    let active=true;
    fetch("/api-post-like",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug,action:"view"})}).then(async response=>{if(!response.ok)throw new Error();return response.json();}).then(data=>{if(active)setStats(data.data);}).catch(()=>{if(active)setError("统计暂不可用");});
    return()=>{active=false;};
  },[slug]);
  async function toggle() {
    if(busy)return;setBusy(true);setError("");
    try { const response=await fetch("/api-post-like",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug,action:stats.liked?"unlike":"like"})});if(!response.ok)throw new Error();setStats((await response.json()).data); }
    catch {setError("点赞未保存，请重试");}finally{setBusy(false);}
  }
  return <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-5 text-sm">
    <div className="flex items-center gap-4"><span className="inline-flex items-center gap-2"><Eye className="h-4 w-4"/>{stats.views} 次阅读</span><span>{stats.likes} 人赞过</span></div>
    <div className="flex items-center gap-3"><button type="button" disabled={busy} aria-pressed={stats.liked} onClick={toggle} className="inline-flex items-center gap-2"><Heart className={`h-4 w-4 ${stats.liked?"fill-rose-500 text-rose-500":""}`}/>{stats.liked?"已赞":"点赞"}</button><button type="button" title="复制文章链接" aria-label="复制文章链接" onClick={async()=>{try{await navigator.clipboard.writeText(location.href);setCopied(true);}catch{setError("复制失败");}}}>{copied?<Check className="h-4 w-4"/>:<Share2 className="h-4 w-4"/>}</button></div>
    {error&&<p role="status" className="w-full text-xs text-muted-foreground">{error}</p>}
  </div>;
}
