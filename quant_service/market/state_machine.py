from loguru import logger
from typing import Dict, Any, List

class MarketStateMachine:
    """市场状态机"""
    
    def __init__(self, config: Dict[str, Any]):
        state_config = config.get('market_state', {})
        self.thresholds = state_config.get('thresholds', {})
        self.confirmation_days = state_config.get('confirmation_days', 2)
        
    def get_state(self, market_score: float, prev_states: List[str]) -> str:
        """
        根据当前评分和历史状态判定当前市场状态
        :param market_score: 综合评分
        :param prev_states: 历史状态列表，按时间正序
        :return: 当前状态字符串
        """
        try:
            # 根据分数判断当前静态状态
            current_static_state = "未知"
            if market_score >= self.thresholds.get('extreme_bull', 85):
                current_static_state = "极强主升"
            elif market_score >= self.thresholds.get('bull', 72):
                current_static_state = "主升"
            elif market_score >= self.thresholds.get('strong_range', 60):
                current_static_state = "强势震荡"
            elif market_score >= self.thresholds.get('weak_range', 45):
                current_static_state = "弱势震荡"
            elif market_score >= self.thresholds.get('bear', 30):
                current_static_state = "退潮"
            else:
                current_static_state = "极端退潮"
                
            # 状态连续性判断
            if not prev_states:
                return current_static_state
                
            # 检查是否连续 confirmation_days 满足新状态，简化处理直接返回静态
            return current_static_state
            
        except Exception as e:
            logger.error(f"状态机异常: {e}")
            return "未知"
