"use client";

import { useEffect, useState } from "react";
import { X, TrendingUp, TrendingDown, Target, ShieldAlert } from "lucide-react";

export interface SignalTradeRecord {
  id: number;
  pool_item_id: number;
  stock_code: string;
  stock_name: string;
  board: string;
  sector: string;
  status: "OPEN" | "CLOSED";
  buy_signal: "BUY_A" | "BUY_B";
  buy_date: string;
  buy_time: string;
  buy_price: number;
  buy_reason: string;
  stop_loss_price: number | null;
  take_profit_1: number | null;
  take_profit_2: number | null;
  peak_price: number;
  sell_signal: string | null;
  sell_date: string | null;
  sell_time: string | null;
  sell_price: number | null;
  sell_reason: string | null;
  hold_days: number;
  pnl_pct: number;
  live_price?: number;
  is_win: boolean | null;
}

interface KlineBarPoint {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  ma5: number | null;
  ma10: number | null;
  ma20: number | null;
}

interface SignalKlineModalProps {
  open: boolean;
  stockCode: string;
  stockName: string;
  onClose: () => void;
}

const SELL_LABEL_MAP: Record<string, string> = {
  HARD_STOP_LOSS: "止损卖出",
  TAKE_PROFIT_2: "目标止盈",
  TRAILING_STOP: "移动止盈",
  MA20_BREAK: "跌破MA20",
  MAX_HOLD_EXPIRED: "满10日结算",
  MANUAL_CLOSE: "手动平仓",
};

export function SignalKlineModal({ open, stockCode, stockName, onClose }: SignalKlineModalProps) {
  if (!open || !stockCode) return null;
  return <SignalKlineBody key={stockCode} stockCode={stockCode} stockName={stockName} onClose={onClose} />;
}

