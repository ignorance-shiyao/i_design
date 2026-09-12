<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChatMessage.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { useConfig } from './useConfig'
import IAvatar from './IAvatar.vue'
import IIcon from './IIcon.vue'

/* 「重试」与「重新生成」是两件事：一个是失败后重来，一个是对结果不满意再来一次 */
const { locale } = useConfig()

withDefaults(
  defineProps<{
    role?: 'user' | 'assistant'
    /** 显示在头像旁的名字；助手侧通常是模型名 */
    name?: string
    time?: string
    avatar?: string
    /** 流式输出中：文字末尾显示光标，同时抑制操作区 */
    streaming?: boolean
    /** 这一轮失败了：整段转为危险色，并给出重试入口 */
    error?: boolean
  }>(),
  { role: 'assistant', name: '', time: '', avatar: '', streaming: false, error: false }
)

defineEmits<{ (e: 'copy'): void; (e: 'retry'): void }>()


</script>

<template>
  <article class="i-chat-msg" :class="[`i-chat-msg--${role}`, { 'is-error': error }]">
    <IAvatar
      class="i-chat-msg__avatar"
      :name="name || (role === 'user' ? '我' : 'AI')"
      :image-url="avatar || undefined"
      :size="32"
      :square="role === 'assistant'"
    />

    <div class="i-chat-msg__body">
      <div v-if="name || time" class="i-chat-msg__meta">
        <span v-if="name" class="i-chat-msg__name">{{ name }}</span>
        <span v-if="time">{{ time }}</span>
      </div>

      <slot name="before" />

      <div class="i-chat-msg__content">
        <slot />
        <span v-if="streaming" class="i-chat-msg__caret" aria-hidden="true" />
      </div>

      <slot name="after" />

      <!-- 生成过程中不给操作按钮：此时复制到的是半截内容，重试也没有意义 -->
      <div v-if="!streaming" class="i-chat-msg__actions">
        <button class="i-chat-msg__action" @click="$emit('copy')">
          <IIcon name="copy" :size="12" />{{ locale.copy }}
        </button>
        <button v-if="role === 'assistant'" class="i-chat-msg__action" @click="$emit('retry')">
          <IIcon name="refresh" :size="12" />{{ error ? locale.retry : locale.regenerate }}
        </button>
      </div>
    </div>
  </article>
</template>
