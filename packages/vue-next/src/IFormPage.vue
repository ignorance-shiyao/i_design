<script setup lang="ts">
/**
 * 整页表单的壳（astra.md 的 B09）。
 *
 * 它不管字段怎么渲染——里面放 ISchemaForm 也好，放一堆手写的 IFormItem 也好。
 * 它管的是围着表单的那几件事：重复提交拦不拦、现在为什么不能提交、
 * 改了几项没保存、点「取消」要不要先问一句、「重置」到底重置到哪儿。
 *
 * 判断全在 logic/formhost.ts，五端共用一份：这些都是「该不该拦住用户」
 * 的决定，各端各判一遍就会出现同一张表在网页上拦住了、在小程序里直接放走。
 */
import { computed, ref, watch } from 'vue'
import {
  leaveGuard,
  resetLabel,
  resetValues,
  submitGate,
  type ResetScope,
  type SubmitPhase
} from '@i-design/common'
import IIcon from './IIcon.vue'
import IButton from './IButton.vue'

const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    /** 当前表单值。受控：壳不自己存 */
    modelValue: Record<string, unknown>
    /** 打开这张表时的样子。编辑态下就是原始数据，新建态是空对象 */
    initial?: Record<string, unknown>
    /** 上次存下的草稿。给了之后「重置」才有「回到草稿」这一档 */
    draft?: Record<string, unknown>
    phase?: SubmitPhase
    /** 表单自身校验通过了吗。由里面的表单告诉壳 */
    valid?: boolean
    disabled?: boolean
    /** 提交成功之后还允许再提交吗。默认不允许——成功了就该走开了 */
    resubmittable?: boolean
    resetScope?: ResetScope
    submitText?: string
    cancelText?: string
    /** 不需要重置按钮时关掉 */
    resettable?: boolean
  }>(),
  {
    description: '',
    initial: () => ({}),
    draft: undefined,
    phase: 'idle',
    valid: true,
    disabled: false,
    resubmittable: false,
    resetScope: 'initial',
    submitText: '提交',
    cancelText: '取消',
    resettable: true
  }
)

const emit = defineEmits<{
  'update:modelValue': [values: Record<string, unknown>]
  submit: [values: Record<string, unknown>]
  /** 用户确认要走了。离开保护已经问过，调用方直接走即可 */
  cancel: []
  reset: [values: Record<string, unknown>]
}>()

const gate = computed(() =>
  submitGate({
    phase: props.phase,
    valid: props.valid,
    disabled: props.disabled,
    resubmittable: props.resubmittable
  })
)

const guard = computed(() =>
  leaveGuard({
    base: props.initial,
    current: props.modelValue,
    phase: props.phase,
    draftSaved: props.draft !== undefined
  })
)

const resetText = computed(() => resetLabel(props.resetScope, props.draft !== undefined))

/*
 * 底部那句话优先说「为什么不能提交」，没话说的时候才说「有几项没保存」。
 * 反过来的话，正在提交时显示的是「有 3 项未保存」，读起来像是没交上去。
 */
const status = computed(() => {
  if (gate.value.reason) return gate.value.reason
  return guard.value.blocked ? guard.value.message.replace('，确定离开吗？', '') : ''
})

const asking = ref(false)
// 表单一改动，之前那次「确定要走吗」就不作数了
watch(() => props.modelValue, () => { asking.value = false })

/*
 * 只有「还拦着」的时候才把确认条摆出来。
 *
 * 不加这一道的话，正在提交时它会留在屏幕上、而问题本身变成空串——
 * 因为 leaveGuard 在提交中本来就不拦，message 是空的。
 * 于是用户看到一条没有问题的确认条，只剩两个按钮。
 */
const confirming = computed(() => asking.value && guard.value.blocked)

function requestCancel() {
  if (guard.value.blocked) {
    asking.value = true
    return
  }
  emit('cancel')
}

function reset() {
  const values = resetValues(props.resetScope, props.initial, props.draft)
  emit('update:modelValue', values)
  emit('reset', values)
}
</script>

<template>
  <section class="i-form-page">
    <header class="i-form-page__head">
      <div>
        <h2 class="i-form-page__title">{{ title }}</h2>
        <p v-if="description" class="i-form-page__desc">{{ description }}</p>
      </div>
      <slot name="extra" />
    </header>

    <div class="i-form-page__body"><slot /></div>

    <!--
      离开确认就地展开：用户点的是底部的「取消」，答案就该出现在他手指所在的地方。
      role="alertdialog" 让读屏知道这里在等一个答复，而不是一条读完就过的提示。
    -->
    <div v-if="confirming" class="i-form-page__confirm" role="alertdialog" :aria-label="guard.message">
      <span class="i-form-page__confirm-icon">
        <IIcon name="warning-triangle" :size="14" />
      </span>
      <span class="i-form-page__confirm-text">{{ guard.message }}</span>
      <IButton size="sm" @click="asking = false">继续编辑</IButton>
      <IButton size="sm" variant="danger" @click="emit('cancel')">放弃修改并离开</IButton>
    </div>

    <footer class="i-form-page__foot">
      <!-- 只把按钮置灰而不说原因，用户只会反复点它 -->
      <p class="i-form-page__status" :class="{ 'is-blocked': !!gate.reason }">{{ status }}</p>
      <div class="i-form-page__actions">
        <IButton size="sm" @click="requestCancel">{{ cancelText }}</IButton>
        <IButton v-if="resettable" size="sm" :disabled="gate.busy" @click="reset">
          {{ resetText }}
        </IButton>
        <IButton
          size="sm"
          variant="primary"
          :loading="gate.busy"
          :disabled="!gate.allowed"
          @click="emit('submit', modelValue)"
        >
          {{ submitText }}
        </IButton>
      </div>
    </footer>
  </section>
</template>
