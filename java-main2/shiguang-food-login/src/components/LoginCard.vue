<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { setSession } from '../store.js'
import { login, getCaptcha, PW_MAX, CAPTCHA_LEN, validAccount } from '../api/auth.js'

const router = useRouter()

const account = ref('')
const password = ref('')
const captchaCode = ref('')
const remember = ref(false)
const showPw = ref(false)
const loading = ref(false)
const errAccount = ref(false)
const errPassword = ref(false)
const errCaptcha = ref(false)
const errCaptchaMsg = ref('请输入验证码')
const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null

// 图片验证码状态
const captchaImg = ref('')
const captchaId = ref('')
const captchaLoading = ref(false)

function showToast(msg) {
  toastMsg.value = msg
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2200)
}

function togglePw() {
  showPw.value = !showPw.value
}

// 密码长度实时计数（与注册页一致）
const pwCount = computed(() => `${password.value.length} / ${PW_MAX}`)

// 拉取 / 刷新图片验证码
async function refreshCaptcha() {
  captchaLoading.value = true
  try {
    const cap = await getCaptcha()
    captchaId.value = cap.captchaId
    captchaImg.value = cap.image
    captchaCode.value = ''
  } catch (e) {
    showToast(e.message || '验证码加载失败')
  } finally {
    captchaLoading.value = false
  }
}

function clearCaptchaErr() {
  if (captchaCode.value.trim().length === CAPTCHA_LEN) errCaptcha.value = false
}

async function onSubmit() {
  let ok = true
  if (!validAccount(account.value.trim())) {
    errAccount.value = true
    ok = false
  } else {
    errAccount.value = false
  }

  if (password.value.length < 6 || password.value.length > PW_MAX) {
    errPassword.value = true
    ok = false
  } else {
    errPassword.value = false
  }

  if (captchaCode.value.trim().length !== CAPTCHA_LEN) {
    errCaptcha.value = true
    errCaptchaMsg.value = `请输入 ${CAPTCHA_LEN} 位验证码`
    ok = false
  } else {
    errCaptcha.value = false
  }

  if (!ok) return

  loading.value = true
  try {
    const res = await login({
      account: account.value.trim(),
      password: password.value,
      captchaId: captchaId.value,
      captchaCode: captchaCode.value.trim()
    })
    setSession(res.account, res.token, remember.value)
    showToast('登录成功，欢迎回到食光！🎉')
    console.log('登录成功，token：', res.token, '记住我：', remember.value)
    router.push('/home')
  } catch (e) {
    loading.value = false
    showToast(e.message || '登录失败，请重试')
    // 验证码一次性使用：无论失败原因，都刷新验证码
    refreshCaptcha()
  }
}

function socialLogin(name) {
  showToast('正在跳转 ' + name + ' 授权…')
}

onMounted(refreshCaptcha)
onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <form class="login-card" @submit.prevent="onSubmit" novalidate>
    <div class="top">
      <h2>欢迎<span>回来</span> 👋</h2>
      <p>登录你的食光账号，继续美食之旅</p>
    </div>

    <div class="field">
      <label for="account">用户名</label>
      <div class="input">
        <span class="icon">👤</span>
        <input
          type="text"
          id="account"
          v-model="account"
          placeholder="请输入用户名"
          autocomplete="username"
        />
      </div>
      <div class="err" v-show="errAccount">用户名需为3-20位字母、数字或下划线</div>
    </div>

    <div class="field">
      <label for="password">密码</label>
      <div class="input">
        <span class="icon">🔒</span>
        <input
          :type="showPw ? 'text' : 'password'"
          id="password"
          v-model="password"
          :maxlength="PW_MAX"
          placeholder="6-12 位"
          autocomplete="current-password"
        />
        <span class="toggle" @click="togglePw">{{ showPw ? '隐藏' : '显示' }}</span>
      </div>
      <div class="pw-meta">
        <div class="count" :class="{ over: password.length > PW_MAX }">{{ pwCount }}</div>
      </div>
      <div class="err" v-show="errPassword">密码长度需为 6-12 位</div>
    </div>

    <div class="field">
      <label for="captcha">验证码</label>
      <div class="input captcha-input">
        <span class="icon">🛡️</span>
        <input
          type="text"
          id="captcha"
          v-model="captchaCode"
          :maxlength="CAPTCHA_LEN"
          placeholder="输入右侧字符"
          autocomplete="off"
          @input="clearCaptchaErr"
        />
        <img
          v-if="captchaImg"
          :src="captchaImg"
          class="captcha-img"
          alt="验证码"
          title="看不清？点击刷新"
          @click="refreshCaptcha"
        />
        <button v-else type="button" class="captcha-img captcha-ph" @click="refreshCaptcha">
          {{ captchaLoading ? '加载中…' : '点击获取' }}
        </button>
      </div>
      <div class="err" v-show="errCaptcha">{{ errCaptchaMsg }}</div>
    </div>

    <div class="row">
      <label><input type="checkbox" v-model="remember" /> 记住我</label>
      <router-link to="/forgot">忘记密码？</router-link>
    </div>

    <button type="submit" class="btn-primary" :class="{ loading }" :disabled="loading">
      <span v-if="loading"><span class="spinner"></span> 登录中…</span>
      <span v-else>登 录</span>
    </button>

    <div class="divider">或使用以下方式登录</div>

    <div class="socials">
      <button type="button" @click="socialLogin('微信')">💬 微信</button>
      <button type="button" @click="socialLogin('QQ')">🐧 QQ</button>
      <button type="button" @click="socialLogin('Apple')">🍎 Apple</button>
    </div>

    <div class="signup">还没有账号？ <router-link to="/register">立即注册</router-link></div>
  </form>

  <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
