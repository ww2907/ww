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
          src/components/{DishPopup,OrderDetailModal,EmptyState,ToastHost,ProfileEditModal,AddressManageModal}.vue
          src/views/*.vue  src/views/admin/*.vue
backend:  controller/{Auth,Restaurant,Order,UserProfile,Admin}Controller.java
          service/{...}Service.java + service/impl/*Impl.java
          entity/ mapper/ vo/ controller/dto/
sql:      shiguang_food.sql（全量，末尾含迁移）
          springBootTest/sql/2026-11-04_profile_address.sql（增量）
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

## 6. 数据库变更（已应用到本地库）

```sql
ALTER TABLE `user` ADD `avatar` varchar(16) DEFAULT '' AFTER `nickname`,
                   ADD `gender` varchar(8)  DEFAULT '' AFTER `avatar`,
                   ADD `phone`  varchar(20) DEFAULT '' AFTER `gender`,
                   ADD `bio`    varchar(128) DEFAULT '' AFTER `phone`;
CREATE TABLE `user_address`(id, account, name, phone, tag, province, city, detail,
                            is_default tinyint, created_at, updated_at, KEY idx_account(account));
```
`admin_user` 表已废弃（后台用户管理改读 `user` 表），可删。

## 7. 已知坑

| 现象 | 原因 / 解法 |
|---|---|
| `ClassNotFoundException: plexus.classworlds.launcher.Launcher` | `./mvnw` 脚本坏，用第 3 节 java -classpath 方式 |
| `-Dmaven.multiModuleProjectDirectory system property is not set` | 启动命令里缺这个 `-D`，补上 |
| `Invalid default value for 'tag'` | 导入 SQL 未指定字符集，加 `--default-character-set=utf8mb4`（脚本已含 `SET NAMES utf8mb4`） |
| 启动端口不是 8081 | 环境变量覆盖，显式 `--server.port=8081` |
| 前端页面有数据但后端日志无请求 | `.env` 被改回 mock 了，检查 `VITE_USE_MOCK` |
| 后台用户列表只有 4 行假数据 | 说明跑的是旧代码/旧 jar，`admin_user` 已不再使用 |

## 8. 待办（做完一条删一条）

- [ ] 真实模式浏览器端到端走查（当前仅 curl 级验证）
- [ ] 删 `src/views/OrderDetailView.vue` 及其路由（已被弹窗替代）
- [ ] `HomeView` / auth / admin 页的本地 `showToast` 统一到 `composables/useToast.js`
- [ ] 删数据库 `admin_user` 表
- [ ] 可选：后台「店铺管理」（营业状态/公告/配送费）
- [ ] 可选：地址表单换省市区级联
- [ ] 可选：头像改文件上传
- [ ] 可选：接口鉴权（当前全开放）

## 9. 备份（机器重置前）

`D:\workSpace\ww\java-main2` 整目录 + `mysqldump --default-character-set=utf8mb4 shiguang_food` + `.env`。
`node_modules`/`target`/`dist`/`.m2` 不必备。
