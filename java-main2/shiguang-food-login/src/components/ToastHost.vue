<script setup>
// 全局轻提示宿主：挂在 App.vue 根节点，渲染 useToast 单例状态
import { useToast } from '../composables/useToast.js'

const { state } = useToast()

const icons = {
  success: '✅',
  error: '⚠️',
  info: '💬'
}
</script>

<template>
  <transition name="toast-fade">
    <div v-if="state.visible" class="toast-host" :class="'t-' + state.type" role="status">
      <span class="t-ico">{{ icons[state.type] || icons.info }}</span>
      <span class="t-msg">{{ state.message }}</span>
    </div>
  </transition>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 28px;
  left: 50%;
  transform: translateX(-50%) translateY(0) scale(1);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: calc(100% - 32px);
  padding: 13px 22px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  box-shadow: 0 10px 30px rgba(0, 150, 136, 0.45);
  z-index: 9999;
}
.toast-host.t-success { background: linear-gradient(135deg, #00b894, #0a9b8a); }
.toast-host.t-error { background: linear-gradient(135deg, #ff7675, #d63031); }
.toast-host.t-info { background: linear-gradient(135deg, #0984e3, #00cec9); }
.t-ico { font-size: 16px; flex: none; }
.t-msg { line-height: 1.4; }

.toast-fade-enter-active,
.toast-fade-leave-active { transition: opacity 0.28s ease, transform 0.28s ease; }
.toast-fade-enter-from,
.toast-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(-16px) scale(0.95); }
</style>
