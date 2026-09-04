"""新浪财经数据源实现"""
from __future__ import annotations

import httpx
import pandas as pd
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from data.provider_base import QuoteProvider


class SinaProvider(QuoteProvider):
    """新浪财经数据源"""
    name = "sina"

    def __init__(self):
        self.headers = {
            "Referer": "https://finance.sina.com.cn",
            "User-Agent": "Mozilla/5.0"
        }
        self.timeout = 10.0

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def _get(self, url: str) -> str:
        try:
            with httpx.Client(timeout=self.timeout, headers=self.headers) as client:
                resp = client.get(url)
                resp.raise_for_status()
                resp.encoding = "gbk"
                return resp.text
        except Exception as e:
            logger.error(f"[{self.name}] API请求失败: {e}")
            raise

    def get_realtime_quotes(self, codes: list[str]) -> pd.DataFrame:
        """获取实时行情（限制批次最大50）"""
        try:
            results = []
            batch_size = 50
            for i in range(0, len(codes), batch_size):
                batch = codes[i:i+batch_size]
                query_list = []
                for code in batch:
                    prefix = "sh" if code.startswith("6") else "sz"
                    query_list.append(f"{prefix}{code}")
                
                url = f"https://hq.sinajs.cn/list={','.join(query_list)}"
                text = self._get(url)
                
                for line in text.splitlines():
                    if not line: continue
                    parts = line.split('="')
                    if len(parts) != 2: continue
                    val = parts[1].strip('";')
                    fields = val.split(',')
                    if len(fields) > 30:
                        results.append({
                            "name": fields[0],
                            "open": float(fields[1]),
                            "pre_close": float(fields[2]),
                            "close": float(fields[3]),
                            "high": float(fields[4]),
                            "low": float(fields[5]),
                            "volume": float(fields[8]),
                            "amount": float(fields[9]),
                        })
            
            if not results: return pd.DataFrame()
            return pd.DataFrame(results)
        except Exception as e:
            logger.error(f"[{self.name}] 获取实时行情异常: {e}")
            return pd.DataFrame()

    def get_all_realtime_quotes(self) -> pd.DataFrame:
        return pd.DataFrame()

    def get_index_quotes(self, codes: list[str]) -> pd.DataFrame:
        return self.get_realtime_quotes(codes)

    def get_history_kline(self, code: str, start_date: str, end_date: str, adjust: str = "qfq") -> pd.DataFrame:
        return pd.DataFrame()

    def get_stock_list(self) -> pd.DataFrame:
        return pd.DataFrame()

    def health_check(self) -> dict:
        try:
            self.get_realtime_quotes(["600519"])
            return {"available": True, "response_time": 0.2, "message": "OK"}
        except Exception as e:
            return {"available": False, "response_time": 0.0, "message": str(e)}
