<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { listCategories, listDishes, updateDishPrice, batchUpdatePrice } from '../../api/admin.js'

const categories = ref([])
const dishes = ref([])
const loading = ref(false)

// 批量工具条
const batchMode = ref('rate')      // rate 百分比 | add 加减 | set 统一定价
const batchValue = ref(1)
const step = ref(0.5)
const steps = [0.5, 1, 5]

const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null
function showToast(msg) {
  toastMsg.value = msg; toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2200)
}

const catName = computed(() => {
  const m = {}
  categories.value.forEach((c) => (m[c.id] = c.name))
  return m
})

// 概览统计
const avgPrice = computed(() => {
  if (!dishes.value.length) return '0.00'
  const sum = dishes.value.reduce((s, d) => s + (Number(d.price) || 0), 0)
  return (sum / dishes.value.length).toFixed(2)
})
const totalPrice = computed(() => {
  const sum = dishes.value.reduce((s, d) => s + (Number(d.price) || 0), 0)
  return sum.toFixed(2)
})

// 选择
const selectAll = computed({
  get: () => dishes.value.length > 0 && dishes.value.every((d) => d.selected),
  set: (v) => dishes.value.forEach((d) => (d.selected = v))
})
const selectedIds = computed(() => dishes.value.filter((d) => d.selected).map((d) => d.id))

const batchHint = computed(() => {
  const v = Number(batchValue.value)
  if (batchMode.value === 'rate') return `所选菜品价格将乘以 ${isFinite(v) ? v : '?'}（如 1.1 = +10%，0.9 = −10%）`
  if (batchMode.value === 'add') return `所选菜品价格在现价基础上 ${v >= 0 ? '加' : '减'} ${Math.abs(isFinite(v) ? v : 0)} 元`
  return `所选菜品价格统一设定为 ${isFinite(v) ? v : '?'} 元`
})

function fmt(p) {
  return Number(p || 0).toFixed(2)
}

function dirty(d) {
  return Number(d.editPrice) !== Number(d.price)
}

function bump(d, delta) {
  const cur = Number(d.editPrice)
  if (!isFinite(cur)) d.editPrice = 0
  else d.editPrice = Math.round((cur + delta) * 100) / 100
}

async function savePrice(d) {
  const v = Number(d.editPrice)
  if (!isFinite(v) || v < 0) {
    showToast('价格必须是 ≥ 0 的数字')
    d.editPrice = d.price
    return
  }
  try {
    await updateDishPrice(d.id, v)
    d.price = Math.round(v * 100) / 100
    showToast('已保存：' + d.name + ' ¥' + fmt(d.price))
  } catch (e) {
    showToast(e.message || '保存失败')
  }
}

async function applyBatch() {
  if (!selectedIds.value.length) { showToast('请先勾选要调整的菜品'); return }
  const payload = { mode: batchMode.value, value: Number(batchValue.value), ids: selectedIds.value }
  try {
    const res = await batchUpdatePrice(payload)
    const cnt = res && res.count != null ? res.count : selectedIds.value.length
    showToast('批量调整完成，影响 ' + cnt + ' 个菜品')
    await load() // 重新拉取最新价格
  } catch (e) {
    showToast(e.message || '批量调整失败')
  }
}

