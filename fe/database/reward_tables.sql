-- ============================================================
-- 积分商城 - 增量建表与测试数据（仅 reward / reward_order）
-- 用于已存在基础表的已有环境
-- ============================================================
USE `jiawei`;

CREATE TABLE IF NOT EXISTS `reward` (
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

CREATE TABLE IF NOT EXISTS `reward_order` (
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

-- 测试数据（family_id=1）
INSERT IGNORE INTO `reward` (`family_id`, `name`, `description`, `category`, `points`, `image_url`, `stock`, `dish_id`, `is_published`, `sort_order`) VALUES
(1, '神秘小玩具', '零花钱兑换的神秘小玩具一个', 'physical', 100, '/static/default-avatar.svg', 5, NULL, 1, 1),
(1, '免做家务券', '可免做一次家务（与房主商议使用）', 'gift', 50, '/static/default-avatar.svg', -1, NULL, 1, 2),
(1, '游戏时间30分钟', '额外30分钟电子设备游玩时间', 'play', 30, '/static/default-avatar.svg', -1, NULL, 1, 3),
(1, '免单美食券', '兑换任一菜品免单一次', 'dish', 80, '/static/default-avatar.svg', 10, NULL, 1, 4);
