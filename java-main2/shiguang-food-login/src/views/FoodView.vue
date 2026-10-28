<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { session, clearSession } from '../store.js'
import { getFoodList, getCategories, MOCK_CATEGORIES } from '../api/food.js'

const router = useRouter()
const route = useRoute()

const account = computed(() => session.account || '美食家')

// ---------- 导航栏 ----------
const navItems = [
  { key: 'home', label: '首页', icon: '🏠' },
  { key: 'food', label: '美食', icon: '🍽️' },
  { key: 'order', label: '订单', icon: '🧾' },
  { key: 'mine', label: '我的', icon: '👤' }
]
const activeNav = ref('food')

function onNav(item) {
  if (item.key === 'food') {
    activeNav.value = 'food'
    return
  }
  if (item.key === 'home') {
    router.push('/home')
    return
  }
  if (item.key === 'order') {
    router.push('/orders')
    return
  }
  showToast(`「${item.label}」页面开发中，敬请期待 🚧`)
}

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

// ---------- 退出登录 ----------
function logout() {
  clearSession()
  router.push('/login')
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
  <div class="food">
    <!-- 顶部导航栏 -->
    <header class="topbar">
      <div class="brand">
        <span class="brand-logo">🍜</span>
        <span class="brand-name">食光 · 美食</span>
      </div>
      <div class="user">
        <div class="avatar">{{ account.charAt(0).toUpperCase() }}</div>
        <span class="uname">{{ account }}</span>
        <button class="logout" @click="logout">退出</button>
      </div>
    </header>

    <!-- 顶部横向导航（桌面端显示） -->
    <nav class="nav">
      <button
        v-for="item in navItems"
        :key="item.key"
        class="nav-item"
        :class="{ active: activeNav === item.key }"
        @click="onNav(item)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </button>
    </nav>

    <!-- 页面标题 -->
    <section class="page-head">
      <button class="back" @click="router.push('/home')">← 首页</button>
      <h1>🍽️ 美食 · 全部好店</h1>
      <p>这里收录了推荐之外的全部美食，按口味分类，慢慢挑。</p>
    </section>

    <!-- 搜索栏 -->
    <div class="search">
      <span class="s-icon">🔍</span>
      <input
        type="text"
        v-model="keyword"
        @input="onInput"
        @keyup.enter="onSearch"
        placeholder="在美食页内搜索店名、菜品或口味…"
      />
      <button v-if="keyword" class="s-clear" @click="clearSearch" title="清空">✕</button>
      <button class="s-btn" @click="onSearch">搜索</button>
    </div>

    <!-- 分类筛选 -->
    <nav class="cats">
      <button
        v-for="c in categories"
        :key="c"
        class="chip"
        :class="{ active: activeCat === c }"
        @click="pickCat(c)"
      >
        {{ c }}
      </button>
    </nav>

    <!-- 店铺列表 -->
    <section class="block">
      <div class="block-head">
        <h2>{{ activeCat === '全部' ? '全部美食' : activeCat + ' · 精选' }}</h2>
        <span class="count">{{ loading ? '加载中…' : restaurants.length + ' 家' }}</span>
      </div>

      <!-- 加载态 -->
      <div v-if="loading" class="state">
        <span class="spinner"></span> 正在为你寻找好店…
      </div>

      <!-- 空态 -->
      <div v-else-if="restaurants.length === 0" class="state empty">
        😶 这个分类下暂时没有店铺，换个分类或关键字试试～
      </div>

      <!-- 列表 -->
      <div v-else class="grid">
        <article class="card" v-for="r in restaurants" :key="r.id || r.name" @click="openDetail(r)">
          <div class="card-top">
            <span class="card-emoji">{{ r.emoji }}</span>
            <span class="card-rating">⭐ {{ r.rating }}</span>
          </div>
          <h3 class="card-name">{{ r.name }}</h3>
          <span class="cat-badge">{{ r.cat }}</span>
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

    <footer class="foot">食光 · 美食 — 发现身边的每一口好味道 🌿</footer>

    <!-- 底部导航栏 -->
    <nav class="tabbar">
      <button
        v-for="item in navItems"
        :key="item.key"
        class="tab"
        :class="{ active: activeNav === item.key }"
        @click="onNav(item)"
      >
        <span class="tab-icon">{{ item.icon }}</span>
        <span class="tab-label">{{ item.label }}</span>
      </button>
    </nav>
  </div>

  <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
</template>

<style scoped>
.food {
  color: var(--ink);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 24px;
}

/* 顶部导航栏 */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(14px);
  border-radius: 18px;
  box-shadow: var(--shadow);
  border: 1px solid rgba(255, 255, 255, 0.6);
}
.brand { display: flex; align-items: center; gap: 10px; }
.brand-logo {
  width: 38px; height: 38px; border-radius: 11px;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  display: grid; place-items: center; font-size: 20px;
}
.brand-name { font-weight: 900; font-size: 17px; letter-spacing: 1px; color: var(--deep); }
.user { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: linear-gradient(135deg, var(--mint), var(--cyan));
  color: #fff; font-weight: 800; display: grid; place-items: center;
}
.uname { font-size: 15px; font-weight: 600; color: var(--deep); max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.logout {
  border: none; cursor: pointer; padding: 7px 14px; border-radius: 10px;
  background: rgba(0, 184, 148, 0.12); color: var(--deep); font-weight: 700; font-size: 13px;
  transition: background 0.15s;
}
.logout:hover { background: rgba(0, 184, 148, 0.25); }

/* 顶部横向导航（与首页一致） */
.nav {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 8px 22px rgba(0, 150, 136, 0.14);
}
.nav-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: none;
  background: transparent;
  color: var(--muted);
  padding: 10px 6px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}
