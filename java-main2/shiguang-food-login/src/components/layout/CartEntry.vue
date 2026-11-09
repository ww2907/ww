<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { cart } from '../../store/cart.js'

// ============================================================
// 首页导航栏的购物车入口
// ------------------------------------------------------------
// 与店铺详情页 / 下单页共用 src/store/cart.js 这一份全局购物车：
//   - 店铺页加菜 → 这里的角标和列表立刻同步（同一响应式 store）
//   - 这里点「进店」/「去结算」→ 直接进到对应店铺的详情页 / 下单页
// ============================================================

const router = useRouter()

const open = ref(false)
const rootRef = ref(null)

const totalCount = computed(() => cart.globalCount.value)
const groups = computed(() => cart.storeGroups.value)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function storeName(g) {
  return g.restaurantName || '店铺 #' + g.restaurantId
}

function goStore(g) {
  close()
  router.push('/restaurant/' + g.restaurantId)
}

function goCheckout(g) {
  close()
  router.push('/order/' + g.restaurantId)
}

function clearOne(g) {
  cart.clearRestaurant(g.restaurantId)
}

function clearAll() {
  for (const g of groups.value) cart.clearRestaurant(g.restaurantId)
}

function goFood() {
  close()
  router.push('/food')
}

// 点击组件外部 / 按 Esc 收起浮层
function onDocClick(e) {
  if (!open.value) return
  if (rootRef.value && !rootRef.value.contains(e.target)) close()
}
function onKeydown(e) {
  if (e.key === 'Escape') close()
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
  <div class="cart-entry" ref="rootRef">
    <button class="ce-btn" :class="{ active: open, filled: totalCount > 0 }" @click="toggle" title="购物车">
      <span class="ce-icon">🛒</span>
      <span class="ce-label">购物车</span>
      <span class="ce-badge" v-if="totalCount > 0">{{ totalCount > 99 ? '99+' : totalCount }}</span>
    </button>

    <transition name="ce-drop">
      <div v-if="open" class="ce-panel">
        <div class="ce-head">
          <span class="ce-title">🛒 我的购物车<em v-if="totalCount > 0">共 {{ totalCount }} 件</em></span>
          <button class="ce-clear" v-if="groups.length" @click="clearAll">清空全部</button>
        </div>

        <!-- 空态 -->
        <div class="ce-empty" v-if="!groups.length">
          <div class="ce-empty-emoji">🍽️</div>
          <p>购物车还空着，去挑点好吃的吧～</p>
          <button class="ce-go" @click="goFood">去逛逛美食 →</button>
        </div>

        <!-- 按店铺分组 -->
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
                <button class="ce-primary" @click="goCheckout(g)">去结算</button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.cart-entry { position: relative; flex: none; }

/* 触发按钮：与顶部导航同款玻璃质感 */
.ce-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 100%;
  min-height: 46px;
  padding: 0 16px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 22px rgba(0, 150, 136, 0.14);
  color: var(--muted);
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s;
}
.ce-btn:hover { background: rgba(0, 184, 148, 0.12); color: var(--deep); transform: translateY(-1px); }
.ce-btn.filled { color: var(--deep); }
.ce-btn.active {
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff;
  border-color: transparent;
  box-shadow: 0 6px 16px rgba(0, 150, 136, 0.4);
}
.ce-icon { font-size: 17px; }
.ce-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff7a45, #f5511e);
  color: #fff;
  font-size: 11px;
  font-weight: 900;
  line-height: 19px;
  text-align: center;
  box-shadow: 0 3px 8px rgba(245, 81, 30, 0.45);
}

/* 下拉浮层 */
.ce-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 380px;
  max-width: calc(100vw - 36px);
  max-height: 60vh;
  overflow-y: auto;
  background: #fff;
  border: 1px solid rgba(0, 184, 148, 0.18);
  border-radius: 18px;
  box-shadow: 0 18px 44px rgba(0, 80, 70, 0.26);
  padding: 14px;
  z-index: 60;
}
.ce-head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid var(--line); }
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
  .ce-label { display: none; }
  .ce-btn { padding: 0 13px; }
}
</style>
