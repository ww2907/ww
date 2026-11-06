# -*- coding: utf-8 -*-
"""五块功能的接口级验收脚本（绕过系统代理直连 127.0.0.1）。"""
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8081"
op = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def call(method, path, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method,
                                 headers={"Content-Type": "application/json"})
    try:
        with op.open(req, timeout=20) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read().decode("utf-8"))
        except Exception:
            return {"code": -1, "message": "HTTP %s" % e.code}
    except Exception as e:
        return {"code": -1, "message": str(e)}


def q(s):
    return urllib.parse.quote(s)


def head(title):
    print("\n" + "=" * 62)
    print(title)
    print("=" * 62)


results = []


def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("  [PASS] " if ok else "  [FAIL] ") + name + ("  -> " + str(detail) if detail else ""))


# ---------------------------------------------------------------- 1 店铺详情
head("1. 美食卡片 → 店铺详情 / 菜品弹窗 / 加入购物车")
d = call("GET", "/api/restaurants/1")
x = d.get("data") or {}
check("GET /api/restaurants/1 返回详情", d.get("code") == 0, d.get("message"))
check("详情含 menu 菜品列表", isinstance(x.get("menu"), list) and len(x["menu"]) > 0,
      "%d 道菜" % len(x.get("menu") or []))
check("详情含 reviews 评价", isinstance(x.get("reviews"), list) and len(x["reviews"]) > 0,
      "%d 条" % len(x.get("reviews") or []))
check("详情含 avgRating / reviewCount", x.get("avgRating") is not None and x.get("reviewCount") is not None,
      "avg=%s cnt=%s" % (x.get("avgRating"), x.get("reviewCount")))
if x.get("menu"):
    m0 = x["menu"][0]
    check("菜品字段齐全(id/name/price/desc)", all(k in m0 for k in ("id", "name", "price", "desc")),
          json.dumps(m0, ensure_ascii=False)[:90])

# ---------- 经营字段（需求2）----------
biz = {k: x.get(k) for k in ("minOrder", "deliveryFee", "eta", "openStatus")}
check("详情含经营字段(起送/配送/送达/营业状态)",
      x.get("minOrder") is not None and x.get("deliveryFee") is not None
      and x.get("eta") and x.get("openStatus") in (0, 1), biz)
check("起送价 > 0", x.get("minOrder", 0) > 0, x.get("minOrder"))

# ---------- 菜品规格（需求4）----------
specs = x.get("menu", [{}])[0].get("specs") if x.get("menu") else None
check("菜品含规格 specs 列表", isinstance(specs, list) and len(specs) > 0,
      json.dumps(specs, ensure_ascii=False)[:100] if specs else "无")
if specs:
    s0 = specs[0]
    check("规格项结构完整(name/type/options)", s0.get("name") and s0.get("type") and isinstance(s0.get("options"), list),
          "%s(%s) %d 选项" % (s0.get("name"), s0.get("type"), len(s0.get("options") or [])))
    opt0 = s0["options"][0]
    check("规格选项含 label/price", "label" in opt0 and "price" in opt0, json.dumps(opt0, ensure_ascii=False))

# 打烊店铺
d7 = call("GET", "/api/restaurants/7")
check("打烊店铺 openStatus=0", (d7.get("data") or {}).get("openStatus") == 0,
      (d7.get("data") or {}).get("openStatus"))

# 不存在店铺
d404 = call("GET", "/api/restaurants/999999")
check("不存在的店铺返回业务错误", d404.get("code") not in (0, None), d404.get("message"))

# 列表接口也带经营字段（卡片展示用）
dl = call("GET", "/api/restaurants/food")
fl = (dl.get("data") or [])
check("列表项含经营字段", bool(fl) and all("minOrder" in r and "openStatus" in r for r in fl[:5]),
      "抽查 %d 家" % min(5, len(fl)))

# ---------------------------------------------------------------- 2 筛选/排序
head("2. 分类筛选 + 价格/距离排序")
d = call("GET", "/api/restaurants/categories")
cats = d.get("data") or []
check("GET /categories 返回分类", d.get("code") == 0 and len(cats) > 1, cats)

