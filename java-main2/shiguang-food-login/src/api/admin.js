// ============================================================
// 后台管理系统 - 接口层
// ------------------------------------------------------------
// 与 auth.js / food.js 保持同一套契约：
//   - VITE_USE_MOCK 默认 true（无需后端即可演示）
//   - 真实后端路由统一挂在 /api/admin 下
//   - 返回结构约定：{ code: 0, data: {...}, message: 'ok' }
// ============================================================
import { adminData, setAdminSession, persistAdminData, clearAdminSession } from '../store/admin.js'

// 后台是否使用本地模拟：由独立的 VITE_ADMIN_USE_MOCK 控制，
// 这样可在「用户登录仍走 mock」的前提下，单独把后台管理切到真实后端。
export const ADMIN_USE_MOCK = import.meta.env.VITE_ADMIN_USE_MOCK !== 'false'
export const ADMIN_API_BASE = import.meta.env.VITE_API_BASE || '/api'

export const ADMIN_ENDPOINTS = {
  login: '/admin/login',
  nav: '/admin/nav',
  search: '/admin/search',
  recommend: '/admin/recommend',
  category: '/admin/category',
  dish: '/admin/dish',
  stats: '/admin/stats',
  user: '/admin/user',
  order: '/admin/order'
}

// 后台管理员（mock）：账号 admin / 密码 admin123
const mockAdmins = new Map([['admin', 'admin123']])

function delay(ms) { return new Promise((r) => setTimeout(r, ms)) }
function clone(v) { return JSON.parse(JSON.stringify(v)) }

// 真实后端请求
async function httpReq(method, path, payload, params) {
  const { default: axios } = await import('axios')
  const http = axios.create({
    baseURL: ADMIN_API_BASE,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
  })
  const res = await http.request({ method, url: path, data: payload, params })
  if (res.data.code !== 0) throw new Error(res.data.message || '请求失败')
  return res.data.data
}

// ============ 登录（仅登录，无注册）============
export async function adminLogin({ account, password }) {
  if (ADMIN_USE_MOCK) {
    await delay(600)
    if (!account || !password) throw new Error('请输入账号和密码')
    if (mockAdmins.get(account.trim()) !== password) throw new Error('管理员账号或密码错误')
    const token = 'admin-token-' + Date.now()
    setAdminSession(account.trim(), token)
    return { token, account: account.trim() }
  }
  const data = await httpReq('post', ADMIN_ENDPOINTS.login, { account, password })
  setAdminSession(data.account, data.token)
  return data
}

export function adminLogout() {
  clearAdminSession()
}

// ============ 1. 导航配置（顶部 + 底部）============
export async function getNavConfig() {
  if (ADMIN_USE_MOCK) {
    await delay(150)
    return { top: clone(adminData.navTop), bottom: clone(adminData.navBottom) }
  }
  return httpReq('get', ADMIN_ENDPOINTS.nav)
}
export async function updateNavConfig({ top, bottom }) {
  if (ADMIN_USE_MOCK) {
    await delay(200)
    adminData.navTop = top
    adminData.navBottom = bottom
    persistAdminData()
    return { ok: true }
  }
  return httpReq('put', ADMIN_ENDPOINTS.nav, { top, bottom })
}

// ============ 2. 搜索配置 ============
export async function getSearchConfig() {
  if (ADMIN_USE_MOCK) {
    await delay(150)
    return clone(adminData.search)
  }
  return httpReq('get', ADMIN_ENDPOINTS.search)
}
export async function updateSearchConfig(config) {
  if (ADMIN_USE_MOCK) {
    await delay(200)
    adminData.search = config
    persistAdminData()
    return { ok: true }
  }
  return httpReq('put', ADMIN_ENDPOINTS.search, config)
}

// ============ 3. 推荐美食 ============
export async function getRecommend() {
  if (ADMIN_USE_MOCK) {
    await delay(150)
    return { ids: clone(adminData.recommendedIds) }
  }
  return httpReq('get', ADMIN_ENDPOINTS.recommend)
}
export async function updateRecommend(ids) {
  if (ADMIN_USE_MOCK) {
    await delay(200)
    adminData.recommendedIds = ids
    persistAdminData()
    return { ok: true }
  }
  return httpReq('put', ADMIN_ENDPOINTS.recommend, { ids })
}

