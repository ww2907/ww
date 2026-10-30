# AI-启动必读（写给下一次会话的 AI，先读完再动手）

> 由 2026-10-10 会话生成。这台电脑**每次开机会重置**：`node_modules` 和 `target` 会被删除，
> 其他目录（包括 `~/.m2` 仓库）目前观察是保留的，但不要假设——脚本已做到全部自动补齐。
> 标准做法：让用户双击 `java-main\start-all.bat`，或按本文手动执行。**不要凭记忆重新推理启动方式。**

## 0. 三十秒速览

| 项 | 值 |
|---|---|
| 项目根 | `C:\Users\Administrator\Desktop\Java-main\java-main\`（历史上移动过、用户名变过，先 `ls` 核实） |
| 后端 | `springBootTest\`，Spring Boot 3.4.5 + MyBatis-Plus 3.5.9，端口 **8081**，profile dev |
| 前端 | `shiguang-food-login\`，Vue3 + Vite，端口 **5173**（vite 代理 /api → 8081） |
| 数据库 | MySQL **8.0**，`127.0.0.1:3306`，root / 123456，库 `shiguang_food`，测试账号 **demo / 123456** |
| 一键脚本 | `start-all.bat`（起） / `stop-all.bat`（停），GBK 编码 + CRLF |
| 健康检查 | `POST /api/auth/captcha` 空 body → 返回 `code:0` |

## 1. 标准启动流程（首选脚本，其次手动）

**首选**：双击 `start-all.bat`。它会自动：清端口劫持变量 → 定位 JDK/npm/mysql → 建库（缺才建）→
mvnw 编译启动后端 → npm install（缺才装）→ 启动前端 → 等待就绪。

**手动流程**（bat 起不来时，PowerShell 下执行）：

```powershell
# 1) 数据库（库不存在才执行初始化）
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -uroot -p123456 -e "USE shiguang_food;"
#    不存在则: & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -uroot -p123456 --default-character-set=utf8mb4 < java-main2\shiguang_food.sql
#    （shiguang_food.sql 已合并 init.sql + home.sql，含完整建库/建表/种子数据；含 DROP TABLE，重跑会清数据）

# 2) 后端（在 springBootTest 目录）
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
Remove-Item Env:SERVER__PORT -ErrorAction SilentlyContinue   # 关键！见坑 1
$mvn = (Get-ChildItem "$env:USERPROFILE\.m2\wrapper\dists\apache-maven-*\*\bin\mvn.cmd" | Select-Object -First 1).FullName
& $mvn spring-boot:run "-Dspring-boot.run.profiles=dev" "-Dspring-boot.run.arguments=--server.port=8081"

