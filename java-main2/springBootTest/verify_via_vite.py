# -*- coding: utf-8 -*-
"""经 Vite dev server(5173) 代理验证「前端 → 后端」链路，
相当于浏览器里页面实际发出的请求路径（/api/** 被 vite 代理到 8081）。
"""
import json
import urllib.error
import urllib.parse
import urllib.request

op = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def get(path, base="http://127.0.0.1:5173"):
    try:
        with op.open(base + path, timeout=15) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, {"raw": e.read()[:120]}
    except Exception as e:
        return -1, {"err": str(e)}


def post(path, body, base="http://127.0.0.1:5173"):
    req = urllib.request.Request(base + path, data=json.dumps(body).encode(),
                                 method="POST", headers={"Content-Type": "application/json"})
    try:
        with op.open(req, timeout=15) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, {"raw": e.read()[:120]}
    except Exception as e:
        return -1, {"err": str(e)}


q = urllib.parse.quote
print("检查 Vite 代理链路 (5173 -> 8081)")

cases = [
    ("首页入口HTML", "/"),
    ("店铺详情", "/api/restaurants/1"),
    ("美食列表+排序", "/api/restaurants/food?sort=price&order=asc"),
    ("分类", "/api/restaurants/categories"),
    ("联想", "/api/restaurants/search/suggest?keyword=" + q("面")),
    ("订单列表", "/api/orders?account=demo"),
    ("个人资料", "/api/users/profile?account=demo"),
    ("收货地址", "/api/users/addresses?account=demo"),
]

ok = 0
for name, path in cases:
    code, data = get(path)
    if "raw" in data or "err" in data:
        print("  [FAIL] %-14s %s  %s" % (name, code, data))
        continue
    if code == 200 and isinstance(data, dict) and data.get("code") == 0:
        d = data.get("data")
        n = len(d) if isinstance(d, list) else ("ok" if d is not None else "null")
        print("  [PASS] %-14s code=0  data=%s" % (name, n))
        ok += 1
    else:
        print("  [FAIL] %-14s %s %s" % (name, code, str(data)[:120]))

# 下单链路（经代理）
code, data = post("/api/orders", {
    "restaurantId": 3, "restaurantName": "糖潮甜品铺", "account": "demo",
    "items": [{"dishId": None, "name": "代理链路测试", "price": 9.9, "qty": 1}]
})
if code == 200 and data.get("code") == 0:
    print("  [PASS] %-14s 订单号=%s" % ("线上下单", data["data"].get("orderNo")))
    ok += 1
else:
    print("  [FAIL] 线上下单", code, str(data)[:150])

print("\n代理链路：%d/%d 通过" % (ok, len(cases) + 1))
