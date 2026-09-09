<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import IIcon from './IIcon.vue'

import { fileTypeOf, formatSize } from '@i-design/common'

export interface PromptAttachment {
  name: string
  size?: number
}

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    disabled?: boolean
    /** 正在生成：发送按钮变为停止，输入仍可继续 */
    generating?: boolean
    maxLength?: number
    attachments?: PromptAttachment[]
    /** 底部说明，如快捷键提示 */
    hint?: string
    /** 回车发送；关掉后回车换行、Ctrl/Cmd + 回车发送 */
    submitOnEnter?: boolean
  }>(),
  {
    modelValue: '',
    placeholder: '问点什么…',
    disabled: false,
    generating: false,
    maxLength: 0,
    attachments: () => [],
    hint: '',
    submitOnEnter: true
  }
)

const emit = defineEmits<{
  'update:modelValue': [string]
  submit: [string]
  stop: []
  attach: []
  removeAttachment: [number]
}>()

const field = ref<HTMLTextAreaElement | null>(null)
const focused = ref(false)

const length = computed(() => props.modelValue.length)
const over = computed(() => props.maxLength > 0 && length.value > props.maxLength)
// 空输入、超长、禁用时都不能发送；生成中按钮改作停止，不受这些限制
const canSend = computed(() => !props.disabled && !over.value && props.modelValue.trim().length > 0)

/** 高度跟随内容：先归零再取 scrollHeight，否则删字时高度只增不减 */
async function resize() {
  await nextTick()
  const el = field.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

watch(() => props.modelValue, resize, { immediate: true })

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

function submit() {
  if (!canSend.value) return
  emit('submit', props.modelValue)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter') return
  // 输入法组字过程中的回车是「确认候选词」，不能当成发送
  if (event.isComposing) return

  const withModifier = event.metaKey || event.ctrlKey
  if (props.submitOnEnter ? !event.shiftKey && !withModifier : withModifier) {
    event.preventDefault()
    submit()
  }
}
</script>

<template>
  <div class="i-prompt" :class="{ 'is-focused': focused, 'is-disabled': disabled }">
    <div v-if="attachments.length" class="i-prompt__attachments">
      <span
        v-for="(file, index) in attachments"
        :key="file.name + index"
        class="i-prompt__file"
        :style="{ '--i-file-color': `var(--i-chart-${fileTypeOf(file.name).slot || 1})` }"
      >
        <!-- 类型色只上在图标与底纹上，文件名保持正文色：彩色文件名会和链接混淆 -->
        <IIcon class="i-prompt__file-icon" :name="fileTypeOf(file.name).icon" :size="14" />
        <span class="i-prompt__file-name">{{ file.name }}</span>
        <span class="i-prompt__file-meta">
          {{ fileTypeOf(file.name).label
          }}<template v-if="file.size"> · {{ formatSize(file.size) }}</template>
        </span>
        <button
          class="i-prompt__file-remove"
          :aria-label="`移除 ${file.name}`"
          @click="$emit('removeAttachment', index)"
        >
          <IIcon name="close" :size="12" />
        </button>
      </span>
    </div>

    <textarea
      ref="field"
      class="i-prompt__field"
      rows="1"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="onInput"
      @keydown="onKeydown"
      @focus="focused = true"
      @blur="focused = false"
    />

    <div class="i-prompt__bar">
      <div class="i-prompt__tools">
        <button class="i-prompt__tool" @click="$emit('attach')">
          <IIcon name="plus" :size="14" />附件
        </button>
        <slot name="tools" />
      </div>

      <span v-if="maxLength" class="i-prompt__count" :class="{ 'is-over': over }">
        {{ length }} / {{ maxLength }}
      </span>

      <button
        v-if="generating"
        class="i-prompt__send is-stop"
        aria-label="停止生成"
        @click="$emit('stop')"
      >
        <IIcon name="close" :size="14" />
      </button>
      <button
        v-else
        class="i-prompt__send"
        aria-label="发送"
        :disabled="!canSend"
        @click="submit"
      >
        <IIcon name="arrow-right" :size="16" />
      </button>
    </div>

    <p v-if="hint" class="i-prompt__hint">{{ hint }}</p>
  </div>
</template>
