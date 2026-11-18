<script setup>
// 顶部横向导航（桌面端）：四页共用，尺寸与首页一致
// 购物车已并入导航项（配置里 id='cart'，排在「我的」后面，最后一位）：
//   - 点击购物车项不再跳转，而是展开购物车浮层（与店铺页/下单页共用 cart store）
//   - 浮层右对齐导航右边缘向左展开，并按视口剩余高度动态限高，保证内容不被裁剪/遮挡
//   - 其余项仍通过 select 事件交给各页面的 handleNav 处理跳转
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { cart } from '../../store/cart.js'

const props = defineProps({
  items: { type: Array, default: () => [] },
  active: { type: String, default: '' }
})
const emit = defineEmits(['select'])

const router = useRouter()
const cartOpen = ref(false)
const rootRef = ref(null)
// 浮层动态最大高度：根据购物车按钮位置算出视口剩余空间，保证底栏不被视口裁剪
const cartBtnRef = ref(null)
const panelMaxH = ref(620)

const totalCount = computed(() => cart.globalCount.value)
const groups = computed(() => cart.storeGroups.value)
const totalPrice = computed(() => groups.value.reduce((s, g) => s + g.total, 0))

function onItemClick(item, e) {
  if (item.key === 'cart') {
    if (!cartOpen.value && e && e.currentTarget) {
      // 浮层从按钮下方向下展开：可用高度 = 视口底 - 按钮底 - 余量，至少 240px
      const bottom = e.currentTarget.getBoundingClientRect().bottom
      panelMaxH.value = Math.max(240, Math.min(620, window.innerHeight - bottom - 24))
    }
    cartOpen.value = !cartOpen.value
    return
  }
  cartOpen.value = false
  emit('select', item)
}

function storeName(g) {
  return g.restaurantName || '店铺 #' + g.restaurantId
}
function goStore(g) {
  cartOpen.value = false
  router.push('/restaurant/' + g.restaurantId)
}
function goCheckout(g) {
  cartOpen.value = false
  router.push('/order/' + g.restaurantId)
}
// 一次性付清：所有店铺合并到结算页，一次提交全部下单
function goCheckoutAll() {
  cartOpen.value = false
  router.push('/checkout-all')
}
function clearOne(g) {
  cart.clearRestaurant(g.restaurantId)
}
function clearAll() {
  for (const g of groups.value) cart.clearRestaurant(g.restaurantId)
}
function goFood() {
  cartOpen.value = false
  router.push('/food')
}

