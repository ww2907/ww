<script setup>
import { useRouter } from 'vue-router'
import { isLoggedIn } from '../store.js'

const router = useRouter()

const features = [
  { icon: '🗺️', title: '美食地图', desc: '发现身边的每一口好味道' },
  { icon: '⭐', title: '每日推荐', desc: '为你精选当季人气餐厅' },
  { icon: '💬', title: '社区分享', desc: '和同好一起记录味觉时光' }
]

function enter() {
  router.push(isLoggedIn() ? '/home' : '/login')
}
function goRegister() {
  router.push('/register')
}
</script>

<template>
  <div class="entry">
    <div class="badge"><span>🍜</span></div>
    <h1 class="title">食光 · 美食</h1>
    <p class="slogan">发现身边的每一口好味道 🌿</p>

    <p class="intro">
      从一碗热汤面到深夜的路边摊，<br />
      在「食光」记录、分享、收藏属于你的味觉时光。
    </p>

    <div class="features">
      <div class="feature" v-for="f in features" :key="f.title">
        <div class="f-icon">{{ f.icon }}</div>
        <div class="f-text">
          <div class="f-title">{{ f.title }}</div>
          <div class="f-desc">{{ f.desc }}</div>
        </div>
      </div>
    </div>

    <button class="enter-btn" @click="enter">
      <span>进 入</span>
      <span class="arrow">→</span>
    </button>

    <p class="alt">
      还没有账号？
      <a href="#" @click.prevent="goRegister">立即注册</a>
    </p>
  </div>
</template>

<style scoped>
.entry {
  width: 100%;
  background: var(--card);
  backdrop-filter: blur(16px);
  border-radius: 28px;
  padding: 44px 38px 36px;
  box-shadow: var(--shadow);
  border: 1px solid rgba(255, 255, 255, 0.6);
  text-align: center;
  animation: cardIn 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(34px) scale(0.97); }
  to { opacity: 1; transform: none; }
}

.badge {
  width: 84px;
  height: 84px;
  margin: 0 auto 18px;
  border-radius: 24px;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  display: grid;
  place-items: center;
  font-size: 44px;
  box-shadow: 0 12px 28px rgba(0, 150, 136, 0.45);
  animation: floaty 3.6s ease-in-out infinite;
}
@keyframes floaty {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.title {
  font-size: 34px;
  font-weight: 900;
  letter-spacing: 3px;
  background: linear-gradient(90deg, var(--teal), var(--cyan), var(--mint));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.slogan {
  margin-top: 8px;
  font-size: 15px;
  color: var(--muted);
}
.intro {
  margin-top: 20px;
  font-size: 14px;
  line-height: 1.9;
  color: var(--ink);
}

.features {
  margin-top: 26px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.feature {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(0, 184, 148, 0.07);
  border: 1px solid var(--line);
  text-align: left;
}
.f-icon {
  flex: none;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  display: grid;
  place-items: center;
  font-size: 22px;
}
.f-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--deep);
}
.f-desc {
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}

.enter-btn {
  margin-top: 28px;
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--teal), var(--cyan));
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 4px;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(0, 150, 136, 0.45);
  transition: transform 0.15s, box-shadow 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.enter-btn .arrow {
  font-size: 20px;
  transition: transform 0.2s;
}
.enter-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 34px rgba(0, 150, 136, 0.6);
}
.enter-btn:hover .arrow { transform: translateX(6px); }
.enter-btn:active { transform: translateY(0); }

.alt {
  margin-top: 20px;
  font-size: 13px;
  color: var(--muted);
}
.alt a {
  color: var(--deep);
  font-weight: 700;
  text-decoration: none;
  border-bottom: 1px solid var(--mint);
}
.alt a:hover { color: var(--teal); }
</style>
