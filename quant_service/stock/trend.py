"""个股趋势分析"""
from __future__ import annotations
import pandas as pd
from loguru import logger
from stock.indicators import calc_slope

class StockTrendAnalyzer:
    def __init__(self, ctx):
        self.ctx = ctx
        self.config = ctx.get_strategy("stock_trend", default={})

    def analyze(self, code: str, klines: pd.DataFrame) -> tuple[float, str]:
        if klines is None or len(klines) < 60:
            return 50.0, "震荡"
        try:
            close = klines['close']
            ma20 = close.rolling(20, min_periods=1).mean()
            ma60 = close.rolling(60, min_periods=1).mean()
            curr_close = close.iloc[-1]
            curr_ma20 = ma20.iloc[-1]
            curr_ma60 = ma60.iloc[-1]
            slope_20 = calc_slope(ma20, 20)
            if curr_close > curr_ma20 > curr_ma60 and slope_20 > 0.015:
                if slope_20 > 0.03: return 90.0, "加速"
                return 80.0, "主升"
            elif curr_close > curr_ma20 and curr_ma20 <= curr_ma60:
                return 65.0, "趋势启动"
            elif curr_close < curr_ma20 < curr_ma60:
                return 20.0, "下降趋势"
            elif curr_close < curr_ma20:
                return 40.0, "趋势破坏"
            else:
                return 50.0, "震荡"
        except Exception as e:
            logger.error(f"趋势分析异常 {code}: {e}")
            return 50.0, "震荡"