"use client";
import { useEffect,useState } from "react";
type Sector={code:string;name:string;change_pct:number};
export function SentimentRadarVisual() {
  const [sectors,setSectors]=useState<Sector[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{const abort=new AbortController();fetch("/api-market/sectors",{signal:abort.signal}).then(r=>r.json()).then(data=>{if(data.success)setSectors(data.top_sectors);}).catch(()=>{}).finally(()=>{if(!abort.signal.aborted)setLoading(false);});return()=>abort.abort();},[]);
  return <section className="border-y border-cyan-900/40 py-5"><h2 className="text-base font-semibold text-white">行业涨跌幅</h2><div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">{sectors.map(item=><p key={item.code} className="text-sm text-slate-300">{item.name}<span className={`ml-3 font-mono ${item.change_pct>=0?"text-rose-400":"text-emerald-400"}`}>{item.change_pct.toFixed(2)}%</span></p>)}</div>{!sectors.length&&<p role="status" className="mt-3 text-sm text-slate-400">{loading?"正在加载":"行业行情暂不可用"}</p>}</section>;
}
