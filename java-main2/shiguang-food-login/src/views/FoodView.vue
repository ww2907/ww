<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getFoodList, getCategories, sortRestaurants, MOCK_CATEGORIES } from '../api/food.js'
import { getSearchSuggestions } from '../api/restaurant.js'
import { useShellNav } from '../composables/useShellNav.js'
import { toast } from '../composables/useToast.js'
import AppHeader from '../components/layout/AppHeader.vue'
import AppNav from '../components/layout/AppNav.vue'
import AppSearch from '../components/layout/AppSearch.vue'
import AppTabbar from '../components/layout/AppTabbar.vue'
import EmptyState from '../components/EmptyState.vue'

const router = useRouter()
const route = useRoute()

// 顶部/底部导航、后台入口、退出登录：与首页同一套逻辑与尺寸
const { topNav, bottomNav, activeNav, account, setActive, onNav, goAdmin, logout } = useShellNav('food')
setActive('food')

// ---------- 搜索 + 分类筛选 + 排序 ----------
const keyword = ref(route.query.keyword ? String(route.query.keyword) : '')
const loading = ref(false)
let searchTimer = null
let suggestTimer = null

const categories = ref(MOCK_CATEGORIES)
const activeCat = ref('全部')
const sortBy = ref('default') // default | distance | price
const sortOptions = [
  { key: 'default', label: '综合推荐' },
  { key: 'distance', label: '距离最近' },
  { key: 'price', label: '人均最低' }
]

const restaurants = ref([])

// 排序统一交给 api/food.js 的 sortRestaurants（与后端 applySort 同口径）：
// 真实模式下后端已排好序，这里再算一遍结果不变，保证 mock/真实两种模式表现一致。
const sorted = computed(() => sortRestaurants(restaurants.value, sortBy.value, 'asc'))

