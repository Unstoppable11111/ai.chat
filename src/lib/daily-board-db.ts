import { executeQuery, executeRawDdl, executeWrite, getDbPool } from "@/lib/db";
import { getShanghaiDateStr } from "@/lib/trading-hours";
import type { MarketTrafficLightState } from "@/lib/quant-arena/swing-rules";
import type { ClsTelegraphItem } from "@/lib/quotes-service";

export type DailyBoardReportType = "premarket" | "intraday" | "postmarket" | "anomaly";

export interface PremarketReportPayload {
  report_date: string;
  generated_at: string;
  traffic_light: MarketTrafficLightState;
  news: ClsTelegraphItem[];
  holdings_plan: Array<{
    code: string;
    name: string;
    cost_price: number;
    position_mode: string;
    stop_loss_price: number;
    support_defense_price: number | null;
    rebound_watch_prices: number[] | null;
    thesis: string | null;
  }>;
  watchlist_plan: Array<{
    code: string;
    name: string;
    board: string;
    observed_days: number;
    max_days: number;
    buy_low: number | null;
    buy_high: number | null;
    breakout_price: number | null;
    invalid_price: number | null;
  }>;
  plan_markdown: string;
  ai_used: boolean;
  model_used?: string;
}

export interface IntradayTickEntry {
  tick_time: string;
  indices_summary: string;
  sentiment_score: number | null;
  traffic_light: MarketTrafficLightState;
  up_count: number;
  down_count: number;
  limit_up_count: number;
  limit_down_count: number;
  broken_ratio: number;
  holdings: Array<{
    code: string;
    name: string;
    price: number;
    change_pct: number;
    pnl_pct: number;
    amplitude_pct: number;
    pullback_from_high_pct: number;
    recommendation: string;
    highest_severity: string;
    signals: string[];
  }>;
  watchlist: Array<{
    code: string;
    name: string;
    price: number | null;
    change_pct: number;
    observed_days: number;
    max_days: number;
    triggered_signal: string | null;
    status_summary: string;
  }>;
  escalated: boolean;
}

export interface IntradayReportPayload {
  report_date: string;
  updated_at: string;
  latest_sentiment_score: number | null;
  entries: IntradayTickEntry[];
}

export interface PostmarketReportPayload {
  report_date: string;
  generated_at: string;
  scanned_count: number;
  qualified_count: number;
  enrolled: Array<{
    code: string;
    name: string;
    board: string;
    sector: string;
    entry_ref_price: number;
    buy_low: number | null;
    buy_high: number | null;
    breakout_price: number | null;
    invalid_price: number | null;
    vol_ratio_5_20: number | null;
    limit_up_count_1y: number | null;
    thesis: string;
  }>;
  expired_today: Array<{ code: string; name: string; reason: string }>;
  invalidated_today: Array<{ code: string; name: string; reason: string }>;
  active_pool_count: number;
  candidates_preview: Array<{
    code: string;
    name: string;
    board: string;
    sector: string;
    price: number;
    change_pct: number;
    composite_score: number;
    score_note: string;
  }>;
}

export interface AnomalyAnalysisRecord {
  id: string;
  created_at: string;
  trigger_type: "auto" | "manual";
  focus_code?: string;
  focus_name?: string;
  reasons: string[];
  sentiment_label: string;
  analysis_markdown: string;
  ai_used: boolean;
  model_used?: string;
}

export interface AnomalyReportPayload {
  report_date: string;
  updated_at: string;
  records: AnomalyAnalysisRecord[];
}

let reportTableReadyPromise: Promise<void> | null = null;

async function ensureResearchReportsTable(): Promise<void> {
  if (!getDbPool()) return;
  if (reportTableReadyPromise) return reportTableReadyPromise;

  reportTableReadyPromise = (async () => {
    try {
      await executeRawDdl(
        "CREATE TABLE IF NOT EXISTS user_research_reports (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id VARCHAR(64) NOT NULL,report_type VARCHAR(16) NOT NULL,report_date DATE NOT NULL,payload JSON NOT NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,report_type,report_date)) ENGINE=InnoDB"
      );
    } catch (err) {
      reportTableReadyPromise = null;
      throw err;
    }
  })();

  return reportTableReadyPromise;
}

