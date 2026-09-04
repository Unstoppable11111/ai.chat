"""主线识别引擎"""
from __future__ import annotations

import pandas as pd
from loguru import logger
from typing import Dict, Any, List
from data.storage.models import MainlineInfo


class MainlineEngine:
    """主线识别引擎"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config.get('sector', {}) if isinstance(config, dict) else {}
        self.top_mainlines = self.config.get('top_mainlines', 3)
        
    def identify(self, sector_data: Any, all_stocks_df: Any = None) -> List[MainlineInfo]:
        """识别市场主线，支持传入 DataFrame 或列表"""
        try:
            mainlines = []
            if sector_data is None:
                return mainlines

            if isinstance(sector_data, pd.DataFrame):
                if sector_data.empty:
                    return mainlines
                df = sector_data.copy()
                if 'change_pct' not in df.columns:
                    return mainlines
                df = df.sort_values('change_pct', ascending=False)
                for i, (_, row) in enumerate(df.head(self.top_mainlines).iterrows()):
                    chg = float(row.get('change_pct', 0.0))
                    amt = float(row.get('amount', 0.0))
                    strength = float(min(max(50.0 + chg * 10.0, 10.0), 98.0))
                    diffusion = float(min(max(50.0 + chg * 8.0, 15.0), 95.0))
                    info = MainlineInfo(
                        rank=i + 1,
                        sector_name=str(row.get('name', f'板块{i+1}')),
                        sector_code=str(row.get('code', '')),
                        strength_score=strength,
                        diffusion_score=diffusion,
                        persistence_days=3,
                        change_pct_1d=chg,
                        amount=amt,
                        up_ratio=0.7
                    )
                    mainlines.append(info)
                return mainlines

            elif isinstance(sector_data, list):
                if not sector_data:
                    return mainlines
                sorted_sectors = sorted(
                    sector_data, 
                    key=lambda x: x.get('strength_score', 0) + x.get('change_pct_1d', 0) * 100, 
                    reverse=True
                )
                for i, sector in enumerate(sorted_sectors[:self.top_mainlines]):
                    info = MainlineInfo(
                        rank=i + 1,
                        sector_name=sector.get('name', ''),
                        sector_code=sector.get('code', ''),
                        strength_score=sector.get('strength_score', 50.0),
                        diffusion_score=sector.get('diffusion_score', 50.0),
                        persistence_days=sector.get('persistence_days', 1),
                        change_pct_1d=sector.get('change_pct_1d', 0.0),
                        change_pct_5d=sector.get('change_pct_5d', 0.0),
                        change_pct_20d=sector.get('change_pct_20d', 0.0),
                        amount=sector.get('amount', 0.0),
                        limit_up_count=sector.get('limit_up_count', 0),
                        leader=sector.get('leader', ''),
                        mid_core=sector.get('mid_core', ''),
                        up_ratio=sector.get('up_ratio', 0.5)
                    )
                    mainlines.append(info)
                return mainlines

            return []
        except Exception as e:
            logger.error(f"主线识别异常: {e}")
            return []