// ============ 4. 分类 ============
export async function listCategories() {
  if (ADMIN_USE_MOCK) {
    await delay(150)
    return clone(adminData.categories)
  }
  return httpReq('get', ADMIN_ENDPOINTS.category)
}
export async function saveCategory(cat) {
  if (ADMIN_USE_MOCK) {
    await delay(200)
    if (cat.id) {
      const i = adminData.categories.findIndex((c) => c.id === cat.id)
      if (i >= 0) adminData.categories[i] = { ...adminData.categories[i], ...cat }
    } else {
      const id = Math.max(0, ...adminData.categories.map((c) => c.id)) + 1
      adminData.categories.push({ id, parentId: 0, sortOrder: adminData.categories.length + 1, ...cat })
    }
    persistAdminData()
    return { ok: true }
  }
  return httpReq(cat.id ? 'put' : 'post', ADMIN_ENDPOINTS.category, cat)
}
export async function removeCategory(id) {
  if (ADMIN_USE_MOCK) {
    await delay(150)
    adminData.categories = adminData.categories.filter((c) => c.id !== id)
    persistAdminData()
    return { ok: true }
  }
  return httpReq('delete', ADMIN_ENDPOINTS.category + '/' + id)
}

// ============ 4. 菜品（下单点餐数据）============
export async function listDishes() {
  if (ADMIN_USE_MOCK) {
    await delay(150)
    return clone(adminData.dishes)
  }
  return httpReq('get', ADMIN_ENDPOINTS.dish)
}
export async function saveDish(dish) {
  if (ADMIN_USE_MOCK) {
    await delay(200)
    if (dish.id) {
      const i = adminData.dishes.findIndex((d) => d.id === dish.id)
      if (i >= 0) adminData.dishes[i] = { ...adminData.dishes[i], ...dish }
    } else {
      const id = Math.max(0, ...adminData.dishes.map((d) => d.id)) + 1
      adminData.dishes.push({ id, sort: adminData.dishes.length + 1, enabled: true, ...dish })
    }
    persistAdminData()
    return { ok: true }
  }
  return httpReq(dish.id ? 'put' : 'post', ADMIN_ENDPOINTS.dish, dish)
}
export async function removeDish(id) {
  if (ADMIN_USE_MOCK) {
    await delay(150)
    adminData.dishes = adminData.dishes.filter((d) => d.id !== id)
    persistAdminData()
    return { ok: true }
  }
  return httpReq('delete', ADMIN_ENDPOINTS.dish + '/' + id)
}

// ============ 8. 数字管理 · 经营数据看板 ============
// mock 看板数据：结构与后端 GET /api/admin/stats 一致
const mockDashboard = {
  overview: {
    orderTotal: 27, gmv: 1286.5, userTotal: 14, dishTotal: 10,
    dishOnSale: 10, categoryTotal: 7, todayOrder: 3, todayGmv: 142.0
  },
  categoryDist: [
    { categoryId: 2, categoryName: '面食', dishCount: 2, sumPrice: 50.0 },
    { categoryId: 3, categoryName: '快餐', dishCount: 2, sumPrice: 64.0 },
    { categoryId: 4, categoryName: '甜点', dishCount: 1, sumPrice: 32.0 },
    { categoryId: 5, categoryName: '饮品', dishCount: 2, sumPrice: 50.0 },
    { categoryId: 6, categoryName: '轻食', dishCount: 2, sumPrice: 56.0 },
    { categoryId: 7, categoryName: '火锅', dishCount: 1, sumPrice: 58.0 }
  ],
  priceDist: [
    { priceRange: '0-15', dishCount: 0 }, { priceRange: '15-25', dishCount: 4 },
    { priceRange: '25-35', dishCount: 5 }, { priceRange: '35-50', dishCount: 0 },
    { priceRange: '50+', dishCount: 1 }
  ],
  orderTrend: (() => {
    const arr = []
    const base = new Date('2026-11-02')
    for (let i = 13; i >= 0; i--) {
      const d = new Date(base); d.setDate(base.getDate() - i)
      const cnt = [1, 0, 2, 3, 1, 2, 4, 2, 1, 3, 2, 1, 2, 3][13 - i] || 0
      arr.push({ date: d.toISOString().slice(0, 10), count: cnt, gmv: Math.round(cnt * 45 * 100) / 100 })
    }
    return arr
  })(),
  topDishes: [
    { dishName: '招牌牛肉面', qty: 12, amount: 336.0 },
    { dishName: '生椰拿铁', qty: 9, amount: 198.0 },
    { dishName: '麻辣牛油锅', qty: 7, amount: 406.0 },
    { dishName: '现烤舒芙蕾', qty: 6, amount: 192.0 },
    { dishName: '鸡胸蔬菜沙拉', qty: 5, amount: 130.0 }
  ]
}

/** 数字管理看板聚合指标：GET /admin/stats */
export async function getDashboard() {
  if (ADMIN_USE_MOCK) {
    await delay(200)
    return clone(mockDashboard)
  }
  return httpReq('get', ADMIN_ENDPOINTS.stats)
}

