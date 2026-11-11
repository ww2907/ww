-- ============================================================
-- 订单收货地址快照（2026-11-11）
-- ------------------------------------------------------------
-- 背景：下单链路原先完全没有收货地址概念——orders 表没有地址字段，
--      后端 OrderServiceImpl.createOrder 也不校验，所以「没填地址」既
--      不被拦截也无法在订单里看到。本脚本补上三个快照列。
--
-- 设计：
--   - 订单存「快照」而不是外键：用户之后改地址/删地址，历史订单的
--     配送信息不应跟着变（外卖订单的通行做法）。
--   - 三列都有 DEFAULT ''，保证历史订单（28 条）可以平滑升级；
--     「必须有地址」由后端下单时校验（BusinessException），不在 DB 上卡 NOT NULL，
--     否则老数据没法迁移。
--
-- 幂等：可重复执行（靠 information_schema 判断列是否已存在）。
-- 用法：mysql -uroot -p --default-character-set=utf8mb4 shiguang_food < 2026-11-11_order_address.sql
-- ============================================================

USE `shiguang_food`;

-- ---------- 1. receiver_name：收货人 ----------
SET @s := (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE `orders` ADD COLUMN `receiver_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '''' COMMENT ''收货人姓名（下单快照）''',
  'DO 0')
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'receiver_name');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ---------- 2. receiver_phone：联系电话 ----------
SET @s := (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE `orders` ADD COLUMN `receiver_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '''' COMMENT ''收货电话（下单快照）''',
  'DO 0')
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'receiver_phone');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ---------- 3. address：地址全文 ----------
SET @s := (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE `orders` ADD COLUMN `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '''' COMMENT ''收货地址全文（下单快照）''',
  'DO 0')
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'address');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ---------- 4. 历史订单回填（有地址的账号按默认地址补，其余留空） ----------
-- 4a：优先用默认地址
UPDATE `orders` o
  JOIN `user_address` a
    ON a.`account` = o.`account` AND a.`is_default` = 1
   SET o.`receiver_name`  = COALESCE(a.`name`, ''),
       o.`receiver_phone` = COALESCE(a.`phone`, ''),
       o.`address`        = CONCAT_WS(' ', NULLIF(a.`province`, ''), NULLIF(a.`city`, ''), NULLIF(a.`detail`, ''))
 WHERE o.`address` = '';

-- 4b：没有默认地址的账号，退而取 id 最小的那条
UPDATE `orders` o
  JOIN (SELECT `account`, MIN(`id`) AS `aid` FROM `user_address` GROUP BY `account`) t
    ON t.`account` = o.`account`
  JOIN `user_address` a
    ON a.`id` = t.`aid`
   SET o.`receiver_name`  = COALESCE(a.`name`, ''),
       o.`receiver_phone` = COALESCE(a.`phone`, ''),
       o.`address`        = CONCAT_WS(' ', NULLIF(a.`province`, ''), NULLIF(a.`city`, ''), NULLIF(a.`detail`, ''))
 WHERE o.`address` = '';

SELECT COUNT(*) AS `orders 总数`,
       SUM(`address` <> '') AS `已有地址`,
       SUM(`address` = '')  AS `无地址（历史单）`
  FROM `orders`;
