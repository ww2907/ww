<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRestaurantDetail } from '../api/restaurant.js'
import { cart } from '../store/cart.js'
import { toast } from '../composables/useToast.js'
import DishPopup from '../components/DishPopup.vue'

const route = useRoute()
const router = useRouter()

const store = ref(null)
const loading = ref(true)
const errMsg = ref('')

// 购物车（共享 store，按店铺维度）
const rid = computed(() => route.params.id)
const { items, totalCount, totalPrice } = cart.useCartTotals(rid)
// 某菜品的总数量（含所有规格条目）
function qtyOfDish(d) {
  const id = d.id != null ? String(d.id) : String(d.name)
  return items.value.filter((it) => String(it.id) === id).reduce((s, it) => s + it.qty, 0)
}
// 减掉该菜品「最后加入的规格条目」一份
function decDish(d) {
  const id = d.id != null ? String(d.id) : String(d.name)
  const it = items.value.filter((x) => String(x.id) === id).pop()
  if (it) cart.dec(rid.value, it.dishKey)
}

// ---------- 起送价 / 差额 / 结算可用性 ----------
const minOrder = computed(() => (store.value && store.value.minOrder != null ? Number(store.value.minOrder) : 0))
const isClosed = computed(() => store.value != null && store.value.openStatus === 0)
const reachable = computed(() => totalPrice.value >= minOrder.value)
const diff = computed(() => Math.max(0, minOrder.value - totalPrice.value))
const canCheckout = computed(() => totalCount.value > 0 && reachable.value && !isClosed.value)

// 底部购物车栏：点击展开「已选商品」浮层
const cartPanelOpen = ref(false)
function toggleCartPanel() {
  if (items.value.length === 0) return
  cartPanelOpen.value = !cartPanelOpen.value
}

// 菜品弹窗
const popupShow = ref(false)
const activeDish = ref(null)
function openDish(d) {
  activeDish.value = d
  popupShow.value = true
}
function onDishAdded() {
  toast('已加入购物车 🛒', 'success')
}

function goOrder() {
  if (!canCheckout.value) return
  cartPanelOpen.value = false
  router.push('/order/' + rid.value)
}

function goBack() {
  router.push('/home')
}

