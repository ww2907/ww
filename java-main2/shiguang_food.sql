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

 Date: 23/10/2026 16:50:56
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
) ENGINE = InnoDB AUTO_INCREMENT = 351 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '菜品表（店内美食）' ROW_FORMAT = Dynamic;

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
INSERT INTO `dish` VALUES (41, 9, '老街口招牌牛肉面', 28.00, '🍜', '牛骨熬汤数小时，手工现拉，一勺辣油封神。', 1);
INSERT INTO `dish` VALUES (42, 9, '老街口番茄鸡蛋面', 22.00, '🍜', '现炒番茄熬出沙，蛋花滑嫩，酸甜开胃。', 2);
INSERT INTO `dish` VALUES (43, 9, '老街口红油拌面', 20.00, '🍜', '芝麻酱配辣油，拌匀每一根面。', 3);
INSERT INTO `dish` VALUES (44, 9, '老街口酸菜肉丝面', 24.00, '🍜', '酸菜爽口，肉丝滑嫩，汤底鲜香。', 4);
INSERT INTO `dish` VALUES (45, 9, '老街口葱油拌面', 18.00, '🍜', '小葱熬油，香气扑鼻，简单却上瘾。', 5);
INSERT INTO `dish` VALUES (46, 10, '小满红烧排骨面', 30.00, '🍜', '排骨炖到脱骨，汤浓肉香。', 1);
INSERT INTO `dish` VALUES (47, 10, '小满三鲜馄饨', 16.00, '🥟', '皮薄馅大，整只鲜虾弹牙。', 2);
INSERT INTO `dish` VALUES (48, 10, '小满炸酱面', 20.00, '🍜', '老北京风味，咸香浓郁。', 3);
INSERT INTO `dish` VALUES (49, 10, '小满担担面', 22.00, '🍜', '麻麻辣辣，芽菜肉臊铺满碗。', 4);
INSERT INTO `dish` VALUES (50, 10, '小满阳春面', 14.00, '🍜', '清汤挂面，猪油葱花，朴素暖心。', 5);
INSERT INTO `dish` VALUES (51, 11, '见一面油泼面', 24.00, '🍜', '滚油一泼，辣香四起。', 1);
INSERT INTO `dish` VALUES (52, 11, '见一面雪菜肉丝面', 21.00, '🍜', '雪菜提鲜，肉丝爽滑。', 2);
INSERT INTO `dish` VALUES (53, 11, '见一面小笼汤包', 18.00, '🥟', '皮薄汁多，轻轻一咬爆汤。', 3);
INSERT INTO `dish` VALUES (54, 11, '见一面招牌牛肉面', 28.00, '🍜', '牛骨熬汤数小时，手工现拉，一勺辣油封神。', 4);
INSERT INTO `dish` VALUES (55, 11, '见一面番茄鸡蛋面', 22.00, '🍜', '现炒番茄熬出沙，蛋花滑嫩，酸甜开胃。', 5);
INSERT INTO `dish` VALUES (56, 12, '煮意红油拌面', 20.00, '🍜', '芝麻酱配辣油，拌匀每一根面。', 1);
INSERT INTO `dish` VALUES (57, 12, '煮意酸菜肉丝面', 24.00, '🍜', '酸菜爽口，肉丝滑嫩，汤底鲜香。', 2);
INSERT INTO `dish` VALUES (58, 12, '煮意葱油拌面', 18.00, '🍜', '小葱熬油，香气扑鼻，简单却上瘾。', 3);
INSERT INTO `dish` VALUES (59, 12, '煮意红烧排骨面', 30.00, '🍜', '排骨炖到脱骨，汤浓肉香。', 4);
INSERT INTO `dish` VALUES (60, 12, '煮意三鲜馄饨', 16.00, '🥟', '皮薄馅大，整只鲜虾弹牙。', 5);
INSERT INTO `dish` VALUES (61, 13, '汤先生炸酱面', 20.00, '🍜', '老北京风味，咸香浓郁。', 1);
INSERT INTO `dish` VALUES (62, 13, '汤先生担担面', 22.00, '🍜', '麻麻辣辣，芽菜肉臊铺满碗。', 2);
INSERT INTO `dish` VALUES (63, 13, '汤先生阳春面', 14.00, '🍜', '清汤挂面，猪油葱花，朴素暖心。', 3);
INSERT INTO `dish` VALUES (64, 13, '汤先生油泼面', 24.00, '🍜', '滚油一泼，辣香四起。', 4);
INSERT INTO `dish` VALUES (65, 13, '汤先生雪菜肉丝面', 21.00, '🍜', '雪菜提鲜，肉丝爽滑。', 5);
INSERT INTO `dish` VALUES (66, 14, '暖食小笼汤包', 18.00, '🥟', '皮薄汁多，轻轻一咬爆汤。', 1);
INSERT INTO `dish` VALUES (67, 14, '暖食招牌牛肉面', 28.00, '🍜', '牛骨熬汤数小时，手工现拉，一勺辣油封神。', 2);
INSERT INTO `dish` VALUES (68, 14, '暖食番茄鸡蛋面', 22.00, '🍜', '现炒番茄熬出沙，蛋花滑嫩，酸甜开胃。', 3);
INSERT INTO `dish` VALUES (69, 14, '暖食红油拌面', 20.00, '🍜', '芝麻酱配辣油，拌匀每一根面。', 4);
INSERT INTO `dish` VALUES (70, 14, '暖食酸菜肉丝面', 24.00, '🍜', '酸菜爽口，肉丝滑嫩，汤底鲜香。', 5);
INSERT INTO `dish` VALUES (71, 15, '晨光葱油拌面', 18.00, '🍜', '小葱熬油，香气扑鼻，简单却上瘾。', 1);
INSERT INTO `dish` VALUES (72, 15, '晨光红烧排骨面', 30.00, '🍜', '排骨炖到脱骨，汤浓肉香。', 2);
INSERT INTO `dish` VALUES (73, 15, '晨光三鲜馄饨', 16.00, '🥟', '皮薄馅大，整只鲜虾弹牙。', 3);
INSERT INTO `dish` VALUES (74, 15, '晨光炸酱面', 20.00, '🍜', '老北京风味，咸香浓郁。', 4);
INSERT INTO `dish` VALUES (75, 15, '晨光担担面', 22.00, '🍜', '麻麻辣辣，芽菜肉臊铺满碗。', 5);
INSERT INTO `dish` VALUES (76, 16, '巷尾阳春面', 14.00, '🍜', '清汤挂面，猪油葱花，朴素暖心。', 1);
INSERT INTO `dish` VALUES (77, 16, '巷尾油泼面', 24.00, '🍜', '滚油一泼，辣香四起。', 2);
INSERT INTO `dish` VALUES (78, 16, '巷尾雪菜肉丝面', 21.00, '🍜', '雪菜提鲜，肉丝爽滑。', 3);
INSERT INTO `dish` VALUES (79, 16, '巷尾小笼汤包', 18.00, '🥟', '皮薄汁多，轻轻一咬爆汤。', 4);
INSERT INTO `dish` VALUES (80, 16, '巷尾招牌牛肉面', 28.00, '🍜', '牛骨熬汤数小时，手工现拉，一勺辣油封神。', 5);
INSERT INTO `dish` VALUES (81, 17, '面香居番茄鸡蛋面', 22.00, '🍜', '现炒番茄熬出沙，蛋花滑嫩，酸甜开胃。', 1);
INSERT INTO `dish` VALUES (82, 17, '面香居红油拌面', 20.00, '🍜', '芝麻酱配辣油，拌匀每一根面。', 2);
INSERT INTO `dish` VALUES (83, 17, '面香居酸菜肉丝面', 24.00, '🍜', '酸菜爽口，肉丝滑嫩，汤底鲜香。', 3);
INSERT INTO `dish` VALUES (84, 17, '面香居葱油拌面', 18.00, '🍜', '小葱熬油，香气扑鼻，简单却上瘾。', 4);
INSERT INTO `dish` VALUES (85, 17, '面香居红烧排骨面', 30.00, '🍜', '排骨炖到脱骨，汤浓肉香。', 5);
INSERT INTO `dish` VALUES (86, 18, '北方味三鲜馄饨', 16.00, '🥟', '皮薄馅大，整只鲜虾弹牙。', 1);
INSERT INTO `dish` VALUES (87, 18, '北方味炸酱面', 20.00, '🍜', '老北京风味，咸香浓郁。', 2);
INSERT INTO `dish` VALUES (88, 18, '北方味担担面', 22.00, '🍜', '麻麻辣辣，芽菜肉臊铺满碗。', 3);
INSERT INTO `dish` VALUES (89, 18, '北方味阳春面', 14.00, '🍜', '清汤挂面，猪油葱花，朴素暖心。', 4);
INSERT INTO `dish` VALUES (90, 18, '北方味油泼面', 24.00, '🍜', '滚油一泼，辣香四起。', 5);
INSERT INTO `dish` VALUES (91, 19, '饱饱韩式雪花炸鸡', 36.00, '🍗', '外皮酥到掉渣，裹韩式甜辣酱。', 1);
INSERT INTO `dish` VALUES (92, 19, '饱饱安格斯牛肉堡', 28.00, '🍔', '现煎牛肉饼多汁，一口爆汁。', 2);
INSERT INTO `dish` VALUES (93, 19, '饱饱黄金薯条', 12.00, '🍟', '现炸金黄，外脆内软。', 3);
INSERT INTO `dish` VALUES (94, 19, '饱饱芝士薯泥', 14.00, '🧀', '拉丝芝士，绵密。', 4);
INSERT INTO `dish` VALUES (95, 19, '饱饱蜂蜜芥末鸡块', 20.00, '🍗', '蘸酱解腻，一口一个。', 5);
INSERT INTO `dish` VALUES (96, 20, '大口夏威夷披萨', 32.00, '🍕', '菠萝配培根，咸甜交织。', 1);
INSERT INTO `dish` VALUES (97, 20, '大口鸡肉卷', 26.00, '🥙', '现烤饼皮裹嫩鸡，清爽不腻。', 2);
INSERT INTO `dish` VALUES (98, 20, '大口香辣鸡翅', 18.00, '🍗', '外皮焦香，咬开汁水四溢。', 3);
INSERT INTO `dish` VALUES (99, 20, '大口照烧鸡腿饭', 22.00, '🍚', '鸡腿煎香淋照烧，配米饭绝了。', 4);
INSERT INTO `dish` VALUES (100, 20, '大口冰镇可乐', 16.00, '🥤', '气足冰爽，炸鸡最佳拍档。', 5);
INSERT INTO `dish` VALUES (101, 21, '急急双层芝士堡', 24.00, '🍔', '两片牛肉饼夹芝士，罪恶满足。', 1);
INSERT INTO `dish` VALUES (102, 21, '急急墨西哥塔可', 15.00, '🌮', '脆壳裹牛肉丁，酸辣开胃。', 2);
INSERT INTO `dish` VALUES (103, 21, '急急盐酥鸡', 19.00, '🍗', '九层塔加持，越嚼越香。', 3);
INSERT INTO `dish` VALUES (104, 21, '急急韩式雪花炸鸡', 36.00, '🍗', '外皮酥到掉渣，裹韩式甜辣酱。', 4);
INSERT INTO `dish` VALUES (105, 21, '急急安格斯牛肉堡', 28.00, '🍔', '现煎牛肉饼多汁，一口爆汁。', 5);
INSERT INTO `dish` VALUES (106, 22, '饱嗝黄金薯条', 12.00, '🍟', '现炸金黄，外脆内软。', 1);
INSERT INTO `dish` VALUES (107, 22, '饱嗝芝士薯泥', 14.00, '🧀', '拉丝芝士，绵密。', 2);
INSERT INTO `dish` VALUES (108, 22, '饱嗝蜂蜜芥末鸡块', 20.00, '🍗', '蘸酱解腻，一口一个。', 3);
INSERT INTO `dish` VALUES (109, 22, '饱嗝夏威夷披萨', 32.00, '🍕', '菠萝配培根，咸甜交织。', 4);
INSERT INTO `dish` VALUES (110, 22, '饱嗝鸡肉卷', 26.00, '🥙', '现烤饼皮裹嫩鸡，清爽不腻。', 5);
INSERT INTO `dish` VALUES (111, 23, '快乐香辣鸡翅', 18.00, '🍗', '外皮焦香，咬开汁水四溢。', 1);
INSERT INTO `dish` VALUES (112, 23, '快乐照烧鸡腿饭', 22.00, '🍚', '鸡腿煎香淋照烧，配米饭绝了。', 2);
INSERT INTO `dish` VALUES (113, 23, '快乐冰镇可乐', 16.00, '🥤', '气足冰爽，炸鸡最佳拍档。', 3);
INSERT INTO `dish` VALUES (114, 23, '快乐双层芝士堡', 24.00, '🍔', '两片牛肉饼夹芝士，罪恶满足。', 4);
INSERT INTO `dish` VALUES (115, 23, '快乐墨西哥塔可', 15.00, '🌮', '脆壳裹牛肉丁，酸辣开胃。', 5);
INSERT INTO `dish` VALUES (116, 24, '薯叔盐酥鸡', 19.00, '🍗', '九层塔加持，越嚼越香。', 1);
INSERT INTO `dish` VALUES (117, 24, '薯叔韩式雪花炸鸡', 36.00, '🍗', '外皮酥到掉渣，裹韩式甜辣酱。', 2);
INSERT INTO `dish` VALUES (118, 24, '薯叔安格斯牛肉堡', 28.00, '🍔', '现煎牛肉饼多汁，一口爆汁。', 3);
INSERT INTO `dish` VALUES (119, 24, '薯叔黄金薯条', 12.00, '🍟', '现炸金黄，外脆内软。', 4);
INSERT INTO `dish` VALUES (120, 24, '薯叔芝士薯泥', 14.00, '🧀', '拉丝芝士，绵密。', 5);
INSERT INTO `dish` VALUES (121, 25, '炸物蜂蜜芥末鸡块', 20.00, '🍗', '蘸酱解腻，一口一个。', 1);
INSERT INTO `dish` VALUES (122, 25, '炸物夏威夷披萨', 32.00, '🍕', '菠萝配培根，咸甜交织。', 2);
INSERT INTO `dish` VALUES (123, 25, '炸物鸡肉卷', 26.00, '🥙', '现烤饼皮裹嫩鸡，清爽不腻。', 3);
INSERT INTO `dish` VALUES (124, 25, '炸物香辣鸡翅', 18.00, '🍗', '外皮焦香，咬开汁水四溢。', 4);
INSERT INTO `dish` VALUES (125, 25, '炸物照烧鸡腿饭', 22.00, '🍚', '鸡腿煎香淋照烧，配米饭绝了。', 5);
INSERT INTO `dish` VALUES (126, 26, '饱了冰镇可乐', 16.00, '🥤', '气足冰爽，炸鸡最佳拍档。', 1);
INSERT INTO `dish` VALUES (127, 26, '饱了双层芝士堡', 24.00, '🍔', '两片牛肉饼夹芝士，罪恶满足。', 2);
INSERT INTO `dish` VALUES (128, 26, '饱了墨西哥塔可', 15.00, '🌮', '脆壳裹牛肉丁，酸辣开胃。', 3);
INSERT INTO `dish` VALUES (129, 26, '饱了盐酥鸡', 19.00, '🍗', '九层塔加持，越嚼越香。', 4);
INSERT INTO `dish` VALUES (130, 26, '饱了韩式雪花炸鸡', 36.00, '🍗', '外皮酥到掉渣，裹韩式甜辣酱。', 5);
INSERT INTO `dish` VALUES (131, 27, '嗨吃安格斯牛肉堡', 28.00, '🍔', '现煎牛肉饼多汁，一口爆汁。', 1);
INSERT INTO `dish` VALUES (132, 27, '嗨吃黄金薯条', 12.00, '🍟', '现炸金黄，外脆内软。', 2);
INSERT INTO `dish` VALUES (133, 27, '嗨吃芝士薯泥', 14.00, '🧀', '拉丝芝士，绵密。', 3);
INSERT INTO `dish` VALUES (134, 27, '嗨吃蜂蜜芥末鸡块', 20.00, '🍗', '蘸酱解腻，一口一个。', 4);
INSERT INTO `dish` VALUES (135, 27, '嗨吃夏威夷披萨', 32.00, '🍕', '菠萝配培根，咸甜交织。', 5);
INSERT INTO `dish` VALUES (136, 28, '速达鸡肉卷', 26.00, '🥙', '现烤饼皮裹嫩鸡，清爽不腻。', 1);
INSERT INTO `dish` VALUES (137, 28, '速达香辣鸡翅', 18.00, '🍗', '外皮焦香，咬开汁水四溢。', 2);
INSERT INTO `dish` VALUES (138, 28, '速达照烧鸡腿饭', 22.00, '🍚', '鸡腿煎香淋照烧，配米饭绝了。', 3);
INSERT INTO `dish` VALUES (139, 28, '速达冰镇可乐', 16.00, '🥤', '气足冰爽，炸鸡最佳拍档。', 4);
INSERT INTO `dish` VALUES (140, 28, '速达双层芝士堡', 24.00, '🍔', '两片牛肉饼夹芝士，罪恶满足。', 5);
INSERT INTO `dish` VALUES (141, 29, '汉堡侠墨西哥塔可', 15.00, '🌮', '脆壳裹牛肉丁，酸辣开胃。', 1);
INSERT INTO `dish` VALUES (142, 29, '汉堡侠盐酥鸡', 19.00, '🍗', '九层塔加持，越嚼越香。', 2);
INSERT INTO `dish` VALUES (143, 29, '汉堡侠韩式雪花炸鸡', 36.00, '🍗', '外皮酥到掉渣，裹韩式甜辣酱。', 3);
INSERT INTO `dish` VALUES (144, 29, '汉堡侠安格斯牛肉堡', 28.00, '🍔', '现煎牛肉饼多汁，一口爆汁。', 4);
INSERT INTO `dish` VALUES (145, 29, '汉堡侠黄金薯条', 12.00, '🍟', '现炸金黄，外脆内软。', 5);
INSERT INTO `dish` VALUES (146, 30, '甜心现烤舒芙蕾', 32.00, '🍮', '出炉即食，端上来还在抖，入口即化。', 1);
INSERT INTO `dish` VALUES (147, 30, '甜心海盐提拉米苏', 28.00, '🍰', '马斯卡彭配海盐，酒香恰到好处不齁。', 2);
INSERT INTO `dish` VALUES (148, 30, '甜心莓果千层', 30.00, '🍓', '层层奶油夹鲜莓，酸得清醒。', 3);
INSERT INTO `dish` VALUES (149, 30, '甜心焦糖布丁', 20.00, '🍮', '丝滑布丁淋焦糖脆壳。', 4);
INSERT INTO `dish` VALUES (150, 30, '甜心芋泥啵啵杯', 24.00, '🧋', '手捣芋泥配 Q 弹啵啵，料足。', 5);
INSERT INTO `dish` VALUES (151, 31, '奶油香草纸杯蛋糕', 26.00, '🧁', '绵软蛋糕配香草奶油，童年的味道。', 1);
INSERT INTO `dish` VALUES (152, 31, '奶油爆浆甜甜圈', 22.00, '🍩', '咬开流心，甜度刚刚好。', 2);
INSERT INTO `dish` VALUES (153, 31, '奶油黄油曲奇', 18.00, '🍪', '现烤酥香，奶味十足。', 3);
INSERT INTO `dish` VALUES (154, 31, '奶油巧克力熔岩', 28.00, '🍫', '切开爆浆，热吃最佳。', 4);
INSERT INTO `dish` VALUES (155, 31, '奶油苹果派', 20.00, '🥧', '肉桂苹果馅，外皮酥脆。', 5);
INSERT INTO `dish` VALUES (156, 32, '莓好大福团子', 16.00, '🍡', '软糯麻薯裹豆沙，一口一个。', 1);
INSERT INTO `dish` VALUES (157, 32, '莓好现烤舒芙蕾', 32.00, '🍮', '出炉即食，端上来还在抖，入口即化。', 2);
INSERT INTO `dish` VALUES (158, 32, '莓好海盐提拉米苏', 28.00, '🍰', '马斯卡彭配海盐，酒香恰到好处不齁。', 3);
INSERT INTO `dish` VALUES (159, 32, '莓好莓果千层', 30.00, '🍓', '层层奶油夹鲜莓，酸得清醒。', 4);
INSERT INTO `dish` VALUES (160, 32, '莓好焦糖布丁', 20.00, '🍮', '丝滑布丁淋焦糖脆壳。', 5);
INSERT INTO `dish` VALUES (161, 33, '半糖芋泥啵啵杯', 24.00, '🧋', '手捣芋泥配 Q 弹啵啵，料足。', 1);
INSERT INTO `dish` VALUES (162, 33, '半糖香草纸杯蛋糕', 26.00, '🧁', '绵软蛋糕配香草奶油，童年的味道。', 2);
INSERT INTO `dish` VALUES (163, 33, '半糖爆浆甜甜圈', 22.00, '🍩', '咬开流心，甜度刚刚好。', 3);
INSERT INTO `dish` VALUES (164, 33, '半糖黄油曲奇', 18.00, '🍪', '现烤酥香，奶味十足。', 4);
INSERT INTO `dish` VALUES (165, 33, '半糖巧克力熔岩', 28.00, '🍫', '切开爆浆，热吃最佳。', 5);
INSERT INTO `dish` VALUES (166, 34, '糯糯苹果派', 20.00, '🥧', '肉桂苹果馅，外皮酥脆。', 1);
INSERT INTO `dish` VALUES (167, 34, '糯糯大福团子', 16.00, '🍡', '软糯麻薯裹豆沙，一口一个。', 2);
INSERT INTO `dish` VALUES (168, 34, '糯糯现烤舒芙蕾', 32.00, '🍮', '出炉即食，端上来还在抖，入口即化。', 3);
INSERT INTO `dish` VALUES (169, 34, '糯糯海盐提拉米苏', 28.00, '🍰', '马斯卡彭配海盐，酒香恰到好处不齁。', 4);
INSERT INTO `dish` VALUES (170, 34, '糯糯莓果千层', 30.00, '🍓', '层层奶油夹鲜莓，酸得清醒。', 5);
INSERT INTO `dish` VALUES (171, 35, '焙焙焦糖布丁', 20.00, '🍮', '丝滑布丁淋焦糖脆壳。', 1);
INSERT INTO `dish` VALUES (172, 35, '焙焙芋泥啵啵杯', 24.00, '🧋', '手捣芋泥配 Q 弹啵啵，料足。', 2);
INSERT INTO `dish` VALUES (173, 35, '焙焙香草纸杯蛋糕', 26.00, '🧁', '绵软蛋糕配香草奶油，童年的味道。', 3);
INSERT INTO `dish` VALUES (174, 35, '焙焙爆浆甜甜圈', 22.00, '🍩', '咬开流心，甜度刚刚好。', 4);
INSERT INTO `dish` VALUES (175, 35, '焙焙黄油曲奇', 18.00, '🍪', '现烤酥香，奶味十足。', 5);
INSERT INTO `dish` VALUES (176, 36, '小甜巧克力熔岩', 28.00, '🍫', '切开爆浆，热吃最佳。', 1);
INSERT INTO `dish` VALUES (177, 36, '小甜苹果派', 20.00, '🥧', '肉桂苹果馅，外皮酥脆。', 2);
INSERT INTO `dish` VALUES (178, 36, '小甜大福团子', 16.00, '🍡', '软糯麻薯裹豆沙，一口一个。', 3);
INSERT INTO `dish` VALUES (179, 36, '小甜现烤舒芙蕾', 32.00, '🍮', '出炉即食，端上来还在抖，入口即化。', 4);
INSERT INTO `dish` VALUES (180, 36, '小甜海盐提拉米苏', 28.00, '🍰', '马斯卡彭配海盐，酒香恰到好处不齁。', 5);
INSERT INTO `dish` VALUES (181, 37, '糖罐莓果千层', 30.00, '🍓', '层层奶油夹鲜莓，酸得清醒。', 1);
INSERT INTO `dish` VALUES (182, 37, '糖罐焦糖布丁', 20.00, '🍮', '丝滑布丁淋焦糖脆壳。', 2);
INSERT INTO `dish` VALUES (183, 37, '糖罐芋泥啵啵杯', 24.00, '🧋', '手捣芋泥配 Q 弹啵啵，料足。', 3);
INSERT INTO `dish` VALUES (184, 37, '糖罐香草纸杯蛋糕', 26.00, '🧁', '绵软蛋糕配香草奶油，童年的味道。', 4);
INSERT INTO `dish` VALUES (185, 37, '糖罐爆浆甜甜圈', 22.00, '🍩', '咬开流心，甜度刚刚好。', 5);
INSERT INTO `dish` VALUES (186, 38, '芋见黄油曲奇', 18.00, '🍪', '现烤酥香，奶味十足。', 1);
INSERT INTO `dish` VALUES (187, 38, '芋见巧克力熔岩', 28.00, '🍫', '切开爆浆，热吃最佳。', 2);
INSERT INTO `dish` VALUES (188, 38, '芋见苹果派', 20.00, '🥧', '肉桂苹果馅，外皮酥脆。', 3);
INSERT INTO `dish` VALUES (189, 38, '芋见大福团子', 16.00, '🍡', '软糯麻薯裹豆沙，一口一个。', 4);
INSERT INTO `dish` VALUES (190, 38, '芋见现烤舒芙蕾', 32.00, '🍮', '出炉即食，端上来还在抖，入口即化。', 5);
INSERT INTO `dish` VALUES (191, 39, '暖糖海盐提拉米苏', 28.00, '🍰', '马斯卡彭配海盐，酒香恰到好处不齁。', 1);
INSERT INTO `dish` VALUES (192, 39, '暖糖莓果千层', 30.00, '🍓', '层层奶油夹鲜莓，酸得清醒。', 2);
INSERT INTO `dish` VALUES (193, 39, '暖糖焦糖布丁', 20.00, '🍮', '丝滑布丁淋焦糖脆壳。', 3);
INSERT INTO `dish` VALUES (194, 39, '暖糖芋泥啵啵杯', 24.00, '🧋', '手捣芋泥配 Q 弹啵啵，料足。', 4);
INSERT INTO `dish` VALUES (195, 39, '暖糖香草纸杯蛋糕', 26.00, '🧁', '绵软蛋糕配香草奶油，童年的味道。', 5);
INSERT INTO `dish` VALUES (196, 40, '半杯珍珠奶茶', 22.00, '🧋', 'Q 弹珍珠配醇香奶茶，经典不败。', 1);
INSERT INTO `dish` VALUES (197, 40, '半杯生椰拿铁', 22.00, '🥥', '椰香浓郁顺滑，每天续命。', 2);
INSERT INTO `dish` VALUES (198, 40, '半杯气泡美式', 20.00, '🥤', '清爽气泡配醇厚咖啡。', 3);
INSERT INTO `dish` VALUES (199, 40, '半杯茉莉奶绿', 18.00, '🍵', '茉莉清香配奶绿。', 4);
INSERT INTO `dish` VALUES (200, 40, '半杯杨枝甘露', 26.00, '🥭', '芒果西柚椰浆，港式地道。', 5);
INSERT INTO `dish` VALUES (201, 41, '柠夏多肉葡萄', 24.00, '🍇', '整颗去皮葡萄，清爽不涩。', 1);
INSERT INTO `dish` VALUES (202, 41, '柠夏柠檬冷萃', 20.00, '🍋', '冷萃茶配鲜柠檬，夏天续命水。', 2);
INSERT INTO `dish` VALUES (203, 41, '柠夏鲜榨橙汁', 16.00, '🥤', '整颗鲜橙现榨，维 C 满满。', 3);
INSERT INTO `dish` VALUES (204, 41, '柠夏桂花乌龙', 24.00, '🍵', '桂花清香配乌龙尾韵，悠长。', 4);
INSERT INTO `dish` VALUES (205, 41, '柠夏椰子水', 18.00, '🥥', '天然清甜，解渴神器。', 5);
INSERT INTO `dish` VALUES (206, 42, '椰岛黑糖波波', 22.00, '🧋', '黑糖挂壁，奶香浓郁。', 1);
INSERT INTO `dish` VALUES (207, 42, '椰岛白桃乌龙', 20.00, '🍑', '白桃清甜配乌龙，温柔好喝。', 2);
INSERT INTO `dish` VALUES (208, 42, '椰岛珍珠奶茶', 22.00, '🧋', 'Q 弹珍珠配醇香奶茶，经典不败。', 3);
INSERT INTO `dish` VALUES (209, 42, '椰岛生椰拿铁', 22.00, '🥥', '椰香浓郁顺滑，每天续命。', 4);
INSERT INTO `dish` VALUES (210, 42, '椰岛气泡美式', 20.00, '🥤', '清爽气泡配醇厚咖啡。', 5);
INSERT INTO `dish` VALUES (211, 43, '煮茶茉莉奶绿', 18.00, '🍵', '茉莉清香配奶绿。', 1);
INSERT INTO `dish` VALUES (212, 43, '煮茶杨枝甘露', 26.00, '🥭', '芒果西柚椰浆，港式地道。', 2);
INSERT INTO `dish` VALUES (213, 43, '煮茶多肉葡萄', 24.00, '🍇', '整颗去皮葡萄，清爽不涩。', 3);
INSERT INTO `dish` VALUES (214, 43, '煮茶柠檬冷萃', 20.00, '🍋', '冷萃茶配鲜柠檬，夏天续命水。', 4);
INSERT INTO `dish` VALUES (215, 43, '煮茶鲜榨橙汁', 16.00, '🥤', '整颗鲜橙现榨，维 C 满满。', 5);
INSERT INTO `dish` VALUES (216, 44, '鲜果桂花乌龙', 24.00, '🍵', '桂花清香配乌龙尾韵，悠长。', 1);
INSERT INTO `dish` VALUES (217, 44, '鲜果椰子水', 18.00, '🥥', '天然清甜，解渴神器。', 2);
INSERT INTO `dish` VALUES (218, 44, '鲜果黑糖波波', 22.00, '🧋', '黑糖挂壁，奶香浓郁。', 3);
INSERT INTO `dish` VALUES (219, 44, '鲜果白桃乌龙', 20.00, '🍑', '白桃清甜配乌龙，温柔好喝。', 4);
INSERT INTO `dish` VALUES (220, 44, '鲜果珍珠奶茶', 22.00, '🧋', 'Q 弹珍珠配醇香奶茶，经典不败。', 5);
INSERT INTO `dish` VALUES (221, 45, '慢茶生椰拿铁', 22.00, '🥥', '椰香浓郁顺滑，每天续命。', 1);
INSERT INTO `dish` VALUES (222, 45, '慢茶气泡美式', 20.00, '🥤', '清爽气泡配醇厚咖啡。', 2);
INSERT INTO `dish` VALUES (223, 45, '慢茶茉莉奶绿', 18.00, '🍵', '茉莉清香配奶绿。', 3);
INSERT INTO `dish` VALUES (224, 45, '慢茶杨枝甘露', 26.00, '🥭', '芒果西柚椰浆，港式地道。', 4);
INSERT INTO `dish` VALUES (225, 45, '慢茶多肉葡萄', 24.00, '🍇', '整颗去皮葡萄，清爽不涩。', 5);
INSERT INTO `dish` VALUES (226, 46, '青柚柠檬冷萃', 20.00, '🍋', '冷萃茶配鲜柠檬，夏天续命水。', 1);
INSERT INTO `dish` VALUES (227, 46, '青柚鲜榨橙汁', 16.00, '🥤', '整颗鲜橙现榨，维 C 满满。', 2);
INSERT INTO `dish` VALUES (228, 46, '青柚桂花乌龙', 24.00, '🍵', '桂花清香配乌龙尾韵，悠长。', 3);
INSERT INTO `dish` VALUES (229, 46, '青柚椰子水', 18.00, '🥥', '天然清甜，解渴神器。', 4);
INSERT INTO `dish` VALUES (230, 46, '青柚黑糖波波', 22.00, '🧋', '黑糖挂壁，奶香浓郁。', 5);
INSERT INTO `dish` VALUES (231, 47, '茶叔白桃乌龙', 20.00, '🍑', '白桃清甜配乌龙，温柔好喝。', 1);
INSERT INTO `dish` VALUES (232, 47, '茶叔珍珠奶茶', 22.00, '🧋', 'Q 弹珍珠配醇香奶茶，经典不败。', 2);
INSERT INTO `dish` VALUES (233, 47, '茶叔生椰拿铁', 22.00, '🥥', '椰香浓郁顺滑，每天续命。', 3);
INSERT INTO `dish` VALUES (234, 47, '茶叔气泡美式', 20.00, '🥤', '清爽气泡配醇厚咖啡。', 4);
INSERT INTO `dish` VALUES (235, 47, '茶叔茉莉奶绿', 18.00, '🍵', '茉莉清香配奶绿。', 5);
INSERT INTO `dish` VALUES (236, 48, '一杯杨枝甘露', 26.00, '🥭', '芒果西柚椰浆，港式地道。', 1);
INSERT INTO `dish` VALUES (237, 48, '一杯多肉葡萄', 24.00, '🍇', '整颗去皮葡萄，清爽不涩。', 2);
INSERT INTO `dish` VALUES (238, 48, '一杯柠檬冷萃', 20.00, '🍋', '冷萃茶配鲜柠檬，夏天续命水。', 3);
INSERT INTO `dish` VALUES (239, 48, '一杯鲜榨橙汁', 16.00, '🥤', '整颗鲜橙现榨，维 C 满满。', 4);
INSERT INTO `dish` VALUES (240, 48, '一杯桂花乌龙', 24.00, '🍵', '桂花清香配乌龙尾韵，悠长。', 5);
INSERT INTO `dish` VALUES (241, 49, '柚见椰子水', 18.00, '🥥', '天然清甜，解渴神器。', 1);
INSERT INTO `dish` VALUES (242, 49, '柚见黑糖波波', 22.00, '🧋', '黑糖挂壁，奶香浓郁。', 2);
INSERT INTO `dish` VALUES (243, 49, '柚见白桃乌龙', 20.00, '🍑', '白桃清甜配乌龙，温柔好喝。', 3);
INSERT INTO `dish` VALUES (244, 49, '柚见珍珠奶茶', 22.00, '🧋', 'Q 弹珍珠配醇香奶茶，经典不败。', 4);
INSERT INTO `dish` VALUES (245, 49, '柚见生椰拿铁', 22.00, '🥥', '椰香浓郁顺滑，每天续命。', 5);
INSERT INTO `dish` VALUES (246, 50, '甘露气泡美式', 20.00, '🥤', '清爽气泡配醇厚咖啡。', 1);
INSERT INTO `dish` VALUES (247, 50, '甘露茉莉奶绿', 18.00, '🍵', '茉莉清香配奶绿。', 2);
INSERT INTO `dish` VALUES (248, 50, '甘露杨枝甘露', 26.00, '🥭', '芒果西柚椰浆，港式地道。', 3);
INSERT INTO `dish` VALUES (249, 50, '甘露多肉葡萄', 24.00, '🍇', '整颗去皮葡萄，清爽不涩。', 4);
INSERT INTO `dish` VALUES (250, 50, '甘露柠檬冷萃', 20.00, '🍋', '冷萃茶配鲜柠檬，夏天续命水。', 5);
INSERT INTO `dish` VALUES (251, 51, '绿野鸡胸蔬菜沙拉', 26.00, '🥗', '高蛋白低脂，油醋汁现拌。', 1);
INSERT INTO `dish` VALUES (252, 51, '绿野牛油果鸡蛋三明治', 24.00, '🥪', '全麦面包夹现切牛油果，给得慷慨。', 2);
INSERT INTO `dish` VALUES (253, 51, '绿野藜麦时蔬碗', 30.00, '🍚', '藜麦配当季时蔬，饱腹无负担。', 3);
INSERT INTO `dish` VALUES (254, 51, '绿野烤时蔬卷', 22.00, '🥙', '彩椒西葫芦现烤，清爽不油腻。', 4);
INSERT INTO `dish` VALUES (255, 51, '绿野鲜榨羽衣甘蓝汁', 16.00, '🥤', '当季果蔬冷压，微苦回甘。', 5);
INSERT INTO `dish` VALUES (256, 52, '轻氧三文鱼牛油果沙拉', 28.00, '🥗', '深海鱼配牛油果，优质脂肪。', 1);
INSERT INTO `dish` VALUES (257, 52, '轻氧全麦照烧卷', 20.00, '🥪', '照烧鸡配全麦，低负担也满足。', 2);
INSERT INTO `dish` VALUES (258, 52, '轻氧南瓜浓汤', 18.00, '🥣', '现熬南瓜，丝滑暖胃。', 3);
INSERT INTO `dish` VALUES (259, 52, '轻氧鹰嘴豆沙拉', 22.00, '🥗', '饱腹高纤，越嚼越香。', 4);
INSERT INTO `dish` VALUES (260, 52, '轻氧希腊酸奶杯', 14.00, '🥛', '浓稠酸奶配坚果莓果。', 5);
INSERT INTO `dish` VALUES (261, 53, '纤纤能量碗', 24.00, '🍱', '碳水蛋白蔬菜一锅端，均衡。', 1);
INSERT INTO `dish` VALUES (262, 53, '纤纤鸡胸蔬菜沙拉', 26.00, '🥗', '高蛋白低脂，油醋汁现拌。', 2);
INSERT INTO `dish` VALUES (263, 53, '纤纤牛油果鸡蛋三明治', 24.00, '🥪', '全麦面包夹现切牛油果，给得慷慨。', 3);
INSERT INTO `dish` VALUES (264, 53, '纤纤藜麦时蔬碗', 30.00, '🍚', '藜麦配当季时蔬，饱腹无负担。', 4);
INSERT INTO `dish` VALUES (265, 53, '纤纤烤时蔬卷', 22.00, '🥙', '彩椒西葫芦现烤，清爽不油腻。', 5);
INSERT INTO `dish` VALUES (266, 54, '每日鲜榨羽衣甘蓝汁', 16.00, '🥤', '当季果蔬冷压，微苦回甘。', 1);
INSERT INTO `dish` VALUES (267, 54, '每日三文鱼牛油果沙拉', 28.00, '🥗', '深海鱼配牛油果，优质脂肪。', 2);
INSERT INTO `dish` VALUES (268, 54, '每日全麦照烧卷', 20.00, '🥪', '照烧鸡配全麦，低负担也满足。', 3);
INSERT INTO `dish` VALUES (269, 54, '每日南瓜浓汤', 18.00, '🥣', '现熬南瓜，丝滑暖胃。', 4);
INSERT INTO `dish` VALUES (270, 54, '每日鹰嘴豆沙拉', 22.00, '🥗', '饱腹高纤，越嚼越香。', 5);
INSERT INTO `dish` VALUES (271, 55, '鲜野希腊酸奶杯', 14.00, '🥛', '浓稠酸奶配坚果莓果。', 1);
INSERT INTO `dish` VALUES (272, 55, '鲜野能量碗', 24.00, '🍱', '碳水蛋白蔬菜一锅端，均衡。', 2);
INSERT INTO `dish` VALUES (273, 55, '鲜野鸡胸蔬菜沙拉', 26.00, '🥗', '高蛋白低脂，油醋汁现拌。', 3);
INSERT INTO `dish` VALUES (274, 55, '鲜野牛油果鸡蛋三明治', 24.00, '🥪', '全麦面包夹现切牛油果，给得慷慨。', 4);
INSERT INTO `dish` VALUES (275, 55, '鲜野藜麦时蔬碗', 30.00, '🍚', '藜麦配当季时蔬，饱腹无负担。', 5);
INSERT INTO `dish` VALUES (276, 56, '素拾烤时蔬卷', 22.00, '🥙', '彩椒西葫芦现烤，清爽不油腻。', 1);
INSERT INTO `dish` VALUES (277, 56, '素拾鲜榨羽衣甘蓝汁', 16.00, '🥤', '当季果蔬冷压，微苦回甘。', 2);
INSERT INTO `dish` VALUES (278, 56, '素拾三文鱼牛油果沙拉', 28.00, '🥗', '深海鱼配牛油果，优质脂肪。', 3);
INSERT INTO `dish` VALUES (279, 56, '素拾全麦照烧卷', 20.00, '🥪', '照烧鸡配全麦，低负担也满足。', 4);
INSERT INTO `dish` VALUES (280, 56, '素拾南瓜浓汤', 18.00, '🥣', '现熬南瓜，丝滑暖胃。', 5);
INSERT INTO `dish` VALUES (281, 57, '轻拌鹰嘴豆沙拉', 22.00, '🥗', '饱腹高纤，越嚼越香。', 1);
INSERT INTO `dish` VALUES (282, 57, '轻拌希腊酸奶杯', 14.00, '🥛', '浓稠酸奶配坚果莓果。', 2);
INSERT INTO `dish` VALUES (283, 57, '轻拌能量碗', 24.00, '🍱', '碳水蛋白蔬菜一锅端，均衡。', 3);
INSERT INTO `dish` VALUES (284, 57, '轻拌鸡胸蔬菜沙拉', 26.00, '🥗', '高蛋白低脂，油醋汁现拌。', 4);
INSERT INTO `dish` VALUES (285, 57, '轻拌牛油果鸡蛋三明治', 24.00, '🥪', '全麦面包夹现切牛油果，给得慷慨。', 5);
INSERT INTO `dish` VALUES (286, 58, '藜麦藜麦时蔬碗', 30.00, '🍚', '藜麦配当季时蔬，饱腹无负担。', 1);
INSERT INTO `dish` VALUES (287, 58, '藜麦烤时蔬卷', 22.00, '🥙', '彩椒西葫芦现烤，清爽不油腻。', 2);
INSERT INTO `dish` VALUES (288, 58, '藜麦鲜榨羽衣甘蓝汁', 16.00, '🥤', '当季果蔬冷压，微苦回甘。', 3);
INSERT INTO `dish` VALUES (289, 58, '藜麦三文鱼牛油果沙拉', 28.00, '🥗', '深海鱼配牛油果，优质脂肪。', 4);
INSERT INTO `dish` VALUES (290, 58, '藜麦全麦照烧卷', 20.00, '🥪', '照烧鸡配全麦，低负担也满足。', 5);
INSERT INTO `dish` VALUES (291, 59, '元气南瓜浓汤', 18.00, '🥣', '现熬南瓜，丝滑暖胃。', 1);
INSERT INTO `dish` VALUES (292, 59, '元气鹰嘴豆沙拉', 22.00, '🥗', '饱腹高纤，越嚼越香。', 2);
INSERT INTO `dish` VALUES (293, 59, '元气希腊酸奶杯', 14.00, '🥛', '浓稠酸奶配坚果莓果。', 3);
INSERT INTO `dish` VALUES (294, 59, '元气能量碗', 24.00, '🍱', '碳水蛋白蔬菜一锅端，均衡。', 4);
INSERT INTO `dish` VALUES (295, 59, '元气鸡胸蔬菜沙拉', 26.00, '🥗', '高蛋白低脂，油醋汁现拌。', 5);
INSERT INTO `dish` VALUES (296, 60, '青蔬牛油果鸡蛋三明治', 24.00, '🥪', '全麦面包夹现切牛油果，给得慷慨。', 1);
INSERT INTO `dish` VALUES (297, 60, '青蔬藜麦时蔬碗', 30.00, '🍚', '藜麦配当季时蔬，饱腹无负担。', 2);
INSERT INTO `dish` VALUES (298, 60, '青蔬烤时蔬卷', 22.00, '🥙', '彩椒西葫芦现烤，清爽不油腻。', 3);
INSERT INTO `dish` VALUES (299, 60, '青蔬鲜榨羽衣甘蓝汁', 16.00, '🥤', '当季果蔬冷压，微苦回甘。', 4);
INSERT INTO `dish` VALUES (300, 60, '青蔬三文鱼牛油果沙拉', 28.00, '🥗', '深海鱼配牛油果，优质脂肪。', 5);
INSERT INTO `dish` VALUES (301, 61, '巴蜀麻辣牛油锅', 58.00, '🍲', '牛油锅底，越煮越香。', 1);
INSERT INTO `dish` VALUES (302, 61, '巴蜀鲜切黄喉', 42.00, '🥩', '脆嫩弹牙，七上八下。', 2);
INSERT INTO `dish` VALUES (303, 61, '巴蜀手打虾滑', 32.00, '🦐', '现打虾滑，弹到弹牙。', 3);
INSERT INTO `dish` VALUES (304, 61, '巴蜀现炸酥肉', 28.00, '🍗', '外酥里嫩，直接吃或下锅都香。', 4);
INSERT INTO `dish` VALUES (305, 61, '巴蜀红糖糍粑', 16.00, '🍡', '现炸糍粑裹黄豆粉，软糯。', 5);
INSERT INTO `dish` VALUES (306, 62, '椒麻鲜切牛肉', 38.00, '🥩', '当天现切，涮几秒就嫩。', 1);
INSERT INTO `dish` VALUES (307, 62, '椒麻鸭肠', 30.00, '🍲', '脆爽弹牙，涮烫即食。', 2);
INSERT INTO `dish` VALUES (308, 62, '椒麻蔬菜拼盘', 26.00, '🥬', '当季时蔬，解腻清口。', 3);
INSERT INTO `dish` VALUES (309, 62, '椒麻手工豆皮', 22.00, '🍢', '吸饱汤汁，一口爆汁。', 4);
INSERT INTO `dish` VALUES (310, 62, '椒麻鱼丸拼盘', 36.00, '🐟', '手打鱼丸，弹嫩鲜香。', 5);
INSERT INTO `dish` VALUES (311, 63, '渝味宽粉', 20.00, '🍡', '软糯入味，嗦一口满足。', 1);
INSERT INTO `dish` VALUES (312, 63, '渝味麻辣牛油锅', 58.00, '🍲', '牛油锅底，越煮越香。', 2);
INSERT INTO `dish` VALUES (313, 63, '渝味鲜切黄喉', 42.00, '🥩', '脆嫩弹牙，七上八下。', 3);
INSERT INTO `dish` VALUES (314, 63, '渝味手打虾滑', 32.00, '🦐', '现打虾滑，弹到弹牙。', 4);
INSERT INTO `dish` VALUES (315, 63, '渝味现炸酥肉', 28.00, '🍗', '外酥里嫩，直接吃或下锅都香。', 5);
INSERT INTO `dish` VALUES (316, 64, '锅气红糖糍粑', 16.00, '🍡', '现炸糍粑裹黄豆粉，软糯。', 1);
INSERT INTO `dish` VALUES (317, 64, '锅气鲜切牛肉', 38.00, '🥩', '当天现切，涮几秒就嫩。', 2);
INSERT INTO `dish` VALUES (318, 64, '锅气鸭肠', 30.00, '🍲', '脆爽弹牙，涮烫即食。', 3);
INSERT INTO `dish` VALUES (319, 64, '锅气蔬菜拼盘', 26.00, '🥬', '当季时蔬，解腻清口。', 4);
INSERT INTO `dish` VALUES (320, 64, '锅气手工豆皮', 22.00, '🍢', '吸饱汤汁，一口爆汁。', 5);
INSERT INTO `dish` VALUES (321, 65, '辣府鱼丸拼盘', 36.00, '🐟', '手打鱼丸，弹嫩鲜香。', 1);
INSERT INTO `dish` VALUES (322, 65, '辣府宽粉', 20.00, '🍡', '软糯入味，嗦一口满足。', 2);
INSERT INTO `dish` VALUES (323, 65, '辣府麻辣牛油锅', 58.00, '🍲', '牛油锅底，越煮越香。', 3);
INSERT INTO `dish` VALUES (324, 65, '辣府鲜切黄喉', 42.00, '🥩', '脆嫩弹牙，七上八下。', 4);
INSERT INTO `dish` VALUES (325, 65, '辣府手打虾滑', 32.00, '🦐', '现打虾滑，弹到弹牙。', 5);
INSERT INTO `dish` VALUES (326, 66, '红汤现炸酥肉', 28.00, '🍗', '外酥里嫩，直接吃或下锅都香。', 1);
INSERT INTO `dish` VALUES (327, 66, '红汤红糖糍粑', 16.00, '🍡', '现炸糍粑裹黄豆粉，软糯。', 2);
INSERT INTO `dish` VALUES (328, 66, '红汤鲜切牛肉', 38.00, '🥩', '当天现切，涮几秒就嫩。', 3);
INSERT INTO `dish` VALUES (329, 66, '红汤鸭肠', 30.00, '🍲', '脆爽弹牙，涮烫即食。', 4);
INSERT INTO `dish` VALUES (330, 66, '红汤蔬菜拼盘', 26.00, '🥬', '当季时蔬，解腻清口。', 5);
INSERT INTO `dish` VALUES (331, 67, '沸腾手工豆皮', 22.00, '🍢', '吸饱汤汁，一口爆汁。', 1);
INSERT INTO `dish` VALUES (332, 67, '沸腾鱼丸拼盘', 36.00, '🐟', '手打鱼丸，弹嫩鲜香。', 2);
INSERT INTO `dish` VALUES (333, 67, '沸腾宽粉', 20.00, '🍡', '软糯入味，嗦一口满足。', 3);
INSERT INTO `dish` VALUES (334, 67, '沸腾麻辣牛油锅', 58.00, '🍲', '牛油锅底，越煮越香。', 4);
INSERT INTO `dish` VALUES (335, 67, '沸腾鲜切黄喉', 42.00, '🥩', '脆嫩弹牙，七上八下。', 5);
INSERT INTO `dish` VALUES (336, 68, '渝记手打虾滑', 32.00, '🦐', '现打虾滑，弹到弹牙。', 1);
INSERT INTO `dish` VALUES (337, 68, '渝记现炸酥肉', 28.00, '🍗', '外酥里嫩，直接吃或下锅都香。', 2);
INSERT INTO `dish` VALUES (338, 68, '渝记红糖糍粑', 16.00, '🍡', '现炸糍粑裹黄豆粉，软糯。', 3);
INSERT INTO `dish` VALUES (339, 68, '渝记鲜切牛肉', 38.00, '🥩', '当天现切，涮几秒就嫩。', 4);
INSERT INTO `dish` VALUES (340, 68, '渝记鸭肠', 30.00, '🍲', '脆爽弹牙，涮烫即食。', 5);
INSERT INTO `dish` VALUES (341, 69, '椒香蔬菜拼盘', 26.00, '🥬', '当季时蔬，解腻清口。', 1);
INSERT INTO `dish` VALUES (342, 69, '椒香手工豆皮', 22.00, '🍢', '吸饱汤汁，一口爆汁。', 2);
INSERT INTO `dish` VALUES (343, 69, '椒香鱼丸拼盘', 36.00, '🐟', '手打鱼丸，弹嫩鲜香。', 3);
INSERT INTO `dish` VALUES (344, 69, '椒香宽粉', 20.00, '🍡', '软糯入味，嗦一口满足。', 4);
INSERT INTO `dish` VALUES (345, 69, '椒香麻辣牛油锅', 58.00, '🍲', '牛油锅底，越煮越香。', 5);
INSERT INTO `dish` VALUES (346, 70, '蜀大鲜切黄喉', 42.00, '🥩', '脆嫩弹牙，七上八下。', 1);
INSERT INTO `dish` VALUES (347, 70, '蜀大手打虾滑', 32.00, '🦐', '现打虾滑，弹到弹牙。', 2);
INSERT INTO `dish` VALUES (348, 70, '蜀大现炸酥肉', 28.00, '🍗', '外酥里嫩，直接吃或下锅都香。', 3);
INSERT INTO `dish` VALUES (349, 70, '蜀大红糖糍粑', 16.00, '🍡', '现炸糍粑裹黄豆粉，软糯。', 4);
INSERT INTO `dish` VALUES (350, 70, '蜀大鲜切牛肉', 38.00, '🥩', '当天现切，涮几秒就嫩。', 5);

