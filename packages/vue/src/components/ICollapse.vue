<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ICollapse.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
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
    value?: string[]
    items: CollapseItem[]
    /** 手风琴：同时只展开一项 */
    accordion?: boolean
    bordered?: boolean
  }>(),
  { value: () => [], accordion: false, bordered: true }
)

const emit = defineEmits<{ (e: 'input', a0: string[]): void; (e: 'change', a0: string[]): void }>()

const openSet = computed(() => new Set(props.value))

function toggle(item: CollapseItem) {
  if (item.disabled) return
  const isOpen = openSet.value.has(item.name)
  const next = props.accordion
    ? isOpen
      ? []
      : [item.name]
    : isOpen
      ? props.value.filter((n) => n !== item.name)
      : [...props.value, item.name]
  emit('input', next)
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
        :aria-expanded="String(openSet.has(item.name))"
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
