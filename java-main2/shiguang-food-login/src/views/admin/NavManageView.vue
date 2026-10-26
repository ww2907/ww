<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getNavConfig, updateNavConfig } from '../../api/admin.js'

const top = ref([])
const bottom = ref([])
const loading = ref(false)
const saving = ref(false)
const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null

function showToast(msg) {
  toastMsg.value = msg
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2000)
}

function clone(v) { return JSON.parse(JSON.stringify(v)) }

onMounted(async () => {
  loading.value = true
  try {
    const cfg = await getNavConfig()
    top.value = cfg.top
    bottom.value = cfg.bottom
  } catch (e) { showToast(e.message || '加载失败') } finally { loading.value = false }
})

function addRow(list) {
  list.push({ id: 'new-' + Date.now(), label: '新菜单', icon: '⭐', sort: list.length + 1, enabled: true })
}
function removeRow(list, i) { list.splice(i, 1) }
function move(list, i, dir) {
  const j = i + dir
  if (j < 0 || j >= list.length) return
  const tmp = list[i].sort; list[i].sort = list[j].sort; list[j].sort = tmp
  const a = list[i]; list[i] = list[j]; list[j] = a
}

async function save() {
  saving.value = true
  try {
    await updateNavConfig({ top: top.value, bottom: bottom.value })
    showToast('导航配置已保存，首页已同步更新 ✅')
  } catch (e) { showToast(e.message || '保存失败') } finally { saving.value = false }
}

onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>🧭 导航管理</h1>
        <p>管理首页「顶部导航」与「底部导航栏」的菜单项、图标、顺序与显隐。修改后首页实时生效。</p>
      </div>
      <button class="save" :disabled="saving" @click="save">
        <span v-if="saving"><span class="spinner"></span> 保存中…</span>
        <span v-else>💾 保存配置</span>
      </button>
    </div>

    <div v-if="loading" class="state"><span class="spinner"></span> 加载中…</div>

    <div v-else class="cols">
      <section class="card">
        <h2>顶部导航</h2>
        <p class="hint">首页顶部横排菜单（首页 / 美食 / 订单 / 我的）。</p>
        <div class="rows">
          <div class="row head">
            <span>图标</span><span>名称</span><span>顺序</span><span>显示</span><span>操作</span>
          </div>
          <div class="row" v-for="(item, i) in top" :key="item.id">
            <input class="ic" v-model="item.icon" maxlength="2" />
            <input class="lb" v-model="item.label" />
            <div class="sort">
              <button @click="move(top, i, -1)">↑</button>
              <button @click="move(top, i, 1)">↓</button>
            </div>
            <label class="sw"><input type="checkbox" v-model="item.enabled" /><span></span></label>
            <button class="del" @click="removeRow(top, i)">删除</button>
          </div>
        </div>
        <button class="add" @click="addRow(top)">+ 新增顶部导航项</button>
      </section>

      <section class="card">
        <h2>底部导航栏</h2>
        <p class="hint">移动端固定的底部 Tab 栏，与顶部导航默认一致。</p>
        <div class="rows">
          <div class="row head">
            <span>图标</span><span>名称</span><span>顺序</span><span>显示</span><span>操作</span>
          </div>
          <div class="row" v-for="(item, i) in bottom" :key="item.id">
            <input class="ic" v-model="item.icon" maxlength="2" />
            <input class="lb" v-model="item.label" />
            <div class="sort">
              <button @click="move(bottom, i, -1)">↑</button>
              <button @click="move(bottom, i, 1)">↓</button>
            </div>
            <label class="sw"><input type="checkbox" v-model="item.enabled" /><span></span></label>
            <button class="del" @click="removeRow(bottom, i)">删除</button>
          </div>
        </div>
        <button class="add" @click="addRow(bottom)">+ 新增底部导航项</button>
      </section>
    </div>
  </div>

  <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
</template>

<style scoped>
.page { max-width: 1100px; }
.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.page-head h1 { font-size: 22px; font-weight: 900; color: #0c3d39; }
.page-head p { margin-top: 6px; font-size: 13px; color: #6f8c88; max-width: 620px; line-height: 1.6; }
.save {
  flex: none; border: none; cursor: pointer; padding: 11px 20px; border-radius: 12px;
  background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; font-weight: 800; font-size: 14px;
  box-shadow: 0 8px 18px rgba(0,150,136,0.35); transition: transform 0.15s;
}
.save:hover:not(:disabled) { transform: translateY(-1px); }
.save:disabled { opacity: 0.7; }

.state { text-align: center; padding: 40px; color: #6f8c88; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.card { background: #fff; border-radius: 18px; padding: 18px; box-shadow: 0 8px 22px rgba(15,61,57,0.08); border: 1px solid #e6edef; }
.card h2 { font-size: 16px; font-weight: 800; color: #0c3d39; }
.card .hint { font-size: 12px; color: #8aa3a0; margin: 4px 0 14px; }
.rows { display: flex; flex-direction: column; gap: 8px; }
.row { display: grid; grid-template-columns: 52px 1fr 64px 56px 56px; align-items: center; gap: 8px; }
.row.head { font-size: 11px; color: #94aaa7; font-weight: 700; padding: 0 4px; }
.row input.ic { width: 100%; text-align: center; font-size: 18px; padding: 8px 0; border: 1.5px solid #e0e8e7; border-radius: 10px; background: #f7fffc; }
.row input.lb { width: 100%; padding: 9px 10px; border: 1.5px solid #e0e8e7; border-radius: 10px; font-size: 14px; background: #f7fffc; }
.row .sort { display: flex; gap: 4px; justify-content: center; }
.row .sort button { width: 26px; height: 26px; border: 1px solid #d8e4e2; background: #f2fafa; border-radius: 8px; cursor: pointer; color: #0c3d39; font-weight: 700; }
.row .sort button:hover { background: #e2f4f1; }
.sw { display: flex; justify-content: center; }
.sw input { width: 18px; height: 18px; accent-color: #00b894; cursor: pointer; }
.del { border: 1px solid #f0c9c0; background: #fff4f1; color: #d9533c; border-radius: 8px; padding: 7px 0; font-size: 12px; cursor: pointer; }
.del:hover { background: #ffe6e0; }
.add { margin-top: 14px; width: 100%; border: 1.5px dashed #bcd9d3; background: #f3fbfa; color: #0c8f7f; border-radius: 12px; padding: 11px; font-weight: 700; cursor: pointer; font-size: 13px; }
.add:hover { background: #e6f6f3; }

.toast {
  position: fixed; top: 28px; left: 50%; transform: translateX(-50%) translateY(-20px) scale(0.95);
  background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; padding: 13px 24px; border-radius: 14px;
  font-weight: 700; box-shadow: 0 10px 30px rgba(0,150,136,0.45); opacity: 0; pointer-events: none;
  transition: opacity 0.3s, transform 0.3s; z-index: 999;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: -2px; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 860px) { .cols { grid-template-columns: 1fr; } }
</style>