.nav-item .nav-icon { font-size: 17px; }
.nav-item:hover { background: rgba(0, 184, 148, 0.12); color: var(--deep); }
.nav-item.active {
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff;
  box-shadow: 0 6px 16px rgba(0, 150, 136, 0.4);
}

/* 页面标题 */
.page-head { padding: 4px 4px 0; }
.page-head .back {
  border: none; background: transparent; cursor: pointer;
  color: var(--deep); font-weight: 800; font-size: 13px; padding: 0; margin-bottom: 6px;
}
.page-head h1 { font-size: 22px; font-weight: 900; color: var(--deep); }
.page-head p { margin-top: 6px; font-size: 13px; color: var(--muted); }

/* 搜索栏 */
.search {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.92);
  padding: 10px 12px 10px 16px;
  border-radius: 16px;
  box-shadow: 0 8px 22px rgba(0, 150, 136, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.6);
}
.search .s-icon { font-size: 16px; flex: none; }
.search input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--ink);
  font-family: inherit;
}
.search .s-clear {
  flex: none;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  color: var(--muted);
  width: 24px; height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
}
.search .s-clear:hover { background: rgba(0, 0, 0, 0.12); }
.search .s-btn {
  flex: none;
  border: none;
  cursor: pointer;
  padding: 9px 18px;
  border-radius: 11px;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  box-shadow: 0 6px 14px rgba(0, 150, 136, 0.35);
  transition: transform 0.15s, box-shadow 0.15s;
}
.search .s-btn:hover { transform: translateY(-1px); box-shadow: 0 9px 18px rgba(0, 150, 136, 0.5); }
.search .s-btn:active { transform: translateY(0); }

