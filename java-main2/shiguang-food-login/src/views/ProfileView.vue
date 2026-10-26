<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOrderStats } from '../api/order.js'
import { session } from '../store.js'

const router = useRouter()

const account = computed(() => session.account || '美食家')

const stats = ref({
  totalOrders: 0,
  unpaidCount: 0,
  paidCount: 0,
  completedCount: 0,
  cancelledCount: 0,
  frequentFoods: []
})
const loading = ref(true)
const errMsg = ref('')

// 订单次数卡片（含状态明细）
const countCards = computed(() => [
  { key: 'total', label: '订单总次数', value: stats.value.totalOrders, cls: 'total' },
  { key: 'completed', label: '已完成', value: stats.value.completedCount, cls: 'done' },
  { key: 'unpaid', label: '待支付', value: stats.value.unpaidCount, cls: 'pending' },
  { key: 'paid', label: '已支付', value: stats.value.paidCount, cls: 'paid' },
  { key: 'cancelled', label: '已取消', value: stats.value.cancelledCount, cls: 'cancel' }
])

async function loadStats() {
  loading.value = true
  errMsg.value = ''
  try {
    const data = await getOrderStats(session.account)
    stats.value = {
      totalOrders: data.totalOrders || 0,
      unpaidCount: data.unpaidCount || 0,
      paidCount: data.paidCount || 0,
      completedCount: data.completedCount || 0,
      cancelledCount: data.cancelledCount || 0,
      frequentFoods: Array.isArray(data.frequentFoods) ? data.frequentFoods : []
    }
  } catch (e) {
    errMsg.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function goOrders() {
  router.push('/orders')
}

function goHome() {
  router.push('/home')
}

onMounted(loadStats)
onUnmounted(() => {})
</script>

<template>
  <div class="profile">
    <!-- 顶部：返回 -->
    <header class="topbar">
      <button class="back" @click="goHome">‹ 首页</button>
      <span class="top-title">我的</span>
      <span class="top-spacer"></span>
    </header>

    <!-- 用户信息卡 -->
    <section class="usercard">
      <div class="avatar">{{ account.charAt(0).toUpperCase() }}</div>
      <div class="uinfo">
        <div class="uname">{{ account }}</div>
        <div class="usub">食光 · 美食 会员</div>
      </div>
    </section>

    <!-- 加载态 -->
    <div v-if="loading" class="state">
      <span class="spinner"></span> 正在加载… 
    </div>

    <!-- 错误态 -->
    <div v-else-if="errMsg" class="state empty">😶 {{ errMsg }}</div>

    <template v-else>
      <!-- 订单次数 -->
      <section class="block">
        <div class="block-head">
          <h2>🧾 订单次数</h2>
          <span class="count">累计 {{ stats.totalOrders }} 单</span>
        </div>
        <div class="count-grid">
          <div
            v-for="c in countCards"
            :key="c.key"
            class="count-card"
            :class="c.cls"
          >
            <div class="cv">{{ c.value }}</div>
            <div class="cl">{{ c.label }}</div>
          </div>
        </div>
      </section>

      <!-- 常点食物 -->
      <section class="block">
        <div class="block-head">
          <h2>🍽️ 常点食物</h2>
          <span class="count">{{ stats.frequentFoods.length }} 种</span>
        </div>

        <div v-if="stats.frequentFoods.length === 0" class="state empty">
          🍜 还没有点过餐，去首页挑一家好店吧～
        </div>

        <ul v-else class="freq">
          <li class="freq-item" v-for="(f, i) in stats.frequentFoods" :key="f.dishId || f.dishName">
            <span class="rank">{{ i + 1 }}</span>
            <div class="f-main">
              <div class="f-name">{{ f.dishName }}</div>
              <div class="f-sub">点了 {{ f.orderTimes }} 次 · 共 {{ f.totalQty }} 份</div>
            </div>
            <div class="f-price">¥{{ Number(f.price || 0).toFixed(2) }}</div>
          </li>
        </ul>
      </section>

      <!-- 我的订单入口 -->
      <section class="order-cta" @click="goOrders">
        <div class="cta-text">
          <h3>📦 查看我的订单</h3>
          <p>已完成、待支付、已取消的订单都在这里。</p>
        </div>
        <span class="cta-arrow">去查看 →</span>
      </section>
    </template>

    <footer class="foot">食光 · 美食 — 发现身边的每一口好味道 🌿</footer>
  </div>
</template>

<style scoped>
.profile {
  color: var(--ink);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 92px;
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

/* 用户信息卡 */
.usercard {
  display: flex; align-items: center; gap: 14px; padding: 20px;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(0,184,148,0.92), rgba(0,206,201,0.92));
  color: #fff; box-shadow: var(--shadow);
}
.usercard .avatar {
  width: 56px; height: 56px; border-radius: 50%;
  background: rgba(255,255,255,0.28); color: #fff;
  font-weight: 900; font-size: 26px; display: grid; place-items: center;
}
.uinfo { min-width: 0; }
.uname { font-size: 20px; font-weight: 900; text-shadow: 0 3px 14px rgba(0,80,70,0.3); }
.usub { font-size: 12px; opacity: 0.95; margin-top: 4px; }

/* 加载 / 错误 / 空态 */
.state { text-align: center; padding: 40px 10px; font-size: 14px; color: var(--muted); }
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

/* 订单次数网格 */
.count-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.count-card {
  background: #fff; border: 1px solid var(--line); border-radius: 14px;
  padding: 14px 10px; text-align: center;
}
.count-card .cv { font-size: 24px; font-weight: 900; color: var(--deep); }
.count-card .cl { font-size: 12px; color: var(--muted); margin-top: 4px; }
.count-card.total { background: linear-gradient(135deg, rgba(0,184,148,0.12), rgba(0,206,201,0.12)); }
.count-card.total .cv { color: #0a9b8a; }
.count-card.done .cv { color: #0a9b8a; }
.count-card.pending .cv { color: #e08e0b; }
.count-card.paid .cv { color: #2d7ff9; }
.count-card.cancel .cv { color: #777; }

/* 常点食物 */
.freq { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.freq-item {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 12px;
}
.rank {
  width: 26px; height: 26px; flex: none; border-radius: 8px;
  background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff;
  font-weight: 900; font-size: 13px; display: grid; place-items: center;
}
.f-main { flex: 1; min-width: 0; }
.f-name { font-size: 15px; font-weight: 800; color: var(--ink); }
.f-sub { font-size: 12px; color: var(--muted); margin-top: 3px; }
.f-price { font-size: 14px; font-weight: 800; color: #e8730c; }

/* 我的订单 CTA */
.order-cta {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(224,247,246,0.95));
  border: 1px solid rgba(0,184,148,0.25);
  border-radius: 20px; padding: 18px 20px; cursor: pointer;
  box-shadow: 0 10px 26px rgba(0,150,136,0.16);
  transition: transform 0.15s, box-shadow 0.15s;
}
.order-cta:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(0,150,136,0.24); }
.cta-text h3 { font-size: 16px; font-weight: 900; color: var(--deep); }
.cta-text p { margin-top: 6px; font-size: 12px; color: var(--muted); line-height: 1.6; }
.cta-arrow {
  flex: none; font-size: 13px; font-weight: 800; color: #fff;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  padding: 10px 16px; border-radius: 12px; white-space: nowrap;
  box-shadow: 0 6px 14px rgba(0,150,136,0.35);
}

.foot { text-align: center; font-size: 12px; color: rgba(255,255,255,0.9); text-shadow: 0 2px 8px rgba(0,80,70,0.3); margin-top: 8px; }

@media (max-width: 600px) {
  .count-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
