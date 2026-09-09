<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ size?: number }>(), { size: 180 })

/**
 * 用 CSS 3D 搭的立方体，六个面承载设计价值观。
 *
 * 没有引入 three.js：一个立方体不值得为它背 150KB 的运行时，
 * 而 transform-style: preserve-3d 得到的是货真价实的三维变换，
 * 由合成器执行，几乎不占主线程。
 */
const faces = [
  { key: '沉浸', en: 'Immersive' },
  { key: '灵活', en: 'Flexible' },
  { key: '至简', en: 'Minimal' },
  { key: '一致', en: 'Consistent' },
  { key: '可达', en: 'Accessible' },
  { key: '克制', en: 'Restrained' }
]

const half = computed(() => props.size / 2)

/** 六个面各自旋转到位后沿 Z 轴外推半个边长，拼成闭合的立方体 */
const transforms = computed(() => [
  `rotateY(0deg) translateZ(${half.value}px)`,
  `rotateY(90deg) translateZ(${half.value}px)`,
  `rotateY(180deg) translateZ(${half.value}px)`,
  `rotateY(-90deg) translateZ(${half.value}px)`,
  `rotateX(90deg) translateZ(${half.value}px)`,
  `rotateX(-90deg) translateZ(${half.value}px)`
])
</script>

<template>
  <div class="i-cube-stage cube" :style="{ width: `${size}px`, height: `${size}px` }">
    <div class="i-cube" :style="{ width: `${size}px`, height: `${size}px` }">
      <div
        v-for="(face, index) in faces"
        :key="face.key"
        class="i-cube__face"
        :style="{ transform: transforms[index] }"
      >
        <span class="cube__en">{{ face.en }}</span>
        <span class="cube__cn">{{ face.key }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cube { margin: 0 auto; }
.cube__en {
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--i-color-brand);
}
.cube__cn {
  font-size: var(--i-font-size-2xl);
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--i-color-text);
}
</style>
