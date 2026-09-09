<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChatSuggestions.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
withDefaults(
  defineProps<{ items: string[]; title?: string }>(),
  { items: () => [], title: '你可以接着问' }
)

defineEmits<{ (e: 'select', a0: string): void }>()
</script>

<template>
  <!-- 放在回答之后：这些是对本轮回答的延伸，挪到输入框旁就成了无上下文的通用入口 -->
  <div v-if="items.length" class="i-chat-suggestions">
    <span v-if="title" class="i-chat-suggestions__title">{{ title }}</span>
    <div class="i-chat-suggestions__list">
      <button
        v-for="item in items"
        :key="item"
        class="i-chat-suggestions__item"
        @click="$emit('select', item)"
      >
        {{ item }}
      </button>
    </div>
  </div>
</template>
