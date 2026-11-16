# AI-CONTINUE.md — 机器接续卡

> 只给 AI 读：纯事实、命令、契约、约束，不含叙事。人看的版本见 `HANDOFF.md`，项目门面见 `README.md`。
> **全项目只保留这三份 md**（2026-11-16 已把原 `AI-启动必读.md`、`沙箱联调手册.md` 合并进本文件，
> 不要再新建平行文档，否则同一份命令会被抄成四份、然后各自过期）。
> 最近更新：2026-11-16（立即下单 + 仓库清理）。

## 0. 开工前 3 步

1. 读本文件 → 2. `cd D:\workSpace\ww\java-main2` 并 `ls` 核实（项目挪过家、用户名变过，别信绝对路径）→ 3. 按第 3 节编译启动，失败先查第 7 节。

## 1. 定位

| 项 | 值 |
|---|---|
| 项目根 | `D:\workSpace\ww\java-main2`（git 仓库根在 `D:\workSpace\ww`） |
| 前端 | `shiguang-food-login`（Vue 3.4 + Vite 5.4 + vue-router 4，依赖仅 axios/vue/vue-router） |
| 后端 | `springBootTest`（Spring Boot 3.4.5 + MyBatis-Plus 3.5.9 + MySQL 8，Java 17） |
| 后端包名 | `com.fenglin.springboottest`，启动类 `SpringBootTestApplication` |
| 数据库 | `shiguang_food` @ `127.0.0.1:3306`，root / 123456，profile=`dev`；14 张表（8 业务 + 6 `admin_*`） |
| 端口 | 后端 **8081**；前端 dev **5173**（`vite.config.js` 把 `/api` 代理到 8081） |
| **访问地址** | 前后端都绑本机局域网 IP **192.168.68.31**，`localhost` **已不监听**。前端 `http://192.168.68.31:5173/#/login`，后端 `http://192.168.68.31:8081`。换网络后要同步改 `vite.config.js` 的 `LAN_HOST` 与 `application-dev.properties` 的 `server.address` |
| 测试账号 | 用户 `demo` / `123456`；管理员 `admin` / `admin123`（bcrypt 哈希与 SQL 一致）；后台白名单账号 `www` |
| 一键脚本 | `start-all.bat`（起）/ `stop-all.bat`（停），**GBK + CRLF**，别重存成 UTF-8 |
| 健康检查 | `POST /api/auth/captcha` 空 body → `code:0` |
| 前端模式 | `.env` 必须 `VITE_USE_MOCK=false` + `VITE_ADMIN_USE_MOCK=false`，**缺 `.env` 自动退回 MOCK**（见 §7） |

## 2. 目录约定

```
frontend: src/api/{food,restaurant,order,profile,admin,auth}.js      # 契约层
          src/store/{cart,buyNow,profile,admin}.js                   # reactive + localStorage
          src/components/{DishPopup,OrderDetailModal,AddressManageModal,LocationBar,ToastHost,...}.vue
          src/components/layout/{AppHeader,CartEntry,...}.vue
          src/views/*.vue   src/views/admin/*.vue
backend:  controller/{Auth,Restaurant,Order,UserProfile,Admin}Controller.java
          service/**ServiceImpl.java   entity/ mapper/ vo/ controller/dto/
          sql/          增量迁移（2026-11-04 / 11-06 / 11-11 分类 / 11-11 地址）
          scripts/      一次性数据迁移脚本（migrate_*.py、gen_incremental.py）——平时不用跑
          restart_backend.py / verify_features.py / verify_via_vite.py / test_auth_api.py
sql:      java-main2/shiguang_food.sql                               # 全量，含 DROP TABLE
          java-main2/shiguang_food.sql.bak_20261111_093451           # 唯一保留的历史备份
docs:     README.md（门面）/ HANDOFF.md（人读）/ AI-CONTINUE.md（AI 读）
```

## 3. 命令（本机已验证）

