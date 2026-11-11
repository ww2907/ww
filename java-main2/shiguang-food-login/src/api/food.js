// ============================================================
// 食光 · 美食数据接口层（餐厅列表 / 搜索 / 分类）
// ------------------------------------------------------------
// 与 auth.js 保持一致的设计：
//   - USE_MOCK 默认 true（无需后端即可演示）
//   - 真实后端接口路径已预留（ENDPOINTS），接入时把
//     VITE_USE_MOCK 设为 false、VITE_API_BASE 指向后端即可
//   - 约定返回结构：{ code: 0, data: [...], message: 'ok' }
// 注意：本文件只定义「前端调用契约」，不实现后端逻辑。
// ============================================================

// 是否使用本地模拟：除非显式设置 VITE_USE_MOCK=false，否则默认 true
export const FOOD_USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// 后端未实现餐厅接口时，是否回退到本地模拟数据（保证前端页面始终有内容）
// 设为 false 则严格走真实后端，接口缺失会直接报错（便于联调阶段暴露问题）
export const FOOD_FALLBACK_MOCK = import.meta.env.VITE_FOOD_FALLBACK_MOCK !== 'false'

// 后端基础地址，可用 .env 的 VITE_API_BASE 覆盖
export const FOOD_API_BASE = import.meta.env.VITE_API_BASE || '/api'

// 后端路由（统一挂在 /api/restaurants 下）
export const FOOD_ENDPOINTS = {
  list: '/restaurants',
  search: '/restaurants/search',
  recommended: '/restaurants/recommended',
  food: '/restaurants/food',
  categories: '/restaurants/categories',
  // 分级分类树（三级：美食 → 面食 → 汤面），前端级联筛选直接消费
  categoryTree: '/restaurants/category-tree'
}

// 预留分类列表（真实接口返回时会被覆盖）
export const MOCK_CATEGORIES = ['全部', '面食', '快餐', '甜点', '饮品', '轻食', '火锅']

// 注意：MOCK_CATEGORY_TREE 依赖下面的 MOCK_RESTAURANTS 统计店铺数，
// 必须定义在 MOCK_RESTAURANTS 之后，否则模块求值时抛
// ReferenceError: Cannot access 'MOCK_RESTAURANTS' before initialization，
// 整个 api/food.js 加载失败 → 入口白屏。见文件末尾「本地模拟数据」之后。

/** 分类 id → 分类名称（mock 模式按 id 筛选时用；真实模式由后端按子树解析） */
export function catNameById(id) {
  if (id == null || id === '') return ''
  let hit = ''
  const walk = (nodes) => {
    nodes.forEach((n) => {
      if (String(n.id) === String(id)) hit = n.name
      if (n.children && n.children.length) walk(n.children)
    })
  }
  walk(MOCK_CATEGORY_TREE)
  return hit
}


// ---------- 人均价格（演示用确定性取值，避免改动 70 条原始数据）----------
// 不同品类给出价格区间，再按 id 做稳定偏移，使「按人均排序」真实可演示。
const PRICE_BASE = {
  面食: 22, 快餐: 26, 甜点: 24, 饮品: 20, 轻食: 26, 火锅: 58
}
export function priceFor(r) {
  const base = PRICE_BASE[r.cat] != null ? PRICE_BASE[r.cat] : 25
  const id = Number(r.id) || 0
  const offset = (id * 7) % 7 // 0..6 稳定偏移
  return base + offset
}

// ---------- 距离解析：'320m' -> 320；'1.1km' -> 1100 ----------
export function parseDistance(str) {
  if (str == null) return 999999
  const s = String(str).trim().toLowerCase()
  const m = s.match(/([\d.]+)\s*(km|公里|m|米)?/)
  if (!m) return 999999
  const num = parseFloat(m[1])
  if (isNaN(num)) return 999999
  const unit = m[2] || 'm'
  return unit === 'km' || unit === '公里' ? Math.round(num * 1000) : Math.round(num)
}

