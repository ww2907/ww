# -*- coding: utf-8 -*-
"""把全量脚本 shiguang_food.sql 改造成「分级分类搜索」版本（三级分类）。

背景：
    线上库已由 sql/2026-11-11_category_hierarchy_v2.sql 迁移成三级分类，
    但全量导出脚本 shiguang_food.sql 仍是旧的平铺 7 分类、dish 无 category_id，
    一旦重装/重新导入就退回旧结构，后端 /api/restaurants/category-tree 直接 500。

本脚本做的事（幂等，重复执行结果一致）：
    1. category 建表加 level / path / code / icon / enabled，
       唯一键从 uk_cat_name（全局名称唯一）收窄为 uk_cat_parent_name（同父下唯一）
    2. category 种子数据 7 条 → 25 条（1 一级 + 6 二级 + 18 三级），带物化路径
    3. dish 建表加 category_id + idx_dish_category，350 条 INSERT 逐条补分类
       （菜品→三级品类的归类结果取自线上库，与线上口径完全一致）
    4. admin_category 同步 level / path / icon 与 25 条分类
    5. admin_dish 示例菜品的 category_id 由二级业态细化为三级品类
    6. 文件头补一段「分级分类搜索」用法说明

用法：
    python migrate_category_v3_dump.py            # 改写全量脚本（先自动备份）
    python migrate_category_v3_dump.py --dry-run  # 只打印统计不落盘
"""
import os
import re
import shutil
import subprocess
import sys
import datetime

MYSQL = r"C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # java-main2
SQL_PATH = os.path.join(ROOT, "shiguang_food.sql")
DB = "shiguang_food"

CHARSET = "CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci"

# ---------------------------------------------------------------- 三级分类种子
# (id, name, parent_id, sort_order, level, path, code, icon)
CATEGORIES = [
    (1,  "美食",       0, 0, 1, "/1/",        "food",          "\U0001F37D\uFE0F"),
    (2,  "面食",       1, 1, 2, "/1/2/",      "noodle",        "\U0001F35C"),
    (3,  "快餐",       1, 2, 2, "/1/3/",      "fastfood",      "\U0001F354"),
    (4,  "甜点",       1, 3, 2, "/1/4/",      "dessert",       "\U0001F370"),
    (5,  "饮品",       1, 4, 2, "/1/5/",      "drink",         "\U0001F964"),
    (6,  "轻食",       1, 5, 2, "/1/6/",      "light",         "\U0001F957"),
    (7,  "火锅",       1, 6, 2, "/1/7/",      "hotpot",        "\U0001F372"),
    (8,  "汤面",       2, 1, 3, "/1/2/8/",    "noodle-soup",   "\U0001F35C"),
    (9,  "拌面",       2, 2, 3, "/1/2/9/",    "noodle-mix",    "\U0001F962"),
    (10, "馄饨抄手",   2, 3, 3, "/1/2/10/",   "wonton",        "\U0001F95F"),
    (11, "粥粉小食",   2, 4, 3, "/1/2/11/",   "porridge",      "\U0001F963"),
    (12, "汉堡披萨",   3, 1, 3, "/1/3/12/",   "burger",        "\U0001F354"),
    (13, "炸鸡烤翅",   3, 2, 3, "/1/3/13/",   "fried-chicken", "\U0001F357"),
    (14, "卷饭塔可",   3, 3, 3, "/1/3/14/",   "wrap",          "\U0001F32F"),
    (15, "薯条小食",   3, 4, 3, "/1/3/15/",   "snack",         "\U0001F35F"),
    (16, "蛋糕千层",   4, 1, 3, "/1/4/16/",   "cake",          "\U0001F370"),
    (17, "布丁芋泥",   4, 2, 3, "/1/4/17/",   "pudding",       "\U0001F36E"),
    (18, "咖啡",       5, 1, 3, "/1/5/18/",   "coffee",        "\u2615"),
    (19, "奶茶果茶",   5, 2, 3, "/1/5/19/",   "tea",           "\U0001F9CB"),
    (20, "沙拉",       6, 1, 3, "/1/6/20/",   "salad",         "\U0001F957"),
    (21, "碗卷三明治", 6, 2, 3, "/1/6/21/",   "bowl",          "\U0001F959"),
    (22, "浓汤饮品",   6, 3, 3, "/1/6/22/",   "soup",          "\U0001F963"),
    (23, "锅底",       7, 1, 3, "/1/7/23/",   "hotpot-base",   "\U0001F372"),
    (24, "涮菜",       7, 2, 3, "/1/7/24/",   "hotpot-dish",   "\U0001F969"),
    (25, "火锅小食",   7, 3, 3, "/1/7/25/",   "hotpot-snack",  "\U0001F361"),
]

