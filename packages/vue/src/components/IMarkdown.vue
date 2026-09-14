<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IMarkdown.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * Markdown 渲染。
 *
 * 内容来自模型与后端，也就是不可信的地方，所以这里不碰 v-html：
 * 解析在 @i-design/common 里做成 token 树，各端只用原生元素渲染。
 * 原始 HTML 当纯文本，地址过白名单——这两条不是可配置项。
 *
 * 流式友好：停在代码块中间时按「还没收完」渲染，不会满屏反引号，
 * 写完的一瞬间也不会整段跳变。
 */
import { computed } from 'vue'
import { parseMarkdown } from '@i-design/common'
import MdBlocks from './_MdBlocks.vue'

const props = withDefaults(
  defineProps<{
    /** Markdown 原文 */
    source?: string
    /** 紧凑排版：用在气泡、卡片这类空间紧张的地方 */
    compact?: boolean
  }>(),
  { source: '', compact: false }
)

const blocks = computed(() => parseMarkdown(props.source))
</script>

<template>
  <div class="i-md" :class="{ 'is-compact': compact }">
    <MdBlocks :blocks="blocks" />
  </div>
</template>
