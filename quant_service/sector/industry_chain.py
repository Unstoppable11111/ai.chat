import yaml
from loguru import logger
from typing import Dict, Any, List

class IndustryChainMapper:
    """产业链映射"""
    
    def __init__(self, config_path: str = "config/universe.yaml"):
        self.config_path = config_path
        self.chain_map = self._load_config()
        
    def _load_config(self) -> Dict[str, Any]:
        """加载产业链配置"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f) or {}
        except Exception as e:
            logger.warning(f"无法加载产业链配置 {self.config_path}: {e}")
            return {}
            
    def map_stock(self, stock_code: str) -> Dict[str, str]:
        """
        股票映射到产业链和子行业
        """
        try:
            # 简化：遍历查找
            for chain, data in self.chain_map.items():
                for sub_industry, stocks in data.get('sub_industries', {}).items():
                    if stock_code in stocks:
                        return {
                            "chain": chain,
                            "sub_industry": sub_industry,
                            "role": data.get('roles', {}).get(stock_code, "跟风")
                        }
            return {"chain": "未知", "sub_industry": "未知", "role": "未知"}
            
        except Exception as e:
            logger.error(f"映射异常: {e}")
            return {"chain": "未知", "sub_industry": "未知", "role": "未知"}
