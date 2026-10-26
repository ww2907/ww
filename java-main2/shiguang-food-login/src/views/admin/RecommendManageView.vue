<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { MOCK_RESTAURANTS } from '../../api/food.js'
import { getRecommend, updateRecommend } from '../../api/admin.js'

const all = MOCK_RESTAURANTS
const selected = ref(new Set())
const keyword = ref('')
const saving = ref(false)
const loading = ref(false)
const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null

function showToast(msg) {
  toastMsg.value = msg; toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2000)
}

const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return all
  return all.filter((r) => r.name.toLowerCase().includes(k) || (r.cat || '').toLowerCase().includes(k))
})

const count = computed(() => selected.value.size)

onMounted(async () => {
  loading.value = true
  try {
    const res = await getRecommend()
    selected.value = new Set(res.ids || [])
  } catch (e) { showToast(e.message || '加载失败') } finally { loading.value = false }
})

function toggle(r) {
  const s = selected.value
  if (s.has(r.id)) s.delete(r.id)
  else s.add(r.id)
  selected.value = new Set(s) // 触发响应式
}

async function save() {
  saving.value = true
  try {
    await updateRecommend(Array.from(selected.value))
    showToast(`已保存，首页将展示 ${selected.value.size} 家推荐美食 ✅`)
  } catch (e) { showToast(e.message || '保存失败') } finally { saving.value = false }
}

function selectTop12() {
  const ids = all.slice().sort((a, b) => b.rating - a.rating || a.id - b.id).slice(0, 12).map((r) => r.id)
  selected.value = new Set(ids)
}

onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>🔥 推荐管理</h1>
        <p>勾选需要在首页「推荐美食」区块展示的店铺。保存后首页实时刷新推荐列表。</p>
      </div>
      <div class="actions">
        <button class="ghost" @click="selectTop12">按评分选前 12 家</button>
        <button class="save" :disabled="saving" @click="save">
          <span v-if="saving"><span class="spinner"></span> 保存中…</span>
          <span v-else>💾 保存推荐 ({{ count }})</span>
        </button>
      </div>
    </div>

    <div class="toolbar">
      <input v-model="keyword" placeholder="🔍 搜索店铺名 / 分类…" />
      <span class="cnt">已选 <b>{{ count }}</b> 家</span>
    </div>

    <div v-if="loading" class="state"><span class="spinner"></span> 加载中…</div>

    <div v-else class="list">
      <div class="item" v-for="r in filtered" :key="r.id" :class="{ on: selected.has(r.id) }" @click="toggle(r)">
        <label class="cb"><input type="checkbox" :checked="selected.has(r.id)" @click.stop="toggle(r)" /><span></span></label>
        <span class="emoji">{{ r.emoji }}</span>
        <div class="meta">
          <strong>{{ r.name }}</strong>
          <small>{{ r.cat }} · ⭐ {{ r.rating }} · {{ r.distance }}</small>
        </div>
        <span class="tag" v-if="selected.has(r.id)">已推荐</span>
      </div>
      <div v-if="filtered.length === 0" class="empty">没有匹配的店铺</div>
    </div>
  </div>

  <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
</template>

<style scoped>
.page { max-width: 880px; }
.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.page-head h1 { font-size: 22px; font-weight: 900; color: #0c3d39; }
.page-head p { margin-top: 6px; font-size: 13px; color: #6f8c88; line-height: 1.6; max-width: 560px; }
.actions { display: flex; gap: 10px; flex: none; }
.ghost { border: 1.5px solid #cfe6e2; background: #fff; color: #0c8f7f; border-radius: 12px; padding: 10px 14px; font-weight: 700; cursor: pointer; font-size: 13px; }
.ghost:hover { background: #f0faf8; }
.save { border: none; cursor: pointer; padding: 11px 18px; border-radius: 12px; background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; font-weight: 800; font-size: 14px; box-shadow: 0 8px 18px rgba(0,150,136,0.35); }
.save:hover:not(:disabled) { transform: translateY(-1px); }
.save:disabled { opacity: 0.7; }

.toolbar { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
.toolbar input { flex: 1; padding: 11px 14px; border: 1.5px solid #e0e8e7; border-radius: 12px; font-size: 14px; background: #f7fffc; outline: none; }
.toolbar input:focus { border-color: #00cec9; box-shadow: 0 0 0 3px rgba(0,206,201,0.16); }
.cnt { font-size: 13px; color: #6f8c88; white-space: nowrap; }
.cnt b { color: #0c3d39; }

.state { text-align: center; padding: 40px; color: #6f8c88; }
.list { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.item { display: flex; align-items: center; gap: 12px; background: #fff; border: 1.5px solid #e6edef; border-radius: 14px; padding: 12px 14px; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; }
.item:hover { border-color: #bcd9d3; }
.item.on { border-color: #00b894; box-shadow: 0 6px 16px rgba(0,150,136,0.18); background: #f3fbfa; }
.cb { position: relative; display: flex; }
.cb input { width: 18px; height: 18px; accent-color: #00b894; cursor: pointer; }
.emoji { font-size: 26px; }
.meta { display: flex; flex-direction: column; line-height: 1.3; min-width: 0; }
.meta strong { font-size: 14px; color: #0c3d39; }
.meta small { font-size: 11px; color: #8aa3a0; }
.tag { margin-left: auto; font-size: 11px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #00b894, #00cec9); padding: 4px 10px; border-radius: 999px; }
.empty { grid-column: 1 / -1; text-align: center; padding: 30px; color: #8aa3a0; }

.toast { position: fixed; top: 28px; left: 50%; transform: translateX(-50%) translateY(-20px) scale(0.95); background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; padding: 13px 24px; border-radius: 14px; font-weight: 700; box-shadow: 0 10px 30px rgba(0,150,136,0.45); opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s; z-index: 999; }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: -2px; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 760px) { .list { grid-template-columns: 1fr; } }
</style>