async function loadList() {
  loading.value = true
  try {
    const data = await getFoodList({
      keyword: keyword.value,
      category: activeCat.value,
      sort: sortBy.value,
      order: 'asc'
    })
    restaurants.value = Array.isArray(data) ? data : []
  } catch (e) {
    toast(e.message || '加载失败，请稍后重试', 'error')
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
  clearTimeout(suggestTimer)
  suggestTimer = setTimeout(fetchSuggest, 220)
}
function clearSearch() {
  keyword.value = ''
  clearTimeout(searchTimer)
  clearTimeout(suggestTimer)
  suggestions.value = []
  loadList()
}
function pickCat(c) {
  activeCat.value = c
  loadList()
}
function changeSort(key) {
  if (sortBy.value === key) return
  sortBy.value = key
  // 排序下推到后端（sort/order 参数），前端 sorted 再做同口径兜底，
  // 这样真实模式下排序由数据库侧完成，数据量大时也不会只排当前页。
  loadList()
}

// ---------- 实时联想 ----------
const suggestions = ref([])
const loadingSuggest = ref(false)
async function fetchSuggest() {
  const k = keyword.value.trim()
  if (!k) {
    suggestions.value = []
    return
  }
  loadingSuggest.value = true
  try {
    suggestions.value = await getSearchSuggestions(k, 8)
  } catch (e) {
    suggestions.value = []
  } finally {
    loadingSuggest.value = false
  }
}
function onSelectSuggestion(s) {
  // 店铺 / 菜品都跳转到对应店铺详情（菜品归属店铺）
  router.push('/restaurant/' + s.id)
}

// ---------- 点击进入店铺详情 ----------
function openDetail(r) {
  router.push('/restaurant/' + (r.id || r.name))
}
function onOrder(r) {
  router.push('/restaurant/' + (r.id || r.name))
}

// ---------- 导航点击：未开发入口给出提示 ----------
function handleNav(item) {
  if (!onNav(item)) toast(`「${item.label}」页面开发中，敬请期待 🚧`)
}

onMounted(() => {
  loadList()
  getCategories()
    .then((c) => {
      if (Array.isArray(c) && c.length) categories.value = c
    })
    .catch(() => {})
  if (keyword.value.trim()) fetchSuggest()
})
onUnmounted(() => {
  clearTimeout(searchTimer)
  clearTimeout(suggestTimer)
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
      :suggestions="suggestions"
      :loading-suggest="loadingSuggest"
      placeholder="在美食页内搜索店名、菜品或口味…"
      hint="🔎 输入关键字即时联想，也能与分类 / 排序叠加使用。"
      @input="onInput"
      @search="onSearch"
      @clear="clearSearch"
      @select-suggestion="onSelectSuggestion"
    />

    <!-- 页面标题横幅（与首页欢迎横幅同一尺寸） -->
    <section class="sh-banner">
      <div class="sh-banner-text">
        <h1>🍽️ 美食 · 全部好店</h1>
        <p>这里收录了推荐之外的全部美食，按口味分类，慢慢挑。</p>
      </div>
      <div class="sh-banner-emoji">🍜</div>
    </section>

    <!-- 分类筛选 + 排序 -->
    <div class="toolbar">
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
      <div class="sort-group">
        <button
          v-for="s in sortOptions"
          :key="s.key"
          class="sort-btn"
          :class="{ active: sortBy === s.key }"
          @click="changeSort(s.key)"
        >{{ s.label }}</button>
      </div>
    </div>

    <!-- 店铺列表 -->
    <section class="sh-block">
      <div class="sh-block-head">
        <h2>{{ activeCat === '全部' ? '全部美食' : activeCat + ' · 精选' }}</h2>
        <span class="sh-count">{{ loading ? '加载中…' : sorted.length + ' 家' }}</span>
      </div>

      <!-- 加载态 -->
      <div v-if="loading" class="sh-state">
        <span class="sh-spinner"></span> 正在为你寻找好店…
      </div>

      <!-- 搜索无结果空态 -->
      <div v-else-if="sorted.length === 0 && keyword.trim()">
        <EmptyState type="search" title="没有找到相关店铺" :desc="`没有找到「${keyword.trim()}」相关的店铺或菜品，换个关键词，或清除搜索 / 切换分类再试试～`" />
      </div>

      <!-- 分类空态 -->
      <div v-else-if="sorted.length === 0">
        <EmptyState type="food" title="这个分类暂时空空如也" desc="换个分类或搜索关键字，发现更多好店～" />
      </div>

      <!-- 列表 -->
      <div v-else class="sh-grid">
        <article class="sh-tile is-click card" v-for="r in sorted" :key="r.id || r.name" :class="{ closed: r.openStatus === 0 }" @click="openDetail(r)">
          <div class="card-top">
            <span class="card-emoji">{{ r.emoji }}</span>
            <span class="card-rating">⭐ {{ r.rating }}</span>
          </div>
          <div class="card-title-row">
            <h3 class="card-name">{{ r.name }}</h3>
            <span class="cat-badge">{{ r.cat }}</span>
            <span class="open-badge" :class="r.openStatus === 0 ? 'closed' : 'open'">{{ r.openStatus === 0 ? '已打烊' : '营业中' }}</span>
          </div>
          <p class="card-desc">{{ r.desc }}</p>
          <div class="card-tags">
            <span class="tag" v-for="t in r.tags" :key="t">{{ t }}</span>
          </div>
          <div class="card-foot">
            <span class="dist">📍 {{ r.distance }}</span>
            <span class="price">💰 人均 ¥{{ r.price }}</span>
          </div>
          <div class="card-meta">
            <span class="meta-item">起送 ¥{{ r.minOrder }}</span>
            <span class="meta-dot">·</span>
            <span class="meta-item">配送 ¥{{ r.deliveryFee }}</span>
            <span class="meta-dot">·</span>
            <span class="meta-item">🕒 {{ r.eta }}</span>
          </div>
          <div class="card-foot card-foot-2">
            <span class="dist dim">👥 进店点餐</span>
            <button class="order-btn" :disabled="r.openStatus === 0" @click.stop="onOrder(r)">{{ r.openStatus === 0 ? '已打烊' : '去点餐' }}</button>
          </div>
        </article>
      </div>
    </section>

    <footer class="sh-foot">食光 · 美食 — 发现身边的每一口好味道 🌿</footer>

    <!-- 底部导航栏（移动端主导航） -->
    <AppTabbar :items="bottomNav" :active="activeNav" @select="handleNav" />
  </div>
</template>

<style scoped>
/* 工具栏：分类胶囊 + 排序 */
.toolbar { display: flex; flex-direction: column; gap: 10px; }
.sort-group { display: flex; gap: 8px; flex-wrap: wrap; }
.sort-btn {
  border: 1px solid var(--line); background: rgba(255,255,255,0.7);
  color: var(--deep); padding: 7px 14px; border-radius: 999px;
  font-size: 12px; font-weight: 700; font-family: inherit; cursor: pointer;
  transition: all 0.15s;
}
.sort-btn:hover { background: rgba(0,184,148,0.12); }
.sort-btn.active {
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff; border-color: transparent; box-shadow: 0 6px 16px rgba(0,150,136,0.4);
}

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
.open-badge { flex: none; font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 999px; }
.open-badge.open { background: rgba(0, 184, 148, 0.14); color: var(--deep); }
.open-badge.closed { background: rgba(120, 120, 120, 0.16); color: #888; }
.card-desc { font-size: 12px; color: var(--muted); margin-top: 4px; line-height: 1.6; }
.card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.tag { font-size: 11px; color: var(--deep); background: rgba(0,184,148,0.1); padding: 3px 9px; border-radius: 8px; }
.card-meta { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 11px; color: var(--muted); flex-wrap: wrap; }
.meta-item { font-weight: 700; }
.meta-dot { opacity: 0.5; }
.card-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
.card-foot-2 { margin-top: 8px; }
.dist { font-size: 12px; color: var(--muted); }
.dist.dim { opacity: 0.75; }
.card.closed .card-emoji { filter: grayscale(0.8); opacity: 0.6; }
.card.closed .card-name, .card.closed .card-desc { opacity: 0.55; }
.price { font-size: 12px; font-weight: 800; color: #e8730c; }
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
