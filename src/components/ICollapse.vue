<script setup lang="ts">
import { computed } from 'vue'
import IIcon from './IIcon.vue'

export interface CollapseItem {
  name: string
  title: string
  content?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    /** 展开项的 name 数组；accordion 模式下最多一项 */
    modelValue?: string[]
    items: CollapseItem[]
    /** 手风琴：同时只展开一项 */
    accordion?: boolean
    bordered?: boolean
  }>(),
  { modelValue: () => [], accordion: false, bordered: true }
)

const emit = defineEmits<{ 'update:modelValue': [string[]]; change: [string[]] }>()

const openSet = computed(() => new Set(props.modelValue))

function toggle(item: CollapseItem) {
  if (item.disabled) return
  const isOpen = openSet.value.has(item.name)
  const next = props.accordion
    ? isOpen
      ? []
      : [item.name]
    : isOpen
      ? props.modelValue.filter((n) => n !== item.name)
      : [...props.modelValue, item.name]
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<template>
  <div class="i-collapse" :class="{ 'is-bordered': bordered }">
    <div
      v-for="item in items"
      :key="item.name"
      class="i-collapse__item"
      :class="{ 'is-open': openSet.has(item.name), 'is-disabled': item.disabled }"
    >
      <button
        class="i-collapse__head"
        type="button"
        :aria-expanded="openSet.has(item.name)"
        :disabled="item.disabled"
        @click="toggle(item)"
      >
        <IIcon class="i-collapse__arrow" name="chevron-right" :size="15" />
        <span class="i-collapse__title">{{ item.title }}</span>
      </button>
      <!-- v-show 而非 v-if：保留内容状态，展开时不重新挂载 -->
      <div v-show="openSet.has(item.name)" class="i-collapse__body">
        <slot :name="item.name" :item="item">{{ item.content }}</slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.i-collapse.is-bordered {
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-xl);
  overflow: hidden;
  background: var(--i-color-bg-elevated);
}
.i-collapse__item + .i-collapse__item { border-top: 1px solid var(--i-color-hairline); }

.i-collapse__head {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-2);
  width: 100%;
  padding: var(--i-spacing-4) var(--i-spacing-5);
  border: none;
  background: none;
  font-family: inherit;
  font-size: var(--i-font-size-md);
  font-weight: 500;
  color: var(--i-color-text);
  text-align: left;
  cursor: pointer;
  transition: background var(--i-motion-fast) var(--i-motion-easing);
}
.i-collapse__head:hover:not(:disabled) { background: var(--i-color-bg-subtle); }
.i-collapse__item.is-disabled .i-collapse__head { color: var(--i-color-text-tertiary); cursor: not-allowed; }

.i-collapse__arrow {
  color: var(--i-color-text-tertiary);
  transition: transform var(--i-motion-base) var(--i-motion-easing);
}
.i-collapse__item.is-open .i-collapse__arrow { transform: rotate(90deg); color: var(--i-color-brand); }
.i-collapse__title { flex: 1; }

.i-collapse__body {
  padding: 0 var(--i-spacing-5) var(--i-spacing-5) calc(var(--i-spacing-5) + 15px + var(--i-spacing-2));
  color: var(--i-color-text-secondary);
}
</style>
