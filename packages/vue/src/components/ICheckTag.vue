<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ICheckTag.vue 转换而来。
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

/**
 * 可选中的标签：长得像标签，行为像多选框。
 *
 * 选中态用填充色而不是加一圈粗边——粗边会让选中项的视觉面积变大，
 * 一排标签选中几个之后，间距看起来就不匀了。
 */
const props = withDefaults(
  defineProps<{ round?: boolean; disabled?: boolean }>(),
  { round: false, disabled: false }
)

const checked = defineModel<boolean>({ default: false })
const emit = defineEmits<{ (e: 'change', a0: boolean): void }>()

function toggle() {
  if (props.disabled) return
  checked.value = !checked.value
  emit('change', checked.value)
}
</script>

<template>
  <!-- 用 button + aria-pressed 而不是 div：读屏要能说出「已按下 / 未按下」，
       键盘也要能用空格切换，这两件事 div 都给不了 -->
  <button
    class="i-check-tag"
    :class="{ 'i-check-tag--round': round, 'is-checked': checked, 'is-disabled': disabled }"
    type="button"
    :aria-pressed="String(checked)"
    :disabled="disabled"
    @click="toggle"
  >
    <slot />
  </button>
</template>
