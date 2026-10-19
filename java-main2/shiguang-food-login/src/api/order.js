// ============================================================
// 食光 · 美食下单接口层
// ------------------------------------------------------------
// 与 food.js 保持一致的设计：
//   - ORDER_USE_MOCK 跟随全局 VITE_USE_MOCK（本项目 .env 为 false，即默认走真实后端）
//   - 真实后端接口路径已预留（ORDER_ENDPOINTS.create = '/orders'）
//   - 后端未实现时优雅回退本地模拟，保证前端「下单」可演示
// 注意：本文件只定义「前端调用契约」，不实现后端逻辑。
// ============================================================

// 是否使用本地模拟：跟随全局 VITE_USE_MOCK
export const ORDER_USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// 后端基础地址，可用 .env 的 VITE_API_BASE 覆盖
export const ORDER_API_BASE = import.meta.env.VITE_API_BASE || '/api'

// 后端路由（统一挂在 /api/orders 下）
export const ORDER_ENDPOINTS = {
  create: '/orders'
}

// 后端未实现下单接口时，是否回退到本地模拟（保证前端可演示）
export const ORDER_FALLBACK_MOCK = import.meta.env.VITE_ORDER_FALLBACK_MOCK !== 'false'

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------- 真实后端（POST /api/orders）----------
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

/**
 * 提交订单。参数：{ restaurantId, name, items }
 * 策略：mock 模式直接返回模拟订单；真实模式优先请求后端，
 *       若后端尚未实现该接口（报错 / 404），则回退到本地模拟，保证页面可用。
 */
export async function placeOrder({ restaurantId, name, items = [] } = {}) {
  if (ORDER_USE_MOCK) {
    await delay(500)
    return { orderId: 'mock-' + Date.now(), status: 'created', restaurantId, name }
  }
  try {
    return await httpPost(ORDER_ENDPOINTS.create, { restaurantId, name, items })
  } catch (e) {
    if (ORDER_FALLBACK_MOCK) {
      console.warn('[order] 后端下单接口暂不可用，已回退到本地模拟：', e.message)
      return { orderId: 'mock-' + Date.now(), status: 'created', restaurantId, name }
    }
    throw e
  }
}
