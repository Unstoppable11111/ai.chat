"use client";
import { useRef,useState } from "react";
import type { StrategyType } from "@/lib/quant-arena/types";
export function PaperTradeForm({strategy,onSaved}:{strategy:StrategyType;onSaved:()=>Promise<void>}) {
  const [side,setSide]=useState("BUY"),[code,setCode]=useState(""),[quantity,setQuantity]=useState("100"),[price,setPrice]=useState("");
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const pending=useRef<{signature:string;key:string}|null>(null);
  const control="mt-1 w-full rounded-lg border border-cyan-900/50 bg-[#091322] px-3 py-2 text-white";
  return <form className="border-y border-cyan-900/40 py-5" onSubmit={async event=>{
    event.preventDefault();if(busy)return;setBusy(true);setMessage("");
    const data={action:"trade",strategy,side,code,quantity:Number(quantity),price:Number(price)};
    const signature=JSON.stringify(data);if(pending.current?.signature!==signature)pending.current={signature,key:crypto.randomUUID()};
    try {const response=await fetch("/api-market/arena",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...data,requestKey:pending.current.key})});const result=await response.json();if(!response.ok)throw new Error(result.error||"保存失败");pending.current=null;setMessage("模拟记录已保存");await onSaved();}
    catch(error){setMessage(error instanceof Error?error.message:"保存失败");}finally{setBusy(false);}
  }}>
    <h3 className="text-base font-semibold text-white">记录模拟交易 · {{aggressive:"进取账户",balanced:"均衡账户",conservative:"稳健账户"}[strategy]}</h3>
    <p className="mt-2 text-xs leading-6 text-slate-400">手动参考价记账，不连接券商。实验预设：佣金 0.025%（最低 5 元）、卖出税费 0.05%、双向滑点 0.02%。当日新增仓位不可卖出。</p>
    <div className="mt-4 grid gap-3 text-xs text-slate-300 sm:grid-cols-4"><label>方向<select className={control} value={side} onChange={e=>setSide(e.target.value)}><option value="BUY">买入</option><option value="SELL">卖出</option></select></label><label>证券代码<input className={control} value={code} onChange={e=>setCode(e.target.value)} required pattern="[0-9]{6}" inputMode="numeric" maxLength={6}/></label><label>数量<input className={control} type="number" min="1" step="1" value={quantity} onChange={e=>setQuantity(e.target.value)} required/></label><label>参考价（手动录入）<input className={control} type="number" min="0.01" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} required/></label></div>
    <button type="submit" disabled={busy} className="mt-4 rounded-lg bg-cyan-800 px-4 py-2 text-sm text-white disabled:opacity-50">{busy?"正在保存":"保存模拟记录"}</button>
    {message&&<p role="status" className="mt-3 text-sm text-slate-300">{message}</p>}
  </form>;
}
