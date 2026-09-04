"""持仓评分"""
from __future__ import annotations
from loguru import logger
from data.storage.models import HoldingItem

class HoldScorer:
    def __init__(self, ctx):
        self.ctx = ctx
        self.thresholds = ctx.get_strategy("hold_action", "thresholds", default={})
        
    def score(self, item: HoldingItem, market_data: dict) -> HoldingItem:
        try:
            item.hold_score = 70.0
            if item.hold_score >= self.thresholds.get("key_hold", 80): item.action = "重点持有"
            elif item.hold_score >= self.thresholds.get("continue_hold", 65): item.action = "继续持有"
            else: item.action = "观察"
            return item
        except Exception as e:
            logger.error(f"持仓评分异常: {e}")
            item.action = "观察"
            return item