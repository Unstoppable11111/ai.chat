/**
 * 金股推荐数据库操作库
 * 按三大策略账户分类记录，含历史推荐成功率统计
 * 成功判定标准：
 *   - 激进策略: 推荐后30日内涨幅 >= +20% (止盈) 算胜，跌破 -7% (止损) 算败
 *   - 均衡策略: 推荐后60日内涨幅 >= +10% (止盈) 算胜，跌破 -4.5% (止损) 算败
 *   - 保守策略: 推荐后90日内涨幅 >= +6% (止盈) 算胜，跌破 -3% (止损) 算败
 */

import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getDbPool } from "@/lib/db";

export type GoldStockStrategy = "aggressive" | "balanced" | "conservative";
export type GoldStockStatus = "holding" | "win" | "stopped" | "expired";

export interface GoldStockRecord {
  id: number;
  strategy: GoldStockStrategy;
  recommend_date: string;      // 推荐日期 YYYY-MM-DD
  stock_code: string;
  stock_name: string;
  sector: string;
  entry_price: number;         // 推荐买入价
  target_price: number;        // 止盈目标价
  stop_loss_price: number;     // 止损价
  score: number;               // 量化评分 0-100
  reason: string;              // 推荐理由
  // 动态更新字段
  current_price: number | null;
  exit_price: number | null;   // 实际退出价（止盈/止损/到期）
  exit_date: string | null;
  max_return_pct: number | null;  // 持有期最大收益率
  actual_return_pct: number | null; // 实际收益率（退出后）
  status: GoldStockStatus;
  // 判定标准（各策略不同）
  target_days: number;         // 推荐有效期（天）
  win_threshold_pct: number;   // 胜率判定止盈幅度
  stop_loss_pct: number;       // 止损幅度
  created_at: string;
  updated_at: string;
}

// 各策略成功率判定标准
export const STRATEGY_CRITERIA: Record<GoldStockStrategy, {
  target_days: number;
  win_threshold_pct: number;
  stop_loss_pct: number;
}> = {
  aggressive: { target_days: 30,  win_threshold_pct: 20, stop_loss_pct: -7   },
  balanced:   { target_days: 60,  win_threshold_pct: 10, stop_loss_pct: -4.5 },
  conservative:{ target_days: 90, win_threshold_pct: 6,  stop_loss_pct: -3   },
};

export interface GoldStockStats {
  strategy: GoldStockStrategy;
  total: number;
  win_count: number;
  stopped_count: number;
  holding_count: number;
  expired_count: number;
  win_rate_pct: number;       // 完结单胜率
  avg_win_return_pct: number; // 盈利单平均收益
  avg_loss_return_pct: number;// 亏损单平均亏损
  profit_factor: number;      // 盈亏比
  avg_return_pct: number;     // 全量平均收益
}

/**
 * 确保金股推荐表存在（自动建表）
 */
export async function ensureGoldStockTable(): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gold_stock_recommendations (
      id                  INT AUTO_INCREMENT PRIMARY KEY,
      strategy            ENUM('aggressive','balanced','conservative') NOT NULL,
      recommend_date      DATE NOT NULL,
      stock_code          VARCHAR(10) NOT NULL,
      stock_name          VARCHAR(50) NOT NULL,
      sector              VARCHAR(50) DEFAULT '',
      entry_price         DECIMAL(10,3) NOT NULL,
      target_price        DECIMAL(10,3) NOT NULL,
      stop_loss_price     DECIMAL(10,3) NOT NULL,
      score               TINYINT UNSIGNED DEFAULT 0,
      reason              TEXT,
      current_price       DECIMAL(10,3),
      exit_price          DECIMAL(10,3),
      exit_date           DATE,
      max_return_pct      DECIMAL(8,2),
      actual_return_pct   DECIMAL(8,2),
      status              ENUM('holding','win','stopped','expired') DEFAULT 'holding',
      target_days         TINYINT UNSIGNED NOT NULL DEFAULT 30,
      win_threshold_pct   DECIMAL(5,2) NOT NULL DEFAULT 20,
      stop_loss_pct       DECIMAL(5,2) NOT NULL DEFAULT -7,
      created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_strategy (strategy),
      INDEX idx_status (status),
      INDEX idx_recommend_date (recommend_date),
      UNIQUE KEY uniq_recommend (strategy, recommend_date, stock_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

/**
 * 查询金股推荐列表（支持策略过滤、状态过滤）
 */
export async function listGoldStocks(options?: {
  strategy?: GoldStockStrategy;
  status?: GoldStockStatus;
  limit?: number;
}): Promise<GoldStockRecord[]> {
  const pool = getDbPool();
  if (!pool) return [];

  await ensureGoldStockTable();

  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (options?.strategy) {
    conditions.push("strategy = ?");
    values.push(options.strategy);
  }
  if (options?.status) {
    conditions.push("status = ?");
    values.push(options.status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = options?.limit ?? 50;

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM gold_stock_recommendations ${where} ORDER BY recommend_date DESC LIMIT ?`,
    [...values, limit]
  );

  return rows.map(normalizeRecord);
}

/**
 * 新增一条金股推荐记录
 */
export async function createGoldStock(data: {
  strategy: GoldStockStrategy;
  recommend_date: string;
  stock_code: string;
  stock_name: string;
  sector?: string;
  entry_price: number;
  target_price: number;
  stop_loss_price: number;
  score?: number;
  reason?: string;
}): Promise<{ id: number } | null> {
  const pool = getDbPool();
  if (!pool) return null;

  await ensureGoldStockTable();
  const criteria = STRATEGY_CRITERIA[data.strategy];

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO gold_stock_recommendations
        (strategy, recommend_date, stock_code, stock_name, sector, entry_price, target_price, stop_loss_price,
         score, reason, status, target_days, win_threshold_pct, stop_loss_pct)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'holding', ?, ?, ?)
       ON DUPLICATE KEY UPDATE reason=VALUES(reason), score=VALUES(score), updated_at=NOW()`,
      [
        data.strategy, data.recommend_date, data.stock_code, data.stock_name,
        data.sector ?? "", data.entry_price, data.target_price, data.stop_loss_price,
        data.score ?? 0, data.reason ?? "",
        criteria.target_days, criteria.win_threshold_pct, criteria.stop_loss_pct,
      ]
    );
    return { id: result.insertId };
  } catch {
    return null;
  }
}

/**
 * 更新金股推荐的实时行情与状态
 */
export async function updateGoldStockStatus(
  id: number,
  data: {
    current_price?: number;
    max_return_pct?: number;
    actual_return_pct?: number;
    exit_price?: number;
    exit_date?: string;
    status?: GoldStockStatus;
  }
): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;

  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.current_price !== undefined) { sets.push("current_price = ?"); values.push(data.current_price); }
  if (data.max_return_pct !== undefined) { sets.push("max_return_pct = ?"); values.push(data.max_return_pct); }
  if (data.actual_return_pct !== undefined) { sets.push("actual_return_pct = ?"); values.push(data.actual_return_pct); }
  if (data.exit_price !== undefined) { sets.push("exit_price = ?"); values.push(data.exit_price); }
  if (data.exit_date !== undefined) { sets.push("exit_date = ?"); values.push(data.exit_date); }
  if (data.status !== undefined) { sets.push("status = ?"); values.push(data.status); }

  if (sets.length === 0) return;
  values.push(id);

  await pool.execute(
    `UPDATE gold_stock_recommendations SET ${sets.join(", ")} WHERE id = ?`,
    values
  );
}

