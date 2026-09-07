<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import IIcon from './IIcon.vue'

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    options: SelectOption[]
    placeholder?: string
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    invalid?: boolean
    clearable?: boolean
  }>(),
  {
    modelValue: null,
    placeholder: '请选择',
    size: 'md',
    disabled: false,
    invalid: false,
    clearable: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [string | number | null]
  change: [string | number | null]
}>()

const root = ref<HTMLElement | null>(null)
const open = ref(false)
/** 键盘高亮项索引；-1 表示无高亮 */
const activeIndex = ref(-1)

const selected = computed(() => props.options.find((o) => o.value === props.modelValue) ?? null)
const label = computed(() => selected.value?.label ?? '')

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    activeIndex.value = props.options.findIndex((o) => o.value === props.modelValue)
  }
}

function close() {
  open.value = false
  activeIndex.value = -1
}

function pick(option: SelectOption) {
  if (option.disabled) return
  emit('update:modelValue', option.value)
  emit('change', option.value)
  close()
}

function clear() {
  emit('update:modelValue', null)
  emit('change', null)
}

/** 跳过禁用项移动高亮，到边界即停 */
function move(step: 1 | -1) {
  const count = props.options.length
  if (!count) return
  let next = activeIndex.value
  for (let i = 0; i < count; i++) {
    next += step
    if (next < 0 || next >= count) return
    if (!props.options[next].disabled) {
      activeIndex.value = next
      return
    }
  }
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp':
      event.preventDefault()
      if (!open.value) toggle()
      else move(event.key === 'ArrowDown' ? 1 : -1)
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (!open.value) toggle()
      else if (activeIndex.value >= 0) pick(props.options[activeIndex.value])
      break
    case 'Escape':
      close()
      break
  }
}

function onClickOutside(event: MouseEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) close()
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="root" class="i-select" :class="[`i-select--${size}`, { 'is-open': open, 'is-disabled': disabled }]">
    <button
      class="i-select__trigger"
      :class="{ 'is-invalid': invalid, 'is-placeholder': !selected }"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :disabled="disabled"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span class="i-select__label">{{ label || placeholder }}</span>
      <span
        v-if="clearable && selected && !disabled"
        class="i-select__clear"
        role="button"
        aria-label="清除"
        @click.stop="clear"
      >
        <IIcon name="close" :size="14" />
      </span>
      <IIcon class="i-select__arrow" name="chevron-down" :size="16" />
    </button>

    <ul v-show="open" class="i-select__menu" role="listbox">
      <li
        v-for="(option, index) in options"
        :key="option.value"
        class="i-select__option"
        :class="{
          'is-selected': option.value === modelValue,
          'is-active': index === activeIndex,
          'is-disabled': option.disabled
        }"
        role="option"
        :aria-selected="option.value === modelValue"
        :aria-disabled="option.disabled || undefined"
        @click="pick(option)"
        @mouseenter="!option.disabled && (activeIndex = index)"
      >
        {{ option.label }}
      </li>
      <li v-if="!options.length" class="i-select__empty">暂无数据</li>
    </ul>
  </div>
</template>

<style scoped>
.i-select { position: relative; width: 100%; }

.i-select__trigger {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-2);
  width: 100%;
  font-family: inherit;
  font-size: var(--i-font-size-md);
  text-align: left;
  color: var(--i-color-text);
  background: var(--i-color-bg);
  border: 1px solid var(--i-color-border-strong);
  border-radius: var(--i-radius-md);
  cursor: pointer;
  transition: border-color var(--i-motion-fast) var(--i-motion-easing),
    box-shadow var(--i-motion-fast) var(--i-motion-easing);
}
.i-select__trigger:hover:not(:disabled) { border-color: var(--i-color-brand); }
.i-select__trigger:focus-visible,
.i-select.is-open .i-select__trigger {
  outline: none;
  border-color: var(--i-color-brand);
  box-shadow: 0 0 0 2px var(--i-color-brand-subtle);
}
.i-select__trigger:disabled {
  background: var(--i-color-bg-muted);
  color: var(--i-color-text-tertiary);
  cursor: not-allowed;
}
.i-select__trigger.is-invalid { border-color: var(--i-color-danger); }
.i-select__trigger.is-placeholder .i-select__label { color: var(--i-color-text-tertiary); }

.i-select--sm .i-select__trigger { height: 28px; padding: 0 var(--i-spacing-2); font-size: var(--i-font-size-sm); }
.i-select--md .i-select__trigger { height: 34px; padding: 0 var(--i-spacing-3); }
.i-select--lg .i-select__trigger { height: 42px; padding: 0 var(--i-spacing-4); font-size: var(--i-font-size-lg); }

.i-select__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.i-select__clear { display: grid; place-items: center; color: var(--i-color-text-tertiary); cursor: pointer; }
.i-select__clear:hover { color: var(--i-color-text-secondary); }
.i-select__arrow {
  color: var(--i-color-text-tertiary);
  transition: transform var(--i-motion-base) var(--i-motion-easing);
}
.i-select.is-open .i-select__arrow { transform: rotate(180deg); }

.i-select__menu {
  position: absolute;
  top: calc(100% + var(--i-spacing-1));
  left: 0;
  right: 0;
  z-index: var(--i-z-dropdown);
  max-height: 240px;
  overflow-y: auto;
  margin: 0;
  padding: var(--i-spacing-1);
  list-style: none;
  background: var(--i-color-bg);
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-md);
  box-shadow: var(--i-shadow-md);
}
.i-select__option {
  padding: var(--i-spacing-2) var(--i-spacing-3);
  border-radius: var(--i-radius-sm);
  color: var(--i-color-text);
  cursor: pointer;
}
.i-select__option.is-active { background: var(--i-color-bg-subtle); }
.i-select__option.is-selected { color: var(--i-color-brand); font-weight: 500; }
.i-select__option.is-disabled {
  color: var(--i-color-text-tertiary);
  cursor: not-allowed;
  background: none;
}
.i-select__empty {
  padding: var(--i-spacing-3);
  text-align: center;
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-sm);
}
</style>
