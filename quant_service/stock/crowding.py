"""拥挤度分析"""
from __future__ import annotations
import pandas as pd
from loguru import logger

class CrowdingAnalyzer:
    def __init__(self, ctx):
        self.ctx = ctx
        
    def analyze(self, code: str, klines: pd.DataFrame) -> tuple[float, str]:
        if klines is None or klines.empty:
            return 50.0, "正常"
        try:
            ret_5d = klines['close'].iloc[-1] / klines['close'].iloc[-5] - 1 if len(klines)>=5 else 0
            if ret_5d > 0.4: return 90.0, "高度拥挤"
            elif ret_5d > 0.2: return 75.0, "偏拥挤"
            elif ret_5d < -0.1: return 20.0, "低拥挤"
            else: return 50.0, "正常"
        except Exception as e:
            logger.error(f"拥挤度分析异常 {code}: {e}")
            return 50.0, "正常"