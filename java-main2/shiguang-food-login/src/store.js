import { reactive } from 'vue'

// 登录态持久化键（localStorage）
const STORAGE_KEY = 'shiguang_session'
// "记住我"时额外记住的用户名，用于登录页自动回填
const REMEMBER_ACCOUNT_KEY = 'shiguang_remember_account'

// 持久化时长：
//  - 勾选"记住我"：30 天
//  - 未勾选：1 天（仍然跨刷新保留，只是到期更早，避免刷新即掉登录）
const TTL_REMEMBER = 30 * 24 * 60 * 60 * 1000
const TTL_DEFAULT = 24 * 60 * 60 * 1000

function safeGet(key) {
  try {
    return localStorage.getItem(key)
  } catch (e) {
    return null
  }
}

function safeSet(key, val) {
  try {
    localStorage.setItem(key, val)
  } catch (e) {
    /* 隐私模式/存储已满时忽略 */
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    /* 忽略存储异常 */
  }
}

// 读取并校验本地登录态：过期或结构异常直接丢弃
function load() {
  const empty = { account: '', token: '', loginAt: 0, expireAt: 0, remember: false }
  const raw = safeGet(STORAGE_KEY)
  if (!raw) return empty
  try {
    const data = JSON.parse(raw)
    if (!data || !data.token || !data.account) {
      safeRemove(STORAGE_KEY)
      return empty
    }
    // 老版本数据没有 expireAt，视为有效期 1 天（兼容升级前的登录态）
    if (!data.expireAt) {
      data.expireAt = data.loginAt ? data.loginAt + TTL_DEFAULT : Date.now() + TTL_DEFAULT
    }
    if (data.expireAt <= Date.now()) {
      safeRemove(STORAGE_KEY)
      return empty
    }
    return {
      account: data.account,
      token: data.token,
      loginAt: data.loginAt || 0,
      expireAt: data.expireAt,
      remember: !!data.remember
    }
  } catch (e) {
    safeRemove(STORAGE_KEY)
    return empty
  }
}

export const session = reactive(load())

/**
 * 写入登录态并持久化到 localStorage（刷新/重开浏览器都不会掉登录）。
 * @param {string} account  用户名
 * @param {string} token    后端返回的 token
 * @param {boolean} remember 是否勾选"记住我"（影响有效期与用户名回填）
 */
export function setSession(account, token, remember) {
  const ttl = remember ? TTL_REMEMBER : TTL_DEFAULT
  const loginAt = Date.now()
  session.account = account
  session.token = token
  session.loginAt = loginAt
  session.expireAt = loginAt + ttl
  session.remember = !!remember

  safeSet(
    STORAGE_KEY,
    JSON.stringify({
      account,
      token,
      loginAt: session.loginAt,
      expireAt: session.expireAt,
      remember: session.remember
    })
  )

  if (remember) setRememberedAccount(account)
  else safeRemove(REMEMBER_ACCOUNT_KEY)
}

export function clearSession() {
  session.account = ''
  session.token = ''
  session.loginAt = 0
  session.expireAt = 0
  session.remember = false
  safeRemove(STORAGE_KEY)
}

/** 是否已登录（会顺带校验有效期，过期即自动清理） */
export function isLoggedIn() {
  if (!session.token) return false
  if (session.expireAt && session.expireAt <= Date.now()) {
    clearSession()
    return false
  }
  return true
}

/** 登录页回填用的用户名 */
export function getRememberedAccount() {
  return safeGet(REMEMBER_ACCOUNT_KEY) || ''
}

export function setRememberedAccount(account) {
  safeSet(REMEMBER_ACCOUNT_KEY, account)
}
