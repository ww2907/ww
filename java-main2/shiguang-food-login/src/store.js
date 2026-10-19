import { reactive } from 'vue'

const STORAGE_KEY = 'shiguang_session'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    /* 忽略解析错误 */
  }
  return { account: '', token: '' }
}

export const session = reactive(load())

// 登录态写入：remember=true 时持久化到 localStorage，否则仅保留在内存
export function setSession(account, token, remember) {
  session.account = account
  session.token = token
  try {
    if (remember) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ account, token }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch (e) {
    /* 忽略存储异常 */
  }
}

export function clearSession() {
  session.account = ''
  session.token = ''
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    /* 忽略存储异常 */
  }
}

export function isLoggedIn() {
  return !!session.token
}
