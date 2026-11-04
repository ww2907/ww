import { reactive, watch } from 'vue'
import {
  fetchProfile,
  saveProfile as saveProfileRemote,
  fetchAddresses,
  createAddress,
  patchAddress,
  deleteAddress as deleteAddressRemote,
  markDefaultAddress
} from '../api/profile.js'

// ============================================================
// 个人资料 + 收货地址（本地优先 + 后端同步，按账号隔离）
// ------------------------------------------------------------
// 数据流：
//   1) 本地 localStorage 始终作为「离线缓存 / 演示数据源」，页面读到的就是本地状态；
//   2) 后端可用时（VITE_USE_MOCK=false），loadProfile / loadAddresses 会用
//      服务端数据覆盖本地；任何写操作都先改本地再异步提交后端，
//      失败也不影响界面（api 层会返回 null 表示「后端不可用」）。
// 对应后端：springBootTest · UserProfileController（/api/users/**）
// ============================================================

const PROFILE_KEY = 'shiguang_profile'
const ADDR_KEY = 'shiguang_addresses'

// 可选头像（Emoji 集合），供头像修改选择
export const AVATAR_OPTIONS = [
  '🦊', '🐼', '🐱', '🐶', '🐰', '🐯', '🦁', '🐸',
  '🐵', '🐧', '🦉', '🐙', '🍜', '🍰', '🥗', '🍔'
]

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
    /* 忽略存储异常 */
  }
}

function loadProfileFromStorage() {
  const raw = safeGet(PROFILE_KEY)
  if (!raw) return {}
  try {
    const p = JSON.parse(raw)
    return p && typeof p === 'object' ? p : {}
  } catch (e) {
    return {}
  }
}

function loadAddressesFromStorage() {
  const raw = safeGet(ADDR_KEY)
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch (e) {
    return []
  }
}

// 默认值：头像取账号首字母，昵称取账号
function defaultProfile(account) {
  const a = account || '美食家'
  return {
    account: a,
    nickname: a,
    avatar: '', // 空串表示使用文字头像（取昵称首字）
    gender: '',
    phone: '',
    bio: '热爱生活，热爱美食 🍜'
  }
}

const profile = reactive(Object.assign(defaultProfile(''), loadProfileFromStorage()))
const addresses = reactive({ list: loadAddressesFromStorage() })

// 资料变更后持久化
watch(
  profile,
  () => {
    safeSet(PROFILE_KEY, JSON.stringify({ ...profile }))
  },
  { deep: true }
)

// 地址变更后持久化
watch(
  addresses,
  () => {
    safeSet(ADDR_KEY, JSON.stringify(addresses.list))
  },
  { deep: true }
)

// ==================== 资料 ====================

/**
 * 登录后同步账号并补齐默认资料，同时尝试从后端拉取真实资料与地址。
 * 不阻塞页面渲染：后端不可用 / mock 模式时静默跳过。
 */
export function initProfileForAccount(account) {
  if (!account) return
  if (!profile.account || profile.account === '美食家') {
    Object.assign(profile, defaultProfile(account))
  } else {
    profile.account = account
  }
  // 后端有数据时以服务端为准（mock / 网络异常时自动跳过）
  loadProfile(account).catch(() => {})
  loadAddresses(account).catch(() => {})
}

/** 从后端刷新个人资料；返回最新的 profile */
export async function loadProfile(account) {
  const acc = account || profile.account
  if (!acc) return profile
  const remote = await fetchProfile(acc)
  if (remote && typeof remote === 'object') {
    Object.assign(profile, {
      account: remote.account || acc,
      nickname: remote.nickname || acc,
      avatar: remote.avatar || '',
      gender: remote.gender || '',
      phone: remote.phone || '',
      bio: remote.bio || ''
    })
  }
  return profile
}

/**
 * 保存个人资料：本地立即生效，再提交后端（PUT /api/users/profile）。
 * patch: { nickname, avatar, gender, phone, bio }
 */
export async function saveProfile(patch = {}) {
  const next = {
    nickname: String(patch.nickname != null ? patch.nickname : profile.nickname || '').trim(),
    avatar: patch.avatar != null ? patch.avatar : profile.avatar || '',
    gender: patch.gender != null ? patch.gender : profile.gender || '',
    phone: String(patch.phone != null ? patch.phone : profile.phone || '').trim(),
    bio: String(patch.bio != null ? patch.bio : profile.bio || '').trim()
  }
  if (!next.nickname) next.nickname = profile.account || '美食家'

  // 乐观更新：先让界面与本地缓存生效
  Object.assign(profile, next)

  await saveProfileRemote({ account: profile.account, ...next })
  return profile
}

export function getProfile() {
  return profile
}

// ==================== 地址管理 ====================

let addrSeq = Date.now()
function nextAddrId() {
  return 'addr_' + addrSeq++
}

function normalizeAddress(a) {
  return {
    id: a.id,
    name: a.name || '',
    phone: a.phone || '',
    tag: a.tag || '家',
    province: a.province || '',
    city: a.city || '',
    detail: a.detail || '',
    isDefault: !!a.isDefault
  }
}

export function getAddresses() {
  return addresses.list
}

/** 从后端刷新地址列表；后端不可用时保留本地数据 */
export async function loadAddresses(account) {
  const acc = account || profile.account
  if (!acc) return addresses.list
  const remote = await fetchAddresses(acc)
  if (Array.isArray(remote)) {
    addresses.list.splice(0, addresses.list.length, ...remote.map(normalizeAddress))
  }
  return addresses.list
}

/** 新增地址：本地先行插入，后端返回后替换为服务端数据（真实 id） */
export async function addAddress(addr) {
  const item = {
    id: nextAddrId(),
    name: addr.name || '',
    phone: addr.phone || '',
    tag: addr.tag || '家',
    province: addr.province || '',
    city: addr.city || '',
    detail: addr.detail || '',
    isDefault: !!addr.isDefault
  }
  if (item.isDefault) {
    addresses.list.forEach((a) => (a.isDefault = false))
  }
  addresses.list.unshift(item)

  const saved = await createAddress({ account: profile.account, ...item })
  if (saved && saved.id != null) {
    const idx = addresses.list.findIndex((a) => a.id === item.id)
    if (idx !== -1) addresses.list[idx] = normalizeAddress(saved)
  }
  return item
}

/** 编辑地址：本地合并后提交后端 */
export async function updateAddress(id, patch) {
  const idx = addresses.list.findIndex((a) => a.id === id)
  if (idx === -1) return
  const merged = { ...addresses.list[idx], ...patch }
  if (merged.isDefault) {
    addresses.list.forEach((a) => (a.isDefault = false))
  }
  addresses.list[idx] = merged

  const saved = await patchAddress(id, { account: profile.account, ...merged })
  if (saved && saved.id != null) {
    const i = addresses.list.findIndex((a) => a.id === id)
    if (i !== -1) addresses.list[i] = normalizeAddress(saved)
  }
}

/** 删除地址 */
export async function removeAddress(id) {
  const idx = addresses.list.findIndex((a) => a.id === id)
  if (idx !== -1) addresses.list.splice(idx, 1)
  await deleteAddressRemote(id, profile.account)
}

/** 设为默认地址（同一账号仅一个默认） */
export async function setDefaultAddress(id) {
  addresses.list.forEach((a) => (a.isDefault = a.id === id))
  await markDefaultAddress(id, profile.account)
}
