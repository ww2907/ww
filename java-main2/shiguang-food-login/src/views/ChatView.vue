<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderDetail } from '../api/order.js'
import { openChatConversation, getChatMessages, sendChatMessage } from '../api/chat.js'
import { session } from '../store.js'
import { toast } from '../composables/useToast.js'
import { useShellNav } from '../composables/useShellNav.js'
import AppHeader from '../components/layout/AppHeader.vue'

// ============================================================
// 订单聊天页（用户端）
// ------------------------------------------------------------
// 入口：我的订单卡片 / 订单详情弹窗的「去对话」
// 一单一会话；进入即按 orderId 打开会话，之后每 3 秒拉一次新消息。
// ============================================================

const route = useRoute()
const router = useRouter()
const { account, showAdmin, goAdmin, logout } = useShellNav('order')

const orderId = computed(() => Number(route.params.orderId))
const order = ref(null)
const conversation = ref(null)
const messages = ref([])
const loading = ref(true)
const errMsg = ref('')
const input = ref('')
const sending = ref(false)
const listEl = ref(null)

let timer = null
let lastSignature = ''
let stickToBottom = true

const quickPhrases = [
  '请问什么时候出餐？',
  '我的订单到哪了？',
  '麻烦少放辣，谢谢～',
  '可以帮我加一双筷子吗？'
]

const canSend = computed(() => !!conversation.value && input.value.trim().length > 0 && !sending.value)

function timeLabel(t) {
  if (!t) return ''
  // 今天的消息只显示 HH:mm，跨天显示完整日期
  const today = new Date()
  const p = (n) => String(n).padStart(2, '0')
  const prefix = `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`
  return t.startsWith(prefix) ? t.slice(11) : t
}

async function scrollToBottom(force = false) {
  await nextTick()
  const el = listEl.value
  if (!el) return
  if (force || stickToBottom) el.scrollTop = el.scrollHeight
}

function onListScroll() {
  const el = listEl.value
  if (!el) return
  stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
}

function signatureOf(list) {
  return list.map((m) => `${m.id}:${m.content}`).join('|')
}

async function loadAll() {
  loading.value = true
  errMsg.value = ''
  try {
    if (!orderId.value) throw new Error('缺少订单信息')
    const detail = await getOrderDetail(orderId.value)
    if (!detail) throw new Error('订单不存在或已被删除')
    order.value = detail
    conversation.value = await openChatConversation(orderId.value, session.account)
    messages.value = await getChatMessages(conversation.value.id, session.account)
    lastSignature = signatureOf(messages.value)
    await scrollToBottom(true)
    stickToBottom = true
  } catch (e) {
    errMsg.value = e.message || '聊天加载失败'
  } finally {
    loading.value = false
  }
}

async function refreshMessages() {
  if (!conversation.value) return
  try {
    const list = await getChatMessages(conversation.value.id, session.account)
    const sig = signatureOf(list)
    if (sig !== lastSignature) {
      lastSignature = sig
      messages.value = list
      await scrollToBottom()
    }
  } catch (e) {
    // 轮询失败不打扰用户，下一次继续
  }
}

async function send() {
  const text = input.value.trim()
  if (!text || !conversation.value || sending.value) return
  sending.value = true
  try {
    const msg = await sendChatMessage(conversation.value.id, session.account, text)
    messages.value = [...messages.value, msg]
    lastSignature = signatureOf(messages.value)
    input.value = ''
    stickToBottom = true
    await scrollToBottom(true)
  } catch (e) {
    toast(e.message || '发送失败，请重试', 'error')
  } finally {
    sending.value = false
  }
}

function usePhrase(p) {
  input.value = p
}

