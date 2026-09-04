"""量价健康度"""
from __future__ import annotations
import pandas as pd
from loguru import logger

class VolumePriceAnalyzer:
    def __init__(self, ctx):
        self.ctx = ctx
        
    def analyze(self, code: str, klines: pd.DataFrame) -> float:
        if klines is None or len(klines) < 20: return 50.0
        try:
            vol_ma20 = klines['volume'].rolling(20).mean().iloc[-1]
            curr_vol = klines['volume'].iloc[-1]
            curr_ret = klines['change_pct'].iloc[-1]
            if curr_ret > 0 and curr_vol > vol_ma20 * 1.5: return 80.0
            elif curr_ret < 0 and curr_vol < vol_ma20 * 0.8: return 70.0
            elif curr_ret < 0 and curr_vol > vol_ma20 * 1.5: return 20.0
            else: return 50.0
        except Exception as e:
            logger.error(f"量价分析异常 {code}: {e}")
            return 50.0