/* 分类 */
.cats { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 2px; }
.chip {
  flex: none; border: 1px solid var(--line); background: rgba(255,255,255,0.7);
  color: var(--deep); padding: 8px 16px; border-radius: 999px; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.chip:hover { background: rgba(0, 184, 148, 0.12); }
.chip.active {
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff; border-color: transparent; box-shadow: 0 6px 16px rgba(0,150,136,0.4);
}

/* 区块 */
.block { background: rgba(255,255,255,0.86); backdrop-filter: blur(8px); border-radius: 22px; padding: 18px; box-shadow: 0 10px 26px rgba(0,150,136,0.16); border: 1px solid rgba(255,255,255,0.6); }
.block-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
.block-head h2 { font-size: 17px; font-weight: 900; color: var(--deep); }
.count { font-size: 12px; color: var(--muted); }

/* 加载 / 空态 */
.state { text-align: center; padding: 30px 10px; font-size: 13px; color: var(--muted); }
.state.empty { color: var(--deep); }
.spinner {
  display: inline-block;
  width: 16px; height: 16px;
  border: 3px solid rgba(0, 150, 136, 0.25);
  border-top-color: var(--teal);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  vertical-align: -3px;
  margin-right: 6px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 推荐网格 */
.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.card {
  background: #fff; border-radius: 16px; padding: 14px; border: 1px solid var(--line);
  transition: transform 0.15s, box-shadow 0.15s; cursor: pointer;
}
.card:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(0,150,136,0.22); }
.card-top { display: flex; align-items: center; justify-content: space-between; }
.card-emoji {
  width: 46px; height: 46px; border-radius: 13px;
  background: linear-gradient(135deg, rgba(0,184,148,0.15), rgba(0,206,201,0.15));
  display: grid; place-items: center; font-size: 26px;
}
.card-rating { font-size: 13px; font-weight: 800; color: #f39c12; }
.card-name { font-size: 15px; font-weight: 800; margin-top: 10px; color: var(--ink); }
.cat-badge {
  display: inline-block; margin-top: 6px; font-size: 11px; font-weight: 800;
  color: var(--deep); background: rgba(0,184,148,0.12); padding: 3px 10px; border-radius: 999px;
}
.card-desc { font-size: 12px; color: var(--muted); margin-top: 8px; line-height: 1.6; }
.card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.tag { font-size: 11px; color: var(--deep); background: rgba(0,184,148,0.1); padding: 3px 9px; border-radius: 8px; }
.card-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
.dist { font-size: 12px; color: var(--muted); }
.order-btn {
  border: none; cursor: pointer; padding: 7px 16px; border-radius: 10px;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff; font-weight: 800; font-size: 13px;
  box-shadow: 0 6px 14px rgba(0, 150, 136, 0.35);
  transition: transform 0.15s, box-shadow 0.15s;
}
.order-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 9px 18px rgba(0, 150, 136, 0.5); }
.order-btn:active:not(:disabled) { transform: translateY(0); }
.order-btn:disabled { opacity: 0.65; cursor: default; }

.foot { text-align: center; font-size: 12px; color: rgba(255,255,255,0.9); text-shadow: 0 2px 8px rgba(0,80,70,0.3); margin-top: 8px; }

/* 底部导航栏 */
.tabbar {
  position: fixed;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 36px);
  max-width: 1064px;
  display: flex;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 20px;
  padding: 8px;
  box-shadow: 0 12px 30px rgba(0, 150, 136, 0.28);
  z-index: 30;
}
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  border: none;
  background: transparent;
  color: var(--muted);
  padding: 6px 4px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-icon { font-size: 20px; }
.tab-label { font-size: 11px; font-weight: 700; }
.tab:hover { background: rgba(0, 184, 148, 0.12); color: var(--deep); }
.tab.active {
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff;
  box-shadow: 0 6px 14px rgba(0, 150, 136, 0.4);
}

/* 轻提示 */
.toast {
  position: fixed;
  top: 28px;
  left: 50%;
  transform: translateX(-50%) translateY(-20px) scale(0.95);
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff;
  padding: 14px 26px;
  border-radius: 14px;
  font-weight: 700;
  box-shadow: 0 10px 30px rgba(0, 150, 136, 0.45);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s, transform 0.3s;
  z-index: 999;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }

@media (max-width: 600px) {
  .nav { display: none; }
  .food { padding-bottom: 92px; }
  .grid { grid-template-columns: 1fr; }
  .page-head h1 { font-size: 19px; }
}
@media (min-width: 601px) {
  .tabbar { display: none; }
}
</style>
