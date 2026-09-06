<script setup lang="ts">
withDefaults(
  defineProps<{ title?: string; hoverable?: boolean; bordered?: boolean }>(),
  { title: '', hoverable: false, bordered: true }
)
</script>

<template>
  <div class="i-card" :class="{ 'is-hoverable': hoverable, 'is-bordered': bordered }">
    <div v-if="title || $slots.header" class="i-card__header">
      <slot name="header">
        <h3 class="i-card__title">{{ title }}</h3>
      </slot>
    </div>
    <div class="i-card__body"><slot /></div>
    <div v-if="$slots.footer" class="i-card__footer"><slot name="footer" /></div>
  </div>
</template>

<style scoped>
.i-card {
  background: var(--i-color-bg);
  border-radius: var(--i-radius-lg);
  transition: box-shadow var(--i-motion-base) var(--i-motion-easing),
    transform var(--i-motion-base) var(--i-motion-easing),
    border-color var(--i-motion-base) var(--i-motion-easing);
}
.i-card.is-bordered { border: 1px solid var(--i-color-border); }
.i-card.is-hoverable:hover {
  box-shadow: var(--i-shadow-lg);
  border-color: transparent;
  transform: translateY(-2px);
}
.i-card__header {
  padding: var(--i-spacing-4) var(--i-spacing-5);
  border-bottom: 1px solid var(--i-color-border);
}
.i-card__title { font-size: var(--i-font-size-lg); }
.i-card__body { padding: var(--i-spacing-5); color: var(--i-color-text-secondary); }
.i-card__footer {
  padding: var(--i-spacing-3) var(--i-spacing-5);
  border-top: 1px solid var(--i-color-border);
}
</style>
