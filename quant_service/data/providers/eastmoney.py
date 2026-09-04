"""东方财富数据源实现"""
from __future__ import annotations

import time
import httpx
import pandas as pd
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from data.provider_base import QuoteProvider


class EastMoneyProvider(QuoteProvider):
    """东方财富行情数据源"""
    
    name = "eastmoney"

    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "http://quote.eastmoney.com/",
            "Accept": "*/*",
        }
        self.timeout = 15.0

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=5))
    def _get(self, url: str, params: dict = None) -> dict:
        try:
            with httpx.Client(timeout=self.timeout, headers=self.headers, trust_env=False) as client:
                resp = client.get(url, params=params)
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error(f"[{self.name}] API请求失败: {e}")
            raise

    def get_all_realtime_quotes(self) -> pd.DataFrame:
        """获取全市场实时行情快照"""
        try:
            url = "http://push2.eastmoney.com/api/qt/clist/get"
            params = {
                "pn": 1,
                "pz": 6000,
                "po": 1,
                "np": 1,
                "fltt": 2,
                "invt": 2,
                "fs": "m:0 t:6,m:0 t:80,m:1 t:2,m:1 t:23,m:0 t:81 s:2048",
                "fields": "f12,f14,f2,f3,f4,f5,f6,f15,f16,f17,f18,f8"
            }
            data = self._get(url, params)
            if data and data.get("data") and data["data"].get("diff"):
                df = pd.DataFrame(data["data"]["diff"])
                rename_map = {
                    "f12": "code", "f14": "name", "f2": "close", "f3": "change_pct",
                    "f4": "change", "f5": "volume", "f6": "amount", "f15": "high",
                    "f16": "low", "f17": "open", "f18": "pre_close", "f8": "turnover"
                }
                df = df.rename(columns=rename_map)
                for col in ["close", "change_pct", "change", "volume", "amount", "high", "low", "open", "pre_close", "turnover"]:
                    if col in df.columns:
                        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
                return df
            return pd.DataFrame()
        except Exception as e:
            logger.error(f"[{self.name}] 获取全市场行情异常: {e}")
            return pd.DataFrame()

    def get_realtime_quotes(self, codes: list[str]) -> pd.DataFrame:
        """获取批量实时行情"""
        try:
            results = []
            batch_size = 50
            for i in range(0, len(codes), batch_size):
                batch = codes[i:i+batch_size]
                secids = []
                for code in batch:
                    secid = f"1.{code}" if code.startswith("6") else f"0.{code}"
                    secids.append(secid)
                
                url = "http://push2.eastmoney.com/api/qt/ulist/get"
                params = {
                    "secids": ",".join(secids),
                    "fields": "f12,f14,f2,f3,f4,f5,f6,f15,f16,f17,f18,f8"
                }
                data = self._get(url, params)
                if data and data.get("data") and data["data"].get("diff"):
                    results.extend(data["data"]["diff"])
                time.sleep(0.05)
            
            if not results:
                return pd.DataFrame()
                
            df = pd.DataFrame(results)
            rename_map = {
                "f12": "code", "f14": "name", "f2": "close", "f3": "change_pct",
                "f4": "change", "f5": "volume", "f6": "amount", "f15": "high",
                "f16": "low", "f17": "open", "f18": "pre_close", "f8": "turnover"
            }
            df = df.rename(columns=rename_map)
            for col in ["close", "change_pct", "change", "volume", "amount", "high", "low", "open", "pre_close", "turnover"]:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
            return df
        except Exception as e:
            logger.error(f"[{self.name}] 获取实时行情异常: {e}")
            return pd.DataFrame()

    def get_index_quotes(self, codes: list[str]) -> pd.DataFrame:
        """获取指数行情"""
        try:
            secids = []
            for code in codes:
                if code in ("000001", "000688"):
                    secids.append(f"1.{code}")
                else:
                    secids.append(f"0.{code}")
            url = "http://push2.eastmoney.com/api/qt/ulist/get"
            params = {
                "secids": ",".join(secids),
                "fields": "f12,f14,f2,f3,f4,f5,f6,f15,f16,f17,f18,f8"
            }
            data = self._get(url, params)
            if data and data.get("data") and data["data"].get("diff"):
                df = pd.DataFrame(data["data"]["diff"])
                rename_map = {
                    "f12": "code", "f14": "name", "f2": "close", "f3": "change_pct",
                    "f4": "change", "f5": "volume", "f6": "amount", "f15": "high",
                    "f16": "low", "f17": "open", "f18": "pre_close", "f8": "turnover"
                }
                df = df.rename(columns=rename_map)
                for col in ["close", "change_pct", "change", "volume", "amount", "high", "low", "open", "pre_close", "turnover"]:
                    if col in df.columns:
                        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
                return df
            return pd.DataFrame()
        except Exception as e:
            logger.error(f"[{self.name}] 获取指数行情异常: {e}")
            return pd.DataFrame()

    def get_history_kline(self, code: str, start_date: str, end_date: str, adjust: str = "qfq") -> pd.DataFrame:
        """获取历史K线"""
        try:
            url = "http://push2his.eastmoney.com/api/qt/stock/kline/get"
            secid = f"1.{code}" if code.startswith("6") else f"0.{code}"
            fqt = 1 if adjust == "qfq" else 2 if adjust == "hfq" else 0
            params = {
                "secid": secid,
                "klt": 101,
                "fqt": fqt,
                "beg": start_date.replace("-", ""),
                "end": end_date.replace("-", ""),
            }
            data = self._get(url, params)
            if data and data.get("data") and data["data"].get("klines"):
                klines = data["data"]["klines"]
                rows = [k.split(",") for k in klines]
                df = pd.DataFrame(rows, columns=["trade_date", "open", "close", "high", "low", "volume", "amount", "turnover"])
                for col in ["open", "close", "high", "low", "volume", "amount", "turnover"]:
                    df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
                return df
            return pd.DataFrame()
        except Exception as e:
            logger.error(f"[{self.name}] 获取历史K线异常: {e}")
            return pd.DataFrame()

    def get_stock_list(self) -> pd.DataFrame:
        return self.get_all_realtime_quotes()

    def get_sector_list(self, sector_type: str = "industry") -> pd.DataFrame:
        """获取行业/概念板块列表"""
        try:
            fs = "m:90 t:2 f:!50" if sector_type == "industry" else "m:90 t:3 f:!50"
            url = "http://push2.eastmoney.com/api/qt/clist/get"
            params = {
                "pn": 1,
                "pz": 100,
                "po": 1,
                "np": 1,
                "fltt": 2,
                "invt": 2,
                "fs": fs,
                "fields": "f12,f14,f2,f3,f4,f5,f6"
            }
            data = self._get(url, params)
            if data and data.get("data") and data["data"].get("diff"):
                df = pd.DataFrame(data["data"]["diff"])
                rename_map = {
                    "f12": "code", "f14": "name", "f2": "close", "f3": "change_pct",
                    "f6": "amount"
                }
                df = df.rename(columns=rename_map)
                df["sector_type"] = sector_type
                for col in ["close", "change_pct", "amount"]:
                    if col in df.columns:
                        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
                return df
            return pd.DataFrame()
        except Exception as e:
            logger.error(f"[{self.name}] 获取板块列表异常: {e}")
            return pd.DataFrame()

    def get_limit_stocks(self, date: str) -> pd.DataFrame:
        return pd.DataFrame()

    def health_check(self) -> dict:
        """健康检查"""
        try:
            url = "http://push2.eastmoney.com/api/qt/clist/get"
            params = {
                "pn": 1, "pz": 5, "po": 1, "np": 1, "fltt": 2, "invt": 2,
                "fs": "m:0 t:6,m:0 t:80,m:1 t:2,m:1 t:23,m:0 t:81 s:2048",
                "fields": "f12,f14,f2,f3"
            }
            start = time.time()
            data = self._get(url, params)
            elapsed = time.time() - start
            if data and data.get("data"):
                return {"available": True, "response_time": elapsed, "message": "OK"}
            return {"available": False, "response_time": elapsed, "message": "无数据"}
        except Exception as e:
            return {"available": False, "response_time": 0.0, "message": str(e)}
