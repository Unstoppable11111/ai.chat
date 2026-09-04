"""SQLite 数据库管理模块

负责数据库初始化、表创建、基础 CRUD 操作。
同一天同一股票同一时间重复执行不会重复插入（UNIQUE 约束 + INSERT OR REPLACE）。
"""
from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Optional

import pandas as pd
from loguru import logger

# 建表 SQL
_SCHEMA_SQL = """
-- 市场快照
CREATE TABLE IF NOT EXISTS market_snapshot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_date TEXT NOT NULL,
    snapshot_time TEXT NOT NULL,
    mode TEXT NOT NULL,
    market_score REAL, market_state TEXT, market_style TEXT,
    confidence TEXT, suggested_position TEXT,
    trend_score REAL, breadth_score REAL, liquidity_score REAL,
    sentiment_score REAL, mainline_score REAL, consistency_score REAL,
    high_level_risk_score REAL,
    total_amount REAL, up_count INTEGER, down_count INTEGER,
    limit_up_count INTEGER, limit_down_count INTEGER,
    model_version TEXT, data_quality TEXT, source TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(market_date, mode)
);

-- 指数快照
CREATE TABLE IF NOT EXISTS index_snapshot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_date TEXT NOT NULL, snapshot_time TEXT NOT NULL,
    code TEXT NOT NULL, name TEXT,
    close REAL, open REAL, high REAL, low REAL,
    volume REAL, amount REAL, change_pct REAL,
    ma5 REAL, ma10 REAL, ma20 REAL, ma60 REAL,
    source TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(market_date, code, snapshot_time)
);

-- 板块快照
CREATE TABLE IF NOT EXISTS sector_snapshot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_date TEXT NOT NULL,
    sector_code TEXT NOT NULL, sector_name TEXT NOT NULL,
    sector_type TEXT, change_pct REAL, amount REAL,
    up_count INTEGER, down_count INTEGER, limit_up_count INTEGER,
    strength_score REAL, diffusion_score REAL, persistence_score REAL,
    rank_1d INTEGER, rank_5d INTEGER, rank_20d INTEGER,
    source TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(market_date, sector_code)
);

-- 股票快照
CREATE TABLE IF NOT EXISTS stock_snapshot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_date TEXT NOT NULL, code TEXT NOT NULL, name TEXT,
    close REAL, open REAL, high REAL, low REAL,
    volume REAL, amount REAL, turnover REAL, change_pct REAL,
    total_score REAL, trend_score REAL, momentum_score REAL,
    volume_price_score REAL, position_score REAL,
    crowding_score REAL, entry_score REAL,
    rs_1d REAL, rs_5d REAL, rs_20d REAL, rs_60d REAL,
    trend_stage TEXT, sector TEXT, mainline TEXT,
    source TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(market_date, code)
);

-- 持仓快照
CREATE TABLE IF NOT EXISTS portfolio_snapshot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_date TEXT NOT NULL, code TEXT NOT NULL, name TEXT,
    quantity INTEGER, cost_price REAL, current_price REAL,
    market_value REAL, weight REAL, pnl REAL, pnl_pct REAL,
    hold_type TEXT, hold_score REAL, action TEXT, mainline TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(market_date, code)
);

-- 候选股
CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_date TEXT NOT NULL, code TEXT NOT NULL, name TEXT,
    category TEXT, total_score REAL, entry_score REAL,
    mainline_score REAL, crowding_score REAL,
    recommended_level TEXT, current_price REAL,
    support_price REAL, resistance_price REAL,
    stop_loss_price REAL, suggested_weight REAL,
    risk_level TEXT, reason TEXT, model_version TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(market_date, code)
);

-- 信号记录
CREATE TABLE IF NOT EXISTS signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    signal_date TEXT NOT NULL, signal_type TEXT NOT NULL,
    signal_name TEXT, signal_value TEXT, confidence TEXT,
    model_version TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 未来收益跟踪
CREATE TABLE IF NOT EXISTS forward_returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    signal_date TEXT NOT NULL, code TEXT NOT NULL,
    signal_price REAL,
    t1_return REAL, t3_return REAL, t5_return REAL, t10_return REAL,
    max_up REAL, max_down REAL,
    updated_at TEXT,
    UNIQUE(signal_date, code)
);

-- 数据质量记录
CREATE TABLE IF NOT EXISTS data_quality (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    check_date TEXT NOT NULL, check_time TEXT NOT NULL,
    source TEXT, data_type TEXT, status TEXT,
    stock_count INTEGER, missing_count INTEGER, anomaly_count INTEGER,
    detail TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 历史K线缓存
CREATE TABLE IF NOT EXISTS kline_daily (
    code TEXT NOT NULL,
    trade_date TEXT NOT NULL,
    open REAL, high REAL, low REAL, close REAL,
    volume REAL, amount REAL, turnover REAL,
    adjust_flag TEXT DEFAULT 'qfq',
    source TEXT,
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    PRIMARY KEY (code, trade_date, adjust_flag)
);

-- 交易日历
CREATE TABLE IF NOT EXISTS trading_calendar (
    trade_date TEXT PRIMARY KEY,
    is_trading_day INTEGER NOT NULL,
    source TEXT,
    updated_at TEXT
);

-- 模型版本
CREATE TABLE IF NOT EXISTS model_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL, config_hash TEXT, description TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_kline_code ON kline_daily(code);
CREATE INDEX IF NOT EXISTS idx_kline_date ON kline_daily(trade_date);
CREATE INDEX IF NOT EXISTS idx_stock_snapshot_date ON stock_snapshot(market_date);
CREATE INDEX IF NOT EXISTS idx_candidates_date ON candidates(market_date);
CREATE INDEX IF NOT EXISTS idx_forward_returns_date ON forward_returns(signal_date);
"""


