<script setup lang="ts">
/**
 * 弹窗里的表单壳（astra.md 的 B09）。
 *
 * 与 IFormPage 是同一套判断（logic/formhost.ts），换了个容器。浮层多出来的
 * 那件事是：**关闭这个动作本身要被离开保护拦住**。点遮罩、按 Esc、点右上角
 * 的叉，在改了一半的表单上都等于「放弃刚才填的东西」，而这三条路此前是
 * 直接把弹窗关掉的——用户按 Esc 只是想收起键盘，二十个字段就没了。
 *
 * 所以这里不把 IModal 的关闭直接放过去：先问一句，问完才关。
 * 确认就地展开在「取消」旁边，而不是再叠一层对话框——两层浮层谁先关、
 * 焦点回到哪儿，这些问题没人答得上来。
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
import IModal from './IModal.vue'
import IIcon from './IIcon.vue'
import IButton from './IButton.vue'

const props = withDefaults(
  defineProps<{
    /** 弹窗开关 */
    modelValue?: boolean
    title?: string
    width?: string
    /** 当前表单值。受控：壳不自己存 */
    values: Record<string, unknown>
    /** 打开这张表时的样子。编辑态下就是原始数据，新建态是空对象 */
    initial?: Record<string, unknown>
    /** 上次存下的草稿。给了之后「重置」才有「回到草稿」这一档 */
    draft?: Record<string, unknown>
    phase?: SubmitPhase
    /** 表单自身校验通过了吗。由里面的表单告诉壳 */
    valid?: boolean
    disabled?: boolean
    resubmittable?: boolean
    resetScope?: ResetScope
    submitText?: string
    cancelText?: string
    resettable?: boolean
  }>(),
  {
    modelValue: false,
    title: '',
    width: '480px',
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
  'update:modelValue': [open: boolean]
  'update:values': [values: Record<string, unknown>]
  submit: [values: Record<string, unknown>]
  /** 用户确认要走了。离开保护已经问过，调用方直接关即可 */
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
    current: props.values,
    phase: props.phase,
    draftSaved: props.draft !== undefined
  })
)

const resetText = computed(() => resetLabel(props.resetScope, props.draft !== undefined))

/*
 * 优先说「为什么不能提交」，没话说的时候才说「有几项没保存」。
 * 反过来的话，正在提交时显示的是「有 3 项未保存」，读起来像是没交上去。
 */
const status = computed(() => {
  if (gate.value.reason) return gate.value.reason
  return guard.value.blocked ? guard.value.message.replace('，确定离开吗？', '') : ''
})

const asking = ref(false)
watch(() => props.values, () => { asking.value = false })
// 只有还拦着的时候才摆出来：提交中 leaveGuard 本来就不拦，message 是空的
const confirming = computed(() => asking.value && guard.value.blocked)

/** IModal 的关闭（遮罩、Esc、右上角的叉）都走这里，先问一句再关 */
function requestClose(open: boolean) {
  if (open) return
  if (guard.value.blocked) {
    asking.value = true
    return
  }
  leave()
}

function leave() {
  asking.value = false
  emit('update:modelValue', false)
  emit('cancel')
}

function reset() {
  const next = resetValues(props.resetScope, props.initial, props.draft)
  emit('update:values', next)
  emit('reset', next)
}
</script>

<template>
  <IModal
    :model-value="modelValue"
    :title="title"
    :width="width"
    @update:model-value="requestClose"
  >
    <div class="i-form-overlay__body">
      <slot />
    </div>

    <template #footer>
      <div class="i-form-overlay__foot">
        <!--
          确认就地展开在按钮上方，而不是再叠一层对话框。
          role="alertdialog" 让读屏知道这里在等一个答复。
        -->
        <div v-if="confirming" class="i-form-confirm" role="alertdialog" :aria-label="guard.message">
          <span class="i-form-confirm__icon">
            <IIcon name="warning-triangle" :size="14" />
          </span>
          <span class="i-form-confirm__text">{{ guard.message }}</span>
          <IButton size="sm" @click="asking = false">继续编辑</IButton>
          <IButton size="sm" variant="danger" @click="leave">放弃修改并离开</IButton>
        </div>

        <div class="i-form-bar">
          <!-- 只把按钮置灰而不说原因，用户只会反复点它 -->
          <p class="i-form-bar__status" :class="{ 'is-blocked': !!gate.reason }">{{ status }}</p>
          <div class="i-form-bar__actions">
            <IButton size="sm" @click="requestClose(false)">{{ cancelText }}</IButton>
            <IButton v-if="resettable" size="sm" :disabled="gate.busy" @click="reset">
              {{ resetText }}
            </IButton>
            <IButton
              size="sm"
              variant="primary"
              :loading="gate.busy"
              :disabled="!gate.allowed"
              @click="emit('submit', values)"
            >
              {{ submitText }}
            </IButton>
          </div>
        </div>
      </div>
    </template>
  </IModal>
</template>
