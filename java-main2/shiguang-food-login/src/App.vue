<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import EmojiLayer from './components/EmojiLayer.vue'
import BokehLayer from './components/BokehLayer.vue'
import ToastHost from './components/ToastHost.vue'

const route = useRoute()
const bgRef = ref(null)

// 前台宽壳页面（1100px）：主页面 + 店铺详情 / 结算 / 订单详情。
// 详情页此前落到登录页那套 460px 居中壳里，导致和首页宽度、排版完全对不上。
const WIDE_SHELL_PAGES = ['home', 'food', 'orders', 'profile', 'restaurant', 'order', 'order-detail']

// 后台管理页面：不显示漂浮背景与品牌头，使用全宽 shell
const isAdmin = computed(() => !!(route.meta && route.meta.admin))
const shellClass = computed(() => {
  if (isAdmin.value) return 'shell-admin'
  return WIDE_SHELL_PAGES.includes(route.name) ? 'shell-home' : 'shell-auth'
})
// 宽壳页面自带顶部导航栏（AppHeader），不再重复渲染品牌头
const showBrand = computed(() => !isAdmin.value && !WIDE_SHELL_PAGES.includes(route.name))

function onMouseMove(e) {
  if (!bgRef.value) return
  bgRef.value.style.setProperty('--mx', e.clientX + 'px')
  bgRef.value.style.setProperty('--my', e.clientY + 'px')
}
</script>

<template>
  <div class="app-root">
    <!-- 固定背景 + 氛围层（漂浮食物 / 光斑），后台管理页不展示 -->
    <div class="app-bg" v-if="!isAdmin" ref="bgRef" @mousemove="onMouseMove">
      <EmojiLayer />
      <BokehLayer />
    </div>

    <!-- 内容壳 -->
    <div class="shell" :class="shellClass">
      <div class="brand-top" v-if="showBrand">
        <div class="logo"><span class="mark">🍜</span> 食光 · 美食</div>
        <div class="tagline">发现身边的每一口好味道 🌿</div>
      </div>
      <!-- 路由直出，不套 <Transition mode="out-in">：
           登录页根节点是子组件（非原生元素），Vue 无法完成离场动画，
           out-in 会一直等旧组件离场，导致跳转后 router-view 空白（页面只剩背景层）。 -->
      <router-view v-slot="{ Component }">
        <component :is="Component" :key="route.fullPath" />
      </router-view>
    </div>

    <!-- 全局轻提示宿主 -->
    <ToastHost />
  </div>
</template>
