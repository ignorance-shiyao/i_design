<script setup lang="ts">
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
const emit = defineEmits<{ change: [boolean] }>()

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
    :aria-pressed="checked"
    :disabled="disabled"
    @click="toggle"
  >
    <slot />
  </button>
</template>