function onKeydown(e) {
  // Enter 发送，Shift+Enter 换行
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

function backToOrders() {
  router.push('/orders')
}

onMounted(async () => {
  await loadAll()
  timer = setInterval(refreshMessages, 3000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="chat-page">
    <div class="chat-bg"></div>
    <AppHeader :account="account" :show-admin="showAdmin" @logout="logout" @admin="goAdmin" />

    <main class="chat-shell">
      <!-- 顶部：返回 + 店铺信息 -->
      <section class="chat-head">
        <button class="back" @click="backToOrders">← 我的订单</button>
        <div class="who" v-if="order">
          <div class="avatar">🍜</div>
          <div class="who-text">
            <strong>{{ order.restaurantName }}</strong>
            <span>订单 {{ order.orderNo }}</span>
          </div>
        </div>
        <div class="head-badge" v-if="order">
          <span class="status">{{ order.statusText }}</span>
          <span class="amount">¥{{ Number(order.totalAmount || 0).toFixed(2) }}</span>
        </div>
      </section>

      <!-- 加载 -->
      <div v-if="loading" class="state">
        <span class="spinner"></span> 正在连接商家…
      </div>

      <!-- 错误 -->
      <div v-else-if="errMsg" class="state error">
        <div class="err-icon">💬</div>
        <p>{{ errMsg }}</p>
        <button class="retry" @click="loadAll">重试</button>
      </div>

      <!-- 聊天主体 -->
      <section v-else class="chat-body">
        <div class="chat-tip">
          <span>🔒</span> 与「{{ order.restaurantName }}」的专属沟通，仅围绕本笔订单
        </div>

        <div ref="listEl" class="msg-list" @scroll="onListScroll">
          <div
            v-for="m in messages"
            :key="m.id"
            class="msg-row"
            :class="{ mine: m.senderType === 'user' }"
          >
            <div class="msg-avatar" v-if="m.senderType !== 'user'">🍜</div>
            <div class="msg-main">
              <div class="msg-meta">
                <span class="msg-name">{{ m.senderType === 'user' ? '我' : (m.senderName || order.restaurantName) }}</span>
                <span class="msg-time">{{ timeLabel(m.createdAt) }}</span>
              </div>
              <div class="bubble">{{ m.content }}</div>
            </div>
            <div class="msg-avatar me" v-if="m.senderType === 'user'">🙋</div>
          </div>
        </div>

        <div class="quick-row">
          <button v-for="p in quickPhrases" :key="p" class="quick" @click="usePhrase(p)">{{ p }}</button>
        </div>

        <div class="composer">
          <textarea
            v-model="input"
            class="input"
            rows="2"
            maxlength="500"
            placeholder="给商家留言，比如出餐时间、口味备注…（Enter 发送，Shift+Enter 换行）"
            @keydown="onKeydown"
          ></textarea>
          <div class="composer-side">
            <span class="counter">{{ input.length }}/500</span>
            <button class="send" :disabled="!canSend" @click="send">
              {{ sending ? '发送中…' : '发送' }}
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.chat-page {
  min-height: 100vh;
  position: relative;
  background: linear-gradient(180deg, #f3fbf9 0%, #eef7f5 100%);
  color: var(--ink);
  overflow-x: hidden;
}
.chat-bg {
  position: fixed; inset: 0; pointer-events: none;
  background:
    radial-gradient(720px 380px at 12% -8%, rgba(0, 184, 148, 0.14), transparent 62%),
    radial-gradient(640px 360px at 92% 4%, rgba(0, 206, 201, 0.12), transparent 60%);
}
.chat-shell {
  position: relative;
  width: min(860px, calc(100% - 32px));
  margin: 18px auto 40px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 顶部信息 */
.chat-head {
  display: flex; align-items: center; gap: 12px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 14px 16px;
  box-shadow: 0 10px 26px rgba(15, 61, 57, 0.08);
}
.back {
  border: 1px solid var(--line); background: #fff; color: var(--deep);
  border-radius: 999px; padding: 8px 13px; font-size: 12px; font-weight: 800;
  cursor: pointer; font-family: inherit; flex: none;
}
.back:hover { background: rgba(0, 184, 148, 0.08); }
.who { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
.avatar {
  width: 42px; height: 42px; border-radius: 13px; flex: none;
  display: grid; place-items: center; font-size: 22px;
  background: linear-gradient(135deg, rgba(0, 184, 148, 0.18), rgba(0, 206, 201, 0.18));
}
.who-text { display: flex; flex-direction: column; min-width: 0; }
.who-text strong { font-size: 15px; font-weight: 900; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.who-text span { font-size: 11px; color: var(--muted); margin-top: 2px; }
.head-badge { display: flex; align-items: center; gap: 8px; flex: none; }
.status {
  font-size: 11px; font-weight: 800; color: var(--deep);
  background: rgba(0, 184, 148, 0.12); border-radius: 999px; padding: 4px 9px;
}
.amount { font-size: 15px; font-weight: 900; color: #e8730c; }

/* 状态 */
.state {
  background: #fff; border: 1px solid var(--line); border-radius: 20px;
  padding: 48px 20px; text-align: center; color: var(--muted); font-size: 13px;
}
.state.error p { margin: 10px 0 16px; color: var(--deep); font-weight: 700; }
.err-icon { font-size: 36px; }
.retry {
  border: none; cursor: pointer; padding: 9px 20px; border-radius: 12px;
  background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff;
  font-weight: 800; font-family: inherit;
}
.spinner {
  display: inline-block; width: 14px; height: 14px; vertical-align: -2px;
  border: 2px solid rgba(0, 150, 136, 0.25); border-top-color: var(--teal);
  border-radius: 50%; animation: spin 0.7s linear infinite;
}

/* 聊天主体 */
.chat-body {
  background: #fff; border: 1px solid var(--line); border-radius: 20px;
  overflow: hidden; box-shadow: 0 14px 34px rgba(15, 61, 57, 0.09);
  display: flex; flex-direction: column;
}
.chat-tip {
  padding: 10px 16px; font-size: 11px; color: var(--muted);
  background: rgba(0, 184, 148, 0.06); border-bottom: 1px solid var(--line);
}
.msg-list {
  height: min(52vh, 460px); overflow-y: auto;
  padding: 18px 16px 8px; display: flex; flex-direction: column; gap: 14px;
  background:
    radial-gradient(500px 240px at 100% 0%, rgba(0, 206, 201, 0.06), transparent 70%),
    #fbfefd;
}
.msg-row { display: flex; align-items: flex-start; gap: 8px; }
.msg-row.mine { flex-direction: row; justify-content: flex-end; }
.msg-avatar {
  width: 34px; height: 34px; border-radius: 50%; flex: none;
  display: grid; place-items: center; font-size: 18px;
  background: rgba(0, 184, 148, 0.14);
}
.msg-avatar.me { background: rgba(255, 193, 7, 0.2); }
.msg-main { max-width: min(76%, 560px); display: flex; flex-direction: column; gap: 4px; }
.msg-row.mine .msg-main { align-items: flex-end; }
.msg-meta { display: flex; align-items: center; gap: 8px; font-size: 10px; color: var(--muted); }
.msg-name { font-weight: 800; color: var(--deep); }
.msg-time { opacity: 0.8; }
.bubble {
  padding: 10px 13px; border-radius: 4px 14px 14px 14px;
  background: #fff; border: 1px solid var(--line);
  font-size: 14px; line-height: 1.65; color: var(--ink);
  word-break: break-word; white-space: pre-wrap;
  box-shadow: 0 3px 8px rgba(15, 61, 57, 0.04);
}
.msg-row.mine .bubble {
  border-radius: 14px 4px 14px 14px;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  border-color: transparent; color: #fff;
  box-shadow: 0 6px 14px rgba(0, 150, 136, 0.28);
}

/* 快捷话术 */
.quick-row {
  display: flex; gap: 8px; overflow-x: auto;
  padding: 10px 14px; border-top: 1px dashed var(--line);
  background: #fff;
}
.quick {
  flex: none; border: 1px solid var(--line); background: rgba(0, 184, 148, 0.06);
  color: var(--deep); padding: 6px 11px; border-radius: 999px;
  font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit;
  transition: background 0.15s;
}
.quick:hover { background: rgba(0, 184, 148, 0.16); }

/* 输入区 */
.composer {
  display: flex; gap: 10px; align-items: flex-end;
  padding: 12px 14px 14px; border-top: 1px solid var(--line);
  background: #fff;
}
.input {
  flex: 1; resize: none; border: 1px solid var(--line); border-radius: 14px;
  padding: 10px 12px; font-size: 13px; line-height: 1.6; color: var(--ink);
  font-family: inherit; background: #fbfefd; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(0, 184, 148, 0.12); }
.composer-side { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex: none; }
.counter { font-size: 10px; color: var(--muted); }
.send {
  border: none; cursor: pointer; padding: 9px 18px; border-radius: 12px;
  background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff;
  font-size: 13px; font-weight: 800; font-family: inherit;
  box-shadow: 0 6px 14px rgba(0, 150, 136, 0.32);
}
.send:disabled { opacity: 0.45; cursor: default; box-shadow: none; }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .chat-shell { width: calc(100% - 20px); margin-top: 10px; }
  .chat-head { flex-wrap: wrap; padding: 12px; }
  .who { order: 3; flex-basis: 100%; }
  .head-badge { margin-left: auto; }
  .msg-list { height: 54vh; padding: 14px 10px 6px; }
  .msg-main { max-width: 82%; }
  .composer { flex-direction: column; align-items: stretch; }
  .composer-side { flex-direction: row; justify-content: space-between; align-items: center; }
}
</style>