// ---------- 经营字段派生（与后端 SQL 种子口径一致，mock 兜底用）----------
const MIN_ORDER_BASE = { 面食: 20, 快餐: 20, 甜点: 25, 饮品: 15, 轻食: 30, 火锅: 50 }
function minOrderFor(r) {
  const base = MIN_ORDER_BASE[r.cat] != null ? MIN_ORDER_BASE[r.cat] : 25
  return base + (Number(r.id) % 2) * 5
}
function deliveryFeeFor(dm) {
  if (dm <= 400) return 0
  if (dm <= 1000) return 1
  if (dm <= 1500) return 2
  if (dm <= 2000) return 3
  return 5
}
function etaFor(dm) {
  if (dm <= 400) return '25分钟'
  if (dm <= 800) return '30分钟'
  if (dm <= 1500) return '35分钟'
  if (dm <= 2000) return '40分钟'
  return '50分钟'
}
function openStatusFor(r) {
  return Number(r.id) % 7 === 0 ? 0 : 1
}

// 给餐厅对象附加「人均价格」「距离(米)」「经营字段」。
// 非破坏性：真实后端已返回时优先用后端值，缺失才用派生值兜底。
function withSortFields(r) {
  if (!r || typeof r !== 'object') return r
  const price = r.price != null && r.price !== '' ? Number(r.price) : priceFor(r)
  const distanceM =
    r.distanceM != null && r.distanceM !== '' ? Number(r.distanceM) : parseDistance(r.distance)
  const dm = Number.isFinite(distanceM) ? distanceM : 999999
  const minOrder = r.minOrder != null ? Number(r.minOrder) : minOrderFor(r)
  const deliveryFee = r.deliveryFee != null ? Number(r.deliveryFee) : deliveryFeeFor(dm)
  const eta = r.eta != null && r.eta !== '' ? r.eta : etaFor(dm)
  const openStatus = r.openStatus != null ? Number(r.openStatus) : openStatusFor(r)
  return {
    ...r,
    price: Number.isFinite(price) ? price : priceFor(r),
    distanceM: dm,
    minOrder: Number.isFinite(minOrder) ? minOrder : minOrderFor(r),
    deliveryFee: Number.isFinite(deliveryFee) ? deliveryFee : deliveryFeeFor(dm),
    eta,
    openStatus: Number.isFinite(openStatus) ? openStatus : openStatusFor(r)
  }
}

// 后端返回的列表同样补齐排序字段，保证「人均最低 / 距离最近」两种排序在真实模式下也生效
function normalizeList(list) {
  return Array.isArray(list) ? list.map(withSortFields) : list
}

// 供外部（如首页推荐列表）复用：给单条餐厅补齐排序 + 经营字段
export function enrichRestaurant(r) {
  return withSortFields(r)
}