-- ----------------------------
-- Table structure for order_item
-- ----------------------------
DROP TABLE IF EXISTS `order_item`;
CREATE TABLE `order_item`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_id` bigint NOT NULL COMMENT '订单id',
  `dish_id` bigint NULL DEFAULT NULL COMMENT '菜品id（快照，可空）',
  `dish_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '菜品名称（快照）',
  `price` decimal(8, 2) NOT NULL DEFAULT 0.00 COMMENT '单价（快照）',
  `qty` int NOT NULL DEFAULT 1 COMMENT '数量',
  `subtotal` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '小计 = price * qty',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order`(`order_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '订单明细表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of order_item
-- ----------------------------

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_no` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '订单编号（业务可读，唯一）',
  `user_id` bigint NULL DEFAULT NULL COMMENT '下单用户id（游客可为空）',
  `account` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '下单账号（展示用，冗余）',
  `restaurant_id` bigint NOT NULL COMMENT '店铺id',
  `restaurant_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '店铺名称（快照）',
  `total_amount` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '订单总额',
  `item_count` int NOT NULL DEFAULT 0 COMMENT '商品总件数',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '状态0待支付1已支付2已完成3已取消',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_order_no`(`order_no` ASC) USING BTREE,
  INDEX `idx_account`(`account` ASC) USING BTREE,
  INDEX `idx_rest`(`restaurant_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '订单主表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of orders
