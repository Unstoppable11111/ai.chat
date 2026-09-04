"""基本面分析"""
from __future__ import annotations
from loguru import logger

class FundamentalsAnalyzer:
    def __init__(self, ctx):
        self.ctx = ctx
        
    def analyze(self, code: str, fund_data: dict) -> float:
        try:
            if not fund_data: return 50.0
            roe = fund_data.get('roe', 0)
            if roe > 15: return 80.0
            elif roe > 5: return 60.0
            else: return 40.0
        except Exception as e:
            logger.error(f"基本面分析异常 {code}: {e}")
            return 50.0