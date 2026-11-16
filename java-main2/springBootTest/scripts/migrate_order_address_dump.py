#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
把「订单收货地址快照」写进全量脚本 shiguang_food.sql
=====================================================
背景：orders 原先没有地址字段，下单链路也就不可能有地址校验。
      线上库已用 sql/2026-11-11_order_address.sql 加好三列，
      本脚本把同样的变更落到全量脚本，保证「重新导入 = 结构和数据一致」。

做两件事：
  1. orders 的 CREATE TABLE 里追加三列（追加在末尾，值顺序与 INSERT 对齐）：
        receiver_name  varchar(20)  NOT NULL DEFAULT ''  收货人姓名（下单快照）
        receiver_phone varchar(20)  NOT NULL DEFAULT ''  收货电话（下单快照）
        address        varchar(255) NOT NULL DEFAULT ''  收货地址全文（下单快照）
  2. 给每条 `INSERT INTO orders VALUES (...)` 在末尾补三个值，
     其中账号为 demo 的两单按线上库回填了地址（与线上保持一致）。

幂等：检测到 receiver_name 已存在就直接退出，不会重复加列/补值。
用法：python migrate_order_address_dump.py [--dry-run]
"""
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

SQL_FILE = Path(__file__).resolve().parent.parent / "shiguang_food.sql"

# 线上库里唯一有地址的账号（user_address.id=1），回填到它的历史订单
KNOWN_ADDR = {
    "demo": ("演示用户", "13800000000", "广东省 深圳市 科技园南路 8 号 3 栋 501"),
}

NEW_COLUMNS = [
    "  `receiver_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '收货人姓名（下单快照）',",
    "  `receiver_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '收货电话（下单快照）',",
    "  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '收货地址全文（下单快照）',",
]

ORDER_INSERT_RE = re.compile(r"^INSERT INTO `orders` VALUES \((.*)\);[ \t]*$", re.M)
ACCOUNT_RE = re.compile(r"^(\d+), '[^']*', (?:NULL|\d+), '([^']*)',")


def patch_create_table(text):
    """在 orders 的 CREATE TABLE 里，把三列插到 updated_at 那行之后。"""
    start = text.index("CREATE TABLE `orders`")
    end = text.index("ENGINE = InnoDB", start)
    block = text[start:end]
    if "`receiver_name`" in block:
        return text, False

    anchor = "  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n"
    if anchor not in block:
        raise SystemExit("找不到 updated_at 行，脚本需要适配当前的 orders 建表格式")
    new_block = block.replace(anchor, anchor + "\n".join(NEW_COLUMNS) + "\n")
    return text[:start] + new_block + text[end:], True


def patch_inserts(text):
    """给每条订单 INSERT 末尾补三个值。"""
    count = [0]

    def fix(m):
        body = m.group(1)
        acc = ACCOUNT_RE.match(body)
        account = acc.group(2) if acc else ""
        name, phone, addr = KNOWN_ADDR.get(account, ("", "", ""))
        # 已经补过（值个数 = 11 + 3）就跳过
        if body.count(",") >= 13 and body.rstrip().endswith("''"):
            return m.group(0)
        count[0] += 1
        return "INSERT INTO `orders` VALUES (%s, '%s', '%s', '%s');" % (body, name, phone, addr)

    return ORDER_INSERT_RE.sub(fix, text), count[0]


def main():
    dry = "--dry-run" in sys.argv
    text = SQL_FILE.read_text(encoding="utf-8")

    if "`receiver_name`" in text and "receiver_name` varchar" in text.split("Records of orders")[0]:
        print("orders 已含 receiver_name，脚本无需改动（幂等退出）")
        return

    text2, added = patch_create_table(text)
    text2, n_ins = patch_inserts(text2)

    print("CREATE TABLE 追加列：%s" % ("3 列" if added else "已存在"))
    print("INSERT 补值行数：%d" % n_ins)

    if dry:
        print("[dry-run] 未写入文件")
        return

    if text2 == text:
        print("文件无变化")
        return

    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    bak = SQL_FILE.with_name(SQL_FILE.name + ".bak_" + stamp)
    shutil.copy2(SQL_FILE, bak)
    SQL_FILE.write_text(text2, encoding="utf-8")
    print("已写入 %s（备份 %s）" % (SQL_FILE.name, bak.name))


if __name__ == "__main__":
    main()
