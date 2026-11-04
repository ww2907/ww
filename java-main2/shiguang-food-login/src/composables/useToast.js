import { reactive, readonly } from 'vue'

// 全局轻提示单例：所有页面共用一个 toast 状态，避免每页重复实现
const state = reactive({
  visible: false,
  message: '',
  type: 'info' // success | error | info
})

let timer = null

/**
 * 弹出轻提示
 * @param {string} message 文案
 * @param {('success'|'error'|'info')} type 类型（决定配色）
 * @param {number} duration 停留毫秒
 */
export function toast(message, type = 'info', duration = 2200) {
  state.message = message
  state.type = type
  state.visible = true
  clearTimeout(timer)
  timer = setTimeout(() => {
    state.visible = false
  }, duration)
}

export function useToast() {
  return { toast, state: readonly(state) }
}
