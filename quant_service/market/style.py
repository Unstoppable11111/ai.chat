import pandas as pd
from loguru import logger
from typing import Dict, Any, Tuple

class StyleAnalyzer:
    """市场风格识别"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        
    def analyze(self, df: pd.DataFrame) -> Tuple[str, str, str]:
        """
        识别市场风格
        :param df: 包含各风格板块涨跌幅数据的 DataFrame
        :return: (主风格, 次风格, 风险风格)
        """
        try:
            if df is None or df.empty:
                logger.warning("风格数据为空，返回默认风格")
                return "未知", "未知", "未知"
                
            # 简化版：按照当日涨跌幅排序
            latest = df.iloc[-1].to_dict()
            sorted_styles = sorted(latest.items(), key=lambda x: x[1], reverse=True)
            
            main_style = sorted_styles[0][0] if len(sorted_styles) > 0 else "未知"
            sub_style = sorted_styles[1][0] if len(sorted_styles) > 1 else "未知"
            risk_style = sorted_styles[-1][0] if len(sorted_styles) > 0 else "未知"
            
            return main_style, sub_style, risk_style
            
        except Exception as e:
            logger.error(f"风格识别异常: {e}")
            return "未知", "未知", "未知"
