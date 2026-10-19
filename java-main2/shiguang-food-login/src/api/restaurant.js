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
    { name: '招牌牛肉面', price: 28, emoji: '🍜', desc: '牛骨熬汤 8 小时，手工现拉，一勺辣油封神。' },
    { name: '红油抄手', price: 22, emoji: '🥟', desc: '皮薄馅大，麻辣鲜香直冲天灵盖。' },
    { name: '酸辣肥肠面', price: 26, emoji: '🍜', desc: '肥肠处理干净无异味，酸辣开胃。' },
    { name: '卤香豆干', price: 10, emoji: '🍢', desc: '老卤慢浸，越嚼越香的下饭小菜。' },
    { name: '冰镇酸梅汤', price: 8, emoji: '🥤', desc: '古法熬煮，解辣神器。' }
  ],
  2: [
    { name: '鸡胸蔬菜沙拉', price: 26, emoji: '🥗', desc: '高蛋白低脂，油醋汁现拌。' },
    { name: '牛油果鸡蛋三明治', price: 24, emoji: '🥪', desc: '全麦面包夹现切牛油果，给得慷慨。' },
    { name: '藜麦时蔬碗', price: 30, emoji: '🍚', desc: '藜麦配当季时蔬，饱腹无负担。' },
    { name: '烤时蔬卷', price: 22, emoji: '🥙', desc: '彩椒西葫芦现烤，清爽不油腻。' },
    { name: '鲜榨羽衣甘蓝汁', price: 16, emoji: '🥤', desc: '当季果蔬冷压，微苦回甘。' }
  ],
  3: [
    { name: '现烤舒芙蕾', price: 32, emoji: '🍮', desc: '出炉即食，端上来还在抖，入口即化。' },
    { name: '海盐提拉米苏', price: 28, emoji: '🍰', desc: '马斯卡彭配海盐，酒香恰到好处不齁。' },
    { name: '莓果千层', price: 30, emoji: '🍓', desc: '层层奶油夹鲜莓，酸得清醒。' },
    { name: '焦糖布丁', price: 20, emoji: '🍮', desc: '丝滑布丁淋焦糖脆壳。' },
    { name: '芋泥啵啵杯', price: 24, emoji: '🧋', desc: '手捣芋泥配 Q 弹啵啵，料足。' }
  ],
  4: [
    { name: '深烘手冲单品', price: 28, emoji: '☕', desc: '埃塞俄比亚豆，风味干净带果酸。' },
    { name: '生椰拿铁', price: 22, emoji: '🥥', desc: '椰香浓郁顺滑，每天续命。' },
    { name: '桂花乌龙拿铁', price: 26, emoji: '🍵', desc: '桂花清香配乌龙尾韵，悠长。' },
    { name: '气泡美式', price: 20, emoji: '🥤', desc: '清爽气泡配醇厚咖啡。' },
    { name: '脏脏可可', price: 24, emoji: '🍫', desc: '可可碎配奶盖，罪恶但满足。' }
  ],
  5: [
    { name: '麻辣牛油锅', price: 58, emoji: '🍲', desc: '牛油锅底，越煮越香。' },
    { name: '鲜切黄喉', price: 42, emoji: '🥩', desc: '脆嫩弹牙，七上八下。' },
    { name: '手打虾滑', price: 32, emoji: '🦐', desc: '现打虾滑，弹到弹牙。' },
    { name: '现炸酥肉', price: 28, emoji: '🍗', desc: '外酥里嫩，直接吃或下锅都香。' },
    { name: '红糖糍粑', price: 16, emoji: '🍡', desc: '现炸糍粑裹黄豆粉，软糯。' }
  ],
  6: [
    { name: '韩式雪花炸鸡', price: 36, emoji: '🍗', desc: '外皮酥到掉渣，裹韩式甜辣酱。' },
    { name: '安格斯牛肉堡', price: 28, emoji: '🍔', desc: '现煎牛肉饼多汁，一口爆汁。' },
    { name: '黄金薯条', price: 12, emoji: '🍟', desc: '现炸金黄，外脆内软。' },
    { name: '芝士薯泥', price: 14, emoji: '🧀', desc: '拉丝芝士，绵密。' },
    { name: '蜂蜜芥末鸡块', price: 20, emoji: '🍗', desc: '蘸酱解腻，一口一个。' }
  ],
  7: [
    { name: '鲜虾云吞面', price: 24, emoji: '🍜', desc: '手工云吞，整只鲜虾弹牙。' },
    { name: '老北京炸酱面', price: 20, emoji: '🍜', desc: '老味道还原，咸香浓郁。' },
    { name: '鲜虾仁肠粉', price: 18, emoji: '🍥', desc: '米皮滑嫩，酱油鲜甜。' },
    { name: '艇仔粥', price: 16, emoji: '🥣', desc: '料足绵滑，暖到心里。' },
    { name: '萝卜牛杂', price: 22, emoji: '🍲', desc: '慢炖入味，软烂鲜香。' }
  ],
  8: [
    { name: '草莓啵啵鲜奶茶', price: 22, emoji: '🧋', desc: '当季鲜草莓现打，料足。' },
    { name: '多肉葡萄', price: 24, emoji: '🍇', desc: '整颗去皮葡萄，清爽不涩。' },
    { name: '茉莉奶绿', price: 18, emoji: '🍵', desc: '茉莉清香配奶绿。' },
    { name: '杨枝甘露', price: 26, emoji: '🥭', desc: '芒果西柚椰浆，港式地道。' },
    { name: '柠檬冷萃', price: 20, emoji: '🍋', desc: '冷萃茶配鲜柠檬，夏天续命水。' }
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
