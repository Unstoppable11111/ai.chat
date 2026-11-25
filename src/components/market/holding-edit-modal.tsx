"use client";

import { useState, useEffect } from "react";
import { X, Search, ShieldCheck, AlertTriangle } from "lucide-react";

export interface HoldingEditableRecord {
  id?: number;
  code: string;
  name: string;
  quantity: number;
  available_quantity?: number;
  cost_price: number;
  hold_type: "core" | "trend" | "attack" | "trial";
  sector?: string | null;
  position_mode?: "swing_normal" | "deep_drawdown_recovery";
  entry_date?: string | null;
  support_defense_price?: number | null;
  rebound_watch_prices?: number[] | null;
  take_profit_pct_1?: number;
  take_profit_pct_2?: number;
  trailing_pullback_pct?: number;
  stop_loss_pct?: number;
  suppress_cost_stoploss?: boolean;
  thesis?: string | null;
  notes?: string;
}

interface StockSearchItem {
  code: string;
  name: string;
  current_price?: number;
  day_change_pct?: number;
}

interface HoldingEditModalProps {
  open: boolean;
  initial?: HoldingEditableRecord | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  onNotify?: (text: string, type?: "info" | "success" | "warning") => void;
}

export function HoldingEditModal({ open, initial, onClose, onSaved, onNotify }: HoldingEditModalProps) {
  const isEdit = Boolean(initial?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StockSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [code, setCode] = useState(initial?.code || "");
  const [name, setName] = useState(initial?.name || "");
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1000));
  const [availableQuantity, setAvailableQuantity] = useState(
    String(initial?.available_quantity ?? initial?.quantity ?? 1000)
  );
  const [costPrice, setCostPrice] = useState(initial?.cost_price ? String(initial.cost_price) : "");
  const [holdType, setHoldType] = useState<"core" | "trend" | "attack" | "trial">(
    initial?.hold_type || "core"
  );
  const [sector, setSector] = useState(initial?.sector || "");
  const [positionMode, setPositionMode] = useState<"swing_normal" | "deep_drawdown_recovery">(
    initial?.position_mode || "swing_normal"
  );
  const [supportDefensePrice, setSupportDefensePrice] = useState(
    initial?.support_defense_price ? String(initial.support_defense_price) : ""
  );
  const [reboundWatchPrices, setReboundWatchPrices] = useState(
    initial?.rebound_watch_prices?.length ? initial.rebound_watch_prices.join(", ") : ""
  );
  const [tp1, setTp1] = useState(String(initial?.take_profit_pct_1 ?? 15));
  const [tp2, setTp2] = useState(String(initial?.take_profit_pct_2 ?? 25));
  const [trailPb, setTrailPb] = useState(String(initial?.trailing_pullback_pct ?? 7));
  const [slPct, setSlPct] = useState(String(initial?.stop_loss_pct ?? -8));
  const [suppressSl, setSuppressSl] = useState(Boolean(initial?.suppress_cost_stoploss));
  const [thesis, setThesis] = useState(initial?.thesis || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  useEffect(() => {
    if (!searchQuery.trim() || isEdit) {
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api-market/stock-search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok && active) {
          const json = await res.json();
          setSearchResults(json.results || []);
        }
      } catch {
        // ignore
      } finally {
        if (active) setIsSearching(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, isEdit]);

  if (!open) return null;

  const handleModeSwitch = (mode: "swing_normal" | "deep_drawdown_recovery") => {
    setPositionMode(mode);
    if (mode === "deep_drawdown_recovery") {
      setSuppressSl(true);
    } else {
      setSuppressSl(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);
    try {
      const payload = {
        ...(isEdit ? { id: initial!.id } : { stock_code: code.trim() }),
        stock_name: name.trim() || code.trim(),
        quantity: Number(quantity),
        available_quantity: availableQuantity ? Number(availableQuantity) : Number(quantity),
        cost_price: Number(costPrice),
        hold_type: holdType,
        sector: sector.trim(),
        position_mode: positionMode,
        support_defense_price: supportDefensePrice.trim() ? Number(supportDefensePrice) : null,
        rebound_watch_prices: reboundWatchPrices.trim() ? reboundWatchPrices.trim() : null,
        take_profit_pct_1: Number(tp1),
        take_profit_pct_2: Number(tp2),
        trailing_pullback_pct: Number(trailPb),
        stop_loss_pct: Number(slPct),
        suppress_cost_stoploss: suppressSl,
        thesis: thesis.trim(),
        notes: notes.trim(),
      };

      const res = await fetch("/api-portfolio", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.error || "保存持仓失败");
        return;
      }
      onNotify?.(isEdit ? "持仓与波段风控参数已更新" : "新持仓已录入并开始监控", "success");
      await onSaved();
      onClose();
    } catch {
      setErrorMsg("网络异常，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold">
              {isEdit ? `编辑持仓纪律 · ${name} (${code})` : "录入实盘持仓与波段纪律"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {!isEdit && (
            <div className="relative">
              <label className="block text-slate-400 mb-1">智能搜股联想（输入代码/拼音/名称）</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value.trim()) setSearchResults([]);
                  }}
                  placeholder="例如：002436 或 兴森科技"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:border-cyan-500 outline-none"
                />
                {isSearching && (
                  <span className="absolute right-3 top-2 text-[11px] text-cyan-400">搜索中...</span>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="mt-1 rounded-lg border border-slate-700 bg-slate-950 max-h-40 overflow-y-auto divide-y divide-slate-800">
                  {searchResults.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setCode(item.code);
                        setName(item.name);
                        if (item.current_price && !costPrice) {
                          setCostPrice(String(item.current_price));
                        }
                        setSearchResults([]);
                        setSearchQuery("");
                      }}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-800 text-left cursor-pointer"
                    >
                      <span>
                        <strong className="text-white">{item.name}</strong>
                        <span className="ml-2 font-mono text-slate-400">{item.code}</span>
                      </span>
                      {item.current_price ? (
                        <span className="font-mono text-cyan-300">¥{item.current_price.toFixed(2)}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">股票代码 *</label>
              <input
                type="text"
                required
                disabled={isEdit}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6位代码"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">股票名称 *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如 兴森科技"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">成本价 (元) *</label>
              <input
                type="number"
                step="0.001"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="37.49"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">持有股数 *</label>
              <input
                type="number"
                step="100"
                required
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  if (!isEdit) setAvailableQuantity(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">可卖股数 (T+1)</label>
              <input
                type="number"
                step="100"
                value={availableQuantity}
                onChange={(e) => setAvailableQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">所属主板块</label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="如 元件 / 半导体"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">仓位角色</label>
              <select
                value={holdType}
                onChange={(e) => setHoldType(e.target.value as "core" | "trend" | "attack" | "trial")}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              >
                <option value="core">底仓核心 (Core)</option>
                <option value="trend">波段趋势 (Trend)</option>
                <option value="attack">短线主攻 (Attack)</option>
                <option value="trial">试错小仓 (Trial)</option>
              </select>
            </div>
          </div>

          {/* 持仓风控模式切换 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-200">波段风控模式</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleModeSwitch("swing_normal")}
                  className={`px-3 py-1 rounded-lg border text-xs cursor-pointer transition ${
                    positionMode === "swing_normal"
                      ? "bg-cyan-600/30 border-cyan-500 text-cyan-200 font-bold"
                      : "bg-slate-900 border-slate-700 text-slate-400"
                  }`}
                >
                  标准波段模式
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch("deep_drawdown_recovery")}
                  className={`px-3 py-1 rounded-lg border text-xs cursor-pointer transition ${
                    positionMode === "deep_drawdown_recovery"
                      ? "bg-amber-600/30 border-amber-500 text-amber-200 font-bold"
                      : "bg-slate-900 border-slate-700 text-slate-400"
                  }`}
                >
                  深套修复模式
                </button>
              </div>
            </div>

            {positionMode === "deep_drawdown_recovery" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-amber-300 mb-1">前低关键防守价 (跌破触发风控预警)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={supportDefensePrice}
                    onChange={(e) => setSupportDefensePrice(e.target.value)}
                    placeholder="如 23.30"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-amber-500/40 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-amber-300 mb-1">右侧修复观察位 (逗号分隔)</label>
                  <input
                    type="text"
                    value={reboundWatchPrices}
                    onChange={(e) => setReboundWatchPrices(e.target.value)}
                    placeholder="如 27.50, 34.45"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-amber-500/40 text-white font-mono"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-slate-400 mb-1">一档止盈 (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={tp1}
                  onChange={(e) => setTp1(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">二档止盈 (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={tp2}
                  onChange={(e) => setTp2(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">高点回撤锁利 (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={trailPb}
                  onChange={(e) => setTrailPb(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">硬止损线 (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={slPct}
                  onChange={(e) => setSlPct(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={suppressSl}
                onChange={(e) => setSuppressSl(e.target.checked)}
                className="rounded border-slate-600"
              />
              <span>深套期间屏蔽固定 -8% 成本止损刷屏（改为监控前低防守位）</span>
            </label>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">核心买入逻辑 / 修复观察重点</label>
            <textarea
              rows={2}
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              placeholder="例如：PCB与IC载板国产替代标的；重点跟踪23.30前低防守与27.50(MA20)放量站稳..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">补充备注</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="可选：券商账户或特殊记录"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
            >
              {submitting ? "保存中..." : isEdit ? "保存修改" : "确认录入"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
