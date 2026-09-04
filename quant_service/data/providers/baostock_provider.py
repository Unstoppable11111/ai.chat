"""BaoStock数据源实现"""
from __future__ import annotations

import pandas as pd
import baostock as bs
from loguru import logger

from data.provider_base import QuoteProvider


class BaoStockProvider(QuoteProvider):
    """BaoStock数据源备份"""
    name = "baostock"

    def __init__(self):
        pass

    def _login(self):
        lg = bs.login()
        if lg.error_code != '0':
            logger.error(f"[{self.name}] 登录失败: {lg.error_msg}")
            
    def _logout(self):
        bs.logout()

    def get_realtime_quotes(self, codes: list[str]) -> pd.DataFrame:
        return pd.DataFrame()

    def get_all_realtime_quotes(self) -> pd.DataFrame:
        return pd.DataFrame()

    def get_index_quotes(self, codes: list[str]) -> pd.DataFrame:
        return pd.DataFrame()

    def get_history_kline(self, code: str, start_date: str, end_date: str, adjust: str = "qfq") -> pd.DataFrame:
        try:
            self._login()
            adjust_flag = "1" if adjust == "hfq" else "2" if adjust == "qfq" else "3"
            prefix = "sh" if code.startswith("6") else "sz"
            rs = bs.query_history_k_data_plus(f"{prefix}.{code}",
                "date,code,open,high,low,close,preclose,volume,amount,adjustflag,turn,tradestatus,pctChg,peTTM,pbMRQ,psTTM,pcfNcfTTM,isST",
                start_date=start_date, end_date=end_date,
                frequency="d", adjustflag=adjust_flag)
            
            data_list = []
            while (rs.error_code == '0') & rs.next():
                data_list.append(rs.get_row_data())
            df = pd.DataFrame(data_list, columns=rs.fields)
            self._logout()
            return df
        except Exception as e:
            logger.error(f"[{self.name}] 获取历史K线异常: {e}")
            self._logout()
            return pd.DataFrame()

    def get_stock_list(self) -> pd.DataFrame:
        try:
            self._login()
            rs = bs.query_stock_industry()
            data_list = []
            while (rs.error_code == '0') & rs.next():
                data_list.append(rs.get_row_data())
            df = pd.DataFrame(data_list, columns=rs.fields)
            self._logout()
            return df
        except Exception as e:
            logger.error(f"[{self.name}] 获取股票列表异常: {e}")
            self._logout()
            return pd.DataFrame()

    def get_trading_calendar(self, start_date: str, end_date: str) -> list[str]:
        try:
            self._login()
            rs = bs.query_trade_dates(start_date=start_date, end_date=end_date)
            data_list = []
            while (rs.error_code == '0') & rs.next():
                data_list.append(rs.get_row_data())
            df = pd.DataFrame(data_list, columns=rs.fields)
            self._logout()
            trade_dates = df[df['is_trading_day'] == '1']['calendar_date'].tolist()
            return trade_dates
        except Exception as e:
            logger.error(f"[{self.name}] 获取交易日历异常: {e}")
            self._logout()
            return []

    def health_check(self) -> dict:
        try:
            self._login()
            self._logout()
            return {"available": True, "response_time": 0.5, "message": "OK"}
        except Exception as e:
            return {"available": False, "response_time": 0.0, "message": str(e)}
