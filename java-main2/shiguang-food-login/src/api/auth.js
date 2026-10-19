// ============================================================
// 食光 · 鉴权接口层
// ------------------------------------------------------------
// 已接入真实后端（USE_MOCK=false）：
//   - 账号为用户名（3-20 位字母、数字或下划线），不使用手机号/邮箱
//   - 注册 / 登录 / 找回密码均使用图片验证码
//     （先调 getCaptcha 获取 { captchaId, image }，
//      提交时携带 captchaId + captchaCode）
//   - 返回结构约定：{ code: 0, data: {...}, message: 'ok' }
// ============================================================

// 是否使用本地模拟：除非显式设置 VITE_USE_MOCK=false，否则默认 true
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// 后端基础地址，可用 .env 的 VITE_API_BASE 覆盖
export const API_BASE = import.meta.env.VITE_API_BASE || '/api'

// 后端路由（统一挂在 /api/auth 下）
export const ENDPOINTS = {
  login: '/auth/login',
  register: '/auth/register',
  captcha: '/auth/captcha',
  forgot: '/auth/forgot'
}

// 密码规则（与页面保持一致）：6-12 位
export const PW_MIN = 6
export const PW_MAX = 12

// 图片验证码长度
export const CAPTCHA_LEN = 4

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function validAccount(v) {
  // 用户名：3-20 位字母、数字或下划线
  return /^[a-zA-Z0-9_]{3,20}$/.test(v)
}

function validPassword(v) {
  return v.length >= PW_MIN && v.length <= PW_MAX
}

function validCaptcha(v) {
  return /^[A-Za-z0-9]{4}$/.test(v)
}

// ---------- 真实后端 ----------
async function httpPost(path, data) {
  const { default: axios } = await import('axios')
  const http = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
  })
  const res = await http.post(path, data)
  // 约定：code === 0 为成功，否则抛出后端返回的 message
  if (res.data.code !== 0) {
    throw new Error(res.data.message || '请求失败')
  }
  return res.data.data
}

// ---------- 本地模拟（无需后端即可演示）----------
// 模拟用户表：用户名 -> 密码
const mockUsers = new Map([['demo', '123456']])
// 最近一次生成的模拟验证码
let mockCaptcha = null

function genMockCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < CAPTCHA_LEN; i++) code += chars[Math.floor(Math.random() * chars.length)]
  mockCaptcha = { code, expire: Date.now() + 5 * 60 * 1000 }
  // 用 SVG 模拟验证码图片
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="132" height="44">` +
    `<rect width="100%" height="100%" fill="#f0faf7"/>` +
    `<line x1="8" y1="36" x2="120" y2="10" stroke="#9ad9c9" stroke-width="2"/>` +
    `<line x1="20" y1="6" x2="110" y2="40" stroke="#b8e6da" stroke-width="2"/>` +
    `<text x="66" y="30" text-anchor="middle" font-family="Arial" font-size="28" font-weight="bold" fill="#0d8f81" letter-spacing="8">${code}</text></svg>`
  return {
    captchaId: 'mock-' + Date.now(),
    image: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
  }
}

function mockValidate(code) {
  if (!mockCaptcha || mockCaptcha.expire < Date.now()) {
    throw new Error('验证码已过期，请刷新后重试')
  }
  if (!code || mockCaptcha.code !== code.trim().toUpperCase()) {
    throw new Error('验证码不正确')
  }
}

// ---------- 统一对外接口 ----------

/** 获取图片验证码，返回 { captchaId, image } */
export async function getCaptcha() {
  if (USE_MOCK) {
    await delay(200)
    return genMockCaptcha()
  }
  return httpPost(ENDPOINTS.captcha, {})
}

/** 登录 */
export async function login({ account, password, captchaId, captchaCode }) {
  if (USE_MOCK) {
    await delay(700)
    if (!validAccount(account)) throw new Error('用户名需为3-20位字母、数字或下划线')
    if (!validPassword(password)) throw new Error(`密码长度需为 ${PW_MIN}-${PW_MAX} 位`)
    mockValidate(captchaCode)
    if (mockUsers.get(account) !== password) throw new Error('账号或密码错误')
    return { token: 'mock-token-' + Date.now(), account, nickname: '演示用户' }
  }
  return httpPost(ENDPOINTS.login, { account, password, captchaId, captchaCode })
}

/** 注册（用户名 + 图片验证码） */
export async function register({ account, password, nickname, captchaId, captchaCode }) {
  if (USE_MOCK) {
    await delay(800)
    if (!validAccount(account)) throw new Error('用户名需为3-20位字母、数字或下划线')
    if (!validPassword(password)) throw new Error(`密码长度需为 ${PW_MIN}-${PW_MAX} 位`)
    mockValidate(captchaCode)
    if (mockUsers.has(account)) throw new Error('该用户名已被注册')
    mockUsers.set(account, password)
    return { token: 'mock-token-' + Date.now(), account, nickname: nickname || '美食家' }
  }
  return httpPost(ENDPOINTS.register, { account, password, nickname, captchaId, captchaCode })
}

/** 找回密码（直接重置） */
export async function forgotPassword({ account, newPassword, captchaId, captchaCode }) {
  if (USE_MOCK) {
    await delay(800)
    if (!validAccount(account)) throw new Error('用户名需为3-20位字母、数字或下划线')
    mockValidate(captchaCode)
    if (!mockUsers.has(account)) throw new Error('该账号不存在')
    if (!validPassword(newPassword)) throw new Error(`密码长度需为 ${PW_MIN}-${PW_MAX} 位`)
    mockUsers.set(account, newPassword)
    return { success: true, account }
  }
  return httpPost(ENDPOINTS.forgot, { account, newPassword, captchaId, captchaCode })
}

export { validAccount, validPassword, validCaptcha }
