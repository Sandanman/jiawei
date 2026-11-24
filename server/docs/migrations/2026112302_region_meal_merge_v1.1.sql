-- ============================================
-- AI推荐今日菜品 v1.1 表结构精简：合并为单表 daily_region_meal
-- 创建时间: 2026-11-23
-- 说明: 仅生成迁移文件，不自动执行；需人工在对应环境手动执行
-- 前置: 已执行 2026103001 / 2026112301 两个迁移脚本
-- ============================================

USE jiawei;

-- 1) 新建合并表：一行一道菜（地区 + 日期 + 餐段 + 排序），保留推荐理由与生成状态
--    status 为「地区+日期」维度的状态，同一地区同一天的所有行取值一致：
--      success : 正常生成，每行是一道菜
--      failed  : AI 生成失败，仅有 1 行占位记录（meal_type='breakfast', sort_order=0, dish_name=''），不含真实菜品
--    不再存 season（可由日期推算）与 generated_at（created_at 已足够）
CREATE TABLE `daily_region_meal` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
    `region_code` varchar(32) NOT NULL COMMENT '地域编码：市级 adcode',
    `recommend_date` date NOT NULL COMMENT '推荐日期',
    `meal_type` enum('breakfast','lunch','dinner') NOT NULL COMMENT '餐段',
    `sort_order` int unsigned NOT NULL DEFAULT '0' COMMENT '同一餐段内展示顺序',
    `dish_name` varchar(64) NOT NULL DEFAULT '' COMMENT 'AI生成的菜名（不关联dish表），失败占位行为空串',
    `description` varchar(255) DEFAULT '' COMMENT '推荐理由/做法特点',
    `status` enum('success','failed') NOT NULL DEFAULT 'success' COMMENT '生成状态',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '生成时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_region_date_meal_sort` (`region_code`,`recommend_date`,`meal_type`,`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='地域化三餐推荐表（v1.1，按地区+日期记录早中晚推荐菜）';

-- 2) 迁移历史数据：只迁移 region_code 为 6 位 adcode 的记录（旧经纬度格式的记录已无法命中，不迁移）
INSERT INTO `daily_region_meal` (`region_code`, `recommend_date`, `meal_type`, `sort_order`, `dish_name`, `description`, `status`, `created_at`)
SELECT r.`region_code`, r.`recommend_date`, i.`meal_type`, i.`sort_order`, i.`dish_name`, i.`description`, 'success', r.`generated_at`
FROM `daily_region_recommendation` r
JOIN `daily_region_recommendation_item` i ON i.`recommendation_id` = r.`id`
WHERE r.`status` = 'success' AND r.`region_code` REGEXP '^[0-9]{6}$';

INSERT INTO `daily_region_meal` (`region_code`, `recommend_date`, `meal_type`, `sort_order`, `dish_name`, `description`, `status`, `created_at`)
SELECT r.`region_code`, r.`recommend_date`, 'breakfast', 0, '', '', 'failed', r.`generated_at`
FROM `daily_region_recommendation` r
WHERE r.`status` = 'failed' AND r.`region_code` REGEXP '^[0-9]{6}$';

-- 3) 旧表保留，确认新表数据与线上行为无误后，再人工执行下面两条删除（不可逆，建议先备份）
-- DROP TABLE `daily_region_recommendation_item`;
-- DROP TABLE `daily_region_recommendation`;
