<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ITextarea.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/*
 * 落在这个组件上的属性要转给里面的 <textarea>，而不是外面那层包装 div。
 * 不这么做的话，`<IFormItem>` 给出的 `id` 会挂在 div 上，
 * 而 `<label for>` 指向的是一个不可标注的元素——标签白写了。
 * class 与 style 例外，它们仍然作用在外层。
 */
defineOptions({ inheritAttrs: false })
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value?: string
    placeholder?: string
    rows?: number
    maxlength?: number
    disabled?: boolean
    invalid?: boolean
    /** 显示 已输入/上限 计数，需配合 maxlength */
    showCount?: boolean
    resize?: 'none' | 'vertical' | 'both'
    /**
     * 无障碍名。
     *
     * 控件旁边没有可见文字时必须给：读屏用户听到的是「编辑框，空」，
     * 填什么全靠猜。占位文案不算名字——它一开始打字就消失了。
     */
    ariaLabel?: string
  }>(),
  {
    value: '',
    placeholder: '',
    rows: 3,
    maxlength: undefined,
    disabled: false,
    invalid: false,
    showCount: false,
    resize: 'vertical',
    ariaLabel: ''
  }
)

const emit = defineEmits<{ (e: 'input', a0: string): void }>()

const overLimit = computed(
  () => props.maxlength !== undefined && props.value.length > props.maxlength
)
</script>

<template>
  <div class="i-textarea" :class="[$attrs.class, { 'is-disabled': disabled }]" :style="$attrs.style">
    <textarea
      v-bind="{ ...$attrs, class: undefined, style: undefined }"
      class="i-textarea__inner"
      :class="{ 'is-invalid': invalid || overLimit }"
      :value="value"
      :placeholder="placeholder"
      :rows="rows"
      :maxlength="maxlength"
      :disabled="disabled"
      :aria-invalid="invalid || overLimit || undefined"
      :aria-label="ariaLabel || undefined"
      :style="{ resize }"
      @input="$emit('input', ($event.target).value)"
    />
    <span v-if="showCount && maxlength !== undefined" class="i-textarea__count" :class="{ 'is-over': overLimit }">
      {{ value.length }} / {{ maxlength }}
    </span>
  </div>
</template>
