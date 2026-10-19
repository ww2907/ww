-- ============================================================
-- 食光美食 · 用户中心 建库建表脚本（图片验证码方案 · 最终版）
-- ------------------------------------------------------------
-- 技术栈：Spring Boot 3.4.5 + MyBatis-Plus 3.5.9 + MySQL 8.0
-- 数据库连接：127.0.0.1:3306，用户 root，密码 123456
--           （与 application-dev.properties 中 spring.datasource 配置一致）
--
-- 验证码说明：注册 / 登录 / 找回密码均已使用「图片验证码」，
--           由后端 CaptchaService 生成并存放于内存（captchaId -> code，
--           5 分钟有效、一次性消费），**不依赖任何验证码数据表**。
--           下方 verify_code 表为旧「数字验证码」方案遗留，仅作备份，
--           新方案不再读写，可按需删除。
--
-- 执行方式（任选其一）：
--   命令行：mysql -uroot -p123456 < sql/init.sql
--   IDEA ：打开本文件 → 右上角选择 MySQL 数据源 → 执行（Run）
--
-- ⚠ 注意：本脚本包含 DROP TABLE，重复执行会清空已有用户数据！
-- ============================================================

-- 确保连接使用 utf8mb4，避免中文默认值/注释出现乱码或报错
SET NAMES utf8mb4;

-- 1) 创建数据库（不存在才创建），字符集 utf8mb4
CREATE DATABASE IF NOT EXISTS shiguang_food
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE shiguang_food;

-- 2) 用户表（登录 / 注册 / 找回密码 共用）
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id`           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  `account`      VARCHAR(64)  NOT NULL COMMENT '登录账号：用户名（3-20 位字母、数字或下划线）',
  `password`     VARCHAR(100) NOT NULL COMMENT 'BCrypt 加密后的密码',
  `nickname`     VARCHAR(20)  DEFAULT '美食家' COMMENT '昵称',
  `account_type` TINYINT      NOT NULL DEFAULT 0 COMMENT '账号类型：0=用户名 1=手机 2=邮箱',
  `status`       TINYINT      NOT NULL DEFAULT 1 COMMENT '状态：1=正常 0=禁用',
  `created_at`   DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_account` (`account`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci
  COMMENT='用户表';

-- 3) 预置演示账号：demo / 123456（密码为 BCrypt 散列，可直接登录）
INSERT INTO `user` (`account`, `password`, `nickname`, `account_type`, `status`)
VALUES ('demo', '$2a$10$z3AJZVEowSWv/f0EA5LSkOOe0JMvdjwJZgpO60ObfiAvvvbslm9ey', '演示用户', 0, 1);

-- 4) 验证码表【旧方案遗留，图片验证码方案不使用，可删除】
DROP TABLE IF EXISTS `verify_code`;
CREATE TABLE `verify_code` (
  `id`         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
  `account`    VARCHAR(64) NOT NULL COMMENT '账号',
  `code`       VARCHAR(10) NOT NULL COMMENT '验证码',
  `scene`      TINYINT     NOT NULL DEFAULT 1 COMMENT '场景：1=注册 2=找回密码',
  `expire_at`  DATETIME    NOT NULL COMMENT '过期时间',
  `used`       TINYINT     NOT NULL DEFAULT 0 COMMENT '是否已使用：0=否 1=是',
  `created_at` DATETIME    DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_account_scene` (`account`, `scene`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci
  COMMENT='验证码表（旧数字验证码方案遗留，现使用图片验证码，不读写本表）';
