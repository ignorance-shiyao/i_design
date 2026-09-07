<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { formKey } from './formContext'
import { runRules, type FormRule } from './validate'

const props = withDefaults(
  defineProps<{
    /** 对应 model 中的字段名；不传则只做布局，不参与校验 */
    prop?: string
    label?: string
    /** 覆盖 Form 上为该字段声明的规则 */
    rules?: FormRule[]
    /** 仅控制必填星号的显示；是否真的必填由规则决定 */
    required?: boolean
    help?: string
    labelWidth?: string
  }>(),
  { prop: '', label: '', rules: undefined, required: undefined, help: '', labelWidth: '' }
)

const form = inject(formKey, null)
const error = ref<string | null>(null)
const id = `i-form-item-${useId()}`

const rules = computed<FormRule[]>(
  () => props.rules ?? (props.prop ? form?.rules.value[props.prop] ?? [] : [])
)
const showRequired = computed(() =>
  props.required !== undefined ? props.required : rules.value.some((r) => r.required)
)
const value = computed(() => (props.prop ? form?.model.value[props.prop] : undefined))

async function validate(trigger?: 'change' | 'blur') {
  if (!props.prop || !rules.value.length) return null
  error.value = await runRules(value.value, rules.value, trigger)
  return error.value
}

function clear() {
  error.value = null
}

// 值变化时：首次提交前只清除既有错误，不主动报错——用户还在填的时候不该被打断
watch(value, () => {
  if (form?.submitted.value || error.value) validate('change')
})

onMounted(() => {
  if (props.prop) form?.register({ prop: props.prop, validate, clear })
})
onBeforeUnmount(() => {
  if (props.prop) form?.unregister(props.prop)
})

defineExpose({ validate, clear })
</script>

<template>
  <div
    class="i-form-item"
    :class="[`is-${form?.labelPlacement.value ?? 'left'}`, { 'is-error': !!error }]"
    @focusout="validate('blur')"
  >
    <label
      v-if="label"
      class="i-form-item__label"
      :for="id"
      :style="{
        width:
          (form?.labelPlacement.value ?? 'left') === 'left'
            ? labelWidth || form?.labelWidth.value
            : undefined
      }"
    >
      <span v-if="showRequired" class="i-form-item__required" aria-hidden="true">*</span>
      {{ label }}
    </label>
    <!-- 无 label 的项（如复选框、按钮行）留出同宽占位，保持控件左边线对齐 -->
    <span
      v-else-if="(form?.labelPlacement.value ?? 'left') === 'left'"
      class="i-form-item__spacer"
      :style="{ width: labelWidth || form?.labelWidth.value }"
      aria-hidden="true"
    />
    <div class="i-form-item__control">
      <slot :id="id" :invalid="!!error" />
      <p v-if="error" class="i-form-item__error" role="alert">{{ error }}</p>
      <p v-else-if="help" class="i-form-item__help">{{ help }}</p>
    </div>
  </div>
</template>

<style scoped>
.i-form-item { display: flex; gap: var(--i-spacing-3); }
.i-form-item.is-top { flex-direction: column; gap: var(--i-spacing-2); }

.i-form-item__label {
  flex: none;
  padding-top: 7px; /* 与 md 尺寸控件的文字基线对齐 */
  font-size: var(--i-font-size-md);
  color: var(--i-color-text-secondary);
  text-align: right;
}
.i-form-item.is-top .i-form-item__label { padding-top: 0; text-align: left; }
.i-form-item__required { color: var(--i-color-danger); margin-right: 2px; }
.i-form-item__spacer { flex: none; }

.i-form-item__control { flex: 1; min-width: 0; }
.i-form-item__error,
.i-form-item__help {
  margin-top: var(--i-spacing-1);
  font-size: var(--i-font-size-sm);
  line-height: var(--i-line-height-base);
}
.i-form-item__error { color: var(--i-color-danger); }
.i-form-item__help { color: var(--i-color-text-tertiary); }
</style>
