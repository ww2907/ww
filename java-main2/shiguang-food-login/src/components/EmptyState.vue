<script setup>
// 通用空状态组件：内置多种 SVG 插画 + 标题 + 描述 + 操作插槽
// type: order | search | cart | food | generic
defineProps({
  type: { type: String, default: 'generic' },
  title: { type: String, default: '这里还什么都没有' },
  desc: { type: String, default: '' },
  compact: { type: Boolean, default: false }
})
</script>

<template>
  <div class="empty-state" :class="{ compact }">
    <div class="es-illu">
      <svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="esGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#00b894" />
            <stop offset="100%" stop-color="#00cec9" />
          </linearGradient>
        </defs>
        <circle cx="110" cy="80" r="62" fill="url(#esGrad)" opacity="0.12" />
        <circle cx="110" cy="80" r="46" fill="url(#esGrad)" opacity="0.08" />

        <!-- 订单：收据 -->
        <g v-if="type === 'order'" fill="none" stroke="url(#esGrad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M80 44 h60 v86 a4 4 0 0 1-4 4 h-52 a4 4 0 0 1-4-4 z" />
          <path d="M80 44 a6 6 0 0 0 12 0 a6 6 0 0 0 12 0 a6 6 0 0 0 12 0 a6 6 0 0 0 12 0 a6 6 0 0 0 12 0" />
          <line x1="92" y1="66" x2="128" y2="66" opacity="0.55" />
          <line x1="92" y1="82" x2="128" y2="82" opacity="0.55" />
          <line x1="92" y1="98" x2="116" y2="98" opacity="0.55" />
          <circle cx="110" cy="118" r="9" />
          <path d="M106 118 l3 3 l5-6" />
        </g>

        <!-- 搜索：放大镜 -->
        <g v-else-if="type === 'search'" fill="none" stroke="url(#esGrad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="96" cy="70" r="28" />
          <line x1="116" y1="90" x2="142" y2="118" stroke-width="6" />
          <line x1="86" y1="70" x2="106" y2="70" opacity="0.45" />
          <line x1="96" y1="60" x2="96" y2="80" opacity="0.45" />
        </g>

        <!-- 购物车 -->
        <g v-else-if="type === 'cart'" fill="none" stroke="url(#esGrad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M74 64 h12 l10 46 a6 6 0 0 0 6 5 h44 a6 6 0 0 0 6-5 l6-30 h-86" />
          <path d="M88 64 a14 14 0 0 1 28 0" />
          <circle cx="104" cy="126" r="4" fill="url(#esGrad)" stroke="none" />
          <circle cx="140" cy="126" r="4" fill="url(#esGrad)" stroke="none" />
        </g>

        <!-- 美食：空碗 + 热气 -->
        <g v-else-if="type === 'food'" fill="none" stroke="url(#esGrad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M66 92 a44 44 0 0 0 88 0 z" />
          <line x1="66" y1="92" x2="154" y2="92" />
          <path d="M92 70 q-6-8 0-16" opacity="0.5" />
          <path d="M110 70 q-6-8 0-16" opacity="0.5" />
          <path d="M128 70 q-6-8 0-16" opacity="0.5" />
        </g>

        <!-- 通用：空盒子 -->
        <g v-else fill="none" stroke="url(#esGrad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M70 74 h80 l-10 44 h-60 z" />
          <path d="M70 74 l10-16 h60 l10 16" />
          <line x1="110" y1="58" x2="110" y2="74" opacity="0.5" />
          <line x1="80" y1="92" x2="140" y2="92" opacity="0.4" />
        </g>
      </svg>
    </div>
    <h3 class="es-title">{{ title }}</h3>
    <p v-if="desc" class="es-desc">{{ desc }}</p>
    <div v-if="$slots.action" class="es-action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  text-align: center;
  padding: 36px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.empty-state.compact { padding: 24px 12px; }
.es-illu {
  width: 150px;
  max-width: 60%;
  margin-bottom: 6px;
  animation: esFloat 4.5s ease-in-out infinite;
}
.es-illu svg { width: 100%; height: auto; display: block; }
.es-title { font-size: 16px; font-weight: 900; color: var(--deep); }
.es-desc { font-size: 13px; color: var(--muted); line-height: 1.6; max-width: 320px; }
.es-action { margin-top: 14px; }

@keyframes esFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@media (prefers-reduced-motion: reduce) {
  .es-illu { animation: none; }
}
</style>