// ---------- 本地模拟数据（仅供演示，真实数据来自后端）----------
export const MOCK_RESTAURANTS = [
  { id: 1, name: '巷子口牛肉面', emoji: '🍜', cat: '面食', rating: 4.8, distance: '320m', tags: ['汤头浓郁', '现拉面'], desc: '老字号手作牛肉面，一勺辣油封神。' },
  { id: 2, name: '麦奇轻食沙拉', emoji: '🥗', cat: '轻食', rating: 4.6, distance: '680m', tags: ['低卡', '新鲜'], desc: '当季蔬果现拌，健身人士首选。' },
  { id: 3, name: '糖潮甜品铺', emoji: '🍰', cat: '甜点', rating: 4.9, distance: '1.1km', tags: ['手作', '不甜腻'], desc: '舒芙蕾现烤，入口即化。' },
  { id: 4, name: '拾光咖啡', emoji: '☕', cat: '饮品', rating: 4.7, distance: '450m', tags: ['手冲', '安静'], desc: '深烘豆子配落地窗，午后发呆好去处。' },
  { id: 5, name: '老成都火锅', emoji: '🍲', cat: '火锅', rating: 4.8, distance: '2.3km', tags: ['麻辣', '牛油锅'], desc: '地道牛油锅底，毛肚七上八下。' },
  { id: 6, name: '脆脆炸鸡铺', emoji: '🍔', cat: '快餐', rating: 4.5, distance: '900m', tags: ['外脆里嫩', '出餐快'], desc: '韩式炸鸡配啤酒，追剧标配。' },
  { id: 7, name: '阿婆云吞面', emoji: '🍜', cat: '面食', rating: 4.7, distance: '1.5km', tags: ['手工云吞', '鲜美'], desc: '几十年老味道，一碗暖到心里。' },
  { id: 8, name: '莓日茶研', emoji: '🧋', cat: '饮品', rating: 4.6, distance: '700m', tags: ['鲜果', '少糖'], desc: '当季鲜果现打，清爽不齁。' },
  { id: 9, name: '老街口面馆', emoji: '🍜', cat: '面食', rating: 4.8, distance: '1.3km', tags: ['汤头浓郁', '暖胃'], desc: '老街口面馆，一碗热汤面，治愈所有疲惫。' },
  { id: 10, name: '小满面馆', emoji: '🍜', cat: '面食', rating: 4.7, distance: '320m', tags: ['现拉面', '实惠'], desc: '小满面馆，一碗热汤面，治愈所有疲惫。' },
  { id: 11, name: '见一面面馆', emoji: '🍜', cat: '面食', rating: 4.6, distance: '450m', tags: ['手工', '老味道'], desc: '见一面面馆，一碗热汤面，治愈所有疲惫。' },
  { id: 12, name: '煮意面馆', emoji: '🍜', cat: '面食', rating: 4.9, distance: '1.5km', tags: ['暖胃', '分量足'], desc: '煮意面馆，一碗热汤面，治愈所有疲惫。' },
  { id: 13, name: '汤先生面馆', emoji: '🍜', cat: '面食', rating: 4.5, distance: '1.8km', tags: ['实惠', '出餐快'], desc: '汤先生面馆，一碗热汤面，治愈所有疲惫。' },
  { id: 14, name: '暖食面馆', emoji: '🍜', cat: '面食', rating: 4.8, distance: '1.2km', tags: ['老味道', '筋道'], desc: '暖食面馆，一碗热汤面，治愈所有疲惫。' },
  { id: 15, name: '晨光面馆', emoji: '🍜', cat: '面食', rating: 4.7, distance: '3.1km', tags: ['分量足', '鲜香'], desc: '晨光面馆，一碗热汤面，治愈所有疲惫。' },
  { id: 16, name: '巷尾面馆', emoji: '🍜', cat: '面食', rating: 4.6, distance: '760m', tags: ['出餐快', '汤头浓郁'], desc: '巷尾面馆，一碗热汤面，治愈所有疲惫。' },
  { id: 17, name: '面香居面馆', emoji: '🍜', cat: '面食', rating: 4.9, distance: '2.9km', tags: ['筋道', '现拉面'], desc: '面香居面馆，一碗热汤面，治愈所有疲惫。' },
  { id: 18, name: '北方味面馆', emoji: '🍜', cat: '面食', rating: 4.8, distance: '610m', tags: ['鲜香', '手工'], desc: '北方味面馆，一碗热汤面，治愈所有疲惫。' },
  { id: 19, name: '饱饱快餐', emoji: '🍔', cat: '快餐', rating: 4.7, distance: '1.3km', tags: ['外脆里嫩', '现炸'], desc: '饱饱快餐，快手好味道，赶时间也好好吃饭。' },
  { id: 20, name: '大口快餐', emoji: '🍔', cat: '快餐', rating: 4.6, distance: '320m', tags: ['出餐快', '性价比'], desc: '大口快餐，快手好味道，赶时间也好好吃饭。' },
  { id: 21, name: '急急快餐', emoji: '🍔', cat: '快餐', rating: 4.9, distance: '450m', tags: ['分量足', '追剧'], desc: '急急快餐，快手好味道，赶时间也好好吃饭。' },
  { id: 22, name: '饱嗝快餐', emoji: '🍔', cat: '快餐', rating: 4.7, distance: '1.5km', tags: ['现炸', '管饱'], desc: '饱嗝快餐，快手好味道，赶时间也好好吃饭。' },
  { id: 23, name: '快乐快餐', emoji: '🍔', cat: '快餐', rating: 4.8, distance: '1.8km', tags: ['性价比', '香辣'], desc: '快乐快餐，快手好味道，赶时间也好好吃饭。' },
  { id: 24, name: '薯叔快餐', emoji: '🍔', cat: '快餐', rating: 4.5, distance: '1.2km', tags: ['追剧', '多汁'], desc: '薯叔快餐，快手好味道，赶时间也好好吃饭。' },
  { id: 25, name: '炸物快餐', emoji: '🍔', cat: '快餐', rating: 4.9, distance: '3.1km', tags: ['管饱', '热乎'], desc: '炸物快餐，快手好味道，赶时间也好好吃饭。' },
  { id: 26, name: '饱了快餐', emoji: '🍔', cat: '快餐', rating: 4.6, distance: '760m', tags: ['香辣', '外脆里嫩'], desc: '饱了快餐，快手好味道，赶时间也好好吃饭。' },
  { id: 27, name: '嗨吃快餐', emoji: '🍔', cat: '快餐', rating: 4.7, distance: '2.9km', tags: ['多汁', '出餐快'], desc: '嗨吃快餐，快手好味道，赶时间也好好吃饭。' },
  { id: 28, name: '速达快餐', emoji: '🍔', cat: '快餐', rating: 4.8, distance: '610m', tags: ['热乎', '分量足'], desc: '速达快餐，快手好味道，赶时间也好好吃饭。' },
  { id: 29, name: '汉堡侠快餐', emoji: '🍔', cat: '快餐', rating: 4.6, distance: '1.3km', tags: ['外脆里嫩', '现炸'], desc: '汉堡侠快餐，快手好味道，赶时间也好好吃饭。' },
  { id: 30, name: '甜心甜品', emoji: '🍰', cat: '甜点', rating: 4.8, distance: '320m', tags: ['手作', '治愈'], desc: '甜心甜品，今天也要甜甜地收尾呀。' },
  { id: 31, name: '奶油甜品', emoji: '🍰', cat: '甜点', rating: 4.6, distance: '450m', tags: ['不甜腻', '料足'], desc: '奶油甜品，今天也要甜甜地收尾呀。' },
  { id: 32, name: '莓好甜品', emoji: '🍰', cat: '甜点', rating: 4.9, distance: '1.5km', tags: ['现烤', '入口即化'], desc: '莓好甜品，今天也要甜甜地收尾呀。' },
  { id: 33, name: '半糖甜品', emoji: '🍰', cat: '甜点', rating: 4.7, distance: '1.8km', tags: ['治愈', '奶香'], desc: '半糖甜品，今天也要甜甜地收尾呀。' },
  { id: 34, name: '糯糯甜品', emoji: '🍰', cat: '甜点', rating: 4.8, distance: '1.2km', tags: ['料足', '清爽'], desc: '糯糯甜品，今天也要甜甜地收尾呀。' },
  { id: 35, name: '焙焙甜品', emoji: '🍰', cat: '甜点', rating: 4.5, distance: '3.1km', tags: ['入口即化', '颜值高'], desc: '焙焙甜品，今天也要甜甜地收尾呀。' },
  { id: 36, name: '小甜甜品', emoji: '🍰', cat: '甜点', rating: 4.7, distance: '760m', tags: ['奶香', '新鲜'], desc: '小甜甜品，今天也要甜甜地收尾呀。' },
  { id: 37, name: '糖罐甜品', emoji: '🍰', cat: '甜点', rating: 4.6, distance: '2.9km', tags: ['清爽', '手作'], desc: '糖罐甜品，今天也要甜甜地收尾呀。' },
  { id: 38, name: '芋见甜品', emoji: '🍰', cat: '甜点', rating: 4.9, distance: '610m', tags: ['颜值高', '不甜腻'], desc: '芋见甜品，今天也要甜甜地收尾呀。' },
  { id: 39, name: '暖糖甜品', emoji: '🍰', cat: '甜点', rating: 4.8, distance: '1.3km', tags: ['新鲜', '现烤'], desc: '暖糖甜品，今天也要甜甜地收尾呀。' },
  { id: 40, name: '半杯茶饮', emoji: '🧋', cat: '饮品', rating: 4.7, distance: '320m', tags: ['鲜果', '清爽'], desc: '半杯茶饮，一杯好喝的，续上今天的快乐。' },
  { id: 41, name: '柠夏茶饮', emoji: '🧋', cat: '饮品', rating: 4.6, distance: '450m', tags: ['少糖', '现打'], desc: '柠夏茶饮，一杯好喝的，续上今天的快乐。' },
  { id: 42, name: '椰岛茶饮', emoji: '🧋', cat: '饮品', rating: 4.9, distance: '1.5km', tags: ['手冲', '奶香'], desc: '椰岛茶饮，一杯好喝的，续上今天的快乐。' },
  { id: 43, name: '煮茶茶饮', emoji: '🧋', cat: '饮品', rating: 4.5, distance: '1.8km', tags: ['清爽', '解腻'], desc: '煮茶茶饮，一杯好喝的，续上今天的快乐。' },
  { id: 44, name: '鲜果茶饮', emoji: '🧋', cat: '饮品', rating: 4.8, distance: '1.2km', tags: ['现打', '冰爽'], desc: '鲜果茶饮，一杯好喝的，续上今天的快乐。' },
  { id: 45, name: '慢茶茶饮', emoji: '🧋', cat: '饮品', rating: 4.7, distance: '3.1km', tags: ['奶香', '醇厚'], desc: '慢茶茶饮，一杯好喝的，续上今天的快乐。' },
  { id: 46, name: '青柚茶饮', emoji: '🧋', cat: '饮品', rating: 4.6, distance: '760m', tags: ['解腻', '安静'], desc: '青柚茶饮，一杯好喝的，续上今天的快乐。' },
  { id: 47, name: '茶叔茶饮', emoji: '🧋', cat: '饮品', rating: 4.9, distance: '2.9km', tags: ['冰爽', '鲜果'], desc: '茶叔茶饮，一杯好喝的，续上今天的快乐。' },
  { id: 48, name: '一杯茶饮', emoji: '🧋', cat: '饮品', rating: 4.8, distance: '610m', tags: ['醇厚', '少糖'], desc: '一杯茶饮，一杯好喝的，续上今天的快乐。' },
  { id: 49, name: '柚见茶饮', emoji: '🧋', cat: '饮品', rating: 4.7, distance: '1.3km', tags: ['安静', '手冲'], desc: '柚见茶饮，一杯好喝的，续上今天的快乐。' },
  { id: 50, name: '甘露茶饮', emoji: '🧋', cat: '饮品', rating: 4.6, distance: '320m', tags: ['鲜果', '清爽'], desc: '甘露茶饮，一杯好喝的，续上今天的快乐。' },
  { id: 51, name: '绿野轻食', emoji: '🥗', cat: '轻食', rating: 4.9, distance: '450m', tags: ['低卡', '高蛋白'], desc: '绿野轻食，好好吃饭，也能轻盈无负担。' },
  { id: 52, name: '轻氧轻食', emoji: '🥗', cat: '轻食', rating: 4.7, distance: '1.5km', tags: ['新鲜', '油醋汁'], desc: '轻氧轻食，好好吃饭，也能轻盈无负担。' },
  { id: 53, name: '纤纤轻食', emoji: '🥗', cat: '轻食', rating: 4.8, distance: '1.8km', tags: ['饱腹', '现拌'], desc: '纤纤轻食，好好吃饭，也能轻盈无负担。' },
  { id: 54, name: '每日轻食', emoji: '🥗', cat: '轻食', rating: 4.5, distance: '1.2km', tags: ['高蛋白', '减脂'], desc: '每日轻食，好好吃饭，也能轻盈无负担。' },
  { id: 55, name: '鲜野轻食', emoji: '🥗', cat: '轻食', rating: 4.9, distance: '3.1km', tags: ['油醋汁', '清爽'], desc: '鲜野轻食，好好吃饭，也能轻盈无负担。' },
  { id: 56, name: '素拾轻食', emoji: '🥗', cat: '轻食', rating: 4.6, distance: '760m', tags: ['现拌', '时蔬'], desc: '素拾轻食，好好吃饭，也能轻盈无负担。' },
  { id: 57, name: '轻拌轻食', emoji: '🥗', cat: '轻食', rating: 4.7, distance: '2.9km', tags: ['减脂', '无负担'], desc: '轻拌轻食，好好吃饭，也能轻盈无负担。' },
  { id: 58, name: '藜麦轻食', emoji: '🥗', cat: '轻食', rating: 4.8, distance: '610m', tags: ['清爽', '低卡'], desc: '藜麦轻食，好好吃饭，也能轻盈无负担。' },
  { id: 59, name: '元气轻食', emoji: '🥗', cat: '轻食', rating: 4.6, distance: '1.3km', tags: ['时蔬', '新鲜'], desc: '元气轻食，好好吃饭，也能轻盈无负担。' },
  { id: 60, name: '青蔬轻食', emoji: '🥗', cat: '轻食', rating: 4.8, distance: '320m', tags: ['无负担', '饱腹'], desc: '青蔬轻食，好好吃饭，也能轻盈无负担。' },
  { id: 61, name: '巴蜀火锅', emoji: '🍲', cat: '火锅', rating: 4.6, distance: '450m', tags: ['麻辣', '毛肚'], desc: '巴蜀火锅，咕嘟咕嘟，是最治愈的烟火气。' },
  { id: 62, name: '椒麻火锅', emoji: '🍲', cat: '火锅', rating: 4.9, distance: '1.5km', tags: ['牛油锅', '七上八下'], desc: '椒麻火锅，咕嘟咕嘟，是最治愈的烟火气。' },
  { id: 63, name: '渝味火锅', emoji: '🍲', cat: '火锅', rating: 4.7, distance: '1.8km', tags: ['鲜切', '热气腾腾'], desc: '渝味火锅，咕嘟咕嘟，是最治愈的烟火气。' },
  { id: 64, name: '锅气火锅', emoji: '🍲', cat: '火锅', rating: 4.8, distance: '1.2km', tags: ['毛肚', '入味'], desc: '锅气火锅，咕嘟咕嘟，是最治愈的烟火气。' },
  { id: 65, name: '辣府火锅', emoji: '🍲', cat: '火锅', rating: 4.5, distance: '3.1km', tags: ['七上八下', '分量足'], desc: '辣府火锅，咕嘟咕嘟，是最治愈的烟火气。' },
  { id: 66, name: '红汤火锅', emoji: '🍲', cat: '火锅', rating: 4.7, distance: '760m', tags: ['热气腾腾', '重口'], desc: '红汤火锅，咕嘟咕嘟，是最治愈的烟火气。' },
  { id: 67, name: '沸腾火锅', emoji: '🍲', cat: '火锅', rating: 4.6, distance: '2.9km', tags: ['入味', '过瘾'], desc: '沸腾火锅，咕嘟咕嘟，是最治愈的烟火气。' },
  { id: 68, name: '渝记火锅', emoji: '🍲', cat: '火锅', rating: 4.9, distance: '610m', tags: ['分量足', '麻辣'], desc: '渝记火锅，咕嘟咕嘟，是最治愈的烟火气。' },
  { id: 69, name: '椒香火锅', emoji: '🍲', cat: '火锅', rating: 4.8, distance: '1.3km', tags: ['重口', '牛油锅'], desc: '椒香火锅，咕嘟咕嘟，是最治愈的烟火气。' },
  { id: 70, name: '蜀大火锅', emoji: '🍲', cat: '火锅', rating: 4.7, distance: '320m', tags: ['过瘾', '鲜切'], desc: '蜀大火锅，咕嘟咕嘟，是最治愈的烟火气。' }
]

