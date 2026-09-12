<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChatToolCall.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { useConfig } from './useConfig'
import { computed, ref } from 'vue'
import IIcon from './IIcon.vue'
import ILoading from './ILoading.vue'
import type { IconName } from './icons'

/* 入参 / 错误 / 结果这三个词也要跟着字典走 */
const { locale } = useConfig()

const props = withDefaults(
  defineProps<{
    name: string
    /** 一句话说明这次调用在做什么，折叠时展示 */
    summary?: string
    status?: 'running' | 'success' | 'error'
    /** 入参，对象会被格式化成 JSON */
    args?: unknown
    result?: unknown
    error?: string
    defaultOpen?: boolean
  }>(),
  { summary: '', status: 'success', args: undefined, result: undefined, error: '', defaultOpen: false }
)

// 失败的调用默认展开：这时用户要看的正是出了什么错
const open = ref(props.defaultOpen || props.status === 'error')

const statusIcon = computed<IconName>(() =>
  props.status === 'error' ? 'error-circle' : 'check-circle'
)

/** 对象转 JSON 展示；字符串原样输出，避免多一层引号 */
function format(value: unknown) {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}
</script>

<template>
  <section class="i-chat-tool" :class="[`i-chat-tool--${status}`, { 'is-open': open }]">
    <button class="i-chat-tool__head" :aria-expanded="String(open)" @click="open = !open">
      <IIcon class="i-chat-tool__arrow" name="chevron-right" :size="14" />
      <code class="i-chat-tool__name">{{ name }}</code>
      <span class="i-chat-tool__summary">{{ summary }}</span>
      <span class="i-chat-tool__status">
        <ILoading v-if="status === 'running'" size="sm" />
        <IIcon v-else :name="statusIcon" :size="14" />
      </span>
    </button>

    <div v-show="open" class="i-chat-tool__body">
      <div v-if="args !== undefined" class="i-chat-tool__section">
        <span class="i-chat-tool__label">{{ locale.toolInput }}</span>
        <pre class="i-chat-tool__code">{{ format(args) }}</pre>
      </div>
      <div v-if="error" class="i-chat-tool__section">
        <span class="i-chat-tool__label">{{ locale.toolError }}</span>
        <p class="i-chat-tool__error">{{ error }}</p>
      </div>
      <div v-else-if="result !== undefined" class="i-chat-tool__section">
        <span class="i-chat-tool__label">{{ locale.toolResult }}</span>
        <pre class="i-chat-tool__code">{{ format(result) }}</pre>
      </div>
    </div>
  </section>
</template>
