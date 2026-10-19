<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import EmojiLayer from './components/EmojiLayer.vue'
import BokehLayer from './components/BokehLayer.vue'

const route = useRoute()
const bgRef = ref(null)

function onMouseMove(e) {
  if (!bgRef.value) return
  bgRef.value.style.setProperty('--mx', e.clientX + 'px')
  bgRef.value.style.setProperty('--my', e.clientY + 'px')
}
</script>

<template>
  <div class="app-root">
    <!-- 固定背景 + 氛围层（漂浮食物 / 光斑） -->
    <div class="app-bg" ref="bgRef" @mousemove="onMouseMove">
      <EmojiLayer />
      <BokehLayer />
    </div>

    <!-- 内容壳：登录类页面居中卡片，主页全宽可滚动 -->
    <div class="shell" :class="route.name === 'home' ? 'shell-home' : 'shell-auth'">
      <div class="brand-top" v-if="route.name !== 'home'">
        <div class="logo"><span class="mark">🍜</span> 食光 · 美食</div>
        <div class="tagline">发现身边的每一口好味道 🌿</div>
      </div>
      <router-view />
    </div>
  </div>
</template>
