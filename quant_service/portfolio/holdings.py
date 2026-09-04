"""持仓管理"""
from __future__ import annotations
import pandas as pd
from pathlib import Path
from loguru import logger
from data.storage.models import HoldingItem


class HoldingsManager:
    def __init__(self, ctx):
        self.ctx = ctx
        self.file_path = ctx.project_root / "holdings.xlsx"

    def load_holdings(self) -> list[HoldingItem]:
        if not self.file_path.exists():
            self._create_template()
            return []
        try:
            df = pd.read_excel(self.file_path)
            if df.empty or '代码' not in df.columns:
                return []
            holdings = []
            for _, row in df.iterrows():
                code = str(row['代码']).strip()
                if not code or code == "nan":
                    continue
                holdings.append(HoldingItem(
                    code=code.zfill(6),
                    name=str(row.get('名称', '')),
                    quantity=int(row.get('数量', 0)),
                    cost_price=float(row.get('成本', 0.0)),
                    current_price=float(row.get('当前价格', row.get('成本', 0.0))),
                    hold_type=str(row.get('持仓类别', '核心仓')),
                    mainline=str(row.get('所属主线', '')),
                ))
            return holdings
        except Exception as e:
            logger.error(f"读取持仓异常: {e}")
            return []

    def load_and_update(self, quotes_df: pd.DataFrame = None) -> list[HoldingItem]:
        """读取持仓并更新最新价格与盈亏"""
        holdings = self.load_holdings()
        if not holdings:
            return []
        try:
            if quotes_df is not None and not quotes_df.empty and 'code' in quotes_df.columns and 'close' in quotes_df.columns:
                price_map = dict(zip(quotes_df['code'].astype(str), quotes_df['close']))
                for h in holdings:
                    if h.code in price_map and price_map[h.code] > 0:
                        h.current_price = float(price_map[h.code])
                    h.market_value = h.quantity * h.current_price
                    if h.cost_price > 0:
                        h.pnl = (h.current_price - h.cost_price) * h.quantity
                        h.pnl_pct = ((h.current_price - h.cost_price) / h.cost_price) * 100.0
                    h.action = "重点持有" if h.pnl_pct >= 5 else ("继续持有" if h.pnl_pct >= -3 else "观察防守")
            return holdings
        except Exception as e:
            logger.error(f"更新持仓行情异常: {e}")
            return holdings

    def _create_template(self):
        try:
            df = pd.DataFrame(columns=['代码', '名称', '数量', '成本', '当前价格', '市值', '仓位', '浮盈亏', '持仓类别', '所属主线', '备注'])
            df.to_excel(self.file_path, index=False)
            logger.info(f"创建持仓模板成功: {self.file_path}")
        except Exception as e:
            logger.error(f"创建模板异常: {e}")