```bash
# 0) 一键启动（人用）：双击 java-main2/start-all.bat
#    清端口劫持变量 → 定位 JDK/npm/mysql → 建库(缺才建) → mvnw 编译起后端
#    → npm install(缺才装) → 起前端。停止用 stop-all.bat。

# 1) 后端编译（mvnw 的 bash 版在本机坏掉，必须用 classworlds 直接起 maven）
M="C:/Users/Administrator/.m2/wrapper/dists/apache-maven-3.9.16-bin/5grr65jo27hi51sujmtcldfovl/apache-maven-3.9.16"
cd "D:/workSpace/ww/java-main2/springBootTest"
java -classpath "$M/boot/plexus-classworlds-2.11.0.jar" -Dclassworlds.conf="$M/bin/m2.conf" \
  -Dmaven.home="$M" -Dmaven.multiModuleProjectDirectory="$PWD" \
  org.codehaus.plexus.classworlds.launcher.Launcher -o -DskipTests compile
#    报「缺 mybatis-plus / mysql-connector」说明 ~/.m2 被重置，去掉 -o 走镜像自动补

# 2) 后端启动（PowerShell 用 mvn.cmd；Git Bash 把上一条的 compile 换成 spring-boot:run）
#    Remove-Item Env:SERVER__PORT, Env:SERVER__ADDRESS -ErrorAction SilentlyContinue   # 关键，见 §7
$mvn = (Get-ChildItem "$env:USERPROFILE\.m2\wrapper\dists\apache-maven-*\*\bin\mvn.cmd" | Select-Object -First 1).FullName
& $mvn spring-boot:run "-Dspring-boot.run.profiles=dev" "-Dspring-boot.run.arguments=--server.port=8081"

# 3) 前端（PowerShell 禁止 npm.ps1，要写 npm.cmd；cmd/bat 不受影响）
cd "D:/workSpace/ww/java-main2/shiguang-food-login" && npm install && npm run dev   # 构建用 npm run build

# 4) 数据库（全量导入会清数据：15 张表都带 DROP TABLE，先问用户）
#    shiguang_food.sql **不含 CREATE DATABASE / USE**，必须先建库并在命令行指定库名，
#    否则 mysql 直接报 "No database selected"
mysql -uroot -p123456 -e "CREATE DATABASE IF NOT EXISTS shiguang_food DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
mysql -uroot -p123456 --default-character-set=utf8mb4 shiguang_food < java-main2/shiguang_food.sql
```

## 4. 接口契约（前端调用 → 后端实现，均已实测）

| 前端 | 方法 + 路径 | 后端 |
|---|---|---|
| `food.js` | GET `/api/restaurants/search` `/recommended` `/food` `/categories` `/category-tree` | RestaurantController |
| `food.js` | 上述 search/food 支持 `sort=default\|price\|distance` + `order=asc\|desc` + `categoryId` | 同文件 |
| `restaurant.js` | GET `/api/restaurants/search/suggest?keyword=&limit=8` | 同文件，**声明在 `/{id}` 之前** |
| `restaurant.js` | GET `/api/restaurants/{id}` → `{menu,reviews,avgRating,reviewCount}` | 同文件 |
| `order.js` | POST `/api/orders` `{restaurantId,restaurantName,account,addressId,items:[{dishId,name,price,qty}]}` | OrderController |
| `order.js` | POST `/api/orders/direct` `{restaurantId,account,addressId?,items:[{dishId,qty,specText}]}` → 立即下单，单价由后端按 `dish` 表核价（基础价 + 规格加价） | 同文件（2026-11-16 新增） |
| `order.js` | GET `/api/orders?account=&status=`、GET `/api/orders/{id}`、GET `/api/orders/stats?account=`、POST `/api/orders/{id}/status?status=` | 同文件 |
| `profile.js` | GET/PUT `/api/users/profile`、CRUD `/api/users/addresses`、POST `/api/users/addresses/{id}/default` | UserProfileController |
| `admin.js` | `/api/admin/{login,nav,search,recommend,category,dish,stats,user,order}` + `/api/admin/dish/{id}/price`、`/api/admin/dish/price/batch`、`/api/admin/order/{id}/status` | AdminController |
| `admin.js` | GET `/api/admin/user/{id}/address`、DELETE `/api/admin/user/{id}/address/{addressId}` | 同文件 |

返回统一 `{code,message,data}`，`code===0` 成功。异常走 `BusinessException` + `GlobalExceptionHandler`。

## 5. 不变量（改了会连锁炸）