// 分类树兜底数据（后端不可用时使用）。
// 只能还原两级：三级品类依赖真实库里 dish.category_id 的归类结果，mock 无菜品级数据。
// 放在 MOCK_RESTAURANTS 之后，避免 TDZ（提前引用会整模块加载失败 → 白屏）。
export const MOCK_CATEGORY_TREE = (() => {
  const children = MOCK_CATEGORIES
    .filter((name) => name !== '全部')
    .map((name, i) => ({
      id: i + 2,
      name,
      level: 2,
      path: `/1/${i + 2}/`,
      icon: '',
      sortOrder: i + 1,
      restaurantCount: MOCK_RESTAURANTS.filter((r) => r.cat === name).length,
      dishCount: 0,
      children: []
    }))
  return [{
    id: 1,
    name: '美食',
    level: 1,
    path: '/1/',
    icon: '🍽️',
    sortOrder: 0,
    restaurantCount: MOCK_RESTAURANTS.length,
    dishCount: 0,
    children
  }]
})()

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------- 通用排序（与后端 applySort 口径完全一致）----------
// sort: 'default' 综合推荐（评分降序→距离升序） / 'price' 人均最低 / 'distance' 距离最近
// order: 'asc'（默认） / 'desc'
export function sortRestaurants(list, sort = 'default', order = 'asc') {
  const arr = Array.isArray(list) ? list.slice() : []
  const byRatingDesc = (a, b) => (b.rating || 0) - (a.rating || 0)
  const byId = (a, b) => (Number(a.id) || 0) - (Number(b.id) || 0)
  const cmp = {
    price: (a, b) =>
      (a.price != null ? a.price : 1e9) - (b.price != null ? b.price : 1e9) ||
      byRatingDesc(a, b) || byId(a, b),
    distance: (a, b) =>
      (a.distanceM != null ? a.distanceM : 1e9) - (b.distanceM != null ? b.distanceM : 1e9) ||
      byRatingDesc(a, b) || byId(a, b),
    default: (a, b) =>
      byRatingDesc(a, b) ||
      (a.distanceM != null ? a.distanceM : 1e9) - (b.distanceM != null ? b.distanceM : 1e9) ||
      byId(a, b)
  }[sort] || null
  if (!cmp) return arr.sort((a, b) => byRatingDesc(a, b) || byId(a, b))
  arr.sort(cmp)
  return String(order).toLowerCase() === 'desc' ? arr.reverse() : arr
}

