/*
 Navicat Premium Dump SQL

 Source Server         : test
 Source Server Type    : MySQL
 Source Server Version : 80039 (8.0.39)
 Source Host           : localhost:3306
 Source Schema         : shiguang_food

 Target Server Type    : MySQL
 Target Server Version : 80039 (8.0.39)
 File Encoding         : 65001

 Date: 14/10/2026 09:54:37
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for category
-- ----------------------------
DROP TABLE IF EXISTS `category`;
CREATE TABLE `category`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '分类名称',
  `parent_id` bigint NOT NULL DEFAULT 0 COMMENT '父分类id；0=顶级',
  `sort_order` int NOT NULL DEFAULT 0 COMMENT '排序权重',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_cat_name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '分类表（支持分级）' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of category
-- ----------------------------
INSERT INTO `category` VALUES (1, '美食', 0, 0);
INSERT INTO `category` VALUES (2, '面食', 1, 1);
INSERT INTO `category` VALUES (3, '快餐', 1, 2);
INSERT INTO `category` VALUES (4, '甜点', 1, 3);
INSERT INTO `category` VALUES (5, '饮品', 1, 4);
INSERT INTO `category` VALUES (6, '轻食', 1, 5);
INSERT INTO `category` VALUES (7, '火锅', 1, 6);

-- ----------------------------
-- Table structure for dish
-- ----------------------------
DROP TABLE IF EXISTS `dish`;
CREATE TABLE `dish`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `restaurant_id` bigint NOT NULL COMMENT '所属店铺',
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '菜品名称',
  `price` decimal(8, 2) NOT NULL COMMENT '价格',
  `emoji` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '图标',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '描述',
  `sort` int NULL DEFAULT 0 COMMENT '排序权重',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_rest`(`restaurant_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 41 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '菜品表（店内美食）' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of dish
-- ----------------------------
INSERT INTO `dish` VALUES (1, 1, '招牌牛肉面', 28.00, '🍜', '牛骨熬汤 8 小时，手工现拉，一勺辣油封神。', 1);
INSERT INTO `dish` VALUES (2, 1, '红油抄手', 22.00, '🥟', '皮薄馅大，麻辣鲜香直冲天灵盖。', 2);
INSERT INTO `dish` VALUES (3, 1, '酸辣肥肠面', 26.00, '🍜', '肥肠处理干净无异味，酸辣开胃。', 3);
INSERT INTO `dish` VALUES (4, 1, '卤香豆干', 10.00, '🍢', '老卤慢浸，越嚼越香的下饭小菜。', 4);
INSERT INTO `dish` VALUES (5, 1, '冰镇酸梅汤', 8.00, '🥤', '古法熬煮，解辣神器。', 5);
INSERT INTO `dish` VALUES (6, 2, '鸡胸蔬菜沙拉', 26.00, '🥗', '高蛋白低脂，油醋汁现拌。', 1);
INSERT INTO `dish` VALUES (7, 2, '牛油果鸡蛋三明治', 24.00, '🥪', '全麦面包夹现切牛油果，给得慷慨。', 2);
INSERT INTO `dish` VALUES (8, 2, '藜麦时蔬碗', 30.00, '🍚', '藜麦配当季时蔬，饱腹无负担。', 3);
INSERT INTO `dish` VALUES (9, 2, '烤时蔬卷', 22.00, '🥙', '彩椒西葫芦现烤，清爽不油腻。', 4);
INSERT INTO `dish` VALUES (10, 2, '鲜榨羽衣甘蓝汁', 16.00, '🥤', '当季果蔬冷压，微苦回甘。', 5);
INSERT INTO `dish` VALUES (11, 3, '现烤舒芙蕾', 32.00, '🍮', '出炉即食，端上来还在抖，入口即化。', 1);
INSERT INTO `dish` VALUES (12, 3, '海盐提拉米苏', 28.00, '🍰', '马斯卡彭配海盐，酒香恰到好处不齁。', 2);
INSERT INTO `dish` VALUES (13, 3, '莓果千层', 30.00, '🍓', '层层奶油夹鲜莓，酸得清醒。', 3);
INSERT INTO `dish` VALUES (14, 3, '焦糖布丁', 20.00, '🍮', '丝滑布丁淋焦糖脆壳。', 4);
INSERT INTO `dish` VALUES (15, 3, '芋泥啵啵杯', 24.00, '🧋', '手捣芋泥配 Q 弹啵啵，料足。', 5);
INSERT INTO `dish` VALUES (16, 4, '深烘手冲单品', 28.00, '☕', '埃塞俄比亚豆，风味干净带果酸。', 1);
INSERT INTO `dish` VALUES (17, 4, '生椰拿铁', 22.00, '🥥', '椰香浓郁顺滑，每天续命。', 2);
INSERT INTO `dish` VALUES (18, 4, '桂花乌龙拿铁', 26.00, '🍵', '桂花清香配乌龙尾韵，悠长。', 3);
INSERT INTO `dish` VALUES (19, 4, '气泡美式', 20.00, '🥤', '清爽气泡配醇厚咖啡。', 4);
INSERT INTO `dish` VALUES (20, 4, '脏脏可可', 24.00, '🍫', '可可碎配奶盖，罪恶但满足。', 5);
INSERT INTO `dish` VALUES (21, 5, '麻辣牛油锅', 58.00, '🍲', '牛油锅底，越煮越香。', 1);
INSERT INTO `dish` VALUES (22, 5, '鲜切黄喉', 42.00, '🥩', '脆嫩弹牙，七上八下。', 2);
INSERT INTO `dish` VALUES (23, 5, '手打虾滑', 32.00, '🦐', '现打虾滑，弹到弹牙。', 3);
INSERT INTO `dish` VALUES (24, 5, '现炸酥肉', 28.00, '🍗', '外酥里嫩，直接吃或下锅都香。', 4);
INSERT INTO `dish` VALUES (25, 5, '红糖糍粑', 16.00, '🍡', '现炸糍粑裹黄豆粉，软糯。', 5);
INSERT INTO `dish` VALUES (26, 6, '韩式雪花炸鸡', 36.00, '🍗', '外皮酥到掉渣，裹韩式甜辣酱。', 1);
INSERT INTO `dish` VALUES (27, 6, '安格斯牛肉堡', 28.00, '🍔', '现煎牛肉饼多汁，一口爆汁。', 2);
INSERT INTO `dish` VALUES (28, 6, '黄金薯条', 12.00, '🍟', '现炸金黄，外脆内软。', 3);
INSERT INTO `dish` VALUES (29, 6, '芝士薯泥', 14.00, '🧀', '拉丝芝士，绵密。', 4);
INSERT INTO `dish` VALUES (30, 6, '蜂蜜芥末鸡块', 20.00, '🍗', '蘸酱解腻，一口一个。', 5);
INSERT INTO `dish` VALUES (31, 7, '鲜虾云吞面', 24.00, '🍜', '手工云吞，整只鲜虾弹牙。', 1);
INSERT INTO `dish` VALUES (32, 7, '老北京炸酱面', 20.00, '🍜', '老味道还原，咸香浓郁。', 2);
INSERT INTO `dish` VALUES (33, 7, '鲜虾仁肠粉', 18.00, '🍥', '米皮滑嫩，酱油鲜甜。', 3);
INSERT INTO `dish` VALUES (34, 7, '艇仔粥', 16.00, '🥣', '料足绵滑，暖到心里。', 4);
INSERT INTO `dish` VALUES (35, 7, '萝卜牛杂', 22.00, '🍲', '慢炖入味，软烂鲜香。', 5);
INSERT INTO `dish` VALUES (36, 8, '草莓啵啵鲜奶茶', 22.00, '🧋', '当季鲜草莓现打，料足。', 1);
INSERT INTO `dish` VALUES (37, 8, '多肉葡萄', 24.00, '🍇', '整颗去皮葡萄，清爽不涩。', 2);
INSERT INTO `dish` VALUES (38, 8, '茉莉奶绿', 18.00, '🍵', '茉莉清香配奶绿。', 3);
INSERT INTO `dish` VALUES (39, 8, '杨枝甘露', 26.00, '🥭', '芒果西柚椰浆，港式地道。', 4);
INSERT INTO `dish` VALUES (40, 8, '柠檬冷萃', 20.00, '🍋', '冷萃茶配鲜柠檬，夏天续命水。', 5);

-- ----------------------------
-- Table structure for restaurant
-- ----------------------------
DROP TABLE IF EXISTS `restaurant`;
CREATE TABLE `restaurant`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '店铺名称',
  `emoji` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '图标',
  `rating` decimal(2, 1) NULL DEFAULT 0.0 COMMENT '评分',
  `distance` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '距离文案',
  `cat` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '叶子分类名称',
  `category_id` bigint NULL DEFAULT 0 COMMENT '所属分类id（分级搜索用）',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '简介（前端字段 desc）',
  `tags` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '标签，逗号分隔',
  `sort` int NULL DEFAULT 0 COMMENT '排序权重',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_cat`(`cat` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '店铺表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of restaurant
-- ----------------------------
INSERT INTO `restaurant` VALUES (1, '巷子口牛肉面', '🍜', 4.8, '320m', '面食', 2, '老字号手作牛肉面，一勺辣油封神。', '汤头浓郁,现拉面', 1, '2026-10-14 09:02:43', '2026-10-14 09:02:43');
INSERT INTO `restaurant` VALUES (2, '麦奇轻食沙拉', '🥗', 4.6, '680m', '轻食', 6, '当季蔬果现拌，健身人士首选。', '低卡,新鲜', 2, '2026-10-14 09:02:43', '2026-10-14 09:02:43');
INSERT INTO `restaurant` VALUES (3, '糖潮甜品铺', '🍰', 4.9, '1.1km', '甜点', 4, '舒芙蕾现烤，入口即化。', '手作,不甜腻', 3, '2026-10-14 09:02:43', '2026-10-14 09:02:43');
INSERT INTO `restaurant` VALUES (4, '拾光咖啡', '☕', 4.7, '450m', '饮品', 5, '深烘豆子配落地窗，午后发呆好去处。', '手冲,安静', 4, '2026-10-14 09:02:43', '2026-10-14 09:02:43');
INSERT INTO `restaurant` VALUES (5, '老成都火锅', '🍲', 4.8, '2.3km', '火锅', 7, '地道牛油锅底，毛肚七上八下。', '麻辣,牛油锅', 5, '2026-10-14 09:02:43', '2026-10-14 09:02:43');
INSERT INTO `restaurant` VALUES (6, '脆脆炸鸡铺', '🍔', 4.5, '900m', '快餐', 3, '韩式炸鸡配啤酒，追剧标配。', '外脆里嫩,出餐快', 6, '2026-10-14 09:02:43', '2026-10-14 09:02:43');
INSERT INTO `restaurant` VALUES (7, '阿婆云吞面', '🍜', 4.7, '1.5km', '面食', 2, '几十年老味道，一碗暖到心里。', '手工云吞,鲜美', 7, '2026-10-14 09:02:43', '2026-10-14 09:02:43');
INSERT INTO `restaurant` VALUES (8, '莓日茶研', '🧋', 4.6, '700m', '饮品', 5, '当季鲜果现打，清爽不齁。', '鲜果,少糖', 8, '2026-10-14 09:02:43', '2026-10-14 09:02:43');

-- ----------------------------
-- Table structure for review
-- ----------------------------
DROP TABLE IF EXISTS `review`;
CREATE TABLE `review`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `restaurant_id` bigint NOT NULL COMMENT '所属店铺',
  `user_name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '评论人',
  `rating` tinyint NOT NULL DEFAULT 5 COMMENT '评分1-5',
  `content` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '评论内容',
  `date_label` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '时间文案',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_rest`(`restaurant_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 41 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '评价表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of review
-- ----------------------------
INSERT INTO `review` VALUES (1, 1, '爱吃的小鹿', 5, '招牌牛肉面汤头绝了，手工面筋道，辣油香而不燥，会回购！', '刚刚', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (2, 1, '深夜食堂老板', 4, '红油抄手皮薄馅大，就是上菜稍慢，胜在新鲜。', '3天前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (3, 1, '减肥失败者阿强', 5, '酸辣肥肠面分量足又实惠，肥肠处理得干净，强烈推荐。', '1周前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (4, 1, '吃货老张', 3, '卤香豆干中规中矩，可能我没点招牌面才是正解。', '2周前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (5, 1, '甜筒少女', 5, '冰镇酸梅汤解辣一绝，店员还送了小菜，态度超好～', '昨天', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (6, 2, '随便点点', 4, '鸡胸蔬菜沙拉酱是油醋汁，吃着没负担，朋友聚餐也合适。', '刚刚', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (7, 2, '干饭不积极', 5, '牛油果鸡蛋三明治给得慷慨，全麦面包夹现切牛油果，满足。', '3天前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (8, 2, '麻辣星人', 5, '藜麦时蔬碗饱腹感强，减脂期也能吃得开心。', '1周前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (9, 2, '元气满满酱', 5, '烤时蔬卷清爽不油腻，配鲜榨羽衣甘蓝汁刚刚好。', '2周前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (10, 2, '一勺辣油', 4, '鲜榨羽衣甘蓝汁微苦回甘，健身人士会喜欢。', '昨天', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (11, 3, '佛系吃客', 5, '现烤舒芙蕾端上来还在抖，入口即化太治愈了。', '刚刚', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (12, 3, '深夜放毒王', 5, '海盐提拉米苏酒香恰到好处，甜而不齁。', '3天前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (13, 3, '碳水教父', 4, '莓果千层奶油不腻，夹着鲜莓酸得清醒。', '1周前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (14, 3, '露营美食家', 4, '焦糖布丁壳脆心滑，甜度拿捏得刚好。', '2周前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (15, 3, '减脂期的小美', 5, '芋泥啵啵杯料足，手捣芋泥配Q弹啵啵，罪恶感清零～', '昨天', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (16, 4, '隔壁王叔叔', 5, '深烘手冲单品风味干净带果酸，配落地窗发呆绝配。', '刚刚', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (17, 4, '奶盖收集者', 5, '生椰拿铁椰味浓又顺滑，每天续命就靠它。', '3天前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (18, 4, '炸鸡品鉴师', 4, '桂花乌龙拿铁尾韵悠长，没想到咖啡还能这么清新。', '1周前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (19, 4, '慢生活阿May', 5, '气泡美式清爽，醇厚咖啡配气泡刚刚好。', '2周前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (20, 4, '重口味小李', 5, '脏脏可可可可碎配奶盖，罪恶但满足，值。', '昨天', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (21, 5, '甜品研究员', 4, '麻辣牛油锅底越煮越香，毛肚黄喉必点。', '刚刚', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (22, 5, '早起一杯咖', 4, '鲜切黄喉脆嫩弹牙，七上八下刚刚好。', '3天前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (23, 5, '火锅涮一切', 5, '手打虾滑现打就是不一样，弹到弹牙。', '1周前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (24, 5, '水逆退散君', 5, '现炸酥肉外酥里嫩，直接吃也香，强推。', '2周前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (25, 5, '光盘行动派', 5, '红糖糍粑软糯裹黄豆粉，甜口收尾太满足了。', '昨天', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (26, 6, '吃面不吐面', 4, '韩式雪花炸鸡外皮酥到掉渣，甜辣酱腌得入味。', '刚刚', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (27, 6, '三杯不过岗', 5, '安格斯牛肉堡肉饼多汁，一口爆汁超满足。', '3天前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (28, 6, '轻食猎人', 5, '黄金薯条现炸金黄外脆内软，停不下来。', '1周前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (29, 6, '云吞星人', 5, '芝士薯泥拉丝绵密，配炸鸡绝了。', '2周前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (30, 6, '布丁控本控', 5, '蜂蜜芥末鸡块蘸酱解腻，一口一个停不下。', '昨天', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (31, 7, '嗦粉专业户', 4, '鲜虾云吞面手工云吞整只鲜虾，弹牙又鲜美。', '刚刚', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (32, 7, '拿铁依赖症', 4, '老北京炸酱面咸香浓郁，老味道还原得好。', '3天前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (33, 7, '草莓味的风', 5, '鲜虾仁肠粉米皮滑嫩，酱油鲜甜。', '1周前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (34, 7, '老饕本饕', 4, '艇仔粥料足绵滑，暖到心里。', '2周前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (35, 7, '一个人的火锅', 4, '萝卜牛杂慢炖软烂，萝卜吸饱汤汁，绝。', '昨天', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (36, 8, '深夜emo食', 4, '草莓啵啵鲜奶茶当季草莓现打，料足好喝。', '刚刚', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (37, 8, '鲜榨水果茶', 4, '多肉葡萄整颗去皮，清爽不涩，夏天最爱。', '3天前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (38, 8, '嘴硬心软哥', 4, '茉莉奶绿茉莉清香，配奶绿很顺。', '1周前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (39, 8, '下午茶预定', 4, '杨枝甘露芒果西柚椰浆，港式地道又解腻。', '2周前', '2026-10-14 09:02:43');
INSERT INTO `review` VALUES (40, 8, '撸猫配炸鸡', 5, '柠檬冷萃清爽，配炸鸡绝配，夏天续命水。', '昨天', '2026-10-14 09:02:43');

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `account` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '登录账号：用户名（3-20 位字母、数字或下划线）',
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'BCrypt 加密后的密码',
  `nickname` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '美食家' COMMENT '昵称',
  `account_type` tinyint NOT NULL DEFAULT 0 COMMENT '账号类型：0=用户名 1=手机 2=邮箱',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态：1=正常 0=禁用',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_account`(`account` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES (1, 'demo', '$2a$10$z3AJZVEowSWv/f0EA5LSkOOe0JMvdjwJZgpO60ObfiAvvvbslm9ey', '演示用户', 0, 1, '2026-10-14 08:27:52', '2026-10-14 08:27:52');
INSERT INTO `user` VALUES (2, 'www', '$2a$10$VpObF41dS0FWyoDMyt3Z..WLM7W/XK7BqD80GbKHBp/DctioHiAoe', '美食家', 0, 1, '2026-10-14 08:29:24', '2026-10-14 08:29:24');

-- ----------------------------
-- Table structure for verify_code
-- ----------------------------
DROP TABLE IF EXISTS `verify_code`;
CREATE TABLE `verify_code`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `account` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '账号',
  `code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '验证码',
  `scene` tinyint NOT NULL DEFAULT 1 COMMENT '场景：1=注册 2=找回密码',
  `expire_at` datetime NOT NULL COMMENT '过期时间',
  `used` tinyint NOT NULL DEFAULT 0 COMMENT '是否已使用：0=否 1=是',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_account_scene`(`account` ASC, `scene` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '验证码表（旧数字验证码方案遗留，现使用图片验证码，不读写本表）' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of verify_code
-- ----------------------------

SET FOREIGN_KEY_CHECKS = 1;
