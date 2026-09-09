<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

export interface TabItem {
  name: string
  label: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: string
    items: TabItem[]
    /** line 用于页面级切换，card 用于内容区内的次级切换 */
    variant?: 'line' | 'card'
    size?: 'sm' | 'md'
  }>(),
  { modelValue: '', variant: 'line', size: 'md' }
)

const emit = defineEmits<{ 'update:modelValue': [string]; change: [string] }>()

const tabRefs = ref<HTMLElement[]>([])
const activeIndex = computed(() => props.items.findIndex((i) => i.name === props.modelValue))

function select(item: TabItem) {
  if (item.disabled || item.name === props.modelValue) return
  emit('update:modelValue', item.name)
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
        :ref="(el) => (tabRefs[index] = el as HTMLElement)"
        class="i-tabs__tab"
        :class="{ 'is-active': item.name === modelValue, 'is-disabled': item.disabled }"
        type="button"
        role="tab"
        :aria-selected="item.name === modelValue"
        :tabindex="item.name === modelValue ? 0 : -1"
        :disabled="item.disabled"
        @click="select(item)"
      >
        {{ item.label }}
      </button>
    </div>
    <div class="i-tabs__panel" role="tabpanel">
      <slot :name="modelValue"><slot /></slot>
    </div>
  </div>
</template>
