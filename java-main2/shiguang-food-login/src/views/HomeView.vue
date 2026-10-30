<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getSearchConfig, getRecommendedRestaurants, adminData } from '../store/admin.js'
import { ADMIN_USE_MOCK, getNavConfig, getRecommend, getSearchConfig as fetchSearchConfig } from '../api/admin.js'
import { useShellNav } from '../composables/useShellNav.js'
import AppHeader from '../components/layout/AppHeader.vue'
import AppNav from '../components/layout/AppNav.vue'
import AppSearch from '../components/layout/AppSearch.vue'
import AppTabbar from '../components/layout/AppTabbar.vue'

const router = useRouter()
const route = useRoute()

// 顶部/底部导航、后台入口、退出登录：四页共用同一套逻辑
const { topNav, bottomNav, activeNav, account, setActive, onNav, goAdmin, logout } = useShellNav('home')
setActive('home')

// 根据时间生成问候语
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

// 导航点击：未开发入口给出提示
function handleNav(item) {
  if (!onNav(item)) showToast(`「${item.label}」页面开发中，敬请期待 🚧`)
}

// ---------- 搜索栏（回车 / 点击「搜索」跳转到美食页，按关键字检索）----------
const keyword = ref('')
const loading = ref(false)
let searchTimer = null

// 搜索框占位文案来自后台「搜索管理」配置
const searchPlaceholder = computed(
  () => getSearchConfig().placeholder || '搜美食、搜好店，回车进入美食页…'
)

// ---------- 推荐美食（首页只展示 12 家推荐）----------
const recommended = ref([])

const list = computed(() => recommended.value)

// 首页「推荐美食」来自后台「推荐管理」配置（勾选哪些店铺就展示哪些）
async function loadRecommended() {
  loading.value = true
  try {
    await new Promise((r) => setTimeout(r, 300))
    recommended.value = getRecommendedRestaurants(12)
  } catch (e) {
    showToast(e.message || '加载失败，请稍后重试')
    recommended.value = []
  } finally {
    loading.value = false
  }
}

// 点击搜索按钮 / 回车 → 进入美食页并带上关键字
function onSearch() {
  const k = keyword.value.trim()
  router.push({ path: '/food', query: k ? { keyword: k } : {} })
}

// 输入即搜（防抖 300ms）：预览式跳转到美食页
function onInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(onSearch, 300)
}

function clearSearch() {
  keyword.value = ''
  clearTimeout(searchTimer)
}

// ---------- 进入美食页面（查看其余全部店铺）----------
function goFood() {
  router.push('/food')
}

// ---------- 下单：跳转到该店铺的点餐页 ----------
// 点进店铺详情
function openDetail(r) {
  router.push('/restaurant/' + (r.id || r.name))
}
// 点击「下单」跳转到点餐页（/order/:id），由点餐页完成选餐与提交订单
function onOrder(r) {
  router.push('/order/' + (r.id || r.name))
}

// ---------- 轻提示 ----------
const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null
function showToast(msg) {
  toastMsg.value = msg
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2200)
}

