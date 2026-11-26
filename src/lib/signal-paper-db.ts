import { executeQuery, executeRawDdl, executeWrite, getDbPool } from "@/lib/db";
import {
  computeStockTechnicals,
  evaluateSignalPaperExit,
  type DailyKlineBar,
  type StockTechnicals,
  type SwingLiveQuote,
} from "@/lib/quant-arena/swing-rules";
import { listUserRollingPool, type RollingPoolItem } from "@/lib/rolling-pool-db";
import { getShanghaiDateStr, getShanghaiParts } from "@/lib/trading-hours";

export type SignalPaperStatus = "OPEN" | "CLOSED";

export interface SignalPaperTrade {
  id: number;
  user_id: string;
  pool_item_id: number;
  stock_code: string;
  stock_name: string;
  board: string;
  sector: string;
  status: SignalPaperStatus;
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
  is_win: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface SignalWinRateStats {
  total_trades: number;
  open_count: number;
  closed_count: number;
  win_count: number;
  loss_count: number;
  win_rate_pct: number;
  avg_pnl_pct: number;
  open_avg_pnl_pct: number;
  profit_factor: number | null;
  cumulative_return_pct: number;
  buy_a_stats: { total: number; closed: number; wins: number; win_rate_pct: number; avg_pnl_pct: number };
  buy_b_stats: { total: number; closed: number; wins: number; win_rate_pct: number; avg_pnl_pct: number };
  equity_curve: Array<{ label: string; equity: number; pnl_pct: number; code: string; name: string }>;
}

let signalTableReadyPromise: Promise<void> | null = null;

export async function ensureSignalPaperTable(): Promise<void> {
  if (!getDbPool()) return;
  if (signalTableReadyPromise) return signalTableReadyPromise;

  signalTableReadyPromise = (async () => {
    try {
      await executeRawDdl(
        `CREATE TABLE IF NOT EXISTS stock_signal_trades (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL,
          pool_item_id BIGINT UNSIGNED NOT NULL,
          stock_code VARCHAR(16) NOT NULL,
          stock_name VARCHAR(64) NOT NULL,
          board VARCHAR(32) NOT NULL,
          sector VARCHAR(64) NOT NULL,
          status VARCHAR(16) NOT NULL DEFAULT 'OPEN',
          buy_signal VARCHAR(24) NOT NULL,
          buy_date DATE NOT NULL,
          buy_time VARCHAR(20) NOT NULL,
          buy_price DECIMAL(16,3) NOT NULL,
          buy_reason VARCHAR(255) NOT NULL,
          stop_loss_price DECIMAL(16,3) NULL,
          take_profit_1 DECIMAL(16,3) NULL,
          take_profit_2 DECIMAL(16,3) NULL,
          peak_price DECIMAL(16,3) NOT NULL,
          sell_signal VARCHAR(32) NULL,
          sell_date DATE NULL,
          sell_time VARCHAR(20) NULL,
          sell_price DECIMAL(16,3) NULL,
          sell_reason VARCHAR(255) NULL,
          hold_days INT NOT NULL DEFAULT 0,
          pnl_pct DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          is_win TINYINT(1) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_user_pool(user_id, pool_item_id),
          INDEX idx_user_status(user_id, status),
          INDEX idx_user_code(user_id, stock_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      );
      await executeRawDdl(
        "ALTER TABLE stock_signal_trades CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
      ).catch(() => {});
    } catch (err) {
      signalTableReadyPromise = null;
      throw err;
    }
  })();

  return signalTableReadyPromise;
}

function formatLocalDate(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(val).slice(0, 10);
}

interface RawSignalTradeRow {
  id: number;
  user_id: string;
  pool_item_id: number;
  stock_code: string;
  stock_name: string;
  board: string;
  sector: string;
  status: string;
  buy_signal: string;
  buy_date: unknown;
  buy_time: string;
  buy_price: number;
  buy_reason: string;
  stop_loss_price: number | null;
  take_profit_1: number | null;
  take_profit_2: number | null;
  peak_price: number;
  sell_signal: string | null;
  sell_date: unknown;
  sell_time: string | null;
  sell_price: number | null;
  sell_reason: string | null;
  hold_days: number;
  pnl_pct: number;
  is_win: number | boolean | null;
  created_at?: string;
  updated_at?: string;
}

function normalizeTradeRow(r: RawSignalTradeRow): SignalPaperTrade {
  return {
    id: Number(r.id),
    user_id: r.user_id,
    pool_item_id: Number(r.pool_item_id),
    stock_code: r.stock_code,
    stock_name: r.stock_name,
    board: r.board,
    sector: r.sector,
    status: r.status === "CLOSED" ? "CLOSED" : "OPEN",
    buy_signal: r.buy_signal === "BUY_B" ? "BUY_B" : "BUY_A",
    buy_date: formatLocalDate(r.buy_date),
    buy_time: r.buy_time || "09:35",
    buy_price: Number(r.buy_price) || 0,
    buy_reason: r.buy_reason || "",
    stop_loss_price: r.stop_loss_price !== null ? Number(r.stop_loss_price) : null,
    take_profit_1: r.take_profit_1 !== null ? Number(r.take_profit_1) : null,
    take_profit_2: r.take_profit_2 !== null ? Number(r.take_profit_2) : null,
    peak_price: Number(r.peak_price) || Number(r.buy_price) || 0,
    sell_signal: r.sell_signal || null,
    sell_date: r.sell_date ? formatLocalDate(r.sell_date) : null,
    sell_time: r.sell_time || null,
    sell_price: r.sell_price !== null ? Number(r.sell_price) : null,
    sell_reason: r.sell_reason || null,
    hold_days: Number(r.hold_days) || 0,
    pnl_pct: Number(r.pnl_pct) || 0,
    is_win: r.is_win === null || r.is_win === undefined ? null : Boolean(r.is_win),
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export async function listUserSignalTrades(
  userId: string,
  stockCode?: string
): Promise<SignalPaperTrade[]> {
  if (!getDbPool()) return [];
  await ensureSignalPaperTable();

  const where = stockCode ? "WHERE user_id = ? AND stock_code = ?" : "WHERE user_id = ?";
  const params = stockCode ? [userId, stockCode] : [userId];

  const rows = await executeQuery<RawSignalTradeRow>(
    `SELECT id, user_id, pool_item_id, stock_code, stock_name, board, sector,
            status, buy_signal, buy_date, buy_time,
            CAST(buy_price AS DOUBLE) AS buy_price, buy_reason,
            CAST(stop_loss_price AS DOUBLE) AS stop_loss_price,
            CAST(take_profit_1 AS DOUBLE) AS take_profit_1,
            CAST(take_profit_2 AS DOUBLE) AS take_profit_2,
            CAST(peak_price AS DOUBLE) AS peak_price,
            sell_signal, sell_date, sell_time,
            CAST(sell_price AS DOUBLE) AS sell_price, sell_reason,
            hold_days, CAST(pnl_pct AS DOUBLE) AS pnl_pct, is_win,
            created_at, updated_at
     FROM stock_signal_trades
     ${where}
     ORDER BY CASE WHEN status = 'OPEN' THEN 0 ELSE 1 END ASC, id DESC
     LIMIT 200`,
    params
  );
  return (rows || []).map(normalizeTradeRow);
}

export async function openSignalPaperTrade(input: {
  userId: string;
  poolItem: Pick<RollingPoolItem, "id" | "stock_code" | "stock_name" | "board" | "sector" | "invalid_price">;
  buySignal: "BUY_A" | "BUY_B";
  buyPrice: number;
  buyReason: string;
  buyDate?: string;
  buyTime?: string;
}): Promise<boolean> {
  if (!getDbPool() || input.buyPrice <= 0) return false;
  await ensureSignalPaperTable();

  const { dateStr, hhmm } = getShanghaiParts();
  const buyDate = input.buyDate || dateStr;
  const buyTime = input.buyTime || `${hhmm}`;
  const defaultSl = Number((input.buyPrice * 0.92).toFixed(2));
  const sl =
    input.poolItem.invalid_price && input.poolItem.invalid_price > 0
      ? Math.max(input.poolItem.invalid_price, defaultSl)
      : defaultSl;
  const tp1 = Number((input.buyPrice * 1.1).toFixed(2));
  const tp2 = Number((input.buyPrice * 1.2).toFixed(2));

  const res = await executeWrite(
    `INSERT IGNORE INTO stock_signal_trades (
      user_id, pool_item_id, stock_code, stock_name, board, sector,
      status, buy_signal, buy_date, buy_time, buy_price, buy_reason,
      stop_loss_price, take_profit_1, take_profit_2, peak_price, hold_days, pnl_pct
    ) VALUES (?,?,?,?,?,?,'OPEN',?,?,?,?,?,?,?,?,?,0,0.00)`,
    [
      input.userId,
      input.poolItem.id,
      input.poolItem.stock_code,
      input.poolItem.stock_name,
      input.poolItem.board,
      input.poolItem.sector,
      input.buySignal,
      buyDate,
      buyTime,
      Number(input.buyPrice.toFixed(3)),
      input.buyReason.slice(0, 240),
      sl,
      tp1,
      tp2,
      Number(input.buyPrice.toFixed(3)),
    ]
  );
  return res.affectedRows === 1;
}

export async function updateOpenSignalTradeSnapshot(
  tradeId: number,
  userId: string,
  patch: { peak_price: number; pnl_pct: number; hold_days: number }
): Promise<void> {
  await executeWrite(
    `UPDATE stock_signal_trades
     SET peak_price = GREATEST(peak_price, ?), pnl_pct = ?, hold_days = ?
     WHERE id = ? AND user_id = ? AND status = 'OPEN'`,
    [patch.peak_price, patch.pnl_pct, patch.hold_days, tradeId, userId]
  );
}

export async function closeSignalPaperTrade(
  tradeId: number,
  userId: string,
  input: {
    sellSignal: string;
    sellPrice: number;
    sellReason: string;
    sellDate?: string;
    sellTime?: string;
    pnlPct: number;
    isWin: boolean;
    holdDays: number;
    peakPrice?: number;
  }
): Promise<boolean> {
  await ensureSignalPaperTable();
  const { dateStr, hhmm } = getShanghaiParts();
  const res = await executeWrite(
    `UPDATE stock_signal_trades
     SET status = 'CLOSED',
         sell_signal = ?,
         sell_date = ?,
         sell_time = ?,
         sell_price = ?,
         sell_reason = ?,
         hold_days = ?,
         pnl_pct = ?,
         is_win = ?,
         peak_price = GREATEST(peak_price, ?)
     WHERE id = ? AND user_id = ? AND status = 'OPEN'`,
    [
      input.sellSignal,
      input.sellDate || dateStr,
      input.sellTime || hhmm,
      Number(input.sellPrice.toFixed(3)),
      input.sellReason.slice(0, 240),
      input.holdDays,
      input.pnlPct,
      input.isWin ? 1 : 0,
      input.peakPrice ?? input.sellPrice,
      tradeId,
      userId,
    ]
  );
  return res.affectedRows === 1;
}

/**
 * 同步用户 5 日推荐观察池的自动模拟买入 & 持仓中模拟单的自动卖出评估（T+1 严格拦截）
 */
export async function syncUserSignalPaperTrades(input: {
  userId: string;
  activePool?: RollingPoolItem[];
  buySignals?: Array<{
    poolItem: RollingPoolItem;
    signal: "BUY_A" | "BUY_B";
    price: number;
    reason: string;
  }>;
  quotesByCode: Record<string, SwingLiveQuote | undefined>;
  klineByCode?: Map<string, DailyKlineBar[]>;
  tradeDateStr?: string;
  timeStr?: string;
}): Promise<{ openedCount: number; closedCount: number; trades: SignalPaperTrade[] }> {
  if (!getDbPool()) return { openedCount: 0, closedCount: 0, trades: [] };
  await ensureSignalPaperTable();

  const { dateStr, hhmm } = getShanghaiParts();
  const tradeDateStr = input.tradeDateStr || dateStr;
  const timeStr = input.timeStr || hhmm;

  const existingTrades = await listUserSignalTrades(input.userId);
  const trackedPoolIds = new Set(existingTrades.map((t) => t.pool_item_id));

  let openedCount = 0;
  for (const sig of input.buySignals || []) {
    if (trackedPoolIds.has(sig.poolItem.id) || sig.price <= 0) continue;
    const inserted = await openSignalPaperTrade({
      userId: input.userId,
      poolItem: sig.poolItem,
      buySignal: sig.signal,
      buyPrice: sig.price,
      buyReason: sig.reason,
      buyDate: tradeDateStr,
      buyTime: timeStr,
    });
    if (inserted) {
      openedCount++;
      trackedPoolIds.add(sig.poolItem.id);
    }
  }

  // 若有正在持仓的模拟单，根据最新行情和日K评估卖出条件
  const latestTrades = openedCount > 0 ? await listUserSignalTrades(input.userId) : existingTrades;
  const openTrades = latestTrades.filter((t) => t.status === "OPEN");
  let closedCount = 0;

  if (openTrades.length > 0 && input.activePool) {
    // 保留空引用检查占位，确保所有开仓单即使后续从观察池过期也会持续跟踪至卖出
  }

  for (const trade of openTrades) {
    const q = input.quotesByCode[trade.stock_code];
    if (!q || !q.price || q.price <= 0) continue;
    const bars = input.klineByCode?.get(trade.stock_code) || [];
    const tech: StockTechnicals | null = bars.length
      ? computeStockTechnicals(bars, trade.stock_code, q)
      : null;

    const exitEval = evaluateSignalPaperExit(
      {
        stock_code: trade.stock_code,
        stock_name: trade.stock_name,
        buy_date: trade.buy_date,
        buy_price: trade.buy_price,
        stop_loss_price: trade.stop_loss_price,
        peak_price: trade.peak_price,
        hold_days: trade.hold_days,
      },
      q,
      tech,
      tradeDateStr
    );

    if (exitEval.should_sell && exitEval.sell_signal && exitEval.sell_price) {
      const closed = await closeSignalPaperTrade(trade.id, input.userId, {
        sellSignal: exitEval.sell_signal,
        sellPrice: exitEval.sell_price,
        sellReason: exitEval.sell_reason || "触发波段卖出纪律",
        sellDate: tradeDateStr,
        sellTime: timeStr,
        pnlPct: exitEval.pnl_pct,
        isWin: Boolean(exitEval.is_win),
        holdDays: exitEval.hold_days,
        peakPrice: exitEval.peak_price_candidate,
      });
      if (closed) closedCount++;
    } else if (
      exitEval.peak_price_candidate > trade.peak_price ||
      Math.abs(exitEval.pnl_pct - trade.pnl_pct) >= 0.05 ||
      exitEval.hold_days !== trade.hold_days
    ) {
      await updateOpenSignalTradeSnapshot(trade.id, input.userId, {
        peak_price: exitEval.peak_price_candidate,
        pnl_pct: exitEval.pnl_pct,
        hold_days: exitEval.hold_days,
      }).catch(() => {});
    }
  }

  const finalTrades = await listUserSignalTrades(input.userId);
  return { openedCount, closedCount, trades: finalTrades };
}

export function computeSignalWinRateStats(trades: SignalPaperTrade[]): SignalWinRateStats {
  const openTrades = trades.filter((t) => t.status === "OPEN");
  const closedTrades = trades.filter((t) => t.status === "CLOSED");
  const winCount = closedTrades.filter((t) => (t.is_win !== null ? t.is_win : t.pnl_pct > 0)).length;
  const lossCount = Math.max(0, closedTrades.length - winCount);

  const avgPnl =
    closedTrades.length > 0
      ? Number(
          (closedTrades.reduce((sum, t) => sum + t.pnl_pct, 0) / closedTrades.length).toFixed(2)
        )
      : 0;
  const openAvgPnl =
    openTrades.length > 0
      ? Number((openTrades.reduce((sum, t) => sum + t.pnl_pct, 0) / openTrades.length).toFixed(2))
      : 0;

  const grossProfit = closedTrades
    .filter((t) => t.pnl_pct > 0)
    .reduce((sum, t) => sum + t.pnl_pct, 0);
  const grossLoss = Math.abs(
    closedTrades.filter((t) => t.pnl_pct < 0).reduce((sum, t) => sum + t.pnl_pct, 0)
  );
  const profitFactor =
    grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 9.99 : null;

  const calcGroup = (sig: "BUY_A" | "BUY_B") => {
    const groupAll = trades.filter((t) => t.buy_signal === sig);
    const groupClosed = groupAll.filter((t) => t.status === "CLOSED");
    const wins = groupClosed.filter((t) => (t.is_win !== null ? t.is_win : t.pnl_pct > 0)).length;
    const rate = groupClosed.length > 0 ? Number(((wins / groupClosed.length) * 100).toFixed(1)) : 0;
    const avg =
      groupClosed.length > 0
        ? Number((groupClosed.reduce((s, t) => s + t.pnl_pct, 0) / groupClosed.length).toFixed(2))
        : 0;
    return { total: groupAll.length, closed: groupClosed.length, wins, win_rate_pct: rate, avg_pnl_pct: avg };
  };

  // 按时间正序计算等权累计净值曲线（含已平仓 + 未平仓浮动净值）
  const ordered = [...trades].sort((a, b) => a.id - b.id);
  let equity = 100;
  const curve = ordered.map((t) => {
    equity = Number((equity * (1 + t.pnl_pct / 100)).toFixed(2));
    return {
      label: t.sell_date || t.buy_date || getShanghaiDateStr(),
      equity,
      pnl_pct: t.pnl_pct,
      code: t.stock_code,
      name: t.stock_name,
    };
  });

  return {
    total_trades: trades.length,
    open_count: openTrades.length,
    closed_count: closedTrades.length,
    win_count: winCount,
    loss_count: lossCount,
    win_rate_pct:
      closedTrades.length > 0 ? Number(((winCount / closedTrades.length) * 100).toFixed(1)) : 0,
    avg_pnl_pct: avgPnl,
    open_avg_pnl_pct: openAvgPnl,
    profit_factor: profitFactor,
    cumulative_return_pct: Number((equity - 100).toFixed(2)),
    buy_a_stats: calcGroup("BUY_A"),
    buy_b_stats: calcGroup("BUY_B"),
    equity_curve: curve,
  };
}

export async function getWatchlistPoolSummary(userId: string) {
  return listUserRollingPool(userId);
}
