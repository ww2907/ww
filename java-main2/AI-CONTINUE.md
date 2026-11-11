# AI-CONTINUE.md — 机器接续卡

> 只给 AI 读：纯事实、命令、契约、约束，不含叙事。人看的版本见 `HANDOFF.md`。
> 生成时间 2026-11-04，对应代码状态：三轮需求已完成并通过接口级联调。

## 0. 开工前 3 步

1. 读本文件 → 2. `cd D:\workSpace\ww\java-main2` 确认目录存在 → 3. 按第 3 节编译/启动，失败再查第 7 节。

## 1. 定位

| 项 | 值 |
|---|---|
| 项目根 | `D:\workSpace\ww\java-main2` |
| 前端 | `shiguang-food-login`（Vue 3.4 + Vite 5.4 + vue-router 4，依赖仅 axios/vue/vue-router） |
| 后端 | `springBootTest`（Spring Boot 3.4.5 + MyBatis-Plus 3.5.9 + MySQL 8，Java 17） |
| 后端包名 | `com.fenglin.springboottest`，启动类 `SpringBootTestApplication` |
| 数据库 | `shiguang_food` @ 127.0.0.1:3306，root/123456，profile=`dev` |
| 后端端口 | 8081；前端 dev 5173，`vite.config.js` 把 `/api` 代理到 8081 |
| 前端模式 | `.env` 中 `VITE_USE_MOCK=false`、`VITE_ADMIN_USE_MOCK=false` → **默认连真实后端** |

## 2. 目录约定

```
frontend: src/api/{food,restaurant,order,profile,admin,auth}.js   # 契约层
          src/store/{cart,profile,admin}.js                       # reactive + localStorage
          src/components/{DishPopup,OrderDetailModal,EmptyState,ToastHost,ProfileEditModal,AddressManageModal,LocationBar}.vue
          src/views/*.vue  src/views/admin/*.vue
backend:  controller/{Auth,Restaurant,Order,UserProfile,Admin}Controller.java
          service/{...}Service.java + service/impl/*Impl.java
          entity/ mapper/ vo/ controller/dto/  # vo 含 DishSpecVO/DishSpecOptionVO（规格）
sql:      shiguang_food.sql（全量，含经营字段/规格）
          springBootTest/sql/2026-11-04_profile_address.sql（增量）
          springBootTest/sql/2026-11-06_business_fields.sql（经营字段+规格增量）
```

## 3. 命令（本机已验证）

```bash
# 后端编译（mvnw 在本机坏掉，必须用下面这条）
M="C:/Users/Administrator/.m2/wrapper/dists/apache-maven-3.9.16-bin/5grr65jo27hi51sujmtcldfovl/apache-maven-3.9.16"
cd "D:/workSpace/ww/java-main2/springBootTest"
java -classpath "$M/boot/plexus-classworlds-2.11.0.jar" -Dclassworlds.conf="$M/bin/m2.conf" \
  -Dmaven.home="$M" -Dmaven.multiModuleProjectDirectory="$PWD" \
  org.codehaus.plexus.classworlds.launcher.Launcher -o -DskipTests compile

# 后端启动（端口被环境改写时追加 --server.port=8081）
#   同上，末尾把 compile 换成：-Dspring-boot.run.arguments="--server.port=8081" spring-boot:run

# 前端
cd "D:/workSpace/ww/java-main2/shiguang-food-login" && npm install && npm run dev   # / npm run build

# 数据库
mysql -uroot -p123456 --default-character-set=utf8mb4 shiguang_food < springBootTest/sql/2026-11-04_profile_address.sql
```

## 4. 接口契约（前端调用 → 后端实现，均已实测）