// 评分星条
function starStr(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n)
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
      <section class="store" :class="{ closed: store.openStatus === 0 }">
        <div class="store-emoji">{{ store.emoji }}</div>
        <div class="store-info">
          <div class="store-name-row">
            <h1 class="store-name">{{ store.name }}</h1>
            <span class="open-badge" :class="store.openStatus === 0 ? 'closed' : 'open'">{{ store.openStatus === 0 ? '已打烊' : '营业中' }}</span>
          </div>
          <div class="store-meta">
            <span class="stars">⭐ {{ store.avgRating }}</span>
            <span class="dot">·</span>
            <span>📍 {{ store.distance }}</span>
            <span class="dot">·</span>
            <span>{{ store.cat }}</span>
          </div>
          <div class="store-biz">
            <span class="biz-item">起送 ¥{{ store.minOrder }}</span>
            <span class="biz-dot">·</span>
            <span class="biz-item">配送 ¥{{ store.deliveryFee }}</span>
            <span class="biz-dot">·</span>
            <span class="biz-item">🕒 约 {{ store.eta }} 送达</span>
          </div>
          <div class="store-tags">
            <span class="tag" v-for="t in store.tags" :key="t">{{ t }}</span>
          </div>
          <p class="store-desc">{{ store.desc }}</p>
        </div>
      </section>

      <!-- 店内美食（点击查看菜品详情 / 加入购物车） -->
      <section class="block">
        <div class="block-head">
          <h2>🍽️ 店内美食</h2>
          <span class="count">{{ store.menu.length }} 道</span>
        </div>
        <ul class="menu">
          <li class="dish" v-for="d in store.menu" :key="d.id" @click="openDish(d)">
            <div class="dish-emoji">{{ d.emoji }}</div>
            <div class="dish-main">
              <div class="dish-name">{{ d.name }}</div>
              <div class="dish-desc">{{ d.desc }}</div>
              <div class="dish-price">¥{{ d.price }}</div>
            </div>
            <div class="dish-action" @click.stop>
              <div class="stepper" v-if="qtyOfDish(d) > 0">
                <button class="step" @click="decDish(d)">−</button>
                <span class="qnum">{{ qtyOfDish(d) }}</span>
                <button class="step" @click="openDish(d)">+</button>
              </div>
              <button v-else class="add-btn" @click="openDish(d)">＋ 选规格</button>
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

    <!-- 底部购物车栏 -->
    <div class="cartbar" v-if="store && !loading && !errMsg && totalCount > 0">
      <!-- 已选商品浮层 -->
      <transition name="cp-fade">
        <div v-if="cartPanelOpen" class="cart-panel">
          <div class="cp-head">
            <span>已选商品</span>
            <button class="cp-clear" @click="cart.clearRestaurant(rid); cartPanelOpen = false">清空</button>
          </div>
          <ul class="cp-list">
            <li class="cp-item" v-for="it in items" :key="it.dishKey">
              <span class="cp-emoji">{{ it.emoji }}</span>
              <div class="cp-main">
                <div class="cp-name">{{ it.name }}</div>
                <div class="cp-spec" v-if="it.specText">{{ it.specText }}</div>
                <div class="cp-price">¥{{ Number(it.price || 0).toFixed(2) }}</div>
              </div>
              <div class="cp-stepper">
                <button class="cp-step" @click="cart.dec(rid, it.dishKey)">−</button>
                <span class="cp-qnum">{{ it.qty }}</span>
                <button class="cp-step" @click="cart.inc(rid, { ...it, id: it.id != null ? it.id : it.dishKey })">+</button>
              </div>
            </li>
          </ul>
        </div>
      </transition>

      <div class="cart-info" @click="toggleCartPanel">
        <div class="cart-count">🛒 {{ totalCount }} 件</div>
        <div class="cart-total">合计 <span class="amount">¥{{ totalPrice.toFixed(2) }}</span></div>
        <div class="cart-diff" v-if="!reachable">还差 <b>¥{{ diff.toFixed(2) }}</b> 起送</div>
        <div class="cart-diff ok" v-else>已满足起送 ¥{{ minOrder }}</div>
      </div>
      <button class="submit" :disabled="!canCheckout" @click="goOrder">
        {{ isClosed ? '已打烊' : !reachable ? '还差起送' : '去结算' }}
      </button>
    </div>

    <!-- 无购物车时也显示起送价提示（未选餐） -->
    <div class="cartbar cartbar-empty" v-else-if="store && !loading && !errMsg">
      <div class="cart-info">
        <div class="cart-count">🛒 购物车</div>
        <div class="cart-diff">起送 ¥{{ minOrder }}</div>
      </div>
      <button class="submit" disabled>{{ isClosed ? '已打烊' : '去结算' }}</button>
    </div>

    <DishPopup
      :show="popupShow"
      :dish="activeDish"
      :restaurant-id="rid"
      :restaurant-name="store ? store.name : ''"
      @close="popupShow = false"
      @added="onDishAdded"
    />
  </div>
</template>