/**
 * 计算各策略金股推荐历史成功率统计
 */
export async function calcGoldStockStats(
  strategy?: GoldStockStrategy
): Promise<GoldStockStats[]> {
  const pool = getDbPool();
  if (!pool) return [];

  await ensureGoldStockTable();

  const strategies: GoldStockStrategy[] = strategy
    ? [strategy]
    : ["aggressive", "balanced", "conservative"];

  const results: GoldStockStats[] = [];

  for (const strat of strategies) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT status, actual_return_pct FROM gold_stock_recommendations WHERE strategy = ?`,
      [strat]
    );

    const total = rows.length;
    const winRows = rows.filter(r => r.status === "win");
    const stopRows = rows.filter(r => r.status === "stopped");
    const holdingRows = rows.filter(r => r.status === "holding");
    const expiredRows = rows.filter(r => r.status === "expired");

    const completed = winRows.length + stopRows.length + expiredRows.length;
    const win_rate_pct = completed > 0
      ? parseFloat(((winRows.length / completed) * 100).toFixed(1))
      : 0;

    const winReturns = winRows.map(r => Number(r.actual_return_pct ?? 0)).filter(n => n > 0);
    const lossReturns = [...stopRows, ...expiredRows]
      .map(r => Number(r.actual_return_pct ?? 0))
      .filter(n => n < 0)
      .map(n => Math.abs(n));

    const avg_win = winReturns.length > 0
      ? winReturns.reduce((a, b) => a + b, 0) / winReturns.length : 0;
    const avg_loss = lossReturns.length > 0
      ? lossReturns.reduce((a, b) => a + b, 0) / lossReturns.length : 0;

    const allReturns = rows
      .map(r => Number(r.actual_return_pct ?? 0))
      .filter(n => n !== 0);
    const avg_return = allReturns.length > 0
      ? parseFloat((allReturns.reduce((a, b) => a + b, 0) / allReturns.length).toFixed(2))
      : 0;

    results.push({
      strategy: strat,
      total,
      win_count: winRows.length,
      stopped_count: stopRows.length,
      holding_count: holdingRows.length,
      expired_count: expiredRows.length,
      win_rate_pct,
      avg_win_return_pct: parseFloat(avg_win.toFixed(2)),
      avg_loss_return_pct: parseFloat(avg_loss.toFixed(2)),
      profit_factor: avg_loss > 0 ? parseFloat((avg_win / avg_loss).toFixed(2)) : avg_win,
      avg_return_pct: avg_return,
    });
  }

  return results;
}

function normalizeRecord(row: RowDataPacket): GoldStockRecord {
  return {
    id: row.id,
    strategy: row.strategy as GoldStockStrategy,
    recommend_date: row.recommend_date instanceof Date
      ? row.recommend_date.toISOString().slice(0, 10)
      : String(row.recommend_date ?? ""),
    stock_code: row.stock_code,
    stock_name: row.stock_name,
    sector: row.sector ?? "",
    entry_price: Number(row.entry_price),
    target_price: Number(row.target_price),
    stop_loss_price: Number(row.stop_loss_price),
    score: Number(row.score ?? 0),
    reason: row.reason ?? "",
    current_price: row.current_price != null ? Number(row.current_price) : null,
    exit_price: row.exit_price != null ? Number(row.exit_price) : null,
    exit_date: row.exit_date instanceof Date
      ? row.exit_date.toISOString().slice(0, 10)
      : (row.exit_date ? String(row.exit_date) : null),
    max_return_pct: row.max_return_pct != null ? Number(row.max_return_pct) : null,
    actual_return_pct: row.actual_return_pct != null ? Number(row.actual_return_pct) : null,
    status: row.status as GoldStockStatus,
    target_days: Number(row.target_days),
    win_threshold_pct: Number(row.win_threshold_pct),
    stop_loss_pct: Number(row.stop_loss_pct),
    created_at: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at ?? ""),
    updated_at: row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at ?? ""),
  };
}
