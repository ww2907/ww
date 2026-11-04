<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '搜美食、搜好店…' },
  hint: { type: String, default: '' },
  // 实时联想结果：[{ kind:'restaurant'|'dish', id, name, sub, emoji }]
  suggestions: { type: Array, default: () => [] },
  loadingSuggest: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'input', 'search', 'clear', 'select-suggestion'])

const focused = ref(false)
const rootEl = ref(null)

function onInput(e) {
  const v = e.target.value
  emit('update:modelValue', v)
  emit('input', v)
}
function onSearch() {
  emit('search', props.modelValue)
}
function onClear() {
  emit('update:modelValue', '')
  emit('clear')
}
function onFocus() {
  focused.value = true
}
function onBlur() {
  // 延迟隐藏，确保点击联想项能先触发
  setTimeout(() => (focused.value = false), 160)
}
function pick(s) {
  focused.value = false
  emit('select-suggestion', s)
}

// 点击组件外部也收起联想
function onDocClick(e) {
  if (rootEl.value && !rootEl.value.contains(e.target)) focused.value = false
}
if (typeof document !== 'undefined') {
  document.addEventListener('click', onDocClick)
}

const showPanel = computed(() => {
  if (!focused.value) return false
  // 加载中、有联想、或有关键字但无结果（展示空态）时均展开下拉
  if (loadingSuggest.value) return true
  return props.suggestions.length > 0 || !!props.modelValue.trim()
})
</script>

<template>
  <div class="sh-search-wrap" ref="rootEl">
    <div class="sh-search">
      <span class="s-icon">🔍</span>
      <input
        type="text"
        :value="modelValue"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keyup.enter="onSearch"
        :placeholder="placeholder"
      />
      <button v-if="modelValue" class="s-clear" @click="onClear" title="清空">✕</button>
      <button class="s-btn" @click="onSearch">搜索</button>
    </div>

    <!-- 实时联想下拉 -->
    <transition name="sg-fade">
      <div v-if="showPanel" class="sg-panel">
        <div v-if="loadingSuggest" class="sg-loading">
          <span class="sh-spinner"></span> 正在联想…
        </div>
        <ul v-else-if="suggestions.length" class="sg-list">
          <li
            v-for="(s, i) in suggestions"
            :key="s.kind + '-' + s.id + '-' + s.name"
            class="sg-item"
            @click="pick(s)"
          >
            <span class="sg-emoji">{{ s.emoji || '🍽️' }}</span>
            <span class="sg-text">
              <span class="sg-name">{{ s.name }}</span>
              <span class="sg-sub">{{ s.kind === 'restaurant' ? '店铺 · ' + s.sub : '菜品 · ' + s.sub }}</span>
            </span>
            <span class="sg-tag">{{ s.kind === 'restaurant' ? '店' : '菜' }}</span>
          </li>
        </ul>
        <div v-else class="sg-empty">
          🔍 未找到「{{ modelValue.trim() }}」相关的店铺或菜品
        </div>
      </div>
    </transition>

    <p v-if="hint" class="sh-search-hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.sh-search-wrap { position: relative; display: block; }
.sh-search {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.92);
  padding: 10px 12px 10px 16px;
  border-radius: 16px;
  box-shadow: 0 8px 22px rgba(0, 150, 136, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.6);
}
.sh-search .s-icon { font-size: 16px; flex: none; }
.sh-search input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--ink);
  font-family: inherit;
}
.sh-search .s-clear {
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
.sh-search .s-clear:hover { background: rgba(0, 0, 0, 0.12); }
.sh-search .s-btn {
  flex: none;
  border: none;
  cursor: pointer;
  padding: 9px 18px;
  border-radius: 11px;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  font-family: inherit;
  box-shadow: 0 6px 14px rgba(0, 150, 136, 0.35);
  transition: transform 0.15s, box-shadow 0.15s;
}
.sh-search .s-btn:hover { transform: translateY(-1px); box-shadow: 0 9px 18px rgba(0, 150, 136, 0.5); }
.sh-search .s-btn:active { transform: translateY(0); }

/* 联想下拉 */
.sg-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 14px 34px rgba(0, 80, 70, 0.22);
  border: 1px solid rgba(0, 184, 148, 0.18);
  overflow: hidden;
  z-index: 50;
  max-height: 320px;
  overflow-y: auto;
}
.sg-loading { padding: 16px; font-size: 13px; color: var(--muted); text-align: center; }
.sg-empty { padding: 18px 16px; font-size: 13px; color: var(--muted); text-align: center; line-height: 1.6; }
.sg-list { list-style: none; padding: 6px; }
.sg-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 12px; cursor: pointer;
  transition: background 0.12s;
}
.sg-item:hover { background: rgba(0, 184, 148, 0.1); }
.sg-emoji {
  width: 38px; height: 38px; flex: none; border-radius: 11px; font-size: 20px;
  background: linear-gradient(135deg, rgba(0,184,148,0.15), rgba(0,206,201,0.15));
  display: grid; place-items: center;
}
.sg-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.sg-name { font-size: 14px; font-weight: 800; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sg-sub { font-size: 11px; color: var(--muted); }
.sg-tag {
  flex: none; font-size: 11px; font-weight: 800; color: var(--deep);
  background: rgba(0, 184, 148, 0.14); padding: 3px 9px; border-radius: 999px;
}

.sg-fade-enter-active, .sg-fade-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.sg-fade-enter-from, .sg-fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* 与搜索盒之间 12px（等价首页 flex gap 16px + margin -4px）
   页面背景是渐变青绿，提示文字必须用白色 + 阴影才看得清 */
.sh-search-hint {
  margin: 12px 2px 0;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 6px rgba(0, 70, 62, 0.45);
  text-align: left;
}
</style>
