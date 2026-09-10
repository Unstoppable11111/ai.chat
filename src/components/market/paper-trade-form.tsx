"use client";
import { useRef, useState, useEffect } from "react";
import type { StrategyType } from "@/lib/quant-arena/types";

interface StockSearchItem {
  code: string;
  name: string;
  current_price?: number | null;
  day_change_pct?: number | null;
  market?: string;
}

export function PaperTradeForm({strategy,onSaved}:{strategy:StrategyType;onSaved:()=>Promise<void>}) {
  const [side,setSide]=useState("BUY");
  const [code,setCode]=useState("");
  const [stockName,setStockName]=useState("");
  const [quantity,setQuantity]=useState("100");
  const [price,setPrice]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [searchResults, setSearchResults] = useState<StockSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const pending=useRef<{signature:string;key:string}|null>(null);
  const control="mt-1 w-full rounded-lg border border-cyan-900/50 bg-[#091322] px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400";

  // 智能股票模糊联想（支持中文/拼音/代码）
  useEffect(() => {
    const q = code.trim();
    if (!q || q.length < 2) {
      const resetTimer = setTimeout(() => setSearchResults([]), 0);
      return () => clearTimeout(resetTimer);
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api-market/stock-search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.items) setSearchResults(json.items);
        }
      } catch {
        // 搜索降级
      } finally {
        setIsSearching(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [code]);

  const handleSelectStock = (item: StockSearchItem) => {
    setCode(item.code);
    setStockName(item.name);
    if (item.current_price && item.current_price > 0) {
      setPrice(String(item.current_price.toFixed(2)));
    }
    setSearchResults([]);
  };

  return <form className="border-y border-cyan-900/40 py-5" onSubmit={async event=>{
    event.preventDefault();if(busy)return;setBusy(true);setMessage("");
    const cleanCode = code.trim().slice(0, 6);
    if (!/^\d{6}$/.test(cleanCode)) {
      setMessage("请输入或从下拉列表中选择 6 位数字股票标的");
      setBusy(false);
      return;
    }
    const data={action:"trade",strategy,side,code:cleanCode,quantity:Number(quantity),price:Number(price)};
    const signature=JSON.stringify(data);if(pending.current?.signature!==signature)pending.current={signature,key:crypto.randomUUID()};
    try {const response=await fetch("/api-market/arena",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...data,requestKey:pending.current.key})});const result=await response.json();if(!response.ok)throw new Error(result.error||"保存失败");pending.current=null;setMessage("模拟记录已保存");await onSaved();}
    catch(error){setMessage(error instanceof Error?error.message:"保存失败");}finally{setBusy(false);}
  }}>
    <h3 className="text-base font-semibold text-white">记录模拟交易 · {{aggressive:"进取账户",balanced:"均衡账户",conservative:"稳健账户"}[strategy]}</h3>
    <p className="mt-2 text-xs leading-6 text-slate-400">手动参考价记账，不连接券商。实验预设：佣金 0.025%（最低 5 元）、卖出税费 0.05%、双向滑点 0.02%。当日新增仓位不可卖出。</p>
    <div className="mt-4 grid gap-3 text-xs text-slate-300 sm:grid-cols-4">
      <label>方向
        <select className={control} value={side} onChange={e=>setSide(e.target.value)}>
          <option value="BUY">买入</option>
          <option value="SELL">卖出</option>
        </select>
      </label>
      
      <div className="relative">
        <label>标的股票（支持代码 / 中文 / 拼音）
          <div className="relative">
            <input 
              className={control} 
              value={code} 
              onChange={e=>{
                setCode(e.target.value);
                setStockName("");
              }} 
              placeholder="如 600584 / 长电科技 / CDKJ"
              required 
              maxLength={20}
            />
            {isSearching && <span className="absolute right-2.5 top-3 text-[10px] text-cyan-400 animate-pulse">检索中...</span>}
          </div>
        </label>
        {stockName && <span className="text-[11px] text-cyan-400 block mt-0.5">已选：{stockName} ({code})</span>}
        
        {/* 智能检索下拉悬浮框 */}
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-cyan-800/80 bg-[#091424] shadow-2xl overflow-hidden divide-y divide-cyan-900/40 max-h-48 overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelectStock(item)}
                className="w-full text-left px-3 py-2 hover:bg-cyan-950/60 transition-colors flex items-center justify-between text-xs cursor-pointer text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400 font-bold">{item.code}</span>
                  <span className="text-white font-medium">{item.name}</span>
                  {item.market && <span className="text-[10px] text-slate-400">({item.market})</span>}
                </div>
                {item.current_price ? (
                  <div className="font-mono text-right">
                    <span className="text-white font-semibold">¥{item.current_price.toFixed(2)}</span>
                    {item.day_change_pct != null && (
                      <span className={`ml-1.5 text-[10px] ${item.day_change_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {item.day_change_pct >= 0 ? "+" : ""}{item.day_change_pct.toFixed(2)}%
                      </span>
                    )}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>

      <label>数量（股）
        <input className={control} type="number" min="1" step="100" value={quantity} onChange={e=>setQuantity(e.target.value)} required/>
      </label>
      
      <label>参考价（元）
        <input className={control} type="number" min="0.01" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} placeholder="输入或选股自动回填" required/>
      </label>
    </div>
    <button type="submit" disabled={busy} className="mt-4 rounded-lg bg-cyan-800 hover:bg-cyan-700 px-4 py-2 text-sm text-white font-medium disabled:opacity-50 transition-colors cursor-pointer">{busy?"正在保存":"保存模拟记录"}</button>
    {message&&<p role="status" className="mt-3 text-sm text-slate-300">{message}</p>}
  </form>;
}

