import pandas as pd
from loguru import logger
from typing import Dict, Any, Tuple, List

class ConsistencyAnalyzer:
    """市场一致性分析器"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        
    def analyze(self, current_data: Dict[str, Any]) -> Tuple[float, List[str]]:
        """
        综合各维度判断市场一致性
        :param current_data: 包含指数方向、上涨家数、成交额、情绪等方向字典
        :return: (一致性评分, 冲突列表)
        """
        try:
            score = 50.0
            conflicts = []
            
            trend = current_data.get('trend_up', False)
            breadth = current_data.get('breadth_up', False)
            volume = current_data.get('volume_up', False)
            sentiment = current_data.get('sentiment_up', False)
            
            # 一致性判断逻辑
            up_count = sum([trend, breadth, volume, sentiment])
            
            if up_count == 4:
                score = 90.0
            elif up_count == 3:
                score = 70.0
                conflicts.append("部分指标未共振向上")
            elif up_count == 0:
                score = 10.0
            elif up_count == 1:
                score = 30.0
                conflicts.append("部分指标未共振向下")
            else:
                score = 50.0
                conflicts.append("指标方向分歧严重")
                
            return score, conflicts
            
        except Exception as e:
            logger.error(f"一致性分析异常: {e}")
            return 50.0, ["分析异常"]
