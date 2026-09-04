"""Excel 报告生成器"""
from __future__ import annotations
from pathlib import Path
from typing import Any
import pandas as pd
from loguru import logger
from app.context import RunContext


class ExcelReportGenerator:
    def __init__(self, ctx: RunContext):
        self.ctx = ctx

    def generate(self, market_result: Any = None, mainlines: Any = None, stock_scores: Any = None,
                 candidates: Any = None, holdings: Any = None, data_quality: Any = None, **kwargs) -> str:
        """生成详细 Excel 复盘报表"""
        try:
            out_dir = self.ctx.reports_dir
            out_dir.mkdir(parents=True, exist_ok=True)
            date_str = self.ctx.run_date.replace("-", "")
            path = out_dir / f"daily_review_{date_str}.xlsx"

            with pd.ExcelWriter(path, engine="openpyxl") as writer:
                # 01_今日结论
                m_score = f"{market_result.market_score:.1f}" if market_result else "50.0"
                m_state = market_result.market_state if market_result else "弱势震荡"
                m_pos = market_result.suggested_position if market_result else "30%~50%"
                top_line = mainlines[0].sector_name if mainlines else "暂无"
                q_status = getattr(data_quality, 'overall_quality', '正常') if data_quality else '正常'

                summary_data = [
                    {"指标项": "复盘日期", "数值/结论": self.ctx.run_date},
                    {"指标项": "运行模式", "数值/结论": self.ctx.mode},
                    {"指标项": "市场评分", "数值/结论": m_score},
                    {"指标项": "市场状态", "数值/结论": m_state},
                    {"指标项": "建议仓位", "数值/结论": m_pos},
                    {"指标项": "主导行业", "数值/结论": top_line},
                    {"指标项": "数据健康度", "数值/结论": q_status},
                ]
                pd.DataFrame(summary_data).to_excel(writer, sheet_name="01_今日结论", index=False)

                # 02_市场状态
                if market_result:
                    amt = getattr(market_result, 'total_amount', 0.0)
                    m_data = [{
                        "综合评分": market_result.market_score,
                        "趋势评分": market_result.trend_score,
                        "市场宽度": market_result.breadth_score,
                        "量能评分": market_result.liquidity_score,
                        "情绪评分": market_result.sentiment_score,
                        "主线强度": market_result.mainline_score,
                        "一致性": market_result.consistency_score,
                        "高位风险": market_result.high_level_risk_score,
                        "全A成交额(亿元)": round(amt / 1e8, 2) if amt else 0,
                        "上涨家数": getattr(market_result, 'up_count', 0),
                        "下跌家数": getattr(market_result, 'down_count', 0),
                        "涨停家数": getattr(market_result, 'limit_up_count', 0),
                        "跌停家数": getattr(market_result, 'limit_down_count', 0),
                    }]
                    pd.DataFrame(m_data).to_excel(writer, sheet_name="02_市场状态", index=False)

                # 07_主线行业
                if mainlines:
                    ml_data = [{
                        "排名": ml.rank,
                        "板块名称": ml.sector_name,
                        "强度评分": ml.strength_score,
                        "扩散度": ml.diffusion_score,
                        "涨跌幅(%)": ml.change_pct_1d,
                        "成交额(元)": ml.amount
                    } for ml in mainlines]
                    pd.DataFrame(ml_data).to_excel(writer, sheet_name="07_主线行业", index=False)

                # 09_我的持仓
                if holdings:
                    h_data = [{
                        "代码": h.code, "名称": h.name, "数量": h.quantity,
                        "成本价": h.cost_price, "最新价": h.current_price,
                        "市值": h.market_value, "盈亏额": h.pnl, "盈亏比例(%)": h.pnl_pct,
                        "操作建议": h.action
                    } for h in holdings]
                    pd.DataFrame(h_data).to_excel(writer, sheet_name="09_我的持仓", index=False)
                else:
                    pd.DataFrame([{"提示": "暂无持仓数据（可编辑 holdings.xlsx）"}]).to_excel(writer, sheet_name="09_我的持仓", index=False)

                # 10_进攻候选
                if candidates:
                    c_data = [{
                        "代码": c.code, "名称": c.name, "标的属性": c.category,
                        "综合评分": c.total_score, "买点评分": c.entry_score,
                        "拥挤度": c.crowding_score, "推荐操作": c.recommended_level,
                        "当前现价": c.current_price, "入选逻辑": c.reason
                    } for c in candidates]
                    pd.DataFrame(c_data).to_excel(writer, sheet_name="10_进攻候选", index=False)
                else:
                    pd.DataFrame([{"提示": "今日无符合严格风控条件的进攻标的"}]).to_excel(writer, sheet_name="10_进攻候选", index=False)

            logger.info(f"Excel 报告已生成: {path}")
            return str(path)
        except Exception as e:
            logger.error(f"Excel 生成异常: {e}")
            return ""