<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  WATERMARK_GUARD_ATTRS,
  watermarkDataUri,
  watermarkTampered,
  watermarkTile
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 一行或多行文字。多行时逐行往下排 */
    text: string | string[]
    fontSize?: number
    /** 逆时针角度 */
    rotate?: number
    gapX?: number
    gapY?: number
    opacity?: number
    /** 不传时跟随文字色，深浅主题都能看见 */
    color?: string
    /** 水印层被删除或被改样式时自动重建 */
    guard?: boolean
  }>(),
  { fontSize: 14, rotate: -22, gapX: 100, gapY: 100, opacity: 0.12, color: '', guard: true }
)

const tile = computed(() =>
  watermarkTile({
    text: props.text,
    fontSize: props.fontSize,
    rotate: props.rotate,
    gapX: props.gapX,
    gapY: props.gapY,
    opacity: props.opacity,
    // 不写死黑色：深色主题上黑水印等于没有
    color: props.color || 'currentColor'
  })
)

/*
 * 被删掉或被改样式时恢复。
 *
 * 不守的话，水印在开发者工具里一秒就能抹掉——那这个组件基本没有意义。
 *
 * 恢复的是 Vue 自己创建的那个节点：把它放回去、清掉被改过的行内样式，
 * 而不是新建一个。试过用换 key 让 Vue 重建，但节点已经被移出 DOM 之后，
 * Vue 插新节点时拿到的锚点是个已经没有父节点的元素，直接抛
 * 「Cannot read properties of null (reading 'insertBefore')」——
 * 水印没恢复，还在控制台留下一个报错。
 *
 * 能力边界要说清楚：这挡的是随手删一下的人，挡不住关掉 JavaScript、
 * 改本地代码、或者截图前把页面存下来的人。真需要防的内容不该发到浏览器里。
 */
const root = ref<HTMLElement | null>(null)
const layer = ref<HTMLElement | null>(null)
let observer: MutationObserver | null = null

function restore() {
  const el = layer.value
  if (!el || !root.value) return
  if (!el.isConnected) root.value.appendChild(el)
  el.removeAttribute('hidden')
  el.className = 'i-watermark__layer'
  // 整条清掉再写回：只补背景的话，被塞进来的 display: none 还留着
  el.style.cssText = ''
  el.style.backgroundImage = style.value.backgroundImage
  el.style.backgroundSize = style.value.backgroundSize
}

function watch() {
  if (!props.guard || !root.value || typeof MutationObserver === 'undefined') return
  observer = new MutationObserver((records) => {
    const tampered = records.some((record) =>
      watermarkTampered(
        [...record.removedNodes].some((node) => (node as HTMLElement).classList?.contains('i-watermark__layer')),
        record.attributeName
      )
    )
    if (!tampered) return
    // 恢复自身也会触发变动，先断开再接回，否则会一直循环下去
    observer?.disconnect()
    restore()
    if (root.value && observer) observer.observe(root.value, options)
  })
  observer.observe(root.value, options)
}

const options: MutationObserverInit = {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: [...WATERMARK_GUARD_ATTRS]
}

onMounted(watch)
onBeforeUnmount(() => observer?.disconnect())

const style = computed(() => ({
  backgroundImage: watermarkDataUri(tile.value),
  backgroundSize: `${tile.value.width}px ${tile.value.height}px`
}))
</script>

<template>
  <div ref="root" class="i-watermark">
    <slot />
    <!--
      水印层盖在内容上，但不吃事件——它是标记，不是遮罩。
      aria-hidden 是必须的：读屏把满屏重复的用户名念一遍，内容就没法听了。
    -->
    <div ref="layer" class="i-watermark__layer" :style="style" aria-hidden="true" />
  </div>
</template>