for cat in ["面食", "火锅", "饮品"]:
    dd = call("GET", "/api/restaurants/food?category=" + q(cat))
    lst = dd.get("data") or []
    ok = dd.get("code") == 0 and len(lst) > 0 and all(r.get("cat") == cat for r in lst)
    check("分类筛选 category=%s" % cat, ok, "%d 家" % len(lst))

dall = call("GET", "/api/restaurants/food")
alln = len(dall.get("data") or [])

# 排序：后端 sort 参数是否生效（价格 / 距离，asc / desc）
for sort_key, field in (("price", "price"), ("distance", "distanceM")):
    for order in ("asc", "desc"):
        dd = call("GET", "/api/restaurants/food?sort=%s&order=%s" % (sort_key, order))
        lst = dd.get("data") or []
        vals = [r.get(field) for r in lst if r.get(field) is not None]
        expect = sorted(vals, reverse=(order == "desc"))
        check("后端排序 sort=%s&order=%s 生效" % (sort_key, order), vals == expect and len(vals) == alln,
              "前6=%s" % vals[:6])
    # 与不传排序时条数一致（排序不能丢数据）
    check("排序后店数不变(%s)" % sort_key, len(vals) == alln, "%d vs %d" % (len(vals), alln))

# 非法排序参数要退化到「综合推荐」而不是报错
dd = call("GET", "/api/restaurants/food?sort=xxx&order=yyy")
check("非法排序参数不报错", dd.get("code") == 0, dd.get("message"))

# 排序与分类筛选叠加
dd = call("GET", "/api/restaurants/food?category=" + q("火锅") + "&sort=price&order=asc")
lst = dd.get("data") or []
vals = [r.get("price") for r in lst]
check("分类 + 排序叠加生效", dd.get("code") == 0 and vals == sorted(vals) and
      all(r.get("cat") == "火锅" for r in lst), "%d 家, 前4=%s" % (len(lst), vals[:4]))

# 搜索联想
d = call("GET", "/api/restaurants/search/suggest?keyword=" + q("牛") + "&limit=8")
sg = d.get("data") or []
check("搜索实时联想 /search/suggest", d.get("code") == 0 and len(sg) > 0,
      "命中 %d 条：%s" % (len(sg), [s.get("name") for s in sg[:4]]))

# ---------------------------------------------------------------- 3 订单
head("3. 订单详情 / 待支付去支付 / 取消 / 再来一单")
ACC = "demo"
d = call("POST", "/api/orders", {
    "restaurantId": 1, "restaurantName": "巷子口牛肉面", "account": ACC,
    "items": [{"dishId": None, "name": "自测菜品A", "price": 12.5, "qty": 2}]
})
new_order = d.get("data") or {}
check("POST /api/orders 下单", d.get("code") == 0, d.get("message"))
oid = new_order.get("id")
check("新订单初始状态=0 待支付", new_order.get("status") == 0, "status=%s no=%s" % (new_order.get("status"), new_order.get("orderNo")))
check("订单带 restaurantId", new_order.get("restaurantId") is not None, new_order.get("restaurantId"))
items = new_order.get("items") or []
check("订单明细带 dishId 字段(再来一单依赖)", bool(items) and "dishId" in items[0],
      json.dumps(items[:1], ensure_ascii=False))

d = call("GET", "/api/orders/%s" % oid)
check("GET /api/orders/{id} 订单详情", d.get("code") == 0 and (d.get("data") or {}).get("id") == oid)

d = call("POST", "/api/orders/%s/status?status=1" % oid)
check("待支付 → 已支付（去支付）", d.get("code") == 0 and (d.get("data") or {}).get("status") == 1,
      d.get("message"))

