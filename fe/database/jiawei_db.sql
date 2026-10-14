-- ============================================================
-- 家味小札（jiawei）数据库设计
-- 生成时间：2026-08-03
-- 数据库引擎：InnoDB / 字符集：utf8mb4
-- 适用版本：MySQL 5.7+ / MariaDB 10.3+
-- ============================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `jiawei` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `jiawei`;

-- ============================================================
-- 1. 用户表
-- ============================================================
CREATE TABLE `user` (
    `id`          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    `openid`      VARCHAR(64) DEFAULT '' COMMENT '微信openid（小程序端）',
    `nickname`    VARCHAR(64) DEFAULT '' COMMENT '昵称',
    `avatar_url`  VARCHAR(512) DEFAULT '' COMMENT '头像URL',
    `phone`       VARCHAR(20) DEFAULT '' COMMENT '手机号',
    `invite_code` VARCHAR(32) DEFAULT '' UNIQUE COMMENT '个人邀请码',
    `points`      INT UNSIGNED DEFAULT 0 COMMENT '个人总积分',
    `status`      TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1=正常 0=禁用',
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY `idx_openid` (`openid`),
    KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================================
-- 1.1 账号表（H5 账号密码登录）
-- ============================================================
CREATE TABLE `account` (
    `id`            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '账号ID',
    `user_id`       BIGINT UNSIGNED NOT NULL COMMENT '关联用户ID',
    `username`      VARCHAR(32) NOT NULL COMMENT '登录账号',
    `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希（salt:hash）',
    `login_type`    VARCHAR(16) NOT NULL DEFAULT 'password' COMMENT '登录方式：password/phone/wechat',
    `status`        TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1=正常 0=禁用',
    `last_login_at` DATETIME DEFAULT NULL COMMENT '最近登录时间',
    `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_username` (`username`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账号表（H5 登录）';

-- ============================================================
-- 2. 家庭表
-- ============================================================
CREATE TABLE `family` (
    `id`          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '家庭ID',
    `family_code` VARCHAR(32) NOT NULL UNIQUE COMMENT '家庭邀请码',
    `family_name` VARCHAR(64) NOT NULL COMMENT '家庭名称',
    `description` VARCHAR(255) DEFAULT '' COMMENT '家庭描述',
    `owner_id`    BIGINT UNSIGNED NOT NULL COMMENT '房主ID',
    `status`      TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1=正常 0=已注销',
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_owner_id` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家庭表';

-- ============================================================
-- 3. 家庭成员表（多对多）
-- ============================================================
CREATE TABLE `family_member` (
    `id`           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    `family_id`    BIGINT UNSIGNED NOT NULL COMMENT '家庭ID',
    `user_id`      BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    `role`         ENUM('owner', 'admin', 'member') NOT NULL DEFAULT 'member' COMMENT '家庭内角色',
    `admin_remark` VARCHAR(32) DEFAULT '' COMMENT '管理员备注（如：爸爸/妈妈）',
    `is_owner`     TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否房主（冗余，防owner_id被删）',
    `points`       INT UNSIGNED DEFAULT 0 COMMENT '用户在该家庭的积分（家庭内隔离）',
    `joined_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_family_user` (`family_id`, `user_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家庭成员关系表';

-- ============================================================
-- 4. 菜品表（菜单）
-- ============================================================
CREATE TABLE `dish` (
    `id`           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '菜品ID',
    `family_id`    BIGINT UNSIGNED NOT NULL COMMENT '家庭ID',
    `name`         VARCHAR(64) NOT NULL COMMENT '菜品名称',
    `description`  VARCHAR(512) DEFAULT '' COMMENT '菜品描述',
    `price`        DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '价格（元）',
    `points`       INT UNSIGNED DEFAULT 0 COMMENT '所需积分（0=仅消费现金）',
    `category`     VARCHAR(32) DEFAULT '' COMMENT '分类：主食/炒菜/汤品/凉菜/饮品/小吃',
    `image_url`    VARCHAR(512) DEFAULT '' COMMENT '菜品图片URL',
    `stock`        INT UNSIGNED DEFAULT 0 COMMENT '库存',
    `is_published` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已上架：1=上架 0=下架',
    `sort_order`   INT UNSIGNED DEFAULT 0 COMMENT '排序',
    `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_family_published` (`family_id`, `is_published`),
    KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜品（菜单）表';

-- ============================================================
-- 5. 订单表
-- ============================================================
CREATE TABLE `order` (
    `id`           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '订单ID',
    `order_no`     VARCHAR(32) NOT NULL UNIQUE COMMENT '订单号：ORD+日期+序列',
    `family_id`    BIGINT UNSIGNED NOT NULL COMMENT '家庭ID',
    `user_id`      BIGINT UNSIGNED NOT NULL COMMENT '下单用户ID',
    `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '总金额（元）',
    `total_points` INT UNSIGNED DEFAULT 0 COMMENT '总积分消耗',
    `status`       ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT '订单状态',
    `remark`       VARCHAR(255) DEFAULT '' COMMENT '订单备注',
    `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_family_status` (`family_id`, `status`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- ============================================================
-- 6. 订单明细表
-- ============================================================
CREATE TABLE `order_item` (
    `id`             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    `order_id`       BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
    `dish_id`        BIGINT UNSIGNED NOT NULL COMMENT '菜品ID（快照）',
    `dish_name`      VARCHAR(64) NOT NULL COMMENT '菜品名称快照',
    `dish_image_url` VARCHAR(512) DEFAULT '' COMMENT '菜品图片快照',
    `price`          DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '单价快照',
    `points`         INT UNSIGNED DEFAULT 0 COMMENT '积分快照',
    `quantity`       INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '数量',
    `subtotal`       DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '小计',
    `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY `idx_order_id` (`order_id`),
    KEY `idx_dish_id` (`dish_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单明细表';

-- ============================================================
-- 7. 任务表
-- ============================================================
CREATE TABLE `task` (
    `id`            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '任务ID',
    `family_id`     BIGINT UNSIGNED NOT NULL COMMENT '家庭ID',
    `creator_id`    BIGINT UNSIGNED NOT NULL COMMENT '创建者ID',
    `title`         VARCHAR(128) NOT NULL COMMENT '任务标题',
    `description`   VARCHAR(512) DEFAULT '' COMMENT '任务描述',
    `category`      VARCHAR(32) NOT NULL DEFAULT 'other' COMMENT '分类：cooking/shopping/cleaning/washing/other',
    `category_name` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '分类名称（冗余，方便展示）',
    `points`        INT UNSIGNED DEFAULT 0 COMMENT '积分奖励',
    `deadline`      DATE NOT NULL COMMENT '截止日期',
    `status`        ENUM('draft', 'published', 'paused', 'completed') NOT NULL DEFAULT 'draft' COMMENT '任务状态',
    `extra_info`    JSON DEFAULT NULL COMMENT '扩展信息（可选）',
    `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_family_status` (`family_id`, `status`),
    KEY `idx_creator_id` (`creator_id`),
    KEY `idx_deadline` (`deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务表';

-- ============================================================
-- 8. 任务指派表
-- ============================================================
CREATE TABLE `task_assignee` (
    `id`           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    `task_id`      BIGINT UNSIGNED NOT NULL COMMENT '任务ID',
    `user_id`      BIGINT UNSIGNED NOT NULL COMMENT '受让人ID',
    `is_taken`     TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已接单',
    `assigned_at`  DATETIME DEFAULT NULL COMMENT '指派时间',
    `taken_at`     DATETIME DEFAULT NULL COMMENT '接单时间',
    `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
    `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_task_user` (`task_id`, `user_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务指派关系表';

-- ============================================================
-- 9. 积分流水表（核心审计表）
-- ============================================================
CREATE TABLE `points_record` (
    `id`             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    `user_id`        BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    `family_id`      BIGINT UNSIGNED NOT NULL COMMENT '家庭ID',
    `points_change`  INT NOT NULL COMMENT '积分变动（正=收入，负=支出）',
    `points_balance` INT UNSIGNED NOT NULL COMMENT '变动后余额（不可为负）',
    `type`           VARCHAR(32) NOT NULL COMMENT '类型：order_deduct/task_reward/dish_reward/manual_add/manual_subtract/reward_deduct',
    `reference_type` VARCHAR(32) DEFAULT '' COMMENT '关联类型：order/task/dish/reward',
    `reference_id`   BIGINT UNSIGNED DEFAULT 0 COMMENT '关联记录ID',
    `description`    VARCHAR(255) DEFAULT '' COMMENT '变动说明',
    `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY `idx_user_id` (`user_id`),
    KEY `idx_family_id` (`family_id`),
    KEY `idx_type` (`type`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分流水表';

-- ============================================================
-- 10. 积分商城-奖励商品表
-- ============================================================
CREATE TABLE `reward` (
    `id`           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '奖励ID',
    `family_id`    BIGINT UNSIGNED NOT NULL COMMENT '家庭ID（积分按家庭隔离）',
    `name`         VARCHAR(64) NOT NULL COMMENT '奖励名称',
    `description`  VARCHAR(512) DEFAULT '' COMMENT '奖励描述',
    `category`     ENUM('physical', 'gift', 'play', 'dish') NOT NULL DEFAULT 'gift' COMMENT '类型：physical=实物商品 gift=礼物 play=游玩 dish=菜品兑换',
    `points`       INT UNSIGNED NOT NULL COMMENT '所需积分',
    `image_url`    VARCHAR(512) DEFAULT '' COMMENT '奖励图片URL',
    `stock`        INT NOT NULL DEFAULT -1 COMMENT '库存：-1=不限量 0=已售罄 >0=剩余数量',
    `dish_id`      BIGINT UNSIGNED DEFAULT NULL COMMENT '关联菜品ID（category=dish 时）',
    `is_published` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否上架：1=上架 0=下架',
    `sort_order`   INT UNSIGNED DEFAULT 0 COMMENT '排序（小在前）',
    `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_family_published` (`family_id`, `is_published`),
    KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分商城-奖励商品表';

-- ============================================================
-- 11. 积分商城-兑换记录表
-- ============================================================
CREATE TABLE `reward_order` (
    `id`            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '兑换记录ID',
    `reward_id`     BIGINT UNSIGNED NOT NULL COMMENT '奖励ID（快照参考）',
    `reward_name`   VARCHAR(64) NOT NULL COMMENT '奖励名称快照',
    `reward_image`  VARCHAR(512) DEFAULT '' COMMENT '奖励图片快照',
    `reward_points` INT UNSIGNED NOT NULL COMMENT '兑换消耗积分快照',
    `category`      ENUM('physical', 'gift', 'play', 'dish') NOT NULL DEFAULT 'gift' COMMENT '奖励类型快照',
    `family_id`     BIGINT UNSIGNED NOT NULL COMMENT '家庭ID',
    `user_id`       BIGINT UNSIGNED NOT NULL COMMENT '兑换用户ID',
    `remark`        VARCHAR(255) DEFAULT '' COMMENT '兑换备注（可选）',
    `status`        ENUM('pending', 'received', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT '状态：pending=待领取 received=已领取 cancelled=已撤销',
    `received_at`   DATETIME DEFAULT NULL COMMENT '领取时间',
    `received_by`   BIGINT UNSIGNED DEFAULT NULL COMMENT '确认领取的操作人ID（多为管理员）',
    `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '兑换时间',
    KEY `idx_family_status` (`family_id`, `status`),
    KEY `idx_reward_id` (`reward_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分商城-兑换记录表';

-- ============================================================
-- 12. 家庭邀请码表
-- ============================================================
CREATE TABLE `family_invitation` (
    `id`              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    `family_id`       BIGINT UNSIGNED NOT NULL COMMENT '家庭ID',
    `code`            VARCHAR(32) NOT NULL UNIQUE COMMENT '邀请码',
    `type`            ENUM('code', 'mobile') NOT NULL DEFAULT 'code' COMMENT '邀请方式：code=邀请码 mobile=手机号',
    `is_used`         TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已使用',
    `used_by_user_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '使用者ID',
    `expires_at`      DATETIME DEFAULT NULL COMMENT '过期时间',
    `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `used_at`         DATETIME DEFAULT NULL COMMENT '使用时间',
    KEY `idx_family_id` (`family_id`),
    KEY `idx_code` (`code`),
    KEY `idx_used` (`is_used`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家庭邀请码表';

-- ============================================================
-- 补充：联合索引优化（高频查询场景）
-- ============================================================
ALTER TABLE `order` ADD INDEX `idx_user_family_time` (`user_id`, `family_id`, `created_at`);
ALTER TABLE `dish` ADD INDEX `idx_family_category` (`family_id`, `category`);
ALTER TABLE `task_assignee` ADD INDEX `idx_user_status` (`user_id`, `is_taken`);

-- ============================================================
-- 迁移：family_member 增加 points 字段（家庭内积分隔离）
-- 已有环境执行以下语句，并将成员旧积分从 user.points 迁移过来
-- ============================================================
ALTER TABLE `family_member`
    ADD COLUMN `points` INT UNSIGNED DEFAULT 0 COMMENT '用户在该家庭的积分' AFTER `is_owner`;
UPDATE `family_member` fm
    LEFT JOIN `user` u ON fm.user_id = u.id
    SET fm.points = u.points
    WHERE fm.points = 0;

-- ============================================================
-- 迁移：积分商城（reward / reward_order）已随本文件新建。
-- 已有环境执行：运行上方 CREATE TABLE `reward` 与 `reward_order` 两条语句即可。
-- ============================================================

-- ============================================================
-- 初始测试数据（可选）
-- ============================================================

-- 插入测试用户
INSERT INTO `user` (`nickname`, `avatar_url`, `phone`, `invite_code`, `points`) VALUES
('张三', '/static/default-avatar.svg', '13800000001', 'ZS2026', 850),
('李四', '/static/default-avatar.svg', '13800000002', 'LS2026', 620),
('小华', '/static/default-avatar.svg', '13800000003', 'XH2026', 450),
('小丽', '/static/default-avatar.svg', '13800000004', 'XL2026', 380);

-- 插入测试账号
-- 密码采用 scrypt(salt:hash) 生成，盐值固定 jiawei_salt_2026
--   admin/admin → 张三（user.id=1，owner）
--   user/user   → 小华（user.id=3，member）
INSERT INTO `account` (`user_id`, `username`, `password_hash`, `login_type`, `status`) VALUES
(1, 'admin', 'jiawei_salt_2026:05d31a51075b5d1eaaa0b506e050bdaa53fde6972889ad6f5a17e92f939adac5487bea38528e8d7bf4d576f0f47493c4f209c8b2c92efd398078f1bbf6b4462d', 'password', 1),
(3, 'user', 'jiawei_salt_2026:102badf276eb28874a6fed0266c1e6c35981e71262a61097e215d0a5dc105c4de777d2285bc6532f500033e426f37624991a018c3dd421812a37d6900435b372', 'password', 1);

-- 插入测试家庭
INSERT INTO `family` (`family_code`, `family_name`, `owner_id`, `status`) VALUES
('FAML001', '张三的家', 1, 1);

-- 插入家庭成员（points 为用户在该家庭的积分，初始与 user.points 一致）
INSERT INTO `family_member` (`family_id`, `user_id`, `role`, `admin_remark`, `is_owner`, `points`, `joined_at`) VALUES
(1, 1, 'owner', '爸爸', 1, 850, '2025-01-01 00:00:00'),
(1, 2, 'admin', '妈妈', 0, 620, '2025-01-01 00:00:00'),
(1, 3, 'member', '儿子', 0, 450, '2025-02-15 00:00:00'),
(1, 4, 'member', '女儿', 0, 380, '2025-02-15 00:00:00');

-- 插入测试菜品（暂无数据，待业务上线后录入）
-- INSERT INTO `dish` ...

-- 插入测试订单（暂无数据，待业务上线后产生）
-- INSERT INTO `order` ...

-- 插入测试订单明细（暂无数据）
-- INSERT INTO `order_item` ...

-- 插入测试任务（暂无数据，待业务上线后创建）
-- INSERT INTO `task` ...

-- 插入测试积分流水（暂无数据，待业务上线后产生）
-- INSERT INTO `points_record` ...
-- INSERT INTO `points_record` (`user_id`, `family_id`, `points_change`, `points_balance`, `type`, `reference_type`, `reference_id`, `description`) VALUES
-- (3, 1, 100, 100, 'task_reward', 'task', 3, '完成任务：打扫客厅'),
-- (3, 1, 50, 150, 'task_reward', 'task', 1, '完成任务：准备晚餐'),
-- (3, 1, -10, 140, 'order_deduct', 'order', 1, '下单消耗10积分'),
-- (3, 1, -15, 125, 'order_deduct', 'order', 3, '下单消耗15积分'),
-- (4, 1, 50, 50, 'task_reward', 'task', 2, '完成任务：采购食材'),
-- (4, 1, -10, 40, 'order_deduct', 'order', 2, '下单消耗10积分');

-- 插入测试积分商城-奖励（family_id=1）
INSERT INTO `reward` (`family_id`, `name`, `description`, `category`, `points`, `image_url`, `stock`, `dish_id`, `is_published`, `sort_order`) VALUES
(1, '神秘小玩具', '零花钱兑换的神秘小玩具一个', 'physical', 100, '/static/default-avatar.svg', 5, NULL, 1, 1),
(1, '免做家务券', '可免做一次家务（与房主商议使用）', 'gift', 50, '/static/default-avatar.svg', -1, NULL, 1, 2),
(1, '游戏时间30分钟', '额外30分钟电子设备游玩时间', 'play', 30, '/static/default-avatar.svg', -1, NULL, 1, 3),
(1, '免单美食券', '兑换任一菜品免单一次', 'dish', 80, '/static/default-avatar.svg', 10, NULL, 1, 4);
