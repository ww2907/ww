<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { cart } from '../store/cart.js'
import { session } from '../store.js'
import { getAddresses, initProfileForAccount, loadAddresses } from '../store/profile.js'
import { createOrder } from '../api/order.js'
import { toast } from '../composables/useToast.js'
import { useShellNav } from '../composables/useShellNav.js'
import AppHeader from '../components/layout/AppHeader.vue'
import AddressManageModal from '../components/AddressManageModal.vue'
import EmptyState from '../components/EmptyState.vue'

// ============================================================
// 合并结算页（一次性付清）
// ------------------------------------------------------------
// 购物车按店铺分组，这里把所有店铺的菜品汇总到一页、共用一个收货地址，
// 一次点击「提交全部订单」：后端是单店订单结构，故前端循环为每个店提交
// 一单（同一地址），全部成功后再清空各店购物车；任一失败则整体提示、不清空。
// ============================================================

const router = useRouter()
const { account, showAdmin, goAdmin, logout } = useShellNav('home')

const groups = computed(() => cart.storeGroups.value)
const totalCount = computed(() => cart.globalCount.value)
const totalPrice = computed(() => groups.value.reduce((s, g) => s + g.total, 0))

const submitting = ref(false)

// ---------- 收货地址（与结算页 / 我的同一份）----------
const addresses = computed(() => getAddresses())
const activeAddrId = ref(null)
const addrOpen = ref(false)
const addrModal = ref(false)
const currentAddress = computed(() => {
  const list = addresses.value || []
  return list.find((a) => a.id === activeAddrId.value)
    || list.find((a) => a.isDefault)
    || list[0]
    || null
})
const addressText = computed(() => {
  const a = currentAddress.value
  return a ? [a.province, a.city, a.detail].filter(Boolean).join(' ') : ''
})
function pickAddress(a) {
  activeAddrId.value = a.id
  addrOpen.value = false
}

function inc(g, d) {
  cart.inc(g.restaurantId, { ...d, id: d.id != null ? d.id : d.dishKey })
}
function dec(g, d) {
  cart.dec(g.restaurantId, d.dishKey)
}
function remove(g, d) {
  cart.removeItem(g.restaurantId, d.dishKey)
}

function goBack() {
  router.push('/home')
}

async function submitAll() {
  if (!groups.value.length || submitting.value) return
  if (!currentAddress.value) {
    toast('请先填写收货地址，再提交订单', 'error')
    addrModal.value = true
    return
  }
  submitting.value = true
  // 快照：提交过程中购物车可能被响应式更新，先固定住要下单的数据
  const snapshot = groups.value.map((g) => ({
    restaurantId: g.restaurantId,
    restaurantName: g.restaurantName,
    items: g.items.map((it) => ({
      dishId: it.id != null ? it.id : null,
      name: it.specText ? `${it.name}（${it.specText}）` : it.name,
      price: it.price,
      qty: it.qty
    }))
  }))
  const created = []
  try {
    for (const g of snapshot) {
      const order = await createOrder({
        restaurantId: g.restaurantId,
        restaurantName: g.restaurantName,
        account: session.account,
        addressId: currentAddress.value.id,
        items: g.items
      })
      created.push(order)
    }
    // 全部成功：只清空已成功下单的店铺
    for (const g of snapshot) cart.clearRestaurant(g.restaurantId)
    toast(`已提交并支付 ${created.length} 笔订单 🎉`, 'success')
    setTimeout(() => router.replace('/orders'), 900)
  } catch (e) {
    // 有失败：已成功的那几单保留（后端已落库），提示用户去订单页核对
    toast(
      created.length
        ? `已提交 ${created.length} 笔，剩余店铺失败：${e.message || '请重试'}`
        : (e.message || '下单失败，请稍后重试'),
      'error'
    )
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  initProfileForAccount(session.account)
  loadAddresses(session.account).catch(() => {})
})
</script>

