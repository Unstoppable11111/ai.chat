"""风险引擎"""
from __future__ import annotations
from loguru import logger

class RiskEngine:
    def __init__(self, ctx):
        self.ctx = ctx
        
    def check_stop_loss(self, code: str, price: float, cost: float, klines) -> bool:
        try:
            return price < cost * 0.9
        except Exception as e:
            logger.error(f"止损检查异常: {e}")
            return False