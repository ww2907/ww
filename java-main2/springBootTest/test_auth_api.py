# -*- coding: utf-8 -*-
"""
食光登录系统 · 鉴权接口冒烟测试（适配【图片验证码】契约）

旧脚本 test_verifycode.py 面向的是已废弃的数字验证码方案
（/send-code + verify_code 表），与当前后端不兼容，本脚本替代之。

用法:
  python test_auth_api.py            # 自动化冒烟用例（无需人工输入验证码）
  python test_auth_api.py --login    # 追加一次真实登录: 保存验证码图片后人工输入

依赖: 仅 Python 标准库；后端需已在 8081 运行。
"""

import base64
import json
import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8081/api/auth"
CAPTCHA_PNG = "captcha_smoke.png"

PASS, FAIL = 0, 0


def post(path, payload):
    req = urllib.request.Request(
        BASE + path, data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    try:
        r = urllib.request.urlopen(req, timeout=10)
        return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())


def check(label, ok, detail=""):
    global PASS, FAIL
    mark = "PASS" if ok else "FAIL"
    if ok:
        PASS += 1
    else:
        FAIL += 1
    print(f"[{mark}] {label}" + (f"  -> {detail}" if detail else ""))


def get_captcha():
    """获取图片验证码, 返回 (captchaId, 本地png路径)"""
    status, resp = post("/captcha", {})
    assert status == 200 and resp.get("code") == 0, f"captcha 接口异常: {resp}"
    cid = resp["data"]["captchaId"]
    img = resp["data"]["image"]
    assert img.startswith("data:image/png;base64,"), "验证码图片不是 base64 PNG"
    with open(CAPTCHA_PNG, "wb") as f:
        f.write(base64.b64decode(img.split(",", 1)[1]))
    return cid, CAPTCHA_PNG


def smoke():
    print("== 1. 验证码接口 ==")
    cid, png = get_captcha()
    check("POST /captcha 返回 code=0 且含 captchaId + PNG 图片", bool(cid) and png)

    print("\n== 2. 参数校验（校验顺序: 账号/密码 在 验证码 之前）==")
    s, r = post("/login", {"account": "ab", "password": "123456"})
    check("登录: 用户名不足3位被拒", s == 200 and r["code"] != 0 and "用户名" in r["message"], r["message"])

    s, r = post("/forgot", {"account": "demo", "newPassword": "123", "captchaId": "x", "captchaCode": "XXXX"})
    check("找回密码: 密码长度不符被拒", s == 200 and r["code"] != 0 and "密码长度" in r["message"], r["message"])

    s, r = post("/register", {"account": "bad account!", "password": "123456", "nickname": "t",
                              "captchaId": "x", "captchaCode": "XXXX"})
    check("注册: 非法用户名被拒", s == 200 and r["code"] != 0 and "用户名" in r["message"], r["message"])

    print("\n== 3. 验证码校验（一次性消费/不存在）==")
    s, r = post("/login", {"account": "demo", "password": "123456",
                           "captchaId": "not-exist-id", "captchaCode": "ABCD"})
    check("登录: 无效 captchaId 被拒", s == 200 and r["code"] != 0 and "验证码" in r["message"], r["message"])

    # 用真实 captchaId 但错误答案 -> 消费掉该条目
    cid2, _ = get_captcha()
    s, r = post("/login", {"account": "demo", "password": "123456",
                           "captchaId": cid2, "captchaCode": "ZZZZ"})
    check("登录: 验证码答案错误被拒", s == 200 and r["code"] != 0 and "验证码" in r["message"], r["message"])
    s, r = post("/login", {"account": "demo", "password": "123456",
                           "captchaId": cid2, "captchaCode": "ZZZZ"})
    check("登录: 同一验证码二次使用被拒（一次性）", s == 200 and r["code"] != 0 and "验证码" in r["message"], r["message"])


def real_login():
    """真实登录: 需要人看一眼 captcha_smoke.png 并输入 4 位验证码"""
    print("\n== 4. 真实登录（人工识别验证码）==")
    cid, png = get_captcha()
    print(f"  验证码图片已保存: {png}（132x44, 4位字符, 忽略大小写）")
    code = input("  请输入图中验证码: ").strip()
    account = input("  账号 [默认 demo]: ").strip() or "demo"
    password = input("  密码 [默认 123456]: ").strip() or "123456"

    s, r = post("/login", {"account": account, "password": password,
                           "captchaId": cid, "captchaCode": code})
    ok = s == 200 and r.get("code") == 0
    check(f"登录 {account}", ok, json.dumps(r.get("data") or r, ensure_ascii=False)[:120])


if __name__ == "__main__":
    smoke()
    if "--login" in sys.argv:
        real_login()
    print(f"\n结果: {PASS} 通过, {FAIL} 失败")
    sys.exit(1 if FAIL else 0)
