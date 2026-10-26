<script setup>
import { useRouter } from 'vue-router'
import { adminSession, adminLogout } from '../../store/admin.js'

const router = useRouter()

const menus = [
  { to: '/admin/nav', icon: '🧭', label: '导航管理', desc: '顶部 / 底部导航' },
  { to: '/admin/search', icon: '🔍', label: '搜索管理', desc: '搜索框与热词' },
  { to: '/admin/recommend', icon: '🔥', label: '推荐管理', desc: '首页推荐美食' },
  { to: '/admin/dish', icon: '🍱', label: '菜品管理', desc: '分类与下单菜品' },
  { to: '/admin/user', icon: '👥', label: '用户管理', desc: '用户信息展示' },
  { to: '/admin/order', icon: '🧾', label: '订单管理', desc: '下单点餐记录' }
]

function logout() {
  adminLogout()
  router.replace('/home')
}
function backHome() {
  router.push('/home')
}
</script>

<template>
  <div class="admin">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="logo">
        <span class="mark">🍜</span>
        <div class="logo-text">
          <strong>食光 · 后台</strong>
          <small>美食数据管理</small>
        </div>
      </div>
      <nav class="menu">
        <router-link v-for="m in menus" :key="m.to" :to="m.to" class="menu-item">
          <span class="mi-icon">{{ m.icon }}</span>
          <span class="mi-text">
            <strong>{{ m.label }}</strong>
            <small>{{ m.desc }}</small>
          </span>
        </router-link>
      </nav>
      <div class="side-foot">
        <button class="ghost" @click="backHome">← 返回用户首页</button>
        <button class="ghost danger" @click="logout">退出登录</button>
      </div>
    </aside>

    <!-- 主区域 -->
    <div class="main">
      <header class="topbar">
        <div class="crumb">
          <span class="dot"></span> 后台管理系统
        </div>
        <div class="who">
          <span class="role">管理员</span>
          <span class="avatar">{{ (adminSession.account || 'A').charAt(0).toUpperCase() }}</span>
          <span class="name">{{ adminSession.account || 'admin' }}</span>
        </div>
      </header>
      <section class="content">
        <router-view />
      </section>
    </div>
  </div>
</template>

<style scoped>
.admin {
  display: flex;
  min-height: 100vh;
  background: #eef3f4;
  color: #1f2d2b;
}
/* 侧边栏 */
.sidebar {
  width: 248px;
  flex: none;
  background: linear-gradient(180deg, #0f3d39, #0c2f2c);
  color: #cfeee8;
  display: flex;
  flex-direction: column;
  padding: 22px 16px;
  position: sticky;
  top: 0;
  height: 100vh;
}
.logo { display: flex; align-items: center; gap: 12px; padding: 4px 8px 20px; }
.logo .mark {
  width: 42px; height: 42px; border-radius: 12px;
  background: linear-gradient(135deg, #00b894, #00cec9);
  display: grid; place-items: center; font-size: 22px;
}
.logo-text { display: flex; flex-direction: column; }
.logo-text strong { color: #fff; font-size: 16px; }
.logo-text small { color: #7fcfc4; font-size: 11px; margin-top: 2px; }

.menu { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; flex: 1; }
.menu-item {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 12px; border-radius: 12px;
  color: #b9e3dc; text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.menu-item .mi-icon { font-size: 19px; }
.menu-item .mi-text { display: flex; flex-direction: column; line-height: 1.25; }
.menu-item .mi-text strong { font-size: 14px; font-weight: 700; }
.menu-item .mi-text small { font-size: 11px; color: #6fb8ad; }
.menu-item:hover { background: rgba(0, 206, 201, 0.12); color: #fff; }
.menu-item.router-link-active {
  background: linear-gradient(135deg, #00b894, #00cec9);
  color: #fff;
  box-shadow: 0 8px 18px rgba(0, 150, 136, 0.4);
}
.menu-item.router-link-active .mi-text small { color: rgba(255, 255, 255, 0.85); }

.side-foot { display: flex; flex-direction: column; gap: 8px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.1); }
.ghost {
  border: 1px solid rgba(255,255,255,0.18);
  background: transparent; color: #cdeee8;
  padding: 9px; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600;
  transition: background 0.15s;
}
.ghost:hover { background: rgba(255,255,255,0.1); }
.ghost.danger { color: #ffb3a3; border-color: rgba(255,120,100,0.4); }
.ghost.danger:hover { background: rgba(255,90,70,0.16); }

/* 主区域 */
.main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.topbar {
  height: 62px; flex: none;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 26px; background: #fff; border-bottom: 1px solid #e3ebee;
  position: sticky; top: 0; z-index: 10;
}
.crumb { display: flex; align-items: center; gap: 9px; font-weight: 800; color: #0c3d39; font-size: 15px; }
.crumb .dot { width: 9px; height: 9px; border-radius: 50%; background: linear-gradient(135deg, #00b894, #00cec9); }
.who { display: flex; align-items: center; gap: 10px; }
.who .role { font-size: 12px; color: #7a8c89; }
.who .avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: linear-gradient(135deg, #00b894, #00cec9); color: #fff;
  display: grid; place-items: center; font-weight: 800;
}
.who .name { font-size: 14px; font-weight: 700; color: #0c3d39; }

.content { padding: 24px 26px 40px; overflow: auto; }
</style>
