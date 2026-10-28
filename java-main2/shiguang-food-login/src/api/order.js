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
  list: '/orders',
  stats: '/orders/stats',
  status: '/orders'
}

// mock 模式下的状态文案
function statusTextMock(s) {
  return s === 0 ? '待支付' : s === 1 ? '已支付' : s === 2 ? '已完成' : '已取消'
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------- 本地模拟：内存订单（演示时让「我的订单」也能看到刚下的单）----------
// 用 localStorage 持久化，避免刷新页面后订单丢失（演示数据）
const ORDER_STORAGE_KEY = 'shiguang_mock_orders'
function loadMockOrders() {
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    /* 忽略解析错误 */
  }
  return []
}
function saveMockOrders() {
  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(mockOrders))
  } catch (e) {
    /* 忽略存储异常 */
  }
}
const mockOrders = loadMockOrders()

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
    // 关键：订单必须记录下单账号，否则「我的订单」按账号筛选时查不到该订单
    account: account || '',
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
  saveMockOrders()
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
 * 查询我的订单。参数：account、status（可选，用于状态筛选）
 *   status: 0=待支付 1=已支付 2=已完成 3=已取消（不传则全部）
 * 策略：mock 模式返回内存订单（按 account + status 过滤）；真实模式请求 GET /api/orders?account=&status=。
 */
export async function getMyOrders(account, status) {
  if (ORDER_USE_MOCK) {
    await delay(400)
    if (!account) return []
    return mockOrders.filter(
      (o) => o.account === account && (status == null || o.status === status)
    )
  }
  try {
    const params = { account }
    if (status != null) params.status = status
    return await httpGet(ORDER_ENDPOINTS.list, params)
  } catch (e) {
    if (ORDER_FALLBACK_MOCK) {
      console.warn('[order] 后端订单查询暂不可用，已回退到本地模拟：', e.message)
      if (!account) return []
      return mockOrders.filter(
        (o) => o.account === account && (status == null || o.status === status)
      )
    }
    throw e
  }
}

/**
 * 订单详情：按 id 查询单个订单（含明细）。
 * 策略：mock 模式在内存订单中按 id 查找；真实模式请求 GET /api/orders/{id}。
 */
export async function getOrderDetail(id) {
  if (ORDER_USE_MOCK) {
    await delay(300)
    return mockOrders.find((o) => o.id === id) || null
  }
  try {
    return await httpGet(`${ORDER_ENDPOINTS.list}/${id}`, {})
  } catch (e) {
    if (ORDER_FALLBACK_MOCK) {
      console.warn('[order] 后端订单详情暂不可用，已回退到本地模拟：', e.message)
      return mockOrders.find((o) => o.id === id) || null
    }
    throw e
  }
}

/**
 * 个人中心统计：订单次数（按状态分组）+ 常点食物。
 * 参数：account
 * 策略：mock 模式基于内存订单聚合；真实模式请求 GET /api/orders/stats?account=。
 */
export async function getOrderStats(account) {
  if (ORDER_USE_MOCK) {
    await delay(400)
    const mine = !account ? [] : mockOrders.filter((o) => o.account === account)
    const countBy = { 0: 0, 1: 0, 2: 0, 3: 0 }
    for (const o of mine) countBy[o.status] = (countBy[o.status] || 0) + 1
    // 常点食物：按菜品名称聚合数量
    const map = new Map()
    for (const o of mine) {
      for (const it of o.items || []) {
        const key = it.dishName
        const cur = map.get(key) || { dishName: key, totalQty: 0, orderTimes: 0, price: it.price, dishId: null }
        cur.totalQty += it.qty
        cur.orderTimes += 1
        cur.price = it.price
        map.set(key, cur)
      }
    }
    const frequentFoods = Array.from(map.values())
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 10)
    return {
      totalOrders: mine.length,
      unpaidCount: countBy[0],
      paidCount: countBy[1],
      completedCount: countBy[2],
      cancelledCount: countBy[3],
      frequentFoods
    }
  }
  try {
    return await httpGet(ORDER_ENDPOINTS.stats, { account })
  } catch (e) {
    if (ORDER_FALLBACK_MOCK) {
      console.warn('[order] 后端统计接口暂不可用，已回退到本地模拟：', e.message)
      return {
        totalOrders: 0,
        unpaidCount: 0,
        paidCount: 0,
        completedCount: 0,
        cancelledCount: 0,
        frequentFoods: []
      }
    }
    throw e
  }
}

/**
 * 变更订单状态（去支付 / 确认完成 / 取消订单）。
 * 参数：id（订单 id）、status（1=已支付 2=已完成 3=已取消）
 * 策略：mock 模式直接改内存订单状态；真实模式请求 POST /api/orders/{id}/status?status=。
 */
export async function updateOrderStatus(id, status) {
  if (ORDER_USE_MOCK) {
    await delay(300)
    const o = mockOrders.find((x) => x.id === id)
    if (o) {
      o.status = status
      o.statusText = statusTextMock(status)
      saveMockOrders()
    }
    return o
  }
  try {
    return await httpPost(`${ORDER_ENDPOINTS.status}/${id}/status?status=${status}`, {})
  } catch (e) {
    if (ORDER_FALLBACK_MOCK) {
      console.warn('[order] 后端状态变更暂不可用，已回退到本地模拟：', e.message)
      const o = mockOrders.find((x) => x.id === id)
      if (o) {
        o.status = status
        o.statusText = statusTextMock(status)
      }
      return o
    }
    throw e
  }
}
