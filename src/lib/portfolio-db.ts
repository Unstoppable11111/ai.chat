import type { RowDataPacket } from "mysql2/promise";
import { executeQuery, executeRawDdl, executeRawQuery, executeWrite, getDbPool } from "@/lib/db";
import type { HoldingPositionMode } from "@/lib/quant-arena/swing-rules";

export interface UserHolding {
  id: number;
  user_id: string;
  stock_code: string;
  stock_name: string;
  quantity: number;
  available_quantity?: number | null;
  cost_price: number;
  hold_type: "core" | "trend" | "attack" | "trial";
  sector?: string | null;
  position_mode?: HoldingPositionMode;
  entry_date?: string | null;
  support_defense_price?: number | null;
  rebound_watch_prices?: number[] | null;
  peak_price_since_entry?: number | null;
  take_profit_pct_1?: number;
  take_profit_pct_2?: number;
  trailing_pullback_pct?: number;
  stop_loss_pct?: number;
  suppress_cost_stoploss?: boolean;
  thesis?: string | null;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type HoldingInput = Omit<UserHolding, "id" | "user_id" | "created_at" | "updated_at">;

let schemaReadyPromise: Promise<void> | null = null;

/**
 * 幂等检查并补齐 user_portfolios 的波段风控扩展列
 */
export async function ensurePortfolioSchema(): Promise<void> {
  if (!getDbPool()) return;
  if (schemaReadyPromise) return schemaReadyPromise;

  schemaReadyPromise = (async () => {
    try {
      await executeRawDdl(
        "CREATE TABLE IF NOT EXISTS user_portfolios (id INT AUTO_INCREMENT PRIMARY KEY,user_id VARCHAR(64) NOT NULL,stock_code VARCHAR(16) NOT NULL,stock_name VARCHAR(64) NOT NULL,quantity INT NOT NULL,cost_price DECIMAL(16,3) NOT NULL,hold_type VARCHAR(32) NOT NULL,notes TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX(user_id)) ENGINE=InnoDB"
      );
      const cols = await executeRawQuery<{ Field: string } & RowDataPacket>(
        "SHOW COLUMNS FROM user_portfolios"
      );
      if (!cols) return;
      const existing = new Set(cols.map((c) => c.Field));
      const additions: Record<string, string> = {
        sector: "VARCHAR(64) NULL",
        position_mode: "VARCHAR(32) NOT NULL DEFAULT 'swing_normal'",
        available_quantity: "INT NULL",
        entry_date: "VARCHAR(20) NULL",
        support_defense_price: "DECIMAL(16,3) NULL",
        rebound_watch_prices: "JSON NULL",
        peak_price_since_entry: "DECIMAL(16,3) NULL",
        take_profit_pct_1: "DECIMAL(8,2) NOT NULL DEFAULT 15.00",
        take_profit_pct_2: "DECIMAL(8,2) NOT NULL DEFAULT 25.00",
        trailing_pullback_pct: "DECIMAL(8,2) NOT NULL DEFAULT 7.00",
        stop_loss_pct: "DECIMAL(8,2) NOT NULL DEFAULT -8.00",
        suppress_cost_stoploss: "BOOLEAN NOT NULL DEFAULT 0",
        thesis: "TEXT NULL",
      };
      for (const [colName, colDef] of Object.entries(additions)) {
        if (!existing.has(colName)) {
          await executeRawDdl(`ALTER TABLE user_portfolios ADD COLUMN ${colName} ${colDef}`);
        }
      }
    } catch (err) {
      schemaReadyPromise = null;
      throw err;
    }
  })();

  return schemaReadyPromise;
}

function parseWatchPrices(raw: unknown): number[] | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const arr = raw.map(Number).filter((n) => Number.isFinite(n) && n > 0);
    return arr.length ? arr : null;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const arr = parsed.map(Number).filter((n) => Number.isFinite(n) && n > 0);
        return arr.length ? arr : null;
      }
    } catch {
      return null;
    }
  }
  return null;
}

