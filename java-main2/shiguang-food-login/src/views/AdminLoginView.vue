<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminLogin } from '../api/admin.js'

const router = useRouter()

const account = ref('')
const password = ref('')
const showPw = ref(false)
const loading = ref(false)
const errAccount = ref(false)
const errPassword = ref(false)
const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null

function showToast(msg) {
  toastMsg.value = msg
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2200)
}

const pwCount = computed(() => `${password.value.length} / 12`)

function togglePw() { showPw.value = !showPw.value }

async function onSubmit() {
  let ok = true
  if (!account.value.trim()) { errAccount.value = true; ok = false } else errAccount.value = false
  if (password.value.length < 1) { errPassword.value = true; ok = false } else errPassword.value = false
  if (!ok) return

  loading.value = true
  try {
    const res = await adminLogin({ account: account.value, password: password.value })
    showToast('登录成功，进入后台管理系统 🎉')
    router.replace('/admin')
  } catch (e) {
    loading.value = false
    showToast(e.message || '登录失败，请重试')
  }
}

function backHome() { router.push('/home') }

onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <form class="admin-login" @submit.prevent="onSubmit" novalidate>
    <div class="badge">🔐 后台管理</div>
    <div class="top">
      <h2>管理员<span>登录</span></h2>
      <p>食光 · 美食 后台管理系统</p>
    </div>

    <div class="field">
      <label for="a-account">管理员账号</label>
      <div class="input">
        <span class="icon">👤</span>
        <input type="text" id="a-account" v-model="account" placeholder="请输入管理员账号" autocomplete="username" />
      </div>
      <div class="err" v-show="errAccount">请输入管理员账号</div>
    </div>

    <div class="field">
      <label for="a-password">密码</label>
      <div class="input">
        <span class="icon">🔒</span>
        <input
          :type="showPw ? 'text' : 'password'"
          id="a-password"
          v-model="password"
          :maxlength="12"
          placeholder="请输入密码"
          autocomplete="current-password"
        />
        <span class="toggle" @click="togglePw">{{ showPw ? '隐藏' : '显示' }}</span>
      </div>
      <div class="pw-meta"><div class="count">{{ pwCount }}</div></div>
      <div class="err" v-show="errPassword">请输入密码</div>
    </div>

    <button type="submit" class="btn-primary" :class="{ loading }" :disabled="loading">
      <span v-if="loading"><span class="spinner"></span> 登录中…</span>
      <span v-else>登 录 后 台</span>
    </button>

    <div class="tip">演示账号：<b>admin</b> / 密码：<b>admin123</b></div>

    <button type="button" class="back" @click="backHome">← 返回用户首页</button>
  </form>

  <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
</template>

<style scoped>
.admin-login {
  width: 100%;
  background: var(--card);
  backdrop-filter: blur(16px);
  border-radius: 28px;
  padding: 42px 38px;
  box-shadow: var(--shadow);
  border: 1px solid rgba(255, 255, 255, 0.6);
  animation: cardIn 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(34px) scale(0.97); }
  to { opacity: 1; transform: none; }
}
.badge {
  display: inline-block;
  margin: 0 auto 14px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(0, 184, 148, 0.12);
  color: var(--deep);
  font-size: 13px;
  font-weight: 700;
}
.admin-login .top { text-align: center; margin-bottom: 26px; }
.admin-login .top h2 { font-size: 26px; font-weight: 900; }
.admin-login .top h2 span {
  background: linear-gradient(90deg, var(--teal), var(--cyan), var(--mint));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.admin-login .top p { margin-top: 8px; font-size: 14px; color: var(--muted); }

.field { margin-bottom: 18px; }
.field label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; color: var(--ink); }
.field .input { position: relative; }
.field input {
  width: 100%;
  padding: 14px 16px 14px 44px;
  border: 1.5px solid var(--line);
  border-radius: 14px;
  font-size: 15px;
  color: var(--ink);
  background: #f7fffc;
  transition: border-color 0.25s, box-shadow 0.25s;
  outline: none;
}
.field input:focus {
  border-color: var(--cyan);
  box-shadow: 0 0 0 4px rgba(0, 206, 201, 0.18), 0 0 18px rgba(85, 239, 196, 0.3);
}
.field .icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  font-size: 18px; opacity: 0.6;
}
.field .toggle {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  cursor: pointer; font-size: 13px; color: var(--muted); user-select: none;
}
.err { color: #e5533c; font-size: 12px; margin-top: 6px; }
.pw-meta { display: flex; align-items: center; gap: 10px; margin-top: 8px; min-height: 16px; }
.count { margin-left: auto; font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }

.btn-primary {
  width: 100%; padding: 15px; border: none; border-radius: 14px;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff; font-size: 16px; font-weight: 800; letter-spacing: 1px; cursor: pointer;
  box-shadow: 0 10px 24px rgba(0, 150, 136, 0.4);
  transition: transform 0.15s, box-shadow 0.15s;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(0, 150, 136, 0.55); }
.btn-primary:active { transform: translateY(0); }
.btn-primary.loading { pointer-events: none; opacity: 0.85; }
.spinner {
  display: inline-block; width: 18px; height: 18px;
  border: 3px solid rgba(255, 255, 255, 0.4); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: -4px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.tip { text-align: center; margin-top: 18px; font-size: 12px; color: var(--muted); }
.tip b { color: var(--deep); }
.back {
  display: block; width: 100%; margin-top: 14px; padding: 10px;
  border: 1.5px solid var(--line); border-radius: 12px; background: transparent;
  color: var(--muted); font-size: 13px; font-weight: 600; cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.back:hover { border-color: var(--cyan); color: var(--deep); }

.toast {
  position: fixed; top: 28px; left: 50%;
  transform: translateX(-50%) translateY(-20px) scale(0.95);
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff; padding: 14px 26px; border-radius: 14px; font-weight: 700;
  box-shadow: 0 10px 30px rgba(0, 150, 136, 0.45);
  opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s; z-index: 999;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
</style>