1. `Result<T>` 结构不能变；前端所有 `http*` 都判 `res.data.code !== 0` 抛错。
2. `/search/suggest` 必须排在 `/{id}` 之前，否则 Spring 把 `suggest` 当 id 解析。
3. `OrderVO` 必须带 `restaurantId`、`OrderItemVO` 必须带 `dishId`（**列表和详情两条路径都要设**，曾漏过列表）→ 「再来一单」按这两字段还原。
4. 下单时显式 `order.setCreatedAt(LocalDateTime.now())`，MySQL 默认值不会回填实体。
5. `user_address` 的默认地址唯一：写 `is_default=1` 前先 `clearDefault(account)`。
6. 购物车按 `restaurantId` 分组，下单后只清该店铺；**立即下单走 `store/buyNow.js` 的另一份草稿**，两者互不影响。
7. UI 数据源是 `store/*.js` 的 reactive 对象；写操作"先改本地再提交后端"，不能改成"等后端返回再渲染"（会破坏离线演示）。
8. 排序口径三处必须一致：后端 `RestaurantServiceImpl.applySort`、前端 `food.js` 的 `sortRestaurants`、`FoodView` 的 `sorted`。
   `default` = 评分降序 → 距离升序 → id；`price`/`distance` = 该字段升序 → 评分降序 → id。改一处必须同步另两处。
9. `suggest` 的店铺占位上限 = `ceil(limit*0.6)`：店铺不限流会把菜品全部挤掉（搜「面」只看得到面馆）。
10. 经营字段派生口径（2026-11-06）三处一致：SQL 种子、后端 `RestaurantServiceImpl` 读库、前端 `food.js` 的
    `withSortFields` 兜底。规则：起送价=分类基准(面20/快餐20/甜点25/饮品15/轻食30/火锅50)+`(id%2)*5`；
    配送费/送达时间按距离分档；打烊=`id%7==0`。真实模式以后端库为准，mock 才用兜底。
11. 菜品规格 `dish.specs` 是 JSON 文本 `[{name,type,options:[{label,price}]}]`，`type` 为 `single`(单选)/`multi`(多选)。
    后端 `RestaurantServiceImpl.parseSpecs` 解析成 `List<DishSpecVO>`；前端购物车按 `id#specText` 区分不同规格条目。
12. 前端宽壳页面清单在 `App.vue` 的 `WIDE_SHELL_PAGES`：自带 `AppHeader` 的页面**必须**登记进去，
    否则会被当窄壳（460px）渲染、并叠一层品牌头。当前含 `home/food/orders/profile/restaurant/order/buy`。

## 5.1 验收与自测

```bash
cd springBootTest
python restart_backend.py 8081     # 分离进程启后端 + 轮询到就绪（解决"命令结束进程就被杀"）
python verify_features.py          # 五块功能 + 经营字段/规格 接口验收，脚本末尾给汇总，全 PASS 才算完
python verify_via_vite.py          # 经 Vite 代理(5173/5174→8081) 验证前端实际请求链路
```

**沙箱三条硬约束（不遵守必失败）**

1. 每条 bash 命令结束时它拉起的子进程会被回收 → **启动后端与跑测试必须写进同一条命令**。
2. 系统挂了 SSL 代理 → Python 请求 127.0.0.1 返回 502，必须 `urllib.request.build_opener(ProxyHandler({}))`；
   Git Bash 的 curl 报 `os error 11001`，要加 `--noproxy '*'`。
3. `schtasks.exe` 在黑名单，别想着用计划任务托管进程。

**数据卫生（验收脚本会写库，跑完必须清）**

```sql
DELETE oi FROM order_item oi WHERE oi.dish_name LIKE '%自测%' OR oi.dish_name LIKE '%代理链路%';
DELETE FROM orders WHERE created_at >= '2026-11-06 00:00:00';
DELETE FROM user_address WHERE name LIKE '接口自测%';
```

- 按 `created_at >= 今天` 删会**连带删掉用户当天真实下的单**，删前先 `SELECT` 或按 `dish_name` 精确删。
- 测头像修改会把 `demo` 的 avatar 改成别的值，**记得改回 🦊**。

**真实浏览器验证（2026-11-16 已跑通，本机有 Chrome）**

```bash
CH="/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
"$CH" --headless=new --no-sandbox --disable-gpu --no-proxy-server \
      --virtual-time-budget=6000 --window-size=1280,1900 \
      --user-data-dir="C:\\Users\\Administrator\\AppData\\Local\\Temp\\ab_prof" \
      --screenshot="C:\\Users\\Administrator\\AppData\\Local\\Temp\\page.png" \
      "http://192.168.68.31:5173/#/buy/1"
```