<template>
  <div class="checkout-all">
    <AppHeader :account="account" :show-admin="showAdmin" @logout="logout" @admin="goAdmin" />

    <header class="topbar">
      <button class="back" @click="goBack">‹ 返回</button>
      <span class="top-title">合并结算</span>
      <span class="top-spacer"></span>
    </header>

    <!-- 空购物车 -->
    <div v-if="!groups.length">
      <EmptyState type="cart" title="购物车还是空的" desc="去店铺里挑几道好吃的吧～">
        <template #action>
          <button class="empty-btn" @click="goBack">去点餐</button>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <!-- 收货地址 -->
      <section class="block addr" :class="{ 'addr-empty': !currentAddress }">
        <div class="addr-head">
          <span class="addr-label">📍 配送至（全部店铺共用）</span>
          <button v-if="addresses.length > 1" class="addr-link" @click="addrOpen = !addrOpen">
            {{ addrOpen ? '收起' : '更换地址' }}
          </button>
          <button v-else class="addr-link" @click="addrModal = true">管理地址</button>
        </div>
        <template v-if="currentAddress">
          <div class="addr-line1">
            <span class="addr-name">{{ currentAddress.name }}</span>
            <span class="addr-phone">{{ currentAddress.phone }}</span>
            <span class="addr-tag">{{ currentAddress.tag }}</span>
          </div>
          <div class="addr-line2">{{ addressText }}</div>
        </template>
        <div v-else class="addr-none">
          <div class="addr-none-text">还没有收货地址，填好地址才能提交订单</div>
          <button class="addr-add" @click="addrModal = true">＋ 添加收货地址</button>
        </div>
        <ul v-if="addrOpen && addresses.length" class="addr-list">
          <li
            v-for="a in addresses"
            :key="a.id"
            class="addr-item"
            :class="{ active: currentAddress && currentAddress.id === a.id }"
            @click="pickAddress(a)"
          >
            <span class="addr-tag">{{ a.tag }}</span>
            <div class="addr-item-main">
              <div class="addr-line1">
                <span class="addr-name">{{ a.name }}</span>
                <span class="addr-phone">{{ a.phone }}</span>
              </div>
              <div class="addr-line2">{{ [a.province, a.city, a.detail].filter(Boolean).join(' ') }}</div>
            </div>
            <span class="addr-check">{{ currentAddress && currentAddress.id === a.id ? '✓' : '' }}</span>
          </li>
          <li class="addr-item addr-item-add" @click="addrModal = true">＋ 新增 / 管理地址</li>
        </ul>
      </section>

      <!-- 各店铺分组 -->
      <section v-for="g in groups" :key="g.restaurantId" class="block">
        <div class="block-head">
          <h2>🏪 {{ g.restaurantName || ('店铺 #' + g.restaurantId) }}</h2>
          <span class="count">{{ g.count }} 件 · 小计 ¥{{ g.total.toFixed(2) }}</span>
        </div>
        <ul class="menu">
          <li class="dish" v-for="d in g.items" :key="d.dishKey">
            <div class="dish-emoji">{{ d.emoji }}</div>
            <div class="dish-main">
              <div class="dish-name">{{ d.name }}</div>
              <div class="dish-spec" v-if="d.specText">{{ d.specText }}</div>
              <div class="dish-price">¥{{ Number(d.price || 0).toFixed(2) }} <span class="dish-sub">×{{ d.qty }}</span></div>
            </div>
            <div class="dish-action">
              <div class="stepper">
                <button class="step" @click="dec(g, d)">−</button>
                <span class="qnum">{{ d.qty }}</span>
                <button class="step" @click="inc(g, d)">+</button>
              </div>
              <button class="del" @click="remove(g, d)" title="移除">🗑</button>
            </div>
          </li>
        </ul>
      </section>

      <div class="hint-bar">💡 共 {{ groups.length }} 家店，将分成 {{ groups.length }} 笔订单提交；也可回购物车逐店单独结算。</div>
      <footer class="foot">食光 · 美食 — 发现身边的每一口好味道 🌿</footer>
    </template>

    <!-- 底部提交栏 -->
    <div class="cartbar" v-if="groups.length">
      <div class="cart-info">
        <div class="cart-count">🛒 共 {{ totalCount }} 件 · {{ groups.length }} 家店</div>
        <div class="cart-total">
          合计 <span class="amount">¥{{ totalPrice.toFixed(2) }}</span>
          <span v-if="!currentAddress" class="cart-warn">· 待填写收货地址</span>
        </div>
      </div>
      <button class="submit" :disabled="submitting || !currentAddress" @click="submitAll">
        <span v-if="submitting" class="btn-spin"></span>
        {{ submitting ? '支付中…' : '提交并支付全部订单' }}
      </button>
    </div>

    <AddressManageModal :show="addrModal" @close="addrModal = false" />
  </div>
