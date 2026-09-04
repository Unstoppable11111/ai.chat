"""市场数据标准化"""
from __future__ import annotations

import pandas as pd
from loguru import logger

def normalize_market_data(df: pd.DataFrame, source: str) -> pd.DataFrame:
    """标准化市场/指数数据"""
    if df is None or df.empty:
        return pd.DataFrame()
        
    try:
        df = df.copy()
        # 通用标准化逻辑
        standard_cols = ['code', 'name', 'close', 'open', 'high', 'low', 'volume', 'amount', 'change_pct']
        
        # 将原始数据列映射到标准列
        # 此处可以根据 source 加入特定映射逻辑
        if source == "eastmoney":
            pass
            
        # 补充元信息
        df['data_source'] = source
        df['fetch_time'] = pd.Timestamp.now()
        
        return df
    except Exception as e:
        logger.error(f"标准化市场数据失败 ({source}): {e}")
        return pd.DataFrame()
