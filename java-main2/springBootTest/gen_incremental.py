# -*- coding: utf-8 -*-
"""从已改好的 shiguang_food.sql 提取 restaurant / dish 数据，
生成增量迁移 SQL（ALTER + UPDATE），避免 DROP 清库。"""
import csv
import re

SRC = r"D:/workSpace/ww/java-main2/shiguang_food.sql"
OUT = r"D:/workSpace/ww/java-main2/springBootTest/sql/2026-11-06_business_fields.sql"

with open(SRC, encoding="utf-8") as f:
    content = f.read()


def parse(raw):
    return list(csv.reader([raw], quotechar="'", delimiter=",", skipinitialspace=True))[0]


lines = ["SET NAMES utf8mb4;", "USE shiguang_food;",
         "-- 经营字段 + 菜品规格 增量迁移（2026-11-06）", ""]

# ALTER restaurant
lines.append("ALTER TABLE `restaurant`")
lines.append("  ADD `min_order` decimal(8,2) NULL DEFAULT 20.00 COMMENT '起送价' AFTER `updated_at`,")
lines.append("  ADD `delivery_fee` decimal(8,2) NULL DEFAULT 0.00 COMMENT '配送费' AFTER `min_order`,")
lines.append("  ADD `eta` varchar(16) NULL DEFAULT '' COMMENT '预估送达时间' AFTER `delivery_fee`,")
lines.append("  ADD `open_status` tinyint NULL DEFAULT 1 COMMENT '营业状态：1=营业中 0=已打烊' AFTER `eta`;")
lines.append("ALTER TABLE `dish` ADD `specs` text NULL COMMENT '规格 JSON' AFTER `sort`;")
lines.append("")

rest_pat = re.compile(r"^INSERT INTO `restaurant` VALUES \((.*)\);$", re.M)
for m in rest_pat.finditer(content):
    v = parse(m.group(1))
    # 0 id,12 min_order,13 delivery_fee,14 eta,15 open_status
    lines.append(
        "UPDATE `restaurant` SET min_order=%s, delivery_fee=%s, eta='%s', open_status=%s WHERE id=%s;"
        % (v[12], v[13], v[14], v[15], v[0])
    )

lines.append("")
dish_pat = re.compile(r"^INSERT INTO `dish` VALUES \((.*)\);$", re.M)
for m in dish_pat.finditer(content):
    v = parse(m.group(1))
    # 0 id, 7 specs
    specs = v[7].replace("'", "''")
    lines.append("UPDATE `dish` SET specs='%s' WHERE id=%s;" % (specs, v[0]))

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print("written", OUT, "with", len(lines), "lines")