- **必须加 `--no-sandbox`**（不加会静默挂起）+ **`--no-proxy-server`**（否则走代理打不开局域网地址）。
- `--screenshot` 与 `--dump-dom` **不要在同一次调用里混用**，会挂住。
- 登录态存在 localStorage，无头验证前先写入 `session`（临时种子页），之后用同一个 `--user-data-dir` 打开目标页。

## 6. 数据库变更（已应用到本地库）

```sql
ALTER TABLE `user` ADD `avatar` varchar(16) DEFAULT '' AFTER `nickname`,
                   ADD `gender` varchar(8)  DEFAULT '' AFTER `avatar`,
                   ADD `phone`  varchar(20) DEFAULT '' AFTER `gender`,
                   ADD `bio`    varchar(128) DEFAULT '' AFTER `phone`;
CREATE TABLE `user_address`(id, account, name, phone, tag, province, city, detail,
                            is_default tinyint, created_at, updated_at, KEY idx_account(account));

-- 2026-11-06 经营字段 + 菜品规格（已写入 shiguang_food.sql 主文件，并生成增量迁移）
ALTER TABLE `restaurant`
  ADD `min_order` decimal(8,2) NULL DEFAULT 20.00 COMMENT '起送价' AFTER `updated_at`,
  ADD `delivery_fee` decimal(8,2) NULL DEFAULT 0.00 COMMENT '配送费' AFTER `min_order`,
  ADD `eta` varchar(16) NULL DEFAULT '' COMMENT '预估送达时间' AFTER `delivery_fee`,
  ADD `open_status` tinyint NULL DEFAULT 1 COMMENT '营业状态：1=营业中 0=已打烊' AFTER `eta`;
ALTER TABLE `dish` ADD `specs` text NULL COMMENT '规格 JSON' AFTER `sort`;
-- 增量迁移文件：springBootTest/sql/2026-11-06_business_fields.sql（含 70 店 + 350 菜 UPDATE）
```
`admin_user` 表已废弃（后台用户管理改读 `user` 表），可删。

> `shiguang_food.sql` 是全量文件（含 DROP TABLE），经营字段/规格已写入其 CREATE TABLE 与 INSERT。
> 生成脚本：`springBootTest/scripts/migrate_specs.py`（改写全量 SQL）、`scripts/gen_incremental.py`（生成增量 SQL）。

### 2026-11-11 分级分类搜索（三级分类 + 物化路径）

数据库从「平铺 7 个分类」改成 category 三级树：1 美食 → 6 个业态（面食/快餐/甜点/饮品/轻食/火锅）→
18 个品类（汤面/拌面/馄饨抄手/…/火锅小食）。**restaurant 挂二级业态，dish 挂三级品类**。

```sql
-- 结构变更（线上库已应用，全量脚本也已同步）
category  : +level +path +code +icon +enabled；唯一键 uk_cat_name → uk_cat_parent_name(parent_id,name)
            +idx_parent +idx_path +idx_level
dish      : +category_id（三级品类）+idx_dish_category；350 条全部已归类
admin_category : +level +path +icon，25 条与前台同口径
admin_dish : category_id 由二级业态细化为三级品类
restaurant : +idx_rest_category（category_id 列 2026-11-06 已有）
```

- 增量迁移：`sql/2026-11-11_category_hierarchy_v2.sql`（幂等）
- **全量脚本改造**：`scripts/migrate_category_v3_dump.py`（读线上 `dish.category_id` 回写 350 条 INSERT，幂等；
  只改 `shiguang_food.sql`，线上库不用重跑）
- 接口：`GET /api/restaurants/category-tree` → 三级树，`restaurantCount/dishCount` 是**含子孙汇总**
- 搜索：`/search` 与 `/food` 支持 `categoryId`（**优先于旧的 `category` 名称**），
  实现是 `path LIKE '/1/2/%'` 取子树 → `restaurant.category_id IN 子树 OR EXISTS(dish.category_id IN 子树)`
