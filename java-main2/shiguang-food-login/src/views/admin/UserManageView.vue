<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  listUsers,
  updateUser,
  removeUser,
  listUserAddresses,
  removeUserAddress
} from '../../api/admin.js'
import { AVATAR_OPTIONS } from '../../store/profile.js'

const users = ref([])
const loading = ref(false)
const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null

function showToast(msg) {
  toastMsg.value = msg; toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2000)
}

// ---------- 列表 ----------
const keyword = ref('')
const statusFilter = ref('all')

const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  return users.value.filter((u) => {
    if (statusFilter.value === 'on' && u.status !== 1) return false
    if (statusFilter.value === 'off' && u.status === 1) return false
    if (!k) return true
    return [u.account, u.nickname, u.phone].some((v) => String(v || '').toLowerCase().includes(k))
  })
})

const stats = computed(() => {
  const total = users.value.length
  const off = users.value.filter((u) => u.status !== 1).length
  return { total, off, on: total - off }
})

async function load() {
  loading.value = true
  try {
    users.value = await listUsers()
  } catch (e) {
    showToast(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)
onUnmounted(() => clearTimeout(toastTimer))

function avatarOf(u) {
  return u.avatar || (u.nickname || u.account || '美').charAt(0).toUpperCase()
}

// ---------- 启用 / 禁用 ----------
async function toggleStatus(u) {
  const next = u.status ? 0 : 1
  try {
    await updateUser({ id: u.id, status: next })
    u.status = next
    showToast(next ? '已启用该用户' : '已禁用该用户')
  } catch (e) {
    showToast(e.message)
  }
}

async function del(u) {
  if (!confirm(`确认删除用户「${u.account}」？其收货地址会一并清除。`)) return
  try {
    await removeUser(u.id)
    users.value = users.value.filter((x) => x.id !== u.id)
    showToast('用户已删除')
  } catch (e) {
    showToast(e.message)
  }
}

// ---------- 编辑资料 ----------
const editShow = ref(false)
const saving = ref(false)
const form = ref(blankForm())
let editingId = null

function blankForm() {
  return { nickname: '', avatar: '', gender: '', phone: '', bio: '' }
}
function openEdit(u) {
  editingId = u.id
  form.value = {
    nickname: u.nickname || '',
    avatar: u.avatar || '',
    gender: u.gender || '',
    phone: u.phone || '',
    bio: u.bio || ''
  }
  editShow.value = true
}
function closeEdit() {
  editShow.value = false
  editingId = null
  form.value = blankForm()
}

async function submitEdit() {
  if (saving.value || editingId == null) return
  const f = form.value
  if (!f.nickname.trim()) {
    showToast('昵称不能为空')
    return
  }
  if (f.phone && !/^\d{6,20}$/.test(f.phone.trim())) {
    showToast('手机号格式不正确')
    return
  }
  saving.value = true
  try {
    await updateUser({
      id: editingId,
      nickname: f.nickname.trim(),
      avatar: f.avatar,
      gender: f.gender,
      phone: f.phone.trim(),
      bio: f.bio.trim()
    })
    const i = users.value.findIndex((u) => u.id === editingId)
    if (i !== -1) {
      users.value[i] = { ...users.value[i], ...form.value, nickname: f.nickname.trim() }
    }
    showToast('资料已保存')
    closeEdit()
  } catch (e) {
    showToast(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// ---------- 收货地址（只读查看 + 删除） ----------
const addrShow = ref(false)
const addrLoading = ref(false)
const addrList = ref([])
const addrUser = ref(null)

async function openAddress(u) {
  addrUser.value = u
  addrShow.value = true
  addrLoading.value = true
  addrList.value = []
  try {
    addrList.value = await listUserAddresses(u.id)
  } catch (e) {
    showToast(e.message || '地址加载失败')
  } finally {
    addrLoading.value = false
  }
}
function closeAddress() {
  addrShow.value = false
  addrUser.value = null
  addrList.value = []
}
async function delAddress(a) {
  if (!confirm(`确认删除地址「${a.name} · ${a.detail}」？`)) return
  try {
    await removeUserAddress(addrUser.value.id, a.id)
    addrList.value = addrList.value.filter((x) => x.id !== a.id)
    const i = users.value.findIndex((u) => u.id === addrUser.value.id)
    if (i !== -1) {
      users.value[i] = { ...users.value[i], addressCount: Math.max(0, (users.value[i].addressCount || 0) - 1) }
    }
    showToast('地址已删除')
  } catch (e) {
    showToast(e.message)
  }
}

function fullAddress(a) {
  return [a.province, a.city, a.detail].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>👥 用户管理</h1>
        <p>
          对应前台「我的」页面：可查看注册用户的头像 / 昵称 / 性别 / 手机 / 签名与收货地址，
          支持编辑资料、启用禁用账号、删除用户。
        </p>
      </div>
    </div>

    <!-- 概览 + 筛选 -->
    <div class="toolbar">
      <div class="chips">
        <span class="chip">共 {{ stats.total }} 位用户</span>
        <span class="chip ok">正常 {{ stats.on }}</span>
        <span class="chip off">已禁用 {{ stats.off }}</span>
      </div>
      <div class="filters">
        <input v-model="keyword" class="search" placeholder="搜索账号 / 昵称 / 手机号" />
        <select v-model="statusFilter" class="select">
          <option value="all">全部状态</option>
          <option value="on">仅正常</option>
          <option value="off">仅已禁用</option>
        </select>
        <button class="mini" @click="load">刷新</button>
      </div>
    </div>

    <div v-if="loading" class="state"><span class="spinner"></span> 加载中…</div>

    <div v-else-if="filtered.length === 0" class="state">没有匹配的用户</div>

    <div v-else class="card">
      <table>
        <thead>
          <tr>
            <th>ID</th><th>用户</th><th>账号</th><th>性别</th><th>手机号</th>
            <th>个性签名</th><th>地址</th><th>状态</th><th>注册时间</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in filtered" :key="u.id">
            <td>{{ u.id }}</td>
            <td>
              <div class="user-cell">
                <span class="avatar">{{ avatarOf(u) }}</span>
                <span class="nick">{{ u.nickname || u.account }}</span>
              </div>
            </td>
            <td class="acc">{{ u.account }}</td>
            <td>{{ u.gender || '—' }}</td>
            <td class="time">{{ u.phone || '—' }}</td>
            <td class="bio" :title="u.bio">{{ u.bio || '—' }}</td>
            <td>
              <button class="link" @click="openAddress(u)">
                {{ u.addressCount || 0 }} 个 ›
              </button>
            </td>
            <td>
              <span class="badge" :class="u.status ? 'on' : 'off'">{{ u.status ? '正常' : '已禁用' }}</span>
            </td>
            <td class="time">{{ u.createdAt }}</td>
            <td class="ops">
              <button class="mini" @click="openEdit(u)">编辑资料</button>
              <button class="mini" :class="u.status ? 'warn' : 'ok'" @click="toggleStatus(u)">
                {{ u.status ? '禁用' : '启用' }}
              </button>
              <button class="mini danger" @click="del(u)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 编辑资料弹窗 -->
    <transition name="fade">
      <div v-if="editShow" class="mask" @click.self="closeEdit">
        <div class="modal">
          <button class="close" @click="closeEdit">✕</button>
          <h3 class="modal-title">编辑用户资料</h3>

          <div class="avatar-block">
            <div class="avatar-preview">{{ form.avatar || (form.nickname || '美').charAt(0).toUpperCase() }}</div>
            <div class="avatar-options">
              <button
                v-for="a in AVATAR_OPTIONS"
                :key="a"
                class="avatar-opt"
                :class="{ active: form.avatar === a }"
                @click="form.avatar = a"
              >{{ a }}</button>
              <button class="avatar-opt text" :class="{ active: !form.avatar }" @click="form.avatar = ''">字</button>
            </div>
          </div>

          <label class="field">
            <span class="label">昵称</span>
            <input v-model="form.nickname" class="input" maxlength="20" placeholder="昵称（最多 20 字）" />
          </label>
          <label class="field">
            <span class="label">性别</span>
            <select v-model="form.gender" class="input">
              <option value="">不透露</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </label>
          <label class="field">
            <span class="label">手机号</span>
            <input v-model="form.phone" class="input" maxlength="20" placeholder="手机号" />
          </label>
          <label class="field">
            <span class="label">个性签名</span>
            <textarea v-model="form.bio" class="input textarea" rows="2" maxlength="128" placeholder="一句话介绍"></textarea>
          </label>

          <div class="actions">
            <button class="btn ghost" @click="closeEdit">取消</button>
            <button class="btn solid" :disabled="saving" @click="submitEdit">{{ saving ? '保存中…' : '保存' }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 收货地址弹窗 -->
    <transition name="fade">
      <div v-if="addrShow" class="mask" @click.self="closeAddress">
        <div class="modal wide">
          <button class="close" @click="closeAddress">✕</button>
          <h3 class="modal-title">{{ addrUser?.nickname || addrUser?.account }} 的收货地址</h3>

          <div v-if="addrLoading" class="state"><span class="spinner"></span> 加载中…</div>
          <div v-else-if="addrList.length === 0" class="empty">📭 该用户还没有收货地址</div>
          <ul v-else class="addr-list">
            <li v-for="a in addrList" :key="a.id" class="addr-item">
              <div class="addr-top">
                <span class="addr-name">{{ a.name }}</span>
                <span class="addr-phone">{{ a.phone }}</span>
                <span class="addr-tag">{{ a.tag }}</span>
                <span v-if="a.isDefault" class="addr-default">默认</span>
                <button class="mini danger" @click="delAddress(a)">删除</button>
              </div>
              <div class="addr-text">{{ fullAddress(a) }}</div>
            </li>
          </ul>
        </div>
      </div>
    </transition>

    <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
  </div>
</template>

<style scoped>
.page { max-width: 1180px; animation: adIn 0.4s ease both; }
.page-head h1 { font-size: 22px; font-weight: 900; color: #0c3d39; position: relative; padding-left: 14px; }
.page-head h1::before { content: ""; position: absolute; left: 0; top: 4px; bottom: 4px; width: 5px; border-radius: 4px; background: linear-gradient(180deg, #00b894, #00cec9); }
.page-head p { margin-top: 6px; font-size: 13px; color: #6f8c88; line-height: 1.6; max-width: 780px; }

.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 16px 0 12px; flex-wrap: wrap; }
.chips { display: flex; gap: 8px; }
.chip { font-size: 12px; font-weight: 700; color: #0c3d39; background: #eef8f6; border: 1px solid #d8efeb; border-radius: 999px; padding: 5px 12px; }
.chip.ok { color: #0c8f7f; background: rgba(0,184,148,0.12); border-color: rgba(0,184,148,0.24); }
.chip.off { color: #d9533c; background: rgba(217,83,60,0.1); border-color: rgba(217,83,60,0.2); }
.filters { display: flex; gap: 8px; }
.search, .select {
  border: 1px solid #dfe9e7; border-radius: 10px; padding: 8px 12px; font-size: 13px;
  font-family: inherit; color: #0c3d39; outline: none; background: #fff;
}
.search { width: 220px; }
.search:focus, .select:focus { border-color: #00b894; box-shadow: 0 0 0 3px rgba(0,184,148,0.15); }

.state { text-align: center; padding: 40px; color: #6f8c88; font-size: 13px; }
.card { background: #fff; border-radius: 18px; padding: 8px; box-shadow: 0 8px 22px rgba(15,61,57,0.08); border: 1px solid #e6edef; overflow: auto; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.card:hover { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(15,61,57,0.12); }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { padding: 12px 12px; text-align: left; border-bottom: 1px solid #eef3f3; white-space: nowrap; }
th { font-size: 12px; color: #94aaa7; font-weight: 700; background: #f6fbfa; position: sticky; top: 0; z-index: 1; }
tbody tr:nth-child(even) { background: #fafdfc; }
tbody tr { transition: background 0.15s ease; }
tbody tr:hover { background: #f1fbf9; }
td.acc { font-weight: 700; color: #0c3d39; }
td.time { color: #8aa3a0; }
td.bio { max-width: 190px; overflow: hidden; text-overflow: ellipsis; color: #6f8c88; }

.user-cell { display: flex; align-items: center; gap: 8px; }
.avatar {
  width: 30px; height: 30px; flex: none; border-radius: 50%;
  background: linear-gradient(135deg, #00b894, #00cec9); color: #fff;
  display: grid; place-items: center; font-size: 15px; font-weight: 800;
}
.nick { font-weight: 700; color: #0c3d39; }

.badge { padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.badge.on { background: rgba(0,184,148,0.14); color: #0c8f7f; }
.badge.off { background: rgba(217,83,60,0.14); color: #d9533c; }

.ops { display: flex; gap: 6px; }
.mini { border: 1px solid #d8e4e2; background: #f3fbfa; color: #0c8f7f; border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer; font-weight: 600; font-family: inherit; }
.mini:hover { background: #e2f4f1; }
.mini.warn { color: #c47d00; border-color: #f0e0bf; background: #fff8ec; }
.mini.warn:hover { background: #fff2da; }
.mini.ok { color: #0c8f7f; }
.mini.danger { color: #d9533c; border-color: #f0c9c0; background: #fff4f1; }
.mini.danger:hover { background: #ffe6e0; }
.link { border: none; background: none; color: #0c8f7f; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; padding: 0; }
.link:hover { text-decoration: underline; }

/* ---------- 弹窗 ---------- */
.mask { position: fixed; inset: 0; z-index: 1000; background: rgba(6,50,46,0.45); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal {
  position: relative; width: 100%; max-width: 460px; max-height: 88vh; overflow-y: auto;
  background: #fff; border-radius: 20px; padding: 22px; box-shadow: 0 18px 50px rgba(0,80,70,0.32);
}
.modal.wide { max-width: 620px; }
.close { position: absolute; top: 14px; right: 14px; width: 30px; height: 30px; border: none; border-radius: 50%; background: rgba(0,0,0,0.06); color: #6f8c88; cursor: pointer; }
.close:hover { background: rgba(0,0,0,0.12); }
.modal-title { font-size: 18px; font-weight: 900; color: #0c3d39; margin-bottom: 16px; }

.avatar-block { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
.avatar-preview { width: 62px; height: 62px; flex: none; border-radius: 50%; background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; font-weight: 900; font-size: 26px; display: grid; place-items: center; }
.avatar-options { display: grid; grid-template-columns: repeat(9, 1fr); gap: 6px; flex: 1; }
.avatar-opt { width: 32px; height: 32px; border-radius: 9px; border: 1px solid #e2ecea; background: #fff; cursor: pointer; font-size: 17px; line-height: 1; transition: background 0.15s, border-color 0.15s; }
.avatar-opt:hover { background: rgba(0,184,148,0.1); }
.avatar-opt.active { border-color: #00b894; background: rgba(0,184,148,0.16); }
.avatar-opt.text { font-size: 12px; font-weight: 800; color: #0c3d39; }

.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 13px; }
.label { font-size: 13px; font-weight: 800; color: #0c3d39; }
.input { border: 1px solid #dfe9e7; border-radius: 11px; padding: 10px 12px; font-size: 14px; color: #0c3d39; font-family: inherit; outline: none; background: #fff; width: 100%; }
.input:focus { border-color: #00b894; box-shadow: 0 0 0 3px rgba(0,184,148,0.15); }
.textarea { resize: none; }

.actions { display: flex; gap: 12px; margin-top: 8px; }
.btn { flex: 1; border: none; cursor: pointer; padding: 12px 0; border-radius: 12px; font-size: 15px; font-weight: 800; font-family: inherit; }
.btn.ghost { background: rgba(0,0,0,0.05); color: #6f8c88; }
.btn.ghost:hover { background: rgba(0,0,0,0.1); }
.btn.solid { background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; box-shadow: 0 8px 18px rgba(0,150,136,0.35); }
.btn.solid:hover { transform: translateY(-1px); }
.btn.solid:disabled { cursor: not-allowed; opacity: 0.7; transform: none; }

.empty { padding: 34px 10px; text-align: center; font-size: 13px; color: #6f8c88; }
.addr-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.addr-item { border: 1px solid #e6edef; border-radius: 14px; padding: 12px 14px; background: #fbfefd; }
.addr-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.addr-name { font-size: 14px; font-weight: 800; color: #0c3d39; }
.addr-phone { font-size: 13px; color: #6f8c88; }
.addr-tag { font-size: 11px; font-weight: 800; color: #0c3d39; background: rgba(0,184,148,0.12); padding: 2px 9px; border-radius: 999px; }
.addr-default { font-size: 11px; font-weight: 800; color: #fff; background: #0c3d39; padding: 2px 9px; border-radius: 999px; }
.addr-top .mini { margin-left: auto; }
.addr-text { font-size: 12px; color: #6f8c88; margin-top: 8px; line-height: 1.5; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.22s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.toast { position: fixed; top: 28px; left: 50%; transform: translateX(-50%) translateY(-20px) scale(0.95); background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; padding: 13px 24px; border-radius: 14px; font-weight: 700; box-shadow: 0 10px 30px rgba(0,150,136,0.45); opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s; z-index: 1200; }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(0,0,0,0.12); border-top-color: #00b894; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: -2px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
