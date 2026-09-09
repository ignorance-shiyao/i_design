<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
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
    modelValue: '',
    placeholder: '',
    rows: 3,
    maxlength: undefined,
    disabled: false,
    invalid: false,
    showCount: false,
    resize: 'vertical'
  }
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const overLimit = computed(
  () => props.maxlength !== undefined && props.modelValue.length > props.maxlength
)
</script>

<template>
  <div class="i-textarea" :class="{ 'is-disabled': disabled }">
    <textarea
      class="i-textarea__inner"
      :class="{ 'is-invalid': invalid || overLimit }"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :maxlength="maxlength"
      :disabled="disabled"
      :aria-invalid="invalid || overLimit || undefined"
      :style="{ resize }"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <span v-if="showCount && maxlength !== undefined" class="i-textarea__count" :class="{ 'is-over': overLimit }">
      {{ modelValue.length }} / {{ maxlength }}
    </span>
  </div>
</template>
