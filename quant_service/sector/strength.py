import pandas as pd
import numpy as np
from loguru import logger
from typing import Dict, Any

class SectorStrengthAnalyzer:
    """板块强度分析器"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config.get('sector', {})
        self.strength_periods = self.config.get('strength_periods', [1, 5, 20])
        
    def analyze(self, df: pd.DataFrame) -> float:
        """
        分析板块强度评分 (0~100)
        :param df: 包含板块涨跌幅，成交额，涨停数量的 DataFrame
        :return: 强度评分
        """
        try:
            if df is None or df.empty:
                return 50.0
                
            score = 50.0
            latest = df.iloc[-1]
            change_pct = latest.get('change_pct', 0.0)
            limit_up_count = latest.get('limit_up_count', 0)
            
            if change_pct > 0.02:
                score += 20.0
            elif change_pct < -0.02:
                score -= 20.0
                
            if limit_up_count > 5:
                score += 20.0
                
            return float(np.clip(score, 0.0, 100.0))
            
        except Exception as e:
            logger.error(f"板块强度分析异常: {e}")
            return 50.0
