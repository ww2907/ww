<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOrderStats } from '../api/order.js'
import { session } from '../store.js'
import { useShellNav } from '../composables/useShellNav.js'
import AppHeader from '../components/layout/AppHeader.vue'
import AppNav from '../components/layout/AppNav.vue'
import AppSearch from '../components/layout/AppSearch.vue'
import AppTabbar from '../components/layout/AppTabbar.vue'

const router = useRouter()

// 顶部/底部导航、后台入口、退出登录：与首页同一套逻辑与尺寸
const { topNav, bottomNav, activeNav, account, setActive, onNav, goAdmin, logout } = useShellNav('mine')
setActive('mine')

const avatarText = computed(() => (account.value || '美').charAt(0).toUpperCase())
const keyword = ref('')

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

// 搜索：与首页一致，跳转到美食页检索
function onSearch() {
  const k = keyword.value.trim()
  router.push({ path: '/food', query: k ? { keyword: k } : {} })
}
function clearSearch() {
  keyword.value = ''
}

// 导航点击：未开发入口给出提示
const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null
function showToast(msg) {
  toastMsg.value = msg
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2200)
}
function handleNav(item) {
  if (!onNav(item)) showToast(`「${item.label}」页面开发中，敬请期待 🚧`)
}

onMounted(loadStats)
onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <div class="sh-page">
    <!-- 顶部导航栏（四页统一） -->
    <AppHeader :account="account" @logout="logout" @admin="goAdmin" />

    <!-- 顶部横向导航（桌面端） -->
    <AppNav :items="topNav" :active="activeNav" @select="handleNav" />

    <!-- 搜索栏（尺寸四页统一） -->
    <AppSearch
      v-model="keyword"
      placeholder="想吃点什么？搜店名、菜品或口味…"
      hint="🔎 搜索结果会跳转到「美食页」，挑一家好店继续回购。"
      @search="onSearch"
      @clear="clearSearch"
    />

    <!-- 用户横幅（与首页欢迎横幅同一尺寸） -->
    <section class="sh-banner usercard">
      <div class="sh-banner-text uinfo">
        <div class="avatar">{{ avatarText }}</div>
        <div class="utext">
          <div class="uname">{{ account }}</div>
          <div class="usub">食光 · 美食 会员</div>
        </div>
      </div>
      <div class="sh-banner-emoji">👤</div>
    </section>

    <!-- 加载态 -->
    <div v-if="loading" class="sh-state">
      <span class="sh-spinner"></span> 正在加载…
    </div>

    <!-- 错误态 -->
    <div v-else-if="errMsg" class="sh-state is-empty">😶 {{ errMsg }}</div>

    <template v-else>
      <!-- 订单次数 -->
      <section class="sh-block">
        <div class="sh-block-head">
          <h2>🧾 订单次数</h2>
          <span class="sh-count">累计 {{ stats.totalOrders }} 单</span>
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
      <section class="sh-block">
        <div class="sh-block-head">
          <h2>🍽️ 常点食物</h2>
          <span class="sh-count">{{ stats.frequentFoods.length }} 种</span>
        </div>

        <div v-if="stats.frequentFoods.length === 0" class="sh-state is-empty">
          🍜 还没有点过餐，去首页挑一家好店吧～
        </div>

        <div v-else class="sh-grid">
          <div class="sh-tile freq-item" v-for="(f, i) in stats.frequentFoods" :key="f.dishId || f.dishName">
            <span class="rank">{{ i + 1 }}</span>
            <div class="f-main">
              <div class="f-name">{{ f.dishName }}</div>
              <div class="f-sub">点了 {{ f.orderTimes }} 次 · 共 {{ f.totalQty }} 份</div>
            </div>
            <div class="f-price">¥{{ Number(f.price || 0).toFixed(2) }}</div>
          </div>
        </div>
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

    <footer class="sh-foot">食光 · 美食 — 发现身边的每一口好味道 🌿</footer>

    <!-- 底部导航栏（移动端主导航） -->
    <AppTabbar :items="bottomNav" :active="activeNav" @select="handleNav" />
  </div>

  <div class="sh-toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
</template>

<style scoped>
/* 用户横幅内部排版（横幅外框由全局 .sh-banner 统一提供） */
.usercard .uinfo { display: flex; align-items: center; gap: 14px; }
.usercard .avatar {
  width: 56px; height: 56px; border-radius: 50%; flex: none;
  background: rgba(255,255,255,0.28); color: #fff;
  font-weight: 900; font-size: 26px; display: grid; place-items: center;
}
.usercard .utext { min-width: 0; }
/* 文字块与首页横幅同结构（24px 标题 + 8px 间距 + 13px 副文案），保证横幅高度一致 */
.usercard .uname {
  font-size: 24px; font-weight: 900; line-height: 1.25;
  text-shadow: 0 3px 14px rgba(0,80,70,0.3);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.usercard .usub { font-size: 13px; line-height: 1.6; opacity: 0.95; margin-top: 8px; }

/* 订单次数网格（列数自适应，卡片尺寸与首页店铺卡同源） */
.count-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 12px;
}
.count-card {
  background: #fff; border: 1px solid var(--line); border-radius: 16px;
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

/* 常点食物卡片内部排版（外框尺寸由全局 .sh-tile 统一提供） */
.freq-item { display: flex; align-items: center; gap: 12px; }
.rank {
  width: 30px; height: 30px; flex: none; border-radius: 9px;
  background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff;
  font-weight: 900; font-size: 13px; display: grid; place-items: center;
}
.f-main { flex: 1; min-width: 0; }
.f-name {
  font-size: 15px; font-weight: 800; color: var(--ink);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.f-sub { font-size: 12px; color: var(--muted); margin-top: 3px; }
.f-price { flex: none; font-size: 14px; font-weight: 800; color: #e8730c; }

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

@media (max-width: 520px) {
  .usercard .avatar { width: 48px; height: 48px; font-size: 22px; }
  .usercard .uname { font-size: 20px; }
  .count-grid { gap: 10px; }
  .order-cta { padding: 16px; border-radius: 18px; }
  .cta-arrow { padding: 9px 12px; font-size: 12px; }
}
</style>
