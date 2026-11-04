-- ============================================================
-- 食光 · 美食  —— 迁移脚本：个人资料 + 收货地址
-- 对应功能：5. 我的页面（头像修改 / 个人信息编辑 / 收货地址管理）
-- ------------------------------------------------------------
-- 使用方式（二选一）：
--   1) 已导入 shiguang_food.sql 的库：直接执行本脚本即可；
--   2) 全新部署：先导入 shiguang_food.sql，再执行本脚本。
-- 说明：本脚本已在 shiguang_food.sql 末尾同步追加一份，全新导入时无需重复执行。
-- 注意：脚本含中文默认值（如 tag 默认 '家'），必须保证连接字符集为 utf8mb4，
--       否则 MySQL 会报 “Invalid default value”。命令行导入请加 --default-character-set=utf8mb4。
-- ============================================================

SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- 1) user 表：新增头像 / 性别 / 手机 / 个性签名
-- ------------------------------------------------------------
ALTER TABLE `user`
  ADD COLUMN `avatar` varchar(16)  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '头像（emoji；空串=用昵称首字作文字头像）' AFTER `nickname`,
  ADD COLUMN `gender` varchar(8)   CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '性别：男/女/空' AFTER `avatar`,
  ADD COLUMN `phone`  varchar(20)  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '手机号' AFTER `gender`,
  ADD COLUMN `bio`    varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '个性签名' AFTER `phone`;

-- ------------------------------------------------------------
-- 2) 收货地址表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_address` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `account` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '所属用户账号',
  `name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '联系人',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '联系电话',
  `tag` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '家' COMMENT '标签：家/公司/学校/其他',
  `province` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '省',
  `city` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '市',
  `detail` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '详细地址',
  `is_default` tinyint NOT NULL DEFAULT 0 COMMENT '是否默认：1=是 0=否',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_account`(`account` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '用户收货地址' ROW_FORMAT = DYNAMIC;

-- ------------------------------------------------------------
-- 3) 演示数据（可选）：给 demo 账号一条默认地址
-- ------------------------------------------------------------
INSERT INTO `user_address` (`account`, `name`, `phone`, `tag`, `province`, `city`, `detail`, `is_default`)
SELECT 'demo', '演示用户', '13800000000', '家', '广东省', '深圳市', '科技园南路 8 号 3 栋 501', 1
WHERE NOT EXISTS (SELECT 1 FROM `user_address` WHERE `account` = 'demo');
