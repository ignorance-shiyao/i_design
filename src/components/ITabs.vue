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

<style scoped>
.i-tabs__nav { display: flex; gap: var(--i-spacing-1); }

.i-tabs__tab {
  position: relative;
  font-family: inherit;
  font-size: var(--i-font-size-md);
  color: var(--i-color-text-secondary);
  background: none;
  border: 1px solid transparent;
  cursor: pointer;
  padding: var(--i-spacing-3) var(--i-spacing-4);
  transition: color var(--i-motion-fast) var(--i-motion-easing),
    background var(--i-motion-fast) var(--i-motion-easing),
    border-color var(--i-motion-fast) var(--i-motion-easing);
}
.i-tabs--sm .i-tabs__tab { padding: var(--i-spacing-2) var(--i-spacing-3); font-size: var(--i-font-size-sm); }
.i-tabs__tab:hover:not(.is-disabled) { color: var(--i-color-brand); }
.i-tabs__tab.is-active { color: var(--i-color-brand); font-weight: 500; }
.i-tabs__tab.is-disabled { color: var(--i-color-text-tertiary); cursor: not-allowed; }

/* line：下划线跟随选中项 */
.i-tabs--line .i-tabs__nav { border-bottom: 1px solid var(--i-color-border); }
.i-tabs--line .i-tabs__tab::after {
  content: '';
  position: absolute;
  left: var(--i-spacing-4);
  right: var(--i-spacing-4);
  bottom: -1px;
  height: 2px;
  background: var(--i-color-brand);
  transform: scaleX(0);
  transition: transform var(--i-motion-base) var(--i-motion-easing);
}
.i-tabs--line .i-tabs__tab.is-active::after { transform: scaleX(1); }

/* card：选中页签与面板连成一体 */
.i-tabs--card .i-tabs__nav { gap: var(--i-spacing-1); border-bottom: 1px solid var(--i-color-border); }
.i-tabs--card .i-tabs__tab {
  background: var(--i-color-bg-subtle);
  border-color: var(--i-color-border);
  border-radius: var(--i-radius-md) var(--i-radius-md) 0 0;
  margin-bottom: -1px;
}
.i-tabs--card .i-tabs__tab.is-active {
  background: var(--i-color-bg);
  border-bottom-color: var(--i-color-bg);
}

.i-tabs__panel { padding: var(--i-spacing-5) 0; color: var(--i-color-text-secondary); }
.i-tabs--card .i-tabs__panel { padding: var(--i-spacing-5); }
</style>