HEADER_DOC = """-- ============================================================
-- 分级分类搜索（三级分类 + 物化路径）
-- ------------------------------------------------------------
-- category 是一棵三层树，一条记录一个节点：
--   1  美食                     level=1  path=/1/
--   ├─ 2  面食                 level=2  path=/1/2/
--   │   ├─ 8  汤面             level=3  path=/1/2/8/
--   │   └─ 9  拌面             level=3  path=/1/2/9/
--   └─ 3  快餐 …（共 6 个二级业态、18 个三级品类）
--
-- 关键字段
--   parent_id  父子关系，0=顶级
--   level      1/2/3，前端按层渲染级联筛选
--   path       物化路径，子树查询统一 path LIKE '/1/2/%'（命中自己 + 所有后代，走 idx_path）
--   code       业务编码（noodle-soup 等），给前后端硬编码引用，改名不改码
--   enabled    停用后不出现在分类树与筛选结果里
--
-- 归属口径
--   restaurant.category_id → 二级业态（一家面馆同时卖汤面和拌面，店铺不该挂到三级）
--   dish.category_id       → 三级品类（菜品是分类搜索的最小粒度）
--
-- 典型查询
--   -- ① 取整棵分类树（前端级联筛选数据源）
--   SELECT id,name,parent_id,level,path,code,icon FROM category WHERE enabled=1 ORDER BY level,sort_order,id;
--   -- ② 选中某个分类时，先拿子树（含自己）
--   SELECT id FROM category WHERE path LIKE CONCAT((SELECT path FROM category WHERE id=2), '%');
--   -- ③ 按三级品类搜菜品（菜品级分类搜索）
--   SELECT * FROM dish WHERE category_id IN (8,9);
--   -- ④ 按分类搜店铺：直接挂该业态的店 + 卖该品类菜的店（去重）
--   SELECT DISTINCT r.* FROM restaurant r
--     LEFT JOIN dish d ON d.restaurant_id = r.id
--    WHERE r.category_id IN (2) OR d.category_id IN (8,9);
-- ============================================================

"""


def run_sql(sql, database=None):
    cmd = [MYSQL, "-uroot", "-p123456", "--default-character-set=utf8mb4", "-B", "-N"]
    if database:
        cmd.append(database)
    cmd += ["-e", sql]
    out = subprocess.run(cmd, capture_output=True)
    if out.returncode != 0:
        raise SystemExit("MySQL 执行失败: " + out.stderr.decode("utf-8", "ignore"))
    return out.stdout.decode("utf-8", "ignore")


def load_dish_mapping():
    """菜品 → 三级品类，直接取线上库（已归类、已验证）的结果。"""
    rows = run_sql("SELECT id, category_id, name FROM dish ORDER BY id", DB).strip().splitlines()
    mapping, by_name = {}, {}
    for line in rows:
        if not line.strip():
            continue
        did, cid, name = line.split("\t")
        mapping[int(did)] = int(cid)
        by_name.setdefault(name, int(cid))
    return mapping, by_name


def cat_create_sql():
    cols = [
        "  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',",
        "  `name` varchar(32) %s NOT NULL COMMENT '分类名称'," % CHARSET,
        "  `parent_id` bigint NOT NULL DEFAULT 0 COMMENT '父分类id；0=顶级',",
        "  `sort_order` int NOT NULL DEFAULT 0 COMMENT '排序权重',",
        "  `level` tinyint NOT NULL DEFAULT 1 COMMENT '层级：1=一级 2=二级 3=三级',",
        "  `path` varchar(64) %s NOT NULL DEFAULT '' COMMENT '物化路径，形如 /1/2/8/，子树查询走 idx_path'," % CHARSET,
        "  `code` varchar(32) %s NULL COMMENT '业务编码，供前后端硬编码引用'," % CHARSET,
        "  `icon` varchar(8) %s NULL DEFAULT '' COMMENT '分类图标 emoji'," % CHARSET,
        "  `enabled` tinyint NOT NULL DEFAULT 1 COMMENT '是否启用：1=启用 0=停用',",
        "  PRIMARY KEY (`id`) USING BTREE,",
        "  UNIQUE INDEX `uk_cat_parent_name`(`parent_id` ASC, `name` ASC) USING BTREE,",
        "  INDEX `idx_parent`(`parent_id` ASC) USING BTREE,",
        "  INDEX `idx_path`(`path` ASC) USING BTREE,",
        "  INDEX `idx_level`(`level` ASC) USING BTREE",
        ") ENGINE = InnoDB AUTO_INCREMENT = 26 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci "
        "COMMENT = '分类表（三级分类 + 物化路径，支撑分级分类搜索）' ROW_FORMAT = DYNAMIC;",
    ]
    return "CREATE TABLE `category`  (\n" + "\n".join(cols)


