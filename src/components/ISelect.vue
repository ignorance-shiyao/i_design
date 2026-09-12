<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import IIcon from './IIcon.vue'
import { useConfig } from './useConfig'
import {
  collapseTags,
  rafThrottle,
  scrollToRow,
  shouldVirtualize,
  toggleValue,
  virtualWindow
} from '@i-design/common'

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

type SelectValue = string | number | null
type SelectModel = SelectValue | (string | number)[]

const props = withDefaults(
  defineProps<{
    modelValue?: SelectModel
    options: SelectOption[]
    /** 不传时用字典里的「请选择」，由 ConfigProvider 决定是哪种语言 */
    placeholder?: string
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    invalid?: boolean
    clearable?: boolean
    /** 多选。值变成数组，触发器里改成一排标签 */
    multiple?: boolean
    /** 多选时最多完整显示几个标签，其余折成「+N」。0 表示全部显示 */
    maxTagCount?: number
  }>(),
  {
    modelValue: null,
    placeholder: '',
    size: 'md',
    disabled: false,
    invalid: false,
    clearable: false,
    multiple: false,
    maxTagCount: 0
  }
)

const emit = defineEmits<{
  'update:modelValue': [SelectModel]
  change: [SelectModel]
}>()

const { locale } = useConfig()
/* 传了就用传的，没传才回落到字典——组件自己的默认值不该盖过调用方 */
const placeholderText = computed(() => props.placeholder || locale.value.placeholder)

const root = ref<HTMLElement | null>(null)
const menu = ref<HTMLElement | null>(null)
const open = ref(false)
/** 键盘高亮项索引；-1 表示无高亮 */
const activeIndex = ref(-1)

const values = computed<(string | number)[]>(() => {
  if (!props.multiple) return props.modelValue === null ? [] : [props.modelValue as string | number]
  return Array.isArray(props.modelValue) ? props.modelValue : []
})

const selectedOptions = computed(() =>
  values.value
    .map((v) => props.options.find((o) => o.value === v))
    .filter((o): o is SelectOption => Boolean(o))
)
const selected = computed(() => (props.multiple ? null : (selectedOptions.value[0] ?? null)))
const label = computed(() => selected.value?.label ?? '')
const hasValue = computed(() => values.value.length > 0)

/* 标签折叠规则在公共层：折几个、至少留一个，各端必须一致 */
const tags = computed(() => collapseTags(selectedOptions.value, props.maxTagCount))

function isSelected(option: SelectOption) {
  return values.value.includes(option.value)
}

/* ----------------------------------------------------------- 虚拟滚动 */

/*
 * 选项一多就虚拟化。省略号菜单里塞进上万个 <li>，展开那一下会卡住整个页面，
 * 而用户只看得见其中十来个。
 *
 * 行高靠实测而不是写死：主题面板能调字号与间距，写死的行高会让定位整体偏移，
 * 越往下偏得越多。
 */
const OPTION_FALLBACK_HEIGHT = 36
const optionHeight = ref(OPTION_FALLBACK_HEIGHT)
const scrollTop = ref(0)
const viewportHeight = ref(240)

const virtual = computed(() => shouldVirtualize(props.options.length))
const window_ = computed(() =>
  virtualWindow(scrollTop.value, viewportHeight.value, optionHeight.value, props.options.length)
)
const visibleOptions = computed(() => {
  if (!virtual.value) return props.options.map((option, index) => ({ option, index }))
  const { start, end } = window_.value
  const out: { option: SelectOption; index: number }[] = []
  for (let i = start; i <= end; i++) out.push({ option: props.options[i], index: i })
  return out
})

/* 滚动事件远多于帧，而每次都要读一次布局 */
const onScroll = rafThrottle(() => {
  if (menu.value) scrollTop.value = menu.value.scrollTop
})

function measure() {
  const el = menu.value
  if (!el) return
  viewportHeight.value = el.clientHeight
  const first = el.querySelector<HTMLElement>('.i-select__option')
  if (first && first.offsetHeight > 0) optionHeight.value = first.offsetHeight
}

