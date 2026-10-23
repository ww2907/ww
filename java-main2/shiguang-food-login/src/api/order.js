// ============================================================
// 食光 · 美食订单接口层（下单 + 我的订单）
// ------------------------------------------------------------
// 与 food.js / restaurant.js 保持一致的设计：
//   - ORDER_USE_MOCK 跟随全局 VITE_USE_MOCK（默认 true，无需后端即可演示）
//   - 真实后端接口路径（POST /api/orders、GET /api/orders?account=）
//   - 后端未实现 / 网络异常时优雅回退本地模拟，保证前端可演示
// 注意：本文件只定义「前端调用契约」，后端逻辑在 springBootTest 项目中实现。
// ============================================================

// 是否使用本地模拟：除非显式设置 VITE_USE_MOCK=false，否则默认 true
export const ORDER_USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// 后端未实现订单接口时，是否回退到本地模拟（保证前端可演示）
export const ORDER_FALLBACK_MOCK = import.meta.env.VITE_ORDER_FALLBACK_MOCK !== 'false'

// 后端基础地址，可用 .env 的 VITE_API_BASE 覆盖
export const ORDER_API_BASE = import.meta.env.VITE_API_BASE || '/api'

// 后端路由（统一挂在 /api/orders 下）
export const ORDER_ENDPOINTS = {
  create: '/orders',
  list: '/orders'
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------- 本地模拟：内存订单（演示时让「我的订单」也能看到刚下的单）----------
const mockOrders = []

function mockOrderNo() {
  return 'M' + Date.now() + '' + Math.floor(Math.random() * 9000 + 1000)
}

function buildMockOrder({ restaurantId, restaurantName, account, items }) {
  const valid = (items || []).filter((it) => it && it.qty > 0)
  const total = valid.reduce((s, it) => s + Number(it.price || 0) * it.qty, 0)
  const itemCount = valid.reduce((s, it) => s + it.qty, 0)
  const order = {
    id: Date.now(),
    orderNo: mockOrderNo(),
    restaurantName: restaurantName || ('店铺' + restaurantId),
    totalAmount: Number(total.toFixed(2)),
    itemCount,
    status: 0,
    statusText: '待支付',
    createdAt: formatNow(),
    items: valid.map((it) => ({
      dishName: it.name,
      price: Number(it.price || 0),
      qty: it.qty,
      subtotal: Number((Number(it.price || 0) * it.qty).toFixed(2))
    }))
  }
  mockOrders.unshift(order)
  return order
}

function formatNow() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

// ---------- 真实后端 ----------
async function httpPost(path, data) {
  const { default: axios } = await import('axios')
  const http = axios.create({
    baseURL: ORDER_API_BASE,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
  })
  const res = await http.post(path, data)
  // 约定：code === 0 为成功，否则抛出后端返回的 message
  if (res.data.code !== 0) {
    throw new Error(res.data.message || '下单失败')
  }
  return res.data.data
}

async function httpGet(path, params) {
  const { default: axios } = await import('axios')
  const http = axios.create({
    baseURL: ORDER_API_BASE,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
  })
  const res = await http.get(path, { params })
  if (res.data.code !== 0) {
    throw new Error(res.data.message || '请求失败')
  }
  return res.data.data
}

// ============================================================
// 统一对外接口（前端直接调用，无需关心 mock / 真实）
// ============================================================

/**
 * 提交订单。参数：{ restaurantId, restaurantName, account, items }
 *   items: [{ dishId, name, price, qty }]
 * 策略：mock 模式直接返回内存订单；真实模式下请求后端 POST /api/orders，
 *       若后端尚未实现该接口（报错 / 404），则回退到本地模拟，保证页面可用。
 */
export async function createOrder({ restaurantId, restaurantName, account, items = [] } = {}) {
  if (ORDER_USE_MOCK) {
    await delay(500)
    return buildMockOrder({ restaurantId, restaurantName, account, items })
  }
  try {
    return await httpPost(ORDER_ENDPOINTS.create, { restaurantId, restaurantName, account, items })
  } catch (e) {
    if (ORDER_FALLBACK_MOCK) {
      console.warn('[order] 后端下单接口暂不可用，已回退到本地模拟：', e.message)
      return buildMockOrder({ restaurantId, restaurantName, account, items })
    }
    throw e
  }
}

/**
 * 查询我的订单。参数：account
 * 策略：mock 模式返回内存订单（按 account 过滤）；真实模式请求 GET /api/orders?account=。
 */
export async function getMyOrders(account) {
  if (ORDER_USE_MOCK) {
    await delay(400)
    if (!account) return []
    return mockOrders.filter((o) => o.account === account)
  }
  try {
    return await httpGet(ORDER_ENDPOINTS.list, { account })
  } catch (e) {
    if (ORDER_FALLBACK_MOCK) {
      console.warn('[order] 后端订单查询暂不可用，已回退到本地模拟：', e.message)
      if (!account) return []
      return mockOrders.filter((o) => o.account === account)
    }
    throw e
  }
}
