<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderDetail, updateOrderStatus } from '../api/order.js'

const route = useRoute()
const router = useRouter()

const order = ref(null)
const loading = ref(true)
const errMsg = ref('')
const acting = ref(false)

function goBack() {
  router.push('/orders')
}

// 状态徽标样式
function statusClass(s) {
  if (s === 1 || s === 2) return 'paid'
  if (s === 3) return 'cancel'
  return 'pending'
}

// 状态时间线步骤
function timelineSteps(s) {
  // 0 待支付 / 1 已支付 / 2 已完成 / 3 已取消
  if (s === 3) {
    return [
      { label: '待支付', state: 'done' },
      { label: '已取消', state: 'cancel' }
    ]
  }
  return [
    { label: '待支付', state: s === 0 ? 'active' : 'done' },
    { label: '已支付', state: s < 1 ? 'todo' : s === 1 ? 'active' : 'done' },
    { label: '已完成', state: s < 2 ? 'todo' : 'active' }
  ]
}

// 可执行的动作
function actionsFor(s) {
  if (s === 0) return [{ label: '去支付', status: 1, cls: 'pay' }, { label: '取消订单', status: 3, cls: 'cancel' }]
  if (s === 1) return [{ label: '确认完成', status: 2, cls: 'done' }, { label: '取消订单', status: 3, cls: 'cancel' }]
  return []
}

async function changeStatus(status) {
  if (!order.value || acting.value) return
  acting.value = true
  try {
    const updated = await updateOrderStatus(order.value.id, status)
    showToast(status === 3 ? '订单已取消' : status === 1 ? '已支付，等待出餐～' : '订单已完成 🎉')
    order.value = updated
  } catch (e) {
    showToast(e.message || '操作失败')
  } finally {
    acting.value = false
  }
}

