<script setup>
// 漂浮食物：从底端升到顶端。24 个均匀错峰，任意时刻 ≥15 个可见
const emojis = [
  { e: '🍙', left: 92.0, delay: -7.11, size: 34, rotate: -14 },
  { e: '🥞', left: 52.4, delay: -6.58, size: 34, rotate: 14 },
  { e: '🍤', left: 4.6, delay: -7.81, size: 36, rotate: -3 },
  { e: '🍰', left: 53.9, delay: -1.06, size: 52, rotate: -11 },
  { e: '🥟', left: 61.5, delay: -10.49, size: 34, rotate: 18 },
  { e: '🍌', left: 39.1, delay: -17.57, size: 34, rotate: 17 },
  { e: '🍭', left: 13.8, delay: -7.54, size: 50, rotate: -11 },
  { e: '🍌', left: 30.6, delay: -14.69, size: 38, rotate: -12 },
  { e: '🍌', left: 55.8, delay: -3.38, size: 36, rotate: 17 },
  { e: '🥨', left: 7.0, delay: -1.07, size: 40, rotate: 13 },
  { e: '🍒', left: 52.0, delay: -13.99, size: 48, rotate: 11 },
  { e: '🥐', left: 29.8, delay: -14.3, size: 56, rotate: -3 },
  { e: '🍰', left: 56.1, delay: -9.45, size: 62, rotate: 3 },
  { e: '🍿', left: 44.1, delay: -10.96, size: 36, rotate: -11 },
  { e: '🍦', left: 41.1, delay: -13.63, size: 38, rotate: 13 },
  { e: '🍩', left: 4.8, delay: -12.03, size: 58, rotate: 17 },
  { e: '🍌', left: 76.8, delay: -14.73, size: 44, rotate: 4 },
  { e: '🥕', left: 48.7, delay: -14.34, size: 36, rotate: -13 },
  { e: '🧁', left: 46.5, delay: -11.95, size: 34, rotate: 1 },
  { e: '🌽', left: 56.5, delay: -12.26, size: 48, rotate: 0 },
  { e: '🥨', left: 38.0, delay: -12.04, size: 34, rotate: 11 },
  { e: '🥐', left: 17.1, delay: -2.11, size: 34, rotate: -5 },
  { e: '🧇', left: 28.6, delay: -13.29, size: 46, rotate: 7 },
  { e: '🍭', left: 48.7, delay: -2.99, size: 46, rotate: 17 }
]
</script>

<template>
  <div class="emoji-layer">
    <div
      class="rise-emoji"
      v-for="(item, i) in emojis"
      :key="i"
      :style="{ left: item.left + '%', animationDelay: item.delay + 's' }"
    >
      <span
        class="e-inner"
        :style="{ fontSize: item.size + 'px', transform: 'rotate(' + item.rotate + 'deg)' }"
        >{{ item.e }}</span
      >
    </div>
  </div>
</template>
