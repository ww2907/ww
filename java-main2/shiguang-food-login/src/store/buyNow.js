import { reactive, computed, unref } from 'vue'

// ============================================================
// 「立即下单」草稿（按店铺维度，独立于购物车）
// ------------------------------------------------------------
// 为什么单独一份而不是复用 cart：
//   - 购物车是「慢慢挑、之后一起结算」；立即下单是「这一次就要，不经过购物车」
//   - 从首页/美食页「下单」、菜品弹窗「立即下单」进来的商品只进这份草稿，
//     不会污染用户的购物车，也不会被购物车里的旧商品影响
//   - 提交成功后清空该店铺草稿；刷新页面不丢（localStorage 持久化）
// ============================================================

const STORAGE_KEY = 'shiguang_buy_now'

// 内存结构：{ [restaurantId]: { restaurantId, restaurantName, items: { [dishKey]: {...} } } }
const state = reactive({ data: load() })

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
    /* 隐私模式 / 存储已满时忽略 */
  }
}

function load() {
  const raw = safeGet(STORAGE_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (e) {
    return {}
  }
}

function persist() {
  safeSet(STORAGE_KEY, JSON.stringify(state.data))
}

// 路由参数可能是 ref / computed，统一 unref 再转字符串键（与 cart.js 同一套约定）
function toKey(restaurantId) {
  const v = unref(restaurantId)
  return v == null ? '' : String(v)
}

function getDraft(restaurantId) {
  const key = toKey(restaurantId)
  if (!state.data[key]) {
    state.data[key] = { restaurantId: key, restaurantName: '', items: {} }
  }
  return state.data[key]
}

// 加入本单（同一菜品 + 同一规格累加；不同规格视为独立条目）
function addItem(restaurantId, dish, qty = 1) {
  const draft = getDraft(restaurantId)
  if (!dish || !dish.name) return
  draft.restaurantName = dish.restaurantName || draft.restaurantName || ''
  const baseKey = String(dish.id != null ? dish.id : dish.name)
  const specText = dish.specText ? String(dish.specText) : ''
  const k = specText ? baseKey + '#' + specText : baseKey
  const cur = draft.items[k]
  if (cur) {
    cur.qty += qty
  } else {
    draft.items[k] = {
      dishKey: k,
      id: dish.id != null ? dish.id : null,
      name: dish.name,
      price: Number(dish.price || 0),
      emoji: dish.emoji || '🍽️',
      desc: dish.desc || '',
      specText: specText || '',
      qty
    }
  }
  persist()
}

function setQty(restaurantId, dishKey, qty) {
  const draft = getDraft(restaurantId)
  const k = String(dishKey)
  if (qty <= 0) {
    delete draft.items[k]
  } else if (draft.items[k]) {
    draft.items[k].qty = qty
  }
  persist()
}

function inc(restaurantId, dish) {
  addItem(restaurantId, dish, 1)
}

function dec(restaurantId, dishKey) {
  const draft = getDraft(restaurantId)
  const k = String(dishKey)
  const cur = draft.items[k] ? draft.items[k].qty : 0
  setQty(restaurantId, k, cur - 1)
}

function removeItem(restaurantId, dishKey) {
  setQty(restaurantId, dishKey, 0)
}

function clearDraft(restaurantId) {
  const key = toKey(restaurantId)
  if (state.data[key]) {
    state.data[key].items = {}
    persist()
  }
}

// 某店铺草稿的条目 / 件数 / 总价（传 ref 或原始值都可）
function useTotals(restaurantId) {
  const id = computed(() => toKey(restaurantId))
  const items = computed(() => {
    const draft = state.data[id.value]
    return draft ? Object.values(draft.items) : []
  })
  const totalCount = computed(() => items.value.reduce((s, it) => s + it.qty, 0))
  const totalPrice = computed(() => items.value.reduce((s, it) => s + it.price * it.qty, 0))
  return { items, totalCount, totalPrice }
}

function qtyOf(restaurantId, dishKey) {
  const draft = state.data[toKey(restaurantId)]
  const k = String(dishKey)
  return draft && draft.items[k] ? draft.items[k].qty : 0
}

export const buyNow = {
  state,
  getDraft,
  addItem,
  setQty,
  inc,
  dec,
  removeItem,
  clearDraft,
  useTotals,
  qtyOf
}
