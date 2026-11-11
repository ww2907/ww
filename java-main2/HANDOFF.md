# HANDOFF.md · 食光美食（外卖点单）项目交接说明

> 用途：换机器 / 重装系统 / 隔一段时间再回来继续做时，让新会话（或新同学）5 分钟内接上上下文。
> 最后更新：2026-11-04

---

## 1. 一句话说明

一个「美食外卖点单」全栈练习项目：Vue3 前端 + Spring Boot 3 后端 + MySQL，前后端都已完成三轮需求（交互补齐 → UX 打磨 → 后端与后台管理落地），当前处于**收尾/可选优化**阶段。

## 2. 目录与技术栈

```
D:\workSpace\ww\java-main2\
├─ shiguang-food-login\        # 前端 Vue3 + Vite5 + vue-router（含 PC 后台管理）
│  ├─ src\api\                 # 接口层（food / restaurant / order / profile / admin / auth）
│  ├─ src\store\               # 全局 store（cart / profile / admin，reactive + localStorage）
│  ├─ src\components\          # 通用组件（DishPopup / OrderDetailModal / EmptyState / ToastHost …）
│  ├─ src\views\               # 用户端页面 + views\admin\* 后台页面
│  └─ vite.config.js           # dev 代理 /api -> http://192.168.68.31:8081（host 也绑定该 IP）
├─ springBootTest\             # 后端 Spring Boot 3.4 + MyBatis-Plus 3.5 + MySQL
│  ├─ src\main\java\com\fenglin\springboottest\
│  │  ├─ controller\           # Auth / Restaurant / Order / UserProfile / Admin
│  │  ├─ service\ + service\impl\
│  │  ├─ entity\ mapper\ vo\ controller\dto\
│  ├─ sql\2026-11-04_profile_address.sql   # 个人资料 + 收货地址迁移
│  └─ src\main\resources\application-dev.properties  # 端口 8081、MySQL 连接
└─ shiguang_food.sql           # 全量建库脚本（末尾已追加同一份迁移）
```

- 后端包名：`com.fenglin.springboottest`
- 数据库：MySQL `shiguang_food`，账号 `root / 123456`，端口 3306
- 后端端口：**8081**（`application-dev.properties`）
- 前端 dev：`npm run dev`（默认 5173，`/api` 代理到 8081）
- **前端当前模式**：`shiguang-food-login/.env` 里写的是 `VITE_USE_MOCK=false` + `VITE_ADMIN_USE_MOCK=false`，
  即**现在默认连真实后端**。想回到纯前端演示，把这两行注释掉或改 true 再重启 `npm run dev`。

## 3. 启动方式（重要坑）

### 后端
`./mvnw` 在本机 Git-Bash 下是坏的（`ClassNotFoundException: plexus.classworlds.launcher.Launcher`），
直接用缓存的 Maven 发行版启动：

```bash
M="C:/Users/Administrator/.m2/wrapper/dists/apache-maven-3.9.16-bin/5grr65jo27hi51sujmtcldfovl/apache-maven-3.9.16"
cd "D:/workSpace/ww/java-main2/springBootTest"
java -classpath "$M/boot/plexus-classworlds-2.11.0.jar" \
     -Dclassworlds.conf="$M/bin/m2.conf" \
     -Dmaven.home="$M" \
     -Dmaven.multiModuleProjectDirectory="D:/workSpace/ww/java-main2/springBootTest" \
     org.codehaus.plexus.classworlds.launcher.Launcher -o -DskipTests compile
```
> 新机器上如果 `.m2` 里没有这个目录，先跑一次 `mvnw`（或装个全局 Maven）把依赖拉下来。
> 若启动时端口被环境改写（日志里出现奇怪端口），追加 `-Dspring-boot.run.arguments="--server.port=8081"`。
> 直接 IntelliJ 里跑 `SpringBootTestApplication` 最省事。

### 前端
```bash
cd D:/workSpace/ww/java-main2/shiguang-food-login
npm install
npm run dev      # 开发
npm run build    # 构建校验（已通过，158 modules）
```

### 数据库
```bash
# 全新导入（注意必须是 utf8mb4，否则中文默认值报 Invalid default value）
mysql -uroot -p123456 --default-character-set=utf8mb4 < shiguang_food.sql
# 已有库只补迁移
mysql -uroot -p123456 --default-character-set=utf8mb4 shiguang_food < springBootTest/sql/2026-11-04_profile_address.sql
```

## 4. 已完成（三轮需求）

