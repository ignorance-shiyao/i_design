<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ISelectInput.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed as _computedModel, getCurrentInstance as _modelInstance } from 'vue'
function defineModel(nameOrOptions, maybeOptions) {
  const named = typeof nameOrOptions === 'string'
  const prop = named ? nameOrOptions : 'value'
  const options = (named ? maybeOptions : nameOrOptions) ?? {}
  const event = prop === 'value' ? 'input' : 'update:' + prop
  const inst = _modelInstance()
  const fallback = options.default
  return _computedModel({
    get() {
      const proxy = inst.proxy
      const v = proxy.$props[prop] !== undefined ? proxy.$props[prop] : proxy.$attrs[prop]
      if (v !== undefined) return v
      return typeof fallback === 'function' ? fallback() : fallback
    },
    set(v) { inst.proxy.$emit(event, v) }
  })
}

import { computed, ref } from 'vue'
import IIcon from './IIcon.vue'
import { useConfig } from './useConfig'

/**
 * 选择器外壳：长得像输入框、点开是一个面板。
 *
 * Select、Cascader、TreeSelect、日期范围这些控件外面那一层是同一件东西——
 * 一个可聚焦的框、里面是单行文本或一排标签、右侧一个箭头与清除键。
 * 各自写一遍的结果是聚焦态、清除键位置、禁用色一个个对不齐，因此单独成件。
 *
 * 它只管外壳：面板内容由调用方给，选中值怎么来它不管。
 */
const props = withDefaults(
  defineProps<{
    /** 无障碍名。不传时退到占位文字——没有名字的组合框读屏只会念「组合框」 */
    ariaLabel?: string
    /** 单选时显示的文案；多选请用 tags 插槽 */
    value?: string
    placeholder?: string
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    invalid?: boolean
    clearable?: boolean
    /** 允许在框内输入，用于可搜索的选择器 */
    filterable?: boolean
  }>(),
  {
    value: '',
    placeholder: '',
    disabled: false,
    invalid: false,
    clearable: false,
    filterable: false
  }
)

const { locale, size: configSize } = useConfig()

/*
 * 尺寸跟随 ConfigProvider，但组件自己传了就以自己的为准。
 * 与文案字典同一条规则：全局配置是兜底，不是强制。
 *
 * 所以 size 不能写进 withDefaults——写了就分不清「没传」与「传了 md」，
 * 而这两者在这里的行为不同。下面这个同名计算属性在模板里会盖住那个属性。
 */
const size = computed(() => props.size ?? configSize.value)
/* 传了就用传的，没传才回落到字典——组件自己的默认值不该盖过调用方 */
const placeholderText = computed(() => props.placeholder || locale.value.placeholder)

/** 面板开合由调用方持有：它才知道选完要不要关 */
const open = defineModel<boolean>('open', { default: false })
/** 可输入时的关键词 */
const keyword = defineModel<string>('keyword', { default: '' })

const emit = defineEmits<{ (e: 'clear'): void; (e: 'focus'): void; (e: 'blur'): void }>()

const focused = ref(false)
const hasValue = computed(() => props.value !== '' || keyword.value !== '')

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}

function onClear(event: MouseEvent) {
  // 清除不该顺带把面板打开：它们是两件事
  event.stopPropagation()
  keyword.value = ''
  emit('clear')
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return
  if (event.key === 'Enter' || event.key === ' ') {
    // 可输入时空格是正常字符，不能拿去开合面板
    if (props.filterable && event.key === ' ') return
    event.preventDefault()
    toggle()
  } else if (event.key === 'Escape' && open.value) {
    event.preventDefault()
    open.value = false
  } else if (event.key === 'ArrowDown' && !open.value) {
    event.preventDefault()
    open.value = true
  }
}
</script>

<template>
  <div
    class="i-select-input"
    :class="[
      `i-select-input--${size}`,
      {
        'is-open': open,
        'is-focused': focused,
        'is-disabled': disabled,
        'is-invalid': invalid
      }
    ]"
    role="combobox"
    :aria-label="ariaLabel || placeholderText"
    :aria-expanded="String(open)"
    aria-haspopup="listbox"
    :aria-disabled="disabled || undefined"
    :tabindex="disabled ? undefined : 0"
    @click="toggle"
    @keydown="onKeydown"
    @focus="
      focused = true;
      emit('focus')
    "
    @blur="
      focused = false;
      emit('blur')
    "
  >
    <div class="i-select-input__body">
      <!-- 多选的标签由调用方渲染：标签长什么样、能不能删，是上层的事 -->
      <slot name="tags" />

      <input
        v-if="filterable"
        v-model="keyword"
        class="i-select-input__input"
        :placeholder="value || placeholderText"
        :disabled="disabled"
        @click.stop
      />
      <span v-else class="i-select-input__value" :class="{ 'i-select-input__placeholder': !value }">
        {{ value || placeholderText }}
      </span>
    </div>

    <span class="i-select-input__suffix">
      <button
        v-if="clearable && hasValue && !disabled"
        class="i-select-input__clear"
        type="button"
        :aria-label="locale.clear"
        @click="onClear"
      >
        <IIcon name="close" :size="14" />
      </button>
      <IIcon class="i-select-input__arrow" name="chevron-down" :size="16" />
    </span>
  </div>
</template>
