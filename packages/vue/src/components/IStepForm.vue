<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IStepForm.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 分步表单的壳（astra.md 的 B09）。
 *
 * 分步真正难的不是把字段切成几屏，是这三件事：
 *
 * - **返回上一步不能丢数据**。值由调用方持有、逐步累积，这个壳一个字都不存，
 *   所以往回翻天然是安全的。「进入某一步就重新初始化」是这条最常见的死法。
 * - **只用这一步自己的字段判断能不能往下走**。拿整张表的错误去拦，会出现
 *   第一步填得好好的却点不动下一步，而错在他还没看到的第三步。
 * - **提交失败要跳回出错的那一步**。光在当前步说一句「提交失败」没有用——
 *   错的字段可能在第一步，而用户正站在最后一步，他只会反复点提交。
 *
 * 判断在 logic/formhost.ts，五端共用一份。
 */
import { computed, ref, watch } from 'vue'
import {
  resetLabel,
  resetValues,
  stepOfError,
  stepState,
  submitGate,
  type ResetScope,
  type StepSpec,
  type SubmitPhase
} from '@i-design/common'
import IIcon from './IIcon.vue'
import IButton from './IButton.vue'

const props = withDefaults(
  defineProps<{
    steps: StepSpec[]
    /** 当前表单值。受控：壳不自己存，所以往回翻天然不丢 */
    value: Record<string, unknown>
    initial?: Record<string, unknown>
    draft?: Record<string, unknown>
    /** 当前所有字段的错误路径，由里面的表单或服务端给 */
    errorPaths?: string[]
    phase?: SubmitPhase
    disabled?: boolean
    resubmittable?: boolean
    resetScope?: ResetScope
    submitText?: string
    resettable?: boolean
  }>(),
  {
    initial: () => ({}),
    draft: undefined,
    errorPaths: () => [],
    phase: 'idle',
    disabled: false,
    resubmittable: false,
    resetScope: 'initial',
    submitText: '提交',
    resettable: true
  }
)

const emit = defineEmits<{ (e: 'input', values: Record<string, unknown>): void; (e: 'submit', values: Record<string, unknown>): void; (e: 'step-change', index: number, key: string): void; (e: 'reset', values: Record<string, unknown>): void }>()

const index = ref(0)
/** 走过哪些步。没走到过的不标红——那说的是「还没填」，不是「填错了」 */
const visited = ref<number[]>([0])

const state = computed(() =>
  stepState({
    steps: props.steps,
    index: index.value,
    errorPaths: props.errorPaths,
    visited: visited.value
  })
)

const gate = computed(() =>
  submitGate({
    phase: props.phase,
    // 最后一步的提交要求整张表没有错，不只是这一步
    valid: props.errorPaths.length === 0,
    disabled: props.disabled,
    resubmittable: props.resubmittable
  })
)

const resetText = computed(() => resetLabel(props.resetScope, props.draft !== undefined))

/*
 * 提交失败之后跳回出错的那一步。
 *
 * 只在 failed 那一刻跳一次：每次错误变化都跳的话，用户在第一步改字时
 * 会被第三步的错误拽走。
 */
watch(
  () => props.phase,
  (phase) => {
    if (phase !== 'failed') return
    const target = stepOfError(props.steps, props.errorPaths)
    if (target >= 0 && target !== index.value) go(target)
  }
)

function go(next: number) {
  if (next < 0 || next >= props.steps.length) return
  index.value = next
  if (!visited.value.includes(next)) visited.value = [...visited.value, next]
  emit('step-change', next, props.steps[next]?.key ?? '')
}

const status = computed(() => {
  if (state.value.blocked) return '这一步还有字段没填对'
  if (gate.value.reason && state.value.isLast) return gate.value.reason
  return ''
})

function reset() {
  const values = resetValues(props.resetScope, props.initial, props.draft)
  emit('input', values)
  emit('reset', values)
}
</script>

<template>
  <section class="i-step-form">
    <!-- 步骤条：形状 + 淡底色块 + 文字三重表达，颜色不单独承担「哪一步错了」 -->
    <ol class="i-step-form__marks">
      <li
        v-for="(mark, i) in state.marks"
        :key="mark.key"
        class="i-step-form__mark"
        :class="`is-${mark.state}`"
        :aria-current="mark.state === 'current' ? 'step' : undefined"
      >
        <span class="i-step-form__mark-icon">
          <IIcon v-if="mark.state === 'done'" name="check" :size="12" />
          <IIcon v-else-if="mark.state === 'error'" name="warning-triangle" :size="12" />
          <template v-else>{{ i + 1 }}</template>
        </span>
        <span>{{ mark.title }}</span>
        <span v-if="mark.state === 'error'" class="i-step-form__mark-note">有错</span>
      </li>
    </ol>

    <div class="i-step-form__body">
      <!-- 每一步一个具名插槽，插槽名就是这一步的 key -->
      <slot :name="steps[index]?.key ?? ''" :step="steps[index]" :index="index" />
    </div>

    <div class="i-form-bar">
      <!-- 只把按钮置灰而不说原因，用户只会反复点它 -->
      <p class="i-form-bar__status" :class="{ 'is-blocked': !!status }">{{ status }}</p>
      <div class="i-form-bar__actions">
        <IButton size="sm" :disabled="!state.canPrev" @click="go(index - 1)">上一步</IButton>
        <IButton v-if="resettable" size="sm" :disabled="gate.busy" @click="reset">
          {{ resetText }}
        </IButton>
        <IButton
          v-if="!state.isLast"
          size="sm"
          variant="primary"
          :disabled="!state.canNext"
          @click="go(index + 1)"
        >
          下一步
        </IButton>
        <IButton
          v-else
          size="sm"
          variant="primary"
          :loading="gate.busy"
          :disabled="!gate.allowed"
          @click="emit('submit', value)"
        >
          {{ submitText }}
        </IButton>
      </div>
    </div>
  </section>
</template>
