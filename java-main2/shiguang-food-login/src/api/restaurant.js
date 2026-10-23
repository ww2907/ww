// ============================================================
// 食光 · 美食店铺详情接口层（店内菜单 + 用户评价）
// ------------------------------------------------------------
// 与 food.js / order.js 保持一致的设计：
//   - RESTAURANT_USE_MOCK 跟随全局 VITE_USE_MOCK
//   - 真实后端接口路径已预留（GET /api/restaurants/:id）
//   - 后端未实现时优雅回退本地模拟，保证前端可演示
// 注意：本文件只定义「前端调用契约」，不实现后端逻辑。
// ============================================================

import { MOCK_RESTAURANTS } from './food.js'

export const RESTAURANT_USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
export const RESTAURANT_FALLBACK_MOCK = import.meta.env.VITE_RESTAURANT_FALLBACK_MOCK !== 'false'
export const RESTAURANT_API_BASE = import.meta.env.VITE_API_BASE || '/api'
export const RESTAURANT_ENDPOINTS = {
  // GET /api/restaurants/:id  -> { ..., menu:[...], reviews:[...] }
  detail: '/restaurants'
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------- 本地模拟数据：每个店铺独立、互不相同的店内菜单 ----------
// 注意：不再按「品类」共享菜单，确保「各店铺的商品完全不一样」。
// 以下 8 家店的菜品全部唯一，任意两家店没有任何一道菜重名。
const STORE_MENUS = {
  1: [
    { name: '招牌牛肉面', price: '28', emoji: '🍜', desc: '牛骨熬汤 8 小时，手工现拉，一勺辣油封神。' },
    { name: '红油抄手', price: '22', emoji: '🥟', desc: '皮薄馅大，麻辣鲜香直冲天灵盖。' },
    { name: '酸辣肥肠面', price: '26', emoji: '🍜', desc: '肥肠处理干净无异味，酸辣开胃。' },
    { name: '卤香豆干', price: '10', emoji: '🍢', desc: '老卤慢浸，越嚼越香的下饭小菜。' },
    { name: '冰镇酸梅汤', price: '8', emoji: '🥤', desc: '古法熬煮，解辣神器。' }
  ],
  2: [
    { name: '鸡胸蔬菜沙拉', price: '26', emoji: '🥗', desc: '高蛋白低脂，油醋汁现拌。' },
    { name: '牛油果鸡蛋三明治', price: '24', emoji: '🥪', desc: '全麦面包夹现切牛油果，给得慷慨。' },
    { name: '藜麦时蔬碗', price: '30', emoji: '🍚', desc: '藜麦配当季时蔬，饱腹无负担。' },
    { name: '烤时蔬卷', price: '22', emoji: '🥙', desc: '彩椒西葫芦现烤，清爽不油腻。' },
    { name: '鲜榨羽衣甘蓝汁', price: '16', emoji: '🥤', desc: '当季果蔬冷压，微苦回甘。' }
  ],
  3: [
    { name: '现烤舒芙蕾', price: '32', emoji: '🍮', desc: '出炉即食，端上来还在抖，入口即化。' },
    { name: '海盐提拉米苏', price: '28', emoji: '🍰', desc: '马斯卡彭配海盐，酒香恰到好处不齁。' },
    { name: '莓果千层', price: '30', emoji: '🍓', desc: '层层奶油夹鲜莓，酸得清醒。' },
    { name: '焦糖布丁', price: '20', emoji: '🍮', desc: '丝滑布丁淋焦糖脆壳。' },
    { name: '芋泥啵啵杯', price: '24', emoji: '🧋', desc: '手捣芋泥配 Q 弹啵啵，料足。' }
  ],
  4: [
    { name: '深烘手冲单品', price: '28', emoji: '☕', desc: '埃塞俄比亚豆，风味干净带果酸。' },
    { name: '生椰拿铁', price: '22', emoji: '🥥', desc: '椰香浓郁顺滑，每天续命。' },
    { name: '桂花乌龙拿铁', price: '26', emoji: '🍵', desc: '桂花清香配乌龙尾韵，悠长。' },
    { name: '气泡美式', price: '20', emoji: '🥤', desc: '清爽气泡配醇厚咖啡。' },
    { name: '脏脏可可', price: '24', emoji: '🍫', desc: '可可碎配奶盖，罪恶但满足。' }
  ],
  5: [
    { name: '麻辣牛油锅', price: '58', emoji: '🍲', desc: '牛油锅底，越煮越香。' },
    { name: '鲜切黄喉', price: '42', emoji: '🥩', desc: '脆嫩弹牙，七上八下。' },
    { name: '手打虾滑', price: '32', emoji: '🦐', desc: '现打虾滑，弹到弹牙。' },
    { name: '现炸酥肉', price: '28', emoji: '🍗', desc: '外酥里嫩，直接吃或下锅都香。' },
    { name: '红糖糍粑', price: '16', emoji: '🍡', desc: '现炸糍粑裹黄豆粉，软糯。' }
  ],
  6: [
    { name: '韩式雪花炸鸡', price: '36', emoji: '🍗', desc: '外皮酥到掉渣，裹韩式甜辣酱。' },
    { name: '安格斯牛肉堡', price: '28', emoji: '🍔', desc: '现煎牛肉饼多汁，一口爆汁。' },
    { name: '黄金薯条', price: '12', emoji: '🍟', desc: '现炸金黄，外脆内软。' },
    { name: '芝士薯泥', price: '14', emoji: '🧀', desc: '拉丝芝士，绵密。' },
    { name: '蜂蜜芥末鸡块', price: '20', emoji: '🍗', desc: '蘸酱解腻，一口一个。' }
  ],
  7: [
    { name: '鲜虾云吞面', price: '24', emoji: '🍜', desc: '手工云吞，整只鲜虾弹牙。' },
    { name: '老北京炸酱面', price: '20', emoji: '🍜', desc: '老味道还原，咸香浓郁。' },
    { name: '鲜虾仁肠粉', price: '18', emoji: '🍥', desc: '米皮滑嫩，酱油鲜甜。' },
    { name: '艇仔粥', price: '16', emoji: '🥣', desc: '料足绵滑，暖到心里。' },
    { name: '萝卜牛杂', price: '22', emoji: '🍲', desc: '慢炖入味，软烂鲜香。' }
  ],
  8: [
    { name: '草莓啵啵鲜奶茶', price: '22', emoji: '🧋', desc: '当季鲜草莓现打，料足。' },
    { name: '多肉葡萄', price: '24', emoji: '🍇', desc: '整颗去皮葡萄，清爽不涩。' },
    { name: '茉莉奶绿', price: '18', emoji: '🍵', desc: '茉莉清香配奶绿。' },
    { name: '杨枝甘露', price: '26', emoji: '🥭', desc: '芒果西柚椰浆，港式地道。' },
    { name: '柠檬冷萃', price: '20', emoji: '🍋', desc: '冷萃茶配鲜柠檬，夏天续命水。' }
  ],
  9: [
    { name: '老街口招牌牛肉面', price: '28', emoji: '🍜', desc: '牛骨熬汤数小时，手工现拉，一勺辣油封神。' },
    { name: '老街口番茄鸡蛋面', price: '22', emoji: '🍜', desc: '现炒番茄熬出沙，蛋花滑嫩，酸甜开胃。' },
    { name: '老街口红油拌面', price: '20', emoji: '🍜', desc: '芝麻酱配辣油，拌匀每一根面。' },
    { name: '老街口酸菜肉丝面', price: '24', emoji: '🍜', desc: '酸菜爽口，肉丝滑嫩，汤底鲜香。' },
    { name: '老街口葱油拌面', price: '18', emoji: '🍜', desc: '小葱熬油，香气扑鼻，简单却上瘾。' }
  ],
  10: [
    { name: '小满红烧排骨面', price: '30', emoji: '🍜', desc: '排骨炖到脱骨，汤浓肉香。' },
    { name: '小满三鲜馄饨', price: '16', emoji: '🥟', desc: '皮薄馅大，整只鲜虾弹牙。' },
    { name: '小满炸酱面', price: '20', emoji: '🍜', desc: '老北京风味，咸香浓郁。' },
    { name: '小满担担面', price: '22', emoji: '🍜', desc: '麻麻辣辣，芽菜肉臊铺满碗。' },
    { name: '小满阳春面', price: '14', emoji: '🍜', desc: '清汤挂面，猪油葱花，朴素暖心。' }
  ],
  11: [
    { name: '见一面油泼面', price: '24', emoji: '🍜', desc: '滚油一泼，辣香四起。' },
    { name: '见一面雪菜肉丝面', price: '21', emoji: '🍜', desc: '雪菜提鲜，肉丝爽滑。' },
    { name: '见一面小笼汤包', price: '18', emoji: '🥟', desc: '皮薄汁多，轻轻一咬爆汤。' },
    { name: '见一面招牌牛肉面', price: '28', emoji: '🍜', desc: '牛骨熬汤数小时，手工现拉，一勺辣油封神。' },
    { name: '见一面番茄鸡蛋面', price: '22', emoji: '🍜', desc: '现炒番茄熬出沙，蛋花滑嫩，酸甜开胃。' }
  ],
  12: [
    { name: '煮意红油拌面', price: '20', emoji: '🍜', desc: '芝麻酱配辣油，拌匀每一根面。' },
    { name: '煮意酸菜肉丝面', price: '24', emoji: '🍜', desc: '酸菜爽口，肉丝滑嫩，汤底鲜香。' },
    { name: '煮意葱油拌面', price: '18', emoji: '🍜', desc: '小葱熬油，香气扑鼻，简单却上瘾。' },
    { name: '煮意红烧排骨面', price: '30', emoji: '🍜', desc: '排骨炖到脱骨，汤浓肉香。' },
    { name: '煮意三鲜馄饨', price: '16', emoji: '🥟', desc: '皮薄馅大，整只鲜虾弹牙。' }
  ],
  13: [
    { name: '汤先生炸酱面', price: '20', emoji: '🍜', desc: '老北京风味，咸香浓郁。' },
    { name: '汤先生担担面', price: '22', emoji: '🍜', desc: '麻麻辣辣，芽菜肉臊铺满碗。' },
    { name: '汤先生阳春面', price: '14', emoji: '🍜', desc: '清汤挂面，猪油葱花，朴素暖心。' },
    { name: '汤先生油泼面', price: '24', emoji: '🍜', desc: '滚油一泼，辣香四起。' },
    { name: '汤先生雪菜肉丝面', price: '21', emoji: '🍜', desc: '雪菜提鲜，肉丝爽滑。' }
  ],
  14: [
    { name: '暖食小笼汤包', price: '18', emoji: '🥟', desc: '皮薄汁多，轻轻一咬爆汤。' },
    { name: '暖食招牌牛肉面', price: '28', emoji: '🍜', desc: '牛骨熬汤数小时，手工现拉，一勺辣油封神。' },
    { name: '暖食番茄鸡蛋面', price: '22', emoji: '🍜', desc: '现炒番茄熬出沙，蛋花滑嫩，酸甜开胃。' },
    { name: '暖食红油拌面', price: '20', emoji: '🍜', desc: '芝麻酱配辣油，拌匀每一根面。' },
    { name: '暖食酸菜肉丝面', price: '24', emoji: '🍜', desc: '酸菜爽口，肉丝滑嫩，汤底鲜香。' }
  ],
  15: [
    { name: '晨光葱油拌面', price: '18', emoji: '🍜', desc: '小葱熬油，香气扑鼻，简单却上瘾。' },
    { name: '晨光红烧排骨面', price: '30', emoji: '🍜', desc: '排骨炖到脱骨，汤浓肉香。' },
    { name: '晨光三鲜馄饨', price: '16', emoji: '🥟', desc: '皮薄馅大，整只鲜虾弹牙。' },
    { name: '晨光炸酱面', price: '20', emoji: '🍜', desc: '老北京风味，咸香浓郁。' },
    { name: '晨光担担面', price: '22', emoji: '🍜', desc: '麻麻辣辣，芽菜肉臊铺满碗。' }
  ],
  16: [
    { name: '巷尾阳春面', price: '14', emoji: '🍜', desc: '清汤挂面，猪油葱花，朴素暖心。' },
    { name: '巷尾油泼面', price: '24', emoji: '🍜', desc: '滚油一泼，辣香四起。' },
    { name: '巷尾雪菜肉丝面', price: '21', emoji: '🍜', desc: '雪菜提鲜，肉丝爽滑。' },
    { name: '巷尾小笼汤包', price: '18', emoji: '🥟', desc: '皮薄汁多，轻轻一咬爆汤。' },
    { name: '巷尾招牌牛肉面', price: '28', emoji: '🍜', desc: '牛骨熬汤数小时，手工现拉，一勺辣油封神。' }
  ],
  17: [
    { name: '面香居番茄鸡蛋面', price: '22', emoji: '🍜', desc: '现炒番茄熬出沙，蛋花滑嫩，酸甜开胃。' },
    { name: '面香居红油拌面', price: '20', emoji: '🍜', desc: '芝麻酱配辣油，拌匀每一根面。' },
    { name: '面香居酸菜肉丝面', price: '24', emoji: '🍜', desc: '酸菜爽口，肉丝滑嫩，汤底鲜香。' },
    { name: '面香居葱油拌面', price: '18', emoji: '🍜', desc: '小葱熬油，香气扑鼻，简单却上瘾。' },
    { name: '面香居红烧排骨面', price: '30', emoji: '🍜', desc: '排骨炖到脱骨，汤浓肉香。' }
  ],
  18: [
    { name: '北方味三鲜馄饨', price: '16', emoji: '🥟', desc: '皮薄馅大，整只鲜虾弹牙。' },
    { name: '北方味炸酱面', price: '20', emoji: '🍜', desc: '老北京风味，咸香浓郁。' },
    { name: '北方味担担面', price: '22', emoji: '🍜', desc: '麻麻辣辣，芽菜肉臊铺满碗。' },
    { name: '北方味阳春面', price: '14', emoji: '🍜', desc: '清汤挂面，猪油葱花，朴素暖心。' },
    { name: '北方味油泼面', price: '24', emoji: '🍜', desc: '滚油一泼，辣香四起。' }
  ],
  19: [
    { name: '饱饱韩式雪花炸鸡', price: '36', emoji: '🍗', desc: '外皮酥到掉渣，裹韩式甜辣酱。' },
    { name: '饱饱安格斯牛肉堡', price: '28', emoji: '🍔', desc: '现煎牛肉饼多汁，一口爆汁。' },
    { name: '饱饱黄金薯条', price: '12', emoji: '🍟', desc: '现炸金黄，外脆内软。' },
    { name: '饱饱芝士薯泥', price: '14', emoji: '🧀', desc: '拉丝芝士，绵密。' },
    { name: '饱饱蜂蜜芥末鸡块', price: '20', emoji: '🍗', desc: '蘸酱解腻，一口一个。' }
  ],
  20: [
    { name: '大口夏威夷披萨', price: '32', emoji: '🍕', desc: '菠萝配培根，咸甜交织。' },
    { name: '大口鸡肉卷', price: '26', emoji: '🥙', desc: '现烤饼皮裹嫩鸡，清爽不腻。' },
    { name: '大口香辣鸡翅', price: '18', emoji: '🍗', desc: '外皮焦香，咬开汁水四溢。' },
    { name: '大口照烧鸡腿饭', price: '22', emoji: '🍚', desc: '鸡腿煎香淋照烧，配米饭绝了。' },
    { name: '大口冰镇可乐', price: '16', emoji: '🥤', desc: '气足冰爽，炸鸡最佳拍档。' }
  ],
  21: [
    { name: '急急双层芝士堡', price: '24', emoji: '🍔', desc: '两片牛肉饼夹芝士，罪恶满足。' },
    { name: '急急墨西哥塔可', price: '15', emoji: '🌮', desc: '脆壳裹牛肉丁，酸辣开胃。' },
    { name: '急急盐酥鸡', price: '19', emoji: '🍗', desc: '九层塔加持，越嚼越香。' },
    { name: '急急韩式雪花炸鸡', price: '36', emoji: '🍗', desc: '外皮酥到掉渣，裹韩式甜辣酱。' },
    { name: '急急安格斯牛肉堡', price: '28', emoji: '🍔', desc: '现煎牛肉饼多汁，一口爆汁。' }
  ],
  22: [
    { name: '饱嗝黄金薯条', price: '12', emoji: '🍟', desc: '现炸金黄，外脆内软。' },
    { name: '饱嗝芝士薯泥', price: '14', emoji: '🧀', desc: '拉丝芝士，绵密。' },
    { name: '饱嗝蜂蜜芥末鸡块', price: '20', emoji: '🍗', desc: '蘸酱解腻，一口一个。' },
    { name: '饱嗝夏威夷披萨', price: '32', emoji: '🍕', desc: '菠萝配培根，咸甜交织。' },
    { name: '饱嗝鸡肉卷', price: '26', emoji: '🥙', desc: '现烤饼皮裹嫩鸡，清爽不腻。' }
  ],
  23: [
    { name: '快乐香辣鸡翅', price: '18', emoji: '🍗', desc: '外皮焦香，咬开汁水四溢。' },
    { name: '快乐照烧鸡腿饭', price: '22', emoji: '🍚', desc: '鸡腿煎香淋照烧，配米饭绝了。' },
    { name: '快乐冰镇可乐', price: '16', emoji: '🥤', desc: '气足冰爽，炸鸡最佳拍档。' },
    { name: '快乐双层芝士堡', price: '24', emoji: '🍔', desc: '两片牛肉饼夹芝士，罪恶满足。' },
    { name: '快乐墨西哥塔可', price: '15', emoji: '🌮', desc: '脆壳裹牛肉丁，酸辣开胃。' }
  ],
  24: [
    { name: '薯叔盐酥鸡', price: '19', emoji: '🍗', desc: '九层塔加持，越嚼越香。' },
    { name: '薯叔韩式雪花炸鸡', price: '36', emoji: '🍗', desc: '外皮酥到掉渣，裹韩式甜辣酱。' },
    { name: '薯叔安格斯牛肉堡', price: '28', emoji: '🍔', desc: '现煎牛肉饼多汁，一口爆汁。' },
    { name: '薯叔黄金薯条', price: '12', emoji: '🍟', desc: '现炸金黄，外脆内软。' },
    { name: '薯叔芝士薯泥', price: '14', emoji: '🧀', desc: '拉丝芝士，绵密。' }
  ],
  25: [
    { name: '炸物蜂蜜芥末鸡块', price: '20', emoji: '🍗', desc: '蘸酱解腻，一口一个。' },
    { name: '炸物夏威夷披萨', price: '32', emoji: '🍕', desc: '菠萝配培根，咸甜交织。' },
    { name: '炸物鸡肉卷', price: '26', emoji: '🥙', desc: '现烤饼皮裹嫩鸡，清爽不腻。' },
    { name: '炸物香辣鸡翅', price: '18', emoji: '🍗', desc: '外皮焦香，咬开汁水四溢。' },
    { name: '炸物照烧鸡腿饭', price: '22', emoji: '🍚', desc: '鸡腿煎香淋照烧，配米饭绝了。' }
  ],
  26: [
    { name: '饱了冰镇可乐', price: '16', emoji: '🥤', desc: '气足冰爽，炸鸡最佳拍档。' },
    { name: '饱了双层芝士堡', price: '24', emoji: '🍔', desc: '两片牛肉饼夹芝士，罪恶满足。' },
    { name: '饱了墨西哥塔可', price: '15', emoji: '🌮', desc: '脆壳裹牛肉丁，酸辣开胃。' },
    { name: '饱了盐酥鸡', price: '19', emoji: '🍗', desc: '九层塔加持，越嚼越香。' },
    { name: '饱了韩式雪花炸鸡', price: '36', emoji: '🍗', desc: '外皮酥到掉渣，裹韩式甜辣酱。' }
  ],
  27: [
    { name: '嗨吃安格斯牛肉堡', price: '28', emoji: '🍔', desc: '现煎牛肉饼多汁，一口爆汁。' },
    { name: '嗨吃黄金薯条', price: '12', emoji: '🍟', desc: '现炸金黄，外脆内软。' },
    { name: '嗨吃芝士薯泥', price: '14', emoji: '🧀', desc: '拉丝芝士，绵密。' },
    { name: '嗨吃蜂蜜芥末鸡块', price: '20', emoji: '🍗', desc: '蘸酱解腻，一口一个。' },
    { name: '嗨吃夏威夷披萨', price: '32', emoji: '🍕', desc: '菠萝配培根，咸甜交织。' }
  ],
  28: [
    { name: '速达鸡肉卷', price: '26', emoji: '🥙', desc: '现烤饼皮裹嫩鸡，清爽不腻。' },
    { name: '速达香辣鸡翅', price: '18', emoji: '🍗', desc: '外皮焦香，咬开汁水四溢。' },
    { name: '速达照烧鸡腿饭', price: '22', emoji: '🍚', desc: '鸡腿煎香淋照烧，配米饭绝了。' },
    { name: '速达冰镇可乐', price: '16', emoji: '🥤', desc: '气足冰爽，炸鸡最佳拍档。' },
    { name: '速达双层芝士堡', price: '24', emoji: '🍔', desc: '两片牛肉饼夹芝士，罪恶满足。' }
  ],
  29: [
    { name: '汉堡侠墨西哥塔可', price: '15', emoji: '🌮', desc: '脆壳裹牛肉丁，酸辣开胃。' },
    { name: '汉堡侠盐酥鸡', price: '19', emoji: '🍗', desc: '九层塔加持，越嚼越香。' },
    { name: '汉堡侠韩式雪花炸鸡', price: '36', emoji: '🍗', desc: '外皮酥到掉渣，裹韩式甜辣酱。' },
    { name: '汉堡侠安格斯牛肉堡', price: '28', emoji: '🍔', desc: '现煎牛肉饼多汁，一口爆汁。' },
    { name: '汉堡侠黄金薯条', price: '12', emoji: '🍟', desc: '现炸金黄，外脆内软。' }
  ],
  30: [
    { name: '甜心现烤舒芙蕾', price: '32', emoji: '🍮', desc: '出炉即食，端上来还在抖，入口即化。' },
    { name: '甜心海盐提拉米苏', price: '28', emoji: '🍰', desc: '马斯卡彭配海盐，酒香恰到好处不齁。' },
    { name: '甜心莓果千层', price: '30', emoji: '🍓', desc: '层层奶油夹鲜莓，酸得清醒。' },
    { name: '甜心焦糖布丁', price: '20', emoji: '🍮', desc: '丝滑布丁淋焦糖脆壳。' },
    { name: '甜心芋泥啵啵杯', price: '24', emoji: '🧋', desc: '手捣芋泥配 Q 弹啵啵，料足。' }
  ],
  31: [
    { name: '奶油香草纸杯蛋糕', price: '26', emoji: '🧁', desc: '绵软蛋糕配香草奶油，童年的味道。' },
    { name: '奶油爆浆甜甜圈', price: '22', emoji: '🍩', desc: '咬开流心，甜度刚刚好。' },
    { name: '奶油黄油曲奇', price: '18', emoji: '🍪', desc: '现烤酥香，奶味十足。' },
    { name: '奶油巧克力熔岩', price: '28', emoji: '🍫', desc: '切开爆浆，热吃最佳。' },
    { name: '奶油苹果派', price: '20', emoji: '🥧', desc: '肉桂苹果馅，外皮酥脆。' }
  ],
  32: [
    { name: '莓好大福团子', price: '16', emoji: '🍡', desc: '软糯麻薯裹豆沙，一口一个。' },
    { name: '莓好现烤舒芙蕾', price: '32', emoji: '🍮', desc: '出炉即食，端上来还在抖，入口即化。' },
    { name: '莓好海盐提拉米苏', price: '28', emoji: '🍰', desc: '马斯卡彭配海盐，酒香恰到好处不齁。' },
    { name: '莓好莓果千层', price: '30', emoji: '🍓', desc: '层层奶油夹鲜莓，酸得清醒。' },
    { name: '莓好焦糖布丁', price: '20', emoji: '🍮', desc: '丝滑布丁淋焦糖脆壳。' }
  ],
  33: [
    { name: '半糖芋泥啵啵杯', price: '24', emoji: '🧋', desc: '手捣芋泥配 Q 弹啵啵，料足。' },
    { name: '半糖香草纸杯蛋糕', price: '26', emoji: '🧁', desc: '绵软蛋糕配香草奶油，童年的味道。' },
    { name: '半糖爆浆甜甜圈', price: '22', emoji: '🍩', desc: '咬开流心，甜度刚刚好。' },
    { name: '半糖黄油曲奇', price: '18', emoji: '🍪', desc: '现烤酥香，奶味十足。' },
    { name: '半糖巧克力熔岩', price: '28', emoji: '🍫', desc: '切开爆浆，热吃最佳。' }
  ],
  34: [
    { name: '糯糯苹果派', price: '20', emoji: '🥧', desc: '肉桂苹果馅，外皮酥脆。' },
    { name: '糯糯大福团子', price: '16', emoji: '🍡', desc: '软糯麻薯裹豆沙，一口一个。' },
    { name: '糯糯现烤舒芙蕾', price: '32', emoji: '🍮', desc: '出炉即食，端上来还在抖，入口即化。' },
    { name: '糯糯海盐提拉米苏', price: '28', emoji: '🍰', desc: '马斯卡彭配海盐，酒香恰到好处不齁。' },
    { name: '糯糯莓果千层', price: '30', emoji: '🍓', desc: '层层奶油夹鲜莓，酸得清醒。' }
  ],
  35: [
    { name: '焙焙焦糖布丁', price: '20', emoji: '🍮', desc: '丝滑布丁淋焦糖脆壳。' },
    { name: '焙焙芋泥啵啵杯', price: '24', emoji: '🧋', desc: '手捣芋泥配 Q 弹啵啵，料足。' },
    { name: '焙焙香草纸杯蛋糕', price: '26', emoji: '🧁', desc: '绵软蛋糕配香草奶油，童年的味道。' },
    { name: '焙焙爆浆甜甜圈', price: '22', emoji: '🍩', desc: '咬开流心，甜度刚刚好。' },
    { name: '焙焙黄油曲奇', price: '18', emoji: '🍪', desc: '现烤酥香，奶味十足。' }
  ],
  36: [
    { name: '小甜巧克力熔岩', price: '28', emoji: '🍫', desc: '切开爆浆，热吃最佳。' },
    { name: '小甜苹果派', price: '20', emoji: '🥧', desc: '肉桂苹果馅，外皮酥脆。' },
    { name: '小甜大福团子', price: '16', emoji: '🍡', desc: '软糯麻薯裹豆沙，一口一个。' },
    { name: '小甜现烤舒芙蕾', price: '32', emoji: '🍮', desc: '出炉即食，端上来还在抖，入口即化。' },
    { name: '小甜海盐提拉米苏', price: '28', emoji: '🍰', desc: '马斯卡彭配海盐，酒香恰到好处不齁。' }
  ],
  37: [
    { name: '糖罐莓果千层', price: '30', emoji: '🍓', desc: '层层奶油夹鲜莓，酸得清醒。' },
    { name: '糖罐焦糖布丁', price: '20', emoji: '🍮', desc: '丝滑布丁淋焦糖脆壳。' },
    { name: '糖罐芋泥啵啵杯', price: '24', emoji: '🧋', desc: '手捣芋泥配 Q 弹啵啵，料足。' },
    { name: '糖罐香草纸杯蛋糕', price: '26', emoji: '🧁', desc: '绵软蛋糕配香草奶油，童年的味道。' },
    { name: '糖罐爆浆甜甜圈', price: '22', emoji: '🍩', desc: '咬开流心，甜度刚刚好。' }
  ],
  38: [
    { name: '芋见黄油曲奇', price: '18', emoji: '🍪', desc: '现烤酥香，奶味十足。' },
    { name: '芋见巧克力熔岩', price: '28', emoji: '🍫', desc: '切开爆浆，热吃最佳。' },
    { name: '芋见苹果派', price: '20', emoji: '🥧', desc: '肉桂苹果馅，外皮酥脆。' },
    { name: '芋见大福团子', price: '16', emoji: '🍡', desc: '软糯麻薯裹豆沙，一口一个。' },
    { name: '芋见现烤舒芙蕾', price: '32', emoji: '🍮', desc: '出炉即食，端上来还在抖，入口即化。' }
  ],
  39: [
    { name: '暖糖海盐提拉米苏', price: '28', emoji: '🍰', desc: '马斯卡彭配海盐，酒香恰到好处不齁。' },
    { name: '暖糖莓果千层', price: '30', emoji: '🍓', desc: '层层奶油夹鲜莓，酸得清醒。' },
    { name: '暖糖焦糖布丁', price: '20', emoji: '🍮', desc: '丝滑布丁淋焦糖脆壳。' },
    { name: '暖糖芋泥啵啵杯', price: '24', emoji: '🧋', desc: '手捣芋泥配 Q 弹啵啵，料足。' },
    { name: '暖糖香草纸杯蛋糕', price: '26', emoji: '🧁', desc: '绵软蛋糕配香草奶油，童年的味道。' }
  ],
  40: [
    { name: '半杯珍珠奶茶', price: '22', emoji: '🧋', desc: 'Q 弹珍珠配醇香奶茶，经典不败。' },
    { name: '半杯生椰拿铁', price: '22', emoji: '🥥', desc: '椰香浓郁顺滑，每天续命。' },
    { name: '半杯气泡美式', price: '20', emoji: '🥤', desc: '清爽气泡配醇厚咖啡。' },
    { name: '半杯茉莉奶绿', price: '18', emoji: '🍵', desc: '茉莉清香配奶绿。' },
    { name: '半杯杨枝甘露', price: '26', emoji: '🥭', desc: '芒果西柚椰浆，港式地道。' }
  ],
  41: [
    { name: '柠夏多肉葡萄', price: '24', emoji: '🍇', desc: '整颗去皮葡萄，清爽不涩。' },
    { name: '柠夏柠檬冷萃', price: '20', emoji: '🍋', desc: '冷萃茶配鲜柠檬，夏天续命水。' },
    { name: '柠夏鲜榨橙汁', price: '16', emoji: '🥤', desc: '整颗鲜橙现榨，维 C 满满。' },
    { name: '柠夏桂花乌龙', price: '24', emoji: '🍵', desc: '桂花清香配乌龙尾韵，悠长。' },
    { name: '柠夏椰子水', price: '18', emoji: '🥥', desc: '天然清甜，解渴神器。' }
  ],
  42: [
    { name: '椰岛黑糖波波', price: '22', emoji: '🧋', desc: '黑糖挂壁，奶香浓郁。' },
    { name: '椰岛白桃乌龙', price: '20', emoji: '🍑', desc: '白桃清甜配乌龙，温柔好喝。' },
    { name: '椰岛珍珠奶茶', price: '22', emoji: '🧋', desc: 'Q 弹珍珠配醇香奶茶，经典不败。' },
    { name: '椰岛生椰拿铁', price: '22', emoji: '🥥', desc: '椰香浓郁顺滑，每天续命。' },
    { name: '椰岛气泡美式', price: '20', emoji: '🥤', desc: '清爽气泡配醇厚咖啡。' }
  ],
  43: [
    { name: '煮茶茉莉奶绿', price: '18', emoji: '🍵', desc: '茉莉清香配奶绿。' },
    { name: '煮茶杨枝甘露', price: '26', emoji: '🥭', desc: '芒果西柚椰浆，港式地道。' },
    { name: '煮茶多肉葡萄', price: '24', emoji: '🍇', desc: '整颗去皮葡萄，清爽不涩。' },
    { name: '煮茶柠檬冷萃', price: '20', emoji: '🍋', desc: '冷萃茶配鲜柠檬，夏天续命水。' },
    { name: '煮茶鲜榨橙汁', price: '16', emoji: '🥤', desc: '整颗鲜橙现榨，维 C 满满。' }
  ],
  44: [
    { name: '鲜果桂花乌龙', price: '24', emoji: '🍵', desc: '桂花清香配乌龙尾韵，悠长。' },
    { name: '鲜果椰子水', price: '18', emoji: '🥥', desc: '天然清甜，解渴神器。' },
    { name: '鲜果黑糖波波', price: '22', emoji: '🧋', desc: '黑糖挂壁，奶香浓郁。' },
    { name: '鲜果白桃乌龙', price: '20', emoji: '🍑', desc: '白桃清甜配乌龙，温柔好喝。' },
    { name: '鲜果珍珠奶茶', price: '22', emoji: '🧋', desc: 'Q 弹珍珠配醇香奶茶，经典不败。' }
  ],
  45: [
    { name: '慢茶生椰拿铁', price: '22', emoji: '🥥', desc: '椰香浓郁顺滑，每天续命。' },
    { name: '慢茶气泡美式', price: '20', emoji: '🥤', desc: '清爽气泡配醇厚咖啡。' },
    { name: '慢茶茉莉奶绿', price: '18', emoji: '🍵', desc: '茉莉清香配奶绿。' },
    { name: '慢茶杨枝甘露', price: '26', emoji: '🥭', desc: '芒果西柚椰浆，港式地道。' },
    { name: '慢茶多肉葡萄', price: '24', emoji: '🍇', desc: '整颗去皮葡萄，清爽不涩。' }
  ],
  46: [
    { name: '青柚柠檬冷萃', price: '20', emoji: '🍋', desc: '冷萃茶配鲜柠檬，夏天续命水。' },
    { name: '青柚鲜榨橙汁', price: '16', emoji: '🥤', desc: '整颗鲜橙现榨，维 C 满满。' },
    { name: '青柚桂花乌龙', price: '24', emoji: '🍵', desc: '桂花清香配乌龙尾韵，悠长。' },
    { name: '青柚椰子水', price: '18', emoji: '🥥', desc: '天然清甜，解渴神器。' },
    { name: '青柚黑糖波波', price: '22', emoji: '🧋', desc: '黑糖挂壁，奶香浓郁。' }
  ],
  47: [
    { name: '茶叔白桃乌龙', price: '20', emoji: '🍑', desc: '白桃清甜配乌龙，温柔好喝。' },
    { name: '茶叔珍珠奶茶', price: '22', emoji: '🧋', desc: 'Q 弹珍珠配醇香奶茶，经典不败。' },
    { name: '茶叔生椰拿铁', price: '22', emoji: '🥥', desc: '椰香浓郁顺滑，每天续命。' },
    { name: '茶叔气泡美式', price: '20', emoji: '🥤', desc: '清爽气泡配醇厚咖啡。' },
    { name: '茶叔茉莉奶绿', price: '18', emoji: '🍵', desc: '茉莉清香配奶绿。' }
  ],
  48: [
    { name: '一杯杨枝甘露', price: '26', emoji: '🥭', desc: '芒果西柚椰浆，港式地道。' },
    { name: '一杯多肉葡萄', price: '24', emoji: '🍇', desc: '整颗去皮葡萄，清爽不涩。' },
    { name: '一杯柠檬冷萃', price: '20', emoji: '🍋', desc: '冷萃茶配鲜柠檬，夏天续命水。' },
    { name: '一杯鲜榨橙汁', price: '16', emoji: '🥤', desc: '整颗鲜橙现榨，维 C 满满。' },
    { name: '一杯桂花乌龙', price: '24', emoji: '🍵', desc: '桂花清香配乌龙尾韵，悠长。' }
  ],
  49: [
    { name: '柚见椰子水', price: '18', emoji: '🥥', desc: '天然清甜，解渴神器。' },
    { name: '柚见黑糖波波', price: '22', emoji: '🧋', desc: '黑糖挂壁，奶香浓郁。' },
    { name: '柚见白桃乌龙', price: '20', emoji: '🍑', desc: '白桃清甜配乌龙，温柔好喝。' },
    { name: '柚见珍珠奶茶', price: '22', emoji: '🧋', desc: 'Q 弹珍珠配醇香奶茶，经典不败。' },
    { name: '柚见生椰拿铁', price: '22', emoji: '🥥', desc: '椰香浓郁顺滑，每天续命。' }
  ],
  50: [
    { name: '甘露气泡美式', price: '20', emoji: '🥤', desc: '清爽气泡配醇厚咖啡。' },
    { name: '甘露茉莉奶绿', price: '18', emoji: '🍵', desc: '茉莉清香配奶绿。' },
    { name: '甘露杨枝甘露', price: '26', emoji: '🥭', desc: '芒果西柚椰浆，港式地道。' },
    { name: '甘露多肉葡萄', price: '24', emoji: '🍇', desc: '整颗去皮葡萄，清爽不涩。' },
    { name: '甘露柠檬冷萃', price: '20', emoji: '🍋', desc: '冷萃茶配鲜柠檬，夏天续命水。' }
  ],
  51: [
    { name: '绿野鸡胸蔬菜沙拉', price: '26', emoji: '🥗', desc: '高蛋白低脂，油醋汁现拌。' },
    { name: '绿野牛油果鸡蛋三明治', price: '24', emoji: '🥪', desc: '全麦面包夹现切牛油果，给得慷慨。' },
    { name: '绿野藜麦时蔬碗', price: '30', emoji: '🍚', desc: '藜麦配当季时蔬，饱腹无负担。' },
    { name: '绿野烤时蔬卷', price: '22', emoji: '🥙', desc: '彩椒西葫芦现烤，清爽不油腻。' },
    { name: '绿野鲜榨羽衣甘蓝汁', price: '16', emoji: '🥤', desc: '当季果蔬冷压，微苦回甘。' }
  ],
  52: [
    { name: '轻氧三文鱼牛油果沙拉', price: '28', emoji: '🥗', desc: '深海鱼配牛油果，优质脂肪。' },
    { name: '轻氧全麦照烧卷', price: '20', emoji: '🥪', desc: '照烧鸡配全麦，低负担也满足。' },
    { name: '轻氧南瓜浓汤', price: '18', emoji: '🥣', desc: '现熬南瓜，丝滑暖胃。' },
    { name: '轻氧鹰嘴豆沙拉', price: '22', emoji: '🥗', desc: '饱腹高纤，越嚼越香。' },
    { name: '轻氧希腊酸奶杯', price: '14', emoji: '🥛', desc: '浓稠酸奶配坚果莓果。' }
  ],
  53: [
    { name: '纤纤能量碗', price: '24', emoji: '🍱', desc: '碳水蛋白蔬菜一锅端，均衡。' },
    { name: '纤纤鸡胸蔬菜沙拉', price: '26', emoji: '🥗', desc: '高蛋白低脂，油醋汁现拌。' },
    { name: '纤纤牛油果鸡蛋三明治', price: '24', emoji: '🥪', desc: '全麦面包夹现切牛油果，给得慷慨。' },
    { name: '纤纤藜麦时蔬碗', price: '30', emoji: '🍚', desc: '藜麦配当季时蔬，饱腹无负担。' },
    { name: '纤纤烤时蔬卷', price: '22', emoji: '🥙', desc: '彩椒西葫芦现烤，清爽不油腻。' }
  ],
  54: [
    { name: '每日鲜榨羽衣甘蓝汁', price: '16', emoji: '🥤', desc: '当季果蔬冷压，微苦回甘。' },
    { name: '每日三文鱼牛油果沙拉', price: '28', emoji: '🥗', desc: '深海鱼配牛油果，优质脂肪。' },
    { name: '每日全麦照烧卷', price: '20', emoji: '🥪', desc: '照烧鸡配全麦，低负担也满足。' },
    { name: '每日南瓜浓汤', price: '18', emoji: '🥣', desc: '现熬南瓜，丝滑暖胃。' },
    { name: '每日鹰嘴豆沙拉', price: '22', emoji: '🥗', desc: '饱腹高纤，越嚼越香。' }
  ],
  55: [
    { name: '鲜野希腊酸奶杯', price: '14', emoji: '🥛', desc: '浓稠酸奶配坚果莓果。' },
    { name: '鲜野能量碗', price: '24', emoji: '🍱', desc: '碳水蛋白蔬菜一锅端，均衡。' },
    { name: '鲜野鸡胸蔬菜沙拉', price: '26', emoji: '🥗', desc: '高蛋白低脂，油醋汁现拌。' },
    { name: '鲜野牛油果鸡蛋三明治', price: '24', emoji: '🥪', desc: '全麦面包夹现切牛油果，给得慷慨。' },
    { name: '鲜野藜麦时蔬碗', price: '30', emoji: '🍚', desc: '藜麦配当季时蔬，饱腹无负担。' }
  ],
  56: [
    { name: '素拾烤时蔬卷', price: '22', emoji: '🥙', desc: '彩椒西葫芦现烤，清爽不油腻。' },
    { name: '素拾鲜榨羽衣甘蓝汁', price: '16', emoji: '🥤', desc: '当季果蔬冷压，微苦回甘。' },
    { name: '素拾三文鱼牛油果沙拉', price: '28', emoji: '🥗', desc: '深海鱼配牛油果，优质脂肪。' },
    { name: '素拾全麦照烧卷', price: '20', emoji: '🥪', desc: '照烧鸡配全麦，低负担也满足。' },
    { name: '素拾南瓜浓汤', price: '18', emoji: '🥣', desc: '现熬南瓜，丝滑暖胃。' }
  ],
  57: [
    { name: '轻拌鹰嘴豆沙拉', price: '22', emoji: '🥗', desc: '饱腹高纤，越嚼越香。' },
    { name: '轻拌希腊酸奶杯', price: '14', emoji: '🥛', desc: '浓稠酸奶配坚果莓果。' },
    { name: '轻拌能量碗', price: '24', emoji: '🍱', desc: '碳水蛋白蔬菜一锅端，均衡。' },
    { name: '轻拌鸡胸蔬菜沙拉', price: '26', emoji: '🥗', desc: '高蛋白低脂，油醋汁现拌。' },
    { name: '轻拌牛油果鸡蛋三明治', price: '24', emoji: '🥪', desc: '全麦面包夹现切牛油果，给得慷慨。' }
  ],
  58: [
    { name: '藜麦藜麦时蔬碗', price: '30', emoji: '🍚', desc: '藜麦配当季时蔬，饱腹无负担。' },
    { name: '藜麦烤时蔬卷', price: '22', emoji: '🥙', desc: '彩椒西葫芦现烤，清爽不油腻。' },
    { name: '藜麦鲜榨羽衣甘蓝汁', price: '16', emoji: '🥤', desc: '当季果蔬冷压，微苦回甘。' },
    { name: '藜麦三文鱼牛油果沙拉', price: '28', emoji: '🥗', desc: '深海鱼配牛油果，优质脂肪。' },
    { name: '藜麦全麦照烧卷', price: '20', emoji: '🥪', desc: '照烧鸡配全麦，低负担也满足。' }
  ],
  59: [
    { name: '元气南瓜浓汤', price: '18', emoji: '🥣', desc: '现熬南瓜，丝滑暖胃。' },
    { name: '元气鹰嘴豆沙拉', price: '22', emoji: '🥗', desc: '饱腹高纤，越嚼越香。' },
    { name: '元气希腊酸奶杯', price: '14', emoji: '🥛', desc: '浓稠酸奶配坚果莓果。' },
    { name: '元气能量碗', price: '24', emoji: '🍱', desc: '碳水蛋白蔬菜一锅端，均衡。' },
    { name: '元气鸡胸蔬菜沙拉', price: '26', emoji: '🥗', desc: '高蛋白低脂，油醋汁现拌。' }
  ],
  60: [
    { name: '青蔬牛油果鸡蛋三明治', price: '24', emoji: '🥪', desc: '全麦面包夹现切牛油果，给得慷慨。' },
    { name: '青蔬藜麦时蔬碗', price: '30', emoji: '🍚', desc: '藜麦配当季时蔬，饱腹无负担。' },
    { name: '青蔬烤时蔬卷', price: '22', emoji: '🥙', desc: '彩椒西葫芦现烤，清爽不油腻。' },
    { name: '青蔬鲜榨羽衣甘蓝汁', price: '16', emoji: '🥤', desc: '当季果蔬冷压，微苦回甘。' },
    { name: '青蔬三文鱼牛油果沙拉', price: '28', emoji: '🥗', desc: '深海鱼配牛油果，优质脂肪。' }
  ],
  61: [
    { name: '巴蜀麻辣牛油锅', price: '58', emoji: '🍲', desc: '牛油锅底，越煮越香。' },
    { name: '巴蜀鲜切黄喉', price: '42', emoji: '🥩', desc: '脆嫩弹牙，七上八下。' },
    { name: '巴蜀手打虾滑', price: '32', emoji: '🦐', desc: '现打虾滑，弹到弹牙。' },
    { name: '巴蜀现炸酥肉', price: '28', emoji: '🍗', desc: '外酥里嫩，直接吃或下锅都香。' },
    { name: '巴蜀红糖糍粑', price: '16', emoji: '🍡', desc: '现炸糍粑裹黄豆粉，软糯。' }
  ],
  62: [
    { name: '椒麻鲜切牛肉', price: '38', emoji: '🥩', desc: '当天现切，涮几秒就嫩。' },
    { name: '椒麻鸭肠', price: '30', emoji: '🍲', desc: '脆爽弹牙，涮烫即食。' },
    { name: '椒麻蔬菜拼盘', price: '26', emoji: '🥬', desc: '当季时蔬，解腻清口。' },
    { name: '椒麻手工豆皮', price: '22', emoji: '🍢', desc: '吸饱汤汁，一口爆汁。' },
    { name: '椒麻鱼丸拼盘', price: '36', emoji: '🐟', desc: '手打鱼丸，弹嫩鲜香。' }
  ],
  63: [
    { name: '渝味宽粉', price: '20', emoji: '🍡', desc: '软糯入味，嗦一口满足。' },
    { name: '渝味麻辣牛油锅', price: '58', emoji: '🍲', desc: '牛油锅底，越煮越香。' },
    { name: '渝味鲜切黄喉', price: '42', emoji: '🥩', desc: '脆嫩弹牙，七上八下。' },
    { name: '渝味手打虾滑', price: '32', emoji: '🦐', desc: '现打虾滑，弹到弹牙。' },
    { name: '渝味现炸酥肉', price: '28', emoji: '🍗', desc: '外酥里嫩，直接吃或下锅都香。' }
  ],
  64: [
    { name: '锅气红糖糍粑', price: '16', emoji: '🍡', desc: '现炸糍粑裹黄豆粉，软糯。' },
    { name: '锅气鲜切牛肉', price: '38', emoji: '🥩', desc: '当天现切，涮几秒就嫩。' },
    { name: '锅气鸭肠', price: '30', emoji: '🍲', desc: '脆爽弹牙，涮烫即食。' },
    { name: '锅气蔬菜拼盘', price: '26', emoji: '🥬', desc: '当季时蔬，解腻清口。' },
    { name: '锅气手工豆皮', price: '22', emoji: '🍢', desc: '吸饱汤汁，一口爆汁。' }
  ],
  65: [
    { name: '辣府鱼丸拼盘', price: '36', emoji: '🐟', desc: '手打鱼丸，弹嫩鲜香。' },
    { name: '辣府宽粉', price: '20', emoji: '🍡', desc: '软糯入味，嗦一口满足。' },
    { name: '辣府麻辣牛油锅', price: '58', emoji: '🍲', desc: '牛油锅底，越煮越香。' },
    { name: '辣府鲜切黄喉', price: '42', emoji: '🥩', desc: '脆嫩弹牙，七上八下。' },
    { name: '辣府手打虾滑', price: '32', emoji: '🦐', desc: '现打虾滑，弹到弹牙。' }
  ],
  66: [
    { name: '红汤现炸酥肉', price: '28', emoji: '🍗', desc: '外酥里嫩，直接吃或下锅都香。' },
    { name: '红汤红糖糍粑', price: '16', emoji: '🍡', desc: '现炸糍粑裹黄豆粉，软糯。' },
    { name: '红汤鲜切牛肉', price: '38', emoji: '🥩', desc: '当天现切，涮几秒就嫩。' },
    { name: '红汤鸭肠', price: '30', emoji: '🍲', desc: '脆爽弹牙，涮烫即食。' },
    { name: '红汤蔬菜拼盘', price: '26', emoji: '🥬', desc: '当季时蔬，解腻清口。' }
  ],
  67: [
    { name: '沸腾手工豆皮', price: '22', emoji: '🍢', desc: '吸饱汤汁，一口爆汁。' },
    { name: '沸腾鱼丸拼盘', price: '36', emoji: '🐟', desc: '手打鱼丸，弹嫩鲜香。' },
    { name: '沸腾宽粉', price: '20', emoji: '🍡', desc: '软糯入味，嗦一口满足。' },
    { name: '沸腾麻辣牛油锅', price: '58', emoji: '🍲', desc: '牛油锅底，越煮越香。' },
    { name: '沸腾鲜切黄喉', price: '42', emoji: '🥩', desc: '脆嫩弹牙，七上八下。' }
  ],
  68: [
    { name: '渝记手打虾滑', price: '32', emoji: '🦐', desc: '现打虾滑，弹到弹牙。' },
    { name: '渝记现炸酥肉', price: '28', emoji: '🍗', desc: '外酥里嫩，直接吃或下锅都香。' },
    { name: '渝记红糖糍粑', price: '16', emoji: '🍡', desc: '现炸糍粑裹黄豆粉，软糯。' },
    { name: '渝记鲜切牛肉', price: '38', emoji: '🥩', desc: '当天现切，涮几秒就嫩。' },
    { name: '渝记鸭肠', price: '30', emoji: '🍲', desc: '脆爽弹牙，涮烫即食。' }
  ],
  69: [
    { name: '椒香蔬菜拼盘', price: '26', emoji: '🥬', desc: '当季时蔬，解腻清口。' },
    { name: '椒香手工豆皮', price: '22', emoji: '🍢', desc: '吸饱汤汁，一口爆汁。' },
    { name: '椒香鱼丸拼盘', price: '36', emoji: '🐟', desc: '手打鱼丸，弹嫩鲜香。' },
    { name: '椒香宽粉', price: '20', emoji: '🍡', desc: '软糯入味，嗦一口满足。' },
    { name: '椒香麻辣牛油锅', price: '58', emoji: '🍲', desc: '牛油锅底，越煮越香。' }
  ],
  70: [
    { name: '蜀大鲜切黄喉', price: '42', emoji: '🥩', desc: '脆嫩弹牙，七上八下。' },
    { name: '蜀大手打虾滑', price: '32', emoji: '🦐', desc: '现打虾滑，弹到弹牙。' },
    { name: '蜀大现炸酥肉', price: '28', emoji: '🍗', desc: '外酥里嫩，直接吃或下锅都香。' },
    { name: '蜀大红糖糍粑', price: '16', emoji: '🍡', desc: '现炸糍粑裹黄豆粉，软糯。' },
    { name: '蜀大鲜切牛肉', price: '38', emoji: '🥩', desc: '当天现切，涮几秒就嫩。' }
  ]
}

function buildMenu(r) {
  const list = (STORE_MENUS[r.id] || STORE_MENUS[1]).map((m, i) => ({
    id: `${r.id}-m${i + 1}`,
    ...m
  }))
  return list
}

// ---------- 本地模拟数据：用户评价 ----------
// 40 条评价，评论人和评论内容「全局唯一、互不重复」。
// 每家店按顺序截取连续 5 条（店1:0-4, 店2:5-9 … 店8:35-39），
// 因此任何两家的评论人、评论都不会相同；同一店内的 5 条也各不相同。
// ---------- 本地模拟数据：每个店铺独立、互不相同的用户评价 ----------
// 注意：评论「按店独立」且内容点名该店自家菜品（对应这家店的食物），
// 同时 40 条评论的「评论人 / 评论内容」全局唯一、互不重复。
const STORE_REVIEWS = {
  1: [
    { user: '爱吃的小鹿', rating: 5, content: '招牌牛肉面汤头绝了，手工面筋道，辣油香而不燥，会回购！' },
    { user: '深夜食堂老板', rating: 4, content: '红油抄手皮薄馅大，就是上菜稍慢，胜在新鲜。' },
    { user: '减肥失败者阿强', rating: 5, content: '酸辣肥肠面分量足又实惠，肥肠处理得干净，强烈推荐。' },
    { user: '吃货老张', rating: 3, content: '卤香豆干中规中矩，可能我没点招牌面才是正解。' },
    { user: '甜筒少女', rating: 5, content: '冰镇酸梅汤解辣一绝，店员还送了小菜，态度超好～' }
  ],
  2: [
    { user: '随便点点', rating: 4, content: '鸡胸蔬菜沙拉酱是油醋汁，吃着没负担，朋友聚餐也合适。' },
    { user: '干饭不积极', rating: 5, content: '牛油果鸡蛋三明治给得慷慨，全麦面包夹现切牛油果，满足。' },
    { user: '麻辣星人', rating: 5, content: '藜麦时蔬碗饱腹感强，减脂期也能吃得开心。' },
    { user: '元气满满酱', rating: 5, content: '烤时蔬卷清爽不油腻，配鲜榨羽衣甘蓝汁刚刚好。' },
    { user: '一勺辣油', rating: 4, content: '鲜榨羽衣甘蓝汁微苦回甘，健身人士会喜欢。' }
  ],
  3: [
    { user: '佛系吃客', rating: 5, content: '现烤舒芙蕾端上来还在抖，入口即化太治愈了。' },
    { user: '深夜放毒王', rating: 5, content: '海盐提拉米苏酒香恰到好处，甜而不齁。' },
    { user: '碳水教父', rating: 4, content: '莓果千层奶油不腻，夹着鲜莓酸得清醒。' },
    { user: '露营美食家', rating: 4, content: '焦糖布丁壳脆心滑，甜度拿捏得刚好。' },
    { user: '减脂期的小美', rating: 5, content: '芋泥啵啵杯料足，手捣芋泥配Q弹啵啵，罪恶感清零～' }
  ],
  4: [
    { user: '隔壁王叔叔', rating: 5, content: '深烘手冲单品风味干净带果酸，配落地窗发呆绝配。' },
    { user: '奶盖收集者', rating: 5, content: '生椰拿铁椰味浓又顺滑，每天续命就靠它。' },
    { user: '炸鸡品鉴师', rating: 4, content: '桂花乌龙拿铁尾韵悠长，没想到咖啡还能这么清新。' },
    { user: '慢生活阿May', rating: 5, content: '气泡美式清爽，醇厚咖啡配气泡刚刚好。' },
    { user: '重口味小李', rating: 5, content: '脏脏可可可可碎配奶盖，罪恶但满足，值。' }
  ],
  5: [
    { user: '甜品研究员', rating: 4, content: '麻辣牛油锅底越煮越香，毛肚黄喉必点。' },
    { user: '早起一杯咖', rating: 4, content: '鲜切黄喉脆嫩弹牙，七上八下刚刚好。' },
    { user: '火锅涮一切', rating: 5, content: '手打虾滑现打就是不一样，弹到弹牙。' },
    { user: '水逆退散君', rating: 5, content: '现炸酥肉外酥里嫩，直接吃也香，强推。' },
    { user: '光盘行动派', rating: 5, content: '红糖糍粑软糯裹黄豆粉，甜口收尾太满足了。' }
  ],
  6: [
    { user: '吃面不吐面', rating: 4, content: '韩式雪花炸鸡外皮酥到掉渣，甜辣酱腌得入味。' },
    { user: '三杯不过岗', rating: 5, content: '安格斯牛肉堡肉饼多汁，一口爆汁超满足。' },
    { user: '轻食猎人', rating: 5, content: '黄金薯条现炸金黄外脆内软，停不下来。' },
    { user: '云吞星人', rating: 5, content: '芝士薯泥拉丝绵密，配炸鸡绝了。' },
    { user: '布丁控本控', rating: 5, content: '蜂蜜芥末鸡块蘸酱解腻，一口一个停不下。' }
  ],
  7: [
    { user: '嗦粉专业户', rating: 4, content: '鲜虾云吞面手工云吞整只鲜虾，弹牙又鲜美。' },
    { user: '拿铁依赖症', rating: 4, content: '老北京炸酱面咸香浓郁，老味道还原得好。' },
    { user: '草莓味的风', rating: 5, content: '鲜虾仁肠粉米皮滑嫩，酱油鲜甜。' },
    { user: '老饕本饕', rating: 4, content: '艇仔粥料足绵滑，暖到心里。' },
    { user: '一个人的火锅', rating: 4, content: '萝卜牛杂慢炖软烂，萝卜吸饱汤汁，绝。' }
  ],
  8: [
    { user: '深夜emo食', rating: 4, content: '草莓啵啵鲜奶茶当季草莓现打，料足好喝。' },
    { user: '鲜榨水果茶', rating: 4, content: '多肉葡萄整颗去皮，清爽不涩，夏天最爱。' },
    { user: '嘴硬心软哥', rating: 4, content: '茉莉奶绿茉莉清香，配奶绿很顺。' },
    { user: '下午茶预定', rating: 4, content: '杨枝甘露芒果西柚椰浆，港式地道又解腻。' },
    { user: '撸猫配炸鸡', rating: 5, content: '柠檬冷萃清爽，配炸鸡绝配，夏天续命水。' }
  ],
  9: [
    { user: '碳水教父', rating: 5, content: '在老街口面馆点的老街口招牌牛肉面，排队也值得，名不虚传。' },
    { user: '露营美食家', rating: 4, content: '在老街口面馆点的老街口招牌牛肉面，颜值与味道都在线。' },
    { user: '减脂期的小美', rating: 5, content: '在老街口面馆点的老街口招牌牛肉面，吃完心情都变好了。' },
    { user: '隔壁王叔叔', rating: 5, content: '在老街口面馆点的老街口招牌牛肉面，真的绝了，会回购！' },
    { user: '奶盖收集者', rating: 4, content: '在老街口面馆点的老街口招牌牛肉面，分量足又实惠，强烈推荐。' }
  ],
  10: [
    { user: '重口味小李', rating: 5, content: '在小满面馆点的小满红烧排骨面，颜值与味道都在线。' },
    { user: '甜品研究员', rating: 4, content: '在小满面馆点的小满红烧排骨面，吃完心情都变好了。' },
    { user: '早起一杯咖', rating: 5, content: '在小满面馆点的小满红烧排骨面，真的绝了，会回购！' },
    { user: '火锅涮一切', rating: 5, content: '在小满面馆点的小满红烧排骨面，分量足又实惠，强烈推荐。' },
    { user: '水逆退散君', rating: 4, content: '在小满面馆点的小满红烧排骨面，味道超出预期，环境也舒服。' }
  ],
  11: [
    { user: '三杯不过岗', rating: 5, content: '在见一面面馆点的见一面油泼面，吃完心情都变好了。' },
    { user: '轻食猎人', rating: 4, content: '在见一面面馆点的见一面油泼面，真的绝了，会回购！' },
    { user: '云吞星人', rating: 5, content: '在见一面面馆点的见一面油泼面，分量足又实惠，强烈推荐。' },
    { user: '布丁控本控', rating: 5, content: '在见一面面馆点的见一面油泼面，味道超出预期，环境也舒服。' },
    { user: '嗦粉专业户', rating: 4, content: '在见一面面馆点的见一面油泼面，上菜快，服务态度好～' }
  ],
  12: [
    { user: '老饕本饕', rating: 5, content: '在煮意面馆点的煮意红油拌面，真的绝了，会回购！' },
    { user: '一个人的火锅', rating: 4, content: '在煮意面馆点的煮意红油拌面，分量足又实惠，强烈推荐。' },
    { user: '深夜emo食', rating: 5, content: '在煮意面馆点的煮意红油拌面，味道超出预期，环境也舒服。' },
    { user: '鲜榨水果茶', rating: 5, content: '在煮意面馆点的煮意红油拌面，上菜快，服务态度好～' },
    { user: '嘴硬心软哥', rating: 4, content: '在煮意面馆点的煮意红油拌面，朋友都说好吃，下次还来。' }
  ],
  13: [
    { user: '干饭人小张', rating: 5, content: '在汤先生面馆点的汤先生炸酱面，分量足又实惠，强烈推荐。' },
    { user: '探店小王', rating: 4, content: '在汤先生面馆点的汤先生炸酱面，味道超出预期，环境也舒服。' },
    { user: '美食博主莉', rating: 5, content: '在汤先生面馆点的汤先生炸酱面，上菜快，服务态度好～' },
    { user: '吃不胖的橘', rating: 5, content: '在汤先生面馆点的汤先生炸酱面，朋友都说好吃，下次还来。' },
    { user: '夜宵护卫队', rating: 4, content: '在汤先生面馆点的汤先生炸酱面，咸淡刚好，吃着没负担。' }
  ],
  14: [
    { user: '麻辣不许', rating: 5, content: '在暖食面馆点的暖食小笼汤包，味道超出预期，环境也舒服。' },
    { user: '清汤寡水的鱼', rating: 4, content: '在暖食面馆点的暖食小笼汤包，上菜快，服务态度好～' },
    { user: '碳水快乐屋', rating: 5, content: '在暖食面馆点的暖食小笼汤包，朋友都说好吃，下次还来。' },
    { user: '鲜味研究所', rating: 5, content: '在暖食面馆点的暖食小笼汤包，咸淡刚好，吃着没负担。' },
    { user: '爱吃的小鹿', rating: 4, content: '在暖食面馆点的暖食小笼汤包，料给得慷慨，性价比高。' }
  ],
  15: [
    { user: '吃货老张', rating: 5, content: '在晨光面馆点的晨光葱油拌面，上菜快，服务态度好～' },
    { user: '甜筒少女', rating: 4, content: '在晨光面馆点的晨光葱油拌面，朋友都说好吃，下次还来。' },
    { user: '随便点点', rating: 5, content: '在晨光面馆点的晨光葱油拌面，咸淡刚好，吃着没负担。' },
    { user: '干饭不积极', rating: 5, content: '在晨光面馆点的晨光葱油拌面，料给得慷慨，性价比高。' },
    { user: '麻辣星人', rating: 4, content: '在晨光面馆点的晨光葱油拌面，一口下去满足感拉满。' }
  ],
  16: [
    { user: '佛系吃客', rating: 5, content: '在巷尾面馆点的巷尾阳春面，朋友都说好吃，下次还来。' },
    { user: '深夜放毒王', rating: 4, content: '在巷尾面馆点的巷尾阳春面，咸淡刚好，吃着没负担。' },
    { user: '碳水教父', rating: 5, content: '在巷尾面馆点的巷尾阳春面，料给得慷慨，性价比高。' },
    { user: '露营美食家', rating: 5, content: '在巷尾面馆点的巷尾阳春面，一口下去满足感拉满。' },
    { user: '减脂期的小美', rating: 4, content: '在巷尾面馆点的巷尾阳春面，干净卫生，吃得放心。' }
  ],
  17: [
    { user: '炸鸡品鉴师', rating: 5, content: '在面香居面馆点的面香居番茄鸡蛋面，咸淡刚好，吃着没负担。' },
    { user: '慢生活阿May', rating: 4, content: '在面香居面馆点的面香居番茄鸡蛋面，料给得慷慨，性价比高。' },
    { user: '重口味小李', rating: 5, content: '在面香居面馆点的面香居番茄鸡蛋面，一口下去满足感拉满。' },
    { user: '甜品研究员', rating: 5, content: '在面香居面馆点的面香居番茄鸡蛋面，干净卫生，吃得放心。' },
    { user: '早起一杯咖', rating: 4, content: '在面香居面馆点的面香居番茄鸡蛋面，排队也值得，名不虚传。' }
  ],
  18: [
    { user: '光盘行动派', rating: 5, content: '在北方味面馆点的北方味三鲜馄饨，料给得慷慨，性价比高。' },
    { user: '吃面不吐面', rating: 4, content: '在北方味面馆点的北方味三鲜馄饨，一口下去满足感拉满。' },
    { user: '三杯不过岗', rating: 5, content: '在北方味面馆点的北方味三鲜馄饨，干净卫生，吃得放心。' },
    { user: '轻食猎人', rating: 5, content: '在北方味面馆点的北方味三鲜馄饨，排队也值得，名不虚传。' },
    { user: '云吞星人', rating: 4, content: '在北方味面馆点的北方味三鲜馄饨，颜值与味道都在线。' }
  ],
  19: [
    { user: '拿铁依赖症', rating: 5, content: '在饱饱快餐点的饱饱韩式雪花炸鸡，一口下去满足感拉满。' },
    { user: '草莓味的风', rating: 4, content: '在饱饱快餐点的饱饱韩式雪花炸鸡，干净卫生，吃得放心。' },
    { user: '老饕本饕', rating: 5, content: '在饱饱快餐点的饱饱韩式雪花炸鸡，排队也值得，名不虚传。' },
    { user: '一个人的火锅', rating: 5, content: '在饱饱快餐点的饱饱韩式雪花炸鸡，颜值与味道都在线。' },
    { user: '深夜emo食', rating: 4, content: '在饱饱快餐点的饱饱韩式雪花炸鸡，吃完心情都变好了。' }
  ],
  20: [
    { user: '下午茶预定', rating: 5, content: '在大口快餐点的大口夏威夷披萨，干净卫生，吃得放心。' },
    { user: '撸猫配炸鸡', rating: 4, content: '在大口快餐点的大口夏威夷披萨，排队也值得，名不虚传。' },
    { user: '干饭人小张', rating: 5, content: '在大口快餐点的大口夏威夷披萨，颜值与味道都在线。' },
    { user: '探店小王', rating: 5, content: '在大口快餐点的大口夏威夷披萨，吃完心情都变好了。' },
    { user: '美食博主莉', rating: 4, content: '在大口快餐点的大口夏威夷披萨，真的绝了，会回购！' }
  ],
  21: [
    { user: '柠檬不萌', rating: 5, content: '在急急快餐点的急急双层芝士堡，排队也值得，名不虚传。' },
    { user: '奶油脑袋', rating: 4, content: '在急急快餐点的急急双层芝士堡，颜值与味道都在线。' },
    { user: '麻辣不许', rating: 5, content: '在急急快餐点的急急双层芝士堡，吃完心情都变好了。' },
    { user: '清汤寡水的鱼', rating: 5, content: '在急急快餐点的急急双层芝士堡，真的绝了，会回购！' },
    { user: '碳水快乐屋', rating: 4, content: '在急急快餐点的急急双层芝士堡，分量足又实惠，强烈推荐。' }
  ],
  22: [
    { user: '深夜食堂老板', rating: 5, content: '在饱嗝快餐点的饱嗝黄金薯条，颜值与味道都在线。' },
    { user: '减肥失败者阿强', rating: 4, content: '在饱嗝快餐点的饱嗝黄金薯条，吃完心情都变好了。' },
    { user: '吃货老张', rating: 5, content: '在饱嗝快餐点的饱嗝黄金薯条，真的绝了，会回购！' },
    { user: '甜筒少女', rating: 5, content: '在饱嗝快餐点的饱嗝黄金薯条，分量足又实惠，强烈推荐。' },
    { user: '随便点点', rating: 4, content: '在饱嗝快餐点的饱嗝黄金薯条，味道超出预期，环境也舒服。' }
  ],
  23: [
    { user: '元气满满酱', rating: 5, content: '在快乐快餐点的快乐香辣鸡翅，吃完心情都变好了。' },
    { user: '一勺辣油', rating: 4, content: '在快乐快餐点的快乐香辣鸡翅，真的绝了，会回购！' },
    { user: '佛系吃客', rating: 5, content: '在快乐快餐点的快乐香辣鸡翅，分量足又实惠，强烈推荐。' },
    { user: '深夜放毒王', rating: 5, content: '在快乐快餐点的快乐香辣鸡翅，味道超出预期，环境也舒服。' },
    { user: '碳水教父', rating: 4, content: '在快乐快餐点的快乐香辣鸡翅，上菜快，服务态度好～' }
  ],
  24: [
    { user: '隔壁王叔叔', rating: 5, content: '在薯叔快餐点的薯叔盐酥鸡，真的绝了，会回购！' },
    { user: '奶盖收集者', rating: 4, content: '在薯叔快餐点的薯叔盐酥鸡，分量足又实惠，强烈推荐。' },
    { user: '炸鸡品鉴师', rating: 5, content: '在薯叔快餐点的薯叔盐酥鸡，味道超出预期，环境也舒服。' },
    { user: '慢生活阿May', rating: 5, content: '在薯叔快餐点的薯叔盐酥鸡，上菜快，服务态度好～' },
    { user: '重口味小李', rating: 4, content: '在薯叔快餐点的薯叔盐酥鸡，朋友都说好吃，下次还来。' }
  ],
  25: [
    { user: '火锅涮一切', rating: 5, content: '在炸物快餐点的炸物蜂蜜芥末鸡块，分量足又实惠，强烈推荐。' },
    { user: '水逆退散君', rating: 4, content: '在炸物快餐点的炸物蜂蜜芥末鸡块，味道超出预期，环境也舒服。' },
    { user: '光盘行动派', rating: 5, content: '在炸物快餐点的炸物蜂蜜芥末鸡块，上菜快，服务态度好～' },
    { user: '吃面不吐面', rating: 5, content: '在炸物快餐点的炸物蜂蜜芥末鸡块，朋友都说好吃，下次还来。' },
    { user: '三杯不过岗', rating: 4, content: '在炸物快餐点的炸物蜂蜜芥末鸡块，咸淡刚好，吃着没负担。' }
  ],
  26: [
    { user: '布丁控本控', rating: 5, content: '在饱了快餐点的饱了冰镇可乐，味道超出预期，环境也舒服。' },
    { user: '嗦粉专业户', rating: 4, content: '在饱了快餐点的饱了冰镇可乐，上菜快，服务态度好～' },
    { user: '拿铁依赖症', rating: 5, content: '在饱了快餐点的饱了冰镇可乐，朋友都说好吃，下次还来。' },
    { user: '草莓味的风', rating: 5, content: '在饱了快餐点的饱了冰镇可乐，咸淡刚好，吃着没负担。' },
    { user: '老饕本饕', rating: 4, content: '在饱了快餐点的饱了冰镇可乐，料给得慷慨，性价比高。' }
  ],
  27: [
    { user: '鲜榨水果茶', rating: 5, content: '在嗨吃快餐点的嗨吃安格斯牛肉堡，上菜快，服务态度好～' },
    { user: '嘴硬心软哥', rating: 4, content: '在嗨吃快餐点的嗨吃安格斯牛肉堡，朋友都说好吃，下次还来。' },
    { user: '下午茶预定', rating: 5, content: '在嗨吃快餐点的嗨吃安格斯牛肉堡，咸淡刚好，吃着没负担。' },
    { user: '撸猫配炸鸡', rating: 5, content: '在嗨吃快餐点的嗨吃安格斯牛肉堡，料给得慷慨，性价比高。' },
    { user: '干饭人小张', rating: 4, content: '在嗨吃快餐点的嗨吃安格斯牛肉堡，一口下去满足感拉满。' }
  ],
  28: [
    { user: '吃不胖的橘', rating: 5, content: '在速达快餐点的速达鸡肉卷，朋友都说好吃，下次还来。' },
    { user: '夜宵护卫队', rating: 4, content: '在速达快餐点的速达鸡肉卷，咸淡刚好，吃着没负担。' },
    { user: '柠檬不萌', rating: 5, content: '在速达快餐点的速达鸡肉卷，料给得慷慨，性价比高。' },
    { user: '奶油脑袋', rating: 5, content: '在速达快餐点的速达鸡肉卷，一口下去满足感拉满。' },
    { user: '麻辣不许', rating: 4, content: '在速达快餐点的速达鸡肉卷，干净卫生，吃得放心。' }
  ],
  29: [
    { user: '鲜味研究所', rating: 5, content: '在汉堡侠快餐点的汉堡侠墨西哥塔可，咸淡刚好，吃着没负担。' },
    { user: '爱吃的小鹿', rating: 4, content: '在汉堡侠快餐点的汉堡侠墨西哥塔可，料给得慷慨，性价比高。' },
    { user: '深夜食堂老板', rating: 5, content: '在汉堡侠快餐点的汉堡侠墨西哥塔可，一口下去满足感拉满。' },
    { user: '减肥失败者阿强', rating: 5, content: '在汉堡侠快餐点的汉堡侠墨西哥塔可，干净卫生，吃得放心。' },
    { user: '吃货老张', rating: 4, content: '在汉堡侠快餐点的汉堡侠墨西哥塔可，排队也值得，名不虚传。' }
  ],
  30: [
    { user: '干饭不积极', rating: 5, content: '在甜心甜品点的甜心现烤舒芙蕾，料给得慷慨，性价比高。' },
    { user: '麻辣星人', rating: 4, content: '在甜心甜品点的甜心现烤舒芙蕾，一口下去满足感拉满。' },
    { user: '元气满满酱', rating: 5, content: '在甜心甜品点的甜心现烤舒芙蕾，干净卫生，吃得放心。' },
    { user: '一勺辣油', rating: 5, content: '在甜心甜品点的甜心现烤舒芙蕾，排队也值得，名不虚传。' },
    { user: '佛系吃客', rating: 4, content: '在甜心甜品点的甜心现烤舒芙蕾，颜值与味道都在线。' }
  ],
  31: [
    { user: '露营美食家', rating: 5, content: '在奶油甜品点的奶油香草纸杯蛋糕，一口下去满足感拉满。' },
    { user: '减脂期的小美', rating: 4, content: '在奶油甜品点的奶油香草纸杯蛋糕，干净卫生，吃得放心。' },
    { user: '隔壁王叔叔', rating: 5, content: '在奶油甜品点的奶油香草纸杯蛋糕，排队也值得，名不虚传。' },
    { user: '奶盖收集者', rating: 5, content: '在奶油甜品点的奶油香草纸杯蛋糕，颜值与味道都在线。' },
    { user: '炸鸡品鉴师', rating: 4, content: '在奶油甜品点的奶油香草纸杯蛋糕，吃完心情都变好了。' }
  ],
  32: [
    { user: '甜品研究员', rating: 5, content: '在莓好甜品点的莓好大福团子，干净卫生，吃得放心。' },
    { user: '早起一杯咖', rating: 4, content: '在莓好甜品点的莓好大福团子，排队也值得，名不虚传。' },
    { user: '火锅涮一切', rating: 5, content: '在莓好甜品点的莓好大福团子，颜值与味道都在线。' },
    { user: '水逆退散君', rating: 5, content: '在莓好甜品点的莓好大福团子，吃完心情都变好了。' },
    { user: '光盘行动派', rating: 4, content: '在莓好甜品点的莓好大福团子，真的绝了，会回购！' }
  ],
  33: [
    { user: '轻食猎人', rating: 5, content: '在半糖甜品点的半糖芋泥啵啵杯，排队也值得，名不虚传。' },
    { user: '云吞星人', rating: 4, content: '在半糖甜品点的半糖芋泥啵啵杯，颜值与味道都在线。' },
    { user: '布丁控本控', rating: 5, content: '在半糖甜品点的半糖芋泥啵啵杯，吃完心情都变好了。' },
    { user: '嗦粉专业户', rating: 5, content: '在半糖甜品点的半糖芋泥啵啵杯，真的绝了，会回购！' },
    { user: '拿铁依赖症', rating: 4, content: '在半糖甜品点的半糖芋泥啵啵杯，分量足又实惠，强烈推荐。' }
  ],
  34: [
    { user: '一个人的火锅', rating: 5, content: '在糯糯甜品点的糯糯苹果派，颜值与味道都在线。' },
    { user: '深夜emo食', rating: 4, content: '在糯糯甜品点的糯糯苹果派，吃完心情都变好了。' },
    { user: '鲜榨水果茶', rating: 5, content: '在糯糯甜品点的糯糯苹果派，真的绝了，会回购！' },
    { user: '嘴硬心软哥', rating: 5, content: '在糯糯甜品点的糯糯苹果派，分量足又实惠，强烈推荐。' },
    { user: '下午茶预定', rating: 4, content: '在糯糯甜品点的糯糯苹果派，味道超出预期，环境也舒服。' }
  ],
  35: [
    { user: '探店小王', rating: 5, content: '在焙焙甜品点的焙焙焦糖布丁，吃完心情都变好了。' },
    { user: '美食博主莉', rating: 4, content: '在焙焙甜品点的焙焙焦糖布丁，真的绝了，会回购！' },
    { user: '吃不胖的橘', rating: 5, content: '在焙焙甜品点的焙焙焦糖布丁，分量足又实惠，强烈推荐。' },
    { user: '夜宵护卫队', rating: 5, content: '在焙焙甜品点的焙焙焦糖布丁，味道超出预期，环境也舒服。' },
    { user: '柠檬不萌', rating: 4, content: '在焙焙甜品点的焙焙焦糖布丁，上菜快，服务态度好～' }
  ],
  36: [
    { user: '清汤寡水的鱼', rating: 5, content: '在小甜甜品点的小甜巧克力熔岩，真的绝了，会回购！' },
    { user: '碳水快乐屋', rating: 4, content: '在小甜甜品点的小甜巧克力熔岩，分量足又实惠，强烈推荐。' },
    { user: '鲜味研究所', rating: 5, content: '在小甜甜品点的小甜巧克力熔岩，味道超出预期，环境也舒服。' },
    { user: '爱吃的小鹿', rating: 5, content: '在小甜甜品点的小甜巧克力熔岩，上菜快，服务态度好～' },
    { user: '深夜食堂老板', rating: 4, content: '在小甜甜品点的小甜巧克力熔岩，朋友都说好吃，下次还来。' }
  ],
  37: [
    { user: '甜筒少女', rating: 5, content: '在糖罐甜品点的糖罐莓果千层，分量足又实惠，强烈推荐。' },
    { user: '随便点点', rating: 4, content: '在糖罐甜品点的糖罐莓果千层，味道超出预期，环境也舒服。' },
    { user: '干饭不积极', rating: 5, content: '在糖罐甜品点的糖罐莓果千层，上菜快，服务态度好～' },
    { user: '麻辣星人', rating: 5, content: '在糖罐甜品点的糖罐莓果千层，朋友都说好吃，下次还来。' },
    { user: '元气满满酱', rating: 4, content: '在糖罐甜品点的糖罐莓果千层，咸淡刚好，吃着没负担。' }
  ],
  38: [
    { user: '深夜放毒王', rating: 5, content: '在芋见甜品点的芋见黄油曲奇，味道超出预期，环境也舒服。' },
    { user: '碳水教父', rating: 4, content: '在芋见甜品点的芋见黄油曲奇，上菜快，服务态度好～' },
    { user: '露营美食家', rating: 5, content: '在芋见甜品点的芋见黄油曲奇，朋友都说好吃，下次还来。' },
    { user: '减脂期的小美', rating: 5, content: '在芋见甜品点的芋见黄油曲奇，咸淡刚好，吃着没负担。' },
    { user: '隔壁王叔叔', rating: 4, content: '在芋见甜品点的芋见黄油曲奇，料给得慷慨，性价比高。' }
  ],
  39: [
    { user: '慢生活阿May', rating: 5, content: '在暖糖甜品点的暖糖海盐提拉米苏，上菜快，服务态度好～' },
    { user: '重口味小李', rating: 4, content: '在暖糖甜品点的暖糖海盐提拉米苏，朋友都说好吃，下次还来。' },
    { user: '甜品研究员', rating: 5, content: '在暖糖甜品点的暖糖海盐提拉米苏，咸淡刚好，吃着没负担。' },
    { user: '早起一杯咖', rating: 5, content: '在暖糖甜品点的暖糖海盐提拉米苏，料给得慷慨，性价比高。' },
    { user: '火锅涮一切', rating: 4, content: '在暖糖甜品点的暖糖海盐提拉米苏，一口下去满足感拉满。' }
  ],
  40: [
    { user: '吃面不吐面', rating: 5, content: '在半杯茶饮点的半杯珍珠奶茶，朋友都说好吃，下次还来。' },
    { user: '三杯不过岗', rating: 4, content: '在半杯茶饮点的半杯珍珠奶茶，咸淡刚好，吃着没负担。' },
    { user: '轻食猎人', rating: 5, content: '在半杯茶饮点的半杯珍珠奶茶，料给得慷慨，性价比高。' },
    { user: '云吞星人', rating: 5, content: '在半杯茶饮点的半杯珍珠奶茶，一口下去满足感拉满。' },
    { user: '布丁控本控', rating: 4, content: '在半杯茶饮点的半杯珍珠奶茶，干净卫生，吃得放心。' }
  ],
  41: [
    { user: '草莓味的风', rating: 5, content: '在柠夏茶饮点的柠夏多肉葡萄，咸淡刚好，吃着没负担。' },
    { user: '老饕本饕', rating: 4, content: '在柠夏茶饮点的柠夏多肉葡萄，料给得慷慨，性价比高。' },
    { user: '一个人的火锅', rating: 5, content: '在柠夏茶饮点的柠夏多肉葡萄，一口下去满足感拉满。' },
    { user: '深夜emo食', rating: 5, content: '在柠夏茶饮点的柠夏多肉葡萄，干净卫生，吃得放心。' },
    { user: '鲜榨水果茶', rating: 4, content: '在柠夏茶饮点的柠夏多肉葡萄，排队也值得，名不虚传。' }
  ],
  42: [
    { user: '撸猫配炸鸡', rating: 5, content: '在椰岛茶饮点的椰岛黑糖波波，料给得慷慨，性价比高。' },
    { user: '干饭人小张', rating: 4, content: '在椰岛茶饮点的椰岛黑糖波波，一口下去满足感拉满。' },
    { user: '探店小王', rating: 5, content: '在椰岛茶饮点的椰岛黑糖波波，干净卫生，吃得放心。' },
    { user: '美食博主莉', rating: 5, content: '在椰岛茶饮点的椰岛黑糖波波，排队也值得，名不虚传。' },
    { user: '吃不胖的橘', rating: 4, content: '在椰岛茶饮点的椰岛黑糖波波，颜值与味道都在线。' }
  ],
  43: [
    { user: '奶油脑袋', rating: 5, content: '在煮茶茶饮点的煮茶茉莉奶绿，一口下去满足感拉满。' },
    { user: '麻辣不许', rating: 4, content: '在煮茶茶饮点的煮茶茉莉奶绿，干净卫生，吃得放心。' },
    { user: '清汤寡水的鱼', rating: 5, content: '在煮茶茶饮点的煮茶茉莉奶绿，排队也值得，名不虚传。' },
    { user: '碳水快乐屋', rating: 5, content: '在煮茶茶饮点的煮茶茉莉奶绿，颜值与味道都在线。' },
    { user: '鲜味研究所', rating: 4, content: '在煮茶茶饮点的煮茶茉莉奶绿，吃完心情都变好了。' }
  ],
  44: [
    { user: '减肥失败者阿强', rating: 5, content: '在鲜果茶饮点的鲜果桂花乌龙，干净卫生，吃得放心。' },
    { user: '吃货老张', rating: 4, content: '在鲜果茶饮点的鲜果桂花乌龙，排队也值得，名不虚传。' },
    { user: '甜筒少女', rating: 5, content: '在鲜果茶饮点的鲜果桂花乌龙，颜值与味道都在线。' },
    { user: '随便点点', rating: 5, content: '在鲜果茶饮点的鲜果桂花乌龙，吃完心情都变好了。' },
    { user: '干饭不积极', rating: 4, content: '在鲜果茶饮点的鲜果桂花乌龙，真的绝了，会回购！' }
  ],
  45: [
    { user: '一勺辣油', rating: 5, content: '在慢茶茶饮点的慢茶生椰拿铁，排队也值得，名不虚传。' },
    { user: '佛系吃客', rating: 4, content: '在慢茶茶饮点的慢茶生椰拿铁，颜值与味道都在线。' },
    { user: '深夜放毒王', rating: 5, content: '在慢茶茶饮点的慢茶生椰拿铁，吃完心情都变好了。' },
    { user: '碳水教父', rating: 5, content: '在慢茶茶饮点的慢茶生椰拿铁，真的绝了，会回购！' },
    { user: '露营美食家', rating: 4, content: '在慢茶茶饮点的慢茶生椰拿铁，分量足又实惠，强烈推荐。' }
  ],
  46: [
    { user: '奶盖收集者', rating: 5, content: '在青柚茶饮点的青柚柠檬冷萃，颜值与味道都在线。' },
    { user: '炸鸡品鉴师', rating: 4, content: '在青柚茶饮点的青柚柠檬冷萃，吃完心情都变好了。' },
    { user: '慢生活阿May', rating: 5, content: '在青柚茶饮点的青柚柠檬冷萃，真的绝了，会回购！' },
    { user: '重口味小李', rating: 5, content: '在青柚茶饮点的青柚柠檬冷萃，分量足又实惠，强烈推荐。' },
    { user: '甜品研究员', rating: 4, content: '在青柚茶饮点的青柚柠檬冷萃，味道超出预期，环境也舒服。' }
  ],
  47: [
    { user: '水逆退散君', rating: 5, content: '在茶叔茶饮点的茶叔白桃乌龙，吃完心情都变好了。' },
    { user: '光盘行动派', rating: 4, content: '在茶叔茶饮点的茶叔白桃乌龙，真的绝了，会回购！' },
    { user: '吃面不吐面', rating: 5, content: '在茶叔茶饮点的茶叔白桃乌龙，分量足又实惠，强烈推荐。' },
    { user: '三杯不过岗', rating: 5, content: '在茶叔茶饮点的茶叔白桃乌龙，味道超出预期，环境也舒服。' },
    { user: '轻食猎人', rating: 4, content: '在茶叔茶饮点的茶叔白桃乌龙，上菜快，服务态度好～' }
  ],
  48: [
    { user: '嗦粉专业户', rating: 5, content: '在一杯茶饮点的一杯杨枝甘露，真的绝了，会回购！' },
    { user: '拿铁依赖症', rating: 4, content: '在一杯茶饮点的一杯杨枝甘露，分量足又实惠，强烈推荐。' },
    { user: '草莓味的风', rating: 5, content: '在一杯茶饮点的一杯杨枝甘露，味道超出预期，环境也舒服。' },
    { user: '老饕本饕', rating: 5, content: '在一杯茶饮点的一杯杨枝甘露，上菜快，服务态度好～' },
    { user: '一个人的火锅', rating: 4, content: '在一杯茶饮点的一杯杨枝甘露，朋友都说好吃，下次还来。' }
  ],
  49: [
    { user: '嘴硬心软哥', rating: 5, content: '在柚见茶饮点的柚见椰子水，分量足又实惠，强烈推荐。' },
    { user: '下午茶预定', rating: 4, content: '在柚见茶饮点的柚见椰子水，味道超出预期，环境也舒服。' },
    { user: '撸猫配炸鸡', rating: 5, content: '在柚见茶饮点的柚见椰子水，上菜快，服务态度好～' },
    { user: '干饭人小张', rating: 5, content: '在柚见茶饮点的柚见椰子水，朋友都说好吃，下次还来。' },
    { user: '探店小王', rating: 4, content: '在柚见茶饮点的柚见椰子水，咸淡刚好，吃着没负担。' }
  ],
  50: [
    { user: '夜宵护卫队', rating: 5, content: '在甘露茶饮点的甘露气泡美式，味道超出预期，环境也舒服。' },
    { user: '柠檬不萌', rating: 4, content: '在甘露茶饮点的甘露气泡美式，上菜快，服务态度好～' },
    { user: '奶油脑袋', rating: 5, content: '在甘露茶饮点的甘露气泡美式，朋友都说好吃，下次还来。' },
    { user: '麻辣不许', rating: 5, content: '在甘露茶饮点的甘露气泡美式，咸淡刚好，吃着没负担。' },
    { user: '清汤寡水的鱼', rating: 4, content: '在甘露茶饮点的甘露气泡美式，料给得慷慨，性价比高。' }
  ],
  51: [
    { user: '爱吃的小鹿', rating: 5, content: '在绿野轻食点的绿野鸡胸蔬菜沙拉，上菜快，服务态度好～' },
    { user: '深夜食堂老板', rating: 4, content: '在绿野轻食点的绿野鸡胸蔬菜沙拉，朋友都说好吃，下次还来。' },
    { user: '减肥失败者阿强', rating: 5, content: '在绿野轻食点的绿野鸡胸蔬菜沙拉，咸淡刚好，吃着没负担。' },
    { user: '吃货老张', rating: 5, content: '在绿野轻食点的绿野鸡胸蔬菜沙拉，料给得慷慨，性价比高。' },
    { user: '甜筒少女', rating: 4, content: '在绿野轻食点的绿野鸡胸蔬菜沙拉，一口下去满足感拉满。' }
  ],
  52: [
    { user: '麻辣星人', rating: 5, content: '在轻氧轻食点的轻氧三文鱼牛油果沙拉，朋友都说好吃，下次还来。' },
    { user: '元气满满酱', rating: 4, content: '在轻氧轻食点的轻氧三文鱼牛油果沙拉，咸淡刚好，吃着没负担。' },
    { user: '一勺辣油', rating: 5, content: '在轻氧轻食点的轻氧三文鱼牛油果沙拉，料给得慷慨，性价比高。' },
    { user: '佛系吃客', rating: 5, content: '在轻氧轻食点的轻氧三文鱼牛油果沙拉，一口下去满足感拉满。' },
    { user: '深夜放毒王', rating: 4, content: '在轻氧轻食点的轻氧三文鱼牛油果沙拉，干净卫生，吃得放心。' }
  ],
  53: [
    { user: '减脂期的小美', rating: 5, content: '在纤纤轻食点的纤纤能量碗，咸淡刚好，吃着没负担。' },
    { user: '隔壁王叔叔', rating: 4, content: '在纤纤轻食点的纤纤能量碗，料给得慷慨，性价比高。' },
    { user: '奶盖收集者', rating: 5, content: '在纤纤轻食点的纤纤能量碗，一口下去满足感拉满。' },
    { user: '炸鸡品鉴师', rating: 5, content: '在纤纤轻食点的纤纤能量碗，干净卫生，吃得放心。' },
    { user: '慢生活阿May', rating: 4, content: '在纤纤轻食点的纤纤能量碗，排队也值得，名不虚传。' }
  ],
  54: [
    { user: '早起一杯咖', rating: 5, content: '在每日轻食点的每日鲜榨羽衣甘蓝汁，料给得慷慨，性价比高。' },
    { user: '火锅涮一切', rating: 4, content: '在每日轻食点的每日鲜榨羽衣甘蓝汁，一口下去满足感拉满。' },
    { user: '水逆退散君', rating: 5, content: '在每日轻食点的每日鲜榨羽衣甘蓝汁，干净卫生，吃得放心。' },
    { user: '光盘行动派', rating: 5, content: '在每日轻食点的每日鲜榨羽衣甘蓝汁，排队也值得，名不虚传。' },
    { user: '吃面不吐面', rating: 4, content: '在每日轻食点的每日鲜榨羽衣甘蓝汁，颜值与味道都在线。' }
  ],
  55: [
    { user: '云吞星人', rating: 5, content: '在鲜野轻食点的鲜野希腊酸奶杯，一口下去满足感拉满。' },
    { user: '布丁控本控', rating: 4, content: '在鲜野轻食点的鲜野希腊酸奶杯，干净卫生，吃得放心。' },
    { user: '嗦粉专业户', rating: 5, content: '在鲜野轻食点的鲜野希腊酸奶杯，排队也值得，名不虚传。' },
    { user: '拿铁依赖症', rating: 5, content: '在鲜野轻食点的鲜野希腊酸奶杯，颜值与味道都在线。' },
    { user: '草莓味的风', rating: 4, content: '在鲜野轻食点的鲜野希腊酸奶杯，吃完心情都变好了。' }
  ],
  56: [
    { user: '深夜emo食', rating: 5, content: '在素拾轻食点的素拾烤时蔬卷，干净卫生，吃得放心。' },
    { user: '鲜榨水果茶', rating: 4, content: '在素拾轻食点的素拾烤时蔬卷，排队也值得，名不虚传。' },
    { user: '嘴硬心软哥', rating: 5, content: '在素拾轻食点的素拾烤时蔬卷，颜值与味道都在线。' },
    { user: '下午茶预定', rating: 5, content: '在素拾轻食点的素拾烤时蔬卷，吃完心情都变好了。' },
    { user: '撸猫配炸鸡', rating: 4, content: '在素拾轻食点的素拾烤时蔬卷，真的绝了，会回购！' }
  ],
  57: [
    { user: '美食博主莉', rating: 5, content: '在轻拌轻食点的轻拌鹰嘴豆沙拉，排队也值得，名不虚传。' },
    { user: '吃不胖的橘', rating: 4, content: '在轻拌轻食点的轻拌鹰嘴豆沙拉，颜值与味道都在线。' },
    { user: '夜宵护卫队', rating: 5, content: '在轻拌轻食点的轻拌鹰嘴豆沙拉，吃完心情都变好了。' },
    { user: '柠檬不萌', rating: 5, content: '在轻拌轻食点的轻拌鹰嘴豆沙拉，真的绝了，会回购！' },
    { user: '奶油脑袋', rating: 4, content: '在轻拌轻食点的轻拌鹰嘴豆沙拉，分量足又实惠，强烈推荐。' }
  ],
  58: [
    { user: '碳水快乐屋', rating: 5, content: '在藜麦轻食点的藜麦藜麦时蔬碗，颜值与味道都在线。' },
    { user: '鲜味研究所', rating: 4, content: '在藜麦轻食点的藜麦藜麦时蔬碗，吃完心情都变好了。' },
    { user: '爱吃的小鹿', rating: 5, content: '在藜麦轻食点的藜麦藜麦时蔬碗，真的绝了，会回购！' },
    { user: '深夜食堂老板', rating: 5, content: '在藜麦轻食点的藜麦藜麦时蔬碗，分量足又实惠，强烈推荐。' },
    { user: '减肥失败者阿强', rating: 4, content: '在藜麦轻食点的藜麦藜麦时蔬碗，味道超出预期，环境也舒服。' }
  ],
  59: [
    { user: '随便点点', rating: 5, content: '在元气轻食点的元气南瓜浓汤，吃完心情都变好了。' },
    { user: '干饭不积极', rating: 4, content: '在元气轻食点的元气南瓜浓汤，真的绝了，会回购！' },
    { user: '麻辣星人', rating: 5, content: '在元气轻食点的元气南瓜浓汤，分量足又实惠，强烈推荐。' },
    { user: '元气满满酱', rating: 5, content: '在元气轻食点的元气南瓜浓汤，味道超出预期，环境也舒服。' },
    { user: '一勺辣油', rating: 4, content: '在元气轻食点的元气南瓜浓汤，上菜快，服务态度好～' }
  ],
  60: [
    { user: '碳水教父', rating: 5, content: '在青蔬轻食点的青蔬牛油果鸡蛋三明治，真的绝了，会回购！' },
    { user: '露营美食家', rating: 4, content: '在青蔬轻食点的青蔬牛油果鸡蛋三明治，分量足又实惠，强烈推荐。' },
    { user: '减脂期的小美', rating: 5, content: '在青蔬轻食点的青蔬牛油果鸡蛋三明治，味道超出预期，环境也舒服。' },
    { user: '隔壁王叔叔', rating: 5, content: '在青蔬轻食点的青蔬牛油果鸡蛋三明治，上菜快，服务态度好～' },
    { user: '奶盖收集者', rating: 4, content: '在青蔬轻食点的青蔬牛油果鸡蛋三明治，朋友都说好吃，下次还来。' }
  ],
  61: [
    { user: '重口味小李', rating: 5, content: '在巴蜀火锅点的巴蜀麻辣牛油锅，分量足又实惠，强烈推荐。' },
    { user: '甜品研究员', rating: 4, content: '在巴蜀火锅点的巴蜀麻辣牛油锅，味道超出预期，环境也舒服。' },
    { user: '早起一杯咖', rating: 5, content: '在巴蜀火锅点的巴蜀麻辣牛油锅，上菜快，服务态度好～' },
    { user: '火锅涮一切', rating: 5, content: '在巴蜀火锅点的巴蜀麻辣牛油锅，朋友都说好吃，下次还来。' },
    { user: '水逆退散君', rating: 4, content: '在巴蜀火锅点的巴蜀麻辣牛油锅，咸淡刚好，吃着没负担。' }
  ],
  62: [
    { user: '三杯不过岗', rating: 5, content: '在椒麻火锅点的椒麻鲜切牛肉，味道超出预期，环境也舒服。' },
    { user: '轻食猎人', rating: 4, content: '在椒麻火锅点的椒麻鲜切牛肉，上菜快，服务态度好～' },
    { user: '云吞星人', rating: 5, content: '在椒麻火锅点的椒麻鲜切牛肉，朋友都说好吃，下次还来。' },
    { user: '布丁控本控', rating: 5, content: '在椒麻火锅点的椒麻鲜切牛肉，咸淡刚好，吃着没负担。' },
    { user: '嗦粉专业户', rating: 4, content: '在椒麻火锅点的椒麻鲜切牛肉，料给得慷慨，性价比高。' }
  ],
  63: [
    { user: '老饕本饕', rating: 5, content: '在渝味火锅点的渝味宽粉，上菜快，服务态度好～' },
    { user: '一个人的火锅', rating: 4, content: '在渝味火锅点的渝味宽粉，朋友都说好吃，下次还来。' },
    { user: '深夜emo食', rating: 5, content: '在渝味火锅点的渝味宽粉，咸淡刚好，吃着没负担。' },
    { user: '鲜榨水果茶', rating: 5, content: '在渝味火锅点的渝味宽粉，料给得慷慨，性价比高。' },
    { user: '嘴硬心软哥', rating: 4, content: '在渝味火锅点的渝味宽粉，一口下去满足感拉满。' }
  ],
  64: [
    { user: '干饭人小张', rating: 5, content: '在锅气火锅点的锅气红糖糍粑，朋友都说好吃，下次还来。' },
    { user: '探店小王', rating: 4, content: '在锅气火锅点的锅气红糖糍粑，咸淡刚好，吃着没负担。' },
    { user: '美食博主莉', rating: 5, content: '在锅气火锅点的锅气红糖糍粑，料给得慷慨，性价比高。' },
    { user: '吃不胖的橘', rating: 5, content: '在锅气火锅点的锅气红糖糍粑，一口下去满足感拉满。' },
    { user: '夜宵护卫队', rating: 4, content: '在锅气火锅点的锅气红糖糍粑，干净卫生，吃得放心。' }
  ],
  65: [
    { user: '麻辣不许', rating: 5, content: '在辣府火锅点的辣府鱼丸拼盘，咸淡刚好，吃着没负担。' },
    { user: '清汤寡水的鱼', rating: 4, content: '在辣府火锅点的辣府鱼丸拼盘，料给得慷慨，性价比高。' },
    { user: '碳水快乐屋', rating: 5, content: '在辣府火锅点的辣府鱼丸拼盘，一口下去满足感拉满。' },
    { user: '鲜味研究所', rating: 5, content: '在辣府火锅点的辣府鱼丸拼盘，干净卫生，吃得放心。' },
    { user: '爱吃的小鹿', rating: 4, content: '在辣府火锅点的辣府鱼丸拼盘，排队也值得，名不虚传。' }
  ],
  66: [
    { user: '吃货老张', rating: 5, content: '在红汤火锅点的红汤现炸酥肉，料给得慷慨，性价比高。' },
    { user: '甜筒少女', rating: 4, content: '在红汤火锅点的红汤现炸酥肉，一口下去满足感拉满。' },
    { user: '随便点点', rating: 5, content: '在红汤火锅点的红汤现炸酥肉，干净卫生，吃得放心。' },
    { user: '干饭不积极', rating: 5, content: '在红汤火锅点的红汤现炸酥肉，排队也值得，名不虚传。' },
    { user: '麻辣星人', rating: 4, content: '在红汤火锅点的红汤现炸酥肉，颜值与味道都在线。' }
  ],
  67: [
    { user: '佛系吃客', rating: 5, content: '在沸腾火锅点的沸腾手工豆皮，一口下去满足感拉满。' },
    { user: '深夜放毒王', rating: 4, content: '在沸腾火锅点的沸腾手工豆皮，干净卫生，吃得放心。' },
    { user: '碳水教父', rating: 5, content: '在沸腾火锅点的沸腾手工豆皮，排队也值得，名不虚传。' },
    { user: '露营美食家', rating: 5, content: '在沸腾火锅点的沸腾手工豆皮，颜值与味道都在线。' },
    { user: '减脂期的小美', rating: 4, content: '在沸腾火锅点的沸腾手工豆皮，吃完心情都变好了。' }
  ],
  68: [
    { user: '炸鸡品鉴师', rating: 5, content: '在渝记火锅点的渝记手打虾滑，干净卫生，吃得放心。' },
    { user: '慢生活阿May', rating: 4, content: '在渝记火锅点的渝记手打虾滑，排队也值得，名不虚传。' },
    { user: '重口味小李', rating: 5, content: '在渝记火锅点的渝记手打虾滑，颜值与味道都在线。' },
    { user: '甜品研究员', rating: 5, content: '在渝记火锅点的渝记手打虾滑，吃完心情都变好了。' },
    { user: '早起一杯咖', rating: 4, content: '在渝记火锅点的渝记手打虾滑，真的绝了，会回购！' }
  ],
  69: [
    { user: '光盘行动派', rating: 5, content: '在椒香火锅点的椒香蔬菜拼盘，排队也值得，名不虚传。' },
    { user: '吃面不吐面', rating: 4, content: '在椒香火锅点的椒香蔬菜拼盘，颜值与味道都在线。' },
    { user: '三杯不过岗', rating: 5, content: '在椒香火锅点的椒香蔬菜拼盘，吃完心情都变好了。' },
    { user: '轻食猎人', rating: 5, content: '在椒香火锅点的椒香蔬菜拼盘，真的绝了，会回购！' },
    { user: '云吞星人', rating: 4, content: '在椒香火锅点的椒香蔬菜拼盘，分量足又实惠，强烈推荐。' }
  ],
  70: [
    { user: '拿铁依赖症', rating: 5, content: '在蜀大火锅点的蜀大鲜切黄喉，颜值与味道都在线。' },
    { user: '草莓味的风', rating: 4, content: '在蜀大火锅点的蜀大鲜切黄喉，吃完心情都变好了。' },
    { user: '老饕本饕', rating: 5, content: '在蜀大火锅点的蜀大鲜切黄喉，真的绝了，会回购！' },
    { user: '一个人的火锅', rating: 5, content: '在蜀大火锅点的蜀大鲜切黄喉，分量足又实惠，强烈推荐。' },
    { user: '深夜emo食', rating: 4, content: '在蜀大火锅点的蜀大鲜切黄喉，味道超出预期，环境也舒服。' }
  ]
}
function buildReviews(r) {
  const days = ['3天前', '1周前', '2周前', '昨天', '刚刚']
  // 每家店独享自己专属的 5 条评论，内容对应本店菜品 → 评论人 / 评论完全不相同
  const list = STORE_REVIEWS[r.id] || STORE_REVIEWS[1]
  return list.map((rv, i) => ({
    id: `${r.id}-rv${i}`,
    user: rv.user,
    rating: rv.rating,
    content: rv.content,
    date: days[i % days.length],
    avatar: rv.user.charAt(0)
  }))
}

function buildDetail(id) {
  const base = MOCK_RESTAURANTS.find((r) => String(r.id) === String(id))
  if (!base) throw new Error('店铺不存在')
  const menu = buildMenu(base)
  const reviews = buildReviews(base)
  const avg = reviews.reduce((s, x) => s + x.rating, 0) / reviews.length
  return {
    ...base,
    menu,
    reviews,
    avgRating: Number(avg.toFixed(1)),
    reviewCount: reviews.length
  }
}

// ---------- 真实后端（GET /api/restaurants/:id）----------
async function httpGet(path) {
  const { default: axios } = await import('axios')
  const http = axios.create({
    baseURL: RESTAURANT_API_BASE,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
  })
  const res = await http.get(path)
  if (res.data.code !== 0) {
    throw new Error(res.data.message || '请求失败')
  }
  return res.data.data
}

/**
 * 获取店铺详情（含店内菜单 + 用户评价）。
 * 真实模式优先请求后端 GET /api/restaurants/:id，缺失时回退本地模拟。
 */
export async function getRestaurantDetail(id) {
  if (RESTAURANT_USE_MOCK) {
    await delay(400)
    return buildDetail(id)
  }
  try {
    return await httpGet(`${RESTAURANT_ENDPOINTS.detail}/${id}`)
  } catch (e) {
    if (RESTAURANT_FALLBACK_MOCK) {
      console.warn('[restaurant] 后端店铺接口暂不可用，已回退到本地模拟：', e.message)
      return buildDetail(id)
    }
    throw e
  }
}
