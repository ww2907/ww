<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { register, getCaptcha, PW_MIN, PW_MAX, CAPTCHA_LEN, validAccount } from '../api/auth.js'

const router = useRouter()

// 密码规则：6-12 位；昵称上限 20
const NICK_MAX = 20

const account = ref('')
const password = ref('')
const confirm = ref('')
const nickname = ref('')
const captchaCode = ref('')
const agree = ref(false)
const showPw = ref(false)
const showConfirm = ref(false)
const loading = ref(false)

const errAccount = ref(false)
const errPassword = ref(false)
const errConfirm = ref(false)
const errConfirmMsg = ref('两次输入的密码不一致')
const errCaptcha = ref(false)
const errCaptchaMsg = ref('请输入验证码')
const errAgree = ref(false)

const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null

// 图片验证码状态
const captchaImg = ref('')
const captchaId = ref('')
const captchaLoading = ref(false)

// 密码规则：长度必须在 6-12 位之间
function validPassword(v) {
  return v.length >= PW_MIN && v.length <= PW_MAX
}

// 密码强度：0 无效 / 1 弱 / 2 中 / 3 强
const strength = computed(() => {
  const v = password.value
  if (!validPassword(v)) return 0
  let score = 0
  if (/[a-z]/.test(v)) score++
  if (/[A-Z]/.test(v)) score++
  if (/\d/.test(v)) score++
  if (/[^A-Za-z0-9]/.test(v)) score++
  if (v.length >= 10) score++
  return score <= 2 ? 1 : score <= 3 ? 2 : 3
})
const strengthText = computed(() => ['', '弱', '中', '强'][strength.value])

// 密码长度实时计数
const pwCount = computed(() => `${password.value.length} / ${PW_MAX}`)

// 输入时即时清除对应错误，提升体验
function clearAccountErr() { if (validAccount(account.value.trim())) errAccount.value = false }
function clearPwErr() { if (validPassword(password.value)) errPassword.value = false }
function clearConfirmErr() {
  if (confirm.value && confirm.value === password.value) {
    errConfirm.value = false
  }
}
function clearAgreeErr() { if (agree.value) errAgree.value = false }
function clearCaptchaErr() { if (captchaCode.value.trim().length === CAPTCHA_LEN) errCaptcha.value = false }

function showToast(msg) {
  toastMsg.value = msg
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2200)
}

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

async function onSubmit() {
  let ok = true
  if (!validAccount(account.value.trim())) { errAccount.value = true; ok = false } else errAccount.value = false
  if (!validPassword(password.value)) { errPassword.value = true; ok = false } else errPassword.value = false
  if (confirm.value.length === 0) { errConfirm.value = true; errConfirmMsg.value = '请再次输入密码'; ok = false }
  else if (confirm.value !== password.value) { errConfirm.value = true; errConfirmMsg.value = '两次输入的密码不一致'; ok = false }
  else errConfirm.value = false
  if (captchaCode.value.trim().length !== CAPTCHA_LEN) {
    errCaptcha.value = true
    errCaptchaMsg.value = `请输入 ${CAPTCHA_LEN} 位验证码`
    ok = false
  } else errCaptcha.value = false
  if (!agree.value) { errAgree.value = true; ok = false } else errAgree.value = false

  if (!ok) return

  loading.value = true
  try {
    await register({
      account: account.value.trim(),
      password: password.value,
      nickname: nickname.value.trim() || '美食家',
      captchaId: captchaId.value,
      captchaCode: captchaCode.value.trim()
    })
    showToast('注册成功，请登录 🎉')
    router.push('/login')
  } catch (e) {
    loading.value = false
    showToast(e.message || '注册失败，请重试')
    // 验证码一次性使用：无论失败原因，都刷新验证码
    refreshCaptcha()
  }
}