</template>

<style scoped>
.checkout-all { color: var(--ink); display: flex; flex-direction: column; gap: 16px; padding-bottom: 120px; }
.topbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(255,255,255,0.82); backdrop-filter: blur(14px); border-radius: 16px; box-shadow: var(--shadow); border: 1px solid rgba(255,255,255,0.6); }
.back { border: none; cursor: pointer; background: rgba(0,184,148,0.12); color: var(--deep); font-weight: 800; font-size: 14px; padding: 8px 14px; border-radius: 11px; }
.back:hover { background: rgba(0,184,148,0.25); }
.top-title { font-weight: 900; font-size: 16px; color: var(--deep); }
.top-spacer { width: 64px; }
.empty-btn { margin-top: 4px; border: none; cursor: pointer; padding: 11px 24px; border-radius: 12px; background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff; font-weight: 800; font-size: 14px; font-family: inherit; box-shadow: 0 6px 14px rgba(0,150,136,0.35); }
.block { background: rgba(255,255,255,0.86); backdrop-filter: blur(8px); border-radius: 22px; padding: 18px; box-shadow: 0 10px 26px rgba(0,150,136,0.16); border: 1px solid rgba(255,255,255,0.6); }
.block-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
.block-head h2 { font-size: 16px; font-weight: 900; color: var(--deep); }
.count { font-size: 12px; color: var(--muted); }
.addr { display: flex; flex-direction: column; gap: 6px; }
.addr-empty { border-color: rgba(232,115,12,0.35); background: rgba(255,249,240,0.95); }
.addr-head { display: flex; align-items: center; justify-content: space-between; }
.addr-label { font-size: 12px; font-weight: 800; color: var(--muted); }
.addr-link { border: none; cursor: pointer; background: rgba(0,184,148,0.12); color: var(--deep); font-size: 12px; font-weight: 800; font-family: inherit; padding: 5px 11px; border-radius: 9px; }
.addr-link:hover { background: rgba(0,184,148,0.24); }
.addr-line1 { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.addr-name { font-size: 15px; font-weight: 800; color: var(--ink); }
.addr-phone { font-size: 13px; font-weight: 700; color: var(--muted); }
.addr-tag { flex: none; font-size: 11px; font-weight: 800; color: var(--deep); background: rgba(0,184,148,0.14); padding: 2px 8px; border-radius: 7px; }
.addr-line2 { font-size: 13px; color: var(--ink); line-height: 1.6; }
.addr-none { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.addr-none-text { font-size: 13px; font-weight: 700; color: #b4620a; }
.addr-add { border: none; cursor: pointer; padding: 8px 15px; border-radius: 11px; background: linear-gradient(135deg,#f7a03c,#ef7d18); color: #fff; font-size: 13px; font-weight: 800; font-family: inherit; }
.addr-list { list-style: none; margin-top: 6px; border-top: 1px dashed var(--line); padding-top: 6px; }
.addr-item { display: flex; align-items: flex-start; gap: 10px; padding: 9px 8px; border-radius: 11px; cursor: pointer; }
.addr-item:hover { background: rgba(0,184,148,0.08); }
.addr-item.active { background: rgba(0,184,148,0.12); }
.addr-item-main { flex: 1; min-width: 0; }
.addr-check { flex: none; color: var(--teal); font-weight: 900; font-size: 14px; }
.addr-item-add { justify-content: center; font-size: 13px; font-weight: 800; color: var(--deep); border: 1px dashed rgba(0,150,136,0.35); }
.cart-warn { color: #b4620a; font-weight: 800; }
.menu { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px,1fr)); gap: 12px; }
.dish { display: flex; gap: 12px; align-items: center; background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 12px; }
.dish-emoji { width: 48px; height: 48px; flex: none; border-radius: 13px; font-size: 26px; background: linear-gradient(135deg,rgba(0,184,148,0.15),rgba(0,206,201,0.15)); display: grid; place-items: center; }
.dish-main { flex: 1; min-width: 0; }
.dish-name { font-size: 15px; font-weight: 800; color: var(--ink); }
.dish-spec { font-size: 12px; color: var(--muted); margin-top: 3px; }
.dish-price { font-size: 14px; font-weight: 800; color: #e8730c; margin-top: 6px; }
.dish-sub { font-size: 12px; color: var(--muted); font-weight: 700; }
.dish-action { flex: none; display: flex; align-items: center; gap: 10px; }
.stepper { display: flex; align-items: center; gap: 8px; }
.step { width: 30px; height: 30px; border-radius: 10px; border: 1px solid var(--line); background: #fff; color: var(--deep); font-size: 18px; font-weight: 800; cursor: pointer; }
.step:hover { background: rgba(0,184,148,0.12); }
.qnum { font-size: 14px; font-weight: 800; color: var(--deep); min-width: 18px; text-align: center; }
.del { border: none; background: rgba(120,120,120,0.1); color: #888; cursor: pointer; width: 30px; height: 30px; border-radius: 10px; font-size: 14px; }
.del:hover { background: rgba(120,120,120,0.2); }
.hint-bar { font-size: 12px; font-weight: 700; color: #0c8f7f; background: rgba(0,184,148,0.08); border: 1px dashed rgba(0,184,148,0.3); border-radius: 14px; padding: 11px 14px; }
.foot { text-align: center; font-size: 12px; color: rgba(255,255,255,0.9); text-shadow: 0 2px 8px rgba(0,80,70,0.3); }
.cartbar { position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%); width: calc(100% - 36px); max-width: 1064px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: rgba(255,255,255,0.96); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.7); border-radius: 20px; padding: 12px 16px; box-shadow: 0 12px 30px rgba(0,150,136,0.3); z-index: 30; }
.cart-info { display: flex; flex-direction: column; gap: 2px; }
.cart-count { font-size: 13px; font-weight: 800; color: var(--deep); }
.cart-total { font-size: 12px; color: var(--muted); }
.cart-total .amount { font-size: 18px; font-weight: 900; color: #e8730c; }
.submit { flex: none; border: none; cursor: pointer; padding: 12px 26px; border-radius: 14px; background: linear-gradient(135deg,var(--teal),var(--cyan)); color: #fff; font-weight: 800; font-size: 15px; font-family: inherit; box-shadow: 0 8px 18px rgba(0,150,136,0.45); }
.submit:hover:not(:disabled) { transform: translateY(-1px); }
.submit:disabled { opacity: 0.55; cursor: default; background: #b8e6da; box-shadow: none; }
.btn-spin { display: inline-block; width: 12px; height: 12px; margin-right: 6px; border: 2px solid rgba(255,255,255,0.5); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: -1px; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 600px) { .dish { flex-wrap: wrap; } .dish-action { flex-direction: row; width: 100%; justify-content: flex-end; } }
</style>
