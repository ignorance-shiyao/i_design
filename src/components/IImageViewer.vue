<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import IIcon from './IIcon.vue'
import {
  IMAGE_IDENTITY,
  imageTransformStyle,
  panImage,
  resetImage,
  rotateImage,
  stepImage,
  zoomImage,
  type ImageTransform
} from '@i-design/common'

/**
 * 全屏图片预览。
 *
 * 从 IImage 里拆出来单独成件：列表页、聊天记录、上传回显都要「点开看大图」，
 * 但它们未必用 IImage 渲染缩略图——预览层绑死在图片组件上，这些地方就得各自再写一遍。
 * 缩放、旋转、翻页的算法在 `logic/image`，与各端共用同一份。
 */
const props = withDefaults(
  defineProps<{
    images: string[]
    /** 打开时定位到第几张 */
    startIndex?: number
    alt?: string
  }>(),
  { startIndex: 0, alt: '' }
)

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ change: [number] }>()

const index = ref(props.startIndex)
const transform = ref<ImageTransform>({ ...IMAGE_IDENTITY })

const current = computed(() => props.images[index.value] ?? '')

watch(open, (value) => {
  if (value) {
    index.value = Math.min(Math.max(props.startIndex, 0), Math.max(props.images.length - 1, 0))
    transform.value = resetImage()
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('keydown', onKeydown)
  }
})

function close() {
  open.value = false
}

function step(delta: number) {
  const next = stepImage(index.value, props.images.length, delta)
  if (next === index.value) return
  index.value = next
  // 翻页后把缩放旋转归零：带着上一张的 3 倍放大翻过去，看到的是一块局部
  transform.value = resetImage()
  emit('change', next)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
  else if (event.key === 'ArrowRight') step(1)
  else if (event.key === 'ArrowLeft') step(-1)
  else if (event.key === '+' || event.key === '=') transform.value = zoomImage(transform.value, 0.25)
  else if (event.key === '-') transform.value = zoomImage(transform.value, -0.25)
}

function onWheel(event: WheelEvent) {
  transform.value = zoomImage(transform.value, event.deltaY > 0 ? -0.2 : 0.2)
}

let dragging: { x: number; y: number } | null = null
function onDown(event: PointerEvent) {
  if (transform.value.scale <= 1) return
  dragging = { x: event.clientX, y: event.clientY }
  ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
}
function onMove(event: PointerEvent) {
  if (!dragging) return
  transform.value = panImage(transform.value, event.clientX - dragging.x, event.clientY - dragging.y)
  dragging = { x: event.clientX, y: event.clientY }
}
const onUp = () => {
  dragging = null
}

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="i-image-viewer"
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
      @click.self="close"
    >
      <img
        class="i-image-viewer__full"
        :src="current"
        :alt="alt"
        :style="{
          transform: imageTransformStyle(transform),
          cursor: transform.scale > 1 ? 'grab' : 'default'
        }"
        @wheel.prevent="onWheel"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      />

      <button class="i-image-viewer__close" type="button" aria-label="关闭" @click="close">
        <IIcon name="close" :size="18" />
      </button>

      <!--
        到头不循环：循环会让「这是最后一张」这个信息消失，
        用户点着点着又回到第一张，分不清是翻完了还是自己看漏了。
      -->
      <template v-if="images.length > 1">
        <button
          class="i-image-viewer__nav is-prev"
          type="button"
          aria-label="上一张"
          :disabled="index === 0"
          @click="step(-1)"
        >
          <IIcon name="chevron-left" :size="20" />
        </button>
        <button
          class="i-image-viewer__nav is-next"
          type="button"
          aria-label="下一张"
          :disabled="index === images.length - 1"
          @click="step(1)"
        >
          <IIcon name="chevron-right" :size="20" />
        </button>
      </template>

      <div class="i-image-viewer__toolbar">
        <button type="button" aria-label="缩小" @click="transform = zoomImage(transform, -0.25)">
          <IIcon name="minus" :size="16" />
        </button>
        <span class="i-image-viewer__zoom">{{ Math.round(transform.scale * 100) }}%</span>
        <button type="button" aria-label="放大" @click="transform = zoomImage(transform, 0.25)">
          <IIcon name="plus" :size="16" />
        </button>
        <button type="button" aria-label="旋转" @click="transform = rotateImage(transform, 90)">
          <IIcon name="refresh" :size="16" />
        </button>
        <button type="button" aria-label="还原" @click="transform = resetImage()">
          <IIcon name="undo" :size="16" />
        </button>
        <span v-if="images.length > 1" class="i-image-viewer__count">
          {{ index + 1 }} / {{ images.length }}
        </span>
      </div>
    </div>
  </Teleport>
</template>