### 第一轮：五类交互/功能
1. 美食卡片：点击进店铺详情、菜品弹窗、加入购物车（`store/cart.js` 按店铺维度）
2. 筛选：分类筛选 + 人均价格/距离排序（`food.js` 的 `price` / `distanceM`）
3. 订单：详情弹窗、待支付去支付、取消、再来一单（`OrderDetailModal.vue`）
4. 搜索：实时联想（`AppSearch.vue` + `/restaurants/search/suggest`）、无结果空态
5. 我的：头像修改、资料编辑、收货地址管理（`ProfileEditModal` / `AddressManageModal`）

### 第二轮：UX 打磨
空状态（`EmptyState.vue` 五种插画）、加载态（`.btn-spin`）、Toast（`useToast` + `ToastHost`）、
hover 质感、响应式（860/600/520/380 断点 + 安全区）。

### 第三轮：后端 + 后台管理落地
| 项 | 接口 | 状态 |
|---|---|---|
| 个人资料 | `GET/PUT /api/users/profile` | ✅ 实测通过 |
| 收货地址 | `GET/POST /api/users/addresses`、`PUT/DELETE /{id}`、`POST /{id}/default` | ✅ 实测通过 |
| 搜索联想 | `GET /api/restaurants/search/suggest` | ✅ 实测通过 |
| 排序字段 | `RestaurantVO.price / distanceM` | ✅ 实测通过 |
| 再来一单 | `OrderVO.restaurantId`、`OrderItemVO.dishId` | ✅ 实测通过 |
| 后台用户管理 | `GET/PUT/DELETE /api/admin/user`（读真实 `user` 表） | ✅ 实测通过 |
| 后台用户地址 | `GET /api/admin/user/{id}/address`、`DELETE …/{addressId}` | ✅ 实测通过 |
| 店铺详情/菜单/评价 | `GET /api/restaurants/{id}`（70 店各 5 菜 5 评价） | ✅ 实测通过 |
| 下单全链路 | `POST /api/orders` → 列表 → 详情 → 改状态 → 统计 | ✅ 实测通过 |

**本轮顺带修掉的 3 个真实 bug**
1. 订单**列表**接口漏回传 `dishId`（详情有、列表没有）→ 真实模式下「再来一单」加购失败。
2. `POST /api/orders` 返回的 `createdAt` 是空串（MySQL 默认值不回填实体）→ 已在下单时显式写入。
3. 前端 `food.js` 的 `getCategories` 少了 `await`，导致后端异常时回退逻辑失效。

### 第四轮：数据库分级分类（2026-11-11）

分类从「平铺 7 个」变成三级树，**数据库 + 后端接口 + 前端级联筛选都已落地**：

- 分类树：美食(1) → 面食/快餐/甜点/饮品/轻食/火锅(2~7) → 18 个品类(8~25)，带 `level` 和物化路径 `path`
- 归属：`restaurant.category_id` 挂二级业态，`dish.category_id` 挂三级品类（350 道菜全部归类）
- 接口：`GET /api/restaurants/category-tree`（三级树 + 含子孙的店铺/菜品计数）；
  `/search`、`/food` 支持 `categoryId`（子树 + 菜品反查，优先级高于旧的 `category` 名称）
- 前端：`FoodView.vue` 消费 `/category-tree`，渲染「二级业态 tab + 三级品类 chip」；
  `api/food.js` 新增 `getCategoryTree()`，`getFoodList/getRestaurants` 支持 `categoryId`
  （mock 模式下用 `catNameById` 反查名称过滤）。支持深链 `/food?categoryId=8`
- 全量脚本 `shiguang_food.sql` 已同步改造（重新导入即为分级分类结构），增量迁移见
  `springBootTest/sql/2026-11-11_category_hierarchy_v2.sql`
- 验证：重新导入全量脚本后，category/dish/restaurant/admin_category/admin_dish 五表数据校验和与线上库一致；
  浏览器 CDP 实测点击链路（全部 58 → 快餐 10 → 炸鸡烤翅 9 → 本类全部 10 → 饮品 11 → 全部 58）

### 第五轮：下单收货地址（2026-11-11）

需求：**没填收货地址就不允许提交订单**。原状是整条链路压根没有地址这回事
（`orders` 无地址字段、`createOrder` 不校验），所以「校验」和「记录」都得新建。

- 数据库：`orders` 加 `receiver_name / receiver_phone / address` 三个**快照**列
  （`sql/2026-11-11_order_address.sql`，幂等；有地址的老订单按默认地址回填，其余留空）
- 后端：`OrderCreateRequest.addressId` → `OrderServiceImpl.resolveAddress()` 按
  「显式 id → 账号默认地址 → 最早一条」顺序解析；校验归属（不许拿别人地址下单）；
  一条都没有 → `请先填写收货地址，再提交订单`。地址写进订单快照，`OrderVO` 一并返回
