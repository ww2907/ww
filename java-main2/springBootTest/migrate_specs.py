# -*- coding: utf-8 -*-
"""给 shiguang_food.sql 增补：
1. restaurant 表新增经营字段：min_order / delivery_fee / eta / open_status
2. dish 表新增 specs 字段（规格 JSON）
3. 70 家店 INSERT 追加经营数据；350 道菜 INSERT 追加规格 JSON

规则（确定性、幂等）：
- 起送价 min_order：面食20 快餐20 甜点25 饮品15 轻食30 火锅50，+ (id%2)*5
- 配送费 delivery_fee：按距离 0/1/2/3/5 元
- 送达时间 eta：按距离 25/30/35/40/50 分钟
- 营业状态 open_status：id%7==0 打烊(0)，其余营业中(1)
- 规格 specs：按分类生成「分量/辣度/甜度/冰量/锅底 + 加料」模板
"""
import csv
import io
import json
import re

PATH = r"D:/workSpace/ww/java-main2/shiguang_food.sql"

with open(PATH, encoding="utf-8") as f:
    content = f.read()

# ---------- 1. dish 表结构：sort 后加 specs 列 ----------
dish_anchor = (
    "  `sort` int NULL DEFAULT 0 COMMENT '排序权重',\n"
    "  PRIMARY KEY (`id`) USING BTREE,\n"
    "  INDEX `idx_rest`(`restaurant_id` ASC) USING BTREE"
)
dish_new = (
    "  `sort` int NULL DEFAULT 0 COMMENT '排序权重',\n"
    "  `specs` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '规格 JSON：[{name,type,options:[{label,price}]}]',\n"
    "  PRIMARY KEY (`id`) USING BTREE,\n"
    "  INDEX `idx_rest`(`restaurant_id` ASC) USING BTREE"
)
assert content.count(dish_anchor) == 1, "dish 表锚点不唯一: %d" % content.count(dish_anchor)
content = content.replace(dish_anchor, dish_new, 1)

# ---------- 2. restaurant 表结构：updated_at 后加 4 列 ----------
rest_anchor = (
    "  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n"
    "  PRIMARY KEY (`id`) USING BTREE,\n"
    "  INDEX `idx_cat`(`cat` ASC) USING BTREE"
)
rest_new = (
    "  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n"
    "  `min_order` decimal(8, 2) NULL DEFAULT 20.00 COMMENT '起送价',\n"
    "  `delivery_fee` decimal(8, 2) NULL DEFAULT 0.00 COMMENT '配送费',\n"
    "  `eta` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '预估送达时间',\n"
    "  `open_status` tinyint NULL DEFAULT 1 COMMENT '营业状态：1=营业中 0=已打烊',\n"
    "  PRIMARY KEY (`id`) USING BTREE,\n"
    "  INDEX `idx_cat`(`cat` ASC) USING BTREE"
)
assert content.count(rest_anchor) == 1, "restaurant 表锚点不唯一: %d" % content.count(rest_anchor)
content = content.replace(rest_anchor, rest_new, 1)

# ---------- 3. 解析 restaurant 行，建立 id -> (cat, distance) ----------
rest_pat = re.compile(r"^INSERT INTO `restaurant` VALUES \((.*)\);$", re.M)

def parse_sql_values(raw):
    reader = csv.reader([raw], quotechar="'", delimiter=",", skipinitialspace=True)
    return list(reader)[0]

rest_meta = {}
for m in rest_pat.finditer(content):
    vals = parse_sql_values(m.group(1))
    rid = int(vals[0].strip())
    cat = vals[5].strip()
    distance = vals[4].strip()
    rest_meta[rid] = (cat, distance)
print("restaurant rows:", len(rest_meta))

# ---------- 4. 经营字段派生 ----------
MIN_BASE = {"面食": 20, "快餐": 20, "甜点": 25, "饮品": 15, "轻食": 30, "火锅": 50}

def dist_m(d):
    m = re.match(r"([\d.]+)\s*(km|m|公里|米)?", d.strip().lower())
    if not m:
        return 999999
    num = float(m.group(1))
    unit = m.group(2) or "m"
    return int(round(num * 1000 if unit in ("km", "公里") else num))

def fee_for(dm):
    if dm <= 400:
        return "0.00"
    if dm <= 1000:
        return "1.00"
    if dm <= 1500:
        return "2.00"
    if dm <= 2000:
        return "3.00"
    return "5.00"

def eta_for(dm):
    if dm <= 400:
        return "25分钟"
    if dm <= 800:
        return "30分钟"
    if dm <= 1500:
        return "35分钟"
    if dm <= 2000:
        return "40分钟"
    return "50分钟"

def enrich_restaurant(vals):
    rid = int(vals[0].strip())
    cat = vals[5].strip()
    distance = vals[4].strip()
    dm = dist_m(distance)
    min_order = MIN_BASE.get(cat, 25) + (rid % 2) * 5
    delivery_fee = fee_for(dm)
    eta = eta_for(dm)
    open_status = "0" if rid % 7 == 0 else "1"
    vals = vals + ["%.2f" % min_order, delivery_fee, eta, open_status]
    return vals

