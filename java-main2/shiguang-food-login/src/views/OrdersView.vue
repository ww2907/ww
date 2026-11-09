<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyOrders, updateOrderStatus, createOrder } from '../api/order.js'
import { session } from '../store.js'
import { toast } from '../composables/useToast.js'
import OrderDetailModal from '../components/OrderDetailModal.vue'
import EmptyState from '../components/EmptyState.vue'
import { useShellNav } from '../composables/useShellNav.js'
import AppHeader from '../components/layout/AppHeader.vue'
import AppNav from '../components/layout/AppNav.vue'
import AppSearch from '../components/layout/AppSearch.vue'
import AppTabbar from '../components/layout/AppTabbar.vue'

const router = useRouter()

// 顶部/底部导航、后台入口、退出登录：与首页同一套逻辑与尺寸
const { topNav, bottomNav, activeNav, account, setActive, onNav, showAdmin, goAdmin, logout } = useShellNav('order')
setActive('order')

const orders = ref([])
const loading = ref(true)
const errMsg = ref('')
const acting = ref(false)
const keyword = ref('')

// 订单详情弹窗
const detailShow = ref(false)
const detailOrder = ref(null)

// 状态筛选：null=全部；0 待支付 / 1 已支付 / 2 已完成 / 3 已取消
const tabs = [
  { label: '全部', status: null },
  { label: '待支付', status: 0 },
  { label: '已支付', status: 1 },
  { label: '已完成', status: 2 },
  { label: '已取消', status: 3 }
]
const activeStatus = ref(null)

// 状态徽标样式
function statusClass(s) {
  // 0 待支付 / 1 已支付 / 2 已完成 / 3 已取消
  if (s === 1 || s === 2) return 'paid'
  if (s === 3) return 'cancel'
  return 'pending'
}

// 该状态下可执行的动作
function actionsFor(s) {
  // 0 待支付 / 1 已支付 / 2 已完成 / 3 已取消
  if (s === 0) return [{ label: '去支付', status: 1, cls: 'pay' }, { label: '取消订单', status: 3, cls: 'cancel' }]
  if (s === 1) return [{ label: '确认完成', status: 2, cls: 'done' }, { label: '取消订单', status: 3, cls: 'cancel' }]
  return []
}

async function changeStatus(o, status) {
  if (acting.value) return
  acting.value = true
  try {
    await updateOrderStatus(o.id, status)
    toast(status === 3 ? '订单已取消' : status === 1 ? '已支付，等待出餐～' : '订单已完成 🎉', 'success')
    // 同步更新弹窗内订单对象
    if (detailOrder.value && detailOrder.value.id === o.id) {
      detailOrder.value = await getMyOrders(session.account, null).then((list) => list.find((x) => x.id === o.id) || detailOrder.value)
    }
    loadOrders()
  } catch (e) {
    toast(e.message || '操作失败', 'error')
  } finally {
    acting.value = false
  }
}

// 弹窗内的支付 / 取消
function onModalPay(o) {
  changeStatus(o, 1)
}
function onModalCancel(o) {
  changeStatus(o, 3)
}

// 再来一单：用原订单的菜品重新下单（同店铺）
async function reorder(o) {
  if (acting.value) return
  if (!o || !o.items || !o.items.length) {
    toast('该订单没有可复购的菜品', 'info')
    return
  }
  acting.value = true
  try {
    const items = o.items.map((it) => ({
      dishId: it.dishId != null ? it.dishId : null,
      name: it.dishName,
      price: Number(it.price || 0),
      qty: it.qty
    }))
    const order = await createOrder({
      restaurantId: o.restaurantId != null ? o.restaurantId : null,
      restaurantName: o.restaurantName,
      account: session.account,
      items
    })
    toast(`再来一单成功 🎉 订单号 ${order.orderNo}`, 'success')
    detailShow.value = false
    loadOrders()
  } catch (e) {
    toast(e.message || '再来一单失败', 'error')
  } finally {
    acting.value = false
  }
}