// ---------- 真实后端 ----------
async function httpGet(path, params) {
  const { default: axios } = await import('axios')
  const http = axios.create({
    baseURL: FOOD_API_BASE,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
  })
  const res = await http.get(path, { params })
  // 约定：code === 0 为成功，否则抛出后端返回的 message
  if (res.data.code !== 0) {
    throw new Error(res.data.message || '请求失败')
  }
  return res.data.data
}

// 本地模拟：按关键词 + 分类过滤
function filterMock({ keyword = '', category = '全部' }) {
  let list = MOCK_RESTAURANTS
  if (category && category !== '全部') {
    list = list.filter((r) => r.cat === category)
  }
  const k = (keyword || '').trim().toLowerCase()
  if (k) {
    list = list.filter(
      (r) =>
        r.name.toLowerCase().includes(k) ||
        r.cat.toLowerCase().includes(k) ||
        r.desc.toLowerCase().includes(k) ||
        r.tags.some((t) => t.toLowerCase().includes(k))
    )
  }
  return list.map(withSortFields)
}

// 本地模拟：计算「推荐集」id（与后端口径一致：评分最高的 12 家，评分相同按 id 升序）
function recommendedIds(limit = 12) {
  return MOCK_RESTAURANTS
    .slice()
    .sort((a, b) => b.rating - a.rating || a.id - b.id)
    .slice(0, limit)
    .map((r) => r.id)
}

