<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRestaurantDetail } from '../api/restaurant.js'
import { createOrder } from '../api/order.js'
import { cart } from '../store/cart.js'
import { session } from '../store.js'
import { getAddresses, initProfileForAccount, loadAddresses } from '../store/profile.js'
import { toast } from '../composables/useToast.js'
import { useShellNav } from '../composables/useShellNav.js'
import AppHeader from '../components/layout/AppHeader.vue'
import AddressManageModal from '../components/AddressManageModal.vue'
import EmptyState from '../components/EmptyState.vue'

const route = useRoute()
const router = useRouter()

// 顶部栏（与首页同一套）：账号、后台入口、退出
const { account, showAdmin, goAdmin, logout } = useShellNav('home')

const rid = computed(() => route.params.id)
const store = ref(null)
const loading = ref(true)
const errMsg = ref('')

const { items, totalCount, totalPrice } = cart.useCartTotals(rid)

const submitting = ref(false)

// ---------- 收货地址 ----------
// 下单必须有地址（后端同样会校验）：这里展示当前选中的地址，
// 没地址时把「提交订单」按钮禁用并给出添加入口，避免用户点了才看到报错。
const addresses = computed(() => getAddresses())
const activeAddrId = ref(null)
const addrOpen = ref(false) // 地址切换面板
const addrModal = ref(false) // 地址新增/管理弹窗

const currentAddress = computed(() => {
  const list = addresses.value || []
  if (!list.length) return null
  return list.find((a) => a.id === activeAddrId.value)
    || list.find((a) => a.isDefault)
    || list[0]
})
const addressText = computed(() => {
  const a = currentAddress.value
  return a ? [a.province, a.city, a.detail].filter(Boolean).join(' ') : ''
})

function pickAddress(a) {
  activeAddrId.value = a.id
  addrOpen.value = false
}

function inc(d) {
  cart.inc(rid.value, { ...d, id: d.id != null ? d.id : d.dishKey })
}
function dec(d) {
  cart.dec(rid.value, d.dishKey)
}
function remove(d) {
  cart.removeItem(rid.value, d.dishKey)
}

