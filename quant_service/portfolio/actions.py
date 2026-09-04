"""操作建议与交易剧本"""
from __future__ import annotations
from typing import Any
from loguru import logger
from data.storage.models import TradingScenario


class ActionGenerator:
    def __init__(self, config_or_ctx):
        self.config = config_or_ctx

    def generate_scenario(self, market_result=None, mainlines=None) -> TradingScenario:
        """根据当前市场和主线生成4类情景交易剧本"""
        try:
            m_state = getattr(market_result, 'market_state', '震荡')
            top_line = mainlines[0].sector_name if mainlines else "科技主线"
            
            return TradingScenario(
                base_case=f"市场处于【{m_state}】结构，资金向【{top_line}】等核心方向抱团，以持股与缩量均线低吸为主。",
                bull_case=f"若全A量能显著放大，主线【{top_line}】扩散至上下游补涨标的，则果断提高进攻仓位。",
                bear_case="若午后高位股炸板率上升或成交缩水跌破均线，主动兑现利润，不盲目追高开新仓。",
                risk_case="若指数单日长阴破位且连板股集体跌停，触发全面防守，严格执行止损纪律。"
            )
        except Exception as e:
            logger.error(f"剧本生成异常: {e}")
            return TradingScenario(base_case="持股观望", bull_case="加仓", bear_case="减仓", risk_case="清仓")

    def generate(self) -> TradingScenario:
        return self.generate_scenario()