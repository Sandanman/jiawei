-- ============================================
-- AI推荐今日菜品 v1.1（地域化三餐推荐）数据库迁移
-- 创建时间: 2026-10-30
-- 说明: 仅生成迁移文件，不自动执行；需人工在对应环境手动执行
-- ============================================

USE jiawei;

-- user 表新增 region_code 字段（用户上报位置后换算得到）
ALTER TABLE `user`
    ADD COLUMN `region_code` varchar(32) DEFAULT '' COMMENT '地域编码，用于分组生成三餐推荐' AFTER `points`,
    ADD KEY `idx_region_code` (`region_code`);

-- 地域化三餐推荐（按 region_code + recommend_date 唯一）
CREATE TABLE `daily_region_recommendation` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
    `region_code` varchar(32) NOT NULL COMMENT '地域编码',
    `recommend_date` date NOT NULL COMMENT '推荐日期',
    `season` varchar(8) NOT NULL COMMENT '生成时所处季节快照：春/夏/秋/冬',
    `status` enum('success','failed') NOT NULL DEFAULT 'success' COMMENT '生成状态',
    `generated_at` datetime NOT NULL COMMENT '生成时间',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_region_date` (`region_code`,`recommend_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='地域化三餐推荐记录表（v1.1）';

-- 地域化三餐推荐明细（早/中/晚各若干条）
CREATE TABLE `daily_region_recommendation_item` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
    `recommendation_id` bigint unsigned NOT NULL COMMENT '外键 -> daily_region_recommendation.id',
    `meal_type` enum('breakfast','lunch','dinner') NOT NULL COMMENT '餐段',
    `dish_name` varchar(64) NOT NULL COMMENT 'AI生成的菜名（不关联dish表）',
    `description` varchar(255) DEFAULT '' COMMENT '简要做法/推荐理由',
    `sort_order` int unsigned DEFAULT '0' COMMENT '展示顺序',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_recommendation_meal` (`recommendation_id`,`meal_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='地域化三餐推荐明细表（v1.1）';