async function submitOrder() {
  if (totalCount.value === 0 || submitting.value) return
  if (!currentAddress.value) {
    toast('请先填写收货地址，再提交订单', 'error')
    addrModal.value = true
    return
  }
  submitting.value = true
  const orderItems = items.value.map((it) => ({
    dishId: it.id != null ? it.id : null,
    name: it.specText ? `${it.name}（${it.specText}）` : it.name,
    price: it.price,
    qty: it.qty
  }))
  try {
    const order = await createOrder({
      restaurantId: rid.value,
      restaurantName: store.value ? store.value.name : cart.getRestaurantCart(rid.value).restaurantName,
      account: session.account,
      addressId: currentAddress.value.id,
      items: orderItems
    })
    toast(`下单成功 🎉 订单号 ${order.orderNo}`, 'success')
    cart.clearRestaurant(rid.value)
    setTimeout(() => router.replace('/orders'), 900)
  } catch (e) {
    toast(e.message || '下单失败，请稍后重试', 'error')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push('/restaurant/' + rid.value)
}

onMounted(async () => {
  // 地址走 profile store（与「我的 → 收货地址」同一份数据），先初始化再取列表
  initProfileForAccount(session.account)
  try {
    await loadAddresses(session.account)
  } catch (e) {
    /* 后端不可用时保留本地缓存，不阻塞结算页渲染 */
  }
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
  <div class="order">
    <!-- 顶部导航栏：与首页尺寸完全一致 -->
    <AppHeader :account="account" :show-admin="showAdmin" @logout="logout" @admin="goAdmin" />

    <!-- 二级：返回 / 页面标题 -->
    <header class="topbar">
      <button class="back" @click="goBack">‹ 返回</button>
      <span class="top-title">购物车 · 结算</span>
      <span class="top-spacer"></span>
    </header>

    <!-- 加载态 -->
    <div v-if="loading" class="state">
      <span class="spinner"></span> 正在加载…
    </div>

    <!-- 错误态 -->
    <div v-else-if="errMsg" class="state empty">😶 {{ errMsg }}</div>

    <!-- 空购物车 -->
    <div v-else-if="totalCount === 0">
      <EmptyState type="cart" title="购物车还是空的" desc="去店铺里挑几道好吃的吧～">
        <template #action>
          <button class="empty-btn" @click="goBack">去点餐</button>
        </template>
      </EmptyState>
    </div>

    <!-- 购物车内容 -->
    <template v-else>
      <!-- 收货地址：下单必须有地址，没有就先引导去添加 -->
      <section class="block addr" :class="{ 'addr-empty': !currentAddress }">
        <div class="addr-head">
          <span class="addr-label">📍 配送至</span>
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

        <!-- 切换地址 -->
        <ul v-if="addrOpen && addresses.length" class="addr-list">
          <li
            v-for="a in addresses"
            :key="a.id"
            class="addr-item"
            :class="{ active: currentAddress && a.id === currentAddress.id }"
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
            <span class="addr-check">{{ currentAddress && a.id === currentAddress.id ? '✓' : '' }}</span>
          </li>
          <li class="addr-item addr-item-add" @click="addrModal = true">＋ 新增 / 管理地址</li>
        </ul>
      </section>

      <!-- 店铺信息 -->
      <section class="block store">
        <div class="store-emoji">{{ store ? store.emoji : '🍜' }}</div>
        <div class="store-info">
          <div class="store-name">{{ store ? store.name : (cart.getRestaurantCart(rid).restaurantName || '店铺') }}</div>
          <div class="store-sub">🧾 共 {{ totalCount }} 件 · 合计 ¥{{ totalPrice.toFixed(2) }}</div>
        </div>
      </section>

      <!-- 已选菜品 -->
      <section class="block">
        <div class="block-head">
          <h2>🍽️ 已选美食</h2>
          <span class="count">{{ items.length }} 种</span>
        </div>
        <ul class="menu">
          <li class="dish" v-for="d in items" :key="d.dishKey">
            <div class="dish-emoji">{{ d.emoji }}</div>
            <div class="dish-main">
              <div class="dish-name">{{ d.name }}</div>
              <div class="dish-spec" v-if="d.specText">{{ d.specText }}</div>
              <div class="dish-price">¥{{ Number(d.price || 0).toFixed(2) }} <span class="dish-sub">×{{ d.qty }}</span></div>
            </div>
            <div class="dish-action">
              <div class="stepper">
                <button class="step" @click="dec(d)">−</button>
                <span class="qnum">{{ d.qty }}</span>
                <button class="step" @click="inc(d)">+</button>
              </div>
              <button class="del" @click="remove(d)" title="移除">🗑</button>
            </div>
          </li>
        </ul>
      </section>

      <footer class="foot">食光 · 美食 — 发现身边的每一口好味道 🌿</footer>
    </template>

    <!-- 底部结算栏 -->
    <div class="cartbar" v-if="totalCount > 0">
      <div class="cart-info">
        <div class="cart-count">🛒 {{ totalCount }} 件</div>
        <div class="cart-total">
          合计 <span class="amount">¥{{ totalPrice.toFixed(2) }}</span>
          <span v-if="!currentAddress" class="cart-warn">· 待填写收货地址</span>
        </div>
      </div>
      <button class="submit" :disabled="submitting || !currentAddress" @click="submitOrder">
        <span v-if="submitting" class="btn-spin"></span>
        {{ submitting ? '提交中…' : '提交订单' }}
      </button>
    </div>

    <!-- 地址新增 / 管理弹窗（与「我的」页面共用同一个组件） -->
    <AddressManageModal :show="addrModal" @close="addrModal = false" />
  </div>
</template>

<style scoped>
.order {
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

/* 空购物车 */
.empty-btn {
  margin-top: 4px; border: none; cursor: pointer; padding: 11px 24px; border-radius: 12px;
  background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff;
  font-weight: 800; font-size: 14px; font-family: inherit;
  box-shadow: 0 6px 14px rgba(0, 150, 136, 0.35); transition: transform 0.15s, box-shadow 0.15s;
}
.empty-btn:hover { transform: translateY(-1px); box-shadow: 0 9px 18px rgba(0, 150, 136, 0.5); }

/* 区块 */
.block { background: rgba(255,255,255,0.86); backdrop-filter: blur(8px); border-radius: 22px; padding: 18px; box-shadow: 0 10px 26px rgba(0,150,136,0.16); border: 1px solid rgba(255,255,255,0.6); }
.block-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
.block-head h2 { font-size: 17px; font-weight: 900; color: var(--deep); }
.count { font-size: 12px; color: var(--muted); }

/* 收货地址卡片 */
.addr { display: flex; flex-direction: column; gap: 6px; }
.addr-empty { border-color: rgba(232, 115, 12, 0.35); background: rgba(255, 249, 240, 0.95); }
.addr-head { display: flex; align-items: center; justify-content: space-between; }
.addr-label { font-size: 12px; font-weight: 800; color: var(--muted); }
.addr-link {
  border: none; cursor: pointer; background: rgba(0, 184, 148, 0.12);
  color: var(--deep); font-size: 12px; font-weight: 800; font-family: inherit;
  padding: 5px 11px; border-radius: 9px; transition: background 0.15s;
}
.addr-link:hover { background: rgba(0, 184, 148, 0.24); }
.addr-line1 { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.addr-name { font-size: 15px; font-weight: 800; color: var(--ink); }
.addr-phone { font-size: 13px; font-weight: 700; color: var(--muted); }
.addr-tag {
  flex: none; font-size: 11px; font-weight: 800; color: var(--deep);
  background: rgba(0, 184, 148, 0.14); padding: 2px 8px; border-radius: 7px;
}
.addr-line2 { font-size: 13px; color: var(--ink); line-height: 1.6; }
.addr-none { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.addr-none-text { font-size: 13px; font-weight: 700; color: #b4620a; }
.addr-add {
  border: none; cursor: pointer; padding: 8px 15px; border-radius: 11px;
  background: linear-gradient(135deg, #f7a03c, #ef7d18); color: #fff;
  font-size: 13px; font-weight: 800; font-family: inherit;
  box-shadow: 0 6px 14px rgba(239, 125, 24, 0.35);
}
.addr-add:hover { transform: translateY(-1px); }
.addr-list { list-style: none; margin-top: 6px; border-top: 1px dashed var(--line); padding-top: 6px; }
.addr-item {
  display: flex; align-items: flex-start; gap: 10px; padding: 9px 8px;
  border-radius: 11px; cursor: pointer; transition: background 0.12s;
}
.addr-item:hover { background: rgba(0, 184, 148, 0.08); }
.addr-item.active { background: rgba(0, 184, 148, 0.12); }
.addr-item-main { flex: 1; min-width: 0; }
.addr-check { flex: none; color: var(--teal); font-weight: 900; font-size: 14px; }
.addr-item-add {
  justify-content: center; font-size: 13px; font-weight: 800; color: var(--deep);
  border: 1px dashed rgba(0, 150, 136, 0.35);
}
.cart-warn { color: #b4620a; font-weight: 800; }

/* 店铺信息 */
.store { display: flex; align-items: center; gap: 14px; }.store-emoji {
  width: 46px; height: 46px; flex: none; border-radius: 13px; font-size: 26px;
  background: linear-gradient(135deg, rgba(0, 184, 148, 0.15), rgba(0, 206, 201, 0.15));
  display: grid; place-items: center;
}
.store-info { min-width: 0; }
.store-name { font-size: 15px; font-weight: 800; color: var(--ink); }
.store-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }

/* 菜单 */
.menu { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
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
.dish-spec { font-size: 12px; color: var(--muted); margin-top: 3px; }
.dish-price { font-size: 14px; font-weight: 800; color: #e8730c; margin-top: 6px; }
.dish-sub { font-size: 12px; color: var(--muted); font-weight: 700; }
.dish-action { flex: none; display: flex; align-items: center; gap: 10px; }
.stepper { display: flex; align-items: center; gap: 8px; }
.step {
  width: 30px; height: 30px; border-radius: 10px; border: 1px solid var(--line);
  background: #fff; color: var(--deep); font-size: 18px; font-weight: 800; cursor: pointer; line-height: 1;
}
.step:hover { background: rgba(0,184,148,0.12); }
.qnum { font-size: 14px; font-weight: 800; color: var(--deep); min-width: 18px; text-align: center; }
.del {
  border: none; background: rgba(120,120,120,0.1); color: #888; cursor: pointer;
  width: 30px; height: 30px; border-radius: 10px; font-size: 14px;
}
.del:hover { background: rgba(120,120,120,0.2); }

.foot { text-align: center; font-size: 12px; color: rgba(255,255,255,0.9); text-shadow: 0 2px 8px rgba(0,80,70,0.3); margin-top: 6px; }

/* 底部结算栏 */
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
  box-shadow: 0 8px 18px rgba(0, 150, 136, 0.45); transition: transform 0.15s, box-shadow 0.15s;
}
.submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 11px 22px rgba(0, 150, 136, 0.6); }
.submit:disabled { opacity: 0.55; cursor: default; background: #b8e6da; box-shadow: none; }
.submit .btn-spin { margin-right: 8px; }

@media (max-width: 600px) {
  .store { padding: 14px; gap: 12px; }
  .store-emoji { width: 40px; height: 40px; font-size: 22px; border-radius: 12px; }
  .dish { flex-wrap: wrap; }
  .dish-action { flex-direction: row; width: 100%; justify-content: flex-end; align-items: center; }
}
</style>
