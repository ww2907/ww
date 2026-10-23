<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyOrders } from '../api/order.js'
import { session } from '../store.js'

const router = useRouter()

const orders = ref([])
const loading = ref(true)
const errMsg = ref('')

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

onMounted(async () => {
  try {
    orders.value = await getMyOrders(session.account)
  } catch (e) {
    errMsg.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="orders">
    <!-- 顶部：返回 -->
    <header class="topbar">
      <button class="back" @click="goBack">‹ 返回</button>
      <span class="top-title">我的订单</span>
      <span class="top-spacer"></span>
    </header>

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
      <article class="order-card" v-for="o in orders" :key="o.id || o.orderNo">
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
        <div class="oc-no">订单号：{{ o.orderNo }}</div>
      </article>
    </div>
  </div>
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
}
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
</style>
