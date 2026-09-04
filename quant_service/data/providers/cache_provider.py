"""本地缓存兜底数据源实现"""
from __future__ import annotations

import pandas as pd
from loguru import logger

from data.provider_base import QuoteProvider
from data.storage.cache import CacheManager


class CacheProvider(QuoteProvider):
    """本地缓存兜底数据源"""
    name = "cache"

    def __init__(self):
        self.cache_manager = CacheManager()

    def _read_from_cache(self, key: str) -> pd.DataFrame:
        try:
            df = self.cache_manager.get(key)
            if df is not None and not df.empty:
                # 标记为缓存且可能过期
                df["is_cached"] = True
                df["is_stale"] = True
                return df
            return pd.DataFrame()
        except Exception:
            return pd.DataFrame()

    def get_realtime_quotes(self, codes: list[str]) -> pd.DataFrame:
        return self._read_from_cache(f"realtime_quotes_{','.join(codes)}")

    def get_all_realtime_quotes(self) -> pd.DataFrame:
        return self._read_from_cache("all_realtime_quotes")

    def get_index_quotes(self, codes: list[str]) -> pd.DataFrame:
        return self._read_from_cache(f"index_quotes_{','.join(codes)}")

    def get_history_kline(self, code: str, start_date: str, end_date: str, adjust: str = "qfq") -> pd.DataFrame:
        return self._read_from_cache(f"history_kline_{code}_{start_date}_{end_date}_{adjust}")

    def get_stock_list(self) -> pd.DataFrame:
        return self._read_from_cache("stock_list")

    def health_check(self) -> dict:
        """永远返回可用"""
        return {"available": True, "response_time": 0.001, "message": "OK"}
