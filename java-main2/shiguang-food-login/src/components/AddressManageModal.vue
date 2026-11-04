<script setup>
import { ref, computed } from 'vue'
import {
  getAddresses,
  addAddress,
  updateAddress,
  removeAddress,
  setDefaultAddress
} from '../store/profile.js'

const props = defineProps({
  show: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])

const TAGS = ['家', '公司', '学校', '其他']

// 视图：'list' 列表 / 'form' 表单
const view = ref('list')
const editingId = ref(null)
const form = ref(blankForm())

function blankForm() {
  return { name: '', phone: '', tag: '家', province: '', city: '', detail: '' }
}

function openAdd() {
  editingId.value = null
  form.value = blankForm()
  view.value = 'form'
}
function openEdit(a) {
  editingId.value = a.id
  form.value = {
    name: a.name,
    phone: a.phone,
    tag: a.tag,
    province: a.province,
    city: a.city,
    detail: a.detail
  }
  view.value = 'form'
}
function back() {
  view.value = 'list'
}

// 以下三个写操作都会「本地先行 + 异步提交后端」（见 store/profile.js），
// 因此统一加 busy 态，避免连点造成重复提交。
const busy = ref(false)

async function save() {
  const f = form.value
  if (!f.name.trim() || !f.phone.trim() || !f.detail.trim()) {
    alert('请填写联系人、手机号与详细地址')
    return
  }
  busy.value = true
  try {
    if (editingId.value) {
      await updateAddress(editingId.value, { ...f })
    } else {
      await addAddress({ ...f })
    }
    view.value = 'list'
  } finally {
    busy.value = false
  }
}
async function del(id) {
  if (!confirm('确定删除该地址？')) return
  busy.value = true
  try {
    await removeAddress(id)
  } finally {
    busy.value = false
  }
}
async function setDefault(id) {
  busy.value = true
  try {
    await setDefaultAddress(id)
  } finally {
    busy.value = false
  }
}

const addresses = computed(() => getAddresses())
</script>

<template>
  <transition name="am-fade">
    <div v-if="show" class="am-mask" @click.self="emit('close')">
      <transition name="am-pop">
        <div class="am-modal" v-if="show">
          <button class="am-close" @click="emit('close')" title="关闭">✕</button>

          <!-- 列表视图 -->
          <template v-if="view === 'list'">
            <div class="am-head">
              <button v-if="addresses.length" class="am-back" @click="emit('close')">‹</button>
              <h3 class="am-title">收货地址</h3>
              <button class="am-add" @click="openAdd">＋ 新增</button>
            </div>

            <div v-if="addresses.length === 0" class="am-empty">
              📭 还没有收货地址，点右上角「新增」添加一个吧～
            </div>

            <ul v-else class="am-list">
              <li class="am-item" v-for="a in addresses" :key="a.id">
                <div class="am-item-top">
                  <span class="am-name">{{ a.name }}</span>
                  <span class="am-phone">{{ a.phone }}</span>
                  <span class="am-tag">{{ a.tag }}</span>
                  <span v-if="a.isDefault" class="am-default">默认</span>
                </div>
                <div class="am-addr">
                  {{ [a.province, a.city, a.detail].filter(Boolean).join(' ') }}
                </div>
                <div class="am-item-actions">
                  <button v-if="!a.isDefault" class="am-link" @click="setDefault(a.id)">设为默认</button>
                  <button class="am-link" @click="openEdit(a)">编辑</button>
                  <button class="am-link danger" @click="del(a.id)">删除</button>
                </div>
              </li>
            </ul>
          </template>

          <!-- 表单视图 -->
          <template v-else>
            <div class="am-head">
              <button class="am-back" @click="back">‹</button>
              <h3 class="am-title">{{ editingId ? '编辑地址' : '新增地址' }}</h3>
              <span class="am-spacer"></span>
            </div>

            <label class="am-field">
              <span class="am-label">联系人</span>
              <input v-model="form.name" class="am-input" maxlength="20" placeholder="收件人姓名" />
            </label>
            <label class="am-field">
              <span class="am-label">手机号</span>
              <input v-model="form.phone" class="am-input" maxlength="20" placeholder="11 位手机号" />
            </label>
            <div class="am-field">
              <span class="am-label">标签</span>
              <div class="am-tags">
                <button
                  v-for="t in TAGS"
                  :key="t"
                  class="am-tag"
                  :class="{ active: form.tag === t }"
                  @click="form.tag = t"
                >{{ t }}</button>
              </div>
            </div>
            <label class="am-field">
              <span class="am-label">省 / 市</span>
              <input v-model="form.province" class="am-input" placeholder="省份" style="margin-bottom:8px" />
              <input v-model="form.city" class="am-input" placeholder="城市" />
            </label>
            <label class="am-field">
              <span class="am-label">详细地址</span>
              <textarea v-model="form.detail" class="am-input am-textarea" rows="2" maxlength="80" placeholder="街道、门牌号等"></textarea>
            </label>

            <button class="am-save" :disabled="busy" @click="save">
              <span v-if="busy" class="btn-spin"></span>{{ busy ? '保存中…' : '保存地址' }}
            </button>
          </template>
        </div>
      </transition>
    </div>
  </transition>
