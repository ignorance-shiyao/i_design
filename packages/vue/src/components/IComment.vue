<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IComment.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import IAvatar from './IAvatar.vue'

withDefaults(
  defineProps<{
    author?: string
    /** 已经格式化好的时间文案。相对时间的算法在 logic/date，由调用方决定用哪种 */
    datetime?: string
    content?: string
    /** 被回复的原文 */
    quote?: string
    avatar?: string
    /** 作为回复出现时收紧上下留白 */
    reply?: boolean
  }>(),
  {
    author: '',
    datetime: '',
    content: '',
    quote: '',
    avatar: '',
    reply: false
  }
)
</script>

<template>
  <article class="i-comment" :class="{ 'i-comment--reply': reply }">
    <div class="i-comment__avatar">
      <slot name="avatar">
        <IAvatar :src="avatar" :name="author" :size="reply ? 'sm' : 'md'" />
      </slot>
    </div>

    <div class="i-comment__main">
      <header class="i-comment__head">
        <span class="i-comment__author">{{ author }}</span>
        <span v-if="datetime" class="i-comment__time">{{ datetime }}</span>
      </header>

      <div v-if="quote || $scopedSlots.quote" class="i-comment__quote">
        <slot name="quote">{{ quote }}</slot>
      </div>

      <div class="i-comment__content">
        <slot>{{ content }}</slot>
      </div>

      <div v-if="$scopedSlots.actions" class="i-comment__actions">
        <slot name="actions" />
      </div>

      <!-- 回复列表由调用方塞进来：它可能是另一组 IComment，也可能是一个折叠区 -->
      <div v-if="$scopedSlots.replies" class="i-comment__replies">
        <slot name="replies" />
      </div>
    </div>
  </article>
</template>
