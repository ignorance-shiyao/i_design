<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IImage.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import IPortal from './_Portal.vue'
import IIcon from './IIcon.vue'
import {
  IMAGE_IDENTITY,
  imageAlt,
  imageTransformStyle,
  panImage,
  resetImage,
  rotateImage,
  stepImage,
  zoomImage,
  type ImageStatus,
  type ImageTransform
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    src: string
    alt?: string
    width?: string | number
    height?: string | number
    /** 点击后全屏预览 */
    preview?: boolean
    /** 同组图片，预览时可左右翻页。不传则只预览自己 */
    group?: string[]
    fit?: 'cover' | 'contain' | 'fill' | 'none'
  }>(),
  { alt: '', width: '', height: '', preview: true, group: () => [], fit: 'cover' }
)

const status = ref<ImageStatus>('loading')
const open = ref(false)
const index = ref(0)
const transform = ref<ImageTransform>({ ...IMAGE_IDENTITY })

const list = computed(() => (props.group.length ? props.group : [props.src]))
const current = computed(() => list.value[index.value] ?? props.src)

watch(() => props.src, () => { status.value = 'loading' })

function openPreview() {
  if (!props.preview || status.value === 'error') return
  index.value = Math.max(0, list.value.indexOf(props.src))
  transform.value = resetImage()
  open.value = true
  document.addEventListener('keydown', onKeydown)
}

function close() {
  open.value = false
  document.removeEventListener('keydown', onKeydown)
}

function step(delta: number) {
  const next = stepImage(index.value, list.value.length, delta)
  if (next === index.value) return
  index.value = next
  // 翻页后把缩放旋转归零：带着上一张的 3 倍放大翻过去，看到的是一块局部
  transform.value = resetImage()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
  else if (event.key === 'ArrowRight') step(1)
  else if (event.key === 'ArrowLeft') step(-1)
  else if (event.key === '+' || event.key === '=') transform.value = zoomImage(transform.value, 0.25)
  else if (event.key === '-') transform.value = zoomImage(transform.value, -0.25)
}

function onWheel(event: WheelEvent) {
  event.preventDefault()
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
const onUp = () => { dragging = null }

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

const boxStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width || undefined,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height || undefined
}))
</script>

<template>
  <div class="i-image" :style="boxStyle">
    <!--
      图片一直渲染，只用透明度控制可见性，不用 v-show。
      v-show 是 display: none，而 loading="lazy" 的图在 display: none 时
      浏览器根本不去加载——load 事件永不触发，状态就永远停在 loading，
      图片再也不会出现。这是个死锁，而且构建、类型检查全绿。
    -->
    <img
      class="i-image__img"
      :class="{ 'is-pending': status !== 'loaded' }"
      :src="src"
      :alt="imageAlt(status, alt)"
      :style="{ objectFit: fit }"
      loading="lazy"
      @load="status = 'loaded'"
      @error="status = 'error'"
      @click="openPreview"
    />

    <!-- 骨架盖在图上而不是替换掉图：替换掉就回到上面那个死锁 -->
    <div v-if="status === 'loading'" class="i-skeleton is-animated i-image__placeholder">
      <span class="i-skeleton__block i-image__placeholder-bar" />
    </div>

    <!--
      加载失败要显式说出来。留一块空白或一个碎图标，读者分不清是没图还是没加载出来，
      而这两件事的处理完全不同——前者不必管，后者该刷新或报障。
    -->
    <div v-if="status === 'error'" class="i-image__error">
      <IIcon name="file-image" :size="20" />
      <span>加载失败</span>
    </div>

    <!-- 2.7 没有 Teleport，_Portal 在挂载后把节点搬到 body -->
    <IPortal>
      <div v-if="open" class="i-image__viewer" @click.self="close">
        <img
          class="i-image__full"
          :src="current"
          :alt="alt"
          :style="{ transform: imageTransformStyle(transform), cursor: transform.scale > 1 ? 'grab' : 'default' }"
          @wheel.prevent="onWheel"
          @pointerdown="onDown"
          @pointermove="onMove"
          @pointerup="onUp"
          @pointercancel="onUp"
        />

        <button class="i-image__close" type="button" aria-label="关闭" @click="close">
          <IIcon name="close" :size="18" />
        </button>

        <!--
          到头不循环：循环会让「这是最后一张」这个信息消失，
          用户点着点着又回到第一张，分不清是翻完了还是自己看漏了。
        -->
        <template v-if="list.length > 1">
          <button
            class="i-image__nav is-prev"
            type="button"
            aria-label="上一张"
            :disabled="index === 0"
            @click="step(-1)"
          >
            <IIcon name="chevron-left" :size="20" />
          </button>
          <button
            class="i-image__nav is-next"
            type="button"
            aria-label="下一张"
            :disabled="index === list.length - 1"
            @click="step(1)"
          >
            <IIcon name="chevron-right" :size="20" />
          </button>
        </template>

        <div class="i-image__toolbar">
          <button type="button" aria-label="缩小" @click="transform = zoomImage(transform, -0.25)">
            <IIcon name="minus" :size="16" />
          </button>
          <span class="i-image__zoom">{{ Math.round(transform.scale * 100) }}%</span>
          <button type="button" aria-label="放大" @click="transform = zoomImage(transform, 0.25)">
            <IIcon name="plus" :size="16" />
          </button>
          <button type="button" aria-label="旋转" @click="transform = rotateImage(transform, 90)">
            <IIcon name="refresh" :size="16" />
          </button>
          <button type="button" aria-label="还原" @click="transform = resetImage()">
            <IIcon name="undo" :size="16" />
          </button>
          <span v-if="list.length > 1" class="i-image__count">{{ index + 1 }} / {{ list.length }}</span>
        </div>
      </div>
    </IPortal>
  </div>
</template>
