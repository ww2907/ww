<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { session } from '../store.js'
import { getAddresses, initProfileForAccount, setDefaultAddress } from '../store/profile.js'
import { toast } from '../composables/useToast.js'

// ============================================================
// 首页顶部「定位 / 收货地址」组件
// ------------------------------------------------------------
// 展示当前配送地址（默认地址优先），点击展开地址列表切换默认地址，
// 并提供「重新定位」与「管理地址」入口。数据复用 profile store 的收货地址。
// ============================================================

const open = ref(false)
const rootEl = ref(null)
const locating = ref(false)

const addresses = computed(() => getAddresses())
const defaultAddr = computed(() => addresses.value.find((a) => a.isDefault) || addresses.value[0] || null)

const currentText = computed(() => {
  const a = defaultAddr.value
  if (!a) return '请选择收货地址'
  const city = [a.province, a.city].filter(Boolean).join(' ')
  return (city ? city + ' · ' : '') + (a.detail || '')
})

function toggle() {
  open.value = !open.value
}

function pick(a) {
  setDefaultAddress(a.id)
  open.value = false
  toast('已切换到该地址配送 📍', 'success')
}

// 「重新定位」：优先尝试浏览器定位，失败则回退到默认地址
function locate() {
  if (locating.value) return
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    toast('当前环境不支持定位，已使用默认地址', 'info')
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    () => {
      locating.value = false
      toast('已定位到当前位置 📍', 'success')
    },
    () => {
      locating.value = false
      toast('定位失败，已使用默认地址', 'info')
    },
    { timeout: 5000, maximumAge: 60000 }
  )
}

// 点击组件外部收起
function onDocClick(e) {
  if (rootEl.value && !rootEl.value.contains(e.target)) open.value = false
}

onMounted(() => {
  initProfileForAccount(session.account).catch(() => {})
  document.addEventListener('click', onDocClick)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<template>
  <div class="loc-wrap" ref="rootEl">
    <button class="loc-bar" @click="toggle">
      <span class="loc-icon">📍</span>
      <div class="loc-text">
        <span class="loc-title">配送至</span>
        <span class="loc-addr">{{ currentText }}</span>
      </div>
      <span class="loc-arrow" :class="{ up: open }">▾</span>
    </button>

    <transition name="sg-fade">
      <div v-if="open" class="loc-panel">
        <div class="loc-panel-head">
          <span class="lp-title">选择收货地址</span>
          <button class="lp-locate" :disabled="locating" @click="locate">
            {{ locating ? '定位中…' : '🛰 重新定位' }}
          </button>
        </div>

        <ul v-if="addresses.length" class="lp-list">
          <li
            v-for="a in addresses"
            :key="a.id"
            class="lp-item"
            :class="{ active: a.isDefault }"
            @click="pick(a)"
          >
            <span class="lp-tag">{{ a.tag }}</span>
            <div class="lp-main">
              <div class="lp-line1">{{ a.name }} {{ a.phone }}</div>
              <div class="lp-line2">{{ [a.province, a.city, a.detail].filter(Boolean).join(' ') }}</div>
            </div>
            <span class="lp-check">{{ a.isDefault ? '✓' : '' }}</span>
          </li>
        </ul>
        <div v-else class="lp-empty">还没有收货地址，去「我的」页面添加一个吧～</div>

        <div class="lp-foot">
          <a class="lp-manage" href="#/profile">＋ 管理收货地址</a>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.loc-wrap { position: relative; z-index: 40; }
.loc-bar {
  width: 100%; display: flex; align-items: center; gap: 12px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px; padding: 12px 16px; cursor: pointer;
  box-shadow: 0 8px 22px rgba(0, 150, 136, 0.18);
  font-family: inherit; text-align: left;
}
.loc-bar:hover { box-shadow: 0 10px 26px rgba(0, 150, 136, 0.28); }
.loc-icon { font-size: 22px; flex: none; }
.loc-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.loc-title { font-size: 11px; color: var(--muted); font-weight: 700; }
.loc-addr {
  font-size: 14px; font-weight: 800; color: var(--ink);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.loc-arrow { font-size: 14px; color: var(--muted); transition: transform 0.2s; }
.loc-arrow.up { transform: rotate(180deg); }

.loc-panel {
  position: absolute; top: calc(100% + 8px); left: 0; right: 0;
  background: #fff; border-radius: 16px; overflow: hidden;
  box-shadow: 0 14px 34px rgba(0, 80, 70, 0.22);
  border: 1px solid rgba(0, 184, 148, 0.18);
}
.loc-panel-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-bottom: 1px solid var(--line);
}
.lp-title { font-size: 13px; font-weight: 900; color: var(--deep); }
.lp-locate {
  border: none; cursor: pointer; padding: 6px 12px; border-radius: 10px;
  background: rgba(0, 184, 148, 0.12); color: var(--deep);
  font-size: 12px; font-weight: 800; font-family: inherit;
}
.lp-locate:hover { background: rgba(0, 184, 148, 0.22); }
.lp-locate:disabled { opacity: 0.6; }

.lp-list { list-style: none; max-height: 280px; overflow-y: auto; }
.lp-item {
  display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px;
  cursor: pointer; transition: background 0.12s;
}
.lp-item:hover { background: rgba(0, 184, 148, 0.08); }
.lp-item.active { background: rgba(0, 184, 148, 0.1); }
.lp-tag {
  flex: none; font-size: 11px; font-weight: 800; color: var(--deep);
  background: rgba(0, 184, 148, 0.14); padding: 3px 8px; border-radius: 7px; margin-top: 1px;
}
.lp-main { flex: 1; min-width: 0; }
.lp-line1 { font-size: 13px; font-weight: 800; color: var(--ink); }
.lp-line2 { font-size: 12px; color: var(--muted); margin-top: 3px; line-height: 1.5; }
.lp-check { flex: none; color: var(--teal); font-weight: 900; font-size: 15px; }
.lp-empty { padding: 18px 14px; font-size: 13px; color: var(--muted); text-align: center; }
.lp-foot { padding: 10px 14px; border-top: 1px solid var(--line); }
.lp-manage { font-size: 13px; font-weight: 800; color: var(--deep); text-decoration: none; }
.lp-manage:hover { text-decoration: underline; }

.sg-fade-enter-active, .sg-fade-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.sg-fade-enter-from, .sg-fade-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
