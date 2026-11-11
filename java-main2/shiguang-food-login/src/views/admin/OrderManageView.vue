<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { listOrders, updateOrderStatus } from '../../api/admin.js'

const orders = ref([])
const loading = ref(false)
const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null

const STATUS = ['待支付', '已支付', '已完成', '已取消']
const PAGE_SIZE = 10

// ---------- 筛选 / 分页 ----------
// 订单量上来后整页平铺就不好用了：这里做「关键字 + 状态」筛选 + 前端分页。
// 接口仍是一次性返回全部订单（与后台其它列表一致），数据量再大一个量级时
// 再把筛选和分页下推到后端（/admin/order?keyword=&status=&page=）。
const keyword = ref('')
const statusFilter = ref('') // '' = 全部
const page = ref(1)

const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  return orders.value.filter((o) => {
    if (statusFilter.value && o.status !== statusFilter.value) return false
    if (!k) return true
    return [o.orderNo, o.id, o.account, o.restaurant, o.receiverName, o.receiverPhone, o.address]
      .some((v) => String(v == null ? '' : v).toLowerCase().includes(k))
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const paged = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})
// 状态筛选胶囊上的计数（基于关键字过滤后的结果，切换状态时数字才对得上）
const keywordMatched = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return orders.value
  return orders.value.filter((o) =>
    [o.orderNo, o.id, o.account, o.restaurant, o.receiverName, o.receiverPhone, o.address]
      .some((v) => String(v == null ? '' : v).toLowerCase().includes(k)))
})
const statusCounts = computed(() => {
  const m = { '': keywordMatched.value.length }
  STATUS.forEach((s) => { m[s] = 0 })
  keywordMatched.value.forEach((o) => { if (m[o.status] != null) m[o.status] += 1 })
  return m
})
// 页码窗口：最多 5 个，跟随当前页滑动
const pageList = computed(() => {
  const total = totalPages.value
  const cur = page.value
  let start = Math.max(1, cur - 2)
  const end = Math.min(total, start + 4)
  start = Math.max(1, end - 4)
  const list = []
  for (let i = start; i <= end; i++) list.push(i)
  return list
})

watch([keyword, statusFilter], () => { page.value = 1 })
watch(totalPages, (tp) => { if (page.value > tp) page.value = tp })

function pickStatus(s) {
  statusFilter.value = s
}
function resetFilter() {
  keyword.value = ''
  statusFilter.value = ''
}
function goPage(n) {
  if (n < 1 || n > totalPages.value || n === page.value) return
  page.value = n
}

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
  const prev = o.status
  try {
    await updateOrderStatus(o.id, status)
    o.status = status
    showToast(`订单 ${o.orderNo || o.id} 状态已更新为「${status}」`)
  } catch (err) {
    // 失败要把下拉框回滚，否则界面显示的状态和库里不一致
    e.target.value = prev
    showToast(err.message || '更新失败')
  }
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

    <div v-if="loading" class="state"><span class="spinner dark"></span> 加载中…</div>

    <template v-else>
      <!-- 筛选栏：关键字 + 状态 -->
      <div class="filters">
        <div class="search-box">
          <span class="s-ico">🔎</span>
          <input
            v-model="keyword"
            class="s-input"
            type="text"
            placeholder="搜订单号 / 账号 / 店铺 / 收货人 / 地址…"
          />
          <button v-if="keyword" class="s-clear" @click="keyword = ''" title="清空">✕</button>
        </div>
        <div class="chips">
          <button class="chip" :class="{ active: statusFilter === '' }" @click="pickStatus('')">
            全部<span class="chip-num">{{ statusCounts[''] }}</span>
          </button>
          <button
            v-for="s in STATUS"
            :key="s"
            class="chip"
            :class="[{ active: statusFilter === s }, statusClass(s)]"
            @click="pickStatus(s)"
          >{{ s }}<span class="chip-num">{{ statusCounts[s] }}</span></button>
          <button v-if="keyword || statusFilter" class="chip reset" @click="resetFilter">清空筛选</button>
        </div>
      </div>

      <div class="card">
        <table>
          <thead>
            <tr><th>订单号</th><th>用户</th><th>店铺</th><th>商品</th><th>金额</th><th>收货信息</th><th>状态</th><th>下单时间</th></tr>
          </thead>
          <tbody>
            <tr v-for="o in paged" :key="o.id">
              <td class="oid">
                <div class="ono">{{ o.orderNo || o.id }}</div>
                <div class="oid-sub">#{{ o.id }}</div>
              </td>
              <td>{{ o.account }}</td>
              <td>{{ o.restaurant }}</td>
              <td class="items">{{ o.items }}</td>
              <td class="amt">¥{{ Number(o.amount || 0).toFixed(2) }}</td>
              <td class="addr-cell">
                <template v-if="o.address">
                  <div class="addr-who">{{ o.receiverName }} <span class="addr-tel">{{ o.receiverPhone }}</span></div>
                  <div class="addr-text" :title="o.address">{{ o.address }}</div>
                </template>
                <span v-else class="addr-none">未填写地址</span>
              </td>
              <td>
                <select class="st" :class="statusClass(o.status)" :value="o.status" @change="changeStatus(o, $event)">
                  <option v-for="s in STATUS" :key="s" :value="s">{{ s }}</option>
                </select>
              </td>
              <td class="time">{{ o.createdAt }}</td>
            </tr>
            <tr v-if="!paged.length">
              <td colspan="8" class="empty-row">
                <template v-if="orders.length">没有匹配的订单，试试换个关键字或清空筛选</template>
                <template v-else>还没有订单</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="pager" v-if="filtered.length">
        <span class="pg-info">
          共 {{ filtered.length }} 条<template v-if="filtered.length !== orders.length">（全部 {{ orders.length }} 条）</template>
          · 第 {{ page }} / {{ totalPages }} 页
        </span>
        <div class="pg-btns">
          <button class="pg" :disabled="page === 1" @click="goPage(page - 1)">上一页</button>
          <button
            v-for="p in pageList"
            :key="p"
            class="pg"
            :class="{ active: p === page }"
            @click="goPage(p)"
          >{{ p }}</button>
          <button class="pg" :disabled="page === totalPages" @click="goPage(page + 1)">下一页</button>
        </div>
      </div>
    </template>

    <div class="toast" :class="{ show: toastShow }">{{ toastMsg }}</div>
  </div>
