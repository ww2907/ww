# -*- coding: utf-8 -*-
"""
把 7 个后台管理模块的数据从真实业务表同步到 admin_* 专属快照表。

背景：
  用户希望在 Navicat 里看到「导航 / 搜索 / 推荐 / 菜品 / 数字 / 用户 / 订单」
  这 7 个后台模块各自专属的数据表和数据资料。此前这些数据分散在
  admin_config 的 3 条 JSON、以及 dish / user / orders 等真实表里，
  Navicat 里没有一一对应的表。

设计（两全）：
  - 本脚本建 7 张 admin_* 表并把真实表数据填满 -> Navicat 里完整可见；
  - 后台实时 CRUD 仍然读写真实业务表（category/dish/user/orders/admin_config），
    **不读写这些快照表** -> 不会重蹈「后台改了前台无效」的镜像表覆辙。
  - 这些表是某个时刻的数据快照，真实表变化后重跑本脚本即可刷新。

用法：
  python sync_admin_snapshot_tables.py
（可重复执行：每张表先 DROP 再 CREATE，数据每次从真实表重新同步）
"""
import subprocess
import sys
import json

MYSQL = r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
DB = "shiguang_food"
BASE = [
    MYSQL, "-uroot", "-p123456", "-D", DB,
    "--default-character-set=utf8mb4", "--batch", "--raw", "--skip-column-names",
]