def cat_insert_sql():
    head = ("INSERT INTO `category` (`id`, `name`, `parent_id`, `sort_order`, "
            "`level`, `path`, `code`, `icon`, `enabled`) VALUES ")
    body = ["%s(%d, '%s', %d, %d, %d, '%s', '%s', '%s', 1)"
            % (head, cid, name, pid, sort, level, path, code, icon)
            for cid, name, pid, sort, level, path, code, icon in CATEGORIES]
    return ";\n".join(body) + ";"


def admin_cat_create_sql():
    cols = [
        "  `id` bigint NOT NULL AUTO_INCREMENT,",
        "  `name` varchar(64) %s NULL DEFAULT NULL," % CHARSET,
        "  `parent_id` bigint NULL DEFAULT NULL,",
        "  `sort_order` int NULL DEFAULT NULL,",
        "  `level` tinyint NOT NULL DEFAULT 1 COMMENT '层级：1~3，与前台 category 一致',",
        "  `path` varchar(64) %s NOT NULL DEFAULT '' COMMENT '物化路径，与前台 category 一致'," % CHARSET,
        "  `icon` varchar(8) %s NULL DEFAULT '' COMMENT '分类图标'," % CHARSET,
        "  PRIMARY KEY (`id`) USING BTREE,",
        "  INDEX `idx_admin_cat_parent`(`parent_id` ASC) USING BTREE",
        ") ENGINE = InnoDB AUTO_INCREMENT = 26 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci "
        "COMMENT = '后台分类表（与前台 category 同口径）' ROW_FORMAT = DYNAMIC;",
    ]
    return "CREATE TABLE `admin_category`  (\n" + "\n".join(cols)


def admin_cat_insert_sql():
    head = ("INSERT INTO `admin_category` (`id`, `name`, `parent_id`, `sort_order`, `level`, `path`, `icon`) VALUES ")
    body = ["%s(%d, '%s', %d, %d, %d, '%s', '%s')" % (head, cid, name, pid, sort, level, path, icon)
            for cid, name, pid, sort, level, path, code, icon in CATEGORIES]
    return ";\n".join(body) + ";"


def replace_block(text, start_re, end_marker, new_text, label):
    m = re.search(start_re, text, re.S)
    if not m:
        raise SystemExit("找不到块: " + label)
    start = m.start()
    end = text.find(end_marker, start)
    if end < 0:
        raise SystemExit("找不到块结尾: " + label)
    end += len(end_marker)
    return text[:start] + new_text + text[end:]


DISH_RE = re.compile(r"^INSERT INTO `dish` VALUES \((\d+),(.*)\);[ \t]*$", re.M)
# 字段顺序：id, name, price, emoji, category_id, description, sort, enabled
ADMIN_DISH_RE = re.compile(
    r"^INSERT INTO `admin_dish` VALUES \((\d+), '([^']+)',(  ?\d+\.\d+, '[^']*'), (\d+), ('[^']*'), (\d+), (\d+)\);[ \t]*$", re.M)


