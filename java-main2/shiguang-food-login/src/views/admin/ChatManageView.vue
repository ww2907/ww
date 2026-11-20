<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { listChatConversations, listChatMessages, sendChatReply } from '../../api/admin.js'

// ============================================================
// 后台 · 客服消息
// ------------------------------------------------------------
// 左侧：全部订单会话（按最后消息时间倒序，商家未读角标）
// 右侧：当前会话消息 + 商家回复；每 4 秒轮询一次，模拟实时。
// ============================================================

const conversations = ref([])
const messages = ref([])
const activeId = ref(null)
const keyword = ref('')
const loading = ref(false)
const msgLoading = ref(false)
const errMsg = ref('')
const input = ref('')
const sending = ref(false)
const listEl = ref(null)

let timer = null
let lastSig = ''

const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return conversations.value
  return conversations.value.filter((c) =>
    [c.orderNo, c.account, c.restaurantName, c.userName, c.lastMessage]
      .some((v) => String(v == null ? '' : v).toLowerCase().includes(k))
  )
})

const activeConv = computed(() =>
  conversations.value.find((c) => c.id === activeId.value) || null
)

const totalUnread = computed(() =>
  conversations.value.reduce((s, c) => s + (Number(c.merchantUnread) || 0), 0)
)

function timeLabel(t) {
  if (!t) return ''
  const today = new Date()
  const p = (n) => String(n).padStart(2, '0')
  const prefix = `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`
  return t.startsWith(prefix) ? t.slice(11) : t.slice(5)
}

function signatureOf(list) {
  return list.map((m) => `${m.id}:${m.content}`).join('|')
}

async function scrollToBottom(force = false) {
  await nextTick()
  const el = listEl.value
  if (!el) return
  if (force) el.scrollTop = el.scrollHeight
}

async function loadConversations() {
  const list = await listChatConversations()
  conversations.value = list || []
  if (!conversations.value.length) {
    activeId.value = null
    messages.value = []
    return
  }
  if (!conversations.value.some((c) => c.id === activeId.value)) {
    await selectConversation(conversations.value[0])
  }
}

async function selectConversation(c) {
  if (!c) return
  activeId.value = c.id
  c.merchantUnread = 0
  await loadMessages(true)
}

async function loadMessages(forceScroll = false) {
  if (!activeId.value) return
  msgLoading.value = true
  try {
    const list = await listChatMessages(activeId.value)
    const sig = signatureOf(list || [])
    if (sig !== lastSig || forceScroll) {
      lastSig = sig
      messages.value = list || []
      await scrollToBottom(true)
    }
    // 打开会话即已读，列表角标同步清零
    const conv = conversations.value.find((c) => c.id === activeId.value)
    if (conv) conv.merchantUnread = 0
  } catch (e) {
    errMsg.value = e.message || '消息加载失败'
  } finally {
    msgLoading.value = false
  }
}

async function refresh() {
  try {
    const prevId = activeId.value
    const list = await listChatConversations()
    conversations.value = list || []
    if (!conversations.value.length) {
      activeId.value = null
      messages.value = []
      return
    }
    if (!conversations.value.some((c) => c.id === prevId)) {
      await selectConversation(conversations.value[0])
    } else if (prevId === activeId.value) {
      await loadMessages(false)
    }
  } catch (e) {
    // 轮询失败不打断当前输入
  }
}

async function send() {
  const text = input.value.trim()
  if (!text || !activeId.value || sending.value) return
  sending.value = true
  try {
    const msg = await sendChatReply(activeId.value, text)
    messages.value = [...messages.value, msg]
    lastSig = signatureOf(messages.value)
    input.value = ''
    const conv = conversations.value.find((c) => c.id === activeId.value)
    if (conv) {
      conv.lastMessage = text
      conv.lastMessageAt = msg.createdAt || conv.lastMessageAt
    }
    await scrollToBottom(true)
  } catch (e) {
    toastError(e.message || '回复失败')
  } finally {
    sending.value = false
  }
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

// 极简 toast（后台其它页面也是各自一份）
const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null
function toastError(msg) {
  toastMsg.value = msg
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2200)
}