# ---------- 5. 规格模板 ----------
def specs_for(cat):
    if cat == "面食":
        return [
            {"name": "分量", "type": "single", "options": [{"label": "标准", "price": 0}, {"label": "大份", "price": 5}]},
            {"name": "辣度", "type": "single", "options": [{"label": "不辣", "price": 0}, {"label": "微辣", "price": 0}, {"label": "中辣", "price": 0}, {"label": "特辣", "price": 1}]},
            {"name": "加料", "type": "multi", "options": [{"label": "加蛋", "price": 2}, {"label": "加牛肉", "price": 8}, {"label": "加青菜", "price": 3}]},
        ]
    if cat == "快餐":
        return [
            {"name": "分量", "type": "single", "options": [{"label": "标准", "price": 0}, {"label": "大份", "price": 6}]},
            {"name": "辣度", "type": "single", "options": [{"label": "不辣", "price": 0}, {"label": "微辣", "price": 0}, {"label": "中辣", "price": 0}, {"label": "特辣", "price": 1}]},
            {"name": "加料", "type": "multi", "options": [{"label": "加芝士", "price": 3}, {"label": "加薯条", "price": 5}, {"label": "加鸡块", "price": 6}]},
        ]
    if cat == "甜点":
        return [
            {"name": "甜度", "type": "single", "options": [{"label": "正常", "price": 0}, {"label": "少甜", "price": 0}, {"label": "半甜", "price": 0}, {"label": "无糖", "price": 0}]},
            {"name": "加料", "type": "multi", "options": [{"label": "加奶油", "price": 4}, {"label": "加水果", "price": 5}, {"label": "加坚果", "price": 3}]},
        ]
    if cat == "饮品":
        return [
            {"name": "甜度", "type": "single", "options": [{"label": "正常", "price": 0}, {"label": "七分甜", "price": 0}, {"label": "半糖", "price": 0}, {"label": "三分糖", "price": 0}]},
            {"name": "冰量", "type": "single", "options": [{"label": "正常冰", "price": 0}, {"label": "少冰", "price": 0}, {"label": "去冰", "price": 0}]},
            {"name": "加料", "type": "multi", "options": [{"label": "珍珠", "price": 3}, {"label": "椰果", "price": 2}, {"label": "芋圆", "price": 4}]},
        ]
    if cat == "轻食":
        return [
            {"name": "分量", "type": "single", "options": [{"label": "标准", "price": 0}, {"label": "大份", "price": 8}]},
            {"name": "酱汁", "type": "single", "options": [{"label": "油醋汁", "price": 0}, {"label": "凯撒酱", "price": 2}, {"label": "蜂蜜芥末", "price": 2}, {"label": "芝麻酱", "price": 2}]},
        ]
    if cat == "火锅":
        return [
            {"name": "锅底", "type": "single", "options": [{"label": "牛油锅", "price": 0}, {"label": "番茄锅", "price": 0}, {"label": "菌汤锅", "price": 0}]},
            {"name": "辣度", "type": "single", "options": [{"label": "微辣", "price": 0}, {"label": "中辣", "price": 0}, {"label": "特辣", "price": 2}]},
            {"name": "加菜", "type": "multi", "options": [{"label": "毛肚", "price": 20}, {"label": "黄喉", "price": 18}, {"label": "虾滑", "price": 16}]},
        ]
    return [{"name": "规格", "type": "single", "options": [{"label": "标准", "price": 0}]}]

# ---------- 6. 重写 restaurant INSERT ----------
def format_sql_value(v):
    return "'" + v.replace("'", "''") + "'"

def rewrite_rest(m):
    vals = parse_sql_values(m.group(1))
    vals = enrich_restaurant(vals)
    # 原始字段：0 id(int), 1 name, 2 emoji, 3 rating, 4 distance, 5 cat,
    #          6 category_id(int), 7 description, 8 tags, 9 sort(int),
    #          10 created_at, 11 updated_at
    # 新增字段：12 min_order(dec), 13 delivery_fee(dec), 14 eta, 15 open_status(int)
    str_idx = {1, 2, 4, 5, 7, 8, 10, 11, 14}
    parts = [
        v if i not in str_idx else format_sql_value(v)
        for i, v in enumerate(vals)
    ]
    return "INSERT INTO `restaurant` VALUES (" + ", ".join(parts) + ");"

content = rest_pat.sub(rewrite_rest, content)

# ---------- 7. 重写 dish INSERT ----------
dish_pat = re.compile(r"^INSERT INTO `dish` VALUES \((.*)\);$", re.M)

def rewrite_dish(m):
    vals = parse_sql_values(m.group(1))
    # vals: id(int), restaurant_id(int), name(str), price(dec), emoji(str), description(str), sort(int)
    rid = int(vals[1].strip())
    cat = rest_meta.get(rid, ("面食", ""))[0]
    specs_json = json.dumps(specs_for(cat), ensure_ascii=False, separators=(",", ":"))
    parts = [
        vals[0],  # id
        vals[1],  # restaurant_id
        format_sql_value(vals[2]),  # name
        vals[3],  # price
        format_sql_value(vals[4]),  # emoji
        format_sql_value(vals[5]),  # description
        vals[6],  # sort
        format_sql_value(specs_json),  # specs
    ]
    return "INSERT INTO `dish` VALUES (" + ", ".join(parts) + ");"

content = dish_pat.sub(rewrite_dish, content)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("done. restaurant rows:", len(rest_pat.findall(content)),
      "dish rows:", len(dish_pat.findall(content)))