class Database:
    """SQLite 数据库管理器"""

    def __init__(self, db_path: str = "database/a_stock.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn: Optional[sqlite3.Connection] = None
        self._init_db()

    def _init_db(self) -> None:
        """初始化数据库，创建所有表"""
        conn = self.get_connection()
        conn.executescript(_SCHEMA_SQL)
        conn.commit()
        logger.info(f"数据库初始化完成 | 路径: {self.db_path.resolve()}")

    def get_connection(self) -> sqlite3.Connection:
        """获取数据库连接"""
        if self._conn is None:
            self._conn = sqlite3.connect(
                str(self.db_path),
                check_same_thread=False,
                timeout=30,
            )
            self._conn.row_factory = sqlite3.Row
            # 开启 WAL 模式提升并发性能
            self._conn.execute("PRAGMA journal_mode=WAL")
            self._conn.execute("PRAGMA synchronous=NORMAL")
        return self._conn

    def execute(self, sql: str, params: tuple = ()) -> sqlite3.Cursor:
        """执行 SQL"""
        conn = self.get_connection()
        try:
            cursor = conn.execute(sql, params)
            conn.commit()
            return cursor
        except sqlite3.Error as e:
            logger.error(f"SQL 执行失败: {e} | SQL: {sql[:200]}")
            raise

    def execute_many(self, sql: str, params_list: list[tuple]) -> None:
        """批量执行 SQL"""
        conn = self.get_connection()
        try:
            conn.executemany(sql, params_list)
            conn.commit()
        except sqlite3.Error as e:
            logger.error(f"批量 SQL 执行失败: {e} | SQL: {sql[:200]}")
            raise

    def query_df(self, sql: str, params: tuple = ()) -> pd.DataFrame:
        """查询并返回 DataFrame"""
        conn = self.get_connection()
        try:
            return pd.read_sql_query(sql, conn, params=params)
        except Exception as e:
            logger.error(f"查询失败: {e} | SQL: {sql[:200]}")
            return pd.DataFrame()

    def save_df(self, df: pd.DataFrame, table: str,
                if_exists: str = "append") -> int:
        """保存 DataFrame 到表

        Args:
            df: 要保存的数据
            table: 表名
            if_exists: "append" / "replace"

        Returns:
            写入行数
        """
        if df.empty:
            return 0
        conn = self.get_connection()
        try:
            rows = df.to_sql(table, conn, if_exists=if_exists, index=False)
            conn.commit()
            return rows if rows else len(df)
        except sqlite3.IntegrityError:
            # UNIQUE 约束冲突，逐行 INSERT OR REPLACE
            logger.debug(f"批量写入触发唯一约束，改用逐行 upsert | 表: {table}")
            return self._upsert_df(df, table)
        except Exception as e:
            logger.error(f"保存 DataFrame 失败: {e} | 表: {table}")
            return 0

    def _upsert_df(self, df: pd.DataFrame, table: str) -> int:
        """逐行 INSERT OR REPLACE"""
        conn = self.get_connection()
        cols = ", ".join(df.columns)
        placeholders = ", ".join(["?"] * len(df.columns))
        sql = f"INSERT OR REPLACE INTO {table} ({cols}) VALUES ({placeholders})"
        rows = 0
        for _, row in df.iterrows():
            try:
                conn.execute(sql, tuple(row))
                rows += 1
            except sqlite3.Error as e:
                logger.warning(f"Upsert 失败: {e} | 行: {dict(row)}")
        conn.commit()
        return rows

    def save_kline(self, code: str, df: pd.DataFrame,
                   adjust: str = "qfq") -> int:
        """保存K线数据（增量更新）"""
        if df.empty:
            return 0
        df = df.copy()
        df["code"] = code
        df["adjust_flag"] = adjust
        return self.save_df(df, "kline_daily")

    def get_kline(self, code: str, start_date: str = "",
                  end_date: str = "", adjust: str = "qfq") -> pd.DataFrame:
        """读取K线缓存"""
        sql = "SELECT * FROM kline_daily WHERE code = ? AND adjust_flag = ?"
        params: list = [code, adjust]
        if start_date:
            sql += " AND trade_date >= ?"
            params.append(start_date)
        if end_date:
            sql += " AND trade_date <= ?"
            params.append(end_date)
        sql += " ORDER BY trade_date"
        return self.query_df(sql, tuple(params))

    def get_latest_kline_date(self, code: str,
                              adjust: str = "qfq") -> Optional[str]:
        """获取某只股票最新缓存K线日期"""
        result = self.execute(
            "SELECT MAX(trade_date) FROM kline_daily "
            "WHERE code = ? AND adjust_flag = ?",
            (code, adjust),
        ).fetchone()
        return result[0] if result and result[0] else None

    def close(self) -> None:
        """关闭数据库连接"""
        if self._conn:
            self._conn.close()
            self._conn = None
            logger.debug("数据库连接已关闭")
