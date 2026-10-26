// ============================================================
// 后台管理系统 - 共享数据 / 登录态
// ------------------------------------------------------------
// 该 store 同时被「首页」与「后台管理」读取，因此后台的修改会
// 实时反映到首页（顶部导航 / 底部导航 / 搜索配置 / 推荐美食）。
// 默认 USE_MOCK=true，所有数据保存在 localStorage，无需后端即可演示。
// ============================================================
import { reactive } from 'vue'
import { MOCK_RESTAURANTS } from '../api/food.js'

const ADMIN_SESSION_KEY = 'shiguang_admin_session'
const ADMIN_DATA_KEY = 'shiguang_admin_data'

// ---------- 默认数据（后台未改过时首页使用的兜底值）----------
const DEFAULT_NAV_TOP = [
  { id: 'home', label: '首页', icon: '🏠', sort: 1, enabled: true },
  { id: 'food', label: '美食', icon: '🍽️', sort: 2, enabled: true },
  { id: 'order', label: '订单', icon: '🧾', sort: 3, enabled: true },
  { id: 'mine', label: '我的', icon: '👤', sort: 4, enabled: true }
]
const DEFAULT_NAV_BOTTOM = [
  { id: 'home', label: '首页', icon: '🏠', sort: 1, enabled: true },
  { id: 'food', label: '美食', icon: '🍽️', sort: 2, enabled: true },
  { id: 'order', label: '订单', icon: '🧾', sort: 3, enabled: true },
  { id: 'mine', label: '我的', icon: '👤', sort: 4, enabled: true }
]
const DEFAULT_SEARCH = {
  placeholder: '搜美食、搜好店，回车进入美食页…',
  hotwords: ['牛肉面', '火锅', '轻食', '奶茶', '沙拉', '炸鸡']
}
const DEFAULT_CATEGORIES = [
  { id: 1, name: '美食', parentId: 0, sortOrder: 0 },
  { id: 2, name: '面食', parentId: 1, sortOrder: 1 },
  { id: 3, name: '快餐', parentId: 1, sortOrder: 2 },
  { id: 4, name: '甜点', parentId: 1, sortOrder: 3 },
  { id: 5, name: '饮品', parentId: 1, sortOrder: 4 },
  { id: 6, name: '轻食', parentId: 1, sortOrder: 5 },
  { id: 7, name: '火锅', parentId: 1, sortOrder: 6 }
]
const DEFAULT_DISHES = [
  { id: 1, name: '招牌牛肉面', price: 28, emoji: '🍜', categoryId: 2, description: '牛骨熬汤 8 小时，手工现拉。', sort: 1, enabled: true },
  { id: 2, name: '红油抄手', price: 22, emoji: '🥟', categoryId: 2, description: '皮薄馅大，麻辣鲜香。', sort: 2, enabled: true },
  { id: 3, name: '韩式雪花炸鸡', price: 36, emoji: '🍗', categoryId: 3, description: '外皮酥到掉渣。', sort: 1, enabled: true },
  { id: 4, name: '安格斯牛肉堡', price: 28, emoji: '🍔', categoryId: 3, description: '现煎牛肉饼多汁。', sort: 2, enabled: true },
  { id: 5, name: '现烤舒芙蕾', price: 32, emoji: '🍮', categoryId: 4, description: '出炉即食，入口即化。', sort: 1, enabled: true },
  { id: 6, name: '深烘手冲单品', price: 28, emoji: '☕', categoryId: 5, description: '埃塞俄比亚豆，风味干净。', sort: 1, enabled: true },
  { id: 7, name: '生椰拿铁', price: 22, emoji: '🥥', categoryId: 5, description: '椰香浓郁顺滑。', sort: 2, enabled: true },
  { id: 8, name: '麻辣牛油锅', price: 58, emoji: '🍲', categoryId: 7, description: '牛油锅底，越煮越香。', sort: 1, enabled: true },
  { id: 9, name: '鸡胸蔬菜沙拉', price: 26, emoji: '🥗', categoryId: 6, description: '高蛋白低脂。', sort: 1, enabled: true },
  { id: 10, name: '藜麦时蔬碗', price: 30, emoji: '🍚', categoryId: 6, description: '饱腹无负担。', sort: 2, enabled: true }
]
const DEFAULT_USERS = [
  { id: 1, account: 'demo', nickname: '演示用户', accountType: 0, status: 1, createdAt: '2026-10-23 16:31:59' },
  { id: 2, account: 'xiaoming', nickname: '小明', accountType: 0, status: 1, createdAt: '2026-10-24 09:12:00' },
  { id: 3, account: 'lili', nickname: '丽丽', accountType: 0, status: 1, createdAt: '2026-10-24 10:30:00' },
  { id: 4, account: 'blocked_user', nickname: '已封禁用户', accountType: 0, status: 0, createdAt: '2026-10-25 08:05:00' }
]
const DEFAULT_ORDERS = [
  { id: 'OD20261026001', account: 'demo', restaurant: '巷子口牛肉面', items: '招牌牛肉面 x1, 冰镇酸梅汤 x1', amount: 36, status: '已支付', createdAt: '2026-10-26 11:02:11' },
  { id: 'OD20261026002', account: 'xiaoming', restaurant: '麦奇轻食沙拉', items: '鸡胸蔬菜沙拉 x1', amount: 26, status: '已完成', createdAt: '2026-10-26 11:20:45' },
  { id: 'OD20261026003', account: 'lili', restaurant: '老成都火锅', items: '麻辣牛油锅 x1, 鲜切黄喉 x1', amount: 100, status: '待支付', createdAt: '2026-10-26 11:35:09' },
  { id: 'OD20261025018', account: 'demo', restaurant: '拾光咖啡', items: '生椰拿铁 x2', amount: 44, status: '已取消', createdAt: '2026-10-25 18:44:20' }
]

