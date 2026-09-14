<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ISchemaForm.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 按 schema 渲染的表单（astra.md 的 B08）。
 *
 * **组件不解释 schema，只渲染它。** 显隐、依赖、校验、服务端错误落位全部在
 * `logic/schemaform.ts` 里，五端共用一份——各端各写一遍的话，同一份 schema
 * 在小程序上会比在 Web 上多显示一个字段，而这种差异没有任何检查拦得住。
 *
 * **schema 里不执行任何字符串。** 条件是数据；异步规则只给 handler 名字，
 * 由调用方通过 async-validator 属性注册实现。schema 常常来自接口。
 *
 * **错误定位到格子。** 数组子表的错误路径是 lines[1].quantity，
 * 提交失败时焦点送到第一个可定位的错误上，而不是让用户自己从头找。
 */
import { computed, ref, watch } from 'vue'
import IButton from './IButton.vue'
import IInput from './IInput.vue'
import IInputNumber from './IInputNumber.vue'
import ISelect from './ISelect.vue'
import ISwitch from './ISwitch.vue'
import ITextarea from './ITextarea.vue'
import {
  applyServerErrors,
  asyncRulesOf,
  firstErrorPath,
  submitValues,
  validateSchema,
  visibleFields,
  type FormFieldSpec,
  type FormFieldError,
  type FormSchema
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    schema: FormSchema
    /** 表单值。受控：组件不自己存 */
    value: Record<string, unknown>
    /** 服务端返回的错误，路径对不上字段的会显示在表单级 */
    serverErrors?: { path: string; message: string }[]
    /** 异步规则的实现，键是 schema 里的 handler 名 */
    asyncValidator?: Record<string, (value: unknown) => Promise<boolean>>
    submitText?: string
    disabled?: boolean
  }>(),
  { serverErrors: () => [], asyncValidator: () => ({}), submitText: '提交', disabled: false }
)

const emit = defineEmits<{ (e: 'input', values: Record<string, unknown>): void; (e: 'submit', values: Record<string, unknown>): void; (e: 'invalid', errors: FormFieldError[]): void }>()

const touched = ref(false)
const asyncErrors = ref<FormFieldError[]>([])
const root = ref<HTMLElement | null>(null)

const fields = computed(() => visibleFields(props.schema, props.value))

const errors = computed<FormFieldError[]>(() => [
  ...(touched.value ? validateSchema(props.schema, props.value) : []),
  ...applyServerErrors(props.schema, props.serverErrors),
  ...asyncErrors.value
])

const errorOf = (path: string) => errors.value.find((e) => e.path === path)?.message
/* 表单级：对不上任何字段的服务端错误。丢掉它等于「失败但没有原因」 */
const formErrors = computed(() => errors.value.filter((e) => e.orphan))

/* 服务端错误在用户改动之后就过期了，留着会让人以为还在报同一件事 */
watch(() => props.value, () => (asyncErrors.value = []), { deep: true })

function setValue(name: string, value: unknown) {
  emit('input', { ...props.value, [name]: value })
}

function rowsOf(field: FormFieldSpec): Record<string, unknown>[] {
  const raw = props.value[field.name]
  return Array.isArray(raw) ? (raw as Record<string, unknown>[]) : []
}

function setCell(field: FormFieldSpec, index: number, key: string, value: unknown) {
  const rows = rowsOf(field).map((row, i) => (i === index ? { ...row, [key]: value } : row))
  setValue(field.name, rows)
}

function addRow(field: FormFieldSpec) {
  setValue(field.name, [...rowsOf(field), {}])
}

function removeRow(field: FormFieldSpec, index: number) {
  setValue(field.name, rowsOf(field).filter((_, i) => i !== index))
}

async function submit() {
  touched.value = true
  asyncErrors.value = []
  const sync = validateSchema(props.schema, props.value)
  if (sync.length) {
    focusFirst(sync)
    emit('invalid', sync)
    return
  }

  // 异步规则最后跑：先把同步错误都报完，免得用户改一条等一次网络
  const pending = asyncRulesOf(props.schema).filter((r) => props.asyncValidator[r.handler])
  const results = await Promise.all(
    pending.map(async (rule) => ({
      rule,
      ok: await props.asyncValidator[rule.handler](props.value[rule.path])
    }))
  )
  const failed = results.filter((r) => !r.ok).map((r) => ({ path: r.rule.path, message: r.rule.message }))
  if (failed.length) {
    asyncErrors.value = failed
    focusFirst(failed)
    emit('invalid', failed)
    return
  }

  emit('submit', submitValues(props.schema, props.value))
}

/** 焦点送到第一个出错的格子：让用户自己从头找是最省事也最不负责的做法 */
function focusFirst(list: FormFieldError[]) {
  const path = firstErrorPath(list)
  if (!path) return
  const el = root.value?.querySelector<HTMLElement>(`[data-path="${CSS.escape(path)}"] input, [data-path="${CSS.escape(path)}"] textarea, [data-path="${CSS.escape(path)}"] select`)
  el?.focus()
}
</script>

