<script setup>
import { ref, computed, watch } from 'vue'
import { cart } from '../store/cart.js'

const props = defineProps({
  show: { type: Boolean, default: false },
  dish: { type: Object, default: null },
  restaurantId: { type: [String, Number], default: '' },
  restaurantName: { type: String, default: '' }
})
const emit = defineEmits(['close', 'added'])

const qty = ref(1)

// 每次打开新菜品时把数量重置为 1，并显示已加入购物车的数量
watch(
  () => props.dish,
  (d) => {
    qty.value = 1
  }
)

const inCart = computed(() => {
  if (!props.dish) return 0
  return cart.qtyOf(props.restaurantId, props.dish.id != null ? props.dish.id : props.dish.name)
})

function plus() {
  qty.value += 1
}
function minus() {
  if (qty.value > 1) qty.value -= 1
}

function addToCart() {
  if (!props.dish) return
  cart.addItem(props.restaurantId, { ...props.dish, restaurantName: props.restaurantName }, qty.value)
  emit('added', { dish: props.dish, qty: qty.value })
  emit('close')
}

function close() {
  emit('close')
}
</script>

<template>
  <transition name="dp-fade">
    <div v-if="show && dish" class="dp-mask" @click.self="close">
      <transition name="dp-pop">
        <div class="dp-sheet" v-if="show && dish">
          <button class="dp-close" @click="close" title="关闭">✕</button>

          <div class="dp-hero">
            <div class="dp-emoji">{{ dish.emoji || '🍽️' }}</div>
            <div class="dp-hero-text">
              <h3 class="dp-name">{{ dish.name }}</h3>
              <div class="dp-price">¥{{ Number(dish.price || 0).toFixed(2) }}</div>
            </div>
          </div>

          <p class="dp-desc">{{ dish.desc || '暂无描述' }}</p>

          <div class="dp-meta">
            <span>已加入购物车：<b>{{ inCart }}</b> 份</span>
          </div>

          <div class="dp-actions">
            <div class="dp-stepper">
              <button class="dp-step" @click="minus">−</button>
              <span class="dp-qnum">{{ qty }}</span>
              <button class="dp-step" @click="plus">+</button>
            </div>
            <button class="dp-add" @click="addToCart">加入购物车</button>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<style scoped>
.dp-mask {
  position: fixed;
  inset: 0;
  background: rgba(6, 50, 46, 0.45);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}
.dp-sheet {
  position: relative;
  width: 100%;
  max-width: 520px;
  background: #fff;
  border-radius: 22px 22px 0 0;
  padding: 22px 20px calc(20px + env(safe-area-inset-bottom));
  box-shadow: 0 -16px 40px rgba(0, 80, 70, 0.3);
}
@media (min-width: 560px) {
  .dp-mask { align-items: center; }
  .dp-sheet { border-radius: 22px; }
}
.dp-close {
  position: absolute;
  top: 14px; right: 14px;
  width: 30px; height: 30px;
  border: none; border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  color: var(--muted); cursor: pointer; font-size: 14px;
}
.dp-close:hover { background: rgba(0, 0, 0, 0.12); }

.dp-hero { display: flex; align-items: center; gap: 14px; }
.dp-emoji {
  width: 64px; height: 64px; flex: none; border-radius: 18px; font-size: 34px;
  background: linear-gradient(135deg, rgba(0, 184, 148, 0.15), rgba(0, 206, 201, 0.15));
  display: grid; place-items: center;
}
.dp-hero-text { min-width: 0; }
.dp-name { font-size: 19px; font-weight: 900; color: var(--ink); }
.dp-price { font-size: 18px; font-weight: 900; color: #e8730c; margin-top: 4px; }

.dp-desc {
  margin-top: 14px; font-size: 13px; line-height: 1.7; color: var(--muted);
}
.dp-meta { margin-top: 14px; font-size: 12px; color: var(--muted); }
.dp-meta b { color: var(--deep); }

.dp-actions {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  margin-top: 18px;
}
.dp-stepper { display: flex; align-items: center; gap: 12px; }
.dp-step {
  width: 34px; height: 34px; border-radius: 11px; border: 1px solid var(--line);
  background: #fff; color: var(--deep); font-size: 20px; font-weight: 800;
  cursor: pointer; line-height: 1;
}
.dp-step:hover { background: rgba(0, 184, 148, 0.12); }
.dp-qnum { font-size: 16px; font-weight: 800; color: var(--deep); min-width: 20px; text-align: center; }

.dp-add {
  flex: 1; border: none; cursor: pointer; padding: 13px 0; border-radius: 14px;
  background: linear-gradient(135deg, var(--teal), var(--cyan)); color: #fff;
  font-weight: 800; font-size: 15px; font-family: inherit;
  box-shadow: 0 8px 18px rgba(0, 150, 136, 0.45); transition: transform 0.15s;
}
.dp-add:hover { transform: translateY(-1px); }

.dp-fade-enter-active, .dp-fade-leave-active { transition: opacity 0.25s ease; }
.dp-fade-enter-from, .dp-fade-leave-to { opacity: 0; }
.dp-pop-enter-active, .dp-pop-leave-active { transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1); }
.dp-pop-enter-from, .dp-pop-leave-to { transform: translateY(30px); }
</style>