<style scoped>
.detail {
  color: var(--ink);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 120px;
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
.store-info { min-width: 0; flex: 1; }
.store-name-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.store-name { font-size: 22px; font-weight: 900; text-shadow: 0 3px 14px rgba(0,80,70,0.3); }
.store .open-badge { font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 999px; flex: none; }
.store .open-badge.open { background: rgba(255,255,255,0.25); color: #fff; }
.store .open-badge.closed { background: rgba(0,0,0,0.2); color: rgba(255,255,255,0.9); }
.store-meta { margin-top: 8px; font-size: 13px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; opacity: 0.97; }
.store-meta .dot { opacity: 0.6; }
.store-biz { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.store-biz .biz-item {
  font-size: 12px; font-weight: 800; background: rgba(255,255,255,0.2); color: #fff;
  padding: 4px 10px; border-radius: 999px;
}
.store-biz .biz-dot { opacity: 0.6; }
.store-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.store-tags .tag { font-size: 11px; background: rgba(255,255,255,0.22); color: #fff; padding: 3px 9px; border-radius: 8px; }
.store-desc { margin-top: 10px; font-size: 13px; line-height: 1.6; opacity: 0.95; }
.store.closed .store-emoji { filter: grayscale(0.6); opacity: 0.7; }

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
  cursor: pointer; transition: box-shadow 0.15s, transform 0.15s;
}
.dish:hover { box-shadow: 0 10px 22px rgba(0, 150, 136, 0.16); transform: translateY(-1px); }
.dish-emoji {
  width: 48px; height: 48px; flex: none; border-radius: 13px; font-size: 26px;
  background: linear-gradient(135deg, rgba(0,184,148,0.15), rgba(0,206,201,0.15));
  display: grid; place-items: center;
}
.dish-main { flex: 1; min-width: 0; }
.dish-name { font-size: 15px; font-weight: 800; color: var(--ink); }
.dish-desc { font-size: 12px; color: var(--muted); margin-top: 3px; line-height: 1.5;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dish-price { font-size: 14px; font-weight: 800; color: #e8730c; margin-top: 6px; }
.dish-action { flex: none; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.stepper { display: flex; align-items: center; gap: 8px; }
.step {
  width: 28px; height: 28px; border-radius: 9px; border: 1px solid var(--line);
  background: #fff; color: var(--deep); font-size: 18px; font-weight: 800; cursor: pointer; line-height: 1;
}
.step:hover { background: rgba(0,184,148,0.12); }
.qnum { font-size: 14px; font-weight: 800; color: var(--deep); min-width: 16px; text-align: center; }
.add-btn {
  border: none; cursor: pointer; padding: 8px 14px; border-radius: 11px;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff; font-weight: 800; font-size: 13px;
  box-shadow: 0 6px 14px rgba(0, 150, 136, 0.35); transition: transform 0.15s;
}
.add-btn:hover { transform: translateY(-1px); }

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
.cartbar-empty { z-index: 20; opacity: 0.95; }
.cart-info { display: flex; flex-direction: column; gap: 2px; cursor: pointer; min-width: 0; }
.cart-count { font-size: 13px; font-weight: 800; color: var(--deep); }
.cart-total { font-size: 12px; color: var(--muted); }
.cart-total .amount { font-size: 18px; font-weight: 900; color: #e8730c; }
.cart-diff { font-size: 12px; color: #e08e0b; font-weight: 800; margin-top: 1px; }
.cart-diff.ok { color: var(--deep); }
.cart-diff b { color: #e8730c; }
.submit {
  border: none; cursor: pointer; padding: 12px 26px; border-radius: 14px;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff; font-weight: 800; font-size: 15px;
  box-shadow: 0 8px 18px rgba(0, 150, 136, 0.45); transition: transform 0.15s, box-shadow 0.15s;
  flex: none;
}
.submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 11px 22px rgba(0, 150, 136, 0.6); }
.submit:disabled { background: #b8e6da; box-shadow: none; cursor: default; }

/* 已选商品浮层 */
.cart-panel {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 0; right: 0;
  background: #fff; border-radius: 18px;
  box-shadow: 0 16px 40px rgba(0, 80, 70, 0.28);
  border: 1px solid rgba(0, 184, 148, 0.18);
  padding: 12px 14px; z-index: 31;
}
.cp-head { display: flex; align-items: center; justify-content: space-between; padding: 2px 2px 10px; border-bottom: 1px solid var(--line); font-size: 13px; font-weight: 900; color: var(--deep); }
.cp-clear { border: none; background: none; color: var(--muted); font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; }
.cp-clear:hover { color: #e8730c; }
.cp-list { list-style: none; max-height: 240px; overflow-y: auto; }
.cp-item { display: flex; align-items: center; gap: 10px; padding: 10px 2px; }
.cp-item + .cp-item { border-top: 1px dashed var(--line); }
.cp-emoji { width: 38px; height: 38px; flex: none; border-radius: 11px; font-size: 20px; background: linear-gradient(135deg, rgba(0,184,148,0.15), rgba(0,206,201,0.15)); display: grid; place-items: center; }
.cp-main { flex: 1; min-width: 0; }
.cp-name { font-size: 13px; font-weight: 800; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cp-spec { font-size: 11px; color: var(--muted); margin-top: 2px; }
.cp-price { font-size: 12px; font-weight: 800; color: #e8730c; margin-top: 2px; }
.cp-stepper { display: flex; align-items: center; gap: 8px; flex: none; }
.cp-step { width: 26px; height: 26px; border-radius: 8px; border: 1px solid var(--line); background: #fff; color: var(--deep); font-size: 16px; font-weight: 800; cursor: pointer; line-height: 1; }
.cp-step:hover { background: rgba(0,184,148,0.12); }
.cp-qnum { font-size: 13px; font-weight: 800; color: var(--deep); min-width: 14px; text-align: center; }
.cp-fade-enter-active, .cp-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.cp-fade-enter-from, .cp-fade-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 600px) {
  .store { padding: 16px; gap: 12px; }
  .store-emoji { width: 54px; height: 54px; font-size: 30px; border-radius: 15px; }
  .store-name { font-size: 19px; }
  .dish { flex-wrap: wrap; }
  .dish-action { flex-direction: row; width: 100%; justify-content: flex-end; align-items: center; }
}
</style>
