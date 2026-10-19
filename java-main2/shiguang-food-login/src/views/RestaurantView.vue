<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRestaurantDetail } from '../api/restaurant.js'
import { placeOrder } from '../api/order.js'

const route = useRoute()
const router = useRouter()

const store = ref(null)
const loading = ref(true)
const errMsg = ref('')

// 每道菜的选购数量（默认 1）
const qty = reactive({})
const dishQty = (d) => qty[d.id] || 1
function inc(d) {
  qty[d.id] = dishQty(d) + 1
}
function dec(d) {
  if (dishQty(d) > 1) qty[d.id] = dishQty(d) - 1
}

// 下单（预留后端接口，不实现后端）
const orderingId = ref(null)
async function onOrderDish(d) {
  if (!store.value || orderingId.value) return
  orderingId.value = d.id
  try {
    await placeOrder({
      restaurantId: store.value.id,
      name: store.value.name,
      items: [{ name: d.name, price: d.price, qty: dishQty(d) }]
    })
    showToast(`已下单「${d.name}」×${dishQty(d)} 🎉`)
  } catch (e) {
    showToast(e.message || '下单失败，请稍后重试')
  } finally {
    orderingId.value = null
  }
}

function goBack() {
  router.push('/home')
}

// 评分星条
function starStr(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n)
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
  <div class="detail">
    <!-- 顶部：返回 -->
    <header class="topbar">
      <button class="back" @click="goBack">‹ 返回</button>
      <span class="top-title">店铺详情</span>
      <span class="top-spacer"></span>
    </header>

    <!-- 加载态 -->
    <div v-if="loading" class="state">
      <span class="spinner"></span> 正在加载店铺信息…
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
            <span class="stars">⭐ {{ store.avgRating }}</span>
            <span class="dot">·</span>
            <span>📍 {{ store.distance }}</span>
            <span class="dot">·</span>
            <span>{{ store.cat }}</span>
          </div>
          <div class="store-tags">
            <span class="tag" v-for="t in store.tags" :key="t">{{ t }}</span>
          </div>
          <p class="store-desc">{{ store.desc }}</p>
        </div>
      </section>

      <!-- 店内美食（均可下单） -->
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
              <div class="stepper" v-if="dishQty(d) > 1">
                <button class="step" @click="dec(d)">−</button>
                <span class="qnum">{{ dishQty(d) }}</span>
                <button class="step" @click="inc(d)">+</button>
              </div>
              <div class="dish-btns">
                <button
                  v-if="dishQty(d) === 1"
                  class="step solo"
                  @click="inc(d)"
                  title="增加数量"
                >+</button>
                <button class="order-btn" :disabled="orderingId === d.id" @click="onOrderDish(d)">
                  {{ orderingId === d.id ? '下单中…' : '下单' }}
                </button>
              </div>
            </div>
          </li>
        </ul>
      </section>

      <!-- 用户评价 -->
      <section class="block">
        <div class="block-head">
          <h2>⭐ 用户评价</h2>
          <span class="count">{{ store.reviewCount }} 条</span>
        </div>
        <div class="rate-summary">
          <span class="rate-num">{{ store.avgRating }}</span>
          <span class="rate-stars">{{ starStr(Math.round(store.avgRating)) }}</span>
          <span class="rate-count">共 {{ store.reviewCount }} 条评价</span>
        </div>
        <ul class="reviews">
          <li class="review" v-for="rv in store.reviews" :key="rv.id">
            <div class="rv-avatar">{{ rv.avatar }}</div>
            <div class="rv-body">
              <div class="rv-top">
                <span class="rv-user">{{ rv.user }}</span>
                <span class="rv-stars">{{ starStr(rv.rating) }}</span>
              </div>
              <p class="rv-content">{{ rv.content }}</p>
              <div class="rv-date">{{ rv.date }}</div>
            </div>
          </li>
        </ul>
      </section>

      <footer class="foot">食光 · 美食 — 发现身边的每一口好味道 🌿</footer>
    </template>
  </div>

  <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
</template>

<style scoped>
.detail {
  color: var(--ink);
  display: flex;
  flex-direction: column;
  gap: 16px;
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
.store-desc { margin-top: 10px; font-size: 13px; line-height: 1.6; opacity: 0.95; }

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
  width: 28px; height: 28px; border-radius: 9px; border: 1px solid var(--line);
  background: #fff; color: var(--deep); font-size: 18px; font-weight: 800; cursor: pointer; line-height: 1;
}
.step:hover { background: rgba(0,184,148,0.12); }
.step.solo { width: 30px; height: 30px; }
.qnum { font-size: 14px; font-weight: 800; color: var(--deep); min-width: 16px; text-align: center; }
.dish-btns { display: flex; align-items: center; gap: 8px; }
.order-btn {
  border: none; cursor: pointer; padding: 8px 18px; border-radius: 11px;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff; font-weight: 800; font-size: 13px;
  box-shadow: 0 6px 14px rgba(0,150,136,0.35); transition: transform 0.15s;
}
.order-btn:hover:not(:disabled) { transform: translateY(-1px); }
.order-btn:disabled { opacity: 0.65; cursor: default; }

/* 评价 */
.rate-summary { display: flex; align-items: center; gap: 10px; padding: 10px 0 14px; border-bottom: 1px dashed var(--line); margin-bottom: 12px; }
.rate-num { font-size: 30px; font-weight: 900; color: #f39c12; }
.rate-stars { font-size: 16px; color: #f39c12; letter-spacing: 2px; }
.rate-count { font-size: 12px; color: var(--muted); }
.reviews { list-style: none; display: flex; flex-direction: column; gap: 14px; }
.review { display: flex; gap: 12px; }
.rv-avatar {
  width: 38px; height: 38px; flex: none; border-radius: 50%;
  background: linear-gradient(135deg, var(--mint), var(--cyan)); color: #fff;
  font-weight: 800; display: grid; place-items: center;
}
.rv-body { flex: 1; min-width: 0; }
.rv-top { display: flex; align-items: center; justify-content: space-between; }
.rv-user { font-size: 13px; font-weight: 800; color: var(--ink); }
.rv-stars { font-size: 12px; color: #f39c12; letter-spacing: 1px; }
.rv-content { font-size: 13px; color: var(--muted); margin-top: 5px; line-height: 1.6; }
.rv-date { font-size: 11px; color: var(--muted); margin-top: 6px; opacity: 0.8; }

.foot { text-align: center; font-size: 12px; color: rgba(255,255,255,0.9); text-shadow: 0 2px 8px rgba(0,80,70,0.3); margin-top: 6px; }

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
