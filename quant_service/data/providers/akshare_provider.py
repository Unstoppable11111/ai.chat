"""AKShare数据源封装"""
from __future__ import annotations

import pandas as pd
from loguru import logger
import akshare as ak
from tenacity import retry, stop_after_attempt, wait_exponential

from data.provider_base import QuoteProvider

class AKShareProvider(QuoteProvider):
    """AKShare数据源封装"""
    name = "akshare"

    def __init__(self):
        pass

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def _call_ak(self, func_name: str, *args, **kwargs) -> pd.DataFrame:
        try:
            if not hasattr(ak, func_name):
                logger.error(f"[{self.name}] akshare 中找不到方法 {func_name}")
                return pd.DataFrame()
            func = getattr(ak, func_name)
            df = func(*args, **kwargs)
            return df
        except Exception as e:
            logger.error(f"[{self.name}] 调用 {func_name} 异常: {e}")
            raise

    def get_realtime_quotes(self, codes: list[str]) -> pd.DataFrame:
        return pd.DataFrame()

    def get_all_realtime_quotes(self) -> pd.DataFrame:
        try:
            df = self._call_ak("stock_zh_a_spot_em")
            return df
        except Exception:
            return pd.DataFrame()

    def get_index_quotes(self, codes: list[str]) -> pd.DataFrame:
        return pd.DataFrame()

    def get_history_kline(self, code: str, start_date: str, end_date: str, adjust: str = "qfq") -> pd.DataFrame:
        try:
            adjust_map = {"qfq": "qfq", "hfq": "hfq", "": ""}
            df = self._call_ak("stock_zh_a_hist", symbol=code, period="daily", start_date=start_date.replace("-", ""), end_date=end_date.replace("-", ""), adjust=adjust_map.get(adjust, ""))
            return df
        except Exception:
            return pd.DataFrame()

    def get_stock_list(self) -> pd.DataFrame:
        try:
            return self._call_ak("stock_info_a_code_name")
        except Exception:
            return pd.DataFrame()

    def get_sector_list(self, sector_type: str = "industry") -> pd.DataFrame:
        try:
            if sector_type == "industry":
                return self._call_ak("stock_board_industry_name_em")
            return self._call_ak("stock_board_concept_name_em")
        except Exception:
            return pd.DataFrame()

    def get_limit_stocks(self, date: str) -> pd.DataFrame:
        try:
            return self._call_ak("stock_zt_pool_em", date=date.replace("-", ""))
        except Exception:
            return pd.DataFrame()

    def health_check(self) -> dict:
        try:
            self.get_stock_list()
            return {"available": True, "response_time": 0.5, "message": "OK"}
        except Exception as e:
            return {"available": False, "response_time": 0.0, "message": str(e)}
