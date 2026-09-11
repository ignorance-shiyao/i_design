<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import IIcon from './IIcon.vue'
import IImageViewer from './IImageViewer.vue'
import { imageAlt, type ImageStatus } from '@i-design/common'

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

/* 预览层本身是 IImageViewer：缩放、旋转、翻页只该有一份实现 */
const list = computed(() => (props.group.length ? props.group : [props.src]))

watch(() => props.src, () => { status.value = 'loading' })

function openPreview() {
  if (!props.preview || status.value === 'error') return
  index.value = Math.max(0, list.value.indexOf(props.src))
  open.value = true
}

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

    <IImageViewer v-model:open="open" :images="list" :start-index="index" :alt="alt" />
  </div>
</template>