interface RawPortfolioRow {
  id: number;
  user_id: string;
  stock_code: string;
  stock_name: string;
  quantity: number;
  available_quantity: number | null;
  cost_price: number;
  hold_type: "core" | "trend" | "attack" | "trial";
  sector: string | null;
  position_mode: string | null;
  entry_date: string | null;
  support_defense_price: number | null;
  rebound_watch_prices: unknown;
  peak_price_since_entry: number | null;
  take_profit_pct_1: number | null;
  take_profit_pct_2: number | null;
  trailing_pullback_pct: number | null;
  stop_loss_pct: number | null;
  suppress_cost_stoploss: number | boolean | null;
  thesis: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

function normalizeRow(row: RawPortfolioRow): UserHolding {
  return {
    id: row.id,
    user_id: row.user_id,
    stock_code: row.stock_code,
    stock_name: row.stock_name,
    quantity: Number(row.quantity) || 0,
    available_quantity:
      row.available_quantity !== null && row.available_quantity !== undefined
        ? Number(row.available_quantity)
        : Number(row.quantity) || 0,
    cost_price: Number(row.cost_price) || 0,
    hold_type: row.hold_type || "core",
    sector: row.sector || null,
    position_mode:
      row.position_mode === "deep_drawdown_recovery" ? "deep_drawdown_recovery" : "swing_normal",
    entry_date: row.entry_date || null,
    support_defense_price:
      row.support_defense_price !== null && row.support_defense_price !== undefined
        ? Number(row.support_defense_price)
        : null,
    rebound_watch_prices: parseWatchPrices(row.rebound_watch_prices),
    peak_price_since_entry:
      row.peak_price_since_entry !== null && row.peak_price_since_entry !== undefined
        ? Number(row.peak_price_since_entry)
        : null,
    take_profit_pct_1:
      row.take_profit_pct_1 !== null && row.take_profit_pct_1 !== undefined
        ? Number(row.take_profit_pct_1)
        : 15,
    take_profit_pct_2:
      row.take_profit_pct_2 !== null && row.take_profit_pct_2 !== undefined
        ? Number(row.take_profit_pct_2)
        : 25,
    trailing_pullback_pct:
      row.trailing_pullback_pct !== null && row.trailing_pullback_pct !== undefined
        ? Number(row.trailing_pullback_pct)
        : 7,
    stop_loss_pct:
      row.stop_loss_pct !== null && row.stop_loss_pct !== undefined
        ? Number(row.stop_loss_pct)
        : -8,
    suppress_cost_stoploss: Boolean(row.suppress_cost_stoploss),
    thesis: row.thesis || null,
    notes: row.notes || "",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getUserHoldings(userId: string): Promise<UserHolding[]> {
  if (!getDbPool()) throw new Error("Portfolio database is unavailable");
  await ensurePortfolioSchema();
  const rows = await executeQuery<RawPortfolioRow>(
    `SELECT id, user_id, stock_code, stock_name, quantity, available_quantity,
            CAST(cost_price AS DOUBLE) AS cost_price, hold_type, sector, position_mode,
            entry_date, CAST(support_defense_price AS DOUBLE) AS support_defense_price,
            rebound_watch_prices, CAST(peak_price_since_entry AS DOUBLE) AS peak_price_since_entry,
            CAST(take_profit_pct_1 AS DOUBLE) AS take_profit_pct_1,
            CAST(take_profit_pct_2 AS DOUBLE) AS take_profit_pct_2,
            CAST(trailing_pullback_pct AS DOUBLE) AS trailing_pullback_pct,
            CAST(stop_loss_pct AS DOUBLE) AS stop_loss_pct,
            suppress_cost_stoploss, thesis, notes, created_at, updated_at
     FROM user_portfolios WHERE user_id=? ORDER BY id DESC`,
    [userId]
  );
  if (!rows) throw new Error("Portfolio query failed");
  return rows.map(normalizeRow);
}

export async function addUserHolding(userId: string, item: HoldingInput): Promise<UserHolding> {
  await ensurePortfolioSchema();
  const avail = item.available_quantity ?? item.quantity;
  const mode = item.position_mode === "deep_drawdown_recovery" ? "deep_drawdown_recovery" : "swing_normal";
  const reboundJson =
    item.rebound_watch_prices && item.rebound_watch_prices.length > 0
      ? JSON.stringify(item.rebound_watch_prices)
      : null;

  const result = await executeWrite(
    `INSERT INTO user_portfolios (
      user_id, stock_code, stock_name, quantity, available_quantity, cost_price, hold_type,
      sector, position_mode, entry_date, support_defense_price, rebound_watch_prices,
      peak_price_since_entry, take_profit_pct_1, take_profit_pct_2, trailing_pullback_pct,
      stop_loss_pct, suppress_cost_stoploss, thesis, notes
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      userId,
      item.stock_code,
      item.stock_name,
      item.quantity,
      avail,
      item.cost_price,
      item.hold_type,
      item.sector || null,
      mode,
      item.entry_date || null,
      item.support_defense_price ?? null,
      reboundJson,
      item.peak_price_since_entry ?? item.cost_price,
      item.take_profit_pct_1 ?? 15,
      item.take_profit_pct_2 ?? 25,
      item.trailing_pullback_pct ?? 7,
      item.stop_loss_pct ?? -8,
      item.suppress_cost_stoploss ? 1 : 0,
      item.thesis || null,
      item.notes || "",
    ]
  );
  if (result.affectedRows !== 1 || !result.insertId) throw new Error("Portfolio insert failed");
  return { ...item, user_id: userId, id: result.insertId, position_mode: mode, available_quantity: avail };
}

export async function updateUserHolding(
  id: number,
  userId: string,
  patch: Partial<HoldingInput>
): Promise<boolean> {
  await ensurePortfolioSchema();
  const assignments: string[] = [];
  const values: (string | number | boolean | null)[] = [];

  const scalarFields = [
    "stock_name",
    "quantity",
    "available_quantity",
    "cost_price",
    "hold_type",
    "sector",
    "position_mode",
    "entry_date",
    "support_defense_price",
    "peak_price_since_entry",
    "take_profit_pct_1",
    "take_profit_pct_2",
    "trailing_pullback_pct",
    "stop_loss_pct",
    "thesis",
    "notes",
  ] as const;

  for (const key of scalarFields) {
    if (patch[key] !== undefined) {
      assignments.push(`${key}=?`);
      values.push((patch[key] as string | number | null) ?? null);
    }
  }
  if (patch.suppress_cost_stoploss !== undefined) {
    assignments.push("suppress_cost_stoploss=?");
    values.push(patch.suppress_cost_stoploss ? 1 : 0);
  }
  if (patch.rebound_watch_prices !== undefined) {
    assignments.push("rebound_watch_prices=?");
    values.push(
      patch.rebound_watch_prices && patch.rebound_watch_prices.length > 0
        ? JSON.stringify(patch.rebound_watch_prices)
        : null
    );
  }

  if (!assignments.length) return false;
  const result = await executeWrite(
    `UPDATE user_portfolios SET ${assignments.join(",")}, updated_at=NOW() WHERE id=? AND user_id=?`,
    [...values, id, userId]
  );
  return result.affectedRows === 1;
}

export async function deleteUserHolding(id: number, userId: string): Promise<boolean> {
  await ensurePortfolioSchema();
  return (await executeWrite("DELETE FROM user_portfolios WHERE id=? AND user_id=?", [id, userId])).affectedRows === 1;
}