// ---------- 读取 / 持久化 ----------
function loadSession() {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) { /* ignore */ }
  return { account: '', token: '' }
}

function loadData() {
  try {
    const raw = localStorage.getItem(ADMIN_DATA_KEY)
    if (raw) {
      const d = JSON.parse(raw)
      return {
        navTop: d.navTop || clone(DEFAULT_NAV_TOP),
        navBottom: d.navBottom || clone(DEFAULT_NAV_BOTTOM),
        search: d.search || clone(DEFAULT_SEARCH),
        recommendedIds: d.recommendedIds || [],
        categories: d.categories || clone(DEFAULT_CATEGORIES),
        dishes: d.dishes || clone(DEFAULT_DISHES),
        users: d.users || clone(DEFAULT_USERS),
        orders: d.orders || clone(DEFAULT_ORDERS)
      }
    }
  } catch (e) { /* ignore */ }
  return {
    navTop: clone(DEFAULT_NAV_TOP),
    navBottom: clone(DEFAULT_NAV_BOTTOM),
    search: clone(DEFAULT_SEARCH),
    recommendedIds: [],
    categories: clone(DEFAULT_CATEGORIES),
    dishes: clone(DEFAULT_DISHES),
    users: clone(DEFAULT_USERS),
    orders: clone(DEFAULT_ORDERS)
  }
}

function clone(v) { return JSON.parse(JSON.stringify(v)) }

export const adminSession = reactive(loadSession())
export const adminData = reactive(loadData())

export function persistAdminData() {
  try { localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(adminData)) } catch (e) { /* ignore */ }
}
export function persistAdminSession() {
  try { localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminSession)) } catch (e) { /* ignore */ }
}

export function setAdminSession(account, token) {
  adminSession.account = account
  adminSession.token = token
  persistAdminSession()
}
export function clearAdminSession() {
  adminSession.account = ''
  adminSession.token = ''
  persistAdminSession()
}
export function isAdminLoggedIn() {
  return !!adminSession.token
}

// ---------- 供首页读取的派生数据 ----------
export function getNavTop() {
  return adminData.navTop.filter((n) => n.enabled).sort((a, b) => a.sort - b.sort)
}
export function getNavBottom() {
  return adminData.navBottom.filter((n) => n.enabled).sort((a, b) => a.sort - b.sort)
}
export function getSearchConfig() {
  return adminData.search
}
// 推荐美食：后台勾选了哪些店铺就展示哪些；未勾选则回退到评分最高的 12 家
export function getRecommendedRestaurants(limit = 12) {
  const ids = adminData.recommendedIds || []
  if (ids.length) {
    const set = new Set(ids)
    return MOCK_RESTAURANTS.filter((r) => set.has(r.id))
  }
  return MOCK_RESTAURANTS
    .slice()
    .sort((a, b) => b.rating - a.rating || a.id - b.id)
    .slice(0, limit)
}

// 统一的后台登录态 key（与首页 session 区分）
export const ADMIN_SESSION_STORAGE_KEY = ADMIN_SESSION_KEY
export const ADMIN_DATA_STORAGE_KEY = ADMIN_DATA_KEY