// 本地模拟：美食页面列表 = 全部店铺剔除推荐集，可按分类 / 关键字过滤
function filterFoodMock({ keyword = '', category = '全部' } = {}) {
  const exclude = new Set(recommendedIds(12))
  let list = MOCK_RESTAURANTS.filter((r) => !exclude.has(r.id))
  if (category && category !== '全部') {
    list = list.filter((r) => r.cat === category)
  }
  const k = (keyword || '').trim().toLowerCase()
  if (k) {
    list = list.filter(
      (r) =>
        r.name.toLowerCase().includes(k) ||
        r.cat.toLowerCase().includes(k) ||
        r.desc.toLowerCase().includes(k) ||
        r.tags.some((t) => t.toLowerCase().includes(k))
    )
  }
  return list.map(withSortFields)
}

// ============================================================
// 分类参数处理
// ============================================================

/**
 * 解析「按分类筛选」要用的分类名：给了 categoryId 就用 id 反查名称（mock 只能按名称过滤），
 * 否则退回旧的 category 名称。查不到名称时返回空串（= 不过滤），避免静默返回空列表。
 */
function resolveCatName(categoryId, category) {
  if (categoryId != null && categoryId !== '') return catNameById(categoryId)
  return category || '全部'
}

/**
 * 组装请求参数：categoryId 优先，为空时回退 category 名称；
 * 同时剔除空值，避免 axios 把 null 序列化成 "null" 传给后端。
 */
