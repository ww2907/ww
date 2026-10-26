<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyOrders, updateOrderStatus } from '../api/order.js'
import { session } from '../store.js'

const router = useRouter()

const orders = ref([])
const loading = ref(true)
const errMsg = ref('')
const acting = ref(false)

// 状态筛选：null=全部；0 待支付 / 1 已支付 / 2 已完成 / 3 已取消
const tabs = [
  { label: '全部', status: null },
  { label: '待支付', status: 0 },
  { label: '已支付', status: 1 },
  { label: '已完成', status: 2 },
  { label: '已取消', status: 3 }
]
const activeStatus = ref(null)

function goBack() {
  router.push('/home')
}

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
    showToast(status === 3 ? '订单已取消' : status === 1 ? '已支付，等待出餐～' : '订单已完成 🎉')
    loadOrders()
  } catch (e) {
    showToast(e.message || '操作失败')
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

// 点击卡片进入订单详情
function openDetail(o) {
  router.push('/order-detail/' + (o.id != null ? o.id : o.orderNo))
}

// 轻提示
const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null
function showToast(msg) {
  toastMsg.value = msg
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2000)
}

onMounted(loadOrders)
onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <div class="orders">
    <!-- 顶部：返回 -->
    <header class="topbar">
      <button class="back" @click="goBack">‹ 返回</button>
      <span class="top-title">我的订单</span>
      <span class="top-spacer"></span>
    </header>

    <!-- 状态筛选标签 -->
    <nav class="tabs">
      <button
        v-for="t in tabs"
        :key="t.label"
        class="tab"
        :class="{ active: activeStatus === t.status }"
        @click="selectTab(t.status)"
      >{{ t.label }}</button>
    </nav>

    <!-- 加载态 -->
    <div v-if="loading" class="state">
      <span class="spinner"></span> 正在加载订单…
    </div>

    <!-- 错误态 -->
    <div v-else-if="errMsg" class="state empty">😶 {{ errMsg }}</div>

    <!-- 空态 -->
    <div v-else-if="orders.length === 0" class="state empty">
      🧾 还没有订单，去首页挑一家好店点餐吧～
    </div>

    <!-- 订单列表 -->
    <div v-else class="list">
      <article class="order-card" v-for="o in orders" :key="o.id || o.orderNo" @click="openDetail(o)">
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
        </div>
        <div class="oc-final" v-else-if="o.status === 2">✅ 订单已完成</div>
        <div class="oc-final" v-else>⛔ 订单已取消</div>
        <div class="oc-no">订单号：{{ o.orderNo }}</div>
      </article>
    </div>
  </div>

  <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
</template>

<style scoped>
.orders {
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

/* 状态筛选标签 */
.tabs {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  padding: 7px;
  box-shadow: 0 8px 22px rgba(0, 150, 136, 0.14);
  overflow-x: auto;
}
.tabs .tab {
  flex: 1 0 auto;
  border: none;
  background: transparent;
  color: var(--muted);
  padding: 8px 12px;
  border-radius: 11px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.tabs .tab:hover { background: rgba(0, 184, 148, 0.12); color: var(--deep); }
.tabs .tab.active {
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff;
  box-shadow: 0 6px 14px rgba(0, 150, 136, 0.35);
}

/* 加载 / 错误 / 空态 */
.state { text-align: center; padding: 50px 10px; font-size: 14px; color: var(--muted); }
.state.empty { color: var(--deep); }
.spinner {
  display: inline-block; width: 16px; height: 16px;
  border: 3px solid rgba(0, 150, 136, 0.25); border-top-color: var(--teal);
  border-radius: 50%; animation: spin 0.7s linear infinite;
  vertical-align: -3px; margin-right: 6px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 列表 */
.list { display: flex; flex-direction: column; gap: 14px; }
.order-card {
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(8px);
  border-radius: 20px; padding: 16px;
  box-shadow: 0 10px 26px rgba(0,150,136,0.16);
  border: 1px solid rgba(255,255,255,0.6);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.order-card:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(0,150,136,0.24); }
.oc-head { display: flex; align-items: center; justify-content: space-between; }
.oc-store { font-size: 16px; font-weight: 900; color: var(--ink); }
.oc-status {
  font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 999px;
}
.oc-status.pending { background: rgba(243,156,18,0.15); color: #e08e0b; }
.oc-status.paid { background: rgba(0,184,148,0.15); color: var(--deep); }
.oc-status.cancel { background: rgba(120,120,120,0.15); color: #777; }

.oc-items { list-style: none; margin: 12px 0 0; display: flex; flex-direction: column; gap: 8px; }
.oc-items li { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.it-name { flex: 1; min-width: 0; color: var(--ink); }
.it-x { color: var(--muted); }
.it-sub { font-weight: 800; color: #e8730c; }

.oc-foot {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--line);
}
.oc-time { font-size: 12px; color: var(--muted); }
.oc-total { font-size: 13px; color: var(--muted); }
.oc-total b { font-size: 17px; color: #e8730c; }

.oc-no { margin-top: 8px; font-size: 11px; color: var(--muted); opacity: 0.8; word-break: break-all; }

/* 订单操作区 */
.oc-actions {
  display: flex; gap: 10px; justify-content: flex-end;
  margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--line);
}
.act {
  border: none; cursor: pointer; padding: 8px 16px; border-radius: 11px;
  font-size: 13px; font-weight: 800; transition: transform 0.15s, box-shadow 0.15s;
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
.act.cancel {
  background: rgba(120, 120, 120, 0.12); color: #777;
}
.act.cancel:hover:not(:disabled) { background: rgba(120, 120, 120, 0.22); }
.oc-final {
  margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--line);
  text-align: right; font-size: 12px; font-weight: 700; color: var(--muted);
}

/* 轻提示 */
.toast {
  position: fixed; top: 28px; left: 50%;
  transform: translateX(-50%) translateY(-20px) scale(0.95);
  background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff;
  padding: 14px 26px; border-radius: 14px; font-weight: 700;
  box-shadow: 0 10px 30px rgba(0, 150, 136, 0.45);
  opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s; z-index: 999;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
</style>
