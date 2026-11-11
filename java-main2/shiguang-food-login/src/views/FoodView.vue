<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getFoodList, getCategoryTree, sortRestaurants } from '../api/food.js'
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
const { topNav, bottomNav, activeNav, account, setActive, onNav, showAdmin, goAdmin, logout } = useShellNav('food')
setActive('food')

// ---------- 搜索 + 分类筛选 + 排序 ----------
const keyword = ref(route.query.keyword ? String(route.query.keyword) : '')
const loading = ref(false)
let searchTimer = null
let suggestTimer = null

// ---------- 分级分类（三级：美食 → 业态 → 品类）----------
// 筛选口径由 categoryId 驱动：后端拿到 id 后按物化路径命中整棵子树，
// 所以选中「面食」会同时包含汤面/拌面/馄饨抄手/粥粉小食下的店。
const catTree = ref([])
const activeL2 = ref(null) // 二级业态 id，null = 全部
const activeL3 = ref(null) // 三级品类 id，null = 该业态全部
const loadingCat = ref(false)

// 树根通常只有一个「美食」，二级业态全部平铺出来（多根时也一并展开）
const level2List = computed(() => (catTree.value || []).flatMap((n) => n.children || []))
const activeL2Node = computed(() => level2List.value.find((n) => n.id === activeL2.value) || null)
const level3List = computed(() => activeL2Node.value?.children || [])
// 三级优先，其次二级，都没有就是「全部」
const activeCatId = computed(() => activeL3.value ?? activeL2.value ?? null)

const activeCatName = computed(() => {
  if (activeL3.value != null) {
    const hit = level3List.value.find((n) => n.id === activeL3.value)
    if (hit) return hit.name
  }
  return activeL2Node.value ? activeL2Node.value.name : ''
})
const listTitle = computed(() => (activeCatName.value ? activeCatName.value + ' · 精选' : '全部美食'))

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
      categoryId: activeCatId.value,
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

// 点「全部」：回到不限分类
function pickAll() {
  if (activeL2.value === null && activeL3.value === null) return
  activeL2.value = null
  activeL3.value = null
  loadList()
}
// 点业态：切换二级，三级自动回到「本类全部」
function pickL2(node) {
  const id = node == null ? null : node.id
  if (activeL2.value === id && activeL3.value === null) return
  activeL2.value = id
  activeL3.value = null
  loadList()
}
// 点品类：同一品类再点一次取消，回到所属业态全部
function pickL3(node) {
  const id = node == null ? null : node.id
  if (activeL3.value === id) return
  activeL3.value = id
  loadList()
}
function changeSort(key) {
  if (sortBy.value === key) return
  sortBy.value = key
  // 排序下推到后端（sort/order 参数），前端 sorted 再做同口径兜底，
  // 这样真实模式下排序由数据库侧完成，数据量大时也不会只排当前页。
  loadList()
}

