"""候选股引擎"""
from __future__ import annotations
from typing import Any, List
import pandas as pd
from loguru import logger
from data.storage.models import CandidateStock, StockAnalysis


class CandidateSelector:
    def __init__(self, config_or_ctx):
        self.config = config_or_ctx

    def select(self, stock_scores: Any, mainlines: Any = None) -> List[CandidateStock]:
        """筛选进攻候选股"""
        candidates = []
        try:
            if stock_scores is None:
                return candidates

            if isinstance(stock_scores, pd.DataFrame):
                if stock_scores.empty:
                    return candidates
                # 按照 total_score 与 entry_score 筛选
                df = stock_scores.copy()
                if 'total_score' not in df.columns:
                    return candidates
                
                # 筛选评分高且不过度拥挤的标的
                cond = (df['total_score'] >= 65.0) & (df['crowding_score'] <= 80.0)
                filtered = df[cond]
                if filtered.empty:
                    filtered = df.nlargest(5, 'total_score')
                
                for _, row in filtered.head(5).iterrows():
                    code = str(row.get('code', '')).zfill(6)
                    name = str(row.get('name', ''))
                    t_score = float(row.get('total_score', 75.0))
                    e_score = float(row.get('entry_score', 70.0))
                    c_score = float(row.get('crowding_score', 45.0))
                    curr_p = float(row.get('close', 0.0))
                    
                    candidates.append(CandidateStock(
                        code=code,
                        name=name,
                        category="主线中军" if t_score >= 75 else "趋势博弈",
                        total_score=t_score,
                        entry_score=e_score,
                        crowding_score=c_score,
                        recommended_level="重点观察" if e_score >= 65 else "逢低轻仓",
                        current_price=curr_p,
                        reason="均线多头形态，量能温和配合，未出现过度亢奋拥挤"
                    ))
                return candidates

            elif isinstance(stock_scores, list):
                for a in stock_scores:
                    if getattr(a, 'total_score', 0) >= 70 and getattr(a, 'entry_score', 0) >= 55:
                        candidates.append(CandidateStock(
                            code=a.code,
                            name=getattr(a, 'name', a.code),
                            total_score=a.total_score,
                            entry_score=a.entry_score,
                            recommended_level="buy"
                        ))
                return candidates

            return []
        except Exception as e:
            logger.error(f"选股异常: {e}")
            return []