async function loadDetail() {
  loading.value = true
  errMsg.value = ''
  try {
    const id = Number(route.params.id)
    order.value = await getOrderDetail(id)
    if (!order.value) errMsg.value = '订单不存在'
  } catch (e) {
    errMsg.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
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

onMounted(loadDetail)
onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <div class="detail">
    <!-- 顶部：返回 -->
    <header class="topbar">
      <button class="back" @click="goBack">‹ 返回</button>
      <span class="top-title">订单详情</span>
      <span class="top-spacer"></span>
    </header>

    <!-- 加载态 -->
    <div v-if="loading" class="state">
      <span class="spinner"></span> 正在加载订单…
    </div>

    <!-- 错误态 -->
    <div v-else-if="errMsg" class="state empty">😶 {{ errMsg }}</div>

    <template v-else-if="order">
      <!-- 状态 + 时间线 -->
      <section class="block status-block">
        <div class="status-head">
          <span class="oc-status" :class="statusClass(order.status)">{{ order.statusText }}</span>
        </div>
        <div class="timeline">
          <template v-for="(step, i) in timelineSteps(order.status)" :key="i">
            <div class="tl-node" :class="step.state">
              <span class="tl-dot"></span>
              <span class="tl-label">{{ step.label }}</span>
            </div>
            <span v-if="i < timelineSteps(order.status).length - 1" class="tl-line" :class="step.state === 'done' ? 'on' : ''"></span>
          </template>
        </div>
      </section>

      <!-- 店铺（尺寸/圆角对齐首页卡片） -->
      <section class="block">
        <div class="store">
          <div class="store-emoji">🍜</div>
          <div class="store-info">
            <div class="store-name">{{ order.restaurantName }}</div>
            <div class="store-sub">🧾 订单店铺</div>
          </div>
        </div>
      </section>

      <!-- 菜品明细 -->
      <section class="block">
        <div class="block-head">
          <h2>🧾 菜品明细</h2>
          <span class="count">{{ (order.items || []).length }} 种 · {{ order.itemCount }} 件</span>
        </div>
        <ul class="items">
          <li class="item" v-for="(it, i) in order.items" :key="i">
            <span class="it-name">{{ it.dishName }}</span>
            <span class="it-x">×{{ it.qty }}</span>
            <span class="it-sub">¥{{ Number(it.subtotal || 0).toFixed(2) }}</span>
          </li>
        </ul>
        <div class="total-row">
          <span>合计</span>
          <span class="total-amt">¥{{ Number(order.totalAmount || 0).toFixed(2) }}</span>
        </div>
      </section>

      <!-- 订单信息 -->
      <section class="block info">
        <div class="info-row"><span>订单号</span><span class="mono">{{ order.orderNo }}</span></div>
        <div class="info-row"><span>下单时间</span><span>{{ order.createdAt }}</span></div>
      </section>

      <!-- 操作 -->
      <div class="actions" v-if="actionsFor(order.status).length">
        <button
          v-for="a in actionsFor(order.status)"
          :key="a.status"
          class="act"
          :class="a.cls"
          :disabled="acting"
          @click="changeStatus(a.status)"
        >{{ a.label }}</button>
      </div>
      <div class="final-tip" v-else-if="order.status === 2">✅ 订单已完成</div>
      <div class="final-tip" v-else>⛔ 订单已取消</div>
    </template>

    <footer class="foot">食光 · 美食 — 发现身边的每一口好味道 🌿</footer>
  </div>

  <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
</template>

<style scoped>
.detail {
  color: var(--ink);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 96px;
}

/* 顶部返回 */
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(14px); border-radius: 16px;
  box-shadow: var(--shadow); border: 1px solid rgba(255, 255, 255, 0.6);
}
.back {
  border: none; cursor: pointer; background: rgba(0, 184, 148, 0.12);
  color: var(--deep); font-weight: 800; font-size: 14px;
  padding: 8px 14px; border-radius: 11px; transition: background 0.15s;
}
.back:hover { background: rgba(0, 184, 148, 0.25); }
.top-title { font-weight: 900; font-size: 16px; color: var(--deep); }
.top-spacer { width: 64px; }

/* 加载 / 错误 */
.state { text-align: center; padding: 50px 10px; font-size: 14px; color: var(--muted); }
.state.empty { color: var(--deep); }
.spinner {
  display: inline-block; width: 16px; height: 16px;
  border: 3px solid rgba(0, 150, 136, 0.25); border-top-color: var(--teal);
  border-radius: 50%; animation: spin 0.7s linear infinite;
  vertical-align: -3px; margin-right: 6px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 区块 */
.block { background: rgba(255,255,255,0.86); backdrop-filter: blur(8px); border-radius: 22px; padding: 18px; box-shadow: 0 10px 26px rgba(0,150,136,0.16); border: 1px solid rgba(255,255,255,0.6); }
.block-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
.block-head h2 { font-size: 17px; font-weight: 900; color: var(--deep); }
.count { font-size: 12px; color: var(--muted); }

/* 状态 + 时间线 */
.status-block { background: linear-gradient(135deg, rgba(0,184,148,0.10), rgba(0,206,201,0.10)); }
.status-head { text-align: center; margin-bottom: 16px; }
.oc-status {
  display: inline-block; font-size: 13px; font-weight: 800; padding: 5px 14px; border-radius: 999px;
}
.oc-status.pending { background: rgba(243,156,18,0.15); color: #e08e0b; }
.oc-status.paid { background: rgba(0,184,148,0.15); color: var(--deep); }
.oc-status.cancel { background: rgba(120,120,120,0.15); color: #777; }

.timeline { display: flex; align-items: center; justify-content: center; gap: 0; }
.tl-node { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 64px; }
.tl-dot {
  width: 18px; height: 18px; border-radius: 50%;
  background: #d9e6e3; border: 2px solid #c2d6d2;
}
.tl-node.active .tl-dot { background: var(--teal); border-color: var(--teal); box-shadow: 0 0 0 4px rgba(0,184,148,0.18); }
.tl-node.done .tl-dot { background: var(--deep); border-color: var(--deep); }
.tl-node.cancel .tl-dot { background: #9aa; border-color: #9aa; }
.tl-label { font-size: 12px; font-weight: 700; color: var(--muted); }
.tl-node.active .tl-label { color: var(--deep); }
.tl-node.done .tl-label { color: var(--deep); }
.tl-line { flex: 1; height: 3px; background: #d9e6e3; border-radius: 2px; min-width: 24px; }
.tl-line.on { background: var(--deep); }

/* 店铺（与首页卡片尺寸 / 圆角 / 描边对齐） */
.store {
  display: flex; align-items: center; gap: 14px;
  background: #fff; border-radius: 16px; padding: 14px; border: 1px solid var(--line);
  transition: box-shadow 0.15s;
}
.store:hover { box-shadow: 0 12px 26px rgba(0, 150, 136, 0.18); }
.store-emoji {
  width: 46px; height: 46px; flex: none; border-radius: 13px; font-size: 26px;
  background: linear-gradient(135deg, rgba(0, 184, 148, 0.15), rgba(0, 206, 201, 0.15));
  display: grid; place-items: center;
}
.store-info { min-width: 0; }
.store-name { font-size: 15px; font-weight: 800; color: var(--ink); }
.store-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }

/* 菜品明细 */
.items { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.item { display: flex; align-items: center; gap: 10px; font-size: 14px; }
.it-name { flex: 1; min-width: 0; color: var(--ink); }
.it-x { color: var(--muted); }
.it-sub { font-weight: 800; color: #e8730c; }
.total-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--line);
  font-size: 13px; color: var(--muted);
}
.total-amt { font-size: 19px; font-weight: 900; color: #e8730c; }

/* 订单信息 */
.info { display: flex; flex-direction: column; gap: 10px; }
.info-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; }
.info-row > span:first-child { color: var(--muted); }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; word-break: break-all; text-align: right; }

/* 操作 */
.actions { display: flex; gap: 12px; }
.act {
  flex: 1; border: none; cursor: pointer; padding: 13px 0; border-radius: 14px;
  font-size: 15px; font-weight: 800; transition: transform 0.15s, box-shadow 0.15s;
}
.act:disabled { opacity: 0.6; cursor: default; }
.act.pay { background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff; box-shadow: 0 8px 18px rgba(0,150,136,0.4); }
.act.pay:hover:not(:disabled) { transform: translateY(-1px); }
.act.done { background: rgba(0,184,148,0.14); color: var(--deep); border: 1px solid rgba(0,184,148,0.35); }
.act.done:hover:not(:disabled) { background: rgba(0,184,148,0.24); }
.act.cancel { background: rgba(120,120,120,0.12); color: #777; }
.act.cancel:hover:not(:disabled) { background: rgba(120,120,120,0.22); }
.final-tip { text-align: center; font-size: 13px; font-weight: 700; color: var(--muted); padding: 6px 0; }

.foot { text-align: center; font-size: 12px; color: rgba(255,255,255,0.9); text-shadow: 0 2px 8px rgba(0,80,70,0.3); margin-top: 8px; }

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
