<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChatSources.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { safeHref } from '@i-design/common'

export interface ChatSource {
  title: string
  url?: string
  /** 来源站点或文件名，展示在标题之后 */
  origin?: string
}

withDefaults(defineProps<{ sources: ChatSource[] }>(), { sources: () => [] })

/* 来源地址来自模型与工具输出，属于不可信内容，绑上去之前过一道白名单 */
const safeUrl = (url?: string) => safeHref(url)
</script>

<template>
  <!-- 编号与正文里的角标一一对应，来源必须能被追溯回具体某句话 -->
  <div class="i-chat-sources">
    <component
      :is="safeUrl(item.url) ? 'a' : 'span'"
      v-for="(item, index) in sources"
      :key="item.title + index"
      class="i-chat-sources__item"
      :href="safeUrl(item.url)"
      :target="safeUrl(item.url) ? '_blank' : undefined"
      :rel="safeUrl(item.url) ? 'noopener noreferrer' : undefined"
    >
      <span class="i-chat-sources__index">{{ index + 1 }}</span>
      <span class="i-chat-sources__title">{{ item.title }}</span>
    </component>
  </div>
</template>