</template>

<style scoped>
.login-card {
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

.login-card .top { text-align: center; margin-bottom: 28px; }
.login-card .top h2 { font-size: 26px; font-weight: 900; }
.login-card .top h2 span {
  background: linear-gradient(90deg, var(--teal), var(--cyan), var(--mint));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  background-size: 200% auto;
  animation: flow 4s linear infinite;
}
@keyframes flow { to { background-position: 200% center; } }
.login-card .top p { margin-top: 8px; font-size: 14px; color: var(--muted); }

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
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  opacity: 0.6;
  transition: opacity 0.25s;
}
.field input:focus ~ .icon { opacity: 1; }
.field .toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 13px;
  color: var(--muted);
  user-select: none;
}
.err { color: #e5533c; font-size: 12px; margin-top: 6px; }

/* 验证码输入框：右侧给图片留位 */
.field .captcha-input input { padding-right: 148px; }
.captcha-img {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  height: 38px;
  width: 128px;
  border-radius: 10px;
  border: 1px solid var(--line);
  cursor: pointer;
  user-select: none;
}
.captcha-img:hover { border-color: var(--cyan); }
.captcha-ph {
  background: #e6fffa;
  color: var(--teal);
  font-size: 12px;
  font-weight: 700;
}

/* 密码长度实时计数（与注册页一致） */
.pw-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  min-height: 16px;
}
.count {
  margin-left: auto;
  font-size: 12px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.count.over { color: #e5533c; }

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  margin: 6px 0 22px;
}
.row label { display: flex; align-items: center; gap: 7px; cursor: pointer; color: var(--muted); }
.row input[type='checkbox'] { width: 16px; height: 16px; accent-color: var(--teal); }
.row a { color: var(--teal); text-decoration: none; font-weight: 600; }
.row a:hover { text-decoration: underline; }

.btn-primary {
  position: relative;
  overflow: hidden;
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 1px;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(0, 150, 136, 0.4);
  transition: transform 0.15s, box-shadow 0.15s;
}
.btn-primary::after {
  content: "";
  position: absolute;
  top: 0;
  left: -130%;
  width: 60%;
  height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.55), transparent);
  transform: skewX(-20deg);
  animation: shimmer 3.2s infinite;
}
@keyframes shimmer { 0% { left: -130%; } 55%, 100% { left: 140%; } }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(0, 150, 136, 0.55); }
.btn-primary:active { transform: translateY(0); }
.btn-primary.loading { pointer-events: none; opacity: 0.85; }
.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 3px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  vertical-align: -4px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 26px 0;
  color: var(--muted);
  font-size: 12px;
}
.divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: var(--line); }

.socials { display: flex; gap: 14px; }
.socials button {
  flex: 1;
  padding: 12px;
  border: 1.5px solid var(--line);
  border-radius: 14px;
  background: #f7fffc;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, background 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.socials button:hover {
  transform: translateY(-3px);
  border-color: var(--cyan);
  background: #e6fffa;
  box-shadow: 0 8px 18px rgba(0, 206, 201, 0.22);
}

.signup { text-align: center; margin-top: 26px; font-size: 14px; color: var(--muted); }
.signup a { color: var(--teal); font-weight: 700; text-decoration: none; }
.signup a:hover { text-decoration: underline; }

/* 成功提示 */
.toast {
  position: fixed;
  top: 28px;
  left: 50%;
  transform: translateX(-50%) translateY(-20px) scale(0.95);
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff;
  padding: 14px 26px;
  border-radius: 14px;
  font-weight: 700;
  box-shadow: 0 10px 30px rgba(0, 150, 136, 0.45);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s, transform 0.3s;
  z-index: 999;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
</style>
