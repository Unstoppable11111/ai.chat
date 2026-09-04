"""CLI 入口"""
import sys
from pathlib import Path
import argparse
from loguru import logger

ROOT = Path(__file__).parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.context import RunContext
from app.pipeline import Pipeline

def main():
    parser = argparse.ArgumentParser(description="A股复盘系统")
    parser.add_argument("--mode", choices=["morning", "afternoon", "close"], default="close")
    parser.add_argument("--date", help="YYYY-MM-DD")
    parser.add_argument("--init", action="store_true", help="初始化")
    args = parser.parse_args()
    
    logger.add(ROOT / "logs" / "app.log", rotation="10 MB")
    
    ctx = RunContext.create(mode=args.mode, target_date=args.date)
    pipeline = Pipeline(ctx)
    pipeline.run()

if __name__ == "__main__":
    main()