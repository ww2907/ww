<script setup>
import { ref, watch } from 'vue'
import { getProfile, saveProfile, AVATAR_OPTIONS } from '../store/profile.js'

const props = defineProps({
  show: { type: Boolean, default: false }
})
const emit = defineEmits(['close', 'saved'])

const profile = getProfile()
const saving = ref(false)
const errorMsg = ref('')

const form = ref({
  nickname: '',
  avatar: '',
  gender: '',
  phone: '',
  bio: ''
})

// 打开时从 store 拷贝当前值，允许取消不落库
watch(
  () => props.show,
  (v) => {
    if (v) {
      errorMsg.value = ''
      form.value = {
        nickname: profile.nickname || '',
        avatar: profile.avatar || '',
        gender: profile.gender || '',
        phone: profile.phone || '',
        bio: profile.bio || ''
      }
    }
  }
)

function pickAvatar(a) {
  form.value.avatar = a
}
function useTextAvatar() {
  form.value.avatar = ''
}

// 保存：本地立即生效 + 提交后端（PUT /api/users/profile）
async function save() {
  if (saving.value) return
  saving.value = true
  errorMsg.value = ''
  try {
    await saveProfile({
      nickname: form.value.nickname,
      avatar: form.value.avatar,
      gender: form.value.gender,
      phone: form.value.phone,
      bio: form.value.bio
    })
    emit('saved')
    emit('close')
  } catch (e) {
    errorMsg.value = e.message || '保存失败，请稍后再试'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <transition name="pe-fade">
    <div v-if="show" class="pe-mask" @click.self="emit('close')">
      <transition name="pe-pop">
        <div class="pe-modal" v-if="show">
          <button class="pe-close" @click="emit('close')" title="关闭">✕</button>
          <h3 class="pe-title">编辑资料</h3>

          <!-- 头像修改 -->
          <div class="pe-avatar-block">
            <div class="pe-avatar-preview">
              {{ form.avatar || (form.nickname || '美').charAt(0).toUpperCase() }}
            </div>
            <div class="pe-avatar-options">
              <button
                v-for="a in AVATAR_OPTIONS"
                :key="a"
                class="pe-avatar-opt"
                :class="{ active: form.avatar === a }"
                @click="pickAvatar(a)"
              >{{ a }}</button>
              <button class="pe-avatar-opt text" :class="{ active: !form.avatar }" @click="useTextAvatar">字</button>
            </div>
          </div>

          <label class="pe-field">
            <span class="pe-label">昵称</span>
            <input v-model="form.nickname" class="pe-input" maxlength="20" placeholder="给自己起个好听的昵称" />
          </label>

          <label class="pe-field">
            <span class="pe-label">性别</span>
            <select v-model="form.gender" class="pe-input">
              <option value="">不透露</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </label>

          <label class="pe-field">
            <span class="pe-label">手机号</span>
            <input v-model="form.phone" class="pe-input" maxlength="20" placeholder="用于接单通知（演示可随意填）" />
          </label>

          <label class="pe-field">
            <span class="pe-label">个性签名</span>
            <textarea v-model="form.bio" class="pe-input pe-textarea" maxlength="60" rows="2" placeholder="一句话介绍自己"></textarea>
          </label>

          <p v-if="errorMsg" class="pe-error">⚠️ {{ errorMsg }}</p>

          <div class="pe-actions">
            <button class="pe-btn ghost" @click="emit('close')">取消</button>
            <button class="pe-btn solid" :disabled="saving" @click="save">
              <span v-if="saving" class="btn-spin"></span>{{ saving ? '保存中…' : '保存' }}
            </button>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<style scoped>
.pe-mask {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(6, 50, 46, 0.45); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.pe-modal {
  position: relative; width: 100%; max-width: 440px;
  background: #fff; border-radius: 22px; padding: 22px;
  box-shadow: 0 18px 50px rgba(0, 80, 70, 0.32);
}
.pe-close {
  position: absolute; top: 14px; right: 14px;
  width: 30px; height: 30px; border: none; border-radius: 50%;
  background: rgba(0,0,0,0.06); color: var(--muted); cursor: pointer; font-size: 14px;
}
.pe-close:hover { background: rgba(0,0,0,0.12); }
.pe-title { font-size: 18px; font-weight: 900; color: var(--deep); margin-bottom: 16px; }

.pe-avatar-block { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
.pe-avatar-preview {
  width: 64px; height: 64px; flex: none; border-radius: 50%;
  background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff;
  font-weight: 900; font-size: 28px; display: grid; place-items: center;
}
.pe-avatar-options { display: grid; grid-template-columns: repeat(9, 1fr); gap: 6px; flex: 1; }
.pe-avatar-opt {
  width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--line);
  background: #fff; cursor: pointer; font-size: 18px; line-height: 1;
}
.pe-avatar-opt:hover { background: rgba(0,184,148,0.1); }
.pe-avatar-opt.active { border-color: var(--teal); background: rgba(0,184,148,0.16); box-shadow: 0 0 0 2px rgba(0,184,148,0.25); }
.pe-avatar-opt.text { font-size: 13px; font-weight: 800; color: var(--deep); }

.pe-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.pe-label { font-size: 13px; font-weight: 800; color: var(--ink); }
.pe-input {
  border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px;
  font-size: 14px; color: var(--ink); font-family: inherit; outline: none;
  background: #fff; width: 100%;
}
.pe-input:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(0,184,148,0.18); }
.pe-textarea { resize: none; }

.pe-actions { display: flex; gap: 12px; margin-top: 8px; }
.pe-btn {
  flex: 1; border: none; cursor: pointer; padding: 12px 0; border-radius: 14px;
  font-size: 15px; font-weight: 800; font-family: inherit; transition: transform 0.15s;
}
.pe-btn.ghost { background: rgba(0,0,0,0.05); color: var(--muted); }
.pe-btn.ghost:hover { background: rgba(0,0,0,0.1); }
.pe-btn.solid { background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff; box-shadow: 0 8px 18px rgba(0,150,136,0.4); }
.pe-btn.solid:hover { transform: translateY(-1px); }
.pe-btn.solid:disabled { cursor: not-allowed; opacity: 0.72; transform: none; }

.pe-error {
  font-size: 12px; font-weight: 700; color: #d9533c;
  background: #fff4f1; border: 1px solid #f0c9c0;
  border-radius: 10px; padding: 8px 12px; margin-bottom: 6px;
}

.pe-fade-enter-active, .pe-fade-leave-active { transition: opacity 0.25s ease; }
.pe-fade-enter-from, .pe-fade-leave-to { opacity: 0; }
.pe-pop-enter-active, .pe-pop-leave-active { transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1); }
.pe-pop-enter-from, .pe-pop-leave-to { transform: scale(0.94) translateY(10px); }
</style>
