"""缓存管理模块"""
from __future__ import annotations

import sqlite3
import pandas as pd
import time
from pathlib import Path
from loguru import logger


class CacheManager:
    """缓存管理器，支持 SQLite 存储和 TTL"""
    
    def __init__(self, db_path: str = "data_cache.db"):
        self.db_path = Path(db_path)
        self._init_db()

    def _init_db(self):
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS cache_meta (
                        key TEXT PRIMARY KEY,
                        updated_at REAL,
                        ttl REAL
                    )
                ''')
        except Exception as e:
            logger.error(f"初始化缓存数据库失败: {e}")

    def get(self, key: str) -> pd.DataFrame | None:
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT updated_at, ttl FROM cache_meta WHERE key = ?', (key,))
                row = cursor.fetchone()
                if row:
                    updated_at, ttl = row
                    if time.time() - updated_at > ttl:
                        # 超过 TTL，但在缓存数据源中仍然可以使用（作为兜底）
                        pass
                
                df = pd.read_sql(f'SELECT * FROM "{key}"', conn)
                return df
        except Exception:
            return None

    def set(self, key: str, df: pd.DataFrame, ttl: float = 300.0) -> bool:
        try:
            with sqlite3.connect(self.db_path) as conn:
                df.to_sql(key, conn, if_exists='replace', index=False)
                conn.execute(
                    'INSERT OR REPLACE INTO cache_meta (key, updated_at, ttl) VALUES (?, ?, ?)',
                    (key, time.time(), ttl)
                )
            return True
        except Exception as e:
            logger.error(f"写入缓存失败 {key}: {e}")
            return False
