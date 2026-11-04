<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  order: { type: Object, default: null },
  acting: { type: Boolean, default: false }
})
const emit = defineEmits(['close', 'pay', 'cancel', 'reorder'])

function statusClass(s) {
  if (s === 1 || s === 2) return 'paid'
  if (s === 3) return 'cancel'
  return 'pending'
}

function timelineSteps(s) {
  if (s === 3) {
    return [
      { label: '待支付', state: 'done' },
      { label: '已取消', state: 'cancel' }
    ]
  }
  return [
    { label: '待支付', state: s === 0 ? 'active' : 'done' },
    { label: '已支付', state: s < 1 ? 'todo' : s === 1 ? 'active' : 'done' },
    { label: '已完成', state: s < 2 ? 'todo' : 'active' }
  ]
}

function actionsFor(s) {
  if (s === 0) return [{ label: '去支付', status: 1, cls: 'pay' }, { label: '取消订单', status: 3, cls: 'cancel' }]
  if (s === 1) return [{ label: '确认完成', status: 2, cls: 'done' }, { label: '取消订单', status: 3, cls: 'cancel' }]
  return []
}

const canReorder = computed(() => props.order && props.order.items && props.order.items.length > 0)
</script>

<template>
  <transition name="od-fade">
    <div v-if="show && order" class="od-mask" @click.self="emit('close')">
      <transition name="od-pop">
        <div class="od-modal" v-if="show && order">
          <button class="od-close" @click="emit('close')" title="关闭">✕</button>
          <div class="od-head">
            <span class="od-title">订单详情</span>
            <span class="oc-status" :class="statusClass(order.status)">{{ order.statusText }}</span>
          </div>

          <!-- 时间线 -->
          <div class="timeline">
            <template v-for="(step, i) in timelineSteps(order.status)" :key="i">
              <div class="tl-node" :class="step.state">
                <span class="tl-dot"></span>
                <span class="tl-label">{{ step.label }}</span>
              </div>
              <span v-if="i < timelineSteps(order.status).length - 1" class="tl-line" :class="step.state === 'done' ? 'on' : ''"></span>
            </template>
          </div>

          <!-- 店铺 -->
          <section class="block store">
            <div class="store-emoji">🍜</div>
            <div class="store-info">
              <div class="store-name">{{ order.restaurantName }}</div>
              <div class="store-sub">🧾 订单店铺</div>
            </div>
          </section>

          <!-- 菜品明细 -->
          <section class="block">
            <div class="block-head">
              <h2>🧾 菜品明细</h2>
              <span class="count">{{ (order.items || []).length }} 种 · {{ order.itemCount }} 件</span>
            </div>
            <ul class="items">
              <li class="item" v-for="(it, i) in order.items" :key="i">
                <span class="it-name">{{ it.dishName }}</span>
                <span class="it-x">×{{ it.qty }}</span>
                <span class="it-sub">¥{{ Number(it.subtotal || 0).toFixed(2) }}</span>
              </li>
            </ul>
            <div class="total-row">
              <span>合计</span>
              <span class="total-amt">¥{{ Number(order.totalAmount || 0).toFixed(2) }}</span>
            </div>
          </section>

          <!-- 订单信息 -->
          <section class="block info">
            <div class="info-row"><span>订单号</span><span class="mono">{{ order.orderNo }}</span></div>
            <div class="info-row"><span>下单时间</span><span>{{ order.createdAt }}</span></div>
          </section>

          <!-- 操作 -->
          <div class="actions" v-if="actionsFor(order.status).length">
            <button
              v-for="a in actionsFor(order.status)"
              :key="a.status"
              class="act"
              :class="a.cls"
              :disabled="acting"
              @click="emit(a.cls === 'pay' ? 'pay' : 'cancel', order)"
            >{{ a.label }}</button>
            <button class="act reorder" :disabled="acting" @click="emit('reorder', order)">再来一单</button>
          </div>
          <div class="final-tip" v-else-if="order.status === 2">✅ 订单已完成</div>
          <div class="final-tip" v-else>⛔ 订单已取消</div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<style scoped>
.od-mask {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(6, 50, 46, 0.45);
  backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.od-modal {
  position: relative;
  width: 100%; max-width: 460px;
  max-height: 88vh; overflow-y: auto;
  background: #fff; border-radius: 22px; padding: 20px;
  box-shadow: 0 18px 50px rgba(0, 80, 70, 0.32);
}
.od-close {
  position: absolute; top: 14px; right: 14px;
  width: 30px; height: 30px; border: none; border-radius: 50%;
  background: rgba(0,0,0,0.06); color: var(--muted); cursor: pointer; font-size: 14px;
}
.od-close:hover { background: rgba(0,0,0,0.12); }
.od-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-right: 36px; }
.od-title { font-size: 18px; font-weight: 900; color: var(--deep); }