| 前端 | 方法 + 路径 | 后端 |
|---|---|---|
| `food.js` | GET `/api/restaurants/search` `/recommended` `/food` `/categories` | RestaurantController |
| `food.js` | 上述 search/food 支持 `sort=default\|price\|distance` + `order=asc\|desc` | 同文件（2026-11-06 新增） |
| `restaurant.js` | GET `/api/restaurants/search/suggest?keyword=&limit=8` | 同文件，**声明在 `/{id}` 之前** |
| `restaurant.js` | GET `/api/restaurants/{id}` → `{menu,reviews,avgRating,reviewCount}` | 同文件 |
| `order.js` | POST `/api/orders` `{restaurantId,restaurantName,account,items:[{dishId,name,price,qty}]}` | OrderController |
| `order.js` | GET `/api/orders?account=&status=`、GET `/api/orders/{id}`、GET `/api/orders/stats?account=`、POST `/api/orders/{id}/status?status=` | 同文件 |
| `profile.js` | GET/PUT `/api/users/profile`、CRUD `/api/users/addresses`、POST `/api/users/addresses/{id}/default` | UserProfileController |
| `admin.js` | `/api/admin/{login,nav,search,recommend,category,dish,stats,user,order}` + `/api/admin/dish/{id}/price`、`/api/admin/dish/price/batch`、`/api/admin/order/{id}/status` | AdminController |
| `admin.js` | GET `/api/admin/user/{id}/address`、DELETE `/api/admin/user/{id}/address/{addressId}` | 同文件（新增） |

返回统一 `{code,message,data}`，`code===0` 成功。异常走 `BusinessException` + `GlobalExceptionHandler`。

## 5. 不变量（改了会连锁炸）

1. `Result<T>` 结构不能变；前端所有 `http*` 都判 `res.data.code !== 0` 抛错。
2. `/search/suggest` 必须排在 `/{id}` 之前，否则 Spring 把 `suggest` 当 id 解析。
3. `OrderVO` 必须带 `restaurantId`、`OrderItemVO` 必须带 `dishId`（**列表和详情两条路径都要设**，曾漏过列表）→ 「再来一单」按这两字段还原。
4. 下单时显式 `order.setCreatedAt(LocalDateTime.now())`，MySQL 默认值不会回填实体。
5. `user_address` 的默认地址唯一：写 `is_default=1` 前先 `clearDefault(account)`。
6. 购物车按 `restaurantId` 分组，下单后只清该店铺。
7. UI 数据源是 `store/*.js` 的 reactive 对象；写操作"先改本地再提交后端"，不能改成"等后端返回再渲染"（会破坏离线演示）。
8. 排序口径三处必须一致：后端 `RestaurantServiceImpl.applySort`、前端 `food.js` 的 `sortRestaurants`、`FoodView` 的 `sorted`。
   `default` = 评分降序 → 距离升序 → id；`price`/`distance` = 该字段升序 → 评分降序 → id。改一处必须同步另两处。
9. `suggest` 的店铺占位上限 = `ceil(limit*0.6)`：店铺不限流会把菜品全部挤掉（搜「面」只看得到面馆）。
10. 经营字段派生口径（2026-11-06）三处一致：SQL 种子、后端 `RestaurantServiceImpl` 读库、前端 `food.js` 的
    `withSortFields` 兜底。规则：起送价=分类基准(面20/快餐20/甜点25/饮品15/轻食30/火锅50)+`(id%2)*5`；
    配送费/送达时间按距离分档；打烊=`id%7==0`。真实模式以后端库为准，mock 才用兜底。
11. 菜品规格 `dish.specs` 是 JSON 文本 `[{name,type,options:[{label,price}]}]`，`type` 为 `single`(单选)/`multi`(多选)。
    后端 `RestaurantServiceImpl.parseSpecs` 解析成 `List<DishSpecVO>`；前端购物车按 `id#specText` 区分不同规格条目。

## 5.1 验收脚本（本轮新增，改完接口先跑这个）

```bash
cd springBootTest
python restart_backend.py 8081     # 分离进程启后端 + 轮询到就绪（解决"命令结束进程就被杀"）
python verify_features.py          # 五块功能 + 经营字段/规格 58 项接口验收，全 PASS 才算完
python verify_via_vite.py          # 经 Vite 代理(5173→8081) 验证前端实际请求链路
```