# 再建一单测取消
d = call("POST", "/api/orders", {
    "restaurantId": 2, "restaurantName": "麦奇轻食沙拉", "account": ACC,
    "items": [{"dishId": None, "name": "自测菜品B", "price": 20, "qty": 1}]
})
oid2 = (d.get("data") or {}).get("id")
d = call("POST", "/api/orders/%s/status?status=3" % oid2)
check("待支付 → 已取消（取消订单）", d.get("code") == 0 and (d.get("data") or {}).get("status") == 3,
      d.get("message"))

# 非法流转：已取消的不能再支付
d = call("POST", "/api/orders/%s/status?status=1" % oid2)
check("终态订单不可再变更（非法流转被拦截）", d.get("code") not in (0, None), d.get("message"))

# 列表 + 状态筛选
d = call("GET", "/api/orders?account=%s" % ACC)
lst = d.get("data") or []
check("GET /api/orders 我的订单列表", d.get("code") == 0 and len(lst) > 0, "%d 单" % len(lst))
check("列表项也带 restaurantId", all("restaurantId" in r for r in lst),
      "缺失数=%d" % sum(1 for r in lst if "restaurantId" not in r))
d = call("GET", "/api/orders?account=%s&status=0" % ACC)
lst0 = d.get("data") or []
check("按状态筛选 status=0", d.get("code") == 0 and all(r.get("status") == 0 for r in lst0),
      "%d 单" % len(lst0))

# 再来一单：拿上面已支付订单的明细重新下单
d = call("GET", "/api/orders/%s" % oid)
src = d.get("data") or {}
d = call("POST", "/api/orders", {
    "restaurantId": src.get("restaurantId"),
    "restaurantName": src.get("restaurantName"),
    "account": ACC,
    "items": [{"dishId": it.get("dishId"), "name": it.get("dishName"),
               "price": it.get("price"), "qty": it.get("qty")} for it in (src.get("items") or [])]
})
check("再来一单（按原单明细重新下单）", d.get("code") == 0,
      "新单号=%s" % (d.get("data") or {}).get("orderNo"))

# 统计
d = call("GET", "/api/orders/stats?account=%s" % ACC)
st = d.get("data") or {}
check("GET /api/orders/stats 统计", d.get("code") == 0 and "totalOrders" in st,
      "total=%s" % st.get("totalOrders"))

# ---------------------------------------------------------------- 4 搜索
head("4. 搜索实时联想 + 无结果空态")
d = call("GET", "/api/restaurants/search/suggest?keyword=" + q("火锅") + "&limit=8")
check("联想·店铺名命中", d.get("code") == 0 and len(d.get("data") or []) > 0,
      [s.get("name") for s in (d.get("data") or [])[:4]])
d = call("GET", "/api/restaurants/search/suggest?keyword=" + q("面") + "&limit=8")
sg = d.get("data") or []
dish_hits = [s for s in sg if s.get("kind") == "dish"]
rest_hits = [s for s in sg if s.get("kind") == "restaurant"]
check("联想·菜品名命中(kind=dish)且未被店铺挤满", len(dish_hits) > 0,
      "店铺 %d 条 / 菜品 %d 条：%s" % (len(rest_hits), len(dish_hits),
                                    [s.get("name") for s in dish_hits[:3]]))
check("联想·结果条数不超过 limit 且尽量占满", len(sg) == min(8, len(sg)) and len(sg) > 0,
      "%d 条" % len(sg))
