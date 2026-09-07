<script setup lang="ts">
import IIcon from './IIcon.vue'

export interface StepItem {
  title: string
  description?: string
}

const props = withDefaults(
  defineProps<{
    items: StepItem[]
    /** 当前进行中的步骤下标，从 0 开始 */
    current?: number
    direction?: 'horizontal' | 'vertical'
    /** 把当前步骤标为出错，用于校验失败或执行失败 */
    status?: 'process' | 'error'
    clickable?: boolean
  }>(),
  { current: 0, direction: 'horizontal', status: 'process', clickable: false }
)

const emit = defineEmits<{ change: [number] }>()

function stateOf(index: number) {
  if (index < props.current) return 'finish'
  if (index > props.current) return 'wait'
  return props.status === 'error' ? 'error' : 'process'
}

function onPick(index: number) {
  // 只允许回到已完成的步骤，避免跳过未填写的表单
  if (!props.clickable || index >= props.current) return
  emit('change', index)
}
</script>

<template>
  <ol class="i-steps" :class="[`i-steps--${direction}`, { 'is-clickable': clickable }]">
    <li
      v-for="(item, index) in items"
      :key="item.title"
      class="i-step"
      :class="`is-${stateOf(index)}`"
      :aria-current="index === current ? 'step' : undefined"
      @click="onPick(index)"
    >
      <div class="i-step__head">
        <span class="i-step__icon">
          <IIcon v-if="stateOf(index) === 'finish'" name="check" :size="14" :stroke-width="2.4" />
          <IIcon v-else-if="stateOf(index) === 'error'" name="close" :size="14" :stroke-width="2.4" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span v-if="index < items.length - 1" class="i-step__line" aria-hidden="true" />
      </div>
      <div class="i-step__body">
        <p class="i-step__title">{{ item.title }}</p>
        <p v-if="item.description" class="i-step__desc">{{ item.description }}</p>
      </div>
    </li>
  </ol>
</template>
