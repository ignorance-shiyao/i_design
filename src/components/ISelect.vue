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
