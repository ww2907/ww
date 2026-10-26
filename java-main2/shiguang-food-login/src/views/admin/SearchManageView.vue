<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getSearchConfig, updateSearchConfig } from '../../api/admin.js'

const placeholder = ref('')
const hotwordsText = ref('')
const loading = ref(false)
const saving = ref(false)
const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null

function showToast(msg) {
  toastMsg.value = msg; toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2000)
}

onMounted(async () => {
  loading.value = true
  try {
    const cfg = await getSearchConfig()
    placeholder.value = cfg.placeholder
    hotwordsText.value = (cfg.hotwords || []).join('，')
  } catch (e) { showToast(e.message || '加载失败') } finally { loading.value = false }
})

async function save() {
  saving.value = true
  const hotwords = hotwordsText.value
    .split(/[，,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  try {
    await updateSearchConfig({ placeholder: placeholder.value.trim(), hotwords })
    showToast('搜索配置已保存，首页搜索框已同步 ✅')
  } catch (e) { showToast(e.message || '保存失败') } finally { saving.value = false }
}

onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>🔍 搜索管理</h1>
        <p>配置首页搜索框的占位文案与「热门搜索」词。保存后首页搜索栏实时生效。</p>
      </div>
      <button class="save" :disabled="saving" @click="save">
        <span v-if="saving"><span class="spinner"></span> 保存中…</span>
        <span v-else>💾 保存配置</span>
      </button>
    </div>

    <div v-if="loading" class="state"><span class="spinner"></span> 加载中…</div>

    <div v-else class="card">
      <div class="field">
        <label>搜索框占位文案</label>
        <input v-model="placeholder" maxlength="40" placeholder="例如：搜美食、搜好店，回车进入美食页…" />
        <small>将显示在首页搜索框内的灰色提示文字。</small>
      </div>
      <div class="field">
        <label>热门搜索词</label>
        <textarea v-model="hotwordsText" rows="3" placeholder="用逗号或空格分隔，例如：牛肉面，火锅，轻食"></textarea>
        <small>多个热词用「，」或空格分隔，将以标签形式展示在搜索区。</small>
      </div>

      <div class="preview">
        <div class="pv-title">首页搜索框预览</div>
        <div class="pv-search">
          <span class="pv-ic">🔍</span>
          <span class="pv-ph">{{ placeholder || '搜索占位文案…' }}</span>
        </div>
        <div class="pv-hot">
          <span class="pv-h-label">🔥 热门：</span>
          <span class="pv-tag" v-for="(w, i) in hotwordsText.split(/[，,\s]+/).filter(Boolean)" :key="i">{{ w }}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
</template>

<style scoped>
.page { max-width: 760px; }
.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.page-head h1 { font-size: 22px; font-weight: 900; color: #0c3d39; }
.page-head p { margin-top: 6px; font-size: 13px; color: #6f8c88; line-height: 1.6; }
.save { flex: none; border: none; cursor: pointer; padding: 11px 20px; border-radius: 12px; background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; font-weight: 800; font-size: 14px; box-shadow: 0 8px 18px rgba(0,150,136,0.35); }
.save:hover:not(:disabled) { transform: translateY(-1px); }
.save:disabled { opacity: 0.7; }

.state { text-align: center; padding: 40px; color: #6f8c88; }
.card { background: #fff; border-radius: 18px; padding: 22px; box-shadow: 0 8px 22px rgba(15,61,57,0.08); border: 1px solid #e6edef; }
.field { margin-bottom: 20px; }
.field label { display: block; font-size: 13px; font-weight: 700; color: #0c3d39; margin-bottom: 8px; }
.field input, .field textarea {
  width: 100%; padding: 12px 14px; border: 1.5px solid #e0e8e7; border-radius: 12px;
  font-size: 14px; background: #f7fffc; outline: none; font-family: inherit; resize: vertical;
}
.field input:focus, .field textarea:focus { border-color: #00cec9; box-shadow: 0 0 0 3px rgba(0,206,201,0.16); }
.field small { display: block; margin-top: 6px; font-size: 12px; color: #94aaa7; }

.preview { margin-top: 8px; padding: 18px; border-radius: 14px; background: #f3fbfa; border: 1px dashed #bcd9d3; }
.pv-title { font-size: 12px; font-weight: 700; color: #0c8f7f; margin-bottom: 10px; }
.pv-search { display: flex; align-items: center; gap: 10px; background: #fff; padding: 12px 16px; border-radius: 14px; box-shadow: 0 4px 12px rgba(0,150,136,0.12); }
.pv-ic { opacity: 0.6; }
.pv-ph { color: #9bb0ad; font-size: 14px; }
.pv-hot { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 12px; }
.pv-h-label { font-size: 12px; color: #6f8c88; }
.pv-tag { font-size: 12px; color: #0c3d39; background: rgba(0,184,148,0.12); padding: 4px 12px; border-radius: 999px; }

.toast { position: fixed; top: 28px; left: 50%; transform: translateX(-50%) translateY(-20px) scale(0.95); background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; padding: 13px 24px; border-radius: 14px; font-weight: 700; box-shadow: 0 10px 30px rgba(0,150,136,0.45); opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s; z-index: 999; }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: -2px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
