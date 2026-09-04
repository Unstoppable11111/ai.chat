"""交易决策卡生成器"""
from __future__ import annotations
from pathlib import Path
from loguru import logger
from app.context import RunContext


class DecisionCardGenerator:
    """交易决策卡生成器"""

    def __init__(self, ctx: RunContext):
        self.ctx = ctx

    def generate(self, data: dict) -> str:
        """生成交易决策卡并在控制台和文件输出"""
        try:
            market = data.get("market_result")
            mainlines = data.get("mainlines", [])
            candidates = data.get("candidates", [])
            holdings = data.get("holdings", [])
            dq = data.get("data_quality")

            lines = []
            lines.append("━" * 46)
            lines.append("              A 股 交 易 决 策 卡")
            lines.append("━" * 46)
            lines.append(f"日期: {self.ctx.run_date}    模式: {self.ctx.mode}    时间: {self.ctx.run_time}")
            lines.append("")

            # 市场状态
            m_score = getattr(market, 'market_score', 50.0) if market else 50.0
            m_state = getattr(market, 'market_state', '弱势震荡') if market else '弱势震荡'
            m_style = getattr(market, 'market_style', '科技趋势') if market else '科技趋势'
            m_conf = getattr(market, 'confidence', 'medium') if market else 'medium'
            m_pos = getattr(market, 'suggested_position', '30%~50%') if market else '30%~50%'

            lines.append(f"【市场评分】:  {m_score:.0f} / 100")
            lines.append(f"【市场状态】:  {m_state}")
            lines.append(f"【主导风格】:  {m_style}")
            lines.append(f"【模型置信】:  {m_conf}")
            lines.append(f"【建议仓位】:  {m_pos}")
            lines.append("")
            lines.append("━" * 46)

            # 主线
            lines.append("【今日核心主线】:")
            if mainlines:
                for i, ml in enumerate(mainlines[:3]):
                    lines.append(f"  {i+1}. {ml.sector_name} (强度:{ml.strength_score:.0f} | 扩散:{ml.diffusion_score:.0f} | 涨幅:{ml.change_pct_1d:+.2f}%)")
            else:
                lines.append("  暂无高度集聚的进攻主线，存量轮动为主")

            lines.append("")

            # 宽度与量能
            if market:
                amt_val = getattr(market, 'total_amount', 0.0)
                amount_desc = f"{amt_val / 1e8:.1f} 亿元" if amt_val > 0 else "统计中"
                up_c = getattr(market, 'up_count', 0)
                dn_c = getattr(market, 'down_count', 0)
                l_up = getattr(market, 'limit_up_count', 0)
                l_dn = getattr(market, 'limit_down_count', 0)
                lines.append(f"【全A成交额】:  {amount_desc}")
                lines.append(f"【涨跌统计】:  上涨 {up_c} 家 ｜ 下跌 {dn_c} 家")
                lines.append(f"【涨跌停板】:  涨停 {l_up} 家 ｜ 跌停 {l_dn} 家")
            
            lines.append("")
            lines.append("━" * 46)

            # 组合
            lines.append("【持仓组合状态】:")
            if holdings:
                lines.append(f"  持仓标的: {len(holdings)} 只")
                for h in holdings[:5]:
                    pnl_str = f"{h.pnl_pct:+.2f}%"
                    lines.append(f"  - {h.name} ({h.code}): {h.action} [盈亏: {pnl_str}]")
            else:
                lines.append("  当前持仓表为空 (可编辑 holdings.xlsx 配置)")

            lines.append("")
            lines.append("━" * 46)

            # 今日机会
            lines.append("【进攻/观察机会】:")
            if candidates:
                for c in candidates[:4]:
                    lines.append(f"  ★ {c.name} ({c.code}) 综合:{c.total_score:.0f} 买点:{c.entry_score:.0f} ➔ {c.recommended_level}")
            else:
                lines.append("  今日未满足高胜率买点条件，严格防守，不建议盲目开新仓")

            lines.append("")
            lines.append("━" * 46)

            # 数据质量
            q_str = getattr(dq, 'overall_quality', '正常') if dq else '正常'
            lines.append(f"【系统数据质量】: {q_str}")
            lines.append("━" * 46)

            card = "\n".join(lines)

            # 终端直接打印
            print("\n" + card + "\n")

            # 保存到 reports_output 目录
            out_dir = self.ctx.reports_dir
            out_dir.mkdir(parents=True, exist_ok=True)
            card_path = out_dir / f"decision_card_{self.ctx.run_date}.txt"
            with open(card_path, "w", encoding="utf-8") as f:
                f.write(card)
            logger.info(f"决策卡已持久化: {card_path}")

            return card

        except Exception as e:
            logger.error(f"决策卡生成异常: {e}")
            return ""