<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRestaurantDetail } from '../api/restaurant.js'
import { createDirectOrder } from '../api/order.js'
import { buyNow } from '../store/buyNow.js'
import { session } from '../store.js'
import { getAddresses, initProfileForAccount, loadAddresses } from '../store/profile.js'
import { toast } from '../composables/useToast.js'
import { useShellNav } from '../composables/useShellNav.js'
import AppHeader from '../components/layout/AppHeader.vue'
import AddressManageModal from '../components/AddressManageModal.vue'
import DishPopup from '../components/DishPopup.vue'

// ============================================================
// 「立即下单」页（不经过购物车）
// ------------------------------------------------------------
// 入口：
//   - 首页推荐卡片 / 美食页「下单」→ /buy/:id
//   - 店铺页菜品弹窗「立即下单」→ 带着这道菜进本页
// 特点：
//   - 选菜默认走 store/buyNow.js 的「本单草稿」；弹窗里也可「加入购物车」（store/cart.js）
//   - 提交走 POST /api/orders/direct，金额由后端按菜品表核价；购物车菜品不受影响
// ============================================================

const route = useRoute()
const router = useRouter()
const { account, showAdmin, goAdmin, logout } = useShellNav('home')

const rid = computed(() => route.params.id)
const store = ref(null)
const loading = ref(true)
const errMsg = ref('')
const submitting = ref(false)

// 本单（直购草稿）的条目 / 件数 / 合计
const { items, totalCount, totalPrice } = buyNow.useTotals(rid)

// ---------- 收货地址（与「我的 → 收货地址」「结算页」同一份数据）----------
const addresses = computed(() => getAddresses())
const activeAddrId = ref(null)
const addrOpen = ref(false)
const addrModal = ref(false)

const currentAddress = computed(() => {
  const list = addresses.value || []
  if (!list.length) return null
  return list.find((a) => a.id === activeAddrId.value)
    || list.find((a) => a.isDefault)
    || list[0]
})
const addressText = computed(() => {
  const a = currentAddress.value
  return a ? [a.province, a.city, a.detail].filter(Boolean).join(' ') : ''
})
function pickAddress(a) {
  activeAddrId.value = a.id
  addrOpen.value = false
}

// ---------- 起送价 / 打烊 ----------
const minOrder = computed(() => (store.value && store.value.minOrder != null ? Number(store.value.minOrder) : 0))
const isClosed = computed(() => store.value != null && store.value.openStatus === 0)
const reachable = computed(() => totalPrice.value >= minOrder.value)
const diff = computed(() => Math.max(0, minOrder.value - totalPrice.value))
const canSubmit = computed(
  () => totalCount.value > 0 && reachable.value && !isClosed.value && !!currentAddress.value && !submitting.value
)

// ---------- 本单条目增减（直接操作草稿）----------
function inc(d) {
  buyNow.inc(rid.value, { ...d, id: d.id != null ? d.id : d.dishKey })
}
function dec(d) {
  buyNow.dec(rid.value, d.dishKey)
}
function remove(d) {
  buyNow.removeItem(rid.value, d.dishKey)
}
function clearAll() {
  buyNow.clearDraft(rid.value)
  toast('已清空本单', 'info')
}

// ---------- 菜单选菜（点击「＋」/菜品打开规格弹窗，弹窗里加入的进「本单」）----------
const popupShow = ref(false)
const activeDish = ref(null)

function qtyOfDish(d) {
  const id = d.id != null ? String(d.id) : String(d.name)
  return items.value.filter((it) => String(it.id) === id).reduce((s, it) => s + it.qty, 0)
}
function decDish(d) {
  const id = d.id != null ? String(d.id) : String(d.name)
  const it = items.value.filter((x) => String(x.id) === id).pop()
  if (it) buyNow.dec(rid.value, it.dishKey)
}
function openDish(d) {
  activeDish.value = d
  popupShow.value = true
}
function onAdded() {
  toast('已加入本单 🧾', 'success')
}
function onAddedToCart() {
  toast('已加入购物车 🛒', 'success')
}