// 点击组件外部 / 按 Esc 收起浮层
function onDocClick(e) {
  if (!cartOpen.value) return
  if (rootRef.value && !rootRef.value.contains(e.target)) cartOpen.value = false
}
function onKeydown(e) {
  if (e.key === 'Escape') cartOpen.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <nav class="sh-nav" ref="rootRef">
    <div
      v-for="item in items"
      :key="item.key"
      class="nav-wrap"
    >
      <button
        class="sh-nav-item"
        :class="{ active: active === item.key, 'cart-active': item.key === 'cart' && cartOpen }"
        @click="onItemClick(item, $event)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
        <span class="nav-badge" v-if="item.key === 'cart' && totalCount > 0">{{ totalCount > 99 ? '99+' : totalCount }}</span>
      </button>

      <!-- 购物车浮层（挂在购物车导航项下方）：固定头 + 可滚动列表 + 固定底栏 -->
      <transition name="ce-drop">
        <div v-if="item.key === 'cart' && cartOpen" class="ce-panel" :style="{ maxHeight: panelMaxH + 'px' }">
          <!-- 固定头 -->
          <div class="ce-head">
            <span class="ce-title">🛒 我的购物车<em v-if="totalCount > 0">共 {{ totalCount }} 件 · {{ groups.length }} 家店</em></span>
            <button class="ce-clear" v-if="groups.length" @click="clearAll">清空全部</button>
          </div>

          <!-- 可滚动列表区 -->
          <div class="ce-scroll">
            <div class="ce-empty" v-if="!groups.length">
              <div class="ce-empty-emoji">🍽️</div>
              <p>购物车还空着，去挑点好吃的吧～</p>
              <button class="ce-go" @click="goFood">去逛逛美食 →</button>
            </div>

            <ul class="ce-list" v-else>
              <li class="ce-group" v-for="g in groups" :key="g.restaurantId">
                <div class="ce-g-head">
                  <span class="ce-g-name">🏪 {{ storeName(g) }}</span>
                  <span class="ce-g-count">{{ g.count }} 件</span>
                </div>
                <ul class="ce-g-items">
                  <li class="ce-g-item" v-for="it in g.items" :key="it.dishKey">
                    <span class="ce-i-emoji">{{ it.emoji }}</span>
                    <div class="ce-i-main">
                      <div class="ce-i-name">{{ it.name }}</div>
                      <div class="ce-i-spec" v-if="it.specText">{{ it.specText }}</div>
                    </div>
                    <div class="ce-i-qty">×{{ it.qty }}</div>
                    <div class="ce-i-price">¥{{ (Number(it.price || 0) * it.qty).toFixed(2) }}</div>
                    <div class="ce-i-step">
                      <button @click="cart.dec(g.restaurantId, it.dishKey)" title="减一份">−</button>
                      <button @click="cart.inc(g.restaurantId, { ...it, id: it.id != null ? it.id : it.dishKey })" title="加一份">＋</button>
                    </div>
                  </li>
                </ul>
                <div class="ce-g-foot">
                  <span class="ce-g-total">小计 <b>¥{{ g.total.toFixed(2) }}</b></span>
                  <div class="ce-g-actions">
                    <button class="ce-ghost" @click="clearOne(g)">清空</button>
                    <button class="ce-ghost" @click="goStore(g)">进店加菜</button>
                    <button class="ce-primary" @click="goCheckout(g)">单店结算</button>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- 固定底栏：一次性付清 -->
          <div class="ce-foot" v-if="groups.length">
            <div class="ce-foot-info">
              <span class="ce-foot-count">共 {{ totalCount }} 件</span>
              <span class="ce-foot-total">合计 <b>¥{{ totalPrice.toFixed(2) }}</b></span>
            </div>
            <button class="ce-foot-btn" @click="goCheckoutAll">一次性付清 →</button>
          </div>
        </div>
      </transition>
    </div>
  </nav>
</template>

<style scoped>
.sh-nav {
  position: relative;
  z-index: 100; /* 提升导航层叠上下文，确保购物车浮层不被后续页面内容遮挡 */
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 8px 22px rgba(0, 150, 136, 0.14);
}
.nav-wrap { position: relative; flex: 1; }
.sh-nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: none;
  background: transparent;
  color: var(--muted);
  padding: 10px 6px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.sh-nav-item .nav-icon { font-size: 17px; }
.sh-nav-item:hover { background: rgba(0, 184, 148, 0.12); color: var(--deep); }
.sh-nav-item.active,
.sh-nav-item.cart-active {
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff;
  box-shadow: 0 6px 16px rgba(0, 150, 136, 0.4);
}

/* 购物车数量角标 */
.nav-badge {
  position: absolute;
  top: 2px;
  right: calc(50% - 30px);
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff7a45, #f5511e);
  color: #fff;
  font-size: 11px;
  font-weight: 900;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 3px 8px rgba(245, 81, 30, 0.45);
}

/* 购物车浮层：固定头 + 可滚动列表 + 固定底栏 */
.ce-panel {
  position: absolute;
  top: calc(100% + 10px);
  /* 购物车是最后一项：浮层右对齐导航右边缘、向左展开，避免超出视口被裁剪 */
  right: 0;
  width: 400px;
  max-width: calc(100vw - 36px);
  max-height: min(72vh, 620px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(0, 184, 148, 0.18);
  border-radius: 18px;
  box-shadow: 0 18px 44px rgba(0, 80, 70, 0.26);
  z-index: 120;
}
.ce-head {
  flex: none;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--line);
}
/* 可滚动菜品区：头部与底栏固定，仅这里上下滚动 */
.ce-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px;
}
.ce-foot {
  flex: none;
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid var(--line);
  background: #f7fffc;
  border-radius: 0 0 18px 18px;
}
.ce-foot-info { display: flex; flex-direction: column; gap: 2px; }
.ce-foot-count { font-size: 11px; font-weight: 700; color: var(--muted); }
.ce-foot-total { font-size: 12px; color: var(--muted); }
.ce-foot-total b { font-size: 17px; font-weight: 900; color: #e8730c; }
.ce-foot-btn {
  flex: none; border: none; cursor: pointer; font-family: inherit;
  padding: 11px 20px; border-radius: 12px;
  background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff;
  font-weight: 800; font-size: 14px;
  box-shadow: 0 6px 14px rgba(0, 150, 136, 0.35);
  transition: transform 0.15s;
}
.ce-foot-btn:hover { transform: translateY(-1px); }
.ce-title { font-size: 13px; font-weight: 900; color: var(--deep); }
.ce-title em { font-style: normal; font-weight: 700; font-size: 12px; color: var(--muted); margin-left: 8px; }
.ce-clear { border: none; background: none; color: var(--muted); font-family: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
.ce-clear:hover { color: #e8730c; }

.ce-empty { text-align: center; padding: 22px 8px 10px; }
.ce-empty-emoji { font-size: 32px; }
.ce-empty p { font-size: 13px; color: var(--muted); margin-top: 8px; }
.ce-go {
  margin-top: 12px; border: none; cursor: pointer; font-family: inherit;
  padding: 9px 18px; border-radius: 11px; font-size: 13px; font-weight: 800; color: #fff;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  box-shadow: 0 6px 14px rgba(0, 150, 136, 0.35);
}

.ce-list { list-style: none; }
.ce-group { padding: 12px 0 4px; }
.ce-group + .ce-group { border-top: 1px dashed var(--line); }
.ce-g-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.ce-g-name { font-size: 13px; font-weight: 800; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ce-g-count { flex: none; font-size: 11px; font-weight: 800; color: var(--deep); background: rgba(0, 184, 148, 0.14); padding: 2px 8px; border-radius: 999px; }

.ce-g-items { list-style: none; margin-top: 6px; }
.ce-g-item { display: flex; align-items: center; gap: 8px; padding: 7px 0; }
.ce-i-emoji { width: 30px; height: 30px; flex: none; border-radius: 9px; font-size: 16px; display: grid; place-items: center; background: linear-gradient(135deg, rgba(0,184,148,0.15), rgba(0,206,201,0.15)); }
.ce-i-main { flex: 1; min-width: 0; }
.ce-i-name { font-size: 12px; font-weight: 700; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ce-i-spec { font-size: 11px; color: var(--muted); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ce-i-qty { flex: none; font-size: 12px; font-weight: 800; color: var(--muted); }
.ce-i-price { flex: none; width: 62px; text-align: right; font-size: 12px; font-weight: 800; color: #e8730c; }
.ce-i-step { flex: none; display: flex; gap: 5px; }
.ce-i-step button {
  width: 24px; height: 24px; border-radius: 7px; cursor: pointer;
  border: 1px solid var(--line); background: #fff; color: var(--deep);
  font-size: 14px; font-weight: 800; line-height: 1;
}
.ce-i-step button:hover { background: rgba(0, 184, 148, 0.12); }

.ce-g-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 0 4px; flex-wrap: wrap; }
.ce-g-total { font-size: 12px; color: var(--muted); }
.ce-g-total b { font-size: 15px; color: #e8730c; }
.ce-g-actions { display: flex; gap: 6px; }
.ce-ghost {
  border: 1px solid var(--line); background: #fff; color: var(--muted);
  font-family: inherit; font-size: 12px; font-weight: 700; cursor: pointer;
  padding: 6px 11px; border-radius: 9px; transition: color 0.15s, border-color 0.15s;
}
.ce-ghost:hover { color: var(--deep); border-color: rgba(0, 184, 148, 0.5); }
.ce-primary {
  border: none; cursor: pointer; font-family: inherit;
  padding: 7px 14px; border-radius: 9px; font-size: 12px; font-weight: 800; color: #fff;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  box-shadow: 0 5px 12px rgba(0, 150, 136, 0.35);
}
.ce-primary:hover { transform: translateY(-1px); }

.ce-drop-enter-active, .ce-drop-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.ce-drop-enter-from, .ce-drop-leave-to { opacity: 0; transform: translateY(-8px); }

@media (max-width: 860px) {
  .sh-nav { display: none; }
}
</style>
