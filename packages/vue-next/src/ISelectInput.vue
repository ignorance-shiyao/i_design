<script setup lang="ts">
import { computed, ref } from 'vue'
import IIcon from './IIcon.vue'

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
    placeholder: '请选择',
    size: 'md',
    disabled: false,
    invalid: false,
    clearable: false,
    filterable: false
  }
)

/** 面板开合由调用方持有：它才知道选完要不要关 */
const open = defineModel<boolean>('open', { default: false })
/** 可输入时的关键词 */
const keyword = defineModel<string>('keyword', { default: '' })

const emit = defineEmits<{ clear: []; focus: []; blur: [] }>()

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
    :aria-expanded="open"
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
        :placeholder="value || placeholder"
        :disabled="disabled"
        @click.stop
      />
      <span v-else class="i-select-input__value" :class="{ 'i-select-input__placeholder': !value }">
        {{ value || placeholder }}
      </span>
    </div>

    <span class="i-select-input__suffix">
      <button
        v-if="clearable && hasValue && !disabled"
        class="i-select-input__clear"
        type="button"
        aria-label="清除"
        @click="onClear"
      >
        <IIcon name="close" :size="14" />
      </button>
      <IIcon class="i-select-input__arrow" name="chevron-down" :size="16" />
    </span>
  </div>
</template>
