<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: number
    /** 当前指向的价值观下标；-1 表示没有指定，停在默认角度 */
    active?: number
    faces?: { key: string; en: string }[]
  }>(),
  {
    size: 180,
    active: -1,
    faces: () => [
      { key: '沉浸', en: 'Immersive' },
      { key: '灵活', en: 'Flexible' },
      { key: '至简', en: 'Minimal' },
      { key: '一致', en: 'Consistent' }
    ]
  }
)

/**
 * 用 CSS 3D 搭的立方体，四个侧面承载设计价值观。
 *
 * 这里仍然用 CSS，而不是首屏那套 three.js 场景。
 *
 * 判断标准是「这个三维能不能说出别的东西」。首屏那个物件的材质全部由令牌驱动，
 * 换主色时它当场重新上色，演的是体系自己的核心主张，所以那份运行时是有回报的。
 * 而这里只是一个会转的立方体——preserve-3d 得到的同样是货真价实的三维变换，
 * 由合成器执行，几乎不占主线程，多背一个运行时换不到任何东西。
 *
 * 它不再自转。
 *
 * 原先是 18 秒一圈的无限旋转——那是纯装饰，而这套体系自己的价值观写着
 * 「动效只用于解释空间关系，不做装饰」。现在它转到读者正在看的那一条上：
 * 同样的三维效果，但每一次转动都在回答「你看的是哪一个」。
 */
const half = computed(() => props.size / 2)

/** 四个侧面各自旋转到位后沿 Z 轴外推半个边长 */
const transforms = computed(() =>
  props.faces.map((_, i) => `rotateY(${i * 90}deg) translateZ(${half.value}px)`)
)

/*
 * 顶面与底面必须补上，哪怕它们不放任何文字。
 *
 * 只拼四个侧面得到的是一根开口的方筒：镜头略微俯视（rotateX(-12deg)）时，
 * 视线会从开口穿进去，看见对面那一面的背影——屏幕上就多出一行糊掉的反字，
 * 看着像渲染坏了。补上盖子，盒子才是闭合的。
 */
const caps = computed(() => [
  `rotateX(90deg) translateZ(${half.value}px)`,
  `rotateX(-90deg) translateZ(${half.value}px)`
])

/*
 * 默认停在 -22 度：正对着看是一个正方形，看不出它是立体的。
 * 偏一点才能同时露出两个面，体积感来自那条转折的棱。
 */
const stageTransform = computed(() =>
  props.active >= 0
    ? `rotateX(-12deg) rotateY(${-props.active * 90}deg)`
    : 'rotateX(-12deg) rotateY(-22deg)'
)
</script>

<template>
  <div class="i-cube-stage cube" :style="{ width: `${size}px`, height: `${size}px` }">
    <div
      class="i-cube i-cube--steered"
      :style="{ width: `${size}px`, height: `${size}px`, transform: stageTransform }"
    >
      <div
        v-for="(face, index) in faces"
        :key="face.key"
        class="i-cube__face"
        :class="{ 'is-front': index === active }"
        :style="{ transform: transforms[index] }"
      >
        <span class="cube__en">{{ face.en }}</span>
        <span class="cube__cn">{{ face.key }}</span>
      </div>
      <div
        v-for="(cap, index) in caps"
        :key="`cap-${index}`"
        class="i-cube__face i-cube__face--cap"
        :style="{ transform: cap }"
        aria-hidden="true"
      />
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
