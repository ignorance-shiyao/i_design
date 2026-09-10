<script setup lang="ts">
import { computed } from 'vue'
import { watermarkDataUri, watermarkTile } from '@i-design/common'

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
  }>(),
  { fontSize: 14, rotate: -22, gapX: 100, gapY: 100, opacity: 0.12, color: '' }
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

const style = computed(() => ({
  backgroundImage: watermarkDataUri(tile.value),
  backgroundSize: `${tile.value.width}px ${tile.value.height}px`
}))
</script>

<template>
  <div class="i-watermark">
    <slot />
    <!--
      水印层盖在内容上，但不吃事件——它是标记，不是遮罩。
      aria-hidden 是必须的：读屏把满屏重复的用户名念一遍，内容就没法听了。
    -->
    <div class="i-watermark__layer" :style="style" aria-hidden="true" />
  </div>
</template>