- 口径：`level=2` 命中该业态下所有品类；`level=3` 精确到品类；店铺计数 = 直接挂该业态的店 ∪ 卖该品类菜的店
- 前端：`FoodView.vue` 用 `/category-tree` 渲染「二级业态 tab + 三级品类 chip」，筛选传 `categoryId`；
  `api/food.js` 有 `getCategoryTree()`，`getFoodList/getRestaurants` 带 `categoryId`（mock 用 `catNameById` 反查）。
  深链 `/food?categoryId=8` 可直达「汤面」，窄屏（≤560px）业态 tab 自动换行
- 校验基线：分类 25 条（1/6/18 层）、350 菜 0 空分类、70 店 0 空分类；
  重新导入后 category/dish/restaurant/admin_category/admin_dish 五表 CHECKSUM 与线上库一致

### 2026-11-11 下单收货地址（没地址不允许下单）

```sql
-- 迁移：sql/2026-11-11_order_address.sql（幂等，线上已执行）
orders : +receiver_name varchar(20)  NOT NULL DEFAULT ''   -- 收货人（快照）
         +receiver_phone varchar(20) NOT NULL DEFAULT ''   -- 电话（快照）
         +address varchar(255)       NOT NULL DEFAULT ''   -- 地址全文（快照）
```

- **为什么是快照不是外键**：用户事后改/删地址，历史订单的配送信息不该跟着变。
  `address` 由 `province + city + detail` 拼成一行，空段自动跳过。
- **解析顺序**（`OrderServiceImpl.resolveAddress`）：`req.addressId` → 该账号 `is_default=1`
  → 该账号最早一条；都没有 → `BusinessException("请先填写收货地址，再提交订单")`。
  显式传了 `addressId` 还会校验 `user_address.account` 等于下单账号（防越权）。
- **前端**：`OrderView.vue` 顶部地址卡（切换/新增，复用 `AddressManageModal`），无地址时提交按钮 `disabled`；
  `api/order.js` 的 `createOrder` 多一个 `addressId`，且**地址类错误（message 含"地址"）不走 mock 回退**。
- **全量脚本**：`scripts/migrate_order_address_dump.py`（建表 + 28 条 INSERT 补 3 个值，幂等）。
- 验证：无地址账号 `www` → `code=1 请先填写收货地址，再提交订单`；不存在/别人的 `addressId` → 拒绝。
- **后台联动**：`GET /api/admin/order` 读真实 `orders`，返回 `id/orderNo/account/restaurant/items/amount/
  status(中文)/statusCode/receiverName/receiverPhone/address/createdAt`；`PUT /admin/order/{id}/status`
  收中文文案并映射成 0-3 写回；订单管理表格有「收货信息」列，支持关键字搜索 + 状态胶囊 + 前端分页（每页 10 条）。

### 2026-11-16 立即下单（点「下单」直接进下单页，不经过购物车）

原状：首页卡片「下单」跳到 `/order/:id`，而该页就是「购物车 · 结算」——空车时只显示「购物车还是空的」。

- **新页面** `/#/buy/:id`（`BuyNowView.vue`，路由名 `buy`，已加入 `PROTECTED` 与 `WIDE_SHELL_PAGES`）：
  一页内完成「选该店菜品 + 收货地址 + 提交订单」，底部固定栏显示合计与起送差额。
- **直购草稿独立于购物车**：`store/buyNow.js`（localStorage 键 `shiguang_buy_now`，按店铺隔离），
  提交成功只清该店铺草稿；从首页/美食页点「下单」会先 `clearDraft(id)`，保证每次都是新的一单。
- **入口**：首页推荐卡片「下单」、美食页卡片「下单」→ `/buy/:id`；店铺页菜品弹窗新增「立即下单」
  （`DishPopup` 的 `showBuyNow` + `buy` 事件），弹窗另有 `mode="direct"`，在直购页里加的是「本单」而非购物车。
- **后端 `POST /api/orders/direct`**（`DirectOrderRequest` / `DirectOrderItemDTO`）：明细只收
  `dishId + qty + specText`，**不信任前端金额**——单价 = `dish.price` + 规格加价（按 label 命中累加），
  并校验菜品存在且 `dish.restaurant_id == restaurantId`；打烊店铺拒绝。写库抽成 `saveOrder(...)`，两种下单共用。
- 验证：传「招牌牛肉面 大份/微辣」→ `totalAmount=33.00`（28+5+0）；错店菜品/不存在菜品/空明细/无地址
  各返回对应中文提示；无头 Chrome 走通「首页下单 → 选规格 → 提交 → 落库 32.00」及购物车回归链路。

