import { executeQuery, executeRawDdl, executeWrite, getDbPool } from "@/lib/db";
import { addUserHolding, getUserHoldings, updateUserHolding } from "@/lib/portfolio-db";
import { getShanghaiDateStr, isAShareTradingDay } from "@/lib/trading-hours";
import { classifyAShareBoard } from "@/lib/quant-arena/swing-rules";

export type RollingPoolStatus =
  | "OBSERVING"
  | "CONVERTED"
  | "EXPIRED"
  | "INVALIDATED"
  | "ROTATED"
  | "MANUAL_DROP";

export interface RollingPoolItem {
  id: number;
  user_id: string;
  stock_code: string;
  stock_name: string;
  board: string;
  sector: string;
  added_date: string;
  last_counted_date: string;
  observed_days: number;
  max_days: number;
  entry_ref_price: number;
  buy_low: number | null;
  buy_high: number | null;
  breakout_price: number | null;
  invalid_price: number | null;
  vol_ratio_5_20: number | null;
  limit_up_count_1y: number | null;
  moat_score: number | null;
  structure_score: number | null;
  thesis: string;
  status: RollingPoolStatus;
  triggered_signal: string | null;
  drop_date: string | null;
  drop_reason: string | null;
  exit_price: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface EnrollCandidateInput {
  code: string;
  name: string;
  board?: string;
  sector?: string;
  entry_ref_price: number;
  buy_low?: number | null;
  buy_high?: number | null;
  breakout_price?: number | null;
  invalid_price?: number | null;
  vol_ratio_5_20?: number | null;
  limit_up_count_1y?: number | null;
  moat_score?: number | null;
  structure_score?: number | null;
  thesis?: string;
}

let rollingTableReadyPromise: Promise<void> | null = null;

export async function ensureRollingPoolTable(): Promise<void> {
  if (!getDbPool()) return;
  if (rollingTableReadyPromise) return rollingTableReadyPromise;

  rollingTableReadyPromise = (async () => {
    try {
      await executeRawDdl(
        `CREATE TABLE IF NOT EXISTS stock_rolling_pool (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL,
          stock_code VARCHAR(16) NOT NULL,
          stock_name VARCHAR(64) NOT NULL,
          board VARCHAR(32) NOT NULL,
          sector VARCHAR(64) NOT NULL,
          added_date DATE NOT NULL,
          last_counted_date DATE NOT NULL,
          observed_days INT NOT NULL DEFAULT 0,
          max_days INT NOT NULL DEFAULT 5,
          entry_ref_price DECIMAL(16,3) NOT NULL,
          buy_low DECIMAL(16,3) NULL,
          buy_high DECIMAL(16,3) NULL,
          breakout_price DECIMAL(16,3) NULL,
          invalid_price DECIMAL(16,3) NULL,
          vol_ratio_5_20 DECIMAL(10,2) NULL,
          limit_up_count_1y INT NULL,
          moat_score DECIMAL(6,1) NULL,
          structure_score DECIMAL(6,1) NULL,
          thesis TEXT NULL,
          status VARCHAR(24) NOT NULL DEFAULT 'OBSERVING',
          triggered_signal VARCHAR(32) NULL,
          drop_date DATE NULL,
          drop_reason VARCHAR(255) NULL,
          exit_price DECIMAL(16,3) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_status(user_id, status),
          INDEX idx_user_added(user_id, added_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      );
      await executeRawDdl(
        "ALTER TABLE stock_rolling_pool CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
      ).catch(() => {});
    } catch (err) {
      rollingTableReadyPromise = null;
      throw err;
    }
  })();

  return rollingTableReadyPromise;
}

function formatDateField(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(val).slice(0, 10);
}

interface RawRollingRow {
  id: number;
  user_id: string;
  stock_code: string;
  stock_name: string;
  board: string;
  sector: string;
  added_date: unknown;
  last_counted_date: unknown;
  observed_days: number;
  max_days: number;
  entry_ref_price: number;
  buy_low: number | null;
  buy_high: number | null;
  breakout_price: number | null;
  invalid_price: number | null;
  vol_ratio_5_20: number | null;
  limit_up_count_1y: number | null;
  moat_score: number | null;
  structure_score: number | null;
  thesis: string | null;
  status: RollingPoolStatus;
  triggered_signal: string | null;
  drop_date: unknown;
  drop_reason: string | null;
  exit_price: number | null;
  created_at?: string;
  updated_at?: string;
}

function normalizeRollingRow(r: RawRollingRow): RollingPoolItem {
  return {
    id: Number(r.id),
    user_id: r.user_id,
    stock_code: r.stock_code,
    stock_name: r.stock_name,
    board: r.board,
    sector: r.sector,
    added_date: formatDateField(r.added_date),
    last_counted_date: formatDateField(r.last_counted_date),
    observed_days: Number(r.observed_days) || 0,
    max_days: Number(r.max_days) || 5,
    entry_ref_price: Number(r.entry_ref_price) || 0,
    buy_low: r.buy_low !== null ? Number(r.buy_low) : null,
    buy_high: r.buy_high !== null ? Number(r.buy_high) : null,
    breakout_price: r.breakout_price !== null ? Number(r.breakout_price) : null,
    invalid_price: r.invalid_price !== null ? Number(r.invalid_price) : null,
    vol_ratio_5_20: r.vol_ratio_5_20 !== null ? Number(r.vol_ratio_5_20) : null,
    limit_up_count_1y: r.limit_up_count_1y !== null ? Number(r.limit_up_count_1y) : null,
    moat_score: r.moat_score !== null ? Number(r.moat_score) : null,
    structure_score: r.structure_score !== null ? Number(r.structure_score) : null,
    thesis: r.thesis || "",
    status: r.status,
    triggered_signal: r.triggered_signal || null,
    drop_date: r.drop_date ? formatDateField(r.drop_date) : null,
    drop_reason: r.drop_reason || null,
    exit_price: r.exit_price !== null ? Number(r.exit_price) : null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export async function listUserRollingPool(userId: string): Promise<{
  active: RollingPoolItem[];
  archive: RollingPoolItem[];
}> {
  if (!getDbPool()) throw new Error("Rolling pool database unavailable");
  await ensureRollingPoolTable();

  const rows = await executeQuery<RawRollingRow>(
    `SELECT id, user_id, stock_code, stock_name, board, sector,
            added_date, last_counted_date, observed_days, max_days,
            CAST(entry_ref_price AS DOUBLE) AS entry_ref_price,
            CAST(buy_low AS DOUBLE) AS buy_low,
            CAST(buy_high AS DOUBLE) AS buy_high,
            CAST(breakout_price AS DOUBLE) AS breakout_price,
            CAST(invalid_price AS DOUBLE) AS invalid_price,
            CAST(vol_ratio_5_20 AS DOUBLE) AS vol_ratio_5_20,
            limit_up_count_1y,
            CAST(moat_score AS DOUBLE) AS moat_score,
            CAST(structure_score AS DOUBLE) AS structure_score,
            thesis, status, triggered_signal, drop_date, drop_reason,
            CAST(exit_price AS DOUBLE) AS exit_price,
            created_at, updated_at
     FROM stock_rolling_pool
     WHERE user_id = ?
     ORDER BY CASE WHEN status = 'OBSERVING' THEN 0 ELSE 1 END ASC, id DESC
     LIMIT 120`,
    [userId]
  );

  const items = (rows || []).map(normalizeRollingRow);

  // 在交易日跨日查看观察池时自动推进 observed_days，避免次日盘中仍卡在 Day 0/5
  const todayStr = getShanghaiDateStr();
  if (isAShareTradingDay()) {
    const toAdvance = items.filter(
      (i) => i.status === "OBSERVING" && todayStr > i.added_date && todayStr > i.last_counted_date
    );
    for (const item of toAdvance) {
      const nextDays = item.observed_days + 1;
      await executeWrite(
        `UPDATE stock_rolling_pool SET observed_days=?, last_counted_date=? WHERE id=? AND user_id=?`,
        [nextDays, todayStr, item.id, userId]
      ).catch(() => {});
      item.observed_days = nextDays;
      item.last_counted_date = todayStr;
    }
  }

  return {
    active: items.filter((i) => i.status === "OBSERVING"),
    archive: items.filter((i) => i.status !== "OBSERVING").slice(0, 60),
  };
}

export async function addRollingWatchItem(
  userId: string,
  candidate: EnrollCandidateInput,
  tradeDateStr = getShanghaiDateStr(),
  maxActive = 12
): Promise<RollingPoolItem | null> {
  await ensureRollingPoolTable();
  const cleanCode = candidate.code.replace(/^(sh|sz|bj)/i, "").trim();
  const boardInfo = classifyAShareBoard(cleanCode, candidate.name);
  if (!boardInfo.allowed) {
    throw new Error(`标的 ${candidate.name}(${cleanCode}) 属于${boardInfo.board}，不在沪深主板与创业板范围内`);
  }

  // 检查是否已在持仓或活跃观察池
  const existingPool = await listUserRollingPool(userId);
  if (existingPool.active.some((i) => i.stock_code === cleanCode)) {
    return null;
  }

  const result = await executeWrite(
    `INSERT INTO stock_rolling_pool (
      user_id, stock_code, stock_name, board, sector,
      added_date, last_counted_date, observed_days, max_days,
      entry_ref_price, buy_low, buy_high, breakout_price, invalid_price,
      vol_ratio_5_20, limit_up_count_1y, moat_score, structure_score, thesis, status
    ) VALUES (?,?,?,?,?,?,?,0,5,?,?,?,?,?,?,?,?,?,?, 'OBSERVING')`,
    [
      userId,
      cleanCode,
      candidate.name,
      candidate.board || boardInfo.board,
      candidate.sector || "科技成长",
      tradeDateStr,
      tradeDateStr,
      candidate.entry_ref_price,
      candidate.buy_low ?? Number((candidate.entry_ref_price * 0.97).toFixed(2)),
      candidate.buy_high ?? Number((candidate.entry_ref_price * 1.005).toFixed(2)),
      candidate.breakout_price ?? Number((candidate.entry_ref_price * 1.04).toFixed(2)),
      candidate.invalid_price ?? Number((candidate.entry_ref_price * 0.92).toFixed(2)),
      candidate.vol_ratio_5_20 ?? null,
      candidate.limit_up_count_1y ?? null,
      candidate.moat_score ?? null,
      candidate.structure_score ?? null,
      candidate.thesis || "",
    ]
  );

  // 控制活跃观察池上限（保留最新的 maxActive 只，超出的最早入池标的自动归档）
  const refreshed = await listUserRollingPool(userId);
  if (refreshed.active.length > maxActive) {
    const sortedOldestFirst = [...refreshed.active].sort((a, b) => a.id - b.id);
    const overflow = sortedOldestFirst.slice(0, refreshed.active.length - maxActive);
    for (const item of overflow) {
      await executeWrite(
        `UPDATE stock_rolling_pool
         SET status='ROTATED', drop_date=?, drop_reason=?
         WHERE id=? AND user_id=?`,
        [tradeDateStr, `观察池满额(${maxActive}只)轮动换出`, item.id, userId]
      );
    }
  }

  const finalPool = await listUserRollingPool(userId);
  return finalPool.active.find((i) => i.id === result.insertId) || null;
}

export async function settleUserRollingPool(
  userId: string,
  tradeDateStr: string,
  quotesMap: Record<string, { current_price: number; change_pct: number } | undefined>
): Promise<{
  expiredToday: RollingPoolItem[];
  invalidatedToday: RollingPoolItem[];
  activeAfter: RollingPoolItem[];
}> {
  await ensureRollingPoolTable();
  const { active } = await listUserRollingPool(userId);
  const expiredToday: RollingPoolItem[] = [];
  const invalidatedToday: RollingPoolItem[] = [];

  for (const item of active) {
    let obsDays = item.observed_days;
    if (tradeDateStr > item.added_date && tradeDateStr > item.last_counted_date) {
      obsDays += 1;
      await executeWrite(
        `UPDATE stock_rolling_pool SET observed_days=?, last_counted_date=? WHERE id=? AND user_id=?`,
        [obsDays, tradeDateStr, item.id, userId]
      );
      item.observed_days = obsDays;
      item.last_counted_date = tradeDateStr;
    }

    const q = quotesMap[item.stock_code];
    const price = q?.current_price ?? null;
    const chgPct = q?.change_pct ?? 0;

    if (price !== null && item.invalid_price !== null && price < item.invalid_price && chgPct <= -4.0) {
      const reason = `结构破位提前淘汰：现价 ¥${price.toFixed(2)} 跌破失效线 ¥${item.invalid_price.toFixed(2)} (${chgPct.toFixed(2)}%)`;
      await executeWrite(
        `UPDATE stock_rolling_pool SET status='INVALIDATED', drop_date=?, drop_reason=?, exit_price=? WHERE id=? AND user_id=?`,
        [tradeDateStr, reason, price, item.id, userId]
      );
      invalidatedToday.push({ ...item, status: "INVALIDATED", drop_date: tradeDateStr, drop_reason: reason, exit_price: price });
      continue;
    }

    if (obsDays >= item.max_days) {
      const reason = `观察满 ${item.max_days} 个交易日未触发买点，自动放弃`;
      await executeWrite(
        `UPDATE stock_rolling_pool SET status='EXPIRED', drop_date=?, drop_reason=?, exit_price=? WHERE id=? AND user_id=?`,
        [tradeDateStr, reason, price, item.id, userId]
      );
      expiredToday.push({ ...item, status: "EXPIRED", drop_date: tradeDateStr, drop_reason: reason, exit_price: price });
    }
  }

  const after = await listUserRollingPool(userId);
  return { expiredToday, invalidatedToday, activeAfter: after.active };
}

export async function dropRollingWatchItem(
  id: number,
  userId: string,
  reason = "手动移除观察"
): Promise<boolean> {
  await ensureRollingPoolTable();
  const today = getShanghaiDateStr();
  const res = await executeWrite(
    `UPDATE stock_rolling_pool SET status='MANUAL_DROP', drop_date=?, drop_reason=? WHERE id=? AND user_id=? AND status='OBSERVING'`,
    [today, reason, id, userId]
  );
  return res.affectedRows === 1;
}

export async function convertWatchItemToHolding(
  id: number,
  userId: string,
  options: { quantity: number; price: number; signal?: string }
): Promise<boolean> {
  await ensureRollingPoolTable();
  const { active } = await listUserRollingPool(userId);
  const target = active.find((i) => i.id === id);
  if (!target) return false;

  const today = getShanghaiDateStr();
  await addUserHolding(userId, {
    stock_code: target.stock_code,
    stock_name: target.stock_name,
    quantity: options.quantity,
    available_quantity: 0, // A股 T+1，当日新买可卖为 0
    cost_price: options.price,
    hold_type: "trend",
    sector: target.sector,
    position_mode: "swing_normal",
    entry_date: today,
    support_defense_price: target.invalid_price,
    peak_price_since_entry: options.price,
    take_profit_pct_1: 15,
    take_profit_pct_2: 25,
    trailing_pullback_pct: 7,
    stop_loss_pct: -8,
    suppress_cost_stoploss: false,
    thesis: target.thesis,
    notes: `由5日观察池(${options.signal || "买点触发"})转入`,
  });

  await executeWrite(
    `UPDATE stock_rolling_pool
     SET status='CONVERTED', triggered_signal=?, drop_date=?, drop_reason=?, exit_price=?
     WHERE id=? AND user_id=?`,
    [options.signal || "MANUAL_BUY", today, "已触发买点并转入实盘持仓", options.price, id, userId]
  );
  return true;
}

/**
 * 一键导入你在 select 本地配置好的初始实盘持仓（兴森科技）与首期 3 只科技观察池标的
 */
export async function seedInitialSelectPortfolio(userId: string): Promise<{
  addedHolding: boolean;
  addedWatchCount: number;
}> {
  const holdings = await getUserHoldings(userId);
  let addedHolding = false;
  const existingXingsen = holdings.find((h) => h.stock_code === "002436");
  const xingsenThesis =
    "PCB与IC载板国产替代标的；当前处于深套修复观察期，重点跟踪23.30前低防守、27.50(MA20)右侧转强及回购专项贷款公告后的资金承接情况";
  if (!existingXingsen) {
    await addUserHolding(userId, {
      stock_code: "002436",
      stock_name: "兴森科技",
      quantity: 6300,
      available_quantity: 6300,
      cost_price: 37.49,
      hold_type: "core",
      sector: "元件",
      position_mode: "deep_drawdown_recovery",
      entry_date: "待核实",
      support_defense_price: 23.3,
      rebound_watch_prices: [27.5, 34.45],
      peak_price_since_entry: 37.49,
      take_profit_pct_1: 15,
      take_profit_pct_2: 25,
      trailing_pullback_pct: 7,
      stop_loss_pct: -8,
      suppress_cost_stoploss: true,
      thesis: xingsenThesis,
      notes: "从本机 select 初始账本导入（请核对券商精确成本价后修改）",
    });
    addedHolding = true;
  } else if (
    existingXingsen.position_mode !== "deep_drawdown_recovery" ||
    !existingXingsen.support_defense_price
  ) {
    // 保留用户已填写的实际持仓数量与成本价，仅补齐深套修复防守参数与板块配置
    await updateUserHolding(existingXingsen.id, userId, {
      sector: existingXingsen.sector || "元件",
      position_mode: "deep_drawdown_recovery",
      support_defense_price: existingXingsen.support_defense_price ?? 23.3,
      rebound_watch_prices: existingXingsen.rebound_watch_prices ?? [27.5, 34.45],
      suppress_cost_stoploss: true,
      thesis: existingXingsen.thesis || xingsenThesis,
    });
    addedHolding = true;
  }

  const initialWatch: EnrollCandidateInput[] = [
    {
      code: "002916",
      name: "深南电路",
      board: "深市主板",
      sector: "元件",
      entry_ref_price: 207.5,
      buy_low: 201.28,
      buy_high: 208.54,
      breakout_price: 282.4,
      invalid_price: 176.3,
      vol_ratio_5_20: 1.6,
      limit_up_count_1y: 12,
      moat_score: 94,
      structure_score: 90,
      thesis: "印制电路板、封装基板及电子装联产品核心龙头。",
    },
    {
      code: "300857",
      name: "协创数据",
      board: "创业板",
      sector: "算力设备",
      entry_ref_price: 122.37,
      buy_low: 118.7,
      buy_high: 122.98,
      breakout_price: 179.79,
      invalid_price: 112.7,
      vol_ratio_5_20: 1.55,
      limit_up_count_1y: 2,
      moat_score: 90,
      structure_score: 79,
      thesis: "智能算力产品及服务、数据存储设备与服务器再制造。",
    },
    {
      code: "603629",
      name: "利通电子",
      board: "沪市主板",
      sector: "算力服务",
      entry_ref_price: 60.49,
      buy_low: 58.68,
      buy_high: 60.79,
      breakout_price: 76.65,
      invalid_price: 52.77,
      vol_ratio_5_20: 2.03,
      limit_up_count_1y: 28,
      moat_score: 69,
      structure_score: 90,
      thesis: "精密金属结构件、电子元器件及算力云服务。",
    },
  ];

  let addedWatchCount = 0;
  for (const w of initialWatch) {
    const inserted = await addRollingWatchItem(userId, w, "2026-11-24");
    if (inserted) addedWatchCount++;
  }
  return { addedHolding, addedWatchCount };
}
