<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import IButton from './IButton.vue'
import IIcon from './IIcon.vue'
import {
  resolveOverlay,
  tourHole,
  tourNeedsScroll,
  tourNext,
  tourPrev,
  tourScrollTo,
  type TourStep
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    steps: TourStep[]
    /** 当前步；-1 表示不显示 */
    modelValue?: number
    /** 高亮框向外扩多少 */
    padding?: number
  }>(),
  { modelValue: -1, padding: 6 }
)

const emit = defineEmits<{ 'update:modelValue': [number]; finish: []; skip: [] }>()

const hole = ref<{ x: number; y: number; width: number; height: number; radius: number } | null>(null)
const pop = ref<HTMLElement | null>(null)
const position = ref({ x: 0, y: 0, placement: 'bottom' as string })

const step = computed(() => props.steps[props.modelValue] ?? null)
const isLast = computed(() => props.modelValue === props.steps.length - 1)

async function locate() {
  const current = step.value
  if (!current) {
    hole.value = null
    return
  }
  const target = document.querySelector(current.target)
  if (!target) {
    // 目标不存在（页面还没渲染到那一块）：不画洞，气泡居中，引导仍然能走完
    hole.value = null
    return
  }

  let rect = target.getBoundingClientRect()
  // 目标不在视口里就先滚到正中：滚到刚好露出来的话，气泡多半没地方放
  if (tourNeedsScroll(rect, { height: window.innerHeight })) {
    window.scrollTo({ top: tourScrollTo(rect, { height: window.innerHeight }, window.scrollY), behavior: 'smooth' })
    await new Promise((r) => setTimeout(r, 320))
    rect = target.getBoundingClientRect()
  }

  hole.value = tourHole(rect, { padding: props.padding })
  await nextTick()

  const box = pop.value
  if (!box) return
  const resolved = resolveOverlay({
    trigger: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    // 量 offsetWidth 而不是 getBoundingClientRect：入场动画里有 scale，
    // 用带变换的尺寸算出来的位置会偏几个像素
    popup: { x: 0, y: 0, width: box.offsetWidth, height: box.offsetHeight },
    viewport: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
    placement: current.placement ?? 'bottom',
    offset: props.padding + 10
  })
  position.value = { x: resolved.x, y: resolved.y, placement: resolved.placement }
}

watch(() => props.modelValue, locate, { immediate: true })
watch(() => props.steps, locate)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') skip()
  else if (event.key === 'ArrowRight' || event.key === 'Enter') next()
  else if (event.key === 'ArrowLeft') prev()
}

const onResize = () => locate()

/*
 * 键盘监听挂在 document 上，而不是浮层元素上。
 * 挂在元素上要求它先拿到焦点，而用户是点页面上某个按钮把引导打开的，
 * 焦点还在那个按钮上——Esc 会毫无反应，而这在开发时最容易漏测，
 * 因为写测试的人总会先点一下浮层。
 */
watch(
  () => props.modelValue >= 0,
  (on) => {
    if (on) {
      window.addEventListener('resize', onResize)
      window.addEventListener('scroll', onResize, { passive: true })
      document.addEventListener('keydown', onKeydown)
      // 焦点挪进浮层：读屏与 Tab 顺序都应当落在当前这一步上
      nextTick(() => pop.value?.focus())
    } else {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize)
      document.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true }
)
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', onResize)
  document.removeEventListener('keydown', onKeydown)
})

function next() {
  const target = tourNext(props.modelValue, props.steps.length)
  emit('update:modelValue', target)
  if (target === -1) emit('finish')
}

function prev() {
  emit('update:modelValue', tourPrev(props.modelValue))
}

function skip() {
  emit('update:modelValue', -1)
  emit('skip')
}

</script>

<template>
  <Teleport to="body">
    <div v-if="step" class="i-tour" role="dialog" aria-modal="true">
      <!--
        遮罩用一个带「洞」的 SVG，而不是四条挡板拼出来的：
        四条挡板对不上圆角，目标是圆角按钮时四个角会漏出暗色的直角，很显眼。
      -->
      <svg class="i-tour__mask" @click="skip">
        <defs>
          <mask id="i-tour-hole">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              v-if="hole"
              :x="hole.x"
              :y="hole.y"
              :width="hole.width"
              :height="hole.height"
              :rx="hole.radius"
              fill="black"
            />
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" mask="url(#i-tour-hole)" />
      </svg>

      <!-- 高亮框自己再描一圈：只挖洞的话，浅色背景上洞与页面几乎看不出边界 -->
      <div
        v-if="hole"
        class="i-tour__ring"
        :style="{ left: `${hole.x}px`, top: `${hole.y}px`, width: `${hole.width}px`, height: `${hole.height}px`, borderRadius: `${hole.radius}px` }"
      />

      <div
        ref="pop"
        class="i-tour__pop"
        :class="[`is-${position.placement}`, { 'is-center': !hole }]"
        :style="hole ? { left: `${position.x}px`, top: `${position.y}px` } : undefined"
        tabindex="-1"
      >
        <header class="i-tour__head">
          <h3 class="i-tour__title">{{ step.title }}</h3>
          <button class="i-tour__close" aria-label="跳过引导" @click="skip">
            <IIcon name="close" :size="14" />
          </button>
        </header>
        <p class="i-tour__desc">{{ step.description }}</p>
        <footer class="i-tour__foot">
          <!-- 进度写成「2 / 5」而不是画一排点：引导通常不长，数字比点更省认知 -->
          <span class="i-tour__count">{{ modelValue + 1 }} / {{ steps.length }}</span>
          <div class="i-tour__actions">
            <IButton v-if="modelValue > 0" size="sm" variant="text" @click="prev">上一步</IButton>
            <IButton size="sm" variant="primary" @click="next">{{ isLast ? '我知道了' : '下一步' }}</IButton>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