.oc-status {
  display: inline-block; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 999px;
}
.oc-status.pending { background: rgba(243,156,18,0.15); color: #e08e0b; }
.oc-status.paid { background: rgba(0,184,148,0.15); color: var(--deep); }
.oc-status.cancel { background: rgba(120,120,120,0.15); color: #777; }

/* 时间线 */
.timeline { display: flex; align-items: center; justify-content: center; gap: 0; margin: 16px 0; }
.tl-node { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 64px; }
.tl-dot { width: 18px; height: 18px; border-radius: 50%; background: #d9e6e3; border: 2px solid #c2d6d2; }
.tl-node.active .tl-dot { background: var(--teal); border-color: var(--teal); box-shadow: 0 0 0 4px rgba(0,184,148,0.18); }
.tl-node.done .tl-dot { background: var(--deep); border-color: var(--deep); }
.tl-node.cancel .tl-dot { background: #9aa; border-color: #9aa; }
.tl-label { font-size: 12px; font-weight: 700; color: var(--muted); }
.tl-node.active .tl-label { color: var(--deep); }
.tl-node.done .tl-label { color: var(--deep); }
.tl-line { flex: 1; height: 3px; background: #d9e6e3; border-radius: 2px; min-width: 24px; }
.tl-line.on { background: var(--deep); }

/* 区块 */
.block { background: rgba(255,255,255,0.86); border-radius: 16px; padding: 14px; margin-top: 12px; border: 1px solid var(--line); }
.block-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px; }
.block-head h2 { font-size: 15px; font-weight: 900; color: var(--deep); }
.count { font-size: 12px; color: var(--muted); }

.store { display: flex; align-items: center; gap: 12px; }
.store-emoji {
  width: 44px; height: 44px; flex: none; border-radius: 13px; font-size: 24px;
  background: linear-gradient(135deg, rgba(0,184,148,0.15), rgba(0,206,201,0.15));
  display: grid; place-items: center;
}
.store-info { min-width: 0; }
.store-name { font-size:15px; font-weight: 800; color: var(--ink); }
.store-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }

.items { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.item { display: flex; align-items: center; gap: 10px; font-size: 14px; }
.it-name { flex: 1; min-width: 0; color: var(--ink); }
.it-x { color: var(--muted); }
.it-sub { font-weight: 800; color: #e8730c; }
.total-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--line);
  font-size: 13px; color: var(--muted);
}
.total-amt { font-size: 19px; font-weight: 900; color: #e8730c; }

.info { display: flex; flex-direction: column; gap: 10px; }
.info-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; }
.info-row > span:first-child { color: var(--muted); }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; word-break: break-all; text-align: right; }

.actions { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
.act {
  flex: 1; min-width: 90px; border: none; cursor: pointer; padding: 12px 0; border-radius: 14px;
  font-size: 14px; font-weight: 800; transition: transform 0.15s, box-shadow 0.15s;
}
.act:disabled { opacity: 0.6; cursor: default; }
.act.pay { background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff; box-shadow: 0 8px 18px rgba(0,150,136,0.4); }
.act.pay:hover:not(:disabled) { transform: translateY(-1px); }
.act.done { background: rgba(0,184,148,0.14); color: var(--deep); border: 1px solid rgba(0,184,148,0.35); }
.act.done:hover:not(:disabled) { background: rgba(0,184,148,0.24); }
.act.cancel { background: rgba(120,120,120,0.12); color: #777; }
.act.cancel:hover:not(:disabled) { background: rgba(120,120,120,0.22); }
.act.reorder { background: rgba(255,255,255,0.9); color: var(--deep); border: 1px solid var(--line); }
.act.reorder:hover:not(:disabled) { background: rgba(0,184,148,0.1); }
.final-tip { text-align: center; font-size: 13px; font-weight: 700; color: var(--muted); padding: 16px 0 4px; }

.od-fade-enter-active, .od-fade-leave-active { transition: opacity 0.25s ease; }
.od-fade-enter-from, .od-fade-leave-to { opacity: 0; }
.od-pop-enter-active, .od-pop-leave-active { transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1); }
.od-pop-enter-from, .od-pop-leave-to { transform: scale(0.94) translateY(10px); }
</style>
