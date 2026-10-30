<script setup>
// 底部 Tab 栏（移动端主导航）：四页共用，尺寸与首页一致
defineProps({
  items: { type: Array, default: () => [] },
  active: { type: String, default: '' }
})
const emit = defineEmits(['select'])
</script>

<template>
  <nav class="sh-tabbar">
    <button
      v-for="item in items"
      :key="item.key"
      class="sh-tab"
      :class="{ active: active === item.key }"
      @click="emit('select', item)"
    >
      <span class="tab-icon">{{ item.icon }}</span>
      <span class="tab-label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.sh-tabbar {
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
.sh-tab {
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
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-icon { font-size: 20px; }
.tab-label { font-size: 11px; font-weight: 700; }
.sh-tab:hover { background: rgba(0, 184, 148, 0.12); color: var(--deep); }
.sh-tab.active {
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff;
  box-shadow: 0 6px 14px rgba(0, 150, 136, 0.4);
}

@media (min-width: 861px) {
  .sh-tabbar { display: none; }
}
</style>
