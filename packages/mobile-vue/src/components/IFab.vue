<script setup lang="ts">
import IIcon from './_Icon.vue'
import type { IconName } from '@i-design/common'

/**
 * 悬浮操作按钮。
 *
 * 一页只该有一个：它表达的是「这一页最主要的那件事」，
 * 出现两个就等于没有主次，用户还得先读一遍才知道点哪个。
 */
withDefaults(
  defineProps<{
    icon?: IconName
    /** 带文字时按钮拉长；只有图标时收成正圆 */
    text?: string
    placement?: 'right' | 'left'
    /** 滚动时让路：内容比这个入口重要 */
    hidden?: boolean
  }>(),
  { icon: 'plus', text: '', placement: 'right', hidden: false }
)

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button
    class="i-fab"
    :class="[
      `i-fab--${placement}`,
      { 'i-fab--round': !text, 'is-hidden': hidden }
    ]"
    type="button"
    :aria-label="text || '新建'"
    :aria-hidden="hidden || undefined"
    @click="emit('click')"
  >
    <IIcon :name="icon" :size="22" />
    <span v-if="text">{{ text }}</span>
  </button>
</template>
