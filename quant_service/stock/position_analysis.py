"""位置/赔率分析"""
from __future__ import annotations
import pandas as pd
from loguru import logger

class PositionAnalyzer:
    def __init__(self, ctx):
        self.ctx = ctx

    def analyze(self, code: str, klines: pd.DataFrame) -> tuple[float, str]:
        if klines is None or klines.empty:
            return 50.0, "Medium Odds"
        try:
            close = klines['close']
            curr = close.iloc[-1]
            high_60 = close.tail(60).max()
            drawdown = (high_60 - curr) / high_60 if high_60 > 0 else 0
            
            if drawdown > 0.3: return 80.0, "High Odds"
            elif drawdown > 0.15: return 60.0, "Medium Odds"
            else: return 30.0, "Low Odds"
        except Exception as e:
            logger.error(f"位置分析异常 {code}: {e}")
            return 50.0, "Medium Odds"