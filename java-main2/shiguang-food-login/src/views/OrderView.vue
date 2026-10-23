<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRestaurantDetail } from '../api/restaurant.js'
import { createOrder } from '../api/order.js'
import { session } from '../store.js'

const route = useRoute()
const router = useRouter()

const store = ref(null)
const loading = ref(true)
const errMsg = ref('')

// 购物车：dishKey -> 数量（key 统一转为字符串，兼容 mock 的 '1-m1' 与真实数字 id）
const cart = reactive({})

const dishKey = (d) => String(d.id)
const qtyOf = (d) => cart[dishKey(d)] || 0

function inc(d) {
  const k = dishKey(d)
  cart[k] = qtyOf(d) + 1
}
function dec(d) {
  const k = dishKey(d)
  if (qtyOf(d) > 0) cart[k] = qtyOf(d) - 1
}

const totalCount = computed(() => {
  if (!store.value) return 0
  return store.value.menu.reduce((s, d) => s + qtyOf(d), 0)
})
const totalPrice = computed(() => {
  if (!store.value) return 0
  return store.value.menu.reduce((s, d) => s + Number(d.price || 0) * qtyOf(d), 0)
})

// 提交订单
const submitting = ref(false)
async function submitOrder() {
  if (!store.value || totalCount.value === 0 || submitting.value) return
  submitting.value = true
  const items = store.value.menu
    .filter((d) => qtyOf(d) > 0)
    .map((d) => ({
      dishId: typeof d.id === 'number' ? d.id : null,
      name: d.name,
      price: Number(d.price || 0),
      qty: qtyOf(d)
    }))
  try {
    const order = await createOrder({
      restaurantId: store.value.id,
      restaurantName: store.value.name,
      account: session.account,
      items
    })
    showToast(`下单成功 🎉 订单号 ${order.orderNo}`)
    // 清空购物车并跳转到「我的订单」
    for (const k in cart) delete cart[k]
    setTimeout(() => router.replace('/orders'), 900)
  } catch (e) {
    showToast(e.message || '下单失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push('/home')
}

// 轻提示
const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null
function showToast(msg) {
  toastMsg.value = msg
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2200)
}

onMounted(async () => {
  try {
    store.value = await getRestaurantDetail(route.params.id)
  } catch (e) {
    errMsg.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
})
onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <div class="order">
    <!-- 顶部：返回 -->
    <header class="topbar">
      <button class="back" @click="goBack">‹ 返回</button>
      <span class="top-title">点餐</span>
      <span class="top-spacer"></span>
    </header>

    <!-- 加载态 -->
    <div v-if="loading" class="state">
      <span class="spinner"></span> 正在加载店铺与菜单…
    </div>

    <!-- 错误态 -->
    <div v-else-if="errMsg" class="state empty">😶 {{ errMsg }}</div>

    <!-- 店铺内容 -->
    <template v-else-if="store">
      <!-- 店铺信息 -->
      <section class="store">
        <div class="store-emoji">{{ store.emoji }}</div>
        <div class="store-info">
          <h1 class="store-name">{{ store.name }}</h1>
          <div class="store-meta">
            <span>⭐ {{ store.rating }}</span>
            <span class="dot">·</span>
            <span>📍 {{ store.distance }}</span>
            <span class="dot">·</span>
            <span>{{ store.cat }}</span>
          </div>
          <div class="store-tags">
            <span class="tag" v-for="t in store.tags" :key="t">{{ t }}</span>
          </div>
        </div>
      </section>

      <!-- 店内美食（可加入购物车） -->
      <section class="block">
        <div class="block-head">
          <h2>🍽️ 店内美食</h2>
          <span class="count">{{ store.menu.length }} 道</span>
        </div>
        <ul class="menu">
          <li class="dish" v-for="d in store.menu" :key="d.id">
            <div class="dish-emoji">{{ d.emoji }}</div>
            <div class="dish-main">
              <div class="dish-name">{{ d.name }}</div>
              <div class="dish-desc">{{ d.desc }}</div>
              <div class="dish-price">¥{{ d.price }}</div>
            </div>
            <div class="dish-action">
              <div class="stepper" v-if="qtyOf(d) > 0">
                <button class="step" @click="dec(d)">−</button>
                <span class="qnum">{{ qtyOf(d) }}</span>
                <button class="step" @click="inc(d)">+</button>
              </div>
              <button v-else class="add-btn" @click="inc(d)">＋ 加入</button>
            </div>
          </li>
        </ul>
      </section>

      <footer class="foot">食光 · 美食 — 发现身边的每一口好味道 🌿</footer>
    </template>

    <!-- 底部购物车栏 -->
    <div class="cartbar" v-if="store && !loading && !errMsg">
      <div class="cart-info">
        <div class="cart-count">
          🛒 {{ totalCount }} 件
        </div>
        <div class="cart-total">
          合计 <span class="amount">¥{{ totalPrice.toFixed(2) }}</span>
        </div>
      </div>
      <button
        class="submit"
        :disabled="totalCount === 0 || submitting"
        @click="submitOrder"
      >
        {{ submitting ? '提交中…' : (totalCount === 0 ? '请先选餐' : '提交订单') }}
      </button>
    </div>
  </div>

  <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
</template>

<style scoped>
.order {
  color: var(--ink);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 96px;
}

/* 顶部返回 */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(14px);
  border-radius: 16px;
  box-shadow: var(--shadow);
  border: 1px solid rgba(255, 255, 255, 0.6);
}
.back {
  border: none; cursor: pointer; background: rgba(0, 184, 148, 0.12);
  color: var(--deep); font-weight: 800; font-size: 14px;
  padding: 8px 14px; border-radius: 11px; transition: background 0.15s;
}
.back:hover { background: rgba(0, 184, 148, 0.25); }
.top-title { font-weight: 900; font-size: 16px; color: var(--deep); }
.top-spacer { width: 64px; }

/* 加载 / 错误态 */
.state { text-align: center; padding: 40px 10px; font-size: 14px; color: var(--muted); }
.state.empty { color: var(--deep); }
.spinner {
  display: inline-block; width: 16px; height: 16px;
  border: 3px solid rgba(0, 150, 136, 0.25); border-top-color: var(--teal);
  border-radius: 50%; animation: spin 0.7s linear infinite;
  vertical-align: -3px; margin-right: 6px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 店铺信息 */
.store {
  display: flex; gap: 16px; padding: 20px;
  border-radius: 22px; background: linear-gradient(135deg, rgba(0,184,148,0.92), rgba(0,206,201,0.92));
  color: #fff; box-shadow: var(--shadow);
}
.store-emoji {
  width: 64px; height: 64px; flex: none; border-radius: 18px;
  background: rgba(255,255,255,0.25); display: grid; place-items: center; font-size: 34px;
}
.store-info { min-width: 0; }
.store-name { font-size: 22px; font-weight: 900; text-shadow: 0 3px 14px rgba(0,80,70,0.3); }
.store-meta { margin-top: 8px; font-size: 13px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; opacity: 0.97; }
.store-meta .dot { opacity: 0.6; }
.store-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.store-tags .tag { font-size: 11px; background: rgba(255,255,255,0.22); color: #fff; padding: 3px 9px; border-radius: 8px; }

/* 区块 */
.block { background: rgba(255,255,255,0.86); backdrop-filter: blur(8px); border-radius: 22px; padding: 18px; box-shadow: 0 10px 26px rgba(0,150,136,0.16); border: 1px solid rgba(255,255,255,0.6); }
.block-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
.block-head h2 { font-size: 17px; font-weight: 900; color: var(--deep); }
.count { font-size: 12px; color: var(--muted); }

/* 菜单 */
.menu { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.dish {
  display: flex; gap: 12px; align-items: center;
  background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 12px;
}
.dish-emoji {
  width: 48px; height: 48px; flex: none; border-radius: 13px; font-size: 26px;
  background: linear-gradient(135deg, rgba(0,184,148,0.15), rgba(0,206,201,0.15));
  display: grid; place-items: center;
}
.dish-main { flex: 1; min-width: 0; }
.dish-name { font-size: 15px; font-weight: 800; color: var(--ink); }
.dish-desc { font-size: 12px; color: var(--muted); margin-top: 3px; line-height: 1.5; }
.dish-price { font-size: 14px; font-weight: 800; color: #e8730c; margin-top: 6px; }
.dish-action { flex: none; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.stepper { display: flex; align-items: center; gap: 8px; }
.step {
  width: 30px; height: 30px; border-radius: 10px; border: 1px solid var(--line);
  background: #fff; color: var(--deep); font-size: 18px; font-weight: 800; cursor: pointer; line-height: 1;
}
.step:hover { background: rgba(0,184,148,0.12); }
.qnum { font-size: 14px; font-weight: 800; color: var(--deep); min-width: 18px; text-align: center; }
.add-btn {
  border: none; cursor: pointer; padding: 8px 14px; border-radius: 11px;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff; font-weight: 800; font-size: 13px;
  box-shadow: 0 6px 14px rgba(0,150,136,0.35); transition: transform 0.15s;
}
.add-btn:hover { transform: translateY(-1px); }

.foot { text-align: center; font-size: 12px; color: rgba(255,255,255,0.9); text-shadow: 0 2px 8px rgba(0,80,70,0.3); margin-top: 6px; }

/* 底部购物车栏 */
.cartbar {
  position: fixed;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 36px);
  max-width: 1064px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 20px;
  padding: 12px 16px;
  box-shadow: 0 12px 30px rgba(0, 150, 136, 0.3);
  z-index: 30;
}
.cart-info { display: flex; flex-direction: column; gap: 2px; }
.cart-count { font-size: 13px; font-weight: 800; color: var(--deep); }
.cart-total { font-size: 12px; color: var(--muted); }
.cart-total .amount { font-size: 18px; font-weight: 900; color: #e8730c; }
.submit {
  border: none; cursor: pointer; padding: 12px 26px; border-radius: 14px;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff; font-weight: 800; font-size: 15px;
  box-shadow: 0 8px 18px rgba(0,150,136,0.45); transition: transform 0.15s, box-shadow 0.15s;
}
.submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 11px 22px rgba(0,150,136,0.6); }
.submit:disabled { opacity: 0.55; cursor: default; background: #b8e6da; box-shadow: none; }

/* 轻提示 */
.toast {
  position: fixed; top: 28px; left: 50%; transform: translateX(-50%) translateY(-20px) scale(0.95);
  background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff;
  padding: 14px 26px; border-radius: 14px; font-weight: 700;
  box-shadow: 0 10px 30px rgba(0,150,136,0.45);
  opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s; z-index: 999;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }

@media (max-width: 600px) {
  .dish { flex-wrap: wrap; }
  .dish-action { flex-direction: row; width: 100%; justify-content: flex-end; align-items: center; }
}
</style>
