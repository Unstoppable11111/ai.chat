-- =========================================================
-- A股量化决策与多用户持仓系统 - 生产环境 MySQL 数据库结构表
-- 适用数据库: ai_studio
-- 编码: utf8mb4 / utf8mb4_unicode_ci
-- =========================================================

USE `ai_studio`;

-- 1. 用户私有持仓明细表 (支持多用户隔离)
CREATE TABLE IF NOT EXISTS `user_portfolios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL DEFAULT 'default_user' COMMENT '用户唯一标识或账号ID',
  `stock_code` VARCHAR(16) NOT NULL COMMENT '6位A股代码，如 600584',
  `stock_name` VARCHAR(64) NOT NULL COMMENT '股票名称，如 长电科技',
  `quantity` INT NOT NULL DEFAULT 100 COMMENT '持股数量(股)',
  `cost_price` DECIMAL(10, 3) NOT NULL DEFAULT 0.000 COMMENT '买入成本单价(元)',
  `hold_type` VARCHAR(32) NOT NULL DEFAULT 'core' COMMENT '仓位类型: core(核心底仓), trend(趋势持股), attack(短线进攻), trial(试错仓位)',
  `notes` TEXT COMMENT '买入逻辑、交易计划或个人笔记',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '录入时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_stock_code` (`stock_code`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户私有持仓与风控配置表';


-- 2. 盘中 5 分钟大盘推演快照表 (供前台快速回溯与历史研判)
CREATE TABLE IF NOT EXISTS `market_snapshots_5m` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `market_date` VARCHAR(16) NOT NULL COMMENT '交易日期，如 2026-09-04',
  `snapshot_time` VARCHAR(16) NOT NULL COMMENT '分时推演时间，如 10:05:00',
  `market_score` DECIMAL(5, 2) NOT NULL DEFAULT 50.00 COMMENT '市场综合评分 0~100',
  `market_state` VARCHAR(32) NOT NULL COMMENT '状态定性: 极强主升/主升/强势震荡/弱势震荡/退潮/极端退潮',
  `market_style` VARCHAR(64) DEFAULT '科技趋势' COMMENT '主导风格',
  `suggested_position` VARCHAR(32) DEFAULT '30%~50%' COMMENT '建议仓位区间',
  `confidence` VARCHAR(16) DEFAULT 'high' COMMENT '模型置信度: high/medium/low',
  `total_amount` DECIMAL(18, 2) DEFAULT 0.00 COMMENT '全A成交总额(元)',
  `up_count` INT DEFAULT 0 COMMENT '上涨家数',
  `down_count` INT DEFAULT 0 COMMENT '下跌家数',
  `limit_up_count` INT DEFAULT 0 COMMENT '涨停家数',
  `limit_down_count` INT DEFAULT 0 COMMENT '跌停家数',
  `indices_json` JSON COMMENT '三大指数最新点位快照 JSON',
  `decision_card_text` TEXT COMMENT '终端 ASCII 决策卡纯文本',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_market_date` (`market_date`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='盘中5分钟大盘推演历史快照表';


-- 3. 初始预设持仓数据 (可选，导入后即可有现成持仓可查)
INSERT INTO `user_portfolios` (`user_id`, `stock_code`, `stock_name`, `quantity`, `cost_price`, `hold_type`, `notes`)
SELECT 'default_user', '600584', '长电科技', 1000, 72.500, 'core', '半导体先进封测龙头，主线持仓'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `user_portfolios` WHERE `user_id` = 'default_user' AND `stock_code` = '600584'
);

INSERT INTO `user_portfolios` (`user_id`, `stock_code`, `stock_name`, `quantity`, `cost_price`, `hold_type`, `notes`)
SELECT 'default_user', '300476', '胜宏科技', 500, 210.000, 'attack', '高阶算力 PCB 板龙头，短线进攻'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `user_portfolios` WHERE `user_id` = 'default_user' AND `stock_code` = '300476'
);


-- 4. 每日量化研报表（晨间全球早报 + 收盘全景复盘）
CREATE TABLE IF NOT EXISTS `quant_daily_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `report_type` VARCHAR(32) NOT NULL COMMENT '报告类型: morning(全球早报), closing(收盘复盘)',
  `report_date` VARCHAR(16) NOT NULL COMMENT '报告日期，如 2026-09-07',
  `title` VARCHAR(255) NOT NULL COMMENT '研报标题',
  `summary` TEXT COMMENT '一句话核心结论摘要',
  `content_md` MEDIUMTEXT NOT NULL COMMENT '完整 Markdown 研报正文',
  `snapshot_json` JSON COMMENT '关联行情与宏观指标快照',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_type_date` (`report_type`, `report_date`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='A股量化每日研报（晨报与收盘复盘）表';


-- 5. 量化精选推荐个股与历史胜率跟踪表
CREATE TABLE IF NOT EXISTS `quant_stock_recommendations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `recommend_date` VARCHAR(16) NOT NULL COMMENT '推荐日期，如 2026-09-04',
  `stock_code` VARCHAR(16) NOT NULL COMMENT '股票代码',
  `stock_name` VARCHAR(64) NOT NULL COMMENT '股票名称',
  `category` VARCHAR(64) NOT NULL DEFAULT '主线中军' COMMENT '策略类别: 主线中军/趋势突破/超跌反弹/龙回头',
  `score` DECIMAL(5, 1) NOT NULL DEFAULT 80.0 COMMENT '量化多因子综合评分',
  `entry_price` DECIMAL(10, 2) NOT NULL COMMENT '入选建议买入基准价',
  `target_price` DECIMAL(10, 2) NOT NULL COMMENT '预期第一目标价',
  `stop_loss_price` DECIMAL(10, 2) NOT NULL COMMENT '止损防守价',
  `reason` TEXT COMMENT '量化入选理由与逻辑',
  `current_price` DECIMAL(10, 2) DEFAULT 0.00 COMMENT '最新现价',
  `t1_return` DECIMAL(6, 2) DEFAULT 0.00 COMMENT 'T+1 收益率 (%)',
  `t3_return` DECIMAL(6, 2) DEFAULT 0.00 COMMENT 'T+3 收益率 (%)',
  `t5_max_return` DECIMAL(6, 2) DEFAULT 0.00 COMMENT 'T+5 最高涨幅 (%)',
  `status` VARCHAR(32) NOT NULL DEFAULT 'holding' COMMENT '跟踪状态: holding(观察持仓中), win(目标止盈胜出), stopped(止损离场)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_rec_date` (`recommend_date`),
  INDEX `idx_code` (`stock_code`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='量化精选推荐个股与历史胜率跟踪表';


-- 6. 量化模拟盘交易流水与建仓记录表 (10万本金起步，2026-09-01启动)
CREATE TABLE IF NOT EXISTS `quant_paper_trades` (
  `id` VARCHAR(64) PRIMARY KEY COMMENT '流水ID',
  `trade_date` VARCHAR(16) NOT NULL COMMENT '交易日期，如 2026-09-01',
  `trade_time` VARCHAR(16) NOT NULL COMMENT '交易时间，如 09:35',
  `trade_type` VARCHAR(32) NOT NULL COMMENT '交易类型: BUY(建仓/买入), SELL_TAKE_PROFIT(止盈), SELL_STOP_LOSS(止损)',
  `stock_code` VARCHAR(16) NOT NULL COMMENT '股票代码',
  `stock_name` VARCHAR(64) NOT NULL COMMENT '股票名称',
  `price` DECIMAL(10, 2) NOT NULL COMMENT '成交价格',
  `shares` INT NOT NULL COMMENT '成交股数',
  `amount` DECIMAL(12, 2) NOT NULL COMMENT '成交金额(元)',
  `target_price` DECIMAL(10, 2) DEFAULT NULL COMMENT '止盈目标价',
  `stop_loss_price` DECIMAL(10, 2) DEFAULT NULL COMMENT '止损防守价',
  `pnl_pct` DECIMAL(6, 2) DEFAULT NULL COMMENT '实现盈亏比例 (%)',
  `pnl_amount` DECIMAL(12, 2) DEFAULT NULL COMMENT '实现盈亏金额 (元)',
  `reason` TEXT COMMENT '交易逻辑归因',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_trade_date` (`trade_date`),
  INDEX `idx_stock_code` (`stock_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='量化模拟盘交易流水与建仓记录表';