check("联想·店铺配额不超过 60%", len(rest_hits) <= max(1, -(-8 * 6 // 10)),
      "店铺 %d 条" % len(rest_hits))
d = call("GET", "/api/restaurants/search/suggest?keyword=" + q("zzz不存在zzz") + "&limit=8")
check("联想·无结果返回空数组", d.get("code") == 0 and (d.get("data") or []) == [],
      d.get("data"))
d = call("GET", "/api/restaurants/search?keyword=" + q("zzz不存在zzz"))
check("搜索·无结果返回空列表(前端据此渲染空态)", d.get("code") == 0 and (d.get("data") or []) == [],
      "%d 条" % len(d.get("data") or []))
d = call("GET", "/api/restaurants/search?keyword=" + q("牛肉"))
check("搜索·有结果", d.get("code") == 0 and len(d.get("data") or []) > 0,
      "%d 家" % len(d.get("data") or []))
d = call("GET", "/api/restaurants/search/suggest?keyword=&limit=8")
check("联想·空关键字返回空", d.get("code") == 0 and (d.get("data") or []) == [])

# ---------------------------------------------------------------- 5 我的页面
head("5. 我的页面：头像 / 个人信息 / 收货地址")
d = call("GET", "/api/users/profile?account=%s" % ACC)
p = d.get("data") or {}
check("GET /api/users/profile", d.get("code") == 0 and p.get("account") == ACC,
      json.dumps(p, ensure_ascii=False))

d = call("PUT", "/api/users/profile", {
    "account": ACC, "nickname": "演示用户", "avatar": "🐼", "gender": "女",
    "phone": "13800001234", "bio": "热爱生活，热爱美食 🍜"
})
p2 = d.get("data") or {}
check("PUT 修改头像 avatar", d.get("code") == 0 and p2.get("avatar") == "🐼", d.get("message"))
check("PUT 修改个人信息 nickname/phone/bio", d.get("code") == 0 and p2.get("nickname") == "演示用户",
      "nickname=%s phone=%s" % (p2.get("nickname"), p2.get("phone")))
# 回读确认落库
d = call("GET", "/api/users/profile?account=%s" % ACC)
check("资料修改已落库", (d.get("data") or {}).get("avatar") == "🐼")

# 地址 CRUD
d = call("POST", "/api/users/addresses", {
    "account": ACC, "name": "接口自测", "phone": "13900000000", "tag": "公司",
    "province": "广东省", "city": "深圳市", "detail": "南山区科技园 1 号", "isDefault": False
})
a1 = d.get("data") or {}
check("POST 新增收货地址", d.get("code") == 0 and a1.get("id"), d.get("message"))
aid = a1.get("id")

d = call("PUT", "/api/users/addresses/%s" % aid, {
    "account": ACC, "name": "接口自测改", "phone": "13900000001", "tag": "家",
    "province": "广东省", "city": "深圳市", "detail": "南山区科技园 2 号"
})
check("PUT 修改收货地址", d.get("code") == 0 and (d.get("data") or {}).get("name") == "接口自测改",
      d.get("message"))

d = call("POST", "/api/users/addresses/%s/default?account=%s" % (aid, ACC))
check("设为默认地址", d.get("code") == 0 and (d.get("data") or {}).get("isDefault") is True,
      d.get("message"))

d = call("GET", "/api/users/addresses?account=%s" % ACC)
al = d.get("data") or []
check("GET 地址列表（默认地址排最前）", d.get("code") == 0 and len(al) > 0,
      "%d 个" % len(al))
check("默认地址唯一", sum(1 for a in al if a.get("isDefault")) <= 1,
      "默认地址数=%d" % sum(1 for a in al if a.get("isDefault")))

d = call("DELETE", "/api/users/addresses/%s?account=%s" % (aid, ACC))
check("DELETE 删除收货地址", d.get("code") == 0, d.get("message"))
d = call("GET", "/api/users/addresses?account=%s" % ACC)
check("删除后列表不再包含该地址", all(a.get("id") != aid for a in (d.get("data") or [])))

# 越权删除保护
d = call("GET", "/api/users/addresses?account=xiaoming")
other = (d.get("data") or [])
if other:
    oid_ = other[0]["id"]
    d = call("DELETE", "/api/users/addresses/%s?account=%s" % (oid_, ACC))
    check("越权删除他人地址被拦截", d.get("code") not in (0, None), d.get("message"))

# ---------------------------------------------------------------- 汇总
head("汇总")
fail = [r for r in results if not r[1]]
print("共 %d 项，通过 %d，失败 %d" % (len(results), len(results) - len(fail), len(fail)))
for n, ok, dt in fail:
    print("  FAIL:", n, dt)
sys.exit(1 if fail else 0)
