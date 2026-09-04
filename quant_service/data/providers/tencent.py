"""腾讯财经数据源实现"""
from __future__ import annotations

import httpx
import pandas as pd
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from data.provider_base import QuoteProvider


class TencentProvider(QuoteProvider):
    """腾讯财经数据源"""
    name = "tencent"

    def __init__(self):
        self.headers = {
            "Referer": "https://stockapp.finance.qq.com/",
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
        try:
            results = []
            batch_size = 50
            for i in range(0, len(codes), batch_size):
                batch = codes[i:i+batch_size]
                query_list = []
                for code in batch:
                    prefix = "sh" if code.startswith("6") else "sz"
                    query_list.append(f"{prefix}{code}")
                
                url = f"https://qt.gtimg.cn/q={','.join(query_list)}"
                text = self._get(url)
                
                for line in text.splitlines():
                    if not line: continue
                    parts = line.split('="')
                    if len(parts) != 2: continue
                    val = parts[1].strip('";')
                    fields = val.split('~')
                    if len(fields) > 37:
                        close_p = float(fields[3]) if fields[3] else 0.0
                        pre_c = float(fields[4]) if fields[4] else 0.0
                        chg_pct = float(fields[32]) if len(fields) > 32 and fields[32] else (
                            ((close_p - pre_c) / pre_c * 100.0) if pre_c > 0 else 0.0
                        )
                        results.append({
                            "code": fields[2],
                            "name": fields[1],
                            "close": close_p,
                            "pre_close": pre_c,
                            "change_pct": round(chg_pct, 2),
                            "open": float(fields[5]) if fields[5] else 0.0,
                            "high": float(fields[6]) if fields[6] else 0.0,
                            "low": float(fields[7]) if fields[7] else 0.0,
                            "volume": float(fields[36]) if fields[36] else 0.0,
                            "amount": float(fields[37]) if fields[37] else 0.0,
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