- 前端：`OrderView.vue` 顶部新增收货地址卡（可切换/新增，复用 `AddressManageModal`）；
  无地址时「提交订单」置灰 + 橙框提示 + 一键去添加；`api/order.js` 下传 `addressId`，
  且**地址类错误不再回退 mock**（否则会假装下单成功）
- 全量脚本：`migrate_order_address_dump.py` 同步建表与 28 条 INSERT（demo 两单回填了地址）
- 后台联动：订单管理原先读的是 `admin_order` 假数据（4 条），现改为读真实 `orders`
  （多表拼装：订单 + 明细摘要 + 收货快照），并新增「收货信息」列；状态改用中文文案，
  后台 select 改状态会真实写回前台订单。`admin_order` 表就此废弃

## 5. 关键约定（改代码前务必看）

- **契约优先**：所有 `src/api/*.js` 的 `ENDPOINTS` 就是前后端契约，后端路径不要单方面改。
- **mock-first（代码层）**：`VITE_USE_MOCK !== 'false'` 时代码内部走本地 mock；`.env` 目前把它设成了 `false` 所以实际连真实后端。真实模式下后端失败会自动回退 mock（`*_FALLBACK_MOCK`），所以「后端挂了页面也不会白屏」。
- **Spring 路由顺序**：`/search/suggest` 必须声明在 `/{id}` **之前**，否则被路径变量吃掉。
- **统一返回**：`Result<T>{code,message,data}`，`code === 0` 成功；异常走 `BusinessException` + `GlobalExceptionHandler`。
- **购物车按店铺隔离**：同一店铺加购合并，下单后只清该店铺。
- **下单必须有收货地址**：`orders.address / receiver_name / receiver_phone` 是**快照**（不是外键），
  用户改/删地址不影响历史订单；`resolveAddress()` 找不到地址就抛业务异常，前端据此提示。
  新增下单入口时记得带 `addressId`，或确认该账号有地址（后端会自动取默认地址）。
- **`user` 表新增字段**：`avatar / gender / phone / bio`；地址在 `user_address` 表（`is_default` 唯一默认）。

## 6. 剩余待办（可选，按优先级）

0. **~~前端美食页三级级联筛选~~**（2026-11-11 已完成）：`FoodView.vue` 已改为「业态 tab + 品类 chip」，
   筛选传 `categoryId`，支持 `/food?categoryId=<id>` 深链；mock 模式降级为两级（无菜品级数据）。
1. **真实模式浏览器走查**：`.env` 已是真实后端模式，但到目前为止只做了**接口级**验证（curl 全链路通过）＋美食页的 CDP 点击验证，
   没在浏览器里人工点过。启动前后端后走一遍首页/店铺/购物车/订单/我的/后台，确认字段与样式无错位（重点看：人均价格、距离排序、再来一单、后台用户管理的新列）。
2. **遗留文件清理**：`src/views/OrderDetailView.vue` 已不被使用（订单详情改成弹窗了），路由表中仍挂着，可删。
3. **Toast 未统一**：`HomeView`、登录/注册/找回、各 admin 页面仍是各自本地 `showToast`，可统一到 `composables/useToast.js`。
4. **无用表**：`admin_user`（后台用户管理改读 `user` 表）与 `admin_order`（后台订单管理已改读 `orders` 表）
   都已废弃，可删。注意 `AdminService` 里仍注入着 `AdminOrderMapper`（保留未用），删表前先去掉这个依赖。
5. **店铺管理后台未做**：当时按「没有则不用」跳过。若要补，做营业状态 / 公告 / 配送费即可。
6. **地址表单**：省、市目前是两个文本框，可换成省市区级联选择器。
7. **头像**：只有 emoji 选择，没有文件上传。
8. **鉴权**：后端接口目前全开放，token 未校验（练习项目可不管）。

## 7. 备份清单（重置系统前务必做）

| 要备份 | 内容 |
|---|---|
| 代码 | 整个 `D:\workSpace\ww\java-main2`（或 git commit + push） |
| 本文件 | `HANDOFF.md`（跟着项目走，别单独放桌面） |
| 数据库 | `mysqldump -uroot -p123456 --default-character-set=utf8mb4 shiguang_food > shiguang_food_backup.sql` |
| 前端环境变量 | `shiguang-food-login/.env*`（若有） |
| 不用备份 | `node_modules`、`target`、`dist`、`.m2` 缓存 |

## 8. 回来继续时，这样开口

```
接续任务：食光美食（外卖点单）全栈项目，代码在 D:\workSpace\ww\java-main2。
先读 D:\workSpace\ww\java-main2\HANDOFF.md 了解已完成内容和剩余待办，再开始做。
这次我想做：<第 6 节里挑一条，或你的新需求>
```

如果项目路径变了，把上面路径换成新路径即可。**记得先让我读 HANDOFF.md**，比口头复述快得多，也不会漏。