</template>

<style scoped>
.page { max-width: 1240px; animation: adIn 0.4s ease both; }
.page-head h1 { font-size: 22px; font-weight: 900; color: #0c3d39; position: relative; padding-left: 14px; }
.page-head h1::before { content: ""; position: absolute; left: 0; top: 4px; bottom: 4px; width: 5px; border-radius: 4px; background: linear-gradient(180deg, #00b894, #00cec9); }
.page-head p { margin-top: 6px; font-size: 13px; color: #6f8c88; line-height: 1.6; }
.state { text-align: center; padding: 40px; color: #6f8c88; }

/* 筛选栏 */
.filters { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin: 14px 0 12px; }
.search-box {
  position: relative; display: flex; align-items: center; gap: 8px;
  background: #fff; border: 1.5px solid #dfeaea; border-radius: 12px;
  padding: 0 12px; height: 38px; min-width: 320px; flex: 0 1 380px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.search-box:focus-within { border-color: #00cec9; box-shadow: 0 0 0 3px rgba(0,206,201,0.15); }
.s-ico { font-size: 13px; opacity: 0.7; }
.s-input { flex: 1; border: none; outline: none; background: transparent; font-size: 13px; font-family: inherit; color: #0c3d39; }
.s-input::placeholder { color: #a9bcb9; }
.s-clear { border: none; background: #eef5f4; color: #6f8c88; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 11px; line-height: 1; }
.s-clear:hover { background: #dfeceb; }

.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  border: 1.5px solid #e0ebea; background: #fff; color: #4d6b67;
  padding: 7px 13px; border-radius: 999px; font-size: 12px; font-weight: 700;
  font-family: inherit; cursor: pointer; transition: all 0.15s ease;
}
.chip:hover { border-color: #b9ded8; color: #0c8f7f; }
.chip.active { background: linear-gradient(135deg, #00b894, #00cec9); border-color: transparent; color: #fff; box-shadow: 0 6px 14px rgba(0,150,136,0.28); }
.chip-num { font-size: 11px; opacity: 0.75; }
.chip.active .chip-num { opacity: 0.95; }
.chip.pending.active { background: linear-gradient(135deg, #f0a92c, #e08b00); box-shadow: 0 6px 14px rgba(224,139,0,0.28); }
.chip.done.active { background: linear-gradient(135deg, #2d7dd2, #1f63ad); box-shadow: 0 6px 14px rgba(45,125,210,0.28); }
.chip.cancel.active { background: linear-gradient(135deg, #e2664c, #c9452c); box-shadow: 0 6px 14px rgba(201,69,44,0.28); }
.chip.reset { border-style: dashed; color: #8aa3a0; }

/* 分页 */
.pager { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin: 12px 2px 0; }
.pg-info { font-size: 12px; color: #6f8c88; }
.pg-btns { display: flex; gap: 6px; }
.pg {
  min-width: 34px; height: 32px; padding: 0 11px; border-radius: 10px;
  border: 1.5px solid #e0ebea; background: #fff; color: #4d6b67;
  font-size: 12px; font-weight: 700; font-family: inherit; cursor: pointer;
  transition: all 0.15s ease;
}
.pg:hover:not(:disabled) { border-color: #b9ded8; color: #0c8f7f; }
.pg.active { background: linear-gradient(135deg, #00b894, #00cec9); border-color: transparent; color: #fff; }
.pg:disabled { opacity: 0.45; cursor: default; }
.spinner.dark { border-color: rgba(0,150,136,0.25); border-top-color: #00b894; }
.card { background: #fff; border-radius: 18px; padding: 8px; box-shadow: 0 8px 22px rgba(15,61,57,0.08); border: 1px solid #e6edef; overflow: auto; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.card:hover { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(15,61,57,0.12); }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #eef3f3; white-space: nowrap; }
th { font-size: 12px; color: #94aaa7; font-weight: 700; background: #f6fbfa; position: sticky; top: 0; }
tbody tr:nth-child(even) { background: #fafdfc; }
tbody tr { transition: background 0.15s ease; }
tbody tr:hover { background: #f1fbf9; }
td.oid { font-weight: 700; color: #0c3d39; }
td.oid .ono { font-weight: 800; }
td.oid .oid-sub { font-size: 11px; font-weight: 600; color: #9fb3b0; margin-top: 2px; }
td.items { white-space: normal; min-width: 180px; color: #5d7873; }
td.amt { font-weight: 800; color: #0c8f7f; }
td.time { color: #8aa3a0; }
/* 收货信息列 */
td.addr-cell { white-space: normal; min-width: 200px; max-width: 270px; }
.addr-who { font-size: 12px; font-weight: 800; color: #0c3d39; }
.addr-tel { font-weight: 600; color: #8aa3a0; margin-left: 4px; }
.addr-text {
  font-size: 12px; color: #5d7873; line-height: 1.5; margin-top: 2px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.addr-none { font-size: 12px; color: #c0392b; font-weight: 700; }
.empty-row { text-align: center; color: #8aa3a0; padding: 26px 0; }
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
