<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 语义层级；h1-h5 会渲染成对应的标题标签 */
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'body' | 'caption'
    type?: 'default' | 'secondary' | 'tertiary' | 'brand' | 'success' | 'warning' | 'danger'
    strong?: boolean
    italic?: boolean
    underline?: boolean
    /** 删除线，用于表示已失效的值 */
    del?: boolean
    mono?: boolean
    /** 超出显示省略号；给数字表示最多几行 */
    ellipsis?: boolean | number
    /** 覆盖默认标签，例如把 h3 的样式用在 div 上 */
    as?: string
  }>(),
  {
    variant: 'body',
    type: 'default',
    strong: false,
    italic: false,
    underline: false,
    del: false,
    mono: false,
    ellipsis: false,
    as: ''
  }
)

// 标题的样式与标签默认绑定：视觉层级与文档结构一致，读屏才能正确导航。
// 确有需要时用 as 拆开，但那是例外，不是默认。
const tag = computed(() => {
  if (props.as) return props.as
  if (props.variant.startsWith('h')) return props.variant
  return props.variant === 'caption' ? 'span' : 'p'
})

const lines = computed(() => (typeof props.ellipsis === 'number' ? props.ellipsis : 0))
</script>

<template>
  <component
    :is="tag"
    class="i-typo"
    :class="[
      `i-typo--${variant}`,
      type !== 'default' ? `i-typo--${type}` : '',
      {
        'is-strong': strong,
        'is-italic': italic,
        'is-underline': underline,
        'is-delete': del,
        'is-mono': mono,
        'is-ellipsis': ellipsis === true,
        'is-clamp': lines > 0
      }
    ]"
    :style="lines > 0 ? { '--i-typo-lines': lines } : undefined"
  >
    <slot />
  </component>
</template>
