<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import EmojiLayer from './components/EmojiLayer.vue'
import BokehLayer from './components/BokehLayer.vue'

const route = useRoute()
const bgRef = ref(null)

// 前台四个主页面共用同一套宽壳（1100px），保证导航栏/搜索框/卡片区尺寸完全一致
const MAIN_PAGES = ['home', 'food', 'orders', 'profile']

// 后台管理页面：不显示漂浮背景与品牌头，使用全宽 shell
const isAdmin = computed(() => !!(route.meta && route.meta.admin))
const shellClass = computed(() => {
  if (isAdmin.value) return 'shell-admin'
  return MAIN_PAGES.includes(route.name) ? 'shell-home' : 'shell-auth'
})
// 主页面自带顶部导航栏，不再重复渲染品牌头
const showBrand = computed(
  () => !isAdmin.value && !MAIN_PAGES.includes(route.name) && route.name !== 'home'
)

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
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>