> 本沙箱的**会话进程会被回收**：普通 `nohup ... &` 拉起的后端在命令结束/下一次命令时就被杀。
> 必须用 `restart_backend.py` 里的 `DETACHED_PROCESS`，且**启动与测试必须放在同一条 bash 命令里**。
> 另：本机装了 SSL 代理，Python 用默认 urllib 请求 127.0.0.1 会 502，必须 `ProxyHandler({})`。

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

> `shiguang_food.sql` 是全量文件（含 DROP TABLE），本轮已把经营字段/规格写入其 CREATE TABLE 与 INSERT。
> 备份在 `shiguang_food.sql.bak_20261106`。生成/应用脚本：`springBootTest/migrate_specs.py`（改写全量 SQL）、
> `springBootTest/gen_incremental.py`（生成增量 SQL）。

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

- 增量迁移：`sql/2026-11-11_category_hierarchy_v2.sql`（可重复执行，幂等）
- **全量脚本改造**：`migrate_category_v3_dump.py`（读线上 `dish.category_id` 回写 350 条 INSERT，幂等；
  只改了 `shiguang_food.sql`，线上库不用重跑）。备份 `shiguang_food.sql.bak_20261111_*`
- 接口：`GET /api/restaurants/category-tree` → 三级树，`restaurantCount/dishCount` 是**含子孙汇总**
- 搜索：`/search` 与 `/food` 支持 `categoryId`（**优先于旧的 `category` 名称**），
  实现是 `path LIKE '/1/2/%'` 取子树 → `restaurant.category_id IN 子树 OR EXISTS(dish.category_id IN 子树)`
- 口径：`level=2` 命中该业态下所有品类；`level=3` 精确到品类；店铺计数 = 直接挂该业态的店 ∪ 卖该品类菜的店
- **前端已接**（2026-11-11）：`FoodView.vue` 用 `/category-tree` 渲染「二级业态 tab + 三级品类 chip」，
  筛选传 `categoryId`（不再是 7 个平铺名字）；`api/food.js` 加了 `getCategoryTree()`，
  `getFoodList/getRestaurants` 新增 `categoryId` 参数（mock 模式用 `catNameById` 反查名称）。
  深链 `/food?categoryId=8` 可直达「汤面」，窄屏（≤560px）业态 tab 自动换行
- 校验基线：分类 25 条（1/6/18 层）、350 菜 0 空分类、70 店 0 空分类；
  重新导入 `shiguang_food.sql` 后 category/dish/restaurant/admin_category/admin_dish 五张表 CHECKSUM 与线上库完全一致

### 2026-11-11 下单收货地址（没地址不允许下单）

原状：整条下单链路没有地址概念（`orders` 无地址列、`createOrder` 不校验），
需求「没填地址无法完成订单」等于要**从零补上**校验与落库。

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
  显式传了 `addressId` 还会校验 `user_address.account` 是否等于下单账号（防越权）。
- **前端**：`OrderView.vue` 顶部地址卡（切换/新增，复用 `AddressManageModal`），
  无地址时提交按钮 `disabled` + 橙框提示；`api/order.js` 的 `createOrder` 多一个 `addressId`，
  并且**地址类错误（message 含"地址"）不走 mock 回退**，避免"接口报错却提示下单成功"。
- **全量脚本**：`migrate_order_address_dump.py`（建表 + 28 条 INSERT 补 3 个值，幂等；
  demo 的两单按线上回填了地址）。
- 验证：无地址账号 `www` → `code=1 请先填写收货地址，再提交订单`；不存在/别人的 `addressId` → 拒绝；
  `demo` 不传 `addressId` → 自动取默认地址并写入快照；浏览器实测无地址时按钮置灰、有地址时下单成功。
- **后台联动**：`GET /api/admin/order` 改为读真实 `orders`（原先是 `admin_order` 的 4 条演示数据），
  返回 `id / orderNo / account / restaurant / items / amount / status(中文) / statusCode
  / receiverName / receiverPhone / address / createdAt`；`PUT /admin/order/{id}/status` 收中文文案，
  内部映射成 0-3 写回真实订单（非法文案抛 `未知的订单状态`）。订单管理表格新增「收货信息」列。
