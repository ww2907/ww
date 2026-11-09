import { reactive, computed, unref } from 'vue'

// ============================================================
// 全局购物车（按店铺维度）
// ------------------------------------------------------------
// 设计：购物车以「店铺」为单位，同一个店铺的点餐合并到一份购物车里。
//   - 用户在不同店铺挑选的菜品互不影响
//   - 进入某店铺时读取该店铺的购物车；结算/提交订单后清空该店铺购物车
//   - 用 localStorage 持久化，刷新页面不丢；与下单接口（真实/模拟）保持口径一致
// ============================================================

const STORAGE_KEY = 'shiguang_cart'

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

// 统一把店铺标识转成字符串键。
// 注意：调用方可能传响应式的 computed / ref（如 const rid = computed(() => route.params.id)），
// 直接 String(ref) 会得到 "[object Object]"，导致读到不存在的 key、购物车永远为空。
// 这里统一用 unref() 取值，value / ref / computed 都能正确工作。
function toKey(restaurantId) {
  const v = unref(restaurantId)
  return v == null ? '' : String(v)
}

// 取某店铺购物车（不存在则初始化）
function getRestaurantCart(restaurantId) {
  const key = toKey(restaurantId)
  if (!state.data[key]) {
    state.data[key] = { restaurantId: key, restaurantName: '', items: {} }
  }
  return state.data[key]
}

// 加入购物车（同一菜品+同一规格累加数量；不同规格视为独立条目）
function addItem(restaurantId, dish, qty = 1) {
  const cart = getRestaurantCart(restaurantId)
  if (dish && dish.name) cart.restaurantName = cart.restaurantName || dish.restaurantName || ''
  const baseKey = String(dish.id != null ? dish.id : dish.name)
  const specText = dish.specText ? String(dish.specText) : ''
  const k = specText ? baseKey + '#' + specText : baseKey
  const cur = cart.items[k]
  if (cur) {
    cur.qty += qty
  } else {
    cart.items[k] = {
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

// 设定某菜品数量（<=0 则移除）
function setQty(restaurantId, dishKey, qty) {
  const cart = getRestaurantCart(restaurantId)
  const k = String(dishKey)
  if (qty <= 0) {
    delete cart.items[k]
  } else if (cart.items[k]) {
    cart.items[k].qty = qty
  }
  persist()
}

function inc(restaurantId, dish) {
  // 直接累加 1：已存在则 +1，不存在则新建（数量 1）
  addItem(restaurantId, dish, 1)
}

function dec(restaurantId, dishKey) {
  const cart = getRestaurantCart(restaurantId)
  const k = String(dishKey)
  const cur = cart.items[k] ? cart.items[k].qty : 0
  setQty(restaurantId, k, cur - 1)
}

function removeItem(restaurantId, dishKey) {
  setQty(restaurantId, dishKey, 0)
}

function clearRestaurant(restaurantId) {
  const key = toKey(restaurantId)
  if (state.data[key]) {
    state.data[key].items = {}
    persist()
  }
}

// 某店铺购物车的菜品数量 / 总价（computed 友好：传 ref 或原始值均可）
function useCartTotals(restaurantId) {
  // 用 computed 包一层：既支持传 ref/computed（路由参数变化时自动跟随），也支持传原始值
  const id = computed(() => toKey(restaurantId))
  const items = computed(() => {
    const cart = state.data[id.value]
    return cart ? Object.values(cart.items) : []
  })
  const totalCount = computed(() => items.value.reduce((s, it) => s + it.qty, 0))
  const totalPrice = computed(() => items.value.reduce((s, it) => s + it.price * it.qty, 0))
  return { items, totalCount, totalPrice }
}

// 某菜品在某店铺购物车中的数量
function qtyOf(restaurantId, dishKey) {
  const cart = state.data[toKey(restaurantId)]
  const k = String(dishKey)
  return cart && cart.items[k] ? cart.items[k].qty : 0
}

// 所有店铺购物车中的总件数（可用于底部 Tab 角标）
const globalCount = computed(() => {
  let n = 0
  for (const key in state.data) {
    const cart = state.data[key]
    for (const k in cart.items) n += cart.items[k].qty
  }
  return n
})

// 按店铺汇总所有购物车（首页购物车入口用）：只返回有商品的店铺
const storeGroups = computed(() => {
  const groups = []
  for (const key in state.data) {
    const c = state.data[key]
    const items = Object.values(c.items || {})
    if (!items.length) continue
    const count = items.reduce((s, it) => s + it.qty, 0)
    const total = items.reduce((s, it) => s + Number(it.price || 0) * it.qty, 0)
    groups.push({
      restaurantId: key,
      restaurantName: c.restaurantName || '',
      items,
      count,
      total
    })
  }
  return groups
})

export const cart = {
  state,
  getRestaurantCart,
  addItem,
  setQty,
  inc,
  dec,
  removeItem,
  clearRestaurant,
  qtyOf,
  useCartTotals,
  globalCount,
  storeGroups
}
