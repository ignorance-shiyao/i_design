<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ICard.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
withDefaults(
  defineProps<{ title?: string; hoverable?: boolean; bordered?: boolean }>(),
  { title: '', hoverable: false, bordered: true }
)
</script>

<template>
  <div class="i-card" :class="{ 'is-hoverable': hoverable, 'is-bordered': bordered }">
    <div v-if="title || $scopedSlots.header" class="i-card__header">
      <slot name="header">
        <h3 class="i-card__title">{{ title }}</h3>
      </slot>
    </div>
    <div class="i-card__body"><slot /></div>
    <div v-if="$scopedSlots.footer" class="i-card__footer"><slot name="footer" /></div>
  </div>
</template>