-- ----------------------------

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
) ENGINE = InnoDB AUTO_INCREMENT = 71 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '店铺表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of restaurant
-- ----------------------------
INSERT INTO `restaurant` VALUES (1, '巷子口牛肉面', '🍜', 4.8, '320m', '面食', 2, '老字号手作牛肉面，一勺辣油封神。', '汤头浓郁,现拉面', 1, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (2, '麦奇轻食沙拉', '🥗', 4.6, '680m', '轻食', 6, '当季蔬果现拌，健身人士首选。', '低卡,新鲜', 2, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (3, '糖潮甜品铺', '🍰', 4.9, '1.1km', '甜点', 4, '舒芙蕾现烤，入口即化。', '手作,不甜腻', 3, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (4, '拾光咖啡', '☕', 4.7, '450m', '饮品', 5, '深烘豆子配落地窗，午后发呆好去处。', '手冲,安静', 4, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (5, '老成都火锅', '🍲', 4.8, '2.3km', '火锅', 7, '地道牛油锅底，毛肚七上八下。', '麻辣,牛油锅', 5, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (6, '脆脆炸鸡铺', '🍔', 4.5, '900m', '快餐', 3, '韩式炸鸡配啤酒，追剧标配。', '外脆里嫩,出餐快', 6, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (7, '阿婆云吞面', '🍜', 4.7, '1.5km', '面食', 2, '几十年老味道，一碗暖到心里。', '手工云吞,鲜美', 7, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (8, '莓日茶研', '🧋', 4.6, '700m', '饮品', 5, '当季鲜果现打，清爽不齁。', '鲜果,少糖', 8, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (9, '老街口面馆', '🍜', 4.8, '1.3km', '面食', 2, '老街口面馆，一碗热汤面，治愈所有疲惫。', '汤头浓郁,暖胃', 9, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (10, '小满面馆', '🍜', 4.7, '320m', '面食', 2, '小满面馆，一碗热汤面，治愈所有疲惫。', '现拉面,实惠', 10, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (11, '见一面面馆', '🍜', 4.6, '450m', '面食', 2, '见一面面馆，一碗热汤面，治愈所有疲惫。', '手工,老味道', 11, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (12, '煮意面馆', '🍜', 4.9, '1.5km', '面食', 2, '煮意面馆，一碗热汤面，治愈所有疲惫。', '暖胃,分量足', 12, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (13, '汤先生面馆', '🍜', 4.5, '1.8km', '面食', 2, '汤先生面馆，一碗热汤面，治愈所有疲惫。', '实惠,出餐快', 13, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (14, '暖食面馆', '🍜', 4.8, '1.2km', '面食', 2, '暖食面馆，一碗热汤面，治愈所有疲惫。', '老味道,筋道', 14, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (15, '晨光面馆', '🍜', 4.7, '3.1km', '面食', 2, '晨光面馆，一碗热汤面，治愈所有疲惫。', '分量足,鲜香', 15, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (16, '巷尾面馆', '🍜', 4.6, '760m', '面食', 2, '巷尾面馆，一碗热汤面，治愈所有疲惫。', '出餐快,汤头浓郁', 16, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (17, '面香居面馆', '🍜', 4.9, '2.9km', '面食', 2, '面香居面馆，一碗热汤面，治愈所有疲惫。', '筋道,现拉面', 17, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (18, '北方味面馆', '🍜', 4.8, '610m', '面食', 2, '北方味面馆，一碗热汤面，治愈所有疲惫。', '鲜香,手工', 18, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (19, '饱饱快餐', '🍔', 4.7, '1.3km', '快餐', 3, '饱饱快餐，快手好味道，赶时间也好好吃饭。', '外脆里嫩,现炸', 19, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (20, '大口快餐', '🍔', 4.6, '320m', '快餐', 3, '大口快餐，快手好味道，赶时间也好好吃饭。', '出餐快,性价比', 20, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (21, '急急快餐', '🍔', 4.9, '450m', '快餐', 3, '急急快餐，快手好味道，赶时间也好好吃饭。', '分量足,追剧', 21, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (22, '饱嗝快餐', '🍔', 4.7, '1.5km', '快餐', 3, '饱嗝快餐，快手好味道，赶时间也好好吃饭。', '现炸,管饱', 22, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (23, '快乐快餐', '🍔', 4.8, '1.8km', '快餐', 3, '快乐快餐，快手好味道，赶时间也好好吃饭。', '性价比,香辣', 23, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (24, '薯叔快餐', '🍔', 4.5, '1.2km', '快餐', 3, '薯叔快餐，快手好味道，赶时间也好好吃饭。', '追剧,多汁', 24, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (25, '炸物快餐', '🍔', 4.9, '3.1km', '快餐', 3, '炸物快餐，快手好味道，赶时间也好好吃饭。', '管饱,热乎', 25, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (26, '饱了快餐', '🍔', 4.6, '760m', '快餐', 3, '饱了快餐，快手好味道，赶时间也好好吃饭。', '香辣,外脆里嫩', 26, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (27, '嗨吃快餐', '🍔', 4.7, '2.9km', '快餐', 3, '嗨吃快餐，快手好味道，赶时间也好好吃饭。', '多汁,出餐快', 27, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (28, '速达快餐', '🍔', 4.8, '610m', '快餐', 3, '速达快餐，快手好味道，赶时间也好好吃饭。', '热乎,分量足', 28, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (29, '汉堡侠快餐', '🍔', 4.6, '1.3km', '快餐', 3, '汉堡侠快餐，快手好味道，赶时间也好好吃饭。', '外脆里嫩,现炸', 29, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (30, '甜心甜品', '🍰', 4.8, '320m', '甜点', 4, '甜心甜品，今天也要甜甜地收尾呀。', '手作,治愈', 30, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (31, '奶油甜品', '🍰', 4.6, '450m', '甜点', 4, '奶油甜品，今天也要甜甜地收尾呀。', '不甜腻,料足', 31, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (32, '莓好甜品', '🍰', 4.9, '1.5km', '甜点', 4, '莓好甜品，今天也要甜甜地收尾呀。', '现烤,入口即化', 32, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (33, '半糖甜品', '🍰', 4.7, '1.8km', '甜点', 4, '半糖甜品，今天也要甜甜地收尾呀。', '治愈,奶香', 33, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (34, '糯糯甜品', '🍰', 4.8, '1.2km', '甜点', 4, '糯糯甜品，今天也要甜甜地收尾呀。', '料足,清爽', 34, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (35, '焙焙甜品', '🍰', 4.5, '3.1km', '甜点', 4, '焙焙甜品，今天也要甜甜地收尾呀。', '入口即化,颜值高', 35, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (36, '小甜甜品', '🍰', 4.7, '760m', '甜点', 4, '小甜甜品，今天也要甜甜地收尾呀。', '奶香,新鲜', 36, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (37, '糖罐甜品', '🍰', 4.6, '2.9km', '甜点', 4, '糖罐甜品，今天也要甜甜地收尾呀。', '清爽,手作', 37, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (38, '芋见甜品', '🍰', 4.9, '610m', '甜点', 4, '芋见甜品，今天也要甜甜地收尾呀。', '颜值高,不甜腻', 38, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (39, '暖糖甜品', '🍰', 4.8, '1.3km', '甜点', 4, '暖糖甜品，今天也要甜甜地收尾呀。', '新鲜,现烤', 39, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (40, '半杯茶饮', '🧋', 4.7, '320m', '饮品', 5, '半杯茶饮，一杯好喝的，续上今天的快乐。', '鲜果,清爽', 40, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (41, '柠夏茶饮', '🧋', 4.6, '450m', '饮品', 5, '柠夏茶饮，一杯好喝的，续上今天的快乐。', '少糖,现打', 41, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (42, '椰岛茶饮', '🧋', 4.9, '1.5km', '饮品', 5, '椰岛茶饮，一杯好喝的，续上今天的快乐。', '手冲,奶香', 42, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (43, '煮茶茶饮', '🧋', 4.5, '1.8km', '饮品', 5, '煮茶茶饮，一杯好喝的，续上今天的快乐。', '清爽,解腻', 43, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (44, '鲜果茶饮', '🧋', 4.8, '1.2km', '饮品', 5, '鲜果茶饮，一杯好喝的，续上今天的快乐。', '现打,冰爽', 44, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (45, '慢茶茶饮', '🧋', 4.7, '3.1km', '饮品', 5, '慢茶茶饮，一杯好喝的，续上今天的快乐。', '奶香,醇厚', 45, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (46, '青柚茶饮', '🧋', 4.6, '760m', '饮品', 5, '青柚茶饮，一杯好喝的，续上今天的快乐。', '解腻,安静', 46, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (47, '茶叔茶饮', '🧋', 4.9, '2.9km', '饮品', 5, '茶叔茶饮，一杯好喝的，续上今天的快乐。', '冰爽,鲜果', 47, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (48, '一杯茶饮', '🧋', 4.8, '610m', '饮品', 5, '一杯茶饮，一杯好喝的，续上今天的快乐。', '醇厚,少糖', 48, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (49, '柚见茶饮', '🧋', 4.7, '1.3km', '饮品', 5, '柚见茶饮，一杯好喝的，续上今天的快乐。', '安静,手冲', 49, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (50, '甘露茶饮', '🧋', 4.6, '320m', '饮品', 5, '甘露茶饮，一杯好喝的，续上今天的快乐。', '鲜果,清爽', 50, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (51, '绿野轻食', '🥗', 4.9, '450m', '轻食', 6, '绿野轻食，好好吃饭，也能轻盈无负担。', '低卡,高蛋白', 51, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (52, '轻氧轻食', '🥗', 4.7, '1.5km', '轻食', 6, '轻氧轻食，好好吃饭，也能轻盈无负担。', '新鲜,油醋汁', 52, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (53, '纤纤轻食', '🥗', 4.8, '1.8km', '轻食', 6, '纤纤轻食，好好吃饭，也能轻盈无负担。', '饱腹,现拌', 53, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (54, '每日轻食', '🥗', 4.5, '1.2km', '轻食', 6, '每日轻食，好好吃饭，也能轻盈无负担。', '高蛋白,减脂', 54, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (55, '鲜野轻食', '🥗', 4.9, '3.1km', '轻食', 6, '鲜野轻食，好好吃饭，也能轻盈无负担。', '油醋汁,清爽', 55, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (56, '素拾轻食', '🥗', 4.6, '760m', '轻食', 6, '素拾轻食，好好吃饭，也能轻盈无负担。', '现拌,时蔬', 56, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (57, '轻拌轻食', '🥗', 4.7, '2.9km', '轻食', 6, '轻拌轻食，好好吃饭，也能轻盈无负担。', '减脂,无负担', 57, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (58, '藜麦轻食', '🥗', 4.8, '610m', '轻食', 6, '藜麦轻食，好好吃饭，也能轻盈无负担。', '清爽,低卡', 58, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (59, '元气轻食', '🥗', 4.6, '1.3km', '轻食', 6, '元气轻食，好好吃饭，也能轻盈无负担。', '时蔬,新鲜', 59, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (60, '青蔬轻食', '🥗', 4.8, '320m', '轻食', 6, '青蔬轻食，好好吃饭，也能轻盈无负担。', '无负担,饱腹', 60, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (61, '巴蜀火锅', '🍲', 4.6, '450m', '火锅', 7, '巴蜀火锅，咕嘟咕嘟，是最治愈的烟火气。', '麻辣,毛肚', 61, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (62, '椒麻火锅', '🍲', 4.9, '1.5km', '火锅', 7, '椒麻火锅，咕嘟咕嘟，是最治愈的烟火气。', '牛油锅,七上八下', 62, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (63, '渝味火锅', '🍲', 4.7, '1.8km', '火锅', 7, '渝味火锅，咕嘟咕嘟，是最治愈的烟火气。', '鲜切,热气腾腾', 63, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (64, '锅气火锅', '🍲', 4.8, '1.2km', '火锅', 7, '锅气火锅，咕嘟咕嘟，是最治愈的烟火气。', '毛肚,入味', 64, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (65, '辣府火锅', '🍲', 4.5, '3.1km', '火锅', 7, '辣府火锅，咕嘟咕嘟，是最治愈的烟火气。', '七上八下,分量足', 65, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (66, '红汤火锅', '🍲', 4.7, '760m', '火锅', 7, '红汤火锅，咕嘟咕嘟，是最治愈的烟火气。', '热气腾腾,重口', 66, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (67, '沸腾火锅', '🍲', 4.6, '2.9km', '火锅', 7, '沸腾火锅，咕嘟咕嘟，是最治愈的烟火气。', '入味,过瘾', 67, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (68, '渝记火锅', '🍲', 4.9, '610m', '火锅', 7, '渝记火锅，咕嘟咕嘟，是最治愈的烟火气。', '分量足,麻辣', 68, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (69, '椒香火锅', '🍲', 4.8, '1.3km', '火锅', 7, '椒香火锅，咕嘟咕嘟，是最治愈的烟火气。', '重口,牛油锅', 69, '2026-10-23 16:31:59', '2026-10-23 16:31:59');
INSERT INTO `restaurant` VALUES (70, '蜀大火锅', '🍲', 4.7, '320m', '火锅', 7, '蜀大火锅，咕嘟咕嘟，是最治愈的烟火气。', '过瘾,鲜切', 70, '2026-10-23 16:31:59', '2026-10-23 16:31:59');

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
) ENGINE = InnoDB AUTO_INCREMENT = 351 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '评价表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of review
-- ----------------------------
INSERT INTO `review` VALUES (1, 1, '爱吃的小鹿', 5, '招牌牛肉面汤头绝了，手工面筋道，辣油香而不燥，会回购！', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (2, 1, '深夜食堂老板', 4, '红油抄手皮薄馅大，就是上菜稍慢，胜在新鲜。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (3, 1, '减肥失败者阿强', 5, '酸辣肥肠面分量足又实惠，肥肠处理得干净，强烈推荐。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (4, 1, '吃货老张', 3, '卤香豆干中规中矩，可能我没点招牌面才是正解。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (5, 1, '甜筒少女', 5, '冰镇酸梅汤解辣一绝，店员还送了小菜，态度超好～', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (6, 2, '随便点点', 4, '鸡胸蔬菜沙拉酱是油醋汁，吃着没负担，朋友聚餐也合适。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (7, 2, '干饭不积极', 5, '牛油果鸡蛋三明治给得慷慨，全麦面包夹现切牛油果，满足。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (8, 2, '麻辣星人', 5, '藜麦时蔬碗饱腹感强，减脂期也能吃得开心。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (9, 2, '元气满满酱', 5, '烤时蔬卷清爽不油腻，配鲜榨羽衣甘蓝汁刚刚好。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (10, 2, '一勺辣油', 4, '鲜榨羽衣甘蓝汁微苦回甘，健身人士会喜欢。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (11, 3, '佛系吃客', 5, '现烤舒芙蕾端上来还在抖，入口即化太治愈了。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (12, 3, '深夜放毒王', 5, '海盐提拉米苏酒香恰到好处，甜而不齁。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (13, 3, '碳水教父', 4, '莓果千层奶油不腻，夹着鲜莓酸得清醒。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (14, 3, '露营美食家', 4, '焦糖布丁壳脆心滑，甜度拿捏得刚好。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (15, 3, '减脂期的小美', 5, '芋泥啵啵杯料足，手捣芋泥配Q弹啵啵，罪恶感清零～', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (16, 4, '隔壁王叔叔', 5, '深烘手冲单品风味干净带果酸，配落地窗发呆绝配。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (17, 4, '奶盖收集者', 5, '生椰拿铁椰味浓又顺滑，每天续命就靠它。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (18, 4, '炸鸡品鉴师', 4, '桂花乌龙拿铁尾韵悠长，没想到咖啡还能这么清新。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (19, 4, '慢生活阿May', 5, '气泡美式清爽，醇厚咖啡配气泡刚刚好。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (20, 4, '重口味小李', 5, '脏脏可可可可碎配奶盖，罪恶但满足，值。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (21, 5, '甜品研究员', 4, '麻辣牛油锅底越煮越香，毛肚黄喉必点。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (22, 5, '早起一杯咖', 4, '鲜切黄喉脆嫩弹牙，七上八下刚刚好。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (23, 5, '火锅涮一切', 5, '手打虾滑现打就是不一样，弹到弹牙。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (24, 5, '水逆退散君', 5, '现炸酥肉外酥里嫩，直接吃也香，强推。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (25, 5, '光盘行动派', 5, '红糖糍粑软糯裹黄豆粉，甜口收尾太满足了。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (26, 6, '吃面不吐面', 4, '韩式雪花炸鸡外皮酥到掉渣，甜辣酱腌得入味。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (27, 6, '三杯不过岗', 5, '安格斯牛肉堡肉饼多汁，一口爆汁超满足。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (28, 6, '轻食猎人', 5, '黄金薯条现炸金黄外脆内软，停不下来。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (29, 6, '云吞星人', 5, '芝士薯泥拉丝绵密，配炸鸡绝了。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (30, 6, '布丁控本控', 5, '蜂蜜芥末鸡块蘸酱解腻，一口一个停不下。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (31, 7, '嗦粉专业户', 4, '鲜虾云吞面手工云吞整只鲜虾，弹牙又鲜美。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (32, 7, '拿铁依赖症', 4, '老北京炸酱面咸香浓郁，老味道还原得好。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (33, 7, '草莓味的风', 5, '鲜虾仁肠粉米皮滑嫩，酱油鲜甜。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (34, 7, '老饕本饕', 4, '艇仔粥料足绵滑，暖到心里。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (35, 7, '一个人的火锅', 4, '萝卜牛杂慢炖软烂，萝卜吸饱汤汁，绝。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (36, 8, '深夜emo食', 4, '草莓啵啵鲜奶茶当季草莓现打，料足好喝。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (37, 8, '鲜榨水果茶', 4, '多肉葡萄整颗去皮，清爽不涩，夏天最爱。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (38, 8, '嘴硬心软哥', 4, '茉莉奶绿茉莉清香，配奶绿很顺。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (39, 8, '下午茶预定', 4, '杨枝甘露芒果西柚椰浆，港式地道又解腻。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (40, 8, '撸猫配炸鸡', 5, '柠檬冷萃清爽，配炸鸡绝配，夏天续命水。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (41, 9, '碳水教父', 5, '在老街口面馆点的老街口招牌牛肉面，排队也值得，名不虚传。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (42, 9, '露营美食家', 4, '在老街口面馆点的老街口招牌牛肉面，颜值与味道都在线。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (43, 9, '减脂期的小美', 5, '在老街口面馆点的老街口招牌牛肉面，吃完心情都变好了。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (44, 9, '隔壁王叔叔', 5, '在老街口面馆点的老街口招牌牛肉面，真的绝了，会回购！', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (45, 9, '奶盖收集者', 4, '在老街口面馆点的老街口招牌牛肉面，分量足又实惠，强烈推荐。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (46, 10, '重口味小李', 5, '在小满面馆点的小满红烧排骨面，颜值与味道都在线。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (47, 10, '甜品研究员', 4, '在小满面馆点的小满红烧排骨面，吃完心情都变好了。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (48, 10, '早起一杯咖', 5, '在小满面馆点的小满红烧排骨面，真的绝了，会回购！', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (49, 10, '火锅涮一切', 5, '在小满面馆点的小满红烧排骨面，分量足又实惠，强烈推荐。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (50, 10, '水逆退散君', 4, '在小满面馆点的小满红烧排骨面，味道超出预期，环境也舒服。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (51, 11, '三杯不过岗', 5, '在见一面面馆点的见一面油泼面，吃完心情都变好了。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (52, 11, '轻食猎人', 4, '在见一面面馆点的见一面油泼面，真的绝了，会回购！', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (53, 11, '云吞星人', 5, '在见一面面馆点的见一面油泼面，分量足又实惠，强烈推荐。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (54, 11, '布丁控本控', 5, '在见一面面馆点的见一面油泼面，味道超出预期，环境也舒服。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (55, 11, '嗦粉专业户', 4, '在见一面面馆点的见一面油泼面，上菜快，服务态度好～', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (56, 12, '老饕本饕', 5, '在煮意面馆点的煮意红油拌面，真的绝了，会回购！', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (57, 12, '一个人的火锅', 4, '在煮意面馆点的煮意红油拌面，分量足又实惠，强烈推荐。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (58, 12, '深夜emo食', 5, '在煮意面馆点的煮意红油拌面，味道超出预期，环境也舒服。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (59, 12, '鲜榨水果茶', 5, '在煮意面馆点的煮意红油拌面，上菜快，服务态度好～', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (60, 12, '嘴硬心软哥', 4, '在煮意面馆点的煮意红油拌面，朋友都说好吃，下次还来。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (61, 13, '干饭人小张', 5, '在汤先生面馆点的汤先生炸酱面，分量足又实惠，强烈推荐。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (62, 13, '探店小王', 4, '在汤先生面馆点的汤先生炸酱面，味道超出预期，环境也舒服。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (63, 13, '美食博主莉', 5, '在汤先生面馆点的汤先生炸酱面，上菜快，服务态度好～', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (64, 13, '吃不胖的橘', 5, '在汤先生面馆点的汤先生炸酱面，朋友都说好吃，下次还来。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (65, 13, '夜宵护卫队', 4, '在汤先生面馆点的汤先生炸酱面，咸淡刚好，吃着没负担。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (66, 14, '麻辣不许', 5, '在暖食面馆点的暖食小笼汤包，味道超出预期，环境也舒服。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (67, 14, '清汤寡水的鱼', 4, '在暖食面馆点的暖食小笼汤包，上菜快，服务态度好～', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (68, 14, '碳水快乐屋', 5, '在暖食面馆点的暖食小笼汤包，朋友都说好吃，下次还来。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (69, 14, '鲜味研究所', 5, '在暖食面馆点的暖食小笼汤包，咸淡刚好，吃着没负担。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (70, 14, '爱吃的小鹿', 4, '在暖食面馆点的暖食小笼汤包，料给得慷慨，性价比高。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (71, 15, '吃货老张', 5, '在晨光面馆点的晨光葱油拌面，上菜快，服务态度好～', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (72, 15, '甜筒少女', 4, '在晨光面馆点的晨光葱油拌面，朋友都说好吃，下次还来。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (73, 15, '随便点点', 5, '在晨光面馆点的晨光葱油拌面，咸淡刚好，吃着没负担。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (74, 15, '干饭不积极', 5, '在晨光面馆点的晨光葱油拌面，料给得慷慨，性价比高。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (75, 15, '麻辣星人', 4, '在晨光面馆点的晨光葱油拌面，一口下去满足感拉满。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (76, 16, '佛系吃客', 5, '在巷尾面馆点的巷尾阳春面，朋友都说好吃，下次还来。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (77, 16, '深夜放毒王', 4, '在巷尾面馆点的巷尾阳春面，咸淡刚好，吃着没负担。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (78, 16, '碳水教父', 5, '在巷尾面馆点的巷尾阳春面，料给得慷慨，性价比高。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (79, 16, '露营美食家', 5, '在巷尾面馆点的巷尾阳春面，一口下去满足感拉满。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (80, 16, '减脂期的小美', 4, '在巷尾面馆点的巷尾阳春面，干净卫生，吃得放心。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (81, 17, '炸鸡品鉴师', 5, '在面香居面馆点的面香居番茄鸡蛋面，咸淡刚好，吃着没负担。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (82, 17, '慢生活阿May', 4, '在面香居面馆点的面香居番茄鸡蛋面，料给得慷慨，性价比高。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (83, 17, '重口味小李', 5, '在面香居面馆点的面香居番茄鸡蛋面，一口下去满足感拉满。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (84, 17, '甜品研究员', 5, '在面香居面馆点的面香居番茄鸡蛋面，干净卫生，吃得放心。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (85, 17, '早起一杯咖', 4, '在面香居面馆点的面香居番茄鸡蛋面，排队也值得，名不虚传。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (86, 18, '光盘行动派', 5, '在北方味面馆点的北方味三鲜馄饨，料给得慷慨，性价比高。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (87, 18, '吃面不吐面', 4, '在北方味面馆点的北方味三鲜馄饨，一口下去满足感拉满。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (88, 18, '三杯不过岗', 5, '在北方味面馆点的北方味三鲜馄饨，干净卫生，吃得放心。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (89, 18, '轻食猎人', 5, '在北方味面馆点的北方味三鲜馄饨，排队也值得，名不虚传。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (90, 18, '云吞星人', 4, '在北方味面馆点的北方味三鲜馄饨，颜值与味道都在线。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (91, 19, '拿铁依赖症', 5, '在饱饱快餐点的饱饱韩式雪花炸鸡，一口下去满足感拉满。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (92, 19, '草莓味的风', 4, '在饱饱快餐点的饱饱韩式雪花炸鸡，干净卫生，吃得放心。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (93, 19, '老饕本饕', 5, '在饱饱快餐点的饱饱韩式雪花炸鸡，排队也值得，名不虚传。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (94, 19, '一个人的火锅', 5, '在饱饱快餐点的饱饱韩式雪花炸鸡，颜值与味道都在线。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (95, 19, '深夜emo食', 4, '在饱饱快餐点的饱饱韩式雪花炸鸡，吃完心情都变好了。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (96, 20, '下午茶预定', 5, '在大口快餐点的大口夏威夷披萨，干净卫生，吃得放心。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (97, 20, '撸猫配炸鸡', 4, '在大口快餐点的大口夏威夷披萨，排队也值得，名不虚传。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (98, 20, '干饭人小张', 5, '在大口快餐点的大口夏威夷披萨，颜值与味道都在线。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (99, 20, '探店小王', 5, '在大口快餐点的大口夏威夷披萨，吃完心情都变好了。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (100, 20, '美食博主莉', 4, '在大口快餐点的大口夏威夷披萨，真的绝了，会回购！', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (101, 21, '柠檬不萌', 5, '在急急快餐点的急急双层芝士堡，排队也值得，名不虚传。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (102, 21, '奶油脑袋', 4, '在急急快餐点的急急双层芝士堡，颜值与味道都在线。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (103, 21, '麻辣不许', 5, '在急急快餐点的急急双层芝士堡，吃完心情都变好了。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (104, 21, '清汤寡水的鱼', 5, '在急急快餐点的急急双层芝士堡，真的绝了，会回购！', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (105, 21, '碳水快乐屋', 4, '在急急快餐点的急急双层芝士堡，分量足又实惠，强烈推荐。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (106, 22, '深夜食堂老板', 5, '在饱嗝快餐点的饱嗝黄金薯条，颜值与味道都在线。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (107, 22, '减肥失败者阿强', 4, '在饱嗝快餐点的饱嗝黄金薯条，吃完心情都变好了。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (108, 22, '吃货老张', 5, '在饱嗝快餐点的饱嗝黄金薯条，真的绝了，会回购！', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (109, 22, '甜筒少女', 5, '在饱嗝快餐点的饱嗝黄金薯条，分量足又实惠，强烈推荐。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (110, 22, '随便点点', 4, '在饱嗝快餐点的饱嗝黄金薯条，味道超出预期，环境也舒服。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (111, 23, '元气满满酱', 5, '在快乐快餐点的快乐香辣鸡翅，吃完心情都变好了。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (112, 23, '一勺辣油', 4, '在快乐快餐点的快乐香辣鸡翅，真的绝了，会回购！', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (113, 23, '佛系吃客', 5, '在快乐快餐点的快乐香辣鸡翅，分量足又实惠，强烈推荐。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (114, 23, '深夜放毒王', 5, '在快乐快餐点的快乐香辣鸡翅，味道超出预期，环境也舒服。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (115, 23, '碳水教父', 4, '在快乐快餐点的快乐香辣鸡翅，上菜快，服务态度好～', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (116, 24, '隔壁王叔叔', 5, '在薯叔快餐点的薯叔盐酥鸡，真的绝了，会回购！', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (117, 24, '奶盖收集者', 4, '在薯叔快餐点的薯叔盐酥鸡，分量足又实惠，强烈推荐。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (118, 24, '炸鸡品鉴师', 5, '在薯叔快餐点的薯叔盐酥鸡，味道超出预期，环境也舒服。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (119, 24, '慢生活阿May', 5, '在薯叔快餐点的薯叔盐酥鸡，上菜快，服务态度好～', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (120, 24, '重口味小李', 4, '在薯叔快餐点的薯叔盐酥鸡，朋友都说好吃，下次还来。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (121, 25, '火锅涮一切', 5, '在炸物快餐点的炸物蜂蜜芥末鸡块，分量足又实惠，强烈推荐。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (122, 25, '水逆退散君', 4, '在炸物快餐点的炸物蜂蜜芥末鸡块，味道超出预期，环境也舒服。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (123, 25, '光盘行动派', 5, '在炸物快餐点的炸物蜂蜜芥末鸡块，上菜快，服务态度好～', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (124, 25, '吃面不吐面', 5, '在炸物快餐点的炸物蜂蜜芥末鸡块，朋友都说好吃，下次还来。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (125, 25, '三杯不过岗', 4, '在炸物快餐点的炸物蜂蜜芥末鸡块，咸淡刚好，吃着没负担。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (126, 26, '布丁控本控', 5, '在饱了快餐点的饱了冰镇可乐，味道超出预期，环境也舒服。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (127, 26, '嗦粉专业户', 4, '在饱了快餐点的饱了冰镇可乐，上菜快，服务态度好～', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (128, 26, '拿铁依赖症', 5, '在饱了快餐点的饱了冰镇可乐，朋友都说好吃，下次还来。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (129, 26, '草莓味的风', 5, '在饱了快餐点的饱了冰镇可乐，咸淡刚好，吃着没负担。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (130, 26, '老饕本饕', 4, '在饱了快餐点的饱了冰镇可乐，料给得慷慨，性价比高。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (131, 27, '鲜榨水果茶', 5, '在嗨吃快餐点的嗨吃安格斯牛肉堡，上菜快，服务态度好～', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (132, 27, '嘴硬心软哥', 4, '在嗨吃快餐点的嗨吃安格斯牛肉堡，朋友都说好吃，下次还来。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (133, 27, '下午茶预定', 5, '在嗨吃快餐点的嗨吃安格斯牛肉堡，咸淡刚好，吃着没负担。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (134, 27, '撸猫配炸鸡', 5, '在嗨吃快餐点的嗨吃安格斯牛肉堡，料给得慷慨，性价比高。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (135, 27, '干饭人小张', 4, '在嗨吃快餐点的嗨吃安格斯牛肉堡，一口下去满足感拉满。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (136, 28, '吃不胖的橘', 5, '在速达快餐点的速达鸡肉卷，朋友都说好吃，下次还来。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (137, 28, '夜宵护卫队', 4, '在速达快餐点的速达鸡肉卷，咸淡刚好，吃着没负担。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (138, 28, '柠檬不萌', 5, '在速达快餐点的速达鸡肉卷，料给得慷慨，性价比高。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (139, 28, '奶油脑袋', 5, '在速达快餐点的速达鸡肉卷，一口下去满足感拉满。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (140, 28, '麻辣不许', 4, '在速达快餐点的速达鸡肉卷，干净卫生，吃得放心。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (141, 29, '鲜味研究所', 5, '在汉堡侠快餐点的汉堡侠墨西哥塔可，咸淡刚好，吃着没负担。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (142, 29, '爱吃的小鹿', 4, '在汉堡侠快餐点的汉堡侠墨西哥塔可，料给得慷慨，性价比高。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (143, 29, '深夜食堂老板', 5, '在汉堡侠快餐点的汉堡侠墨西哥塔可，一口下去满足感拉满。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (144, 29, '减肥失败者阿强', 5, '在汉堡侠快餐点的汉堡侠墨西哥塔可，干净卫生，吃得放心。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (145, 29, '吃货老张', 4, '在汉堡侠快餐点的汉堡侠墨西哥塔可，排队也值得，名不虚传。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (146, 30, '干饭不积极', 5, '在甜心甜品点的甜心现烤舒芙蕾，料给得慷慨，性价比高。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (147, 30, '麻辣星人', 4, '在甜心甜品点的甜心现烤舒芙蕾，一口下去满足感拉满。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (148, 30, '元气满满酱', 5, '在甜心甜品点的甜心现烤舒芙蕾，干净卫生，吃得放心。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (149, 30, '一勺辣油', 5, '在甜心甜品点的甜心现烤舒芙蕾，排队也值得，名不虚传。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (150, 30, '佛系吃客', 4, '在甜心甜品点的甜心现烤舒芙蕾，颜值与味道都在线。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (151, 31, '露营美食家', 5, '在奶油甜品点的奶油香草纸杯蛋糕，一口下去满足感拉满。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (152, 31, '减脂期的小美', 4, '在奶油甜品点的奶油香草纸杯蛋糕，干净卫生，吃得放心。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (153, 31, '隔壁王叔叔', 5, '在奶油甜品点的奶油香草纸杯蛋糕，排队也值得，名不虚传。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (154, 31, '奶盖收集者', 5, '在奶油甜品点的奶油香草纸杯蛋糕，颜值与味道都在线。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (155, 31, '炸鸡品鉴师', 4, '在奶油甜品点的奶油香草纸杯蛋糕，吃完心情都变好了。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (156, 32, '甜品研究员', 5, '在莓好甜品点的莓好大福团子，干净卫生，吃得放心。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (157, 32, '早起一杯咖', 4, '在莓好甜品点的莓好大福团子，排队也值得，名不虚传。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (158, 32, '火锅涮一切', 5, '在莓好甜品点的莓好大福团子，颜值与味道都在线。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (159, 32, '水逆退散君', 5, '在莓好甜品点的莓好大福团子，吃完心情都变好了。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (160, 32, '光盘行动派', 4, '在莓好甜品点的莓好大福团子，真的绝了，会回购！', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (161, 33, '轻食猎人', 5, '在半糖甜品点的半糖芋泥啵啵杯，排队也值得，名不虚传。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (162, 33, '云吞星人', 4, '在半糖甜品点的半糖芋泥啵啵杯，颜值与味道都在线。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (163, 33, '布丁控本控', 5, '在半糖甜品点的半糖芋泥啵啵杯，吃完心情都变好了。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (164, 33, '嗦粉专业户', 5, '在半糖甜品点的半糖芋泥啵啵杯，真的绝了，会回购！', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (165, 33, '拿铁依赖症', 4, '在半糖甜品点的半糖芋泥啵啵杯，分量足又实惠，强烈推荐。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (166, 34, '一个人的火锅', 5, '在糯糯甜品点的糯糯苹果派，颜值与味道都在线。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (167, 34, '深夜emo食', 4, '在糯糯甜品点的糯糯苹果派，吃完心情都变好了。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (168, 34, '鲜榨水果茶', 5, '在糯糯甜品点的糯糯苹果派，真的绝了，会回购！', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (169, 34, '嘴硬心软哥', 5, '在糯糯甜品点的糯糯苹果派，分量足又实惠，强烈推荐。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (170, 34, '下午茶预定', 4, '在糯糯甜品点的糯糯苹果派，味道超出预期，环境也舒服。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (171, 35, '探店小王', 5, '在焙焙甜品点的焙焙焦糖布丁，吃完心情都变好了。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (172, 35, '美食博主莉', 4, '在焙焙甜品点的焙焙焦糖布丁，真的绝了，会回购！', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (173, 35, '吃不胖的橘', 5, '在焙焙甜品点的焙焙焦糖布丁，分量足又实惠，强烈推荐。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (174, 35, '夜宵护卫队', 5, '在焙焙甜品点的焙焙焦糖布丁，味道超出预期，环境也舒服。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (175, 35, '柠檬不萌', 4, '在焙焙甜品点的焙焙焦糖布丁，上菜快，服务态度好～', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (176, 36, '清汤寡水的鱼', 5, '在小甜甜品点的小甜巧克力熔岩，真的绝了，会回购！', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (177, 36, '碳水快乐屋', 4, '在小甜甜品点的小甜巧克力熔岩，分量足又实惠，强烈推荐。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (178, 36, '鲜味研究所', 5, '在小甜甜品点的小甜巧克力熔岩，味道超出预期，环境也舒服。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (179, 36, '爱吃的小鹿', 5, '在小甜甜品点的小甜巧克力熔岩，上菜快，服务态度好～', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (180, 36, '深夜食堂老板', 4, '在小甜甜品点的小甜巧克力熔岩，朋友都说好吃，下次还来。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (181, 37, '甜筒少女', 5, '在糖罐甜品点的糖罐莓果千层，分量足又实惠，强烈推荐。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (182, 37, '随便点点', 4, '在糖罐甜品点的糖罐莓果千层，味道超出预期，环境也舒服。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (183, 37, '干饭不积极', 5, '在糖罐甜品点的糖罐莓果千层，上菜快，服务态度好～', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (184, 37, '麻辣星人', 5, '在糖罐甜品点的糖罐莓果千层，朋友都说好吃，下次还来。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (185, 37, '元气满满酱', 4, '在糖罐甜品点的糖罐莓果千层，咸淡刚好，吃着没负担。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (186, 38, '深夜放毒王', 5, '在芋见甜品点的芋见黄油曲奇，味道超出预期，环境也舒服。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (187, 38, '碳水教父', 4, '在芋见甜品点的芋见黄油曲奇，上菜快，服务态度好～', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (188, 38, '露营美食家', 5, '在芋见甜品点的芋见黄油曲奇，朋友都说好吃，下次还来。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (189, 38, '减脂期的小美', 5, '在芋见甜品点的芋见黄油曲奇，咸淡刚好，吃着没负担。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (190, 38, '隔壁王叔叔', 4, '在芋见甜品点的芋见黄油曲奇，料给得慷慨，性价比高。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (191, 39, '慢生活阿May', 5, '在暖糖甜品点的暖糖海盐提拉米苏，上菜快，服务态度好～', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (192, 39, '重口味小李', 4, '在暖糖甜品点的暖糖海盐提拉米苏，朋友都说好吃，下次还来。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (193, 39, '甜品研究员', 5, '在暖糖甜品点的暖糖海盐提拉米苏，咸淡刚好，吃着没负担。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (194, 39, '早起一杯咖', 5, '在暖糖甜品点的暖糖海盐提拉米苏，料给得慷慨，性价比高。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (195, 39, '火锅涮一切', 4, '在暖糖甜品点的暖糖海盐提拉米苏，一口下去满足感拉满。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (196, 40, '吃面不吐面', 5, '在半杯茶饮点的半杯珍珠奶茶，朋友都说好吃，下次还来。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (197, 40, '三杯不过岗', 4, '在半杯茶饮点的半杯珍珠奶茶，咸淡刚好，吃着没负担。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (198, 40, '轻食猎人', 5, '在半杯茶饮点的半杯珍珠奶茶，料给得慷慨，性价比高。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (199, 40, '云吞星人', 5, '在半杯茶饮点的半杯珍珠奶茶，一口下去满足感拉满。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (200, 40, '布丁控本控', 4, '在半杯茶饮点的半杯珍珠奶茶，干净卫生，吃得放心。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (201, 41, '草莓味的风', 5, '在柠夏茶饮点的柠夏多肉葡萄，咸淡刚好，吃着没负担。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (202, 41, '老饕本饕', 4, '在柠夏茶饮点的柠夏多肉葡萄，料给得慷慨，性价比高。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (203, 41, '一个人的火锅', 5, '在柠夏茶饮点的柠夏多肉葡萄，一口下去满足感拉满。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (204, 41, '深夜emo食', 5, '在柠夏茶饮点的柠夏多肉葡萄，干净卫生，吃得放心。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (205, 41, '鲜榨水果茶', 4, '在柠夏茶饮点的柠夏多肉葡萄，排队也值得，名不虚传。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (206, 42, '撸猫配炸鸡', 5, '在椰岛茶饮点的椰岛黑糖波波，料给得慷慨，性价比高。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (207, 42, '干饭人小张', 4, '在椰岛茶饮点的椰岛黑糖波波，一口下去满足感拉满。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (208, 42, '探店小王', 5, '在椰岛茶饮点的椰岛黑糖波波，干净卫生，吃得放心。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (209, 42, '美食博主莉', 5, '在椰岛茶饮点的椰岛黑糖波波，排队也值得，名不虚传。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (210, 42, '吃不胖的橘', 4, '在椰岛茶饮点的椰岛黑糖波波，颜值与味道都在线。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (211, 43, '奶油脑袋', 5, '在煮茶茶饮点的煮茶茉莉奶绿，一口下去满足感拉满。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (212, 43, '麻辣不许', 4, '在煮茶茶饮点的煮茶茉莉奶绿，干净卫生，吃得放心。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (213, 43, '清汤寡水的鱼', 5, '在煮茶茶饮点的煮茶茉莉奶绿，排队也值得，名不虚传。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (214, 43, '碳水快乐屋', 5, '在煮茶茶饮点的煮茶茉莉奶绿，颜值与味道都在线。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (215, 43, '鲜味研究所', 4, '在煮茶茶饮点的煮茶茉莉奶绿，吃完心情都变好了。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (216, 44, '减肥失败者阿强', 5, '在鲜果茶饮点的鲜果桂花乌龙，干净卫生，吃得放心。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (217, 44, '吃货老张', 4, '在鲜果茶饮点的鲜果桂花乌龙，排队也值得，名不虚传。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (218, 44, '甜筒少女', 5, '在鲜果茶饮点的鲜果桂花乌龙，颜值与味道都在线。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (219, 44, '随便点点', 5, '在鲜果茶饮点的鲜果桂花乌龙，吃完心情都变好了。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (220, 44, '干饭不积极', 4, '在鲜果茶饮点的鲜果桂花乌龙，真的绝了，会回购！', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (221, 45, '一勺辣油', 5, '在慢茶茶饮点的慢茶生椰拿铁，排队也值得，名不虚传。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (222, 45, '佛系吃客', 4, '在慢茶茶饮点的慢茶生椰拿铁，颜值与味道都在线。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (223, 45, '深夜放毒王', 5, '在慢茶茶饮点的慢茶生椰拿铁，吃完心情都变好了。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (224, 45, '碳水教父', 5, '在慢茶茶饮点的慢茶生椰拿铁，真的绝了，会回购！', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (225, 45, '露营美食家', 4, '在慢茶茶饮点的慢茶生椰拿铁，分量足又实惠，强烈推荐。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (226, 46, '奶盖收集者', 5, '在青柚茶饮点的青柚柠檬冷萃，颜值与味道都在线。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (227, 46, '炸鸡品鉴师', 4, '在青柚茶饮点的青柚柠檬冷萃，吃完心情都变好了。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (228, 46, '慢生活阿May', 5, '在青柚茶饮点的青柚柠檬冷萃，真的绝了，会回购！', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (229, 46, '重口味小李', 5, '在青柚茶饮点的青柚柠檬冷萃，分量足又实惠，强烈推荐。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (230, 46, '甜品研究员', 4, '在青柚茶饮点的青柚柠檬冷萃，味道超出预期，环境也舒服。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (231, 47, '水逆退散君', 5, '在茶叔茶饮点的茶叔白桃乌龙，吃完心情都变好了。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (232, 47, '光盘行动派', 4, '在茶叔茶饮点的茶叔白桃乌龙，真的绝了，会回购！', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (233, 47, '吃面不吐面', 5, '在茶叔茶饮点的茶叔白桃乌龙，分量足又实惠，强烈推荐。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (234, 47, '三杯不过岗', 5, '在茶叔茶饮点的茶叔白桃乌龙，味道超出预期，环境也舒服。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (235, 47, '轻食猎人', 4, '在茶叔茶饮点的茶叔白桃乌龙，上菜快，服务态度好～', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (236, 48, '嗦粉专业户', 5, '在一杯茶饮点的一杯杨枝甘露，真的绝了，会回购！', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (237, 48, '拿铁依赖症', 4, '在一杯茶饮点的一杯杨枝甘露，分量足又实惠，强烈推荐。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (238, 48, '草莓味的风', 5, '在一杯茶饮点的一杯杨枝甘露，味道超出预期，环境也舒服。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (239, 48, '老饕本饕', 5, '在一杯茶饮点的一杯杨枝甘露，上菜快，服务态度好～', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (240, 48, '一个人的火锅', 4, '在一杯茶饮点的一杯杨枝甘露，朋友都说好吃，下次还来。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (241, 49, '嘴硬心软哥', 5, '在柚见茶饮点的柚见椰子水，分量足又实惠，强烈推荐。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (242, 49, '下午茶预定', 4, '在柚见茶饮点的柚见椰子水，味道超出预期，环境也舒服。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (243, 49, '撸猫配炸鸡', 5, '在柚见茶饮点的柚见椰子水，上菜快，服务态度好～', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (244, 49, '干饭人小张', 5, '在柚见茶饮点的柚见椰子水，朋友都说好吃，下次还来。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (245, 49, '探店小王', 4, '在柚见茶饮点的柚见椰子水，咸淡刚好，吃着没负担。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (246, 50, '夜宵护卫队', 5, '在甘露茶饮点的甘露气泡美式，味道超出预期，环境也舒服。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (247, 50, '柠檬不萌', 4, '在甘露茶饮点的甘露气泡美式，上菜快，服务态度好～', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (248, 50, '奶油脑袋', 5, '在甘露茶饮点的甘露气泡美式，朋友都说好吃，下次还来。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (249, 50, '麻辣不许', 5, '在甘露茶饮点的甘露气泡美式，咸淡刚好，吃着没负担。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (250, 50, '清汤寡水的鱼', 4, '在甘露茶饮点的甘露气泡美式，料给得慷慨，性价比高。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (251, 51, '爱吃的小鹿', 5, '在绿野轻食点的绿野鸡胸蔬菜沙拉，上菜快，服务态度好～', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (252, 51, '深夜食堂老板', 4, '在绿野轻食点的绿野鸡胸蔬菜沙拉，朋友都说好吃，下次还来。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (253, 51, '减肥失败者阿强', 5, '在绿野轻食点的绿野鸡胸蔬菜沙拉，咸淡刚好，吃着没负担。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (254, 51, '吃货老张', 5, '在绿野轻食点的绿野鸡胸蔬菜沙拉，料给得慷慨，性价比高。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (255, 51, '甜筒少女', 4, '在绿野轻食点的绿野鸡胸蔬菜沙拉，一口下去满足感拉满。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (256, 52, '麻辣星人', 5, '在轻氧轻食点的轻氧三文鱼牛油果沙拉，朋友都说好吃，下次还来。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (257, 52, '元气满满酱', 4, '在轻氧轻食点的轻氧三文鱼牛油果沙拉，咸淡刚好，吃着没负担。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (258, 52, '一勺辣油', 5, '在轻氧轻食点的轻氧三文鱼牛油果沙拉，料给得慷慨，性价比高。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (259, 52, '佛系吃客', 5, '在轻氧轻食点的轻氧三文鱼牛油果沙拉，一口下去满足感拉满。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (260, 52, '深夜放毒王', 4, '在轻氧轻食点的轻氧三文鱼牛油果沙拉，干净卫生，吃得放心。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (261, 53, '减脂期的小美', 5, '在纤纤轻食点的纤纤能量碗，咸淡刚好，吃着没负担。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (262, 53, '隔壁王叔叔', 4, '在纤纤轻食点的纤纤能量碗，料给得慷慨，性价比高。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (263, 53, '奶盖收集者', 5, '在纤纤轻食点的纤纤能量碗，一口下去满足感拉满。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (264, 53, '炸鸡品鉴师', 5, '在纤纤轻食点的纤纤能量碗，干净卫生，吃得放心。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (265, 53, '慢生活阿May', 4, '在纤纤轻食点的纤纤能量碗，排队也值得，名不虚传。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (266, 54, '早起一杯咖', 5, '在每日轻食点的每日鲜榨羽衣甘蓝汁，料给得慷慨，性价比高。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (267, 54, '火锅涮一切', 4, '在每日轻食点的每日鲜榨羽衣甘蓝汁，一口下去满足感拉满。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (268, 54, '水逆退散君', 5, '在每日轻食点的每日鲜榨羽衣甘蓝汁，干净卫生，吃得放心。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (269, 54, '光盘行动派', 5, '在每日轻食点的每日鲜榨羽衣甘蓝汁，排队也值得，名不虚传。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (270, 54, '吃面不吐面', 4, '在每日轻食点的每日鲜榨羽衣甘蓝汁，颜值与味道都在线。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (271, 55, '云吞星人', 5, '在鲜野轻食点的鲜野希腊酸奶杯，一口下去满足感拉满。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (272, 55, '布丁控本控', 4, '在鲜野轻食点的鲜野希腊酸奶杯，干净卫生，吃得放心。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (273, 55, '嗦粉专业户', 5, '在鲜野轻食点的鲜野希腊酸奶杯，排队也值得，名不虚传。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (274, 55, '拿铁依赖症', 5, '在鲜野轻食点的鲜野希腊酸奶杯，颜值与味道都在线。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (275, 55, '草莓味的风', 4, '在鲜野轻食点的鲜野希腊酸奶杯，吃完心情都变好了。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (276, 56, '深夜emo食', 5, '在素拾轻食点的素拾烤时蔬卷，干净卫生，吃得放心。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (277, 56, '鲜榨水果茶', 4, '在素拾轻食点的素拾烤时蔬卷，排队也值得，名不虚传。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (278, 56, '嘴硬心软哥', 5, '在素拾轻食点的素拾烤时蔬卷，颜值与味道都在线。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (279, 56, '下午茶预定', 5, '在素拾轻食点的素拾烤时蔬卷，吃完心情都变好了。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (280, 56, '撸猫配炸鸡', 4, '在素拾轻食点的素拾烤时蔬卷，真的绝了，会回购！', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (281, 57, '美食博主莉', 5, '在轻拌轻食点的轻拌鹰嘴豆沙拉，排队也值得，名不虚传。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (282, 57, '吃不胖的橘', 4, '在轻拌轻食点的轻拌鹰嘴豆沙拉，颜值与味道都在线。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (283, 57, '夜宵护卫队', 5, '在轻拌轻食点的轻拌鹰嘴豆沙拉，吃完心情都变好了。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (284, 57, '柠檬不萌', 5, '在轻拌轻食点的轻拌鹰嘴豆沙拉，真的绝了，会回购！', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (285, 57, '奶油脑袋', 4, '在轻拌轻食点的轻拌鹰嘴豆沙拉，分量足又实惠，强烈推荐。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (286, 58, '碳水快乐屋', 5, '在藜麦轻食点的藜麦藜麦时蔬碗，颜值与味道都在线。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (287, 58, '鲜味研究所', 4, '在藜麦轻食点的藜麦藜麦时蔬碗，吃完心情都变好了。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (288, 58, '爱吃的小鹿', 5, '在藜麦轻食点的藜麦藜麦时蔬碗，真的绝了，会回购！', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (289, 58, '深夜食堂老板', 5, '在藜麦轻食点的藜麦藜麦时蔬碗，分量足又实惠，强烈推荐。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (290, 58, '减肥失败者阿强', 4, '在藜麦轻食点的藜麦藜麦时蔬碗，味道超出预期，环境也舒服。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (291, 59, '随便点点', 5, '在元气轻食点的元气南瓜浓汤，吃完心情都变好了。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (292, 59, '干饭不积极', 4, '在元气轻食点的元气南瓜浓汤，真的绝了，会回购！', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (293, 59, '麻辣星人', 5, '在元气轻食点的元气南瓜浓汤，分量足又实惠，强烈推荐。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (294, 59, '元气满满酱', 5, '在元气轻食点的元气南瓜浓汤，味道超出预期，环境也舒服。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (295, 59, '一勺辣油', 4, '在元气轻食点的元气南瓜浓汤，上菜快，服务态度好～', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (296, 60, '碳水教父', 5, '在青蔬轻食点的青蔬牛油果鸡蛋三明治，真的绝了，会回购！', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (297, 60, '露营美食家', 4, '在青蔬轻食点的青蔬牛油果鸡蛋三明治，分量足又实惠，强烈推荐。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (298, 60, '减脂期的小美', 5, '在青蔬轻食点的青蔬牛油果鸡蛋三明治，味道超出预期，环境也舒服。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (299, 60, '隔壁王叔叔', 5, '在青蔬轻食点的青蔬牛油果鸡蛋三明治，上菜快，服务态度好～', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (300, 60, '奶盖收集者', 4, '在青蔬轻食点的青蔬牛油果鸡蛋三明治，朋友都说好吃，下次还来。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (301, 61, '重口味小李', 5, '在巴蜀火锅点的巴蜀麻辣牛油锅，分量足又实惠，强烈推荐。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (302, 61, '甜品研究员', 4, '在巴蜀火锅点的巴蜀麻辣牛油锅，味道超出预期，环境也舒服。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (303, 61, '早起一杯咖', 5, '在巴蜀火锅点的巴蜀麻辣牛油锅，上菜快，服务态度好～', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (304, 61, '火锅涮一切', 5, '在巴蜀火锅点的巴蜀麻辣牛油锅，朋友都说好吃，下次还来。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (305, 61, '水逆退散君', 4, '在巴蜀火锅点的巴蜀麻辣牛油锅，咸淡刚好，吃着没负担。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (306, 62, '三杯不过岗', 5, '在椒麻火锅点的椒麻鲜切牛肉，味道超出预期，环境也舒服。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (307, 62, '轻食猎人', 4, '在椒麻火锅点的椒麻鲜切牛肉，上菜快，服务态度好～', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (308, 62, '云吞星人', 5, '在椒麻火锅点的椒麻鲜切牛肉，朋友都说好吃，下次还来。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (309, 62, '布丁控本控', 5, '在椒麻火锅点的椒麻鲜切牛肉，咸淡刚好，吃着没负担。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (310, 62, '嗦粉专业户', 4, '在椒麻火锅点的椒麻鲜切牛肉，料给得慷慨，性价比高。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (311, 63, '老饕本饕', 5, '在渝味火锅点的渝味宽粉，上菜快，服务态度好～', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (312, 63, '一个人的火锅', 4, '在渝味火锅点的渝味宽粉，朋友都说好吃，下次还来。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (313, 63, '深夜emo食', 5, '在渝味火锅点的渝味宽粉，咸淡刚好，吃着没负担。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (314, 63, '鲜榨水果茶', 5, '在渝味火锅点的渝味宽粉，料给得慷慨，性价比高。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (315, 63, '嘴硬心软哥', 4, '在渝味火锅点的渝味宽粉，一口下去满足感拉满。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (316, 64, '干饭人小张', 5, '在锅气火锅点的锅气红糖糍粑，朋友都说好吃，下次还来。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (317, 64, '探店小王', 4, '在锅气火锅点的锅气红糖糍粑，咸淡刚好，吃着没负担。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (318, 64, '美食博主莉', 5, '在锅气火锅点的锅气红糖糍粑，料给得慷慨，性价比高。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (319, 64, '吃不胖的橘', 5, '在锅气火锅点的锅气红糖糍粑，一口下去满足感拉满。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (320, 64, '夜宵护卫队', 4, '在锅气火锅点的锅气红糖糍粑，干净卫生，吃得放心。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (321, 65, '麻辣不许', 5, '在辣府火锅点的辣府鱼丸拼盘，咸淡刚好，吃着没负担。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (322, 65, '清汤寡水的鱼', 4, '在辣府火锅点的辣府鱼丸拼盘，料给得慷慨，性价比高。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (323, 65, '碳水快乐屋', 5, '在辣府火锅点的辣府鱼丸拼盘，一口下去满足感拉满。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (324, 65, '鲜味研究所', 5, '在辣府火锅点的辣府鱼丸拼盘，干净卫生，吃得放心。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (325, 65, '爱吃的小鹿', 4, '在辣府火锅点的辣府鱼丸拼盘，排队也值得，名不虚传。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (326, 66, '吃货老张', 5, '在红汤火锅点的红汤现炸酥肉，料给得慷慨，性价比高。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (327, 66, '甜筒少女', 4, '在红汤火锅点的红汤现炸酥肉，一口下去满足感拉满。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (328, 66, '随便点点', 5, '在红汤火锅点的红汤现炸酥肉，干净卫生，吃得放心。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (329, 66, '干饭不积极', 5, '在红汤火锅点的红汤现炸酥肉，排队也值得，名不虚传。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (330, 66, '麻辣星人', 4, '在红汤火锅点的红汤现炸酥肉，颜值与味道都在线。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (331, 67, '佛系吃客', 5, '在沸腾火锅点的沸腾手工豆皮，一口下去满足感拉满。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (332, 67, '深夜放毒王', 4, '在沸腾火锅点的沸腾手工豆皮，干净卫生，吃得放心。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (333, 67, '碳水教父', 5, '在沸腾火锅点的沸腾手工豆皮，排队也值得，名不虚传。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (334, 67, '露营美食家', 5, '在沸腾火锅点的沸腾手工豆皮，颜值与味道都在线。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (335, 67, '减脂期的小美', 4, '在沸腾火锅点的沸腾手工豆皮，吃完心情都变好了。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (336, 68, '炸鸡品鉴师', 5, '在渝记火锅点的渝记手打虾滑，干净卫生，吃得放心。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (337, 68, '慢生活阿May', 4, '在渝记火锅点的渝记手打虾滑，排队也值得，名不虚传。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (338, 68, '重口味小李', 5, '在渝记火锅点的渝记手打虾滑，颜值与味道都在线。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (339, 68, '甜品研究员', 5, '在渝记火锅点的渝记手打虾滑，吃完心情都变好了。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (340, 68, '早起一杯咖', 4, '在渝记火锅点的渝记手打虾滑，真的绝了，会回购！', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (341, 69, '光盘行动派', 5, '在椒香火锅点的椒香蔬菜拼盘，排队也值得，名不虚传。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (342, 69, '吃面不吐面', 4, '在椒香火锅点的椒香蔬菜拼盘，颜值与味道都在线。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (343, 69, '三杯不过岗', 5, '在椒香火锅点的椒香蔬菜拼盘，吃完心情都变好了。', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (344, 69, '轻食猎人', 5, '在椒香火锅点的椒香蔬菜拼盘，真的绝了，会回购！', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (345, 69, '云吞星人', 4, '在椒香火锅点的椒香蔬菜拼盘，分量足又实惠，强烈推荐。', '昨天', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (346, 70, '拿铁依赖症', 5, '在蜀大火锅点的蜀大鲜切黄喉，颜值与味道都在线。', '刚刚', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (347, 70, '草莓味的风', 4, '在蜀大火锅点的蜀大鲜切黄喉，吃完心情都变好了。', '3天前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (348, 70, '老饕本饕', 5, '在蜀大火锅点的蜀大鲜切黄喉，真的绝了，会回购！', '1周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (349, 70, '一个人的火锅', 5, '在蜀大火锅点的蜀大鲜切黄喉，分量足又实惠，强烈推荐。', '2周前', '2026-10-23 16:31:59');
INSERT INTO `review` VALUES (350, 70, '深夜emo食', 4, '在蜀大火锅点的蜀大鲜切黄喉，味道超出预期，环境也舒服。', '昨天', '2026-10-23 16:31:59');

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
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES (1, 'demo', '$2a$10$z3AJZVEowSWv/f0EA5LSkOOe0JMvdjwJZgpO60ObfiAvvvbslm9ey', '演示用户', 0, 1, '2026-10-23 16:31:59', '2026-10-23 16:31:59');

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
