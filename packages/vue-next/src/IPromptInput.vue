<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import IIcon from './IIcon.vue'
import { useConfig } from './useConfig'

import {
  applyMention,
  fileTypeOf,
  filterMentions,
  findMention,
  formatSize,
  moveCommandIndex
} from '@i-design/common'

export interface PromptAttachment {
  name: string
  size?: number
}

/** `@` 引用与 `/` 命令共用一种候选项 */
export interface PromptOption {
  label: string
  /** 副标题：来源的路径、命令的一句说明 */
  description?: string
  /** 额外可搜的词：英文名、别名 */
  keywords?: string[]
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
    /** 打 `@` 时可引用的来源；不给就不弹 */
    mentions?: PromptOption[]
    /** 打 `/` 时可用的命令；不给就不弹 */
    commands?: PromptOption[]
  }>(),
  {
    modelValue: '',
    placeholder: '',
    disabled: false,
    generating: false,
    maxLength: 0,
    attachments: () => [],
    hint: '',
    submitOnEnter: true,
    mentions: () => [],
    commands: () => []
  }
)

const emit = defineEmits<{
  'update:modelValue': [string]
  submit: [string]
  stop: []
  attach: []
  removeAttachment: [number]
  /** 选中了一个候选项。symbol 区分是 @ 还是 / */
  pick: [option: PromptOption, symbol: string]
}>()

/* 占位与按钮名都走字典：写死中文的话，换成英文字典后这一块会是唯一还说中文的地方 */
const { locale } = useConfig()
const placeholderText = computed(() => props.placeholder || locale.value.promptPlaceholder)

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

/* ---- @ 引用与 / 命令 ---- */

const symbols = computed(() => {
  const out: string[] = []
  if (props.mentions.length) out.push('@')
  if (props.commands.length) out.push('/')
  return out
})

const trigger = ref<{ at: number; symbol: string; query: string } | null>(null)
const active = ref(0)
/*
 * Esc 关掉之后，光标还停在同一段 `@…` 上，下一次按键又会把它算出来。
 * 记住被关掉的是哪一段，直到用户挪到别处或改写这一段为止——
 * 否则 Esc 等于没按。
 */
const dismissed = ref<number | null>(null)

const options = computed(() => {
  if (!trigger.value) return []
  const pool = trigger.value.symbol === '/' ? props.commands : props.mentions
  return filterMentions(pool, trigger.value.query)
})

/*
 * 候选面板只在真有候选时出现。
 * 一个空面板比没有面板更糟：它挡住正文，还把回车键抢走。
 */
const panelOpen = computed(() => !!trigger.value && options.value.length > 0)

function syncTrigger() {
  const el = field.value
  if (!el || !symbols.value.length) return
  const next = findMention(el.value, el.selectionStart ?? el.value.length, symbols.value)
  if (!next || next.at !== dismissed.value) dismissed.value = null
  // 触发段变了就把高亮拉回第一条：停在原来的序号上会指到一条完全不相干的候选
  if (next?.at !== trigger.value?.at || next?.query !== trigger.value?.query) active.value = 0
  trigger.value = next && next.at === dismissed.value ? null : next
}

function pick(option: PromptOption) {
  const el = field.value
  if (!el || !trigger.value) return
  const caret = el.selectionStart ?? el.value.length
  const next = applyMention(props.modelValue, trigger.value, option.label, caret)
  emit('update:modelValue', next.text)
  emit('pick', option, trigger.value.symbol)
  trigger.value = null
  dismissed.value = null
  nextTick(() => {
    el.focus()
    el.setSelectionRange(next.caret, next.caret)
  })
}

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
  syncTrigger()
}

function submit() {
  if (!canSend.value) return
  emit('submit', props.modelValue)
}

function onKeydown(event: KeyboardEvent) {
  /*
   * 候选面板开着时，方向键与回车归面板用。
   * 不这么让的话，用户刚打出 `@张` 按回车，发出去的是半截问题。
   */
  if (panelOpen.value) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      active.value = moveCommandIndex(active.value, 1, options.value.length)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      active.value = moveCommandIndex(active.value, -1, options.value.length)
      return
    }
    if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault()
      pick(options.value[active.value])
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      dismissed.value = trigger.value?.at ?? null
      trigger.value = null
      return
    }
  }

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
    <!--
      候选面板压在输入台上方而不是下方：输入台本身多半贴着页面底部，
      往下弹会被视口边缘切掉。
    -->
    <ul v-if="panelOpen" class="i-prompt__panel" role="listbox">
      <li
        v-for="(option, index) in options"
        :key="option.label"
        class="i-prompt__option"
        :class="{ 'is-active': index === active }"
        role="option"
        :aria-selected="index === active"
        @mousedown.prevent="pick(option)"
        @mousemove="active = index"
      >
        <span class="i-prompt__option-label">{{ trigger?.symbol }}{{ option.label }}</span>
        <span v-if="option.description" class="i-prompt__option-desc">{{ option.description }}</span>
      </li>
    </ul>

    <div v-if="attachments.length" class="i-prompt__attachments">
      <!-- 移除一个附件时，后面的附件平滑补位，而不是整排瞬移 -->
      <TransitionGroup name="i-prompt-file">
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
            :aria-label="locale.removeAttachmentText(file.name)"
            @click="$emit('removeAttachment', index)"
          >
            <IIcon name="close" :size="12" />
          </button>
        </span>
      </TransitionGroup>
    </div>

    <textarea
      ref="field"
      class="i-prompt__field"
      rows="1"
      :value="modelValue"
      :placeholder="placeholderText"
      :disabled="disabled"
      @input="onInput"
      @keydown="onKeydown"
      @click="syncTrigger"
      @keyup="syncTrigger"
      @focus="focused = true"
      @blur="focused = false"
    />

    <div class="i-prompt__bar">
      <div class="i-prompt__tools">
        <button class="i-prompt__tool" @click="$emit('attach')">
          <IIcon name="plus" :size="14" />{{ locale.attach }}
        </button>
        <slot name="tools" />
      </div>

      <span v-if="maxLength" class="i-prompt__count" :class="{ 'is-over': over }">
        {{ length }} / {{ maxLength }}
      </span>

      <button
        v-if="generating"
        class="i-prompt__send is-stop"
        :aria-label="locale.stopGenerating"
        @click="$emit('stop')"
      >
        <IIcon name="close" :size="14" />
      </button>
      <button
        v-else
        class="i-prompt__send"
        :aria-label="locale.send"
        :disabled="!canSend"
        @click="submit"
      >
        <IIcon name="arrow-right" :size="16" />
      </button>
    </div>

    <p v-if="hint" class="i-prompt__hint">{{ hint }}</p>
  </div>
</template>
