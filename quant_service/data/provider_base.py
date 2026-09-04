"""数据源抽象基类

所有数据源必须实现此接口，确保可替换性。
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

import pandas as pd


class QuoteProvider(ABC):
    """数据源统一接口

    所有数据源（东方财富/新浪/腾讯/AKShare/BaoStock/缓存）
    都必须继承此基类并实现相应方法。
    """

    name: str = "base"

    @abstractmethod
    def get_realtime_quotes(self, codes: list[str]) -> pd.DataFrame:
        """获取实时行情

        Args:
            codes: 股票代码列表，如 ["600519", "000001"]

        Returns:
            DataFrame，至少包含:
            code, name, close, open, high, low, pre_close,
            volume, amount, change_pct, turnover
        """
        ...

    @abstractmethod
    def get_all_realtime_quotes(self) -> pd.DataFrame:
        """获取全市场实时行情快照

        Returns:
            DataFrame，字段同 get_realtime_quotes
        """
        ...

    @abstractmethod
    def get_index_quotes(self, codes: list[str]) -> pd.DataFrame:
        """获取指数行情

        Args:
            codes: 指数代码列表，如 ["000001", "399001", "399006"]

        Returns:
            DataFrame: code, name, close, open, high, low, volume, amount, change_pct
        """
        ...

    @abstractmethod
    def get_history_kline(self, code: str, start_date: str, end_date: str,
                          adjust: str = "qfq") -> pd.DataFrame:
        """获取历史K线

        Args:
            code: 股票代码
            start_date: 开始日期 "YYYY-MM-DD"
            end_date: 结束日期 "YYYY-MM-DD"
            adjust: 复权类型 qfq=前复权, hfq=后复权, ""=不复权

        Returns:
            DataFrame: trade_date, open, high, low, close, volume, amount, turnover
        """
        ...

    @abstractmethod
    def get_stock_list(self) -> pd.DataFrame:
        """获取股票列表

        Returns:
            DataFrame: code, name, market, board, industry, list_date
        """
        ...

    def get_sector_list(self, sector_type: str = "industry") -> pd.DataFrame:
        """获取板块列表

        Args:
            sector_type: "industry" 行业板块 / "concept" 概念板块

        Returns:
            DataFrame: code, name, sector_type, change_pct, amount
        """
        return pd.DataFrame()

    def get_sector_stocks(self, sector_code: str) -> pd.DataFrame:
        """获取板块成分股

        Args:
            sector_code: 板块代码

        Returns:
            DataFrame: code, name, change_pct, amount
        """
        return pd.DataFrame()

    def get_limit_stocks(self, date: str) -> pd.DataFrame:
        """获取涨跌停数据

        Args:
            date: 日期 "YYYY-MM-DD"

        Returns:
            DataFrame: code, name, change_pct, limit_type(涨停/跌停),
                      first_limit_time, last_limit_time, open_count(开板次数)
        """
        return pd.DataFrame()

    def get_financial_data(self, code: str) -> pd.DataFrame:
        """获取财务数据

        Args:
            code: 股票代码

        Returns:
            DataFrame: report_date, revenue, net_profit, deducted_profit,
                      roe, gross_margin, net_margin, debt_ratio, ocf
        """
        return pd.DataFrame()

    def get_trading_calendar(self, start_date: str,
                             end_date: str) -> list[str]:
        """获取交易日历

        Args:
            start_date: 开始日期
            end_date: 结束日期

        Returns:
            交易日列表 ["YYYY-MM-DD", ...]
        """
        return []

    @abstractmethod
    def health_check(self) -> dict:
        """健康检查

        Returns:
            {
                "available": bool,
                "response_time": float (seconds),
                "message": str,
            }
        """
        ...
