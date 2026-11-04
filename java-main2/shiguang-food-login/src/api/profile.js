// ============================================================
// 食光 · 个人资料 / 收货地址接口层
// ------------------------------------------------------------
// 与 food.js / order.js / restaurant.js 保持一致的设计：
//   - PROFILE_USE_MOCK 跟随全局 VITE_USE_MOCK（默认 true，无需后端即可演示）
//   - 真实后端接口挂在 /api/users 下（springBootTest · UserProfileController）
//   - 后端未实现 / 网络异常时返回 null，由 store/profile.js 继续使用本地存储，
//     保证「我的」页面在无后端环境下依旧可演示
// 返回约定：null = 后端不可用，请使用本地数据；否则为后端返回的数据
// ============================================================

// 是否使用本地模拟：除非显式设置 VITE_USE_MOCK=false，否则默认 true
export const PROFILE_USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// 后端未实现资料接口时，是否回退到本地存储
export const PROFILE_FALLBACK_MOCK = import.meta.env.VITE_PROFILE_FALLBACK_MOCK !== 'false'

// 后端基础地址，可用 .env 的 VITE_API_BASE 覆盖
export const PROFILE_API_BASE = import.meta.env.VITE_API_BASE || '/api'

// 后端路由（统一挂在 /api/users 下）
export const PROFILE_ENDPOINTS = {
  profile: '/users/profile',
  addresses: '/users/addresses'
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------- 真实后端 ----------
async function createHttp() {
  const { default: axios } = await import('axios')
  return axios.create({
    baseURL: PROFILE_API_BASE,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
  })
}

async function request(method, path, { data, params } = {}) {
  const http = await createHttp()
  const res = await http.request({ method, url: path, data, params })
  // 约定：code === 0 为成功，否则抛出后端返回的 message
  if (res.data.code !== 0) {
    throw new Error(res.data.message || '请求失败')
  }
  return res.data.data
}

/**
 * 统一兜底：mock 模式 / 后端不可用时返回 fallback，避免页面报错。
 * 注意：业务校验类错误（如后端明确返回「昵称不能超过 20 个字符」）也会被兜底，
 *       因此真正的错误提示由 store 层的乐观更新 + toast 承担。
 */
async function withFallback(tag, fallback, fn) {
  if (PROFILE_USE_MOCK) return fallback
  try {
    return await fn()
  } catch (e) {
    if (PROFILE_FALLBACK_MOCK) {
      console.warn(`[profile] ${tag} 接口暂不可用，已回退到本地数据：`, e.message)
      return fallback
    }
    throw e
  }
}

// ============================================================
// 资料
// ============================================================

/** 读取个人资料：GET /api/users/profile?account= */
export function fetchProfile(account) {
  return withFallback('读取资料', null, () =>
    request('get', PROFILE_ENDPOINTS.profile, { params: { account } })
  )
}

/**
 * 保存个人资料：PUT /api/users/profile
 * payload: { account, nickname, avatar, gender, phone, bio }
 */
export async function saveProfile(payload) {
  if (PROFILE_USE_MOCK) {
    await delay(150)
    return null
  }
  return withFallback('保存资料', null, () => request('put', PROFILE_ENDPOINTS.profile, { data: payload }))
}

// ============================================================
// 收货地址
// ============================================================

/** 地址列表：GET /api/users/addresses?account= */
export function fetchAddresses(account) {
  return withFallback('读取地址', null, () =>
    request('get', PROFILE_ENDPOINTS.addresses, { params: { account } })
  )
}

/** 新增地址：POST /api/users/addresses */
export function createAddress(payload) {
  return withFallback('新增地址', null, () =>
    request('post', PROFILE_ENDPOINTS.addresses, { data: payload })
  )
}

/** 编辑地址：PUT /api/users/addresses/{id} */
export function patchAddress(id, payload) {
  return withFallback('编辑地址', null, () =>
    request('put', `${PROFILE_ENDPOINTS.addresses}/${id}`, { data: payload })
  )
}

/** 删除地址：DELETE /api/users/addresses/{id}?account= */
export function deleteAddress(id, account) {
  return withFallback('删除地址', null, () =>
    request('delete', `${PROFILE_ENDPOINTS.addresses}/${id}`, { params: { account } })
  )
}

/** 设为默认地址：POST /api/users/addresses/{id}/default?account= */
export function markDefaultAddress(id, account) {
  return withFallback('设置默认地址', null, () =>
    request('post', `${PROFILE_ENDPOINTS.addresses}/${id}/default`, { params: { account } })
  )
}