</template>

<style scoped>
.am-mask {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(6, 50, 46, 0.45); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.am-modal {
  position: relative; width: 100%; max-width: 460px; max-height: 88vh; overflow-y: auto;
  background: #fff; border-radius: 22px; padding: 20px;
  box-shadow: 0 18px 50px rgba(0, 80, 70, 0.32);
}
.am-close {
  position: absolute; top: 14px; right: 14px;
  width: 30px; height: 30px; border: none; border-radius: 50%;
  background: rgba(0,0,0,0.06); color: var(--muted); cursor: pointer; font-size: 14px;
}
.am-close:hover { background: rgba(0,0,0,0.12); }
.am-head { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.am-back {
  border: none; background: rgba(0,184,148,0.12); color: var(--deep);
  width: 32px; height: 32px; border-radius: 10px; font-size: 18px; font-weight: 800; cursor: pointer;
}
.am-back:hover { background: rgba(0,184,148,0.25); }
.am-title { font-size: 18px; font-weight: 900; color: var(--deep); flex: 1; }
.am-add {
  border: none; cursor: pointer; padding: 8px 14px; border-radius: 11px;
  background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff;
  font-weight: 800; font-size: 13px; font-family: inherit;
}
.am-spacer { width: 32px; }

.am-empty { padding: 40px 10px; text-align: center; font-size: 13px; color: var(--muted); }

.am-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.am-item {
  background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 12px 14px;
}
.am-item-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.am-name { font-size: 14px; font-weight: 800; color: var(--ink); }
.am-phone { font-size: 13px; color: var(--muted); }
.am-tag {
  font-size: 11px; font-weight: 800; color: var(--deep);
  background: rgba(0,184,148,0.12); padding: 2px 9px; border-radius: 999px;
}
.am-default {
  font-size: 11px; font-weight: 800; color: #fff;
  background: var(--deep); padding: 2px 9px; border-radius: 999px;
}
.am-addr { font-size: 12px; color: var(--muted); margin-top: 8px; line-height: 1.5; }
.am-item-actions { display: flex; gap: 14px; margin-top: 10px; }
.am-link {
  border: none; background: none; color: var(--deep); font-weight: 800;
  font-size: 12px; cursor: pointer; padding: 0; font-family: inherit;
}
.am-link:hover { text-decoration: underline; }
.am-link.danger { color: #e74c3c; }

.am-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.am-label { font-size: 13px; font-weight: 800; color: var(--ink); }
.am-input {
  border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px;
  font-size: 14px; color: var(--ink); font-family: inherit; outline: none; background: #fff; width: 100%;
}
.am-input:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(0,184,148,0.18); }
.am-textarea { resize: none; }
.am-tags { display: flex; gap: 8px; }
.am-tag {
  border: 1px solid var(--line); background: #fff; color: var(--deep);
  padding: 7px 16px; border-radius: 999px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit;
}
.am-tag.active { background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff; border-color: transparent; }

.am-save {
  width: 100%; border: none; cursor: pointer; padding: 13px 0; border-radius: 14px;
  background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff;
  font-weight: 800; font-size: 15px; font-family: inherit; margin-top: 4px;
  box-shadow: 0 8px 18px rgba(0,150,136,0.4);
}
.am-save:hover { transform: translateY(-1px); }
.am-save:disabled { cursor: not-allowed; opacity: 0.72; transform: none; }

.am-fade-enter-active, .am-fade-leave-active { transition: opacity 0.25s ease; }
.am-fade-enter-from, .am-fade-leave-to { opacity: 0; }
.am-pop-enter-active, .am-pop-leave-active { transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1); }
.am-pop-enter-from, .am-pop-leave-to { transform: scale(0.94) translateY(10px); }
</style>
