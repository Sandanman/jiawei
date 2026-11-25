-- ============================================
-- 管理后台（admin-console）v1.0 新增表
-- 创建时间: 2026-11-24
-- 说明: 仅生成迁移文件，不自动执行；需人工在对应环境手动执行
-- 依赖: 现有 family / user / account / dish / `order` 等业务表，不修改其结构
-- 关联需求: docs/lijianxin/product-designer/admin-console_20261123/
-- ============================================

USE jiawei;

-- 1) 管理员账号
CREATE TABLE `admin_user` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '管理员 ID',
    `username` varchar(32) NOT NULL COMMENT '登录用户名',
    `password_hash` varchar(255) NOT NULL COMMENT '密码哈希，格式 salt:hash（与业务端同一方案）',
    `nickname` varchar(32) NOT NULL DEFAULT '' COMMENT '显示名称',
    `status` tinyint NOT NULL DEFAULT '1' COMMENT '1 正常 0 禁用',
    `token_version` int unsigned NOT NULL DEFAULT '0' COMMENT '改密后 +1，使旧 token 失效',
    `failed_count` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '连续登录失败次数',
    `locked_until` datetime DEFAULT NULL COMMENT '锁定截止时间，NULL 表示未锁定',
    `last_login_at` datetime DEFAULT NULL COMMENT '最近登录时间',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_admin_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理后台 - 管理员账号';

-- 2) 审计日志（只增不改，无更新/删除接口）
CREATE TABLE `admin_audit_log` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '日志 ID',
    `admin_id` bigint unsigned NOT NULL COMMENT '操作者管理员 ID',
    `admin_name` varchar(32) NOT NULL DEFAULT '' COMMENT '操作者用户名快照',
    `action` varchar(64) NOT NULL COMMENT '操作编码，如 family.close',
    `target_type` varchar(32) NOT NULL COMMENT 'family / user / dish / order / reward_order / reward / points / region / admin',
    `target_id` varchar(64) NOT NULL DEFAULT '' COMMENT '目标 ID；地域为 region_code，故用字符串',
    `family_id` bigint unsigned DEFAULT NULL COMMENT '关联家庭 ID，便于按家庭检索',
    `reason` varchar(255) NOT NULL DEFAULT '' COMMENT '操作原因',
    `before_data` json DEFAULT NULL COMMENT '变更前值，不含密码/哈希/token',
    `after_data` json DEFAULT NULL COMMENT '变更后值，不含密码/哈希/token',
    `ip` varchar(45) NOT NULL DEFAULT '' COMMENT '来源 IP',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (`id`),
    KEY `idx_admin_created` (`admin_id`, `created_at`),
    KEY `idx_action_created` (`action`, `created_at`),
    KEY `idx_target` (`target_type`, `target_id`),
    KEY `idx_family` (`family_id`),
    KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理后台 - 审计日志（只增不改）';
