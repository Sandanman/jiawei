-- ============================================
-- AI推荐今日菜品 v1.1 定位优化：region_code 改为市级 adcode
-- 创建时间: 2026-11-23
-- 说明: 仅生成迁移文件，不自动执行；需人工在对应环境手动执行
-- 前置: 已执行 2026103001_region_recommendation_v1.1.sql（user.region_code 已存在）
-- ============================================

USE jiawei;

-- user 表新增地域展示名与定位来源
--   region_code   : 市级 adcode（6 位，如 440100），由逆地理编码 / IP 定位 / 手动选择得到
--   region_name   : 地域展示名（如「广东省广州市」），同时作为 AI 生成推荐时的地域输入
--   region_source : 定位来源 gps / ip / manual，空串表示旧版（经纬度）数据
ALTER TABLE `user`
    MODIFY COLUMN `region_code` varchar(32) DEFAULT '' COMMENT '地域编码：市级 adcode（如 440100），用于分组生成三餐推荐',
    ADD COLUMN `region_name` varchar(64) DEFAULT '' COMMENT '地域展示名（如 广东省广州市）' AFTER `region_code`,
    ADD COLUMN `region_source` varchar(8) DEFAULT '' COMMENT '定位来源：gps/ip/manual' AFTER `region_name`;

-- 兼容说明（无需额外 UPDATE）：
--   旧版 region_code 为「纬度,经度」格式且 region_name 为空，服务端会把这类用户视为「未上报位置」，
--   用户下次打开 AI 推荐菜时会重新定位并自动覆盖，无需手工清洗数据。
--   daily_region_recommendation 中的旧经纬度记录不会再被命中，可按需自行清理。
