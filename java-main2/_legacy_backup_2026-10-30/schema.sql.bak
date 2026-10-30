-- 后台管理相关表（H2 内存库，每次启动由 spring.sql.init 重建）
CREATE TABLE IF NOT EXISTS admin_config (
  config_key   VARCHAR(64) PRIMARY KEY,
  config_value VARCHAR(4000)
);

CREATE TABLE IF NOT EXISTS admin_category (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(64),
  parent_id  BIGINT,
  sort_order INT
);

CREATE TABLE IF NOT EXISTS admin_dish (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(128),
  price       DECIMAL(10, 2),
  emoji       VARCHAR(16),
  category_id BIGINT,
  description VARCHAR(512),
  sort        INT,
  enabled     BOOLEAN
);

CREATE TABLE IF NOT EXISTS admin_user (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  account     VARCHAR(64),
  nickname    VARCHAR(64),
  account_type INT,
  status      INT,
  created_at  VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS admin_order (
  id         VARCHAR(64) PRIMARY KEY,
  account    VARCHAR(64),
  restaurant VARCHAR(128),
  items      VARCHAR(512),
  amount     DECIMAL(10, 2),
  status     VARCHAR(32),
  created_at VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS admin_account (
  account  VARCHAR(64) PRIMARY KEY,
  password VARCHAR(128)
);
