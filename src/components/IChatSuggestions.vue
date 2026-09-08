<script setup lang="ts">
withDefaults(
  defineProps<{ items: string[]; title?: string }>(),
  { items: () => [], title: '你可以接着问' }
)

defineEmits<{ select: [string] }>()
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