# 3) 前端（在 shiguang-food-login 目录）
& "C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-2\npm.cmd" install
& "C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-2\npm.cmd" run dev
#    注意：本机 PowerShell 执行策略禁止 npm.ps1，直接敲 npm 会报
#    UnauthorizedAccess —— 要么显式用 npm.cmd，要么在 cmd 窗口里操作（bat 不受影响）
```

## 2. 坑（每一条都真实踩过，别再踩）

1. **`SERVER__PORT` 端口劫持**：IDE/WorkBuddy 终端带 `SERVER__PORT=50885` 环境变量，Spring Boot
   松散绑定把它当 `server.port`，而 50885 被 IDE 占用 → 启动必失败（报 Port already in use，
   且端口不是 8081 就是这个坑）。启动前 `Remove-Item Env:SERVER__PORT`（bat 已内置清理）。
2. **mvnw 的 bash 不可用**：Git Bash 跑 `mvnw`/`mvn`（shell 版）报
   `ClassNotFoundException: ...classworlds.launcher.Launcher`。必须用 **PowerShell 调 mvn.cmd**，
   或让 bat 用 `mvnw.cmd`。本机**没有独立 mvn** 命令。
   另外 PowerShell 执行策略禁止 npm.ps1（`npm` 报 UnauthorizedAccess），PowerShell 里要显式
   `npm.cmd`；cmd/bat 不受影响。本沙箱还禁止直接调 cmd.exe，无法执行 .bat（双击不受影响）。
3. **JAVA_HOME 默认未设**：`C:\Program Files\Java\jdk-17`（另有 Zulu 21）。不设 mvnw 直接报错。
4. **离线标志 `-o` 别加**：`~/.m2` 若被重置，缺 `mybatis-plus-spring-boot3-starter:3.5.9` 和
   `mysql-connector-j:9.1.0`，离线模式直接失败；不加 `-o` 会走阿里云镜像自动补。
5. **Git Bash 里 curl 本地地址必须 `--noproxy "*"`**，否则系统代理 502。
6. **bat 是 GBK + CRLF**：修改脚本内容时保持该编码，别用编辑器重存成 UTF-8（会乱码/行为异常）。
   改 ASCII 内容可用 `sed`（字节级安全）；改中文内容建议用 Python `encode("gbk")` 重写。
7. **注册失败 90% 是库没建**：跑 `java-main2\shiguang_food.sql`（已合并 init.sql + home.sql，含完整建库/建表/种子数据；含 `DROP TABLE`，重跑会清数据）。
   user 表账号字段叫 **`account`** 不是 username。
8. **JDK 25 的坑不存在了**：现在是 JDK 17，`-proc:full` 那条历史教训作废。
9. **后端进程归属**：由某个会话后台任务启动的后端，会话结束可能被回收。重启机器后一律
   `start-all.bat` 重启，别指望旧进程还活着。
10. **前端默认是 mock 模式（最坑）**：`src/api/auth.js` 里 `USE_MOCK = VITE_USE_MOCK !== 'false'`，
    没配 `.env` 时默认 **true**，登录/注册全在浏览器内存里空转、**不请求后端也不写库**。
    已在 `shiguang-food-login/.env` 固定 `VITE_USE_MOCK=false`。改 `.env` 后**必须重启 Vite** 才生效。
11. **登录态存 localStorage**：`src/store.js` 的登录态默认持久化（不再依赖"记住我"勾选），
    刷新/重开浏览器不会掉登录。有效期：勾选"记住我"30 天，未勾选 1 天；过期或数据损坏会自动清理。
    退出登录只清会话、保留记住的用户名用于登录页回填。注册成功会跳到
    `#/login?account=xxx&registered=1`，登录页自动回填用户名并提示"注册成功"，参数消费后会被清掉。
    判据：浏览器访问 `/src/api/auth.js`，看内联的 `import.meta.env` 里 `VITE_USE_MOCK` 是否为 `"false"`。
11. **H2 已废弃**：原 `schema.sql`/`data.sql`/`application-h2.properties` 已并入 MySQL 并删除，
    `pom.xml` 无 h2 依赖。库 `shiguang_food` 现含 14 张表（8 业务 + 6 admin_*）。勿再启用 H2。

## 3. 启动后验证（端到端）

```text
1. POST http://localhost:8081/api/auth/captcha  (空 body)
   → {"code":0,"data":{"captchaId":"...","image":"data:image/png;base64,..."}}
2. 想做真实登录验证时：把 image 的 base64 解码存成 PNG，用视觉直接读出 4 位验证码
   （AI 识图即可，无需 OCR），再 POST /api/auth/login：
   {"account":"demo","password":"123456","captchaId":"...","captchaCode":"<图中字符>"}
   → code:0 且返回 token 即全链路通
3. 前端代理：POST http://localhost:5173/api/auth/captcha 同样应返回 code:0
```

接口契约：`{code, message, data}`，`code===0` 成功；业务失败走 `BusinessException` → 非 0 code。
校验顺序：账号格式 → 密码格式 → 验证码（一次性消费、忽略大小写、5 分钟）。

## 4. 遗留清理记录（2026-10-10 已处理，勿重复劳动）

以下死代码/废弃文件**已删除**（项目无 git，删除前已备份到 `java-main\_legacy_backup_2026-10-10\`，
确认无用后可连备份一起删）：

- `entity/VerifyCode.java`、`mapper/VerifyCodeMapper.java`（零引用，删后 `mvn clean compile` 通过）
- `springBootTest/test_verifycode.py`（旧数字验证码脚本，已被 `test_auth_api.py` 替代）
- 根目录 88B 空 `package-lock.json`（误操作产物）

**仍保留**：数据库 `verify_code` 表（旧方案遗留，图片验证码不读写；删表涉及数据，未动，
想清理需用户确认后执行 `DROP TABLE`）。`shiguang_food.sql` 中相关建表语句仍在，无害。

已修复：`application.properties` 三处硬伤（注释乱码、logging.pattern.file 前缀错误、
logging.level 包名拼错）；`.gitignore` 已补 `log/`；根 README.md 已扩写。

## 5. 禁区

- 别把 GBK bat 重存为 UTF-8；别动 `~/.workbuddy/` 下的身份与技能文件（SOUL/IDENTITY/USER/skills）。
- `shiguang_food.sql` 含 DROP TABLE（合并了原 init.sql/home.sql），用户确认过再执行。
- 项目会被移动/用户名会变：**任何绝对路径先 ls 核实**。
