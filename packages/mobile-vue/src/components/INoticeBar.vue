<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import IIcon from './_Icon.vue'

const props = withDefaults(
  defineProps<{
    text: string
    type?: 'warning' | 'info' | 'danger'
    closable?: boolean
    /** 内容超出时横向滚动；不滚的长文案会被截断，用户读不到后半句 */
    scrollable?: boolean
    /** 滚动速度：像素每秒 */
    speed?: number
  }>(),
  { type: 'warning', closable: false, scrollable: true, speed: 50 }
)

defineEmits<{ close: [] }>()

const content = ref<HTMLElement | null>(null)
const textEl = ref<HTMLElement | null>(null)
const overflowing = ref(false)
const duration = ref(12)

/** 只有真的放不下才滚动：够放还滚，是没必要的动效 */
async function measure() {
  await nextTick()
  const box = content.value
  const inner = textEl.value
  if (!box || !inner) return
  overflowing.value = inner.scrollWidth > box.clientWidth
  duration.value = Math.max(6, inner.scrollWidth / props.speed)
}

onMounted(measure)
watch(() => props.text, measure)

const iconOf = computed(() =>
  props.type === 'danger' ? 'error-circle' : props.type === 'info' ? 'info-circle' : 'warning-triangle'
)
</script>

<template>
  <div
    class="i-notice-bar"
    :class="[`i-notice-bar--${type}`, { 'is-scrolling': scrollable && overflowing }]"
    :style="{ '--i-notice-duration': `${duration}s` }"
    role="status"
  >
    <IIcon :name="iconOf" :size="16" />
    <div ref="content" class="i-notice-bar__content">
      <span ref="textEl" class="i-notice-bar__text">{{ text }}</span>
    </div>
    <button v-if="closable" class="i-notice-bar__close" aria-label="关闭" @click="$emit('close')">
      <IIcon name="close" :size="14" />
    </button>
  </div>
</template>