onMounted(async () => {
  setActive('home')
  // 真实后端模式：先从后台拉取导航/搜索/推荐配置，使首页与后台管理保持一致
  if (!ADMIN_USE_MOCK) {
    try {
      const [nav, search, rec] = await Promise.all([getNavConfig(), fetchSearchConfig(), getRecommend()])
      if (nav) {
        adminData.navTop = nav.top || adminData.navTop
        adminData.navBottom = nav.bottom || adminData.navBottom
      }
      if (search) adminData.search = search
      if (rec && Array.isArray(rec.ids)) adminData.recommendedIds = rec.ids
    } catch (e) { /* 拉取失败则保持本地兜底 */ }
  }
  await loadRecommended()
})
onUnmounted(() => {
  clearTimeout(searchTimer)
  clearTimeout(toastTimer)
})
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
      :placeholder="searchPlaceholder"
      hint="🔎 搜索会跳转到「美食页」，可按关键字与分类筛选全部好店。"
      @input="onInput"
      @search="onSearch"
      @clear="clearSearch"
    />

    <!-- 欢迎横幅 -->
    <section class="sh-banner">
      <div class="sh-banner-text">
        <h1>{{ greeting }}，{{ account }} 👋</h1>
        <p>今天想吃点什么？让「食光」替你挑一家好店。</p>
      </div>
      <div class="sh-banner-emoji">🍱</div>
    </section>

    <!-- 推荐美食（首页固定展示 12 家） -->
    <section class="sh-block">
      <div class="sh-block-head">
        <h2>🔥 推荐美食</h2>
        <span class="sh-count">{{ loading ? '加载中…' : list.length + ' 家推荐' }}</span>
      </div>

      <!-- 加载态 -->
      <div v-if="loading" class="sh-state">
        <span class="sh-spinner"></span> 正在为你寻找好店…
      </div>

      <!-- 空态 -->
      <div v-else-if="list.length === 0" class="sh-state is-empty">
        😶 暂时没有推荐餐厅，去美食页看看其它好店吧～
      </div>

      <!-- 列表 -->
      <div v-else class="sh-grid">
        <article class="sh-tile is-click card" v-for="r in list" :key="r.id || r.name" @click="openDetail(r)">
          <div class="card-top">
            <span class="card-emoji">{{ r.emoji }}</span>
            <span class="card-rating">⭐ {{ r.rating }}</span>
          </div>
          <h3 class="card-name">{{ r.name }}</h3>
          <p class="card-desc">{{ r.desc }}</p>
          <div class="card-tags">
            <span class="tag" v-for="t in r.tags" :key="t">{{ t }}</span>
          </div>
          <div class="card-foot">
            <span class="dist">📍 {{ r.distance }}</span>
            <button class="order-btn" @click.stop="onOrder(r)">下单</button>
          </div>
        </article>
      </div>
    </section>

    <!-- 进入美食页面（其余全部店铺，按分类） -->
    <section class="food-cta" @click="goFood">
      <div class="cta-text">
        <h3>🍽️ 发现更多好店</h3>
        <p>全部美食按分类整理，面食、快餐、甜点、饮品、轻食、火锅一网打尽。</p>
      </div>
      <span class="cta-arrow">查看全部美食 →</span>
    </section>

    <footer class="sh-foot">食光 · 美食 — 发现身边的每一口好味道 🌿</footer>

    <!-- 底部导航栏（移动端主导航） -->
    <AppTabbar :items="bottomNav" :active="activeNav" @select="handleNav" />
  </div>

  <div class="sh-toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
</template>

<style scoped>
/* 卡片内部排版（外框尺寸由全局 .sh-tile 统一提供） */
.card-top { display: flex; align-items: center; justify-content: space-between; }
.card-emoji {
  width: 46px; height: 46px; border-radius: 13px;
  background: linear-gradient(135deg, rgba(0,184,148,0.15), rgba(0,206,201,0.15));
  display: grid; place-items: center; font-size: 26px;
}
.card-rating { font-size: 13px; font-weight: 800; color: #f39c12; }
.card-name { font-size: 15px; font-weight: 800; margin-top: 10px; color: var(--ink); }
.card-desc { font-size: 12px; color: var(--muted); margin-top: 4px; line-height: 1.6; }
.card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.tag { font-size: 11px; color: var(--deep); background: rgba(0,184,148,0.1); padding: 3px 9px; border-radius: 8px; }
.card-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
.dist { font-size: 12px; color: var(--muted); }
.order-btn {
  border: none; cursor: pointer; padding: 7px 16px; border-radius: 10px;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff; font-weight: 800; font-size: 13px; font-family: inherit;
  box-shadow: 0 6px 14px rgba(0, 150, 136, 0.35);
  transition: transform 0.15s, box-shadow 0.15s;
}
.order-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 9px 18px rgba(0, 150, 136, 0.5); }
.order-btn:active:not(:disabled) { transform: translateY(0); }
.order-btn:disabled { opacity: 0.65; cursor: default; }

/* 进入美食页 CTA */
.food-cta {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(224,247,246,0.95));
  border: 1px solid rgba(0,184,148,0.25);
  border-radius: 20px; padding: 18px 20px; cursor: pointer;
  box-shadow: 0 10px 26px rgba(0,150,136,0.16);
  transition: transform 0.15s, box-shadow 0.15s;
}
.food-cta:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(0,150,136,0.24); }
.cta-text h3 { font-size: 16px; font-weight: 900; color: var(--deep); }
.cta-text p { margin-top: 6px; font-size: 12px; color: var(--muted); line-height: 1.6; }
.cta-arrow {
  flex: none; font-size: 13px; font-weight: 800; color: #fff;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  padding: 10px 16px; border-radius: 12px; white-space: nowrap;
  box-shadow: 0 6px 14px rgba(0,150,136,0.35);
}

@media (max-width: 520px) {
  .food-cta { padding: 16px; border-radius: 18px; }
  .cta-arrow { padding: 9px 12px; font-size: 12px; }
}
</style>
