"""仓位引擎"""
from __future__ import annotations
from loguru import logger


class PositionEngine:
    def __init__(self, ctx_or_config):
        if hasattr(ctx_or_config, "get_strategy"):
            self.ctx = ctx_or_config
            self.pos_map = ctx_or_config.get_strategy("position", "state_position_map", default={})
        elif isinstance(ctx_or_config, dict):
            self.ctx = None
            self.pos_map = ctx_or_config.get("position", {}).get("state_position_map", {})
        else:
            self.ctx = None
            self.pos_map = {}

    def calculate(self, market_result=None) -> str:
        """主入口计算方法"""
        state = getattr(market_result, 'market_state', '震荡') if market_result else '震荡'
        return self.calculate_position(state)

    def calculate_position(self, market_state: str) -> str:
        try:
            # 状态映射兼容中文和英文key
            alias_map = {
                "极强主升": "extreme_bull",
                "主升": "bull",
                "强势震荡": "strong_range",
                "弱势震荡": "weak_range",
                "退潮": "bear",
                "极端退潮": "extreme_bear",
            }
            key = alias_map.get(market_state, market_state)
            if key in self.pos_map:
                rng = self.pos_map[key]
                return f"{int(rng[0]*100)}%~{int(rng[1]*100)}%"
            if market_state in ("极强主升", "主升"):
                return "70%~90%"
            elif market_state in ("强势震荡",):
                return "50%~70%"
            elif market_state in ("弱势震荡",):
                return "30%~50%"
            else:
                return "0%~20%"
        except Exception as e:
            logger.error(f"仓位计算异常: {e}")
            return "30%~50%"