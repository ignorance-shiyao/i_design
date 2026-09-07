<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ITabs.vue 转换而来。
  差异仅在 Vue 2 的语法约束（v-model 用 value/input、模板需单根），行为保持一致。
-->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

export interface TabItem {
  name: string
  label: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    value?: string
    items: TabItem[]
    /** line 用于页面级切换，card 用于内容区内的次级切换 */
    variant?: 'line' | 'card'
    size?: 'sm' | 'md'
  }>(),
  { value: '', variant: 'line', size: 'md' }
)

const emit = defineEmits<{ (e: 'input', a0: string): void; (e: 'change', a0: string): void }>()

const tabRefs = ref<HTMLElement[]>([])
const activeIndex = computed(() => props.items.findIndex((i) => i.name === props.value))

function select(item: TabItem) {
  if (item.disabled || item.name === props.value) return
  emit('input', item.name)
  emit('change', item.name)
}

/** 方向键在标签间循环移动，跳过禁用项，并把焦点带过去（WAI-ARIA tabs 模式） */
async function move(step: 1 | -1) {
  const count = props.items.length
  if (!count) return
  let index = activeIndex.value
  for (let i = 0; i < count; i++) {
    index = (index + step + count) % count
    if (!props.items[index].disabled) {
      select(props.items[index])
      await nextTick()
      tabRefs.value[index]?.focus()
      return
    }
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault()
    move(event.key === 'ArrowRight' ? 1 : -1)
  }
}
</script>

<template>
  <div class="i-tabs" :class="[`i-tabs--${variant}`, `i-tabs--${size}`]">
    <div class="i-tabs__nav" role="tablist" @keydown="onKeydown">
      <button
        v-for="(item, index) in items"
        :key="item.name"
        :ref="(el) => (tabRefs[index] = el)"
        class="i-tabs__tab"
        :class="{ 'is-active': item.name === value, 'is-disabled': item.disabled }"
        type="button"
        role="tab"
        :aria-selected="String(item.name === value)"
        :tabindex="item.name === value ? 0 : -1"
        :disabled="item.disabled"
        @click="select(item)"
      >
        {{ item.label }}
      </button>
    </div>
    <div class="i-tabs__panel" role="tabpanel">
      <slot :name="value"><slot /></slot>
    </div>
  </div>
</template>
