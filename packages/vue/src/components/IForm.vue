<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IForm.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { formKey, type FormItemHandle } from './formContext'
import type { FormRule } from './validate'

const props = withDefaults(
  defineProps<{
    /** 表单数据对象，FormItem 通过 prop 读写其中的字段 */
    model: Record<string, any>
    rules?: Record<string, FormRule[]>
    labelWidth?: string
    labelPlacement?: 'left' | 'top'
    disabled?: boolean
  }>(),
  { rules: () => ({}), labelWidth: '96px', labelPlacement: 'left', disabled: false }
)

const emit = defineEmits<{ (e: 'submit', a0: Record<string, any>): void; (e: 'invalid', a0: Record<string, string>): void }>()

const items = new Map<string, FormItemHandle>()
const submitted = ref(false)

provide(formKey, {
  model: computed(() => props.model),
  rules: computed(() => props.rules),
  labelWidth: computed(() => props.labelWidth),
  labelPlacement: computed(() => props.labelPlacement),
  disabled: computed(() => props.disabled),
  submitted: computed(() => submitted.value),
  register: (item) => items.set(item.prop, item),
  unregister: (prop) => items.delete(prop)
})

/** 校验全部字段；并行执行，返回是否通过与逐字段的错误 */
async function validate() {
  submitted.value = true
  const entries = await Promise.all(
    [...items.values()].map(async (item) => [item.prop, await item.validate()] as const)
  )
  const errors: Record<string, string> = {}
  for (const [prop, error] of entries) if (error) errors[prop] = error
  return { valid: Object.keys(errors).length === 0, errors }
}

function clearValidate() {
  submitted.value = false
  items.forEach((item) => item.clear())
}

async function onSubmit() {
  const { valid, errors } = await validate()
  if (valid) emit('submit', props.model)
  else emit('invalid', errors)
}

defineExpose({ validate, clearValidate })
</script>

<template>
  <form class="i-form" :class="`is-${labelPlacement}`" novalidate @submit.prevent="onSubmit">
    <slot />
  </form>
</template>
