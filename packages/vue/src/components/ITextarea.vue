<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ITextarea.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
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
  }>(),
  {
    value: '',
    placeholder: '',
    rows: 3,
    maxlength: undefined,
    disabled: false,
    invalid: false,
    showCount: false,
    resize: 'vertical'
  }
)

const emit = defineEmits<{ (e: 'input', a0: string): void }>()

const overLimit = computed(
  () => props.maxlength !== undefined && props.value.length > props.maxlength
)
</script>

<template>
  <div class="i-textarea" :class="{ 'is-disabled': disabled }">
    <textarea
      class="i-textarea__inner"
      :class="{ 'is-invalid': invalid || overLimit }"
      :value="value"
      :placeholder="placeholder"
      :rows="rows"
      :maxlength="maxlength"
      :disabled="disabled"
      :aria-invalid="invalid || overLimit || undefined"
      :style="{ resize }"
      @input="$emit('input', ($event.target).value)"
    />
    <span v-if="showCount && maxlength !== undefined" class="i-textarea__count" :class="{ 'is-over': overLimit }">
      {{ value.length }} / {{ maxlength }}
    </span>
  </div>
</template>