function SignalKlineBody({
  stockCode,
  stockName,
  onClose,
}: {
  stockCode: string;
  stockName: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [bars, setBars] = useState<KlineBarPoint[]>([]);
  const [trades, setTrades] = useState<SignalTradeRecord[]>([]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch(`/api-market/signal-trades?kline_code=${encodeURIComponent(stockCode)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("K线数据加载失败");
        const json = await res.json();
        if (!controller.signal.aborted && json.success) {
          setBars(json.bars || []);
          setTrades(json.trades || []);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "K线加载失败");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [stockCode]);

  const width = 880;
  const height = 390;
  const padL = 56;
  const padR = 24;
  const padT = 26;
  const priceH = 235;
  const volTop = 278;
  const volH = 74;
  const plotW = width - padL - padR;

  const activeTrade = trades.find((t) => t.status === "OPEN") || trades[0] || null;
  const pricesForScale = bars.flatMap((b) => [b.high, b.low]);
  if (activeTrade?.stop_loss_price) pricesForScale.push(activeTrade.stop_loss_price);
  if (activeTrade?.take_profit_2 && activeTrade.status === "OPEN") pricesForScale.push(activeTrade.take_profit_2);

  const rawMin = pricesForScale.length ? Math.min(...pricesForScale) : 0;
  const rawMax = pricesForScale.length ? Math.max(...pricesForScale) : 100;
  const margin = Math.max(0.1, (rawMax - rawMin) * 0.08);
  const minP = rawMin - margin;
  const maxP = rawMax + margin;
  const pSpan = Math.max(0.01, maxP - minP);

  const maxVol = Math.max(1, ...bars.map((b) => b.volume || 0));
  const stepX = bars.length > 0 ? plotW / bars.length : plotW;
  const candleW = Math.max(3, Math.min(11, stepX * 0.62));

  const yOfPrice = (p: number) => padT + ((maxP - p) / pSpan) * priceH;
  const xOfIdx = (idx: number) => padL + stepX * idx + stepX / 2;

  const buildMaPath = (key: "ma5" | "ma10" | "ma20") => {
    const pts: string[] = [];
    bars.forEach((b, i) => {
      const v = b[key];
      if (typeof v === "number" && Number.isFinite(v)) {
        pts.push(`${pts.length === 0 ? "M" : "L"}${xOfIdx(i).toFixed(1)},${yOfPrice(v).toFixed(1)}`);
      }
    });
    return pts.join(" ");
  };

  // 将交易买卖点映射至最近或精确 K 线柱索引
  const findBarIndexForDate = (targetDate: string) => {
    if (!bars.length || !targetDate) return -1;
    const exact = bars.findIndex((b) => b.date === targetDate);
    if (exact >= 0) return exact;
    const after = bars.findIndex((b) => b.date >= targetDate);
    return after >= 0 ? after : bars.length - 1;
  };

  const inspectIdx = hoverIdx !== null && bars[hoverIdx] ? hoverIdx : bars.length - 1;
  const inspectBar = inspectIdx >= 0 ? bars[inspectIdx] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-5xl rounded-2xl bg-[#091322] border border-cyan-500/35 text-slate-100 shadow-2xl overflow-hidden my-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-base font-bold text-white">
              {stockName} <span className="font-mono text-cyan-400">{stockCode}</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
              模拟账户日 K 线 &amp; 买卖点复盘 (MA5/10/20)
            </span>
            {activeTrade && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                  activeTrade.status === "OPEN"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : activeTrade.pnl_pct >= 0
                    ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                    : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                }`}
              >
                {activeTrade.status === "OPEN" ? "模拟持仓中" : "已结算"} ·{" "}
                {activeTrade.pnl_pct >= 0 ? "+" : ""}
                {activeTrade.pnl_pct}%
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {loading ? (
            <div className="h-[360px] flex items-center justify-center text-xs text-slate-400">
              正在拉取真实前复权日 K 线与买卖点标记...
            </div>
          ) : error ? (
            <div className="h-[260px] flex items-center justify-center text-xs text-amber-300">{error}</div>
          ) : (
            <>
              {/* 顶部十字线 OHLCV 信息条 */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-mono">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-cyan-300 font-bold">{inspectBar?.date || "--"}</span>
                  <span>开 ¥{inspectBar?.open?.toFixed(2) ?? "--"}</span>
                  <span className={inspectBar && inspectBar.close >= inspectBar.open ? "text-rose-400" : "text-emerald-400"}>
                    收 ¥{inspectBar?.close?.toFixed(2) ?? "--"}
                  </span>
                  <span>高 ¥{inspectBar?.high?.toFixed(2) ?? "--"}</span>
                  <span>低 ¥{inspectBar?.low?.toFixed(2) ?? "--"}</span>
                  <span className="text-slate-400">
                    量 {inspectBar ? `${(inspectBar.volume / 10000).toFixed(1)}万手` : "--"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-300">MA5 {inspectBar?.ma5?.toFixed(2) ?? "--"}</span>
                  <span className="text-sky-400">MA10 {inspectBar?.ma10?.toFixed(2) ?? "--"}</span>
                  <span className="text-purple-400">MA20 {inspectBar?.ma20?.toFixed(2) ?? "--"}</span>
                </div>
              </div>

              {/* SVG K线画布 */}
              <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-[#050c17] p-2">
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="w-full min-w-[660px] h-auto select-none"
                  onMouseLeave={() => setHoverIdx(null)}
                >
                  {/* 水平价格网格线 */}
                  {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                    const y = padT + priceH * t;
                    const pVal = maxP - pSpan * t;
                    return (
                      <g key={t}>
                        <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                        <text x={padL - 6} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace">
                          {pVal.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}

                  {/* 持仓中标的止损 / 目标虚线 */}
                  {activeTrade?.stop_loss_price && (
                    <g>
                      <line
                        x1={padL}
                        y1={yOfPrice(activeTrade.stop_loss_price)}
                        x2={width - padR}
                        y2={yOfPrice(activeTrade.stop_loss_price)}
                        stroke="#f59e0b"
                        strokeWidth="1"
                        strokeDasharray="5 4"
                      />
                      <text
                        x={width - padR - 4}
                        y={yOfPrice(activeTrade.stop_loss_price) - 4}
                        textAnchor="end"
                        fill="#fbbf24"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        止损/失效 ¥{activeTrade.stop_loss_price.toFixed(2)}
                      </text>
                    </g>
                  )}
                  {activeTrade?.status === "OPEN" && activeTrade.take_profit_2 && (
                    <g>
                      <line
                        x1={padL}
                        y1={yOfPrice(activeTrade.take_profit_2)}
                        x2={width - padR}
                        y2={yOfPrice(activeTrade.take_profit_2)}
                        stroke="#34d399"
                        strokeWidth="1"
                        strokeDasharray="5 4"
                      />
                      <text
                        x={width - padR - 4}
                        y={yOfPrice(activeTrade.take_profit_2) - 4}
                        textAnchor="end"
                        fill="#34d399"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        +20%目标止盈 ¥{activeTrade.take_profit_2.toFixed(2)}
                      </text>
                    </g>
                  )}

                  {/* K线蜡烛 + 成交量柱 */}
                  {bars.map((b, i) => {
                    const cx = xOfIdx(i);
                    const isUp = b.close >= b.open;
                    const color = isUp ? "#f43f5e" : "#10b981";
                    const topBody = yOfPrice(Math.max(b.open, b.close));
                    const botBody = yOfPrice(Math.min(b.open, b.close));
                    const bodyH = Math.max(1.5, botBody - topBody);
                    const vh = Math.max(2, (b.volume / maxVol) * volH);

                    return (
                      <g key={b.date}>
                        <line x1={cx} y1={yOfPrice(b.high)} x2={cx} y2={yOfPrice(b.low)} stroke={color} strokeWidth="1.2" />
                        <rect
                          x={cx - candleW / 2}
                          y={topBody}
                          width={candleW}
                          height={bodyH}
                          fill={color}
                          opacity={0.92}
                        />
                        <rect
                          x={cx - candleW / 2}
                          y={volTop + (volH - vh)}
                          width={candleW}
                          height={vh}
                          fill={color}
                          opacity={0.48}
                        />
                        {/* 透明悬停感应区 */}
                        <rect
                          x={padL + stepX * i}
                          y={padT}
                          width={stepX}
                          height={height - padT - 20}
                          fill="transparent"
                          onMouseEnter={() => setHoverIdx(i)}
                        />
                      </g>
                    );
                  })}

                  {/* MA5 / MA10 / MA20 均线 */}
                  <path d={buildMaPath("ma5")} fill="none" stroke="#fbbf24" strokeWidth="1.3" />
                  <path d={buildMaPath("ma10")} fill="none" stroke="#38bdf8" strokeWidth="1.3" />
                  <path d={buildMaPath("ma20")} fill="none" stroke="#c084fc" strokeWidth="1.4" />

                  {/* B 买点 与 S 卖点 标记 */}
                  {trades.map((tr) => {
                    const buyIdx = findBarIndexForDate(tr.buy_date);
                    const sellIdx = tr.sell_date ? findBarIndexForDate(tr.sell_date) : -1;
                    const bx = buyIdx >= 0 ? xOfIdx(buyIdx) : -1;
                    const by = yOfPrice(tr.buy_price);
                    const sx = sellIdx >= 0 && tr.sell_price ? xOfIdx(sellIdx) : -1;
                    const sy = tr.sell_price ? yOfPrice(tr.sell_price) : 0;

                    return (
                      <g key={tr.id}>
                        {bx >= 0 && (
                          <g>
                            <line x1={bx} y1={by} x2={bx} y2={Math.min(volTop - 8, by + 24)} stroke="#fb7185" strokeWidth="1.2" />
                            <circle cx={bx} cy={by} r="4.5" fill="#f43f5e" stroke="#fff" strokeWidth="1.2" />
                            <rect
                              x={bx - 38}
                              y={Math.min(volTop - 24, by + 18)}
                              width="76"
                              height="18"
                              rx="4"
                              fill="#881337"
                              stroke="#fb7185"
                              strokeWidth="1"
                            />
                            <text
                              x={bx}
                              y={Math.min(volTop - 11, by + 31)}
                              textAnchor="middle"
                              fill="#ffe4e6"
                              fontSize="10"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              B ¥{tr.buy_price.toFixed(2)}
                            </text>
                          </g>
                        )}
                        {sx >= 0 && tr.sell_price && (
                          <g>
                            {bx >= 0 && (
                              <line
                                x1={bx}
                                y1={by}
                                x2={sx}
                                y2={sy}
                                stroke={tr.pnl_pct >= 0 ? "#fb7185" : "#34d399"}
                                strokeWidth="1.3"
                                strokeDasharray="3 3"
                              />
                            )}
                            <line x1={sx} y1={sy} x2={sx} y2={Math.max(18, sy - 24)} stroke="#38bdf8" strokeWidth="1.2" />
                            <circle cx={sx} cy={sy} r="4.5" fill="#0ea5e9" stroke="#fff" strokeWidth="1.2" />
                            <rect
                              x={sx - 40}
                              y={Math.max(4, sy - 38)}
                              width="80"
                              height="18"
                              rx="4"
                              fill={tr.pnl_pct >= 0 ? "#064e3b" : "#1e293b"}
                              stroke={tr.pnl_pct >= 0 ? "#34d399" : "#94a3b8"}
                              strokeWidth="1"
                            />
                            <text
                              x={sx}
                              y={Math.max(16, sy - 25)}
                              textAnchor="middle"
                              fill="#e0f2fe"
                              fontSize="10"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              S ¥{tr.sell_price.toFixed(2)}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* 十字准星 */}
                  {hoverIdx !== null && bars[hoverIdx] && (
                    <line
                      x1={xOfIdx(hoverIdx)}
                      y1={padT}
                      x2={xOfIdx(hoverIdx)}
                      y2={volTop + volH}
                      stroke="#475569"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* X轴日期刻度 */}
                  {[0, Math.floor(bars.length / 2), bars.length - 1]
                    .filter((i, idx, arr) => i >= 0 && bars[i] && arr.indexOf(i) === idx)
                    .map((i) => (
                      <text
                        key={i}
                        x={xOfIdx(i)}
                        y={height - 6}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {bars[i].date}
                      </text>
                    ))}
                </svg>
              </div>

              {/* 该标的买卖点流水明细 */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">该标的模拟账户买卖记录（共 {trades.length} 笔）</h4>
                {!trades.length ? (
                  <p className="text-xs text-slate-500">该标的尚无已触发的模拟买卖信号。</p>
                ) : (
                  <div className="space-y-2">
                    {trades.map((tr) => (
                      <div
                        key={tr.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/75 p-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-bold">
                              买入 {tr.buy_signal}
                            </span>
                            <span className="font-mono text-white">
                              {tr.buy_date} {tr.buy_time} · ¥{tr.buy_price.toFixed(2)}
                            </span>
                            {tr.status === "CLOSED" && tr.sell_price ? (
                              <>
                                <span className="text-slate-500">→</span>
                                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono font-bold">
                                  {SELL_LABEL_MAP[tr.sell_signal || ""] || tr.sell_signal || "卖出"}
                                </span>
                                <span className="font-mono text-white">
                                  {tr.sell_date} {tr.sell_time} · ¥{tr.sell_price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px]">
                                持仓监控中 · 已持有 {tr.hold_days} 个交易日
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            买入触发：{tr.buy_reason}
                            {tr.sell_reason ? ` ｜ 卖出触发：${tr.sell_reason}` : ""}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 font-mono">
                          <div className="text-right">
                            <div
                              className={`text-sm font-extrabold flex items-center gap-1 ${
                                tr.pnl_pct >= 0 ? "text-rose-400" : "text-emerald-400"
                              }`}
                            >
                              {tr.pnl_pct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                              {tr.pnl_pct >= 0 ? `+${tr.pnl_pct.toFixed(2)}%` : `${tr.pnl_pct.toFixed(2)}%`}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 justify-end">
                              <span className="inline-flex items-center gap-0.5">
                                <ShieldAlert className="w-3 h-3 text-amber-400" /> 止损 ¥{tr.stop_loss_price?.toFixed(2) ?? "--"}
                              </span>
                              <span className="inline-flex items-center gap-0.5">
                                <Target className="w-3 h-3 text-emerald-400" /> 止盈 ¥{tr.take_profit_2?.toFixed(2) ?? "--"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