// ============ 7. 价格（数字管理）============
/** 单条改价：PUT /admin/dish/{id}/price  body: { price } */
export async function updateDishPrice(id, price) {
  if (ADMIN_USE_MOCK) {
    await delay(150)
    const d = adminData.dishes.find((x) => x.id === id)
    if (d) d.price = round2(price)
    persistAdminData()
    return { ok: true }
  }
  return httpReq('put', ADMIN_ENDPOINTS.dish + '/' + id + '/price', { price })
}

/** 批量改价：POST /admin/dish/price/batch  body: { mode, value, ids } */
export async function batchUpdatePrice({ mode, value, ids }) {
  if (ADMIN_USE_MOCK) {
    await delay(250)
    const set = new Set(ids)
    adminData.dishes.forEach((d) => {
      if (!set.has(d.id)) return
      let p = Number(d.price) || 0
      if (mode === 'rate') p = p * Number(value)
      else if (mode === 'add') p = p + Number(value)
      else p = Number(value)
      if (p < 0) p = 0
      d.price = round2(p)
    })
    persistAdminData()
    return { ok: true, count: ids.length }
  }
  return httpReq('post', ADMIN_ENDPOINTS.dish + '/price/batch', { mode, value, ids })
}

function round2(v) {
  const n = Number(v)
  if (!isFinite(n)) return 0
  return Math.round(n * 100) / 100
}

// ============ 5. 用户 ============
export async function listUsers() {
  if (ADMIN_USE_MOCK) {
    await delay(150)
    return clone(adminData.users)
  }
  return httpReq('get', ADMIN_ENDPOINTS.user)
}
export async function updateUser(user) {
  if (ADMIN_USE_MOCK) {
    await delay(200)
    const i = adminData.users.findIndex((u) => u.id === user.id)
    if (i >= 0) adminData.users[i] = { ...adminData.users[i], ...user }
    persistAdminData()
    return { ok: true }
  }
  return httpReq('put', ADMIN_ENDPOINTS.user, user)
}
export async function removeUser(id) {
  if (ADMIN_USE_MOCK) {
    await delay(150)
    adminData.users = adminData.users.filter((u) => u.id !== id)
    persistAdminData()
    return { ok: true }
  }
  return httpReq('delete', ADMIN_ENDPOINTS.user + '/' + id)
}

// 用户收货地址（后台只读查看 + 删除脏数据），对应前台「我的 → 收货地址管理」
// mock 数据仅用于演示，按 userId 分组
const mockUserAddresses = {
  1: [
    { id: 11, account: 'demo', name: '林小满', phone: '13800001234', tag: '家', province: '广东省', city: '深圳市', detail: '南山区科技园南路 8 号 1203', isDefault: true },
    { id: 12, account: 'demo', name: '林小满', phone: '13800001234', tag: '公司', province: '广东省', city: '深圳市', detail: '福田区深南大道 1000 号 A 座 22F', isDefault: false }
  ],
  2: [
    { id: 21, account: 'xiaoming', name: '王小明', phone: '13900002345', tag: '学校', province: '浙江省', city: '杭州市', detail: '西湖区余杭塘路 866 号 5 号楼', isDefault: true }
  ],
  3: [],
  4: []
}

/** 查看某位用户的收货地址：GET /admin/user/{id}/address */
export async function listUserAddresses(userId) {
  if (ADMIN_USE_MOCK) {
    await delay(150)
    return clone(mockUserAddresses[userId] || [])
  }
  return httpReq('get', ADMIN_ENDPOINTS.user + '/' + userId + '/address')
}

/** 删除某位用户的收货地址：DELETE /admin/user/{id}/address/{addressId} */
export async function removeUserAddress(userId, addressId) {
  if (ADMIN_USE_MOCK) {
    await delay(150)
    mockUserAddresses[userId] = (mockUserAddresses[userId] || []).filter((a) => a.id !== addressId)
    return { ok: true }
  }
  return httpReq('delete', ADMIN_ENDPOINTS.user + '/' + userId + '/address/' + addressId)
}

// ============ 6. 订单 ============
export async function listOrders() {
  if (ADMIN_USE_MOCK) {
    await delay(150)
    return clone(adminData.orders)
  }
  return httpReq('get', ADMIN_ENDPOINTS.order)
}
export async function updateOrderStatus(id, status) {
  if (ADMIN_USE_MOCK) {
    await delay(200)
    const i = adminData.orders.findIndex((o) => o.id === id)
    if (i >= 0) adminData.orders[i].status = status
    persistAdminData()
    return { ok: true }
  }
  return httpReq('put', ADMIN_ENDPOINTS.order + '/' + id + '/status', { status })
}
