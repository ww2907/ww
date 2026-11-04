import { reactive, computed } from 'vue'

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

// 取某店铺购物车（不存在则初始化）
function getRestaurantCart(restaurantId) {
  const key = String(restaurantId)
  if (!state.data[key]) {
    state.data[key] = { restaurantId: key, restaurantName: '', items: {} }
  }
  return state.data[key]
}

// 加入购物车（同一菜品累加数量）
function addItem(restaurantId, dish, qty = 1) {
  const cart = getRestaurantCart(restaurantId)
  if (dish && dish.name) cart.restaurantName = cart.restaurantName || dish.restaurantName || ''
  const k = String(dish.id != null ? dish.id : dish.name)
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
  const key = String(restaurantId)
  if (state.data[key]) {
    state.data[key].items = {}
    persist()
  }
}

// 某店铺购物车的菜品数量 / 总价（computed 友好：传 ref 或原始值均可）
function useCartTotals(restaurantId) {
  const id = String(restaurantId)
  const items = computed(() => {
    const cart = state.data[id]
    return cart ? Object.values(cart.items) : []
  })
  const totalCount = computed(() => items.value.reduce((s, it) => s + it.qty, 0))
  const totalPrice = computed(() => items.value.reduce((s, it) => s + it.price * it.qty, 0))
  return { items, totalCount, totalPrice }
}

// 某菜品在某店铺购物车中的数量
function qtyOf(restaurantId, dishKey) {
  const cart = state.data[String(restaurantId)]
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
  globalCount
}
