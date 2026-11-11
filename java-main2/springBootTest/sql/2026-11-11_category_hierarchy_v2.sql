-- ============================================================
-- 2026-11-11_category_hierarchy_v2.sql
-- 分级分类搜索改造（三级分类 + 物化路径 + 菜品归类）
-- ------------------------------------------------------------
-- 执行库：shiguang_food（MySQL 8.0+）
-- 执行方式：mysql -uroot -p shiguang_food < 2026-11-11_category_hierarchy_v2.sql
-- 特性：可重复执行（加列/加索引均先查 information_schema，数据用 ON DUPLICATE KEY 覆盖）
--
-- 改造内容
--   1. category 增加 level / path / code / icon / enabled，并把唯一键从「全局名称唯一」
--      改为「同一父分类下名称唯一」（三级分类下不同分支允许同名）
--   2. category 重建为三级：美食(1) → 面食/快餐/甜点/饮品/轻食/火锅(2~7) → 品类(8~25)
--   3. dish 增加 category_id，按「店铺业态 + 菜名规则」把 350 道菜归到三级品类
--   4. restaurant.category_id 保持指向二级业态（已有数据已正确，本脚本做校验与补漏）
--   5. admin_category 同步 level / path 与三级分类数据，保持后台口径一致
--
-- 设计说明（分级分类搜索怎么用）
--   · level=1 命中整棵树，level=2 命中该业态及其下所有品类，level=3 精确到品类
--   · path 是物化路径（如 /1/2/8/），子树查询用 path LIKE '/1/2/%'，可走 idx_path
--   · 店铺本身挂二级业态（一家面馆同时卖汤面和拌面）；顾客选到三级品类时，
--     通过 dish.category_id 反查「拥有该品类菜品的店铺」，实现菜品级分类搜索
-- ============================================================

SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- 0. 幂等辅助过程
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS `_sp_add_col`;
DROP PROCEDURE IF EXISTS `_sp_add_idx`;
DROP PROCEDURE IF EXISTS `_sp_drop_idx`;

DELIMITER $$
CREATE PROCEDURE `_sp_add_col`(IN p_table VARCHAR(64), IN p_col VARCHAR(64), IN p_ddl TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_col
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_col, '` ', p_ddl);
    PREPARE st FROM @ddl; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$

