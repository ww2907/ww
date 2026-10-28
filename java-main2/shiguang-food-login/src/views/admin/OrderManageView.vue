<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { listOrders, updateOrderStatus } from '../../api/admin.js'

const orders = ref([])
const loading = ref(false)
const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null

const STATUS = ['待支付', '已支付', '已完成', '已取消']

function showToast(msg) {
  toastMsg.value = msg; toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2000)
}

onMounted(async () => {
  loading.value = true
  try { orders.value = await listOrders() } catch (e) { showToast(e.message || '加载失败') } finally { loading.value = false }
})

async function changeStatus(o, e) {
  const status = e.target.value
  try { await updateOrderStatus(o.id, status); o.status = status; showToast(`订单 ${o.id} 状态已更新为「${status}」`) } catch (err) { showToast(err.message) }
}

function statusClass(s) {
  return { '待支付': 'pending', '已支付': 'paid', '已完成': 'done', '已取消': 'cancel' }[s] || 'pending'
}

onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>🧾 订单管理</h1>
        <p>查看「下单点餐」产生的订单记录，并可修改订单状态（待支付 / 已支付 / 已完成 / 已取消）。</p>
      </div>
    </div>

    <div v-if="loading" class="state"><span class="spinner"></span> 加载中…</div>

    <div v-else class="card">
      <table>
        <thead>
          <tr><th>订单号</th><th>用户</th><th>店铺</th><th>商品</th><th>金额</th><th>状态</th><th>下单时间</th></tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o.id">
            <td class="oid">{{ o.id }}</td>
            <td>{{ o.account }}</td>
            <td>{{ o.restaurant }}</td>
            <td class="items">{{ o.items }}</td>
            <td class="amt">¥{{ o.amount }}</td>
            <td>
              <select class="st" :class="statusClass(o.status)" :value="o.status" @change="changeStatus(o, $event)">
                <option v-for="s in STATUS" :key="s" :value="s">{{ s }}</option>
              </select>
            </td>
            <td class="time">{{ o.createdAt }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
</template>

<style scoped>
.page { max-width: 1000px; animation: adIn 0.4s ease both; }
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
td.oid { font-weight: 700; color: #0c3d39; }
td.items { white-space: normal; min-width: 180px; color: #5d7873; }
td.amt { font-weight: 800; color: #0c8f7f; }
td.time { color: #8aa3a0; }
.st { padding: 6px 10px; border-radius: 9px; border: 1.5px solid #d8e4e2; font-size: 12px; font-weight: 700; cursor: pointer; background: #f7fffc; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
.st:hover { box-shadow: 0 0 0 3px rgba(0,206,201,0.12); }
.st:focus { outline: none; border-color: #00cec9; box-shadow: 0 0 0 3px rgba(0,206,201,0.18); }
.st.pending { color: #c47d00; border-color: #f0e0bf; }
.st.paid { color: #0c8f7f; border-color: #bcd9d3; }
.st.done { color: #2d7dd2; border-color: #bcd6f0; }
.st.cancel { color: #d9533c; border-color: #f0c9c0; }

.toast { position: fixed; top: 28px; left: 50%; transform: translateX(-50%) translateY(-20px) scale(0.95); background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; padding: 13px 24px; border-radius: 14px; font-weight: 700; box-shadow: 0 10px 30px rgba(0,150,136,0.45); opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s; z-index: 999; }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: -2px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
