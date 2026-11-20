// ============================================================
// 食光 · 订单聊天接口层（用户 ↔ 商家）
// ------------------------------------------------------------
// 一单一会话：用户从订单卡片/详情点「去对话」，按 orderId 打开会话，
// 后端首次打开会自动建会话并写入一条商家欢迎语。
// 真实接口（统一挂 /api/chat）：见 ChatController。
// ============================================================

export const CHAT_API_BASE = import.meta.env.VITE_API_BASE || '/api'

export const CHAT_ENDPOINTS = {
  conversations: '/chat/conversations'
}

async function httpReq(method, path, payload, params) {
  const { default: axios } = await import('axios')
  const http = axios.create({
    baseURL: CHAT_API_BASE,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
  })
  const res = await http.request({ method, url: path, data: payload, params })
  if (res.data.code !== 0) {
    throw new Error(res.data.message || '聊天请求失败')
  }
  return res.data.data
}

/** 打开（或创建）某笔订单的会话：POST /api/chat/conversations */
export function openChatConversation(orderId, account) {
  return httpReq('post', CHAT_ENDPOINTS.conversations, { orderId, account })
}

/** 我的会话列表：GET /api/chat/conversations?account= */
export function getMyChatConversations(account) {
  return httpReq('get', CHAT_ENDPOINTS.conversations, null, { account })
}

/** 会话消息（拉取即清用户未读）：GET /api/chat/conversations/{id}/messages?account= */
export function getChatMessages(conversationId, account) {
  return httpReq('get', `${CHAT_ENDPOINTS.conversations}/${conversationId}/messages`, null, { account })
}

/** 用户发消息：POST /api/chat/conversations/{id}/messages */
export function sendChatMessage(conversationId, account, content) {
  return httpReq('post', `${CHAT_ENDPOINTS.conversations}/${conversationId}/messages`, { account, content })
}
