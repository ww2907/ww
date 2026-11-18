"""后台分类 CRUD 验收：真实 category 表 + 物化路径维护 + 删除保护。

用法：python verify_category_crud.py
会新增临时分类做增删改测试，结束时按 id 精确清理（先子后父）。
"""
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

PORT = "8081"
BASE = "http://127.0.0.1:%s" % PORT
# 后端 dev 配置绑定局域网 IP，localhost 不监听；两处都试，谁通用谁
HOSTS = ["127.0.0.1", "192.168.68.31"]
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))
PROJ = os.path.dirname(os.path.abspath(__file__))
CREATED = []
PASS = []
FAIL = []


def req(method, path, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    global BASE
    for host in HOSTS:
        BASE = "http://%s:%s" % (host, PORT)
        r = urllib.request.Request(BASE + path, data=data, method=method,
                                   headers={"Content-Type": "application/json"})
        try:
            with OPENER.open(r, timeout=8) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", "replace")
            try:
                return json.loads(raw)
            except Exception:
                return {"code": e.code, "message": raw}
        except Exception:
            continue
    return {"code": -1, "message": "backend unreachable on all hosts"}


def check(cond, label, detail=""):
    (PASS if cond else FAIL).append(label)
    print(("  PASS  " if cond else "  FAIL  ") + label + ("  -> " + detail if detail else ""))


def ready():
    try:
        return req("GET", "/api/restaurants/categories").get("code") == 0
    except Exception:
        return False


def ensure_backend():
    if ready():
        print("backend already running")
        return
    print("starting backend via restart_backend.py ...")
    subprocess.run([sys.executable, os.path.join(PROJ, "restart_backend.py"), PORT],
                   check=True, timeout=150)
    if not ready():
        raise RuntimeError("backend not ready, see log/run_be.log")


def list_categories():
    d = req("GET", "/api/admin/category")
    assert d.get("code") == 0, d
    return d["data"]


def find(cats, cid):
    return next((c for c in cats if c["id"] == cid), None)


def add(name, parent_id, extra=None):
    before = {c["id"] for c in list_categories()}
    body = {"name": name, "parentId": parent_id, "sortOrder": 99, "icon": "🧪"}
    if extra:
        body.update(extra)
    d = req("POST", "/api/admin/category", body)
    assert d.get("code") == 0, d
    # 用插入前后的 id 差集定位新行；重名时后端会自动加序号，不能按原名查
    cats = list_categories()
    new_rows = [c for c in cats if c["id"] not in before]
    assert new_rows, "new category not found: " + name
    row = new_rows[-1]
    CREATED.append(row["id"])
    return row


def cleanup():
    for cid in reversed(CREATED):
        r = req("DELETE", "/api/admin/category/%s" % cid)
        print("  cleanup id=%s -> code=%s" % (cid, r.get("code")))


def main():
    ensure_backend()
    try:
        print("\n[1] 分类列表读真实 category（含 level/path）")
        cats = list_categories()
        check(len(cats) >= 25, "列表至少 25 条", "rows=%s" % len(cats))
        check(all(c.get("level") and c.get("path") for c in cats),
              "每条都有 level/path 物化路径")

        print("\n[2] 新增：level/path 由后端生成")
        a = add("__自测二级__", 1)
        check(a["level"] == 2 and a["path"] == "/1/%s/" % a["id"],
              "新增二级分类 level=2、path=/1/{id}/", str(a["path"]))
        b = add("__自测三级__", a["id"])
        check(b["level"] == 3 and b["path"] == "/1/%s/%s/" % (a["id"], b["id"]),
              "新增三级分类 path=/1/{parent}/{id}/", str(b["path"]))

        print("\n[3] 删除保护：有子分类 / 有菜品")
        r = req("DELETE", "/api/admin/category/%s" % a["id"])
        check(r.get("code") != 0 and "子分类" in str(r.get("message")),
              "有子分类时拒绝删除", str(r.get("message")))
        dish_cat = next((c for c in cats if c["level"] == 3 and c["name"] == "汤面"), None)
        if dish_cat:
            r = req("DELETE", "/api/admin/category/%s" % dish_cat["id"])
            check(r.get("code") != 0 and "菜品" in str(r.get("message")),
                  "挂有菜品时拒绝删除", str(r.get("message")))

        print("\n[4] 移动父节点：整棵子树 path 前缀与 level 级联")
        r = req("PUT", "/api/admin/category", {"id": a["id"], "name": a["name"],
                                               "parentId": 0, "sortOrder": 99})
        check(r.get("code") == 0, "移动二级到顶级", str(r.get("message")))
        cats = list_categories()
        a2, b2 = find(cats, a["id"]), find(cats, b["id"])
        check(a2 and a2["level"] == 1 and a2["path"] == "/%s/" % a["id"],
              "父节点 level=1、path=/{id}/", str(a2 and a2["path"]))
        check(b2 and b2["level"] == 2 and b2["path"] == "/%s/%s/" % (a["id"], b["id"]),
              "子孙 level 同步 -1、path 前缀已换", str(b2 and b2["path"]))

        print("\n[5] 非法移动：挂到自己的子孙下")
        r = req("PUT", "/api/admin/category", {"id": a["id"], "name": a["name"],
                                               "parentId": b["id"]})
        check(r.get("code") != 0 and "子分类" in str(r.get("message")),
              "拒绝把父分类挂到自己的子分类下", str(r.get("message")))

        print("\n[6] uk_cat_parent_name：同级重名自动加序号")
        add("__重名自测__", 1)
        dup = add("__重名自测__", 1)
        check(dup["name"].endswith(" 2"), "同名分类自动变成 'name 2'", dup["name"])

        print("\n[7] 删除干净分类成功")
        r = req("DELETE", "/api/admin/category/%s" % b["id"])
        check(r.get("code") == 0, "删除无引用的子分类", str(r.get("message")))
        CREATED[:] = [x for x in CREATED if x != b["id"]]
        r = req("DELETE", "/api/admin/category/%s" % a["id"])
        check(r.get("code") == 0, "删除已无子分类的父节点", str(r.get("message")))
        CREATED[:] = [x for x in CREATED if x != a["id"]]
    finally:
        print("\n[cleanup]")
        cleanup()
        cats = list_categories()
        leftovers = [c for c in cats if c["name"].startswith("__自测") or c["name"].startswith("__重名")]
        check(not leftovers, "临时分类已全部清理", str([c["name"] for c in leftovers]))

    print("\n========== 汇总 ==========")
    print("PASS %s / FAIL %s" % (len(PASS), len(FAIL)))
    for f in FAIL:
        print("  FAILED: " + f)
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
