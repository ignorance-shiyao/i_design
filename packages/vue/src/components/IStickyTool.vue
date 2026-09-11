<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IStickyTool.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import IIcon from './IIcon.vue'
import type { IconName } from './icons'

export interface StickyToolItem {
  value: string
  label: string
  icon: IconName
  disabled?: boolean
}

withDefaults(
  defineProps<{
    items: StickyToolItem[]
    placement?: 'right' | 'left'
    /** 当前高亮项，用于「正在使用的入口」这类状态 */
    active?: string
  }>(),
  { placement: 'right', active: '' }
)

const emit = defineEmits<{ (e: 'click', a0: StickyToolItem): void }>()
</script>

<template>
  <!--
    侧边悬浮工具条：客服、反馈、回到顶部这类跟着页面走的入口。
    用 nav 而不是 div：它是一组并列的入口，读屏要能整体跳过去。
  -->
  <nav class="i-sticky-tool" :class="`i-sticky-tool--${placement}`" aria-label="快捷入口">
    <button
      v-for="item in items"
      :key="item.value"
      class="i-sticky-tool__item"
      :class="{ 'is-active': active === item.value }"
      type="button"
      :disabled="item.disabled"
      :aria-current="active === item.value ? 'true' : undefined"
      @click="emit('click', item)"
    >
      <IIcon :name="item.icon" :size="18" />
      <!-- 图标之外始终给文字：图标不是所有人都能一眼认出来，窄屏才隐藏 -->
      <span class="i-sticky-tool__label">{{ item.label }}</span>
    </button>
  </nav>
</template>
