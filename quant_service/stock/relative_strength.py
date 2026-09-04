"""相对强度分析"""
from __future__ import annotations
import pandas as pd
from loguru import logger

class RelativeStrengthCalculator:
    def __init__(self, ctx):
        self.ctx = ctx
        
    def calculate(self, stock_pcts: pd.DataFrame, benchmark_pcts: pd.Series) -> pd.Series:
        try:
            excess = stock_pcts.sub(benchmark_pcts, axis=0)
            ranks = excess.rank(pct=True) * 100
            return ranks
        except Exception as e:
            logger.error(f"RS计算异常: {e}")
            return pd.Series(50.0, index=stock_pcts.columns)