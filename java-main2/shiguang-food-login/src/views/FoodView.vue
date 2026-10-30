<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getFoodList, getCategories, MOCK_CATEGORIES } from '../api/food.js'
import { useShellNav } from '../composables/useShellNav.js'
import AppHeader from '../components/layout/AppHeader.vue'
import AppNav from '../components/layout/AppNav.vue'
import AppSearch from '../components/layout/AppSearch.vue'
import AppTabbar from '../components/layout/AppTabbar.vue'

const router = useRouter()
const route = useRoute()

// 顶部/底部导航、后台入口、退出登录：与首页同一套逻辑与尺寸
const { topNav, bottomNav, activeNav, account, setActive, onNav, goAdmin, logout } = useShellNav('food')
setActive('food')

// ---------- 搜索 + 分类筛选 ----------
const keyword = ref(route.query.keyword ? String(route.query.keyword) : '')
const loading = ref(false)
let searchTimer = null

const categories = ref(MOCK_CATEGORIES)
const activeCat = ref('全部')

const restaurants = ref([])

async function loadList() {
  loading.value = true
  try {
    const data = await getFoodList({
      keyword: keyword.value,
      category: activeCat.value
    })
    restaurants.value = Array.isArray(data) ? data : []
  } catch (e) {
    showToast(e.message || '加载失败，请稍后重试')
    restaurants.value = []
  } finally {
    loading.value = false
  }
}

function onSearch() {
  loadList()
}
function onInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(loadList, 300)
}
function clearSearch() {
  keyword.value = ''
  clearTimeout(searchTimer)
  loadList()
}
function pickCat(c) {
  activeCat.value = c
  loadList()
}

// ---------- 下单：跳转到该店铺的点餐页 ----------
function openDetail(r) {
  router.push('/restaurant/' + (r.id || r.name))
}
function onOrder(r) {
  router.push('/order/' + (r.id || r.name))
}

// ---------- 导航点击：未开发入口给出提示 ----------
function handleNav(item) {
  if (!onNav(item)) showToast(`「${item.label}」页面开发中，敬请期待 🚧`)
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

onMounted(() => {
  loadList()
  getCategories()
    .then((c) => {
      if (Array.isArray(c) && c.length) categories.value = c
    })
    .catch(() => {})
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
      placeholder="在美食页内搜索店名、菜品或口味…"
      hint="🔎 输入关键字即时筛选下方店铺，也能与上方分类叠加使用。"
      @input="onInput"
      @search="onSearch"
      @clear="clearSearch"
    />

    <!-- 页面标题横幅（与首页欢迎横幅同一尺寸） -->
    <section class="sh-banner">
      <div class="sh-banner-text">
        <h1>🍽️ 美食 · 全部好店</h1>
        <p>这里收录了推荐之外的全部美食，按口味分类，慢慢挑。</p>
      </div>
      <div class="sh-banner-emoji">🍜</div>
    </section>

    <!-- 分类筛选 -->
    <nav class="sh-chips">
      <button
        v-for="c in categories"
        :key="c"
        class="sh-chip"
        :class="{ active: activeCat === c }"
        @click="pickCat(c)"
      >
        {{ c }}
      </button>
    </nav>

    <!-- 店铺列表 -->
    <section class="sh-block">
      <div class="sh-block-head">
        <h2>{{ activeCat === '全部' ? '全部美食' : activeCat + ' · 精选' }}</h2>
        <span class="sh-count">{{ loading ? '加载中…' : restaurants.length + ' 家' }}</span>
      </div>

      <!-- 加载态 -->
      <div v-if="loading" class="sh-state">
        <span class="sh-spinner"></span> 正在为你寻找好店…
      </div>

      <!-- 空态 -->
      <div v-else-if="restaurants.length === 0" class="sh-state is-empty">
        😶 这个分类下暂时没有店铺，换个分类或关键字试试～
      </div>

      <!-- 列表 -->
      <div v-else class="sh-grid">
        <article class="sh-tile is-click card" v-for="r in restaurants" :key="r.id || r.name" @click="openDetail(r)">
          <div class="card-top">
            <span class="card-emoji">{{ r.emoji }}</span>
            <span class="card-rating">⭐ {{ r.rating }}</span>
          </div>
          <div class="card-title-row">
            <h3 class="card-name">{{ r.name }}</h3>
            <span class="cat-badge">{{ r.cat }}</span>
          </div>
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
/* 店名与分类同排，卡片高度与首页推荐卡保持一致 */
.card-title-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.card-title-row .card-name { margin-top: 0; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-name { font-size: 15px; font-weight: 800; color: var(--ink); }
.cat-badge {
  flex: none; display: inline-block; font-size: 11px; font-weight: 800;
  color: var(--deep); background: rgba(0,184,148,0.12); padding: 3px 10px; border-radius: 999px;
}
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
</style>
