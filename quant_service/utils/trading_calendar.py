"""交易日历模块

管理A股交易日历，支持节假日、特殊休市日判断。
优先从数据库缓存读取，缓存过期时从数据源更新。
"""
from __future__ import annotations

from datetime import datetime, timedelta, date
from typing import Optional

import pandas as pd
from loguru import logger


class TradingCalendar:
    """交易日历管理器"""

    def __init__(self, db=None):
        self._db = db
        self._cache: list[str] = []

    def load(self, trading_days: Optional[list[str]] = None) -> None:
        """加载交易日历

        Args:
            trading_days: 交易日列表，如果提供则直接使用
        """
        if trading_days:
            self._cache = sorted(trading_days)
            logger.info(f"交易日历已加载 | 共 {len(self._cache)} 个交易日")
            return

        # 从数据库加载
        if self._db:
            df = self._db.query_df(
                "SELECT trade_date FROM trading_calendar "
                "WHERE is_trading_day = 1 ORDER BY trade_date"
            )
            if not df.empty:
                self._cache = df["trade_date"].tolist()
                logger.info(
                    f"从数据库加载交易日历 | 共 {len(self._cache)} 个交易日 "
                    f"| {self._cache[0]} ~ {self._cache[-1]}"
                )
                return

        logger.warning("交易日历为空，将使用简单工作日判断（不含节假日）")

    def save_to_db(self, trading_days: list[str]) -> None:
        """保存交易日历到数据库"""
        if not self._db:
            return
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        params = [(d, 1, "akshare", now) for d in trading_days]
        self._db.execute_many(
            "INSERT OR REPLACE INTO trading_calendar "
            "(trade_date, is_trading_day, source, updated_at) VALUES (?, ?, ?, ?)",
            params,
        )
        self._cache = sorted(trading_days)
        logger.info(f"交易日历已保存到数据库 | 共 {len(trading_days)} 个交易日")

    def is_trading_day(self, date_str: str) -> bool:
        """判断是否为交易日

        Args:
            date_str: "YYYY-MM-DD"
        """
        if self._cache:
            return date_str in self._cache

        # 降级：简单工作日判断（不含节假日）
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            return dt.weekday() < 5  # 周一~周五
        except ValueError:
            return False

    def get_prev_trading_day(self, date_str: str, n: int = 1) -> str:
        """获取前N个交易日

        Args:
            date_str: 基准日期
            n: 前N个交易日
        """
        if self._cache:
            try:
                idx = self._cache.index(date_str)
                target_idx = idx - n
                if target_idx >= 0:
                    return self._cache[target_idx]
            except ValueError:
                # date_str 不在列表中，找最近的前一个
                earlier = [d for d in self._cache if d < date_str]
                if len(earlier) >= n:
                    return earlier[-n]

        # 降级
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        count = 0
        while count < n:
            dt -= timedelta(days=1)
            if dt.weekday() < 5:
                count += 1
        return dt.strftime("%Y-%m-%d")

    def get_next_trading_day(self, date_str: str, n: int = 1) -> str:
        """获取后N个交易日"""
        if self._cache:
            try:
                idx = self._cache.index(date_str)
                target_idx = idx + n
                if target_idx < len(self._cache):
                    return self._cache[target_idx]
            except ValueError:
                later = [d for d in self._cache if d > date_str]
                if len(later) >= n:
                    return later[n - 1]

        dt = datetime.strptime(date_str, "%Y-%m-%d")
        count = 0
        while count < n:
            dt += timedelta(days=1)
            if dt.weekday() < 5:
                count += 1
        return dt.strftime("%Y-%m-%d")

    def get_recent_trading_days(self, date_str: str, n: int = 20) -> list[str]:
        """获取最近N个交易日（含当天）"""
        if self._cache:
            try:
                idx = self._cache.index(date_str)
                start = max(0, idx - n + 1)
                return self._cache[start:idx + 1]
            except ValueError:
                earlier = [d for d in self._cache if d <= date_str]
                return earlier[-n:] if len(earlier) >= n else earlier

        # 降级
        days = []
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        while len(days) < n:
            if dt.weekday() < 5:
                days.append(dt.strftime("%Y-%m-%d"))
            dt -= timedelta(days=1)
        return sorted(days)

    def get_latest_trading_day(self) -> str:
        """获取最近的交易日（今天或之前）"""
        today = datetime.now().strftime("%Y-%m-%d")
        if self.is_trading_day(today):
            return today
        return self.get_prev_trading_day(today, 1)

    @property
    def date_range(self) -> tuple[str, str]:
        """缓存的日期范围"""
        if self._cache:
            return self._cache[0], self._cache[-1]
        return "", ""