async function load() {
  loading.value = true
  try {
    const [c, d] = await Promise.all([listCategories(), listDishes()])
    categories.value = c
    dishes.value = d.map((x) => ({ ...x, editPrice: x.price, selected: false }))
  } catch (e) {
    showToast(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)
onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>💰 数字管理 · 菜品价格</h1>
        <p>快捷、批量调整所有菜品价格。支持逐条 ± 微调或直接输入，也支持按百分比 / 加减金额 / 统一定价批量操作，改动实时写入数据库。</p>
      </div>
    </div>

    <div v-if="loading" class="state"><span class="spinner"></span> 加载中…</div>

    <div v-else class="stack">
      <!-- 概览 -->
      <section class="stats">
        <div class="stat"><span class="num">{{ dishes.length }}</span><span class="lab">菜品总数</span></div>
        <div class="stat"><span class="num">¥{{ avgPrice }}</span><span class="lab">平均价格</span></div>
        <div class="stat"><span class="num">¥{{ totalPrice }}</span><span class="lab">价格合计</span></div>
      </section>

      <!-- 批量工具条 -->
      <section class="card tool">
        <label class="chk"><input type="checkbox" v-model="selectAll" /> 全选</label>
        <div class="field">
          <label>方式</label>
          <select v-model="batchMode">
            <option value="rate">百分比系数（×）</option>
            <option value="add">加减金额（±）</option>
            <option value="set">统一定价（=）</option>
          </select>
        </div>
        <div class="field">
          <label>数值</label>
          <input class="val" type="number" step="0.1" v-model.number="batchValue" />
        </div>
        <button class="apply" :disabled="!selectedIds.length" @click="applyBatch">
          批量应用（{{ selectedIds.length }}）
        </button>
        <span class="hint">{{ batchHint }}</span>
      </section>

      <!-- 明细列表 -->
      <section class="card">
        <div class="card-head">
          <h2>🍜 菜品价格明细（{{ dishes.length }}）</h2>
          <div class="steps">
            <span>步进</span>
            <button v-for="s in steps" :key="s" :class="{ on: step === s }" @click="step = s">{{ s }}</button>
          </div>
        </div>
        <div class="rows">
          <div class="row head">
            <span class="c-sel"></span>
            <span class="c-emoji"></span>
            <span class="c-name">菜品</span>
            <span class="c-price">价格调整</span>
            <span class="c-act"></span>
          </div>
          <div class="row" v-for="d in dishes" :key="d.id">
            <span class="c-sel"><input type="checkbox" v-model="d.selected" /></span>
            <span class="c-emoji">{{ d.emoji }}</span>
            <span class="c-name">
              <strong>{{ d.name }}</strong>
              <small>{{ catName[d.categoryId] || '未分类' }}</small>
            </span>
            <span class="c-price">
              <div class="editor">
                <button class="step-btn" @click="bump(d, -step)">−</button>
                <input type="number" step="0.1" v-model.number="d.editPrice" @keyup.enter="savePrice(d)" />
                <button class="step-btn" @click="bump(d, step)">+</button>
                <span class="cur" :class="{ chg: dirty(d) }">¥{{ fmt(d.price) }}</span>
              </div>
            </span>
            <span class="c-act">
              <button class="save" v-if="dirty(d)" @click="savePrice(d)">保存</button>
              <span v-else class="saved">已同步</span>
            </span>
          </div>
        </div>
      </section>
    </div>

    <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
  </div>
</template>

<style scoped>
.page { max-width: 1000px; animation: adIn 0.4s ease both; }
.page-head h1 { font-size: 22px; font-weight: 900; color: #0c3d39; position: relative; padding-left: 14px; }
.page-head h1::before { content: ""; position: absolute; left: 0; top: 4px; bottom: 4px; width: 5px; border-radius: 4px; background: linear-gradient(180deg, #00b894, #00cec9); }
.page-head p { margin-top: 6px; font-size: 13px; color: #6f8c88; line-height: 1.6; }
.state { text-align: center; padding: 40px; color: #6f8c88; }
.stack { display: flex; flex-direction: column; gap: 18px; }

/* 概览 */
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; }
.stat { background: linear-gradient(135deg, #0f3d39, #0c2f2c); color: #fff; border-radius: 16px; padding: 16px 18px; display: flex; flex-direction: column; gap: 4px; }
.stat .num { font-size: 24px; font-weight: 900; }
.stat .lab { font-size: 12px; color: #9fd6cd; }

/* 卡片 */
.card { background: #fff; border-radius: 20px; padding: 18px; box-shadow: 0 10px 30px rgba(15,61,57,0.08); border: 1px solid #e9f0ef; transition: box-shadow 0.2s, transform 0.2s; }
.card:hover { box-shadow: 0 14px 36px rgba(15,61,57,0.12); transform: translateY(-2px); }
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; }
.card-head h2 { font-size: 16px; font-weight: 800; color: #0c3d39; }

/* 批量工具条 */
.tool { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; }
.tool .chk { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #0c3d39; cursor: pointer; }
.tool .field { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #465; }
.tool .field label { font-weight: 700; color: #0c3d39; }
.tool select, .tool .val { padding: 9px 10px; border: 1.5px solid #e0e8e7; border-radius: 10px; font-size: 13px; background: #f7fffc; }
.tool .val { width: 110px; }
.tool select:focus, .tool .val:focus { border-color: #00cec9; outline: none; box-shadow: 0 0 0 3px rgba(0,206,201,0.15); }
.tool .apply { border: none; background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; border-radius: 10px; padding: 10px 18px; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 8px 18px rgba(0,150,136,0.3); }
.tool .apply:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
.tool .hint { font-size: 12px; color: #6f8c88; flex: 1; min-width: 160px; }

/* 步进选择 */
.steps { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #6f8c88; }
.steps button { border: 1.5px solid #e0e8e7; background: #f7fffc; color: #0c3d39; border-radius: 8px; padding: 5px 10px; font-weight: 700; cursor: pointer; }
.steps button.on { border-color: #00cec9; background: #e6f6f3; color: #0c8f7f; }

/* 明细行 */
.rows { display: flex; flex-direction: column; gap: 8px; }
.row { display: grid; grid-template-columns: 34px 44px 1fr 300px 70px; align-items: center; gap: 10px; }
.row.head { font-size: 11px; color: #94aaa7; font-weight: 700; padding: 0 4px; }
.row:not(.head):hover { background: #f3fbfa; border-radius: 12px; }
.c-name { display: flex; flex-direction: column; line-height: 1.3; min-width: 0; }
.c-name strong { font-size: 14px; font-weight: 800; color: #0c3d39; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.c-name small { font-size: 11px; color: #94aaa7; }
.c-sel, .c-emoji { display: flex; justify-content: center; }
.c-emoji { font-size: 22px; }
.c-sel input { width: 18px; height: 18px; accent-color: #00b894; cursor: pointer; }

.editor { display: flex; align-items: center; gap: 6px; }
.step-btn { width: 30px; height: 34px; border: 1.5px solid #e0e8e7; background: #f7fffc; color: #0c3d39; border-radius: 9px; font-size: 18px; font-weight: 800; cursor: pointer; flex: none; }
.step-btn:hover { background: #e6f6f3; border-color: #00cec9; }
.editor input { width: 92px; padding: 8px 9px; border: 1.5px solid #e0e8e7; border-radius: 10px; font-size: 14px; font-weight: 700; background: #f7fffc; text-align: right; }
.editor input:focus { border-color: #00cec9; outline: none; box-shadow: 0 0 0 3px rgba(0,206,201,0.15); }
.cur { font-size: 13px; font-weight: 800; color: #0c3d39; white-space: nowrap; }
.cur.chg { color: #00b894; }
.c-act { display: flex; justify-content: center; }
.save { border: none; background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; border-radius: 8px; padding: 8px 12px; font-size: 12px; font-weight: 800; cursor: pointer; box-shadow: 0 6px 14px rgba(0,150,136,0.3); }
.saved { font-size: 12px; color: #9fb; color: #7fb8ad; }

.toast { position: fixed; top: 28px; left: 50%; transform: translateX(-50%) translateY(-20px) scale(0.95); background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; padding: 13px 24px; border-radius: 14px; font-weight: 700; box-shadow: 0 10px 30px rgba(0,150,136,0.45); opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s; z-index: 999; }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: -2px; }

@media (max-width: 820px) {
  .row { grid-template-columns: 28px 36px 1fr 250px 60px; font-size: 12px; gap: 6px; }
  .editor input { width: 74px; }
}
@media (max-width: 600px) {
  .row { grid-template-columns: 26px 30px 1fr; grid-row-gap: 6px; }
  .row.head .c-price, .row.head .c-act { display: none; }
  .c-price { grid-column: 1 / -1; }
  .c-act { grid-column: 1 / -1; justify-content: flex-start; }
  .editor { justify-content: flex-start; }
  .tool .hint { min-width: 100%; }
}
</style>