// ---------- 提交 ----------
async function submitOrder() {
  if (submitting.value || totalCount.value === 0) return
  if (!currentAddress.value) {
    toast('请先填写收货地址，再提交订单', 'error')
    addrModal.value = true
    return
  }
  if (!reachable.value) {
    toast(`还差 ¥${diff.value.toFixed(2)} 起送`, 'error')
    return
  }
  submitting.value = true
  const orderItems = items.value.map((it) => ({
    dishId: it.id,
    name: it.name,
    price: it.price,
    qty: it.qty,
    specText: it.specText || ''
  }))
  try {
    const order = await createDirectOrder({
      restaurantId: rid.value,
      restaurantName: store.value ? store.value.name : buyNow.getDraft(rid.value).restaurantName,
      account: session.account,
      addressId: currentAddress.value.id,
      items: orderItems
    })
    toast(`下单成功 🎉 订单号 ${order.orderNo}`, 'success')
    // 本单已提交：清掉草稿，购物车不受影响
    buyNow.clearDraft(rid.value)
    setTimeout(() => router.replace('/orders'), 900)
  } catch (e) {
    toast(e.message || '下单失败，请稍后重试', 'error')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push('/restaurant/' + rid.value)
}

onMounted(async () => {
  initProfileForAccount(session.account)
  try {
    await loadAddresses(session.account)
  } catch (e) {
    /* 后端不可用时用本地缓存，不阻塞页面 */
  }
  try {
    store.value = await getRestaurantDetail(route.params.id)
  } catch (e) {
    errMsg.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="buy">
    <!-- 顶部导航栏：与首页尺寸完全一致 -->
    <AppHeader :account="account" :show-admin="showAdmin" @logout="logout" @admin="goAdmin" />

    <!-- 二级：返回 / 页面标题 -->
    <header class="topbar">
      <button class="back" @click="goBack">‹ 返回店铺</button>
      <span class="top-title">立即下单</span>
      <span class="top-spacer"></span>
    </header>

    <div v-if="loading" class="state">
      <span class="spinner"></span> 正在加载…
    </div>
    <div v-else-if="errMsg" class="state empty">😶 {{ errMsg }}</div>

    <template v-else-if="store">
      <!-- 收货地址：下单必须有地址，没有就先引导去添加 -->
      <section class="block addr" :class="{ 'addr-empty': !currentAddress }">
        <div class="addr-head">
          <span class="addr-label">📍 配送至</span>
          <button v-if="addresses.length > 1" class="addr-link" @click="addrOpen = !addrOpen">
            {{ addrOpen ? '收起' : '更换地址' }}
          </button>
          <button v-else class="addr-link" @click="addrModal = true">管理地址</button>
        </div>

        <template v-if="currentAddress">
          <div class="addr-line1">
            <span class="addr-name">{{ currentAddress.name }}</span>
            <span class="addr-phone">{{ currentAddress.phone }}</span>
            <span class="addr-tag">{{ currentAddress.tag }}</span>
          </div>
          <div class="addr-line2">{{ addressText }}</div>
        </template>
        <div v-else class="addr-none">
          <div class="addr-none-text">还没有收货地址，填好地址才能提交订单</div>
          <button class="addr-add" @click="addrModal = true">＋ 添加收货地址</button>
        </div>

        <ul v-if="addrOpen && addresses.length" class="addr-list">
          <li
            v-for="a in addresses"
            :key="a.id"
            class="addr-item"
            :class="{ active: currentAddress && a.id === currentAddress.id }"
            @click="pickAddress(a)"
          >
            <span class="addr-tag">{{ a.tag }}</span>
            <div class="addr-item-main">
              <div class="addr-line1">
                <span class="addr-name">{{ a.name }}</span>
                <span class="addr-phone">{{ a.phone }}</span>
              </div>
              <div class="addr-line2">{{ [a.province, a.city, a.detail].filter(Boolean).join(' ') }}</div>
            </div>
            <span class="addr-check">{{ currentAddress && a.id === currentAddress.id ? '✓' : '' }}</span>
          </li>
          <li class="addr-item addr-item-add" @click="addrModal = true">＋ 新增 / 管理地址</li>
        </ul>
      </section>

      <!-- 店铺信息 -->
      <section class="block store">
        <div class="store-emoji">{{ store.emoji || '🍜' }}</div>
        <div class="store-info">
          <div class="store-name-row">
            <span class="store-name">{{ store.name }}</span>
            <span class="open-badge" :class="isClosed ? 'closed' : 'open'">{{ isClosed ? '已打烊' : '营业中' }}</span>
          </div>
          <div class="store-sub">
            起送 ¥{{ minOrder }} · 配送 ¥{{ store.deliveryFee }} · 🕒 约 {{ store.eta }} 送达
          </div>
        </div>
      </section>

      <!-- 本单商品 -->
      <section class="block">
        <div class="block-head">
          <h2>🧾 本单商品</h2>
          <button v-if="items.length" class="clear" @click="clearAll">清空本单</button>
        </div>

        <div v-if="!items.length" class="tip">
          还没有选菜 —— 在下面「选择菜品」里点「＋」，选好规格后可选择「加入本单」直接提交，或「加入购物车」稍后一起结算。
        </div>

        <ul v-else class="menu">
          <li class="dish" v-for="d in items" :key="d.dishKey">
            <div class="dish-emoji">{{ d.emoji }}</div>
            <div class="dish-main">
              <div class="dish-name">{{ d.name }}</div>
              <div class="dish-spec" v-if="d.specText">{{ d.specText }}</div>
              <div class="dish-price">¥{{ Number(d.price || 0).toFixed(2) }} <span class="dish-sub">×{{ d.qty }}</span></div>
            </div>
            <div class="dish-action">
              <div class="stepper">
                <button class="step" @click="dec(d)">−</button>
                <span class="qnum">{{ d.qty }}</span>
                <button class="step" @click="inc(d)">+</button>
              </div>
              <button class="del" @click="remove(d)" title="移除">🗑</button>
            </div>
          </li>
        </ul>
      </section>

      <!-- 选择菜品 -->
      <section class="block">
        <div class="block-head">
          <h2>🍽️ 选择菜品</h2>
          <span class="count">{{ store.menu.length }} 道</span>
        </div>
        <ul class="dish-grid">
          <li class="dish" v-for="d in store.menu" :key="d.id" @click="openDish(d)">
            <div class="dish-emoji">{{ d.emoji }}</div>
            <div class="dish-main">
              <div class="dish-name">{{ d.name }}</div>
              <div class="dish-desc">{{ d.desc }}</div>
              <div class="dish-price">¥{{ d.price }}</div>
            </div>
            <div class="dish-action" @click.stop>
              <div class="stepper" v-if="qtyOfDish(d) > 0">
                <button class="step" @click="decDish(d)">−</button>
                <span class="qnum">{{ qtyOfDish(d) }}</span>
                <button class="step" @click="openDish(d)">+</button>
              </div>
              <button v-else class="add-btn" @click="openDish(d)">＋ 选规格</button>
            </div>
          </li>
        </ul>
      </section>

      <footer class="foot">食光 · 美食 — 发现身边的每一口好味道 🌿</footer>
    </template>

    <!-- 底部提交栏 -->
    <div class="buybar" v-if="store && !loading && !errMsg">
      <div class="buy-info">
        <div class="buy-count">🧾 本单 {{ totalCount }} 件</div>
        <div class="buy-total">
          合计 <span class="amount">¥{{ totalPrice.toFixed(2) }}</span>
          <span v-if="!currentAddress" class="warn">· 待填写收货地址</span>
        </div>
        <div class="buy-diff" v-if="!reachable">还差 <b>¥{{ diff.toFixed(2) }}</b> 起送</div>
      </div>
      <button class="submit" :disabled="!canSubmit" @click="submitOrder">
        <span v-if="submitting" class="btn-spin"></span>
        {{ submitting ? '提交中…' : isClosed ? '已打烊' : !reachable ? '还差起送' : '提交订单' }}
      </button>
    </div>

    <!-- 地址新增 / 管理弹窗 -->
    <AddressManageModal :show="addrModal" @close="addrModal = false" />

    <!-- 菜品规格弹窗：direct 模式默认加入「本单」；也可「加入购物车」，两个选项并存 -->
    <DishPopup
      :show="popupShow"
      :dish="activeDish"
      :restaurant-id="rid"
      :restaurant-name="store ? store.name : ''"
      mode="direct"
      show-add-to-cart
      @close="popupShow = false"
      @added="onAdded"
      @cart-added="onAddedToCart"
    />
  </div>
</template>

<style scoped>
.buy {
  color: var(--ink);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 130px;
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
.top-spacer { width: 84px; }

/* 加载 / 错误态 */
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
.block {
  background: rgba(255,255,255,0.86); backdrop-filter: blur(8px); border-radius: 22px; padding: 18px;
  box-shadow: 0 10px 26px rgba(0,150,136,0.16); border: 1px solid rgba(255,255,255,0.6);
}
.block-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.block-head h2 { font-size: 17px; font-weight: 900; color: var(--deep); }
.count { font-size: 12px; color: var(--muted); }
.clear {
  border: none; background: none; cursor: pointer; font-family: inherit;
  font-size: 12px; font-weight: 700; color: var(--muted);
}
.clear:hover { color: #e8730c; }
.tip {
  font-size: 13px; line-height: 1.7; color: #b4620a; font-weight: 700;
  background: rgba(232, 115, 12, 0.08); border: 1px dashed rgba(232, 115, 12, 0.35);
  border-radius: 14px; padding: 12px 14px;
}

/* 收货地址卡片 */
.addr { display: flex; flex-direction: column; gap: 6px; }
.addr-empty { border-color: rgba(232, 115, 12, 0.35); background: rgba(255, 249, 240, 0.95); }
.addr-head { display: flex; align-items: center; justify-content: space-between; }
.addr-label { font-size: 12px; font-weight: 800; color: var(--muted); }
.addr-link {
  border: none; cursor: pointer; background: rgba(0, 184, 148, 0.12);
  color: var(--deep); font-size: 12px; font-weight: 800; font-family: inherit;
  padding: 5px 11px; border-radius: 9px; transition: background 0.15s;
}
.addr-link:hover { background: rgba(0, 184, 148, 0.24); }
.addr-line1 { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.addr-name { font-size: 15px; font-weight: 800; color: var(--ink); }
.addr-phone { font-size: 13px; font-weight: 700; color: var(--muted); }
.addr-tag {
  flex: none; font-size: 11px; font-weight: 800; color: var(--deep);
  background: rgba(0, 184, 148, 0.14); padding: 2px 8px; border-radius: 7px;
}
.addr-line2 { font-size: 13px; color: var(--ink); line-height: 1.6; }
.addr-none { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.addr-none-text { font-size: 13px; font-weight: 700; color: #b4620a; }
.addr-add {
  border: none; cursor: pointer; padding: 8px 15px; border-radius: 11px;
  background: linear-gradient(135deg, #f7a03c, #ef7d18); color: #fff;
  font-size: 13px; font-weight: 800; font-family: inherit;
  box-shadow: 0 6px 14px rgba(239, 125, 24, 0.35);
}
.addr-add:hover { transform: translateY(-1px); }
.addr-list { list-style: none; margin-top: 6px; border-top: 1px dashed var(--line); padding-top: 6px; }
.addr-item {
  display: flex; align-items: flex-start; gap: 10px; padding: 9px 8px;
  border-radius: 11px; cursor: pointer; transition: background 0.12s;
}
.addr-item:hover { background: rgba(0, 184, 148, 0.08); }
.addr-item.active { background: rgba(0, 184, 148, 0.12); }
.addr-item-main { flex: 1; min-width: 0; }
.addr-check { flex: none; color: var(--teal); font-weight: 900; font-size: 14px; }
.addr-item-add {
  justify-content: center; font-size: 13px; font-weight: 800; color: var(--deep);
  border: 1px dashed rgba(0, 150, 136, 0.35);
}
.warn { color: #b4620a; font-weight: 800; }

/* 店铺信息 */
.store { display: flex; align-items: center; gap: 14px; }
.store-emoji {
  width: 48px; height: 48px; flex: none; border-radius: 14px; font-size: 26px;
  background: linear-gradient(135deg, rgba(0, 184, 148, 0.15), rgba(0, 206, 201, 0.15));
  display: grid; place-items: center;
}
.store-info { min-width: 0; }
.store-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.store-name { font-size: 16px; font-weight: 900; color: var(--ink); }
.open-badge { font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 999px; }
.open-badge.open { background: rgba(0, 184, 148, 0.14); color: var(--deep); }
.open-badge.closed { background: rgba(120, 120, 120, 0.16); color: #888; }
.store-sub { font-size: 12px; color: var(--muted); margin-top: 5px; }

/* 菜品列表 / 网格 */
.menu { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
.dish-grid { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
.dish {
  display: flex; gap: 12px; align-items: center;
  background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 12px;
}
.dish-grid .dish { cursor: pointer; transition: box-shadow 0.15s, transform 0.15s; }
.dish-grid .dish:hover { box-shadow: 0 10px 22px rgba(0, 150, 136, 0.16); transform: translateY(-1px); }
.dish-emoji {
  width: 48px; height: 48px; flex: none; border-radius: 13px; font-size: 26px;
  background: linear-gradient(135deg, rgba(0,184,148,0.15), rgba(0,206,201,0.15));
  display: grid; place-items: center;
}
.dish-main { flex: 1; min-width: 0; }
.dish-name { font-size: 15px; font-weight: 800; color: var(--ink); }
.dish-desc {
  font-size: 12px; color: var(--muted); margin-top: 3px; line-height: 1.5;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.dish-spec { font-size: 12px; color: var(--muted); margin-top: 3px; }
.dish-price { font-size: 14px; font-weight: 800; color: #e8730c; margin-top: 6px; }
.dish-sub { font-size: 12px; color: var(--muted); font-weight: 700; }
.dish-action { flex: none; display: flex; align-items: center; gap: 10px; }
.stepper { display: flex; align-items: center; gap: 8px; }
.step {
  width: 28px; height: 28px; border-radius: 9px; border: 1px solid var(--line);
  background: #fff; color: var(--deep); font-size: 18px; font-weight: 800; cursor: pointer; line-height: 1;
}
.step:hover { background: rgba(0,184,148,0.12); }
.qnum { font-size: 14px; font-weight: 800; color: var(--deep); min-width: 16px; text-align: center; }
.del {
  border: none; background: rgba(120,120,120,0.1); color: #888; cursor: pointer;
  width: 28px; height: 28px; border-radius: 9px; font-size: 13px;
}
.del:hover { background: rgba(120,120,120,0.2); }
.add-btn {
  border: none; cursor: pointer; padding: 8px 14px; border-radius: 11px;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff; font-weight: 800; font-size: 13px; font-family: inherit;
  box-shadow: 0 6px 14px rgba(0, 150, 136, 0.35); transition: transform 0.15s;
}
.add-btn:hover { transform: translateY(-1px); }

.foot { text-align: center; font-size: 12px; color: rgba(255,255,255,0.9); text-shadow: 0 2px 8px rgba(0,80,70,0.3); margin-top: 6px; }

/* 底部提交栏 */
.buybar {
  position: fixed;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 36px);
  max-width: 1064px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 20px;
  padding: 12px 16px;
  box-shadow: 0 12px 30px rgba(0, 150, 136, 0.3);
  z-index: 30;
}
.buy-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.buy-count { font-size: 13px; font-weight: 800; color: var(--deep); }
.buy-total { font-size: 12px; color: var(--muted); }
.buy-total .amount { font-size: 18px; font-weight: 900; color: #e8730c; }
.buy-diff { font-size: 12px; color: #e08e0b; font-weight: 800; }
.buy-diff b { color: #e8730c; }
.submit {
  border: none; cursor: pointer; padding: 12px 26px; border-radius: 14px;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff; font-weight: 800; font-size: 15px; font-family: inherit;
  box-shadow: 0 8px 18px rgba(0, 150, 136, 0.45); transition: transform 0.15s, box-shadow 0.15s;
  flex: none;
}
.submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 11px 22px rgba(0, 150, 136, 0.6); }
.submit:disabled { opacity: 0.55; cursor: default; background: #b8e6da; box-shadow: none; }
.btn-spin {
  display: inline-block; width: 12px; height: 12px; margin-right: 6px;
  border: 2px solid rgba(255,255,255,0.5); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: -1px;
}

@media (max-width: 600px) {
  .dish { flex-wrap: wrap; }
  .dish-action { flex-direction: row; width: 100%; justify-content: flex-end; align-items: center; }
}
</style>
