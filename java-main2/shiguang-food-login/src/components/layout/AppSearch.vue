<script setup>
// 搜索框 + 提示行：四页共用，盒子高度与首页完全一致
const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '搜美食、搜好店…' },
  hint: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue', 'input', 'search', 'clear'])

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
</script>

<template>
  <div class="sh-search-wrap">
    <div class="sh-search">
      <span class="s-icon">🔍</span>
      <input
        type="text"
        :value="modelValue"
        @input="onInput"
        @keyup.enter="onSearch"
        :placeholder="placeholder"
      />
      <button v-if="modelValue" class="s-clear" @click="onClear" title="清空">✕</button>
      <button class="s-btn" @click="onSearch">搜索</button>
    </div>
    <p v-if="hint" class="sh-search-hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.sh-search-wrap { display: block; }
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