function parsePayload<T>(raw: unknown): T | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  return raw as T;
}

export async function getBoardReport<T>(
  userId: string,
  reportType: DailyBoardReportType,
  reportDate: string
): Promise<T | null> {
  if (!getDbPool()) return null;
  await ensureResearchReportsTable();
  const rows = await executeQuery<{ payload: unknown }>(
    "SELECT payload FROM user_research_reports WHERE user_id=? AND report_type=? AND report_date=? LIMIT 1",
    [userId, reportType, reportDate]
  );
  if (!rows?.length) return null;
  return parsePayload<T>(rows[0].payload);
}

export async function upsertBoardReport<T>(
  userId: string,
  reportType: DailyBoardReportType,
  reportDate: string,
  payload: T
): Promise<void> {
  await ensureResearchReportsTable();
  await executeWrite(
    "INSERT INTO user_research_reports (user_id,report_type,report_date,payload) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE payload=VALUES(payload)",
    [userId, reportType, reportDate, JSON.stringify(payload)]
  );
}

export async function appendIntradayTick(
  userId: string,
  reportDate: string,
  entry: IntradayTickEntry
): Promise<IntradayReportPayload> {
  const existing = await getBoardReport<IntradayReportPayload>(userId, "intraday", reportDate);
  const prevEntries = existing?.entries || [];
  // 同一分钟不重复追加，替换为最新快照；最多保留 60 条
  const filtered = prevEntries.filter((e) => e.tick_time.slice(0, 5) !== entry.tick_time.slice(0, 5));
  const updated: IntradayReportPayload = {
    report_date: reportDate,
    updated_at: new Date().toISOString(),
    latest_sentiment_score: entry.traffic_light.score,
    entries: [entry, ...filtered].slice(0, 60),
  };
  await upsertBoardReport(userId, "intraday", reportDate, updated);
  return updated;
}

export async function appendAnomalyRecord(
  userId: string,
  reportDate: string,
  record: AnomalyAnalysisRecord
): Promise<AnomalyReportPayload> {
  const existing = await getBoardReport<AnomalyReportPayload>(userId, "anomaly", reportDate);
  const prev = existing?.records || [];
  const updated: AnomalyReportPayload = {
    report_date: reportDate,
    updated_at: new Date().toISOString(),
    records: [record, ...prev].slice(0, 40),
  };
  await upsertBoardReport(userId, "anomaly", reportDate, updated);
  return updated;
}

export async function getFullDailyBoard(userId: string, reportDate = getShanghaiDateStr()) {
  await ensureResearchReportsTable();
  const [premarket, intraday, postmarket, anomaly, dateRows] = await Promise.all([
    getBoardReport<PremarketReportPayload>(userId, "premarket", reportDate),
    getBoardReport<IntradayReportPayload>(userId, "intraday", reportDate),
    getBoardReport<PostmarketReportPayload>(userId, "postmarket", reportDate),
    getBoardReport<AnomalyReportPayload>(userId, "anomaly", reportDate),
    executeQuery<{ report_date: unknown }>(
      `SELECT DISTINCT DATE_FORMAT(report_date, '%Y-%m-%d') AS report_date
       FROM user_research_reports
       WHERE user_id=? AND report_type IN ('premarket','intraday','postmarket','anomaly')
       ORDER BY report_date DESC
       LIMIT 30`,
      [userId]
    ),
  ]);

  const dateSet = new Set<string>([getShanghaiDateStr(), reportDate]);
  for (const r of dateRows || []) {
    if (r.report_date) dateSet.add(String(r.report_date).slice(0, 10));
  }

  return {
    report_date: reportDate,
    available_dates: [...dateSet].sort((a, b) => (a > b ? -1 : 1)),
    premarket,
    intraday,
    postmarket,
    anomaly,
  };
}
