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

<style scoped>
.i-steps { display: flex; margin: 0; padding: 0; list-style: none; }
.i-steps--horizontal { flex-direction: row; }
.i-steps--vertical { flex-direction: column; }

.i-step { display: flex; flex: 1; gap: var(--i-spacing-3); min-width: 0; }
.i-steps--horizontal .i-step { flex-direction: column; }
.i-steps--vertical .i-step { flex: none; padding-bottom: var(--i-spacing-6); }
.i-steps.is-clickable .i-step.is-finish { cursor: pointer; }

.i-step__head { display: flex; align-items: center; gap: var(--i-spacing-2); }
.i-steps--vertical .i-step__head { flex-direction: column; align-self: stretch; }

.i-step__icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: var(--i-radius-full);
  border: 1px solid var(--i-color-border-strong);
  background: var(--i-color-bg);
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-sm);
  transition: all var(--i-motion-base) var(--i-motion-easing);
}
.i-step__line {
  flex: 1;
  min-width: 24px;
  height: 1px;
  background: var(--i-color-border);
}
.i-steps--vertical .i-step__line { width: 1px; height: auto; min-height: 24px; flex: 1; }

.i-step__body { padding-right: var(--i-spacing-4); }
.i-steps--horizontal .i-step__body { padding-top: var(--i-spacing-2); }
.i-step__title { color: var(--i-color-text-tertiary); font-weight: 500; }
.i-step__desc {
  margin-top: var(--i-spacing-1);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-tertiary);
}

.i-step.is-finish .i-step__icon {
  background: var(--i-color-brand-subtle);
  border-color: var(--i-color-brand);
  color: var(--i-color-brand);
}
.i-step.is-finish .i-step__line { background: var(--i-color-brand); }
.i-step.is-finish .i-step__title { color: var(--i-color-text-secondary); }

.i-step.is-process .i-step__icon {
  background: var(--i-color-brand);
  border-color: var(--i-color-brand);
  color: #fff;
}
.i-step.is-process .i-step__title { color: var(--i-color-text); }

.i-step.is-error .i-step__icon {
  background: var(--i-color-danger);
  border-color: var(--i-color-danger);
  color: #fff;
}
.i-step.is-error .i-step__title { color: var(--i-color-danger); }
</style>
