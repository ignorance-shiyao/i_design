<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useConfig } from '@i-design/vue-next'

export interface ActionSheetAction {
  label: string
  value?: string | number
  danger?: boolean
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    title?: string
    actions: ActionSheetAction[]
    cancelText?: string
  }>(),
  { modelValue: false, title: '', cancelText: '' }
)

/* 取消文案走字典；组件自己传了以传进来的为准 */
const { locale } = useConfig()
const cancelText = computed(() => props.cancelText || locale.value.cancel)

const emit = defineEmits<{
  'update:modelValue': [boolean]
  select: [ActionSheetAction]
}>()

function close() {
  emit('update:modelValue', false)
}

function pick(action: ActionSheetAction) {
  if (action.disabled) return
  emit('select', action)
  close()
}

// 打开时锁住页面滚动，否则背后的列表会跟着手势一起动
watch(
  () => props.modelValue,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  }
)
onBeforeUnmount(() => (document.body.style.overflow = ''))
</script>

<template>
  <Teleport to="body">
    <Transition name="i-action-sheet-fade">
      <div v-if="modelValue" class="i-action-sheet" @click.self="close">
        <div class="i-action-sheet__panel" role="dialog" aria-modal="true">
          <div v-if="title" class="i-action-sheet__title">{{ title }}</div>
          <button
            v-for="action in actions"
            :key="action.label"
            class="i-action-sheet__item"
            :class="{ 'is-danger': action.danger, 'is-disabled': action.disabled }"
            type="button"
            :disabled="action.disabled"
            @click="pick(action)"
          >
            {{ action.label }}
          </button>
          <button class="i-action-sheet__item i-action-sheet__cancel" type="button" @click="close">
            {{ cancelText }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
