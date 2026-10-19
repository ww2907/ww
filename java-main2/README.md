# java

用于记录学习 java。

当前项目：**食光登录系统**（用户注册 / 登录 / 找回密码，图片验证码）。

## 项目结构

```
java-main\
├─ springBootTest\          后端：Spring Boot 3.4.5 + MyBatis-Plus 3.5.9 + MySQL 8.0，端口 8081
├─ shiguang-food-login\     前端：Vue3 + Vite，端口 5173（/api 代理到 8081）
├─ start-all.bat            一键启动（GBK 编码：检查数据库 → 起后端 → 起前端）
├─ stop-all.bat             一键停止前后端（MySQL 保持运行）
├─ start-backend.bat / start-frontend.bat   单独启动
└─ AI-启动必读.md           环境说明、坑位清单、验证方法（AI 助手先读这个）
```

## 快速开始

双击 `start-all.bat`，等待两个服务窗口就绪后访问：

- 前端页面：http://localhost:5173/login
- 后端接口：http://localhost:8081
- 测试账号：`demo` / `123456`（数据库 root / 123456，库 `shiguang_food`）

首次启动会自动补齐前端依赖和后端编译产物，需要联网，耐心等几分钟。

## 鉴权接口（/api/auth）

| 接口 | 说明 |
|---|---|
| `POST /captcha` | 获取图片验证码 `{captchaId, image(base64)}` |
| `POST /register` | 注册，需带 `captchaId + captchaCode` |
| `POST /login` | 登录，同上 |
| `POST /forgot` | 找回密码（直接重置），同上 |

统一返回 `{code, message, data}`，`code === 0` 成功。账号 3-20 位字母/数字/下划线，密码 6-12 位。

## 冒烟测试

```
python springBootTest\test_auth_api.py          # 自动用例（无需人工输入验证码）
python springBootTest\test_auth_api.py --login  # 追加真实登录（人工看图输验证码）
```
