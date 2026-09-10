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
      <!--
        v-show 而非 v-if：保留内容状态，展开时不重新挂载。
        外层 wrap 承担高度过渡（grid 0fr → 1fr），内容本身不需要知道自己多高。
      -->
      <div class="i-collapse__wrap">
        <div class="i-collapse__body">
          <slot :name="item.name" :item="item">{{ item.content }}</slot>
        </div>
      </div>
    </div>
  </div>
</template>
