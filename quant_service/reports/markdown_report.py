"""Markdown 报告生成器"""
from __future__ import annotations
import shutil
from pathlib import Path
from typing import Any
from loguru import logger
from app.context import RunContext


class MarkdownReportGenerator:
    def __init__(self, ctx: RunContext):
        self.ctx = ctx

    def generate(self, market_result: Any = None, mainlines: Any = None, stock_scores: Any = None,
                 candidates: Any = None, holdings: Any = None, data_quality: Any = None, **kwargs) -> str:
        """生成详细 Markdown 复盘日报"""
        try:
            out_dir = self.ctx.reports_dir
            out_dir.mkdir(parents=True, exist_ok=True)
            date_str = self.ctx.run_date.replace("-", "")
            path = out_dir / f"daily_review_{date_str}.md"
            latest_path = out_dir / "daily_review_latest.md"

            m_score = f"{market_result.market_score:.1f}" if market_result else "50.0"
            m_state = market_result.market_state if market_result else "弱势震荡"
            m_pos = market_result.suggested_position if market_result else "30%~50%"

            lines = [
                f"# A股量化复盘与交易决策日报（{self.ctx.run_date}）",
                "",
                f"> **运行模式**：{self.ctx.mode} ｜ **系统版本**：V{self.ctx.model_version} ｜ **生成时间**：{self.ctx.run_time}",
                "",
                "---",
                "",
                "## 一、今日结论与交易决策卡",
                "",
                f"- **市场综合评分**：`{m_score}` / 100",
                f"- **市场状态定性**：`{m_state}`",
                f"- **建议整体仓位**：`{m_pos}`",
                f"- **数据质量评级**：`{getattr(data_quality, 'overall_quality', '正常') if data_quality else '正常'}`",
                "",
                "---",
                "",
                "## 二、主线与核心热点",
                ""
            ]

            if mainlines:
                for ml in mainlines:
                    lines.append(f"### #{ml.rank} {ml.sector_name}")
                    lines.append(f"- **强度评分**：{ml.strength_score:.1f} ｜ **扩散度**：{ml.diffusion_score:.1f} ｜ **当日涨幅**：{ml.change_pct_1d:+.2f}%")
                    lines.append("")
            else:
                lines.append("今日市场无明显扩散主线，热点轮动较散，资金未形成进攻共识。")
                lines.append("")

            lines.extend([
                "---",
                "",
                "## 三、候选股机会与交易计划",
                ""
            ])

            if candidates:
                for c in candidates:
                    lines.append(f"- **{c.name} ({c.code})** ｜ 综合评分: `{c.total_score:.1f}` ｜ 买点评分: `{c.entry_score:.1f}` ｜ 建议: `{c.recommended_level}`")
                    if c.reason:
                        lines.append(f"  > 逻辑：{c.reason}")
            else:
                lines.append("当前市场环境下，未筛选出高赔率且低拥挤度的优质买点，**建议防守观望，不盲目开新仓**。")

            lines.extend([
                "",
                "---",
                "",
                "## 四、持仓诊断与风控建议",
                ""
            ])

            if holdings:
                for h in holdings:
                    pnl_str = f"{h.pnl_pct:+.2f}%"
                    lines.append(f"- **{h.name} ({h.code})**：数量 {h.quantity}，成本 {h.cost_price:.2f}，现价 {h.current_price:.2f}，盈亏 `{pnl_str}` ➔ **{h.action}**")
            else:
                lines.append("当前持仓组合为空，风险暴露为零。")

            lines.extend([
                "",
                "---",
                "",
                "## 五、交易剧本与情景应对",
                "",
                "- **基准情景**：主线维持温和震荡，存量博弈下重点关注缩量回踩均线支撑的机会。",
                "- **进攻情景**：量能显著放大且板块普涨扩散，可顺势加仓主线前排标的。",
                "- **防守情景**：若量能继续萎缩，逢高减持高位滞涨标的，控制持仓敞口。",
                "- **风险底线**：高位股集体杀跌且炸板率走高时，坚决执行纪律止损。"
            ])

            content = "\n".join(lines)
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            shutil.copy(path, latest_path)

            logger.info(f"Markdown 报告已生成: {path}")
            return str(path)
        except Exception as e:
            logger.error(f"Markdown 生成异常: {e}")
            return ""