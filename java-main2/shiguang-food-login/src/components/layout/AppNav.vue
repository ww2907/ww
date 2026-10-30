<script setup>
// 顶部横向导航（桌面端）：四页共用，尺寸与首页一致
defineProps({
  items: { type: Array, default: () => [] },
  active: { type: String, default: '' }
})
const emit = defineEmits(['select'])
</script>

<template>
  <nav class="sh-nav">
    <button
      v-for="item in items"
      :key="item.key"
      class="sh-nav-item"
      :class="{ active: active === item.key }"
      @click="emit('select', item)"
    >
      <span class="nav-icon">{{ item.icon }}</span>
      <span class="nav-label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.sh-nav {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 8px 22px rgba(0, 150, 136, 0.14);
}
.sh-nav-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: none;
  background: transparent;
  color: var(--muted);
  padding: 10px 6px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.sh-nav-item .nav-icon { font-size: 17px; }
.sh-nav-item:hover { background: rgba(0, 184, 148, 0.12); color: var(--deep); }
.sh-nav-item.active {
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff;
  box-shadow: 0 6px 16px rgba(0, 150, 136, 0.4);
}

@media (max-width: 860px) {
  .sh-nav { display: none; }
}
</style>