// 深链支持：/food?categoryId=8 直接定位到对应节点（三级优先，其次二级）
function applyRouteCategory() {
  const raw = route.query.categoryId
  if (raw == null || raw === '') return false
  const id = Number(raw)
  if (!id) return false
  for (const l2 of level2List.value) {
    if (l2.id === id) {
      activeL2.value = l2.id
      activeL3.value = null
      return true
    }
    const l3 = (l2.children || []).find((n) => n.id === id)
    if (l3) {
      activeL2.value = l2.id
      activeL3.value = l3.id
      return true
    }
  }
  return false
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

onMounted(async () => {
  loadList()
  if (keyword.value.trim()) fetchSuggest()
  // 分类树先拉：深链参数要等树到了才能定位，定位成功就按该分类重查一次
  loadingCat.value = true
  try {
    const tree = await getCategoryTree()
    catTree.value = Array.isArray(tree) ? tree : []
    if (applyRouteCategory()) loadList()
  } catch (e) {
    catTree.value = []
  } finally {
    loadingCat.value = false
  }
})
onUnmounted(() => {
  clearTimeout(searchTimer)
  clearTimeout(suggestTimer)
})

// 同一页面内被导航到别的分类时（如首页跳 /food?categoryId=12），同步切筛选
watch(
  () => route.query.categoryId,
  () => {
    if (applyRouteCategory()) loadList()
  }
)
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
        <p>先挑业态，再挑品类，越点越准；也能和关键字、排序叠加使用。</p>
      </div>
      <div class="sh-banner-emoji">🍜</div>
    </section>

    <!-- 分类筛选（二级业态 tab + 三级品类 chip）+ 排序 -->
    <div class="toolbar">
      <div class="cat-panel">
        <nav v-if="!loadingCat || level2List.length" class="cat-tabs" aria-label="业态分类">
          <button class="cat-tab" :class="{ active: activeL2 === null }" @click="pickAll">
            <span class="cat-ico">🍴</span>全部
          </button>
          <button
            v-for="n in level2List"
            :key="n.id"
            class="cat-tab"
            :class="{ active: activeL2 === n.id }"
            @click="pickL2(n)"
          >
            <span class="cat-ico">{{ n.icon || '🍽️' }}</span>{{ n.name }}
          </button>
        </nav>
        <div v-else class="cat-loading"><span class="sh-spinner"></span> 正在加载分类…</div>

        <!-- 三级品类：只有选中某个业态且该业态有子品类时才出现 -->
        <div v-if="level3List.length" class="cat-sub">
          <button
            class="cat-sub-chip"
            :class="{ active: activeL3 === null }"
            @click="pickL3(null)"
          >本类全部</button>
          <button
            v-for="n in level3List"
            :key="n.id"
            class="cat-sub-chip"
            :class="{ active: activeL3 === n.id }"
            @click="pickL3(n)"
          >{{ n.name }}</button>
        </div>
      </div>

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
        <h2>{{ listTitle }}</h2>
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
/* 工具栏：分级分类面板 + 排序 */
.toolbar { display: flex; flex-direction: column; gap: 10px; }

/* 分级分类面板：一级业态 tab + 二级品类 chip */
.cat-panel {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 10px 12px;
  backdrop-filter: blur(6px);
}
.cat-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
.cat-tabs::-webkit-scrollbar { display: none; }
.cat-tab {
  flex: none; display: inline-flex; align-items: center; gap: 5px;
  border: 1px solid var(--line); background: #fff;
  color: var(--deep); padding: 8px 15px; border-radius: 999px;
  font-size: 13px; font-weight: 800; font-family: inherit; cursor: pointer;
  white-space: nowrap; transition: all 0.15s;
}
.cat-tab:hover { background: rgba(0, 184, 148, 0.12); }
.cat-tab.active {
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff; border-color: transparent; box-shadow: 0 6px 16px rgba(0, 150, 136, 0.4);
}
.cat-ico { font-size: 14px; line-height: 1; }
.cat-loading { font-size: 12px; color: var(--muted); padding: 6px 2px; }

/* 窄屏：业态 tab 换行铺满，避免横向滚动藏起一半分类 */
@media (max-width: 560px) {
  .cat-tabs { flex-wrap: wrap; overflow-x: visible; }
  .cat-tab { padding: 7px 12px; font-size: 12px; }
  .cat-sub-chip { padding: 5px 10px; }
}

/* 三级品类：从属于上方业态，视觉上弱一级 */
.cat-sub {
  display: flex; flex-wrap: wrap; gap: 6px;
  margin-top: 9px; padding-top: 9px;
  border-top: 1px dashed rgba(0, 150, 136, 0.22);
}
.cat-sub-chip {
  border: 1px solid transparent; background: rgba(0, 184, 148, 0.09);
  color: var(--deep); padding: 5px 12px; border-radius: 9px;
  font-size: 12px; font-weight: 700; font-family: inherit; cursor: pointer;
  transition: all 0.15s;
}
.cat-sub-chip:hover { background: rgba(0, 184, 148, 0.2); }
.cat-sub-chip.active {
  background: rgba(0, 184, 148, 0.95); color: #fff;
  box-shadow: 0 4px 12px rgba(0, 150, 136, 0.32);
}

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
