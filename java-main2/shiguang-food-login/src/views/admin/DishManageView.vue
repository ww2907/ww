<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { listCategories, saveCategory, removeCategory, listDishes, saveDish, removeDish } from '../../api/admin.js'

const categories = ref([])
const dishes = ref([])
const loading = ref(false)
const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null

const catName = computed(() => {
  const m = {}
  categories.value.forEach((c) => (m[c.id] = c.name))
  return m
})

function showToast(msg) {
  toastMsg.value = msg; toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2000)
}

onMounted(async () => {
  loading.value = true
  try {
    const [c, d] = await Promise.all([listCategories(), listDishes()])
    categories.value = c
    dishes.value = d
  } catch (e) { showToast(e.message || '加载失败') } finally { loading.value = false }
})

async function addCategory() {
  try { await saveCategory({ name: '新分类', parentId: 0, sortOrder: categories.value.length + 1 }); categories.value = await listCategories(); showToast('已新增分类') } catch (e) { showToast(e.message) }
}
async function updCategory(c) { try { await saveCategory(c); showToast('分类已保存') } catch (e) { showToast(e.message) } }
async function delCategory(id) { try { await removeCategory(id); categories.value = await listCategories(); showToast('分类已删除') } catch (e) { showToast(e.message) } }

async function addDish() {
  try { await saveDish({ name: '新菜品', price: 0, emoji: '🍽️', categoryId: categories.value[0]?.id || 0, description: '', sort: dishes.value.length + 1, enabled: true }); dishes.value = await listDishes(); showToast('已新增菜品') } catch (e) { showToast(e.message) }
}
async function updDish(d) { try { await saveDish(d); showToast('菜品已保存') } catch (e) { showToast(e.message) } }
async function delDish(id) { try { await removeDish(id); dishes.value = await listDishes(); showToast('菜品已删除') } catch (e) { showToast(e.message) } }

onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>🍱 菜品管理</h1>
        <p>维护「下单点餐」所需的分类与菜品数据。分类可分级，菜品归属到分类并控制上下架。</p>
      </div>
    </div>

    <div v-if="loading" class="state"><span class="spinner"></span> 加载中…</div>

    <div v-else class="stack">
      <!-- 分类 -->
      <section class="card">
        <div class="card-head">
          <h2>📂 分类</h2>
          <button class="add" @click="addCategory">+ 新增分类</button>
        </div>
        <div class="rows">
          <div class="row head"><span>名称</span><span>父分类</span><span>排序</span><span></span></div>
          <div class="row" v-for="c in categories" :key="c.id">
            <input v-model="c.name" @change="updCategory(c)" />
            <select v-model.number="c.parentId" @change="updCategory(c)">
              <option :value="0">顶级（美食）</option>
              <option v-for="p in categories.filter(x => x.id !== c.id)" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <input class="num" type="number" v-model.number="c.sortOrder" @change="updCategory(c)" />
            <button class="del" @click="delCategory(c.id)">删除</button>
          </div>
        </div>
      </section>

      <!-- 菜品 -->
      <section class="card">
        <div class="card-head">
          <h2>🍜 菜品（{{ dishes.length }}）</h2>
          <button class="add" @click="addDish">+ 新增菜品</button>
        </div>
        <div class="rows">
          <div class="row head dish-head"><span>图标</span><span>名称</span><span>价格</span><span>分类</span><span>排序</span><span>上架</span><span></span></div>
          <div class="row dish" v-for="d in dishes" :key="d.id">
            <input class="emoji" v-model="d.emoji" maxlength="2" @change="updDish(d)" />
            <input class="nm" v-model="d.name" @change="updDish(d)" />
            <input class="price" type="number" v-model.number="d.price" @change="updDish(d)" />
            <select v-model.number="d.categoryId" @change="updDish(d)">
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <input class="num" type="number" v-model.number="d.sort" @change="updDish(d)" />
            <label class="sw"><input type="checkbox" v-model="d.enabled" @change="updDish(d)" /><span></span></label>
            <button class="del" @click="delDish(d.id)">删除</button>
          </div>
        </div>
      </section>
    </div>
  </div>

  <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
</template>

<style scoped>
.page { max-width: 1000px; }
.page-head h1 { font-size: 22px; font-weight: 900; color: #0c3d39; }
.page-head p { margin-top: 6px; font-size: 13px; color: #6f8c88; line-height: 1.6; }
.state { text-align: center; padding: 40px; color: #6f8c88; }
.stack { display: flex; flex-direction: column; gap: 18px; }
.card { background: #fff; border-radius: 18px; padding: 18px; box-shadow: 0 8px 22px rgba(15,61,57,0.08); border: 1px solid #e6edef; }
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.card-head h2 { font-size: 16px; font-weight: 800; color: #0c3d39; }
.add { border: 1.5px dashed #bcd9d3; background: #f3fbfa; color: #0c8f7f; border-radius: 10px; padding: 8px 14px; font-weight: 700; cursor: pointer; font-size: 13px; }
.add:hover { background: #e6f6f3; }

.rows { display: flex; flex-direction: column; gap: 8px; }
.row { display: grid; grid-template-columns: 1fr 140px 80px 60px; align-items: center; gap: 8px; }
.row.dish { grid-template-columns: 52px 1fr 90px 130px 70px 56px 60px; }
.row.head { font-size: 11px; color: #94aaa7; font-weight: 700; padding: 0 4px; }
.row input, .row select { width: 100%; padding: 9px 10px; border: 1.5px solid #e0e8e7; border-radius: 10px; font-size: 13px; background: #f7fffc; }
.row input:focus, .row select:focus { border-color: #00cec9; }
.row .num { text-align: center; }
.row .emoji { text-align: center; font-size: 18px; }
.row .price { text-align: right; }
.row .sw { display: flex; justify-content: center; }
.row .sw input { width: 18px; height: 18px; accent-color: #00b894; cursor: pointer; }
.del { border: 1px solid #f0c9c0; background: #fff4f1; color: #d9533c; border-radius: 8px; padding: 8px 0; font-size: 12px; cursor: pointer; }
.del:hover { background: #ffe6e0; }

.toast { position: fixed; top: 28px; left: 50%; transform: translateX(-50%) translateY(-20px) scale(0.95); background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; padding: 13px 24px; border-radius: 14px; font-weight: 700; box-shadow: 0 10px 30px rgba(0,150,136,0.45); opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s; z-index: 999; }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: -2px; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 820px) {
  .row { grid-template-columns: 1fr 110px 60px 50px; }
  .row.dish { grid-template-columns: 44px 1fr 70px 100px 56px 48px 52px; font-size: 12px; }
}
</style>