CREATE PROCEDURE `_sp_add_idx`(IN p_table VARCHAR(64), IN p_idx VARCHAR(64), IN p_ddl TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND INDEX_NAME = p_idx
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD ', p_ddl);
    PREPARE st FROM @ddl; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$

CREATE PROCEDURE `_sp_drop_idx`(IN p_table VARCHAR(64), IN p_idx VARCHAR(64))
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND INDEX_NAME = p_idx
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` DROP INDEX `', p_idx, '`');
    PREPARE st FROM @ddl; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
DELIMITER ;

-- ------------------------------------------------------------
-- 1. category 表结构升级
-- ------------------------------------------------------------
CALL _sp_add_col('category', 'level',   'tinyint NOT NULL DEFAULT 1 COMMENT ''层级：1=一级 2=二级 3=三级''');
CALL _sp_add_col('category', 'path',    'varchar(64) NOT NULL DEFAULT '''' COMMENT ''物化路径，形如 /1/2/8/''');
CALL _sp_add_col('category', 'code',    'varchar(32) NULL COMMENT ''业务编码，供前后端硬编码引用''');
CALL _sp_add_col('category', 'icon',    'varchar(8) NULL DEFAULT '''' COMMENT ''分类图标 emoji''');
CALL _sp_add_col('category', 'enabled', 'tinyint NOT NULL DEFAULT 1 COMMENT ''是否启用：1=启用 0=停用''');

CALL _sp_add_idx('category', 'idx_parent', 'INDEX `idx_parent`(`parent_id` ASC) USING BTREE');
CALL _sp_add_idx('category', 'idx_path',   'INDEX `idx_path`(`path` ASC) USING BTREE');
CALL _sp_add_idx('category', 'idx_level',  'INDEX `idx_level`(`level` ASC) USING BTREE');

-- 三级分类下不同分支允许同名（如「小食」），唯一约束收窄到同一父分类内
CALL _sp_drop_idx('category', 'uk_cat_name');
CALL _sp_add_idx('category', 'uk_cat_parent_name', 'UNIQUE INDEX `uk_cat_parent_name`(`parent_id` ASC, `name` ASC) USING BTREE');

-- ------------------------------------------------------------
-- 2. 三级分类数据（可重复执行）
-- ------------------------------------------------------------
INSERT INTO `category` (`id`, `name`, `parent_id`, `sort_order`, `code`, `icon`) VALUES
  (1,  '美食',       0, 0, 'food',          '🍽️'),
  (2,  '面食',       1, 1, 'noodle',        '🍜'),
  (3,  '快餐',       1, 2, 'fastfood',      '🍔'),
  (4,  '甜点',       1, 3, 'dessert',       '🍰'),
  (5,  '饮品',       1, 4, 'drink',         '🥤'),
  (6,  '轻食',       1, 5, 'light',         '🥗'),
  (7,  '火锅',       1, 6, 'hotpot',        '🍲'),
  (8,  '汤面',       2, 1, 'noodle-soup',   '🍜'),
  (9,  '拌面',       2, 2, 'noodle-mix',    '🥢'),
  (10, '馄饨抄手',   2, 3, 'wonton',        '🥟'),
  (11, '粥粉小食',   2, 4, 'porridge',      '🥣'),
  (12, '汉堡披萨',   3, 1, 'burger',        '🍔'),
  (13, '炸鸡烤翅',   3, 2, 'fried-chicken', '🍗'),
  (14, '卷饭塔可',   3, 3, 'wrap',          '🌯'),
  (15, '薯条小食',   3, 4, 'snack',         '🍟'),
  (16, '蛋糕千层',   4, 1, 'cake',          '🍰'),
  (17, '布丁芋泥',   4, 2, 'pudding',       '🍮'),
  (18, '咖啡',       5, 1, 'coffee',        '☕'),
  (19, '奶茶果茶',   5, 2, 'tea',           '🧋'),
  (20, '沙拉',       6, 1, 'salad',         '🥗'),
  (21, '碗卷三明治', 6, 2, 'bowl',          '🥙'),
  (22, '浓汤饮品',   6, 3, 'soup',          '🥣'),
  (23, '锅底',       7, 1, 'hotpot-base',   '🍲'),
  (24, '涮菜',       7, 2, 'hotpot-dish',   '🥩'),
  (25, '火锅小食',   7, 3, 'hotpot-snack',  '🍡')
ON DUPLICATE KEY UPDATE
  `name`       = VALUES(`name`),
  `parent_id`  = VALUES(`parent_id`),
  `sort_order` = VALUES(`sort_order`),
  `code`       = VALUES(`code`),
  `icon`       = VALUES(`icon`),
  `enabled`    = 1;

-- 2.1 逐层计算 level（按 parent 分层，最多三级，重复执行结果一致）
UPDATE `category` SET `level` = 1 WHERE `parent_id` = 0;
UPDATE `category` c JOIN `category` p ON p.`id` = c.`parent_id` SET c.`level` = 2 WHERE p.`level` = 1;
UPDATE `category` c JOIN `category` p ON p.`id` = c.`parent_id` SET c.`level` = 3 WHERE p.`level` = 2;

-- 2.2 逐层计算物化路径 /1/ 、/1/2/ 、/1/2/8/
UPDATE `category` SET `path` = CONCAT('/', `id`, '/') WHERE `level` = 1;
UPDATE `category` c JOIN `category` p ON p.`id` = c.`parent_id`
   SET c.`path` = CONCAT(p.`path`, c.`id`, '/') WHERE c.`level` = 2;
UPDATE `category` c JOIN `category` p ON p.`id` = c.`parent_id`
   SET c.`path` = CONCAT(p.`path`, c.`id`, '/') WHERE c.`level` = 3;

-- ------------------------------------------------------------
-- 3. restaurant 分类校验 / 补漏（cat 叶子名 → category_id）
--    必须先于菜品归类执行：菜品归类依赖店铺的二级业态
-- ------------------------------------------------------------
UPDATE `restaurant` r
  JOIN `category` c ON c.`name` = r.`cat` AND c.`level` = 2
   SET r.`category_id` = c.`id`
 WHERE r.`category_id` IS NULL OR r.`category_id` = 0;

CALL _sp_add_idx('restaurant', 'idx_rest_category', 'INDEX `idx_rest_category`(`category_id` ASC) USING BTREE');

-- ------------------------------------------------------------
-- 4. dish 表新增分类字段并归类
-- ------------------------------------------------------------
CALL _sp_add_col('dish', 'category_id', 'bigint NULL COMMENT ''所属三级分类 id（分级分类搜索用）''');
CALL _sp_add_idx('dish', 'idx_dish_category', 'INDEX `idx_dish_category`(`category_id` ASC) USING BTREE');

-- 4.1 归类规则：先按店铺业态定位二级分支，再按菜名关键字落到三级品类
--     规则顺序即优先级，命中即止；未命中时回退到店铺业态本身，保证不留空
UPDATE `dish` d
  JOIN `restaurant` r ON r.`id` = d.`restaurant_id`
   SET d.`category_id` = CASE r.`category_id`
     -- 面食：抄手/馄饨/汤包 → 拌类 → 汤面 → 粥粉小食
     WHEN 2 THEN CASE
       WHEN d.`name` LIKE '%抄手%' OR d.`name` LIKE '%馄饨%' OR d.`name` LIKE '%汤包%'              THEN 10
       WHEN d.`name` LIKE '%肠粉%' OR d.`name` LIKE '%粥%' OR d.`name` LIKE '%牛杂%'
         OR d.`name` LIKE '%豆干%' OR d.`name` LIKE '%酸梅汤%'                                      THEN 11
       WHEN d.`name` LIKE '%拌面%' OR d.`name` LIKE '%炸酱%' OR d.`name` LIKE '%担担%'
         OR d.`name` LIKE '%油泼%' OR d.`name` LIKE '%葱油%'                                        THEN 9
       WHEN d.`name` LIKE '%面%'                                                                    THEN 8
       ELSE 2 END
     -- 快餐：汉堡披萨 → 炸鸡烤翅 → 卷饭塔可 → 薯条小食
     WHEN 3 THEN CASE
       WHEN d.`name` LIKE '%披萨%' OR d.`name` LIKE '%汉堡%' OR d.`name` LIKE '%牛肉堡%'
         OR d.`name` LIKE '%芝士堡%'                                                                THEN 12
       WHEN d.`name` LIKE '%炸鸡%' OR d.`name` LIKE '%鸡翅%' OR d.`name` LIKE '%盐酥鸡%'
         OR d.`name` LIKE '%鸡块%'                                                                  THEN 13
       WHEN d.`name` LIKE '%卷%' OR d.`name` LIKE '%鸡腿饭%' OR d.`name` LIKE '%塔可%'              THEN 14
       ELSE 15 END
     -- 甜点：布丁/芋泥/大福 → 蛋糕千层
     WHEN 4 THEN CASE
       WHEN d.`name` LIKE '%布丁%' OR d.`name` LIKE '%啵啵杯%' OR d.`name` LIKE '%大福%'             THEN 17
       ELSE 16 END
     -- 饮品：咖啡类 → 奶茶果茶
     WHEN 5 THEN CASE
       WHEN d.`name` LIKE '%拿铁%' OR d.`name` LIKE '%美式%'
         OR d.`name` LIKE '%手冲%' OR d.`name` LIKE '%可可%'                                        THEN 18
       ELSE 19 END
     -- 轻食：沙拉 → 浓汤饮品 → 碗卷三明治
     WHEN 6 THEN CASE
       WHEN d.`name` LIKE '%沙拉%'                                                                  THEN 20
       WHEN d.`name` LIKE '%浓汤%' OR d.`name` LIKE '%酸奶%' OR d.`name` LIKE '%汁%'                THEN 22
       WHEN d.`name` LIKE '%碗%' OR d.`name` LIKE '%卷%' OR d.`name` LIKE '%三明治%'                THEN 21
       ELSE 21 END
     -- 火锅：锅底 → 火锅小食 → 涮菜
     WHEN 7 THEN CASE
       WHEN d.`name` LIKE '%牛油锅%'                                                                THEN 23
       WHEN d.`name` LIKE '%酥肉%' OR d.`name` LIKE '%糍粑%'                                        THEN 25
       ELSE 24 END
     ELSE r.`category_id`
   END;

-- ------------------------------------------------------------
-- 5. 后台分类表同步（admin_category / admin_dish 与前台口径一致）
-- ------------------------------------------------------------
CALL _sp_add_col('admin_category', 'level', 'tinyint NOT NULL DEFAULT 1 COMMENT ''层级：1~3''');
CALL _sp_add_col('admin_category', 'path',  'varchar(64) NOT NULL DEFAULT '''' COMMENT ''物化路径''');
CALL _sp_add_col('admin_category', 'icon',  'varchar(8) NULL DEFAULT '''' COMMENT ''分类图标''');

INSERT INTO `admin_category` (`id`, `name`, `parent_id`, `sort_order`, `level`, `path`, `icon`) VALUES
  (1,  '美食',       0, 0, 1, '/1/',    '🍽️'),
  (2,  '面食',       1, 1, 2, '/1/2/',  '🍜'),
  (3,  '快餐',       1, 2, 2, '/1/3/',  '🍔'),
  (4,  '甜点',       1, 3, 2, '/1/4/',  '🍰'),
  (5,  '饮品',       1, 4, 2, '/1/5/',  '🥤'),
  (6,  '轻食',       1, 5, 2, '/1/6/',  '🥗'),
  (7,  '火锅',       1, 6, 2, '/1/7/',  '🍲'),
  (8,  '汤面',       2, 1, 3, '/1/2/8/',   '🍜'),
  (9,  '拌面',       2, 2, 3, '/1/2/9/',   '🥢'),
  (10, '馄饨抄手',   2, 3, 3, '/1/2/10/',  '🥟'),
  (11, '粥粉小食',   2, 4, 3, '/1/2/11/',  '🥣'),
  (12, '汉堡披萨',   3, 1, 3, '/1/3/12/',  '🍔'),
  (13, '炸鸡烤翅',   3, 2, 3, '/1/3/13/',  '🍗'),
  (14, '卷饭塔可',   3, 3, 3, '/1/3/14/',  '🌯'),
  (15, '薯条小食',   3, 4, 3, '/1/3/15/',  '🍟'),
  (16, '蛋糕千层',   4, 1, 3, '/1/4/16/',  '🍰'),
  (17, '布丁芋泥',   4, 2, 3, '/1/4/17/',  '🍮'),
  (18, '咖啡',       5, 1, 3, '/1/5/18/',  '☕'),
  (19, '奶茶果茶',   5, 2, 3, '/1/5/19/',  '🧋'),
  (20, '沙拉',       6, 1, 3, '/1/6/20/',  '🥗'),
  (21, '碗卷三明治', 6, 2, 3, '/1/6/21/',  '🥙'),
  (22, '浓汤饮品',   6, 3, 3, '/1/6/22/',  '🥣'),
  (23, '锅底',       7, 1, 3, '/1/7/23/',  '🍲'),
  (24, '涮菜',       7, 2, 3, '/1/7/24/',  '🥩'),
  (25, '火锅小食',   7, 3, 3, '/1/7/25/',  '🍡')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`), `parent_id` = VALUES(`parent_id`), `sort_order` = VALUES(`sort_order`),
  `level` = VALUES(`level`), `path` = VALUES(`path`), `icon` = VALUES(`icon`);

CALL _sp_add_col('admin_dish', 'category_id', 'bigint NULL COMMENT ''所属分类 id（三级分类改造）''');

-- ------------------------------------------------------------
-- 6. 校验结果（执行后查看输出）
-- ------------------------------------------------------------
SELECT '分类层级分布' AS step, `level`, COUNT(*) AS cnt FROM `category` GROUP BY `level`;
SELECT '未归类菜品' AS step, COUNT(*) AS cnt FROM `dish` WHERE `category_id` IS NULL;
SELECT '有菜品的三级品类' AS step, d.`category_id`, c.`name`, COUNT(*) AS dish_cnt
  FROM `dish` d JOIN `category` c ON c.`id` = d.`category_id`
 GROUP BY d.`category_id`, c.`name` ORDER BY d.`category_id`;

DROP PROCEDURE IF EXISTS `_sp_add_col`;
DROP PROCEDURE IF EXISTS `_sp_add_idx`;
DROP PROCEDURE IF EXISTS `_sp_drop_idx`;