def run(sql):
    """把 SQL 从 stdin 喂给 mysql，避免 -e 参数长度/中文编码问题。"""
    r = subprocess.run(BASE, input=sql, capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        print("SQL ERROR:\n" + r.stderr)
        sys.exit(1)
    return r.stdout


def one(sql):
    out = run(sql).strip()
    return out.split("\t") if out else []


def rows(sql):
    return [line.split("\t") for line in run(sql).splitlines() if line != ""]


def esc(v):
    if v is None:
        return "NULL"
    s = str(v).replace("\\", "\\\\").replace("'", "''")
    return "'" + s + "'"


def num(v, default="0"):
    return default if v in (None, "") else str(v)


# ---------- 读真实配置 ----------
nav = json.loads(one("SELECT config_value FROM admin_config WHERE config_key='nav'")[0])
search = json.loads(one("SELECT config_value FROM admin_config WHERE config_key='search'")[0])
recommend = json.loads(one("SELECT config_value FROM admin_config WHERE config_key='recommend'")[0])
rec_ids = [int(x) for x in recommend.get("ids", [])]
rec_rank = {rid: i + 1 for i, rid in enumerate(rec_ids)}

stmts = []


def table(name, ddl):
    stmts.append("DROP TABLE IF EXISTS `%s`;" % name)
    stmts.append(ddl)


# ============ 1. admin_nav 导航管理 ============
table("admin_nav", """
CREATE TABLE `admin_nav` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `area` VARCHAR(10) NOT NULL COMMENT '区域 top-顶部 / bottom-底部',
  `item_key` VARCHAR(32) NOT NULL COMMENT '菜单标识 home/food/order/mine',
  `label` VARCHAR(32) NOT NULL COMMENT '菜单名称',
  `icon` VARCHAR(8) DEFAULT '' COMMENT '图标 emoji',
  `sort` INT DEFAULT 0 COMMENT '排序',
  `enabled` TINYINT DEFAULT 1 COMMENT '是否显示 1-是 0-否'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台导航管理-数据快照(非实时数据源,重跑sync脚本刷新)';
""")
for area in ("top", "bottom"):
    for it in nav.get(area, []):
        stmts.append(
            "INSERT INTO `admin_nav` (`area`,`item_key`,`label`,`icon`,`sort`,`enabled`) "
            "VALUES (%s,%s,%s,%s,%s,%s);" % (
                esc(area), esc(it.get("id", "")), esc(it.get("label", "")),
                esc(it.get("icon", "")), num(it.get("sort"), "0"),
                "1" if it.get("enabled") else "0",
            )
        )

# ============ 2. admin_search 搜索管理 ============
table("admin_search", """
CREATE TABLE `admin_search` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cfg_key` VARCHAR(16) NOT NULL DEFAULT 'search' COMMENT '配置键',
  `placeholder` VARCHAR(64) NOT NULL COMMENT '搜索框占位文案',
  `hotwords` VARCHAR(255) NOT NULL COMMENT '热门搜索词(逗号分隔)',
  `hotword_count` INT DEFAULT 0 COMMENT '热词数量',
  `synced_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '同步时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台搜索管理-数据快照(非实时数据源,重跑sync脚本刷新)';
""")
hotwords = search.get("hotwords", []) or []
stmts.append(
    "INSERT INTO `admin_search` (`cfg_key`,`placeholder`,`hotwords`,`hotword_count`) "
    "VALUES ('search',%s,%s,%d);" % (
        esc(search.get("placeholder", "")), esc("，".join(str(w) for w in hotwords)), len(hotwords),
    )
)

# ============ 3. admin_recommend 推荐管理 ============
table("admin_recommend", """
CREATE TABLE `admin_recommend` (
  `restaurant_id` BIGINT PRIMARY KEY COMMENT '店铺id(源自restaurant)',
  `name` VARCHAR(64) NOT NULL COMMENT '店铺名称',
  `emoji` VARCHAR(8) DEFAULT '' COMMENT '图标 emoji',
  `cat` VARCHAR(32) DEFAULT '' COMMENT '分类',
  `rating` DECIMAL(2,1) DEFAULT 0.0 COMMENT '评分',
  `distance` VARCHAR(16) DEFAULT '' COMMENT '距离',
  `recommended` TINYINT DEFAULT 0 COMMENT '是否推荐 1-是 0-否',
  `sort` INT DEFAULT 0 COMMENT '推荐顺序(0-未推荐)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台推荐管理-数据快照(非实时数据源,重跑sync脚本刷新)';
""")
in_list = ",".join(str(x) for x in rec_ids) if rec_ids else "NULL"
case_sort = " ".join("WHEN %d THEN %d" % (rid, rank) for rid, rank in rec_rank.items())
stmts.append("""
INSERT INTO `admin_recommend`
  (`restaurant_id`,`name`,`emoji`,`cat`,`rating`,`distance`,`recommended`,`sort`)
SELECT r.id, r.name, COALESCE(r.emoji,''), COALESCE(r.cat,''), COALESCE(r.rating,0),
       COALESCE(r.distance,''),
       CASE WHEN r.id IN (%s) THEN 1 ELSE 0 END,
       CASE r.id %s ELSE 0 END
FROM restaurant r;
""" % (in_list, case_sort))

# ============ 4. admin_dish 菜品管理 ============
table("admin_dish", """
CREATE TABLE `admin_dish` (
  `id` BIGINT PRIMARY KEY COMMENT '菜品id(源自dish)',
  `restaurant_id` BIGINT NOT NULL COMMENT '所属店铺id',
  `restaurant_name` VARCHAR(64) DEFAULT '' COMMENT '所属店铺名称',
  `name` VARCHAR(64) NOT NULL COMMENT '菜品名称',
  `price` DECIMAL(8,2) NOT NULL COMMENT '价格',
  `emoji` VARCHAR(8) DEFAULT '' COMMENT '图标 emoji',
  `category_id` BIGINT DEFAULT NULL COMMENT '三级分类id',
  `category_name` VARCHAR(32) DEFAULT '' COMMENT '分类名称',
  `description` VARCHAR(255) DEFAULT '' COMMENT '描述',
  `sort` INT DEFAULT 0 COMMENT '排序',
  `enabled` TINYINT DEFAULT 1 COMMENT '上架状态'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台菜品管理-数据快照(非实时数据源,后台实时CRUD走dish表)';
""")
stmts.append("""
INSERT INTO `admin_dish`
  (`id`,`restaurant_id`,`restaurant_name`,`name`,`price`,`emoji`,`category_id`,`category_name`,`description`,`sort`,`enabled`)
SELECT d.id, d.restaurant_id, COALESCE(r.name,''), d.name, d.price, COALESCE(d.emoji,''),
       d.category_id, COALESCE(c.name,'未分类'), COALESCE(d.description,''),
       COALESCE(d.sort,0), COALESCE(d.enabled,1)
FROM dish d
LEFT JOIN restaurant r ON d.restaurant_id = r.id
LEFT JOIN category c ON d.category_id = c.id;
""")

# ============ 5. admin_dashboard_stat 数字管理 ============
table("admin_dashboard_stat", """
CREATE TABLE `admin_dashboard_stat` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `stat_group` VARCHAR(24) NOT NULL COMMENT '指标组 overview/category_dist/price_dist/order_trend/top_dishes',
  `stat_key` VARCHAR(32) NOT NULL COMMENT '指标键',
  `stat_label` VARCHAR(64) DEFAULT '' COMMENT '指标名称',
  `stat_value` VARCHAR(64) DEFAULT '' COMMENT '指标值',
  `stat_extra` VARCHAR(64) DEFAULT '' COMMENT '补充值(金额/价格合计等)',
  `stat_date` DATE DEFAULT NULL COMMENT '日期(订单趋势用)',
  `synced_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '同步时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台数字管理-经营指标快照(非实时数据源,重跑sync脚本刷新)';
""")
# overview：8 个核心指标，一次查回
ov = one("""
SELECT
 (SELECT COUNT(*) FROM orders),
 (SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE status IN (1,2)),
 (SELECT COUNT(*) FROM user),
 (SELECT COUNT(*) FROM dish),
 (SELECT COUNT(*) FROM dish WHERE enabled=1),
 (SELECT COUNT(*) FROM category),
 (SELECT COUNT(*) FROM orders WHERE DATE(created_at)=CURDATE()),
 (SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE status IN (1,2) AND DATE(created_at)=CURDATE());
""")
ov_defs = [
    ("orderTotal", "累计订单数"), ("gmv", "累计营业额"), ("userTotal", "注册用户数"),
    ("dishTotal", "菜品总数"), ("dishOnSale", "在售菜品数"), ("categoryTotal", "分类数"),
    ("todayOrder", "今日订单数"), ("todayGmv", "今日营业额"),
]
for (key, label), val in zip(ov_defs, ov):
    stmts.append(
        "INSERT INTO `admin_dashboard_stat` (`stat_group`,`stat_key`,`stat_label`,`stat_value`) "
        "VALUES ('overview',%s,%s,%s);" % (esc(key), esc(label), esc(val))
    )
# category_dist：各分类菜品数 + 价格合计
for r in rows("""
SELECT COALESCE(c.id,0), COALESCE(c.name,'未分类'), COUNT(d.id), COALESCE(SUM(d.price),0)
FROM dish d LEFT JOIN category c ON d.category_id=c.id
GROUP BY c.id,c.name ORDER BY COUNT(d.id) DESC;
"""):
    stmts.append(
        "INSERT INTO `admin_dashboard_stat` (`stat_group`,`stat_key`,`stat_label`,`stat_value`,`stat_extra`) "
        "VALUES ('category_dist',%s,%s,%s,%s);" % (esc(r[0]), esc(r[1]), esc(r[2]), esc(r[3]))
    )
# price_dist：5 档价格区间
price_ranges = []
for r in rows("""
SELECT CASE WHEN price<15 THEN '0-15' WHEN price<25 THEN '15-25' WHEN price<35 THEN '25-35'
            WHEN price<50 THEN '35-50' ELSE '50+' END AS pr, COUNT(*)
FROM dish GROUP BY pr;
"""):
    price_ranges.append((r[0], r[1]))
order_pr = ["0-15", "15-25", "25-35", "35-50", "50+"]
pr_map = dict(price_ranges)
for pr in order_pr:
    stmts.append(
        "INSERT INTO `admin_dashboard_stat` (`stat_group`,`stat_key`,`stat_label`,`stat_value`) "
        "VALUES ('price_dist',%s,%s,%s);" % (esc(pr), esc(pr + " 元"), esc(pr_map.get(pr, "0")))
    )
# order_trend：近 14 天（含今日）订单数 + 营业额，缺天补 0
trend_map = {}
for r in rows("""
SELECT DATE(created_at), COUNT(*), COALESCE(SUM(total_amount),0)
FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
GROUP BY DATE(created_at) ORDER BY DATE(created_at);
"""):
    trend_map[r[0]] = (r[1], r[2])
import datetime as _dt
_today = _dt.date.today()
for i in range(13, -1, -1):
    d = (_today - _dt.timedelta(days=i)).isoformat()
    cnt, gmv = trend_map.get(d, ("0", "0.00"))
    stmts.append(
        "INSERT INTO `admin_dashboard_stat` (`stat_group`,`stat_key`,`stat_label`,`stat_value`,`stat_extra`,`stat_date`) "
        "VALUES ('order_trend',%s,%s,%s,%s,%s);" % (esc(d), esc(d), esc(cnt), esc(gmv), esc(d))
    )
# top_dishes：热销菜品 Top5
for r in rows("""
SELECT oi.dish_name, SUM(oi.qty), COALESCE(SUM(oi.subtotal),0)
FROM order_item oi JOIN orders o ON oi.order_id=o.id
GROUP BY oi.dish_name ORDER BY SUM(oi.qty) DESC LIMIT 5;
"""):
    stmts.append(
        "INSERT INTO `admin_dashboard_stat` (`stat_group`,`stat_key`,`stat_label`,`stat_value`,`stat_extra`) "
        "VALUES ('top_dishes',%s,%s,%s,%s);" % (esc(r[0]), esc(r[0]), esc(r[1]), esc(r[2]))
    )

# ============ 6. admin_user 用户管理 ============
table("admin_user", """
CREATE TABLE `admin_user` (
  `id` BIGINT PRIMARY KEY COMMENT '用户id(源自user)',
  `account` VARCHAR(64) NOT NULL COMMENT '登录账号',
  `nickname` VARCHAR(20) DEFAULT '' COMMENT '昵称',
  `avatar` VARCHAR(16) DEFAULT '' COMMENT '头像 emoji',
  `gender` VARCHAR(8) DEFAULT '' COMMENT '性别',
  `phone` VARCHAR(20) DEFAULT '' COMMENT '手机号',
  `bio` VARCHAR(128) DEFAULT '' COMMENT '个性签名',
  `account_type` TINYINT DEFAULT 0 COMMENT '账号类型 0-用户名 1-手机 2-邮箱',
  `status` TINYINT DEFAULT 1 COMMENT '状态 1-正常 0-禁用',
  `created_at` DATETIME DEFAULT NULL COMMENT '注册时间',
  `address_count` INT DEFAULT 0 COMMENT '收货地址数量'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台用户管理-数据快照(不含密码,非实时数据源,重跑sync脚本刷新)';
""")
stmts.append("""
INSERT INTO `admin_user`
  (`id`,`account`,`nickname`,`avatar`,`gender`,`phone`,`bio`,`account_type`,`status`,`created_at`,`address_count`)
SELECT u.id, u.account, COALESCE(u.nickname,''), COALESCE(u.avatar,''), COALESCE(u.gender,''),
       COALESCE(u.phone,''), COALESCE(u.bio,''), u.account_type, u.status, u.created_at,
       (SELECT COUNT(*) FROM user_address a WHERE a.account=u.account)
FROM user u;
""")

# ============ 7. admin_order 订单管理 ============
table("admin_order", """
CREATE TABLE `admin_order` (
  `id` BIGINT PRIMARY KEY COMMENT '订单id(源自orders)',
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单编号',
  `account` VARCHAR(64) DEFAULT '' COMMENT '下单账号',
  `restaurant` VARCHAR(64) DEFAULT '' COMMENT '店铺名称',
  `items` VARCHAR(500) DEFAULT '' COMMENT '菜品明细快照',
  `amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '订单金额',
  `status_code` TINYINT DEFAULT 0 COMMENT '状态码 0-3',
  `status` VARCHAR(8) DEFAULT '' COMMENT '状态中文',
  `receiver_name` VARCHAR(20) DEFAULT '' COMMENT '收货人',
  `receiver_phone` VARCHAR(20) DEFAULT '' COMMENT '收货电话',
  `address` VARCHAR(255) DEFAULT '' COMMENT '收货地址快照',
  `created_at` DATETIME DEFAULT NULL COMMENT '下单时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台订单管理-数据快照(非实时数据源,后台实时CRUD走orders表)';
""")
stmts.append("""
INSERT INTO `admin_order`
  (`id`,`order_no`,`account`,`restaurant`,`items`,`amount`,`status_code`,`status`,
   `receiver_name`,`receiver_phone`,`address`,`created_at`)
SELECT o.id, o.order_no, COALESCE(o.account,''), COALESCE(o.restaurant_name,''),
       COALESCE((SELECT GROUP_CONCAT(CONCAT(oi.dish_name,' x',oi.qty) SEPARATOR ', ')
                 FROM order_item oi WHERE oi.order_id=o.id), ''),
       o.total_amount, o.status,
       CASE o.status WHEN 1 THEN '已支付' WHEN 2 THEN '已完成' WHEN 3 THEN '已取消' ELSE '待支付' END,
       o.receiver_name, o.receiver_phone, o.address, o.created_at
FROM orders o;
""")

# ---------- 执行 ----------
print("同步 7 张后台快照表 ...")
run("\n".join(stmts))
print("完成。各表行数：")
print(run("""
SELECT 'admin_nav' t, COUNT(*) n FROM admin_nav
UNION ALL SELECT 'admin_search', COUNT(*) FROM admin_search
UNION ALL SELECT 'admin_recommend', COUNT(*) FROM admin_recommend
UNION ALL SELECT 'admin_dish', COUNT(*) FROM admin_dish
UNION ALL SELECT 'admin_dashboard_stat', COUNT(*) FROM admin_dashboard_stat
UNION ALL SELECT 'admin_user', COUNT(*) FROM admin_user
UNION ALL SELECT 'admin_order', COUNT(*) FROM admin_order;
"""))
