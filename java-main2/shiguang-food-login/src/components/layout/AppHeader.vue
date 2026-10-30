<script setup>
import { computed } from 'vue'

// 顶部栏：四页共用（尺寸取自首页，勿在页面内另写一套）
const props = defineProps({
  account: { type: String, default: '美食家' },
  showAdmin: { type: Boolean, default: true }
})
const emit = defineEmits(['logout', 'admin'])

const initial = computed(() => (props.account || '美').charAt(0).toUpperCase())
</script>

<template>
  <header class="sh-topbar">
    <div class="brand">
      <span class="brand-logo">🍜</span>
      <span class="brand-name">食光 · 美食</span>
    </div>
    <div class="user">
      <button v-if="showAdmin" class="admin-entry" @click="emit('admin')" title="进入后台管理系统">
        🛡️ 后台管理
      </button>
      <div class="avatar">{{ initial }}</div>
      <span class="uname">{{ account }}</span>
      <button class="logout" @click="emit('logout')">退出</button>
    </div>
  </header>
</template>

<style scoped>
.sh-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(14px);
  border-radius: 18px;
  box-shadow: var(--shadow);
  border: 1px solid rgba(255, 255, 255, 0.6);
}
.brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
.brand-logo {
  width: 38px; height: 38px; border-radius: 11px; flex: none;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  display: grid; place-items: center; font-size: 20px;
}
.brand-name {
  font-weight: 900; font-size: 17px; letter-spacing: 1px; color: var(--deep);
  white-space: nowrap;
}
.user { display: flex; align-items: center; gap: 10px; flex: none; }
.avatar {
  width: 38px; height: 38px; border-radius: 50%; flex: none;
  background: linear-gradient(135deg, var(--mint), var(--cyan));
  color: #fff; font-weight: 800; display: grid; place-items: center;
}
.uname {
  font-size: 15px; font-weight: 600; color: var(--deep);
  max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.logout {
  border: none; cursor: pointer; padding: 7px 14px; border-radius: 10px;
  background: rgba(0, 184, 148, 0.12); color: var(--deep);
  font-weight: 700; font-size: 13px; font-family: inherit;
  transition: background 0.15s;
}
.logout:hover { background: rgba(0, 184, 148, 0.25); }
.admin-entry {
  display: inline-flex; align-items: center; gap: 6px;
  border: 1.5px solid rgba(0, 150, 136, 0.45);
  background: rgba(0, 184, 148, 0.1);
  color: var(--deep); font-weight: 800; font-size: 13px; font-family: inherit;
  padding: 7px 14px; border-radius: 11px; cursor: pointer; white-space: nowrap;
  transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
}
.admin-entry:hover {
  background: rgba(0, 184, 148, 0.22);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 150, 136, 0.28);
}
.admin-entry:active { transform: translateY(0); }

@media (max-width: 720px) {
  .sh-topbar { padding: 12px 14px; border-radius: 16px; }
  .brand-name { font-size: 15px; letter-spacing: 0.5px; }
  .uname { display: none; }
  .admin-entry { padding: 7px 10px; font-size: 12px; }
}
@media (max-width: 420px) {
  .admin-entry { display: none; }
}
</style>
