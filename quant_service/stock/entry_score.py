"""买点评分"""
from __future__ import annotations
import pandas as pd
from loguru import logger

class EntryScorer:
    def __init__(self, ctx):
        self.ctx = ctx
        
    def score(self, code: str, klines: pd.DataFrame) -> float:
        if klines is None or len(klines) < 20: return 50.0
        try:
            close = klines['close'].iloc[-1]
            ma20 = klines['close'].rolling(20).mean().iloc[-1]
            if abs(close - ma20)/ma20 < 0.02: return 80.0
            ret_5d = close / klines['close'].iloc[-5] - 1
            if ret_5d > 0.3: return 30.0
            return 60.0
        except Exception as e:
            logger.error(f"买点评分异常 {code}: {e}")
            return 50.0