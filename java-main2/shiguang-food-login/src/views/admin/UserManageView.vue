<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { listUsers, updateUser, removeUser } from '../../api/admin.js'

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

onMounted(async () => {
  loading.value = true
  try { users.value = await listUsers() } catch (e) { showToast(e.message || '加载失败') } finally { loading.value = false }
})

async function toggleStatus(u) {
  try { await updateUser({ id: u.id, status: u.status ? 0 : 1 }); u.status = u.status ? 0 : 1; showToast(u.status ? '已启用该用户' : '已禁用该用户') } catch (e) { showToast(e.message) }
}
async function del(u) {
  if (!confirm(`确认删除用户「${u.account}」？`)) return
  try { await removeUser(u.id); users.value = await listUsers(); showToast('用户已删除') } catch (e) { showToast(e.message) }
}

onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>👥 用户管理</h1>
        <p>查看「用户信息展示」中的注册用户，可启用 / 禁用账号或删除用户。</p>
      </div>
    </div>

    <div v-if="loading" class="state"><span class="spinner"></span> 加载中…</div>

    <div v-else class="card">
      <table>
        <thead>
          <tr><th>ID</th><th>账号</th><th>昵称</th><th>类型</th><th>状态</th><th>注册时间</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.id }}</td>
            <td class="acc">{{ u.account }}</td>
            <td>{{ u.nickname }}</td>
            <td>{{ ['用户名','手机','邮箱'][u.accountType] || '用户名' }}</td>
            <td>
              <span class="badge" :class="u.status ? 'on' : 'off'">{{ u.status ? '正常' : '已禁用' }}</span>
            </td>
            <td class="time">{{ u.createdAt }}</td>
            <td class="ops">
              <button class="mini" :class="u.status ? 'warn' : 'ok'" @click="toggleStatus(u)">{{ u.status ? '禁用' : '启用' }}</button>
              <button class="mini danger" @click="del(u)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
</template>

<style scoped>
.page { max-width: 980px; animation: adIn 0.4s ease both; }
.page-head h1 { font-size: 22px; font-weight: 900; color: #0c3d39; position: relative; padding-left: 14px; }
.page-head h1::before { content: ""; position: absolute; left: 0; top: 4px; bottom: 4px; width: 5px; border-radius: 4px; background: linear-gradient(180deg, #00b894, #00cec9); }
.page-head p { margin-top: 6px; font-size: 13px; color: #6f8c88; line-height: 1.6; }
.state { text-align: center; padding: 40px; color: #6f8c88; }
.card { background: #fff; border-radius: 18px; padding: 8px; box-shadow: 0 8px 22px rgba(15,61,57,0.08); border: 1px solid #e6edef; overflow: auto; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.card:hover { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(15,61,57,0.12); }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #eef3f3; white-space: nowrap; }
th { font-size: 12px; color: #94aaa7; font-weight: 700; background: #f6fbfa; position: sticky; top: 0; }
tbody tr:nth-child(even) { background: #fafdfc; }
tbody tr { transition: background 0.15s ease; }
tbody tr:hover { background: #f1fbf9; }
td.acc { font-weight: 700; color: #0c3d39; }
td.time { color: #8aa3a0; }
.badge { padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.badge.on { background: rgba(0,184,148,0.14); color: #0c8f7f; }
.badge.off { background: rgba(217,83,60,0.14); color: #d9533c; }
.ops { display: flex; gap: 6px; }
.mini { border: 1px solid #d8e4e2; background: #f3fbfa; color: #0c8f7f; border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer; font-weight: 600; }
.mini:hover { background: #e2f4f1; }
.mini.warn { color: #c47d00; border-color: #f0e0bf; background: #fff8ec; }
.mini.ok { color: #0c8f7f; }
.mini.danger { color: #d9533c; border-color: #f0c9c0; background: #fff4f1; }
.mini.danger:hover { background: #ffe6e0; }

.toast { position: fixed; top: 28px; left: 50%; transform: translateX(-50%) translateY(-20px) scale(0.95); background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; padding: 13px 24px; border-radius: 14px; font-weight: 700; box-shadow: 0 10px 30px rgba(0,150,136,0.45); opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s; z-index: 999; }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: -2px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