def main():
    dry = "--dry-run" in sys.argv
    dish_map, name_map = load_dish_mapping()
    if not dish_map:
        raise SystemExit("线上库 dish.category_id 为空，请先执行 sql/2026-11-11_category_hierarchy_v2.sql")

    text = open(SQL_PATH, encoding="utf-8").read()
    original = text
    changed = []

    # 幂等判据：先取一次「改造前」的状态，后面所有步骤只看它，避免二次执行叠加
    has_header = "分级分类搜索（三级分类 + 物化路径）" in text
    has_cat_v3 = "`uk_cat_parent_name`" in text
    has_dish_col = "`idx_dish_category`" in text
    has_admin_v3 = "`idx_admin_cat_parent`" in text

    # 0. 文件头补说明
    if not has_header:
        text = text.replace("SET NAMES utf8mb4;", HEADER_DOC + "SET NAMES utf8mb4;", 1)
        changed.append("文件头补「分级分类搜索」说明 + 典型查询")

    # 1. category 建表
    if not has_cat_v3:
        text = replace_block(text, r"CREATE TABLE `category`  \(", "ROW_FORMAT = DYNAMIC;",
                             cat_create_sql(), "category 建表")
        changed.append("category 建表：加 level/path/code/icon/enabled + 唯一键收窄为(同父,名称)")

    # 2. category 种子数据
    old_cat_rows = re.findall(r"^INSERT INTO `category` VALUES .*?;\n", text, re.M)
    if old_cat_rows and "`level`, `path`" not in old_cat_rows[0]:
        first = text.index(old_cat_rows[0])
        end = text.index(old_cat_rows[-1]) + len(old_cat_rows[-1])
        text = text[:first] + cat_insert_sql() + "\n" + text[end:]
        changed.append("category 种子：%d 条平铺 → %d 条三级" % (len(old_cat_rows), len(CATEGORIES)))

    # 3. dish 建表加 category_id
    if not has_dish_col:
        text = text.replace(
            "  `specs` text %s NULL COMMENT '规格 JSON',\n" % CHARSET,
            "  `specs` text %s NULL COMMENT '规格 JSON',\n"
            "  `category_id` bigint NULL DEFAULT NULL COMMENT '所属三级分类 id（分级分类搜索用）',\n" % CHARSET, 1)
        text = text.replace(
            "  INDEX `idx_rest`(`restaurant_id` ASC) USING BTREE\n) ENGINE = InnoDB AUTO_INCREMENT = 351",
            "  INDEX `idx_rest`(`restaurant_id` ASC) USING BTREE,\n"
            "  INDEX `idx_dish_category`(`category_id` ASC) USING BTREE\n) ENGINE = InnoDB AUTO_INCREMENT = 351", 1)
        changed.append("dish 建表：加 category_id + idx_dish_category")

    # 4. dish 350 条 INSERT 补分类
    filled = [0]
    missed = [0]

    def add_cat(m):
        cid = dish_map.get(int(m.group(1)))
        if cid is None:
            missed[0] += 1
            return m.group(0)
        filled[0] += 1
        return "INSERT INTO `dish` VALUES (%s,%s, %d);" % (m.group(1), m.group(2), cid)

    if not has_dish_col:
        text = DISH_RE.sub(add_cat, text)
        changed.append("dish 归类：写入 %d 条（未命中 %d 条）" % (filled[0], missed[0]))

    # 4.1 restaurant.category_id 补索引（分类搜店铺要按它过滤）
    if "`idx_rest_category`" not in text:
        text = text.replace(
            "  INDEX `idx_cat`(`cat` ASC) USING BTREE\n) ENGINE = InnoDB AUTO_INCREMENT = 71",
            "  INDEX `idx_cat`(`cat` ASC) USING BTREE,\n"
            "  INDEX `idx_rest_category`(`category_id` ASC) USING BTREE\n) ENGINE = InnoDB AUTO_INCREMENT = 71", 1)
        changed.append("restaurant 建表：加 idx_rest_category")

    # 5. admin_category 建表 + 数据
    if not has_admin_v3:
        text = replace_block(text, r"CREATE TABLE `admin_category`  \(", "ROW_FORMAT = DYNAMIC;",
                             admin_cat_create_sql(), "admin_category 建表")
        changed.append("admin_category 建表：加 level/path/icon + idx_admin_cat_parent")
    old_admin_rows = re.findall(r"^INSERT INTO `admin_category` VALUES .*?;\n", text, re.M)
    if old_admin_rows and "`level`, `path`, `icon`" not in old_admin_rows[0]:
        first = text.index(old_admin_rows[0])
        end = text.index(old_admin_rows[-1]) + len(old_admin_rows[-1])
        text = text[:first] + admin_cat_insert_sql() + "\n" + text[end:]
        changed.append("admin_category 种子：%d 条 → %d 条（与前台同口径）" % (len(old_admin_rows), len(CATEGORIES)))

    # 6. admin_dish 示例菜品：二级业态 → 三级品类
    adm = [0]

    def fix_admin_dish(m):
        cid = name_map.get(m.group(2))
        if cid is None:
            return m.group(0)
        adm[0] += 1
        return ("INSERT INTO `admin_dish` VALUES (%s, '%s',%s, %d, %s, %s, %s);"
                % (m.group(1), m.group(2), m.group(3), cid, m.group(5), m.group(6), m.group(7)))

    if not has_admin_v3:
        text = ADMIN_DISH_RE.sub(fix_admin_dish, text)
        if adm[0]:
            changed.append("admin_dish 细化：%d 条示例菜品由二级业态改挂三级品类" % adm[0])

    text = re.sub(r"\n{4,}", "\n\n\n", text)

    print("变更项：")
    for c in changed:
        print("  -", c)

    if text == original:
        print("文件无变化（已是分级分类版本）")
        return
    if dry:
        print("dry-run：未落盘")
        return

    bak = SQL_PATH + ".bak_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    shutil.copy2(SQL_PATH, bak)
    open(SQL_PATH, "w", encoding="utf-8", newline="\n").write(text)
    print("已改写：", SQL_PATH)
    print("备份：", bak)


if __name__ == "__main__":
    main()