function categoryParams({ keyword, categoryId, category, sort, order }) {
  const params = { keyword, sort, order }
  if (categoryId != null && categoryId !== '') {
    params.categoryId = categoryId
  } else if (category && category !== '全部') {
    params.category = category
  }
  return params
}

// ============================================================
// 统一对外接口（前端直接调用，无需关心 mock / 真实）
// ============================================================

/**
 * 获取餐厅列表 / 搜索。参数：{ keyword, categoryId, category, sort, order }
 *   - categoryId：分级分类节点 id（优先），后端按物化路径命中整棵子树
 *   - category：分类名称，仅保留给旧调用方兼容
 * 策略：mock 模式直接返回本地数据；真实模式下优先请求后端，
 *       若后端尚未实现该接口（报错 / 404），则回退到本地模拟，保证页面可用。
 */
export async function getRestaurants({ keyword = '', categoryId = null, category = '全部', sort = 'default', order = 'asc' } = {}) {
  const catName = resolveCatName(categoryId, category)
  if (FOOD_USE_MOCK) {
    await delay(400)
    return sortRestaurants(filterMock({ keyword, category: catName }), sort, order)
  }
  try {
    return normalizeList(await httpGet(FOOD_ENDPOINTS.search, categoryParams({ keyword, categoryId, category, sort, order })))
  } catch (e) {
    if (FOOD_FALLBACK_MOCK) {
      console.warn('[food] 后端餐厅接口暂不可用，已回退到本地模拟数据：', e.message)
      return sortRestaurants(filterMock({ keyword, category: catName }), sort, order)
    }
    throw e
  }
}