<template>
  <form ref="root" class="i-schema-form" novalidate @submit.prevent="submit">
    <div v-for="field in fields" :key="field.name" class="i-schema-form__field" :data-path="field.name">
      <label class="i-schema-form__label" :for="`f-${field.name}`">
        {{ field.label }}
        <span v-if="(field.rules ?? []).some((r) => r.kind === 'required')" class="i-schema-form__req" aria-hidden="true">*</span>
      </label>

      <IInput
        v-if="field.kind === 'text'"
        :id="`f-${field.name}`"
        :value="String(value[field.name] ?? '')"
        :placeholder="field.placeholder"
        :disabled="disabled"
        :invalid="!!errorOf(field.name)"
        @input="(v) => setValue(field.name, v)"
      />

      <ITextarea
        v-else-if="field.kind === 'textarea'"
        :value="String(value[field.name] ?? '')"
        :placeholder="field.placeholder"
        :disabled="disabled"
        @input="(v) => setValue(field.name, v)"
      />

      <IInputNumber
        v-else-if="field.kind === 'number'"
        :value="(value[field.name]) ?? null"
        :disabled="disabled"
        @input="(v) => setValue(field.name, v)"
      />

      <ISwitch
        v-else-if="field.kind === 'switch'"
        :value="!!value[field.name]"
        :disabled="disabled"
        @input="(v) => setValue(field.name, v)"
      />

      <ISelect
        v-else-if="field.kind === 'select' || field.kind === 'multi-select'"
        :value="(value[field.name]) ?? (field.kind === 'multi-select' ? [] : '')"
        :multiple="field.kind === 'multi-select'"
        :options="(field.options ?? []).map((o) => ({ value: o.value, label: o.label, disabled: !!o.disabledReason }))"
        :disabled="disabled"
        @input="(v) => setValue(field.name, v)"
      />

      <IInput
        v-else-if="field.kind === 'date'"
        type="date"
        :value="String(value[field.name] ?? '')"
        :disabled="disabled"
        @input="(v) => setValue(field.name, v)"
      />

      <!-- 数组子表：错误落到具体那一格，而不是整张表报一句「有误」 -->
      <div v-else-if="field.kind === 'array'" class="i-schema-form__rows">
        <div v-for="(row, index) in rowsOf(field)" :key="index" class="i-schema-form__row">
          <div
            v-for="sub in field.item ?? []"
            :key="sub.name"
            class="i-schema-form__cell"
            :data-path="`${field.name}[${index}].${sub.name}`"
          >
            <!-- 子表的格子也要有真 label：读屏用户听到的否则只是「编辑框」，
                 而这一行有三四个编辑框，他无从知道哪个是数量 -->
            <label class="i-schema-form__label" :for="`f-${field.name}-${index}-${sub.name}`">
              {{ sub.label }}
            </label>
            <!-- 数字输入自己带加减按钮，没有可挂 for 的单一 id，
                 所以用 aria-label 给它一个名字 -->
            <IInputNumber
              v-if="sub.kind === 'number'"
              :aria-label="`第 ${index + 1} 行的${sub.label}`"
              :value="(row[sub.name]) ?? null"
              :disabled="disabled"
              @input="(v) => setCell(field, index, sub.name, v)"
            />
            <IInput
              v-else
              :id="`f-${field.name}-${index}-${sub.name}`"
              :value="String(row[sub.name] ?? '')"
              :placeholder="sub.placeholder"
              :disabled="disabled"
              :invalid="!!errorOf(`${field.name}[${index}].${sub.name}`)"
              @input="(v) => setCell(field, index, sub.name, v)"
            />
            <p v-if="errorOf(`${field.name}[${index}].${sub.name}`)" class="i-schema-form__error">
              {{ errorOf(`${field.name}[${index}].${sub.name}`) }}
            </p>
          </div>
          <IButton size="sm" :disabled="disabled" @click="removeRow(field, index)">删除这行</IButton>
        </div>
        <IButton size="sm" :disabled="disabled" @click="addRow(field)">加一行</IButton>
      </div>

      <p v-if="field.help" class="i-schema-form__help">{{ field.help }}</p>
      <p v-if="errorOf(field.name)" class="i-schema-form__error" role="alert">{{ errorOf(field.name) }}</p>
    </div>

    <!-- 对不上字段的服务端错误显示在表单级，而不是丢掉 -->
    <p v-for="e in formErrors" :key="e.path" class="i-schema-form__error" role="alert">
      {{ e.path }}：{{ e.message }}
    </p>

    <div class="i-schema-form__actions">
      <IButton variant="primary" type="submit" :disabled="disabled">{{ submitText }}</IButton>
      <slot name="actions" />
    </div>
  </form>
</template>
