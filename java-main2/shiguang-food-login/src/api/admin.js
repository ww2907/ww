// ============================================================
// 后台管理系统 - 接口层
// ------------------------------------------------------------
// 与 auth.js / food.js 保持同一套契约：
//   - VITE_USE_MOCK 默认 true（无需后端即可演示）
//   - 真实后端路由统一挂在 /api/admin 下
//   - 返回结构约定：{ code: 0, data: {...}, message: 'ok' }
// ============================================================
import { adminData, setAdminSession, persistAdminData, clearAdminSession } from '../store/admin.js'

export const ADMIN_USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
export const ADMIN_API_BASE = import.meta.env.VITE_API_BASE || '/api'

export const ADMIN_ENDPOINTS = {
  login: '/admin/login',
  nav: '/admin/nav',
  search: '/admin/search',
  recommend: '/admin/recommend',
  category: '/admin/category',
  dish: '/admin/dish',
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
