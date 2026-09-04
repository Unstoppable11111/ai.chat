"""板块数据标准化"""
from __future__ import annotations

import pandas as pd
from loguru import logger

def normalize_sector_data(df: pd.DataFrame, source: str) -> pd.DataFrame:
    """标准化板块数据"""
    if df is None or df.empty:
        return pd.DataFrame()
        
    try:
        df = df.copy()
        
        standard_cols = ['code', 'name', 'sector_type', 'change_pct', 'amount']
        
        # 补充缺失字段
        for col in standard_cols:
            if col not in df.columns:
                df[col] = None
                
        # 补充元信息
        df['data_source'] = source
        df['fetch_time'] = pd.Timestamp.now()
        
        return df
    except Exception as e:
        logger.error(f"标准化板块数据失败 ({source}): {e}")
        return pd.DataFrame()