async function loadOrders() {
  loading.value = true
  errMsg.value = ''
  try {
    orders.value = await getMyOrders(session.account, activeStatus.value)
  } catch (e) {
    errMsg.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function selectTab(status) {
  if (activeStatus.value === status) return
  activeStatus.value = status
  loadOrders()
}

// 点击卡片弹出订单详情弹窗
function openDetail(o) {
  detailOrder.value = o
  detailShow.value = true
}

// 搜索：与首页一致，跳转到美食页检索
function onSearch() {
  const k = keyword.value.trim()
  router.push({ path: '/food', query: k ? { keyword: k } : {} })
}
function clearSearch() {
  keyword.value = ''
}

// 导航点击：未开发入口给出提示
function handleNav(item) {
  if (!onNav(item)) toast(`「${item.label}」页面开发中，敬请期待 🚧`)
}

onMounted(loadOrders)
</script>

<template>
  <div class="sh-page">
    <!-- 顶部导航栏（四页统一） -->
    <AppHeader :account="account" :show-admin="showAdmin" @logout="logout" @admin="goAdmin" />

    <!-- 顶部横向导航（桌面端） -->
    <AppNav :items="topNav" :active="activeNav" @select="handleNav" />

    <!-- 搜索栏（尺寸四页统一） -->
    <AppSearch
      v-model="keyword"
      placeholder="想吃点什么？搜店名、菜品或口味…"
      hint="🔎 搜索结果会跳转到「美食页」，找到新店再下单。"
      @search="onSearch"
      @clear="clearSearch"
    />

    <!-- 页面标题横幅（与首页欢迎横幅同一尺寸） -->
    <section class="sh-banner">
      <div class="sh-banner-text">
        <h1>🧾 我的订单</h1>
        <p>共 {{ orders.length }} 单，随时查看出餐进度与历史记录。</p>
      </div>
      <div class="sh-banner-emoji">🧾</div>
    </section>

    <!-- 状态筛选 -->
    <nav class="sh-chips">
      <button
        v-for="t in tabs"
        :key="t.label"
        class="sh-chip"
        :class="{ active: activeStatus === t.status }"
        @click="selectTab(t.status)"
      >{{ t.label }}</button>
    </nav>

    <!-- 订单列表 -->
    <section class="sh-block">
      <div class="sh-block-head">
        <h2>{{ activeStatus === null ? '📋 全部订单' : '📋 ' + tabs.find((t) => t.status === activeStatus).label + '订单' }}</h2>
        <span class="sh-count">{{ loading ? '加载中…' : orders.length + ' 单' }}</span>
      </div>

      <!-- 加载态 -->
      <div v-if="loading" class="sh-state">
        <span class="sh-spinner"></span> 正在加载订单…
      </div>

      <!-- 错误态 -->
      <div v-else-if="errMsg" class="sh-state is-empty">😶 {{ errMsg }}</div>

      <!-- 空态 -->
      <div v-else-if="orders.length === 0">
        <EmptyState type="order" title="还没有订单" desc="去首页挑一家好店，开启你的第一单吧～">
          <template #action>
            <button class="es-go" @click="router.push('/home')">去逛逛美食</button>
          </template>
        </EmptyState>
      </div>

      <!-- 订单卡片 -->
      <div v-else class="sh-grid">
        <article class="sh-tile is-click order-card" v-for="o in orders" :key="o.id || o.orderNo" @click="openDetail(o)">
          <div class="oc-head">
            <div class="oc-store">🍜 {{ o.restaurantName }}</div>
            <span class="oc-status" :class="statusClass(o.status)">{{ o.statusText }}</span>
          </div>
          <ul class="oc-items">
            <li v-for="(it, i) in o.items" :key="i">
              <span class="it-name">{{ it.dishName }}</span>
              <span class="it-x">×{{ it.qty }}</span>
              <span class="it-sub">¥{{ Number(it.subtotal || 0).toFixed(2) }}</span>
            </li>
          </ul>
          <div class="oc-foot">
            <span class="oc-time">{{ o.createdAt }}</span>
            <span class="oc-total">合计 <b>¥{{ Number(o.totalAmount || 0).toFixed(2) }}</b></span>
          </div>
          <div class="oc-actions" v-if="actionsFor(o.status).length">
            <button
              v-for="a in actionsFor(o.status)"
              :key="a.status"
              class="act"
              :class="a.cls"
              :disabled="acting"
              @click.stop="changeStatus(o, a.status)"
            >{{ a.label }}</button>
            <button class="act reorder" :disabled="acting" @click.stop="reorder(o)">再来一单</button>
          </div>
          <div class="oc-final" v-else-if="o.status === 2">✅ 订单已完成 · <button class="link-btn" :disabled="acting" @click.stop="reorder(o)">再来一单</button></div>
          <div class="oc-final" v-else>⛔ 订单已取消 · <button class="link-btn" :disabled="acting" @click.stop="reorder(o)">再来一单</button></div>
          <div class="oc-no">订单号：{{ o.orderNo }}</div>
        </article>
      </div>
    </section>

    <footer class="sh-foot">食光 · 美食 — 发现身边的每一口好味道 🌿</footer>

    <!-- 底部导航栏（移动端主导航） -->
    <AppTabbar :items="bottomNav" :active="activeNav" @select="handleNav" />

    <!-- 订单详情弹窗 -->
    <OrderDetailModal
      :show="detailShow"
      :order="detailOrder"
      :acting="acting"
      @close="detailShow = false"
      @pay="onModalPay"
      @cancel="onModalCancel"
      @reorder="reorder"
    />
  </div>
</template>

<style scoped>
/* 订单卡片内部排版（外框尺寸由全局 .sh-tile 统一提供） */
.oc-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.oc-store {
  font-size: 15px; font-weight: 900; color: var(--ink);
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.oc-status { flex: none; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 999px; }
.oc-status.pending { background: rgba(243,156,18,0.15); color: #e08e0b; }
.oc-status.paid { background: rgba(0,184,148,0.15); color: var(--deep); }
.oc-status.cancel { background: rgba(120,120,120,0.15); color: #777; }

.oc-items { list-style: none; margin: 10px 0 0; display: flex; flex-direction: column; gap: 6px; }
.oc-items li { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.it-name { flex: 1; min-width: 0; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.it-x { color: var(--muted); flex: none; }
.it-sub { font-weight: 800; color: #e8730c; flex: none; }

.oc-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--line);
}
.oc-time { font-size: 11px; color: var(--muted); }
.oc-total { font-size: 12px; color: var(--muted); flex: none; }
.oc-total b { font-size: 16px; color: #e8730c; }

.oc-no { margin-top: 8px; font-size: 11px; color: var(--muted); opacity: 0.8; word-break: break-all; }

/* 订单操作区 */
.oc-actions {
  display: flex; gap: 8px; justify-content: flex-end;
  margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--line);
}
.act {
  border: none; cursor: pointer; padding: 7px 13px; border-radius: 10px;
  font-size: 12px; font-weight: 800; font-family: inherit;
  transition: transform 0.15s, box-shadow 0.15s;
}
.act:disabled { opacity: 0.6; cursor: default; }
.act.pay {
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff; box-shadow: 0 6px 14px rgba(0, 150, 136, 0.35);
}
.act.pay:hover:not(:disabled) { transform: translateY(-1px); }
.act.done {
  background: rgba(0, 184, 148, 0.14); color: var(--deep);
  border: 1px solid rgba(0, 184, 148, 0.35);
}
.act.done:hover:not(:disabled) { background: rgba(0, 184, 148, 0.24); }
.act.cancel { background: rgba(120, 120, 120, 0.12); color: #777; }
.act.cancel:hover:not(:disabled) { background: rgba(120, 120, 120, 0.22); }
.oc-final {
  margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--line);
  text-align: right; font-size: 12px; font-weight: 700; color: var(--muted);
}
.oc-actions .reorder {
  background: rgba(255, 255, 255, 0.9); color: var(--deep); border: 1px solid var(--line);
}
.oc-actions .reorder:hover:not(:disabled) { background: rgba(0, 184, 148, 0.1); }
.link-btn {
  border: none; background: none; color: var(--deep); font-weight: 800;
  font-size: 12px; cursor: pointer; padding: 0; font-family: inherit;
  text-decoration: underline; text-underline-offset: 2px;
}
.link-btn:disabled { opacity: 0.6; cursor: default; }
.es-go {
  border: none; cursor: pointer; padding: 11px 24px; border-radius: 12px;
  background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff;
  font-weight: 800; font-size: 14px; font-family: inherit;
  box-shadow: 0 6px 14px rgba(0, 150, 136, 0.35); transition: transform 0.15s, box-shadow 0.15s;
}
.es-go:hover { transform: translateY(-1px); box-shadow: 0 9px 18px rgba(0, 150, 136, 0.5); }
</style>