### 2026-11-16 仓库清理（一次性，勿重复劳动）

- 删：`shiguang_food.sql.bak_20261106`、`.bak_20261111_090001`、`.bak_20261111_090047`
  （后两个内容完全相同）；只保留 `.bak_20261111_093451` 一份历史备份。
- 删：`_legacy_backup_2026-10-30/`（H2 时代的 properties/schema/data/pom 备份，H2 已彻底移除）。
- 删：`shiguang-food-login/src/views/OrderDetailView.vue` + `/order-detail/:id` 路由（详情早已改成 `OrderDetailModal` 弹窗）；
  `shiguang-food-login/__seed.html`（临时登录种子页，零引用）。
- 挪：`springBootTest/{gen_incremental,migrate_specs,migrate_category_v3_dump,migrate_order_address_dump}.py` → `scripts/`。
- 并：`AI-启动必读.md`、`沙箱联调手册.md` 合并进本文件后删除；`README.md` 修正了不存在的
  `start-backend.bat` / `start-frontend.bat` 引用。
- 顺手修：`App.vue` 的 `WIDE_SHELL_PAGES` 加了 `buy`（此前立即下单页被当窄壳渲染，还叠了一层品牌头）。

## 7. 已知坑

| 现象 | 原因 / 解法 |
|---|---|
| `ClassNotFoundException: plexus.classworlds.launcher.Launcher` | **只有 Git Bash 的 `./mvnw` 坏**；`mvnw.cmd` 是好的（2026-11-16 实测：Maven 3.9.9 + Zulu JDK21，`-o compile` 通过），`start-all.bat` 用的就是它。在 bash 里编译仍用 §3 第 1 条的 classworlds 方式 |
| `-Dmaven.multiModuleProjectDirectory system property is not set` | 启动命令里缺这个 `-D`，补上 |
| 编译报缺 `mybatis-plus-spring-boot3-starter` / `mysql-connector-j` | `~/.m2` 被重置 + 加了 `-o` 离线标志，去掉 `-o` 走镜像 |
| 启动端口不是 8081，或 `Port already in use` | 环境变量劫持：IDE 注入 `SERVER__PORT`/`SERVER__ADDRESS`，Spring 松散绑定覆盖配置。启动前 `Remove-Item Env:SERVER__PORT, Env:SERVER__ADDRESS` |
| `mvnw`/`npm` 报 UnauthorizedAccess（.ps1 被策略禁止） | PowerShell 里显式写 `mvn.cmd` / `npm.cmd`，或改用 cmd/bat |
| `Invalid default value for 'tag'` | 导入 SQL 未指定字符集，加 `--default-character-set=utf8mb4`（脚本已含 `SET NAMES utf8mb4`） |
| 导入 SQL 报 `No database selected` / 表建到别的库 | `shiguang_food.sql` 里没有 `CREATE DATABASE` 和 `USE`，必须 `mysql ... shiguang_food < xxx.sql`（见 §3 第 4 条） |
| 注册一直失败 | 90% 是库没建：跑 `shiguang_food.sql`。注意 user 表账号字段叫 **`account`** 不是 username |
| 前端页面有数据但后端日志无请求 | `.env` 缺失或 `VITE_USE_MOCK` 非 `false` → 走 MOCK 在浏览器内存里空转，登录必"账号或密码错误"。判据：访问 `/src/api/auth.js` 看内联 `import.meta.env.VITE_USE_MOCK` 是否 `"false"`；改完**必须重启 Vite** |
| 改了后端源码但新路由 404/500（如 `category-tree` 被当 id） | `target/classes` 是旧的，必须重新 `compile` + 重启后端，别怀疑数据库 |
| 后台用户列表只有 4 行假数据 | 跑的是旧代码/旧 jar，`admin_user` 已不再使用 |
| 页面白屏、只剩背景 emoji、`#app` 为空 | 某模块**求值阶段**就抛错（不是接口问题），见下方「白屏排查」 |
| 接口测试全部 `10061 目标计算机积极拒绝` | 后端进程已被沙箱回收，用 `restart_backend.py` 且在**同一条命令**内跑测试 |
| Python 请求 127.0.0.1 返回 502 / curl 报 `os error 11001` | 系统代理拦截：Python 用 `ProxyHandler({})`，curl 加 `--noproxy '*'` |
| 无头 Chrome 截图/抓 DOM 挂住不返回 | 缺 `--no-sandbox`；且 `--screenshot` 与 `--dump-dom` 不能混用 |
| Navicat 里 `category` 只有 7 行、像没迁移 | **Navicat 对象树缓存**（行数取自 `information_schema.TABLE_ROWS` 估算）。一律用 `SELECT level, COUNT(*) FROM category GROUP BY level;` 判定 → 应为 1/6/18。按 F5 刷新 |
| 下单返回「请先填写收货地址，再提交订单」 | 不是接口坏：该账号 `user_address` 没记录。换 `demo` 或先 POST `/api/users/addresses` |
| 会话结束后 8081/5173 打不开 | 沙箱回收后台进程，重跑 `start-all.bat` 或 §3 命令，别指望旧进程还活着 |