onMounted(refreshCaptcha)
onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <form class="auth-card" @submit.prevent="onSubmit" novalidate>
    <div class="top">
      <h2>创建<span>账号</span> ✨</h2>
      <p>加入食光，开启你的美食旅程</p>
    </div>

    <div class="field">
      <label for="reg-account">用户名</label>
      <div class="input">
        <span class="icon">👤</span>
        <input type="text" id="reg-account" v-model="account" placeholder="3-20 位字母、数字或下划线" autocomplete="username" @input="clearAccountErr" />
      </div>
      <div class="err" v-show="errAccount">用户名需为3-20位字母、数字或下划线</div>
    </div>

    <div class="field">
      <label for="reg-nickname">昵称（选填）</label>
      <div class="input">
        <span class="icon">🍴</span>
        <input type="text" id="reg-nickname" v-model="nickname" :maxlength="NICK_MAX" placeholder="给自己起个可爱名字" />
      </div>
    </div>

    <div class="field">
      <label for="reg-code">验证码</label>
      <div class="input captcha-input">
        <span class="icon">🛡️</span>
        <input type="text" id="reg-code" v-model="captchaCode" :maxlength="CAPTCHA_LEN" placeholder="输入右侧字符" autocomplete="off" @input="clearCaptchaErr" />
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

    <div class="field">
      <label for="reg-password">密码</label>
      <div class="input">
        <span class="icon">🔒</span>
        <input :type="showPw ? 'text' : 'password'" id="reg-password" v-model="password" :maxlength="PW_MAX" placeholder="6-12 位，建议含字母与数字" autocomplete="new-password" @input="clearPwErr" />
        <span class="toggle" @click="showPw = !showPw">{{ showPw ? '隐藏' : '显示' }}</span>
      </div>
      <div class="pw-meta">
        <div class="meter" :class="'lv' + strength" v-show="password">
          <span></span><span></span><span></span>
        </div>
        <div class="strength-label" :class="'lv' + strength" v-show="password">{{ strengthText }}</div>
        <div class="count" :class="{ over: password.length > PW_MAX }">{{ pwCount }}</div>
      </div>
      <div class="err" v-show="errPassword">密码长度需为 6-12 位</div>
    </div>

    <div class="field">
      <label for="reg-confirm">确认密码</label>
      <div class="input">
        <span class="icon">🔑</span>
        <input :type="showConfirm ? 'text' : 'password'" id="reg-confirm" v-model="confirm" :maxlength="PW_MAX" placeholder="再次输入密码" autocomplete="new-password" @input="clearConfirmErr" />
        <span class="toggle" @click="showConfirm = !showConfirm">{{ showConfirm ? '隐藏' : '显示' }}</span>
      </div>
      <div class="err" v-show="errConfirm">{{ errConfirmMsg }}</div>
    </div>

    <div class="row">
      <label><input type="checkbox" v-model="agree" @change="clearAgreeErr" /> 我已阅读并同意《用户协议》</label>
    </div>
    <div class="err" v-show="errAgree" style="margin-top:-14px;margin-bottom:14px">请先同意用户协议</div>

    <button type="submit" class="btn-primary" :class="{ loading }" :disabled="loading">
      <span v-if="loading"><span class="spinner"></span> 注册中…</span>
      <span v-else>注 册</span>
    </button>

    <div class="signup">已有账号？ <router-link to="/login">返回登录</router-link></div>
  </form>

  <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
</template>

<style scoped>
.auth-card {
  width: 100%;
  background: var(--card);
  backdrop-filter: blur(16px);
  border-radius: 28px;
  padding: 38px 38px;
  box-shadow: var(--shadow);
  border: 1px solid rgba(255, 255, 255, 0.6);
  animation: cardIn 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(34px) scale(0.97); }
  to { opacity: 1; transform: none; }
}

.auth-card .top { text-align: center; margin-bottom: 24px; }
.auth-card .top h2 { font-size: 26px; font-weight: 900; }
.auth-card .top h2 span {
  background: linear-gradient(90deg, var(--teal), var(--cyan), var(--mint));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  background-size: 200% auto;
  animation: flow 4s linear infinite;
}
@keyframes flow { to { background-position: 200% center; } }
.auth-card .top p { margin-top: 8px; font-size: 14px; color: var(--muted); }

.field { margin-bottom: 16px; }
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

/* 密码长度计数 + 强度条 */
.pw-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  min-height: 16px;
}
.meter { display: flex; gap: 5px; width: 150px; }
.meter span {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--line);
  transition: background 0.25s;
}
.meter.lv1 span:nth-child(1) { background: #e5533c; }
.meter.lv2 span:nth-child(1),
.meter.lv2 span:nth-child(2) { background: #f6b73c; }
.meter.lv3 span { background: var(--teal); }
.strength-label { font-size: 12px; font-weight: 700; }
.strength-label.lv1 { color: #e5533c; }
.strength-label.lv2 { color: #e0992e; }
.strength-label.lv3 { color: var(--teal); }
.count {
  margin-left: auto;
  font-size: 12px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.count.over { color: #e5533c; }

.row { font-size: 13px; margin: 4px 0 14px; }
.row label { display: flex; align-items: center; gap: 7px; cursor: pointer; color: var(--muted); }
.row input[type='checkbox'] { width: 16px; height: 16px; accent-color: var(--teal); }

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

.signup { text-align: center; margin-top: 22px; font-size: 14px; color: var(--muted); }
.signup a { color: var(--teal); font-weight: 700; text-decoration: none; }
.signup a:hover { text-decoration: underline; }

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