onMounted(async () => {
  loading.value = true
  errMsg.value = ''
  try {
    await loadConversations()
  } catch (e) {
    errMsg.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
  timer = setInterval(refresh, 4000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  clearTimeout(toastTimer)
})
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>💬 客服消息</h1>
        <p>用户在「我的订单」点「去对话」后，会话会出现在这里；回复会实时同步到用户聊天页。</p>
      </div>
      <div class="head-stat">
        <span class="stat-num">{{ conversations.length }}</span>
        <span class="stat-label">个会话</span>
        <span class="unread-pill" v-if="totalUnread">待回复 {{ totalUnread }}</span>
      </div>
    </div>

    <div v-if="loading" class="state"><span class="spinner dark"></span> 加载中…</div>
    <div v-else-if="errMsg" class="state error">{{ errMsg }}</div>

    <div v-else class="chat-admin">
      <!-- 左：会话列表 -->
      <aside class="conv-list">
        <div class="search-box">
          <span class="s-ico">🔎</span>
          <input v-model="keyword" class="s-input" type="text" placeholder="搜订单号 / 账号 / 店铺…" />
          <button v-if="keyword" class="s-clear" @click="keyword = ''" title="清空">✕</button>
        </div>

        <div v-if="!filtered.length" class="conv-empty">
          <div class="empty-icon">🗨️</div>
          <p>{{ conversations.length ? '没有匹配的会话' : '还没有用户发起对话' }}</p>
          <small>用户从「我的订单」点「去对话」后，会话会出现在这里</small>
        </div>

        <button
          v-for="c in filtered"
          :key="c.id"
          class="conv-item"
          :class="{ active: c.id === activeId }"
          @click="selectConversation(c)"
        >
          <span class="conv-avatar">🍜</span>
          <span class="conv-main">
            <span class="conv-top">
              <strong>{{ c.restaurantName || '店铺' }}</strong>
              <span class="conv-time">{{ timeLabel(c.lastMessageAt) }}</span>
            </span>
            <span class="conv-sub">订单 {{ c.orderNo }} · {{ c.userName || c.account }}</span>
            <span class="conv-msg">{{ c.lastMessage || '暂无消息' }}</span>
          </span>
          <span v-if="c.merchantUnread" class="conv-badge">{{ c.merchantUnread > 99 ? '99+' : c.merchantUnread }}</span>
        </button>
      </aside>

      <!-- 右：聊天窗口 -->
      <section class="conv-panel">
        <template v-if="activeConv">
          <header class="panel-head">
            <div class="ph-avatar">🍜</div>
            <div class="ph-text">
              <strong>{{ activeConv.restaurantName }}</strong>
              <span>订单 {{ activeConv.orderNo }} · 用户 {{ activeConv.userName || activeConv.account }}</span>
            </div>
            <span class="ph-tag">本单专属会话</span>
          </header>

          <div ref="listEl" class="msg-list">
            <div v-if="msgLoading && !messages.length" class="msg-state">正在加载消息…</div>
            <div
              v-for="m in messages"
              :key="m.id"
              class="msg-row"
              :class="{ mine: m.senderType === 'merchant' }"
            >
              <div class="msg-avatar" v-if="m.senderType !== 'merchant'">🙋</div>
              <div class="msg-main">
                <div class="msg-meta">
                  <span class="msg-name">{{ m.senderType === 'merchant' ? '商家（我）' : (m.senderName || activeConv.userName) }}</span>
                  <span class="msg-time">{{ timeLabel(m.createdAt) }}</span>
                </div>
                <div class="bubble">{{ m.content }}</div>
              </div>
              <div class="msg-avatar me" v-if="m.senderType === 'merchant'">🍜</div>
            </div>
          </div>

          <div class="composer">
            <textarea
              v-model="input"
              class="input"
              rows="2"
              maxlength="500"
              placeholder="回复用户，比如出餐进度、口味确认…（Enter 发送，Shift+Enter 换行）"
              @keydown="onKeydown"
            ></textarea>
            <div class="composer-side">
              <span class="counter">{{ input.length }}/500</span>
              <button class="send" :disabled="!input.trim() || sending" @click="send">
                {{ sending ? '发送中…' : '发送回复' }}
              </button>
            </div>
          </div>
        </template>

        <div v-else class="panel-empty">
          <div class="empty-icon">💬</div>
          <p>选择左侧会话开始回复</p>
        </div>
      </section>
    </div>

    <transition name="toast">
      <div v-if="toastShow" class="toast">{{ toastMsg }}</div>
    </transition>
  </div>
</template>

<style scoped>
.page { max-width: 1240px; animation: adIn 0.4s ease both; }
.page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
.page-head h1 { font-size: 22px; font-weight: 900; color: #0c3d39; position: relative; padding-left: 14px; }
.page-head h1::before { content: ""; position: absolute; left: 0; top: 4px; bottom: 4px; width: 5px; border-radius: 4px; background: linear-gradient(180deg, #00b894, #00cec9); }
.page-head p { margin-top: 6px; font-size: 13px; color: #6f8c88; line-height: 1.6; max-width: 680px; }
.head-stat { display: flex; align-items: baseline; gap: 6px; background: #fff; border: 1px solid #e3ebee; border-radius: 14px; padding: 10px 14px; }
.stat-num { font-size: 20px; font-weight: 900; color: #0c3d39; }
.stat-label { font-size: 12px; color: #6f8c88; }
.unread-pill { margin-left: 8px; font-size: 11px; font-weight: 800; color: #fff; background: #ff7675; border-radius: 999px; padding: 3px 8px; }

.state { text-align: center; padding: 40px; color: #6f8c88; }
.state.error { color: #c0392b; }
.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: -2px; }
.spinner.dark { border-color: rgba(0,150,136,0.25); border-top-color: #00b894; }

/* 整体两栏 */
.chat-admin {
  display: grid; grid-template-columns: 330px minmax(0, 1fr); gap: 14px;
  height: calc(100vh - 190px); min-height: 480px;
}

/* 左：会话列表 */
.conv-list {
  background: #fff; border: 1px solid #e6edef; border-radius: 18px;
  box-shadow: 0 8px 22px rgba(15,61,57,0.08);
  display: flex; flex-direction: column; overflow: hidden;
}
.search-box { display: flex; align-items: center; gap: 8px; padding: 12px 12px 10px; border-bottom: 1px solid #eef4f3; }
.s-ico { font-size: 14px; }
.s-input { flex: 1; min-width: 0; border: none; outline: none; font-size: 13px; color: #0c3d39; background: transparent; font-family: inherit; }
.s-input::placeholder { color: #9bb0ad; }
.s-clear { border: none; background: rgba(0,0,0,0.06); width: 20px; height: 20px; border-radius: 50%; cursor: pointer; color: #6f8c88; font-size: 11px; }
.conv-empty { padding: 34px 20px; text-align: center; color: #6f8c88; }
.empty-icon { font-size: 34px; margin-bottom: 10px; }
.conv-empty p { font-size: 13px; font-weight: 700; color: #0c3d39; }
.conv-empty small { display: block; margin-top: 6px; font-size: 11px; line-height: 1.6; color: #8aa5a1; }
.conv-item {
  display: flex; align-items: flex-start; gap: 10px; width: 100%;
  border: none; border-bottom: 1px solid #f1f7f5; background: transparent;
  padding: 12px; text-align: left; cursor: pointer; font-family: inherit;
  transition: background 0.15s;
}
.conv-item:hover { background: rgba(0, 184, 148, 0.05); }
.conv-item.active { background: rgba(0, 184, 148, 0.1); box-shadow: inset 3px 0 0 #00b894; }
.conv-avatar { width: 36px; height: 36px; flex: none; border-radius: 11px; display: grid; place-items: center; font-size: 19px; background: linear-gradient(135deg, rgba(0,184,148,0.16), rgba(0,206,201,0.16)); }
.conv-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.conv-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.conv-top strong { font-size: 13px; font-weight: 900; color: #0c3d39; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conv-time { font-size: 10px; color: #9bb0ad; flex: none; }
.conv-sub { font-size: 10px; color: #8aa5a1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conv-msg { font-size: 12px; color: #5a7572; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conv-badge { align-self: center; flex: none; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: #ff7675; color: #fff; font-size: 10px; font-weight: 800; display: grid; place-items: center; }

/* 右：聊天窗口 */
.conv-panel {
  background: #fff; border: 1px solid #e6edef; border-radius: 18px;
  box-shadow: 0 8px 22px rgba(15,61,57,0.08);
  display: flex; flex-direction: column; overflow: hidden; min-width: 0;
}
.panel-head { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid #eef4f3; }
.ph-avatar { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; font-size: 20px; background: linear-gradient(135deg, rgba(0,184,148,0.16), rgba(0,206,201,0.16)); }
.ph-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.ph-text strong { font-size: 14px; font-weight: 900; color: #0c3d39; }
.ph-text span { font-size: 11px; color: #7a948f; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ph-tag { flex: none; font-size: 10px; font-weight: 800; color: #0a6b6b; background: rgba(0,184,148,0.12); border-radius: 999px; padding: 4px 9px; }

.msg-list {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 13px;
  background: radial-gradient(500px 240px at 100% 0%, rgba(0,206,201,0.06), transparent 70%), #fbfefd;
}
.msg-state { text-align: center; color: #8aa5a1; font-size: 12px; padding: 20px; }
.msg-row { display: flex; align-items: flex-start; gap: 8px; }
.msg-row.mine { justify-content: flex-end; }
.msg-avatar { width: 32px; height: 32px; border-radius: 50%; flex: none; display: grid; place-items: center; font-size: 17px; background: rgba(255, 193, 7, 0.2); }
.msg-avatar.me { background: rgba(0,184,148,0.16); }
.msg-main { max-width: min(72%, 560px); display: flex; flex-direction: column; gap: 4px; }
.msg-row.mine .msg-main { align-items: flex-end; }
.msg-meta { display: flex; align-items: center; gap: 8px; font-size: 10px; color: #8aa5a1; }
.msg-name { font-weight: 800; color: #0a6b6b; }
.msg-time { opacity: 0.8; }
.bubble {
  padding: 10px 13px; border-radius: 4px 14px 14px 14px;
  background: #fff; border: 1px solid #dff0ec;
  font-size: 13px; line-height: 1.65; color: #1f2d2b;
  word-break: break-word; white-space: pre-wrap;
  box-shadow: 0 3px 8px rgba(15,61,57,0.04);
}
.msg-row.mine .bubble { border-radius: 14px 4px 14px 14px; background: linear-gradient(135deg, #00b894, #00cec9); border-color: transparent; color: #fff; box-shadow: 0 6px 14px rgba(0,150,136,0.26); }

.composer { display: flex; gap: 10px; align-items: flex-end; padding: 12px 14px; border-top: 1px solid #eef4f3; }
.input { flex: 1; resize: none; border: 1px solid #dff0ec; border-radius: 13px; padding: 10px 12px; font-size: 13px; line-height: 1.6; color: #1f2d2b; font-family: inherit; background: #fbfefd; outline: none; }
.input:focus { border-color: #00b894; box-shadow: 0 0 0 3px rgba(0,184,148,0.12); }
.composer-side { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex: none; }
.counter { font-size: 10px; color: #9bb0ad; }
.send { border: none; cursor: pointer; padding: 9px 16px; border-radius: 11px; background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; font-size: 12px; font-weight: 800; font-family: inherit; box-shadow: 0 6px 14px rgba(0,150,136,0.3); }
.send:disabled { opacity: 0.45; cursor: default; box-shadow: none; }
.panel-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #7a948f; }
.panel-empty p { font-size: 13px; font-weight: 700; color: #0c3d39; margin-top: 4px; }

.toast { position: fixed; left: 50%; bottom: 26px; transform: translateX(-50%); background: rgba(12,61,57,0.92); color: #fff; padding: 10px 18px; border-radius: 12px; font-size: 13px; font-weight: 700; z-index: 3000; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 8px); }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes adIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

@media (max-width: 860px) {
  .chat-admin { grid-template-columns: 1fr; height: auto; }
  .conv-list { max-height: 300px; }
  .conv-panel { min-height: 540px; }
  .msg-list { min-height: 320px; }
}
@media (max-width: 600px) {
  .composer { flex-direction: column; align-items: stretch; }
  .composer-side { flex-direction: row; justify-content: space-between; align-items: center; }
  .msg-main { max-width: 80%; }
}
</style>