/* 高亮走到窗口外时把它带回视野，否则按方向键看起来毫无反应 */
function revealActive() {
  if (!virtual.value || !menu.value || activeIndex.value < 0) return
  const next = scrollToRow(
    activeIndex.value,
    optionHeight.value,
    menu.value.scrollTop,
    menu.value.clientHeight
  )
  if (next !== menu.value.scrollTop) menu.value.scrollTop = next
}

watch(activeIndex, () => nextTick(revealActive))

/* --------------------------------------------------------------- 交互 */

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    activeIndex.value = props.options.findIndex((o) => isSelected(o))
    nextTick(() => {
      measure()
      revealActive()
    })
  } else {
    activeIndex.value = -1
  }
}

function close() {
  open.value = false
  activeIndex.value = -1
}

function emitValue(next: SelectModel) {
  emit('update:modelValue', next)
  emit('change', next)
}

function pick(option: SelectOption) {
  if (option.disabled) return
  if (props.multiple) {
    // 多选不关闭面板：一次要选好几个，每选一个都收起来再展开是折磨
    emitValue(toggleValue(values.value, option.value))
    return
  }
  emitValue(option.value)
  close()
}

function removeTag(option: SelectOption) {
  if (props.disabled) return
  emitValue(toggleValue(values.value, option.value))
}

function clear() {
  emitValue(props.multiple ? [] : null)
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
    case 'Backspace':
      // 多选时退格删掉最后一个标签，这是选完一串之后最顺手的撤销
      if (props.multiple && values.value.length) {
        event.preventDefault()
        emitValue(values.value.slice(0, -1))
      }
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
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  onScroll.cancel()
})
</script>

<template>
  <div
    ref="root"
    class="i-select"
    :class="[
      `i-select--${size}`,
      { 'is-open': open, 'is-disabled': disabled, 'is-multiple': multiple }
    ]"
  >
    <button
      class="i-select__trigger"
      :class="{ 'is-invalid': invalid, 'is-placeholder': !hasValue }"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :disabled="disabled"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span v-if="multiple && hasValue" class="i-select__tags">
        <span v-for="option in tags.shown" :key="option.value" class="i-select__tag">
          {{ option.label }}
          <span
            class="i-select__tag-close"
            role="button"
            :aria-label="`移除 ${option.label}`"
            @click.stop="removeTag(option)"
          >
            <IIcon name="close" :size="12" />
          </span>
        </span>
        <span v-if="tags.rest" class="i-select__tag i-select__tag--rest">+{{ tags.rest }}</span>
      </span>
      <span v-else class="i-select__label">{{ multiple ? placeholderText : label || placeholderText }}</span>

      <span
        v-if="clearable && hasValue && !disabled"
        class="i-select__clear"
        role="button"
        :aria-label="locale.clear"
        @click.stop="clear"
      >
        <IIcon name="close" :size="14" />
      </span>
      <IIcon class="i-select__arrow" name="chevron-down" :size="16" />
    </button>

    <ul
      v-show="open"
      ref="menu"
      class="i-select__menu"
      role="listbox"
      :aria-multiselectable="multiple || undefined"
      @scroll.passive="onScroll"
    >
      <!-- 上下两块撑开的空白替代没渲染的那些行，滚动条长度才和真实条数相称 -->
      <li v-if="virtual" class="i-select__spacer" :style="{ height: `${window_.paddingTop}px` }" />
      <li
        v-for="item in visibleOptions"
        :key="item.option.value"
        class="i-select__option"
        :class="{
          'is-selected': isSelected(item.option),
          'is-active': item.index === activeIndex,
          'is-disabled': item.option.disabled
        }"
        role="option"
        :aria-selected="isSelected(item.option)"
        :aria-disabled="item.option.disabled || undefined"
        @click="pick(item.option)"
        @mouseenter="!item.option.disabled && (activeIndex = item.index)"
      >
        <span class="i-select__option-label">{{ item.option.label }}</span>
        <IIcon v-if="multiple && isSelected(item.option)" name="check" :size="14" />
      </li>
      <li
        v-if="virtual"
        class="i-select__spacer"
        :style="{ height: `${window_.paddingBottom}px` }"
      />
      <li v-if="!options.length" class="i-select__empty">{{ locale.empty }}</li>
    </ul>
  </div>
</template>