/**
 * 首页「推荐美食」：返回评分最高的 12 家（limit 可配）。
 * 策略：mock 模式直接返回本地数据；真实模式请求 /recommended，缺失则回退本地。
 */
export async function getRecommended(limit = 12) {
  if (FOOD_USE_MOCK) {
    await delay(350)
    return MOCK_RESTAURANTS
      .slice()
      .sort((a, b) => b.rating - a.rating || a.id - b.id)
      .slice(0, limit)
      .map(withSortFields)
  }
  try {
    return normalizeList(await httpGet(FOOD_ENDPOINTS.recommended, { limit }))
  } catch (e) {
    if (FOOD_FALLBACK_MOCK) {
      console.warn('[food] 后端推荐接口暂不可用，已回退到本地模拟数据：', e.message)
      return MOCK_RESTAURANTS
        .slice()
        .sort((a, b) => b.rating - a.rating || a.id - b.id)
        .slice(0, limit)
    }
    throw e
  }
}

/**
 * 美食页面列表：返回「全部店铺剔除推荐集」后的其余店铺，支持分类 / 关键字筛选。
 * 分类既可传 categoryId（分级分类，命中整棵子树），也可传旧的 category 名称。
 * 策略：mock 模式直接返回本地数据；真实模式请求 /food，缺失则回退本地。
 */
export async function getFoodList({ keyword = '', categoryId = null, category = '全部', sort = 'default', order = 'asc' } = {}) {
  const catName = resolveCatName(categoryId, category)
  if (FOOD_USE_MOCK) {
    await delay(350)
    return sortRestaurants(filterFoodMock({ keyword, category: catName }), sort, order)
  }
  try {
    return normalizeList(await httpGet(FOOD_ENDPOINTS.food, categoryParams({ keyword, categoryId, category, sort, order })))
  } catch (e) {
    if (FOOD_FALLBACK_MOCK) {
      console.warn('[food] 后端美食页接口暂不可用，已回退到本地模拟数据：', e.message)
      return sortRestaurants(filterFoodMock({ keyword, category: catName }), sort, order)
    }
    throw e
  }
}

/**
 * 获取分级分类树（一级美食 → 二级业态 → 三级品类），每个节点带 restaurantCount / dishCount。
 * 真实模式走后端 /category-tree（按物化路径汇总子树计数），失败时回退到本地两级兜底树。
 */
export async function getCategoryTree() {
  if (FOOD_USE_MOCK) {
    await delay(150)
    return MOCK_CATEGORY_TREE
  }
  try {
    // 同样必须 await，否则异常绕过 catch，回退逻辑失效
    const data = await httpGet(FOOD_ENDPOINTS.categoryTree, {})
    return Array.isArray(data) && data.length ? data : MOCK_CATEGORY_TREE
  } catch (e) {
    if (FOOD_FALLBACK_MOCK) {
      console.warn('[food] 后端分类树接口暂不可用，已回退到本地模拟数据：', e.message)
      return MOCK_CATEGORY_TREE
    }
    throw e
  }
}

/** 获取分类列表（同样支持后端缺失时回退到本地模拟） */
export async function getCategories() {
  if (FOOD_USE_MOCK) {
    await delay(150)
    return MOCK_CATEGORIES.slice()
  }
  try {
    // 注意此处必须 await：否则请求异常不会被 catch 捕获，回退逻辑失效
    return await httpGet(FOOD_ENDPOINTS.categories, {})
  } catch (e) {
    if (FOOD_FALLBACK_MOCK) {
      console.warn('[food] 后端分类接口暂不可用，已回退到本地模拟数据：', e.message)
      return MOCK_CATEGORIES.slice()
    }
    throw e
  }
}
