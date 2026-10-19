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
  categories: '/restaurants/categories'
}

// 预留分类列表（真实接口返回时会被覆盖）
export const MOCK_CATEGORIES = ['全部', '面食', '快餐', '甜点', '饮品', '轻食', '火锅']

// ---------- 本地模拟数据（仅供演示，真实数据来自后端）----------
export const MOCK_RESTAURANTS = [
  { id: 1, name: '巷子口牛肉面', emoji: '🍜', cat: '面食', rating: 4.8, distance: '320m', tags: ['汤头浓郁', '现拉面'], desc: '老字号手作牛肉面，一勺辣油封神。' },
  { id: 2, name: '麦奇轻食沙拉', emoji: '🥗', cat: '轻食', rating: 4.6, distance: '680m', tags: ['低卡', '新鲜'], desc: '当季蔬果现拌，健身人士首选。' },
  { id: 3, name: '糖潮甜品铺', emoji: '🍰', cat: '甜点', rating: 4.9, distance: '1.1km', tags: ['手作', '不甜腻'], desc: '舒芙蕾现烤，入口即化。' },
  { id: 4, name: '拾光咖啡', emoji: '☕', cat: '饮品', rating: 4.7, distance: '450m', tags: ['手冲', '安静'], desc: '深烘豆子配落地窗，午后发呆好去处。' },
  { id: 5, name: '老成都火锅', emoji: '🍲', cat: '火锅', rating: 4.8, distance: '2.3km', tags: ['麻辣', '牛油锅'], desc: '地道牛油锅底，毛肚七上八下。' },
  { id: 6, name: '脆脆炸鸡铺', emoji: '🍔', cat: '快餐', rating: 4.5, distance: '900m', tags: ['外脆里嫩', '出餐快'], desc: '韩式炸鸡配啤酒，追剧标配。' },
  { id: 7, name: '阿婆云吞面', emoji: '🍜', cat: '面食', rating: 4.7, distance: '1.5km', tags: ['手工云吞', '鲜美'], desc: '几十年老味道，一碗暖到心里。' },
  { id: 8, name: '莓日茶研', emoji: '🧋', cat: '饮品', rating: 4.6, distance: '700m', tags: ['鲜果', '少糖'], desc: '当季鲜果现打，清爽不齁。' }
]

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
  return list
}

// ============================================================
// 统一对外接口（前端直接调用，无需关心 mock / 真实）
// ============================================================

/**
 * 获取餐厅列表 / 搜索。参数：{ keyword, category }
 * 策略：mock 模式直接返回本地数据；真实模式下优先请求后端，
 *       若后端尚未实现该接口（报错 / 404），则回退到本地模拟，保证页面可用。
 */
export async function getRestaurants({ keyword = '', category = '全部' } = {}) {
  if (FOOD_USE_MOCK) {
    await delay(400)
    return filterMock({ keyword, category })
  }
  try {
    return await httpGet(FOOD_ENDPOINTS.search, { keyword, category })
  } catch (e) {
    if (FOOD_FALLBACK_MOCK) {
      console.warn('[food] 后端餐厅接口暂不可用，已回退到本地模拟数据：', e.message)
      return filterMock({ keyword, category })
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
    return httpGet(FOOD_ENDPOINTS.categories, {})
  } catch (e) {
    if (FOOD_FALLBACK_MOCK) {
      console.warn('[food] 后端分类接口暂不可用，已回退到本地模拟数据：', e.message)
      return MOCK_CATEGORIES.slice()
    }
    throw e
  }
}