- **后台订单页交互**：关键字搜索（订单号/账号/店铺/收货人/电话/地址）+ 状态胶囊（带计数）+ 前端分页
  （每页 10 条、页码窗口 5 个）。数据仍是一次性拉全量（与后台其它列表一致），
  订单量再涨一个量级时把 `keyword/status/page` 下推给 `/admin/order` 即可。
  改状态失败会把下拉框回滚到原值，避免界面与库不一致。

## 7. 已知坑

| 现象 | 原因 / 解法 |
|---|---|
| `ClassNotFoundException: plexus.classworlds.launcher.Launcher` | `./mvnw` 脚本坏，用第 3 节 java -classpath 方式 |
| `-Dmaven.multiModuleProjectDirectory system property is not set` | 启动命令里缺这个 `-D`，补上 |
| `Invalid default value for 'tag'` | 导入 SQL 未指定字符集，加 `--default-character-set=utf8mb4`（脚本已含 `SET NAMES utf8mb4`） |
| 启动端口不是 8081 | 环境变量覆盖，显式 `--server.port=8081` |
| 前端页面有数据但后端日志无请求 | `.env` 被改回 mock 了，检查 `VITE_USE_MOCK` |
| 后台用户列表只有 4 行假数据 | 说明跑的是旧代码/旧 jar，`admin_user` 已不再使用 |
| 页面白屏、只剩背景 emoji、`#app` 为空 | 某模块**求值阶段**就抛错（不是接口问题）。2026-11-11 实例：`api/food.js` 的 `MOCK_CATEGORY_TREE` 提前引用 `MOCK_RESTAURANTS` → TDZ `ReferenceError`，整个模块加载失败 → 登录页白屏，误判成"登录不了"。用无头 Chrome 抓 `CONSOLE` 首条 Uncaught 定位，详见 `AI-启动必读.md` 坑 14 |
| 接口测试全部 `10061 目标计算机积极拒绝` | 后端进程已被沙箱回收，用 `restart_backend.py` 且在**同一条命令**内跑测试 |
| Python 请求 127.0.0.1 返回 502 Bad Gateway | 系统代理拦截，用 `urllib.request.ProxyHandler({})` 绕过 |
| curl 本地地址报 `upstream connect failed / os error 11001` | 同上，改用 Python 或被代理托管；Git Bash 下 curl 不可靠 |
| Navicat 里 `category` 只有 7 行、`admin_category` 也只有 7 行（像没迁移） | **是 Navicat 的对象树缓存，不是库的问题**。库是真的（2026-11-11 实测 25 条）。Navicat 的「行」列取自 `information_schema.TABLE_ROWS`（InnoDB 估算）且刷新不及时，「修改时间」同理。判定真伪一律用 `SELECT COUNT(*)`：`SELECT level, COUNT(*) FROM category GROUP BY level;` → 应为 1/6/18。解法：数据库连线上按 F5 / 右键「刷新」，或重开 Navicat |

## 8. 待办（做完一条删一条）

- [x] 2026-11-06 五块功能后端补齐：分类+排序、联想菜品占位（详见 5.1 验收 51 项全 PASS）
- [x] 2026-11-06 四项功能：收货地址定位条、商家卡片/店铺头部经营信息、底部购物车起送差额、菜品规格弹窗（58 项全 PASS）
- [ ] 真实模式浏览器端到端走查（本机无 Chromium，仅接口级 + 代理链路验证）
- [ ] 删 `src/views/OrderDetailView.vue` 及其路由（已被弹窗替代）
- [ ] `HomeView` / auth / admin 页的本地 `showToast` 统一到 `composables/useToast.js`
- [ ] 删数据库 `admin_user` 表
- [ ] 可选：后台「店铺管理」（营业状态/公告/配送费）——前端展示已支持，后台编辑入口未做
- [ ] 可选：地址表单换省市区级联
- [ ] 可选：头像改文件上传
- [ ] 可选：接口鉴权（当前全开放）

## 9. 备份（机器重置前）

`D:\workSpace\ww\java-main2` 整目录 + `mysqldump --default-character-set=utf8mb4 shiguang_food` + `.env`。
`node_modules`/`target`/`dist`/`.m2` 不必备。