**白屏排查（2026-11-11 实例）**：`api/food.js` 的 `MOCK_CATEGORY_TREE` 立即执行函数引用了定义在其后的
`MOCK_RESTAURANTS`，抛 `ReferenceError: Cannot access 'MOCK_RESTAURANTS' before initialization`（TDZ），
整个模块加载失败 → `#app` 永远空着，看起来像"登录不了"，其实表单都没渲染。修法：把被依赖的常量挪到前面。
抓首条报错：

```bash
"/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" --headless=new --no-sandbox --disable-gpu \
  --no-proxy-server --enable-logging=stderr --log-level=0 --virtual-time-budget=8000 \
  --dump-dom "http://192.168.68.31:5173/#/login" 2>&1 | grep -i "CONSOLE.*\(error\|uncaught\)"
```

`--dump-dom` 输出 `id="app"></div>`（空）即 JS 没跑起来，与后端/数据库无关。

**其它约定**：GBK 的 bat 改中文内容要用 Python `encode("gbk")` 重写，别让编辑器重存 UTF-8；
`shiguang_food.sql` 含 `DROP TABLE`，执行前必须问用户；项目会被移动/用户名会变，任何绝对路径先 `ls` 核实。

## 8. 待办（做完一条删一条）

- [x] 2026-11-06 五块功能后端补齐：分类+排序、联想菜品占位（`verify_features.py` 全 PASS）
- [x] 2026-11-06 四项功能：收货地址定位条、商家卡片/店铺头部经营信息、底部购物车起送差额、菜品规格弹窗
- [x] 2026-11-16 真实浏览器端到端走查：首页下单 → 选规格 → 提交落库；店铺弹窗立即下单；购物车回归
- [x] 2026-11-16 删 `OrderDetailView.vue` 与 `/order-detail/:id` 路由
- [x] 2026-11-16 仓库清理：SQL 备份留一份、legacy 备份目录、迁移脚本归档 `scripts/`、文档合并为三份
- [x] 2026-11-16 验证 `start-all.bat`：`mvnw.cmd` 可用（Maven 3.9.9/JDK21，`-o compile` 通过），
      脚本第 18/20 行已清 `SERVER__PORT`/`SERVER__ADDRESS`，建库逻辑（`CREATE DATABASE IF NOT EXISTS` +
      有表才导入）正确。**注意：`shiguang_food.sql` 本身不含建库语句，靠脚本这一句建库**
- [ ] `HomeView` / auth / admin 页的本地 `showToast` 统一到 `composables/useToast.js`
- [ ] 删数据库废弃表 `admin_user`、`admin_order`（先去掉 `AdminService` 里对 `AdminOrderMapper` 的注入）
- [ ] 可选：后台「店铺管理」（营业状态/公告/配送费）——前端展示已支持，后台编辑入口未做
- [ ] 可选：地址表单换省市区级联
- [ ] 可选：头像改文件上传
- [ ] 可选：接口鉴权（当前全开放，token 未校验）

## 9. 备份（机器重置前）

`D:\workSpace\ww\java-main2` 整目录 + `mysqldump --default-character-set=utf8mb4 shiguang_food` + `.env`。
`node_modules`/`target`/`dist`/`.m2` 不必备（可用 `npm install` 与 maven 重新生成）。
注意 `.env` **未入库**（在 `.gitignore` 里），清机前单独拷一份。
