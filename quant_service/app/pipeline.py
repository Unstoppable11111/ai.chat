"""主流程编排

完整的 Pipeline 实现，从数据获取到报告生成的全流程。
每个步骤独立 try/except，单步失败不影响后续步骤。
"""
from __future__ import annotations

import time
from datetime import datetime
from typing import Optional

import pandas as pd
from loguru import logger

from app.context import RunContext
from data.storage.database import Database
from data.storage.models import MarketAnalysis, DataQualityReport
from data.provider_manager import ProviderManager


class Pipeline:
    """主流程编排器"""

    def __init__(self, ctx: RunContext):
        self.ctx = ctx
        self.db = Database(ctx.db_path)
        self.pm = ProviderManager()

        # 运行期间的中间数据
        self.all_quotes: pd.DataFrame = pd.DataFrame()
        self.index_quotes: pd.DataFrame = pd.DataFrame()
        self.sector_data: pd.DataFrame = pd.DataFrame()
        self.market_result: Optional[MarketAnalysis] = None
        self.mainlines: list = []
        self.stock_scores: pd.DataFrame = pd.DataFrame()
        self.candidates: list = []
        self.holdings: list = []
        self.data_quality: Optional[DataQualityReport] = None

    def run(self) -> None:
        """执行完整 pipeline"""
        total_start = time.time()
        logger.info(
            f"{'='*60}\n"
            f"  A股交易决策系统 V{self.ctx.model_version}\n"
            f"  模式: {self.ctx.mode} | 日期: {self.ctx.run_date}\n"
            f"  时间: {self.ctx.run_time}\n"
            f"{'='*60}"
        )

        steps = [
            ("1. 注册数据源", self._register_providers),
            ("2. 数据源健康检查", self._health_check),
            ("3. 交易日判断", self._check_trading_day),
            ("4. 获取实时数据", self._fetch_realtime_data),
            ("5. 数据质量检查", self._check_data_quality),
            ("6. 市场分析", self._analyze_market),
            ("7. 主线识别", self._identify_mainlines),
            ("8. 个股评分", self._score_stocks),
            ("9. 候选股筛选", self._select_candidates),
            ("10. 持仓分析", self._analyze_holdings),
            ("11. 仓位计算", self._calculate_position),
            ("12. 风险检查", self._check_risk),
            ("13. 生成交易剧本", self._generate_scenarios),
            ("14. 生成决策卡", self._generate_decision_card),
            ("15. 生成Excel报告", self._generate_excel),
            ("16. 生成Markdown报告", self._generate_markdown),
        ]

        # close 模式额外步骤
        if self.ctx.is_close:
            steps.extend([
                ("17. 保存快照到数据库", self._save_snapshots),
                ("18. 记录模型版本", self._record_model_version),
            ])

        results = {}
        for name, step_func in steps:
            try:
                start = time.time()
                step_func()
                elapsed = time.time() - start
                results[name] = "✅"
                logger.info(f"{name} 完成 | 耗时: {elapsed:.2f}s")
            except Exception as e:
                results[name] = f"❌ {e}"
                logger.error(f"{name} 失败: {e}")

        # 打印总结
        total_elapsed = time.time() - total_start
        logger.info(f"\n{'='*60}")
        logger.info(f"Pipeline 执行完成 | 总耗时: {total_elapsed:.2f}s")
        success = sum(1 for v in results.values() if v == "✅")
        logger.info(f"成功: {success}/{len(results)}")
        for name, status in results.items():
            if status != "✅":
                logger.warning(f"  {name}: {status}")
        logger.info(f"{'='*60}\n")

        self.db.close()

    # ============================================================
    # 步骤实现
    # ============================================================

    def _register_providers(self) -> None:
        """注册所有数据源"""
        try:
            from data.providers.eastmoney import EastMoneyProvider
            self.pm.register(EastMoneyProvider())
        except Exception as e:
            logger.warning(f"EastMoney 注册失败: {e}")

        try:
            from data.providers.akshare_provider import AKShareProvider
            self.pm.register(AKShareProvider())
        except Exception as e:
            logger.warning(f"AKShare 注册失败: {e}")

        try:
            from data.providers.sina import SinaProvider
            self.pm.register(SinaProvider())
        except Exception as e:
            logger.warning(f"Sina 注册失败: {e}")

        try:
            from data.providers.tencent import TencentProvider
            self.pm.register(TencentProvider())
        except Exception as e:
            logger.warning(f"Tencent 注册失败: {e}")

        try:
            from data.providers.cache_provider import CacheProvider
            self.pm.register(CacheProvider())
        except Exception as e:
            logger.warning(f"Cache 注册失败: {e}")

    def _health_check(self) -> None:
        """数据源健康检查"""
        self.pm.health_check_all()
        logger.info(self.pm.get_health_display())

    def _check_trading_day(self) -> None:
        """交易日判断"""
        from utils.trading_calendar import TradingCalendar
        cal = TradingCalendar(self.db)

        # 尝试从数据源获取交易日历
        trading_days = self.pm.call_with_fallback("get_trading_calendar", "2020-01-01", "2027-12-31")
        if isinstance(trading_days, list) and trading_days:
            cal.save_to_db(trading_days)
        else:
            cal.load()

        if not cal.is_trading_day(self.ctx.run_date):
            logger.warning(f"{self.ctx.run_date} 不是交易日，将使用最近交易日的数据")

    def _fetch_realtime_data(self) -> None:
        """获取实时行情数据"""
        # 全市场行情
        self.all_quotes = self.pm.call_with_fallback("get_all_realtime_quotes")
        if not self.all_quotes.empty:
            logger.info(f"获取全市场行情: {len(self.all_quotes)} 只股票")
        else:
            logger.warning("全市场行情获取失败")

        # 指数行情
        index_codes = self.ctx.get_strategy("market_trend", "index_codes",
                                             default=["000001", "399001", "399006"])
        self.index_quotes = self.pm.call_with_fallback("get_index_quotes", index_codes)

        # 板块数据
        self.sector_data = self.pm.call_with_fallback("get_sector_list", "industry")

    def _check_data_quality(self) -> None:
        """数据质量检查"""
        from data.quality.checker import DataQualityChecker
        checker = DataQualityChecker()
        self.data_quality = checker.run_all_checks(self.all_quotes)
        if self.data_quality:
            logger.info(f"数据质量: {self.data_quality.overall_quality} | "
                       f"股票数: {self.data_quality.stock_count} | "
                       f"异常数: {self.data_quality.anomaly_count}")

    def _analyze_market(self) -> None:
        """市场分析"""
        from market.score import MarketScorer
        config = self.ctx.strategy
        scorer = MarketScorer(config)
        self.market_result = scorer.analyze(
            index_df=self.index_quotes,
            all_stocks_df=self.all_quotes,
            sector_df=self.sector_data,
            date=self.ctx.run_date,
            mode=self.ctx.mode,
        )
        if self.market_result:
            logger.info(
                f"市场评分: {self.market_result.market_score:.1f} | "
                f"状态: {self.market_result.market_state} | "
                f"风格: {self.market_result.market_style} | "
                f"建议仓位: {self.market_result.suggested_position}"
            )

    def _identify_mainlines(self) -> None:
        """主线识别"""
        from sector.mainline import MainlineEngine
        config = self.ctx.strategy
        engine = MainlineEngine(config)
        self.mainlines = engine.identify(self.sector_data, self.all_quotes)
        if self.mainlines:
            for ml in self.mainlines[:3]:
                logger.info(
                    f"主线 #{ml.rank}: {ml.sector_name} | "
                    f"强度: {ml.strength_score:.1f} | "
                    f"扩散: {ml.diffusion_score:.1f}"
                )

    def _score_stocks(self) -> None:
        """个股评分"""
        if self.all_quotes.empty:
            logger.warning("无行情数据，跳过个股评分")
            return

        from stock.universe import UniverseManager
        from stock.scoring import StockScorer

        # 过滤股票池
        universe = UniverseManager(self.ctx.universe)
        filtered = universe.filter_universe(self.all_quotes)
        logger.info(f"股票池过滤: {len(self.all_quotes)} -> {len(filtered)} 只")

        # 评分
        scorer = StockScorer(self.ctx.strategy)
        self.stock_scores = scorer.score_all(
            stocks_df=filtered,
            market_result=self.market_result,
            mainlines=self.mainlines,
        )
        if not self.stock_scores.empty:
            logger.info(f"个股评分完成: {len(self.stock_scores)} 只")

    def _select_candidates(self) -> None:
        """候选股筛选"""
        from stock.selector import CandidateSelector
        config = self.ctx.strategy
        selector = CandidateSelector(config)
        self.candidates = selector.select(self.stock_scores, self.mainlines)
        logger.info(f"候选股: {len(self.candidates)} 只")
        if not self.candidates:
            logger.info("今日无高质量候选股 — 不建议开新仓")

    def _analyze_holdings(self) -> None:
        """持仓分析"""
        from portfolio.holdings import HoldingsManager
        hm = HoldingsManager(self.ctx)
        self.holdings = hm.load_and_update(self.all_quotes)
        if self.holdings:
            logger.info(f"持仓: {len(self.holdings)} 只")
        else:
            logger.info("当前无持仓")

    def _calculate_position(self) -> None:
        """仓位计算"""
        from portfolio.position_engine import PositionEngine
        config = self.ctx.strategy
        engine = PositionEngine(config)
        if self.market_result:
            suggestion = engine.calculate(self.market_result)
            logger.info(f"仓位建议: {suggestion}")

    def _check_risk(self) -> None:
        """风险检查"""
        if not self.holdings:
            return
        from portfolio.exposure import ExposureAnalyzer
        analyzer = ExposureAnalyzer()
        exposure = analyzer.analyze(self.holdings)
        if exposure:
            logger.info(f"组合暴露度分析完成")

    def _generate_scenarios(self) -> None:
        """生成交易剧本"""
        from portfolio.actions import ActionGenerator
        gen = ActionGenerator(self.ctx.strategy)
        scenario = gen.generate_scenario(self.market_result, self.mainlines)
        if scenario:
            logger.info(
                f"交易剧本:\n"
                f"  基准: {scenario.base_case}\n"
                f"  进攻: {scenario.bull_case}\n"
                f"  防守: {scenario.bear_case}\n"
                f"  风险: {scenario.risk_case}"
            )

    def _generate_decision_card(self) -> None:
        """生成交易决策卡"""
        from reports.decision_card import DecisionCardGenerator
        gen = DecisionCardGenerator(self.ctx)
        card_data = {
            "market_result": self.market_result,
            "mainlines": self.mainlines,
            "candidates": self.candidates,
            "holdings": self.holdings,
            "data_quality": self.data_quality,
        }
        gen.generate(card_data)

    def _generate_excel(self) -> None:
        """生成Excel报告"""
        from reports.excel_report import ExcelReportGenerator
        gen = ExcelReportGenerator(self.ctx)
        gen.generate(
            market_result=self.market_result,
            mainlines=self.mainlines,
            stock_scores=self.stock_scores,
            candidates=self.candidates,
            holdings=self.holdings,
            data_quality=self.data_quality,
        )

    def _generate_markdown(self) -> None:
        """生成Markdown报告"""
        from reports.markdown_report import MarkdownReportGenerator
        gen = MarkdownReportGenerator(self.ctx)
        gen.generate(
            market_result=self.market_result,
            mainlines=self.mainlines,
            stock_scores=self.stock_scores,
            candidates=self.candidates,
            holdings=self.holdings,
            data_quality=self.data_quality,
        )

    def _save_snapshots(self) -> None:
        """保存市场快照到数据库（仅 close 模式）"""
        if self.market_result:
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            self.db.execute(
                "INSERT OR REPLACE INTO market_snapshot "
                "(market_date, snapshot_time, mode, market_score, market_state, "
                "market_style, confidence, suggested_position, trend_score, "
                "breadth_score, liquidity_score, sentiment_score, "
                "consistency_score, high_level_risk_score, total_amount, "
                "up_count, down_count, limit_up_count, limit_down_count, "
                "model_version, data_quality) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (
                    self.ctx.run_date, now, self.ctx.mode,
                    self.market_result.market_score,
                    self.market_result.market_state,
                    self.market_result.market_style,
                    self.market_result.confidence,
                    self.market_result.suggested_position,
                    self.market_result.trend_score,
                    self.market_result.breadth_score,
                    self.market_result.liquidity_score,
                    self.market_result.sentiment_score,
                    self.market_result.consistency_score,
                    self.market_result.high_level_risk_score,
                    self.market_result.total_amount,
                    self.market_result.up_count,
                    self.market_result.down_count,
                    self.market_result.limit_up_count,
                    self.market_result.limit_down_count,
                    self.market_result.model_version,
                    self.market_result.data_quality,
                ),
            )
            logger.info("市场快照已保存到数据库")

        # 保存候选股
        if self.candidates:
            for c in self.candidates:
                self.db.execute(
                    "INSERT OR REPLACE INTO candidates "
                    "(market_date, code, name, category, total_score, "
                    "entry_score, crowding_score, recommended_level, "
                    "current_price, model_version) "
                    "VALUES (?,?,?,?,?,?,?,?,?,?)",
                    (
                        self.ctx.run_date, c.code, c.name, c.category,
                        c.total_score, c.entry_score, c.crowding_score,
                        c.recommended_level, c.current_price,
                        self.ctx.model_version,
                    ),
                )
            logger.info(f"候选股快照已保存: {len(self.candidates)} 只")

    def _record_model_version(self) -> None:
        """记录模型版本"""
        self.db.execute(
            "INSERT INTO model_versions (version, description) VALUES (?, ?)",
            (self.ctx.model_version, f"daily run {self.ctx.run_date} {self.ctx.mode}"),
        )