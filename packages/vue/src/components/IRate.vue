<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IRate.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import IIcon from './IIcon.vue'

const props = withDefaults(
  defineProps<{
    value?: number
    count?: number
    /** 允许半星 */
    half?: boolean
    readonly?: boolean
    disabled?: boolean
    /** 右侧文案，如「4.5 分」 */
    text?: string
    /** 整组的无障碍名，如「服务评分」 */
    ariaLabel?: string
    size?: number
  }>(),
  {
    value: 0,
    count: 5,
    half: false,
    readonly: false,
    disabled: false,
    text: '',
    ariaLabel: '',
    size: 18
  }
)

const emit = defineEmits<{ (e: 'input', a0: number): void; (e: 'change', a0: number): void }>()

// 悬停时预览分值；移开后回到实际值
const hover = ref(0)
const shown = computed(() => hover.value || props.value)
const interactive = computed(() => !props.readonly && !props.disabled)

function valueAt(index: number, event: MouseEvent) {
  if (!props.half) return index + 1
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  // 落在左半边即为半星
  return event.clientX - rect.left < rect.width / 2 ? index + 0.5 : index + 1
}

function onMove(index: number, event: MouseEvent) {
  if (!interactive.value) return
  hover.value = valueAt(index, event)
}

function pick(index: number, event: MouseEvent) {
  if (!interactive.value) return
  const next = valueAt(index, event)
  // 再点一次同一个值即清零，这是评分组件的通行做法
  const value = next === props.value ? 0 : next
  emit('input', value)
  emit('change', value)
}
</script>

<template>
  <!--
    不用 role="slider"：滑块里套按钮属于嵌套交互，读屏会同时报出一个滑块和
    若干按钮，用户不知道该操作哪个。评分本质是「若干选项里选一个」，
    radiogroup 才是它的语义。
  -->
  <div
    class="i-rate"
    :class="{ 'is-disabled': disabled }"
    role="radiogroup"
    :aria-label="ariaLabel || '评分'"
    @mouseleave="hover = 0"
  >
    <button
      v-for="index in count"
      :key="index"
      type="button"
      role="radio"
      :aria-checked="String(Math.ceil(value) === index ? 'true' : 'false')"
      class="i-rate__item"
      :class="{ 'is-on': shown >= index, 'is-readonly': !interactive }"
      :disabled="disabled"
      :aria-label="`${index} 分`"
      @mousemove="onMove(index - 1, $event)"
      @click="pick(index - 1, $event)"
    >
      <IIcon name="sparkle" :size="size" />
      <span
        v-if="half && shown >= index - 0.5 && shown < index"
        class="i-rate__half"
        aria-hidden="true"
      >
        <IIcon name="sparkle" :size="size" />
      </span>
    </button>
    <span v-if="text" class="i-rate__text">{{ text }}</span>
  </div>
</template>
