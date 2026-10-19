<script setup>
// 漂浮光斑：纯 CSS 元素，从底端缓缓升起
const bokehs = [
  { left: 6, bottom: -14, size: 18, r: 255, g: 255, b: 255, a: 0.4, dur: 13, delay: 0 },
  { left: 15, bottom: -22, size: 10, r: 0, g: 206, b: 201, a: 0.35, dur: 16, delay: -3 },
  { left: 24, bottom: -12, size: 26, r: 255, g: 255, b: 255, a: 0.7, dur: 11, delay: -6 },
  { left: 33, bottom: -28, size: 14, r: 77, g: 208, b: 225, a: 0.3, dur: 18, delay: -2 },
  { left: 42, bottom: -16, size: 22, r: 85, g: 239, b: 196, a: 0.4, dur: 14, delay: -9 },
  { left: 51, bottom: -20, size: 9, r: 0, g: 206, b: 201, a: 0.35, dur: 12, delay: -5 },
  { left: 60, bottom: -13, size: 30, r: 255, g: 255, b: 255, a: 0.7, dur: 19, delay: -11 },
  { left: 69, bottom: -26, size: 16, r: 77, g: 208, b: 225, a: 0.3, dur: 15, delay: -7 },
  { left: 78, bottom: -15, size: 12, r: 85, g: 239, b: 196, a: 0.4, dur: 13, delay: -1 },
  { left: 87, bottom: -24, size: 20, r: 0, g: 206, b: 201, a: 0.35, dur: 17, delay: -10 },
  { left: 11, bottom: -18, size: 24, r: 255, g: 255, b: 255, a: 0.7, dur: 12, delay: -4 },
  { left: 29, bottom: -21, size: 11, r: 77, g: 208, b: 225, a: 0.3, dur: 16, delay: -8 },
  { left: 47, bottom: -14, size: 28, r: 85, g: 239, b: 196, a: 0.4, dur: 14, delay: -12 },
  { left: 63, bottom: -27, size: 15, r: 0, g: 206, b: 201, a: 0.35, dur: 18, delay: -6 },
  { left: 73, bottom: -19, size: 19, r: 255, g: 255, b: 255, a: 0.7, dur: 13, delay: -3 },
  { left: 83, bottom: -23, size: 13, r: 77, g: 208, b: 225, a: 0.3, dur: 17, delay: -9 },
  { left: 91, bottom: -17, size: 25, r: 85, g: 239, b: 196, a: 0.4, dur: 15, delay: -13 },
  { left: 38, bottom: -25, size: 17, r: 0, g: 206, b: 201, a: 0.35, dur: 16, delay: -2 }
]
</script>

<template>
  <div
    class="bokeh"
    v-for="(b, i) in bokehs"
    :key="i"
    :style="{
      left: b.left + '%',
      bottom: b.bottom + 'px',
      width: b.size + 'px',
      height: b.size + 'px',
      background: 'radial-gradient(circle at 30% 30%, #fff, rgba(' + b.r + ',' + b.g + ',' + b.b + ',' + b.a + '))',
      animationDuration: b.dur + 's',
      animationDelay: b.delay + 's'
    }"
  ></div>
</template>
