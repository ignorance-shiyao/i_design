<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  approvalProgress,
  canAdvance,
  toggleApprovalValue,
  type ApprovalAnswer,
  type ApprovalQuestion
} from '@i-design/common'
import IIcon from './IIcon.vue'
import IButton from './IButton.vue'

const props = withDefaults(
  defineProps<{
    /** 一组问题，逐题回答；只有一题时不显示分页 */
    questions: ApprovalQuestion[]
    confirmText?: string
    skipText?: string
    closable?: boolean
  }>(),
  { confirmText: '继续', skipText: '跳过', closable: true }
)

const emit = defineEmits<{
  /** 全部答完后一次性给出，键为问题 id */
  complete: [answers: Record<string, ApprovalAnswer>]
  close: []
}>()

const index = ref(0)
const selected = ref<string[]>([])
const custom = ref('')
const answers = ref<Record<string, ApprovalAnswer>>({})

const current = computed(() => props.questions[index.value])
const total = computed(() => props.questions.length)
const progress = computed(() => approvalProgress(index.value, total.value))
const advanceable = computed(() =>
  current.value ? canAdvance(current.value, selected.value, custom.value) : false
)
const isLast = computed(() => index.value === total.value - 1)

// 切题时把上一题的作答收起来，回退时再取回——用户往回翻不该看到空白
watch(index, () => {
  const saved = answers.value[current.value?.id ?? '']
  if (saved && !('skipped' in saved)) {
    selected.value = [...saved.values]
    custom.value = saved.custom ?? ''
  } else {
    selected.value = []
    custom.value = ''
  }
})

function pick(value: string) {
  if (!current.value) return
  selected.value = toggleApprovalValue(current.value, selected.value, value)
}

function record(answer: ApprovalAnswer) {
  if (!current.value) return
  answers.value = { ...answers.value, [current.value.id]: answer }
}

function next() {
  record({ values: [...selected.value], custom: custom.value.trim() || undefined })
  if (isLast.value) emit('complete', answers.value)
  else index.value += 1
}

function skip() {
  record({ skipped: true })
  if (isLast.value) emit('complete', answers.value)
  else index.value += 1
}
</script>

<template>
  <section v-if="current" class="i-agent-card i-approval" role="group" :aria-label="current.title">
    <header class="i-approval__head">
      <p class="i-approval__title">{{ current.title }}</p>
      <button v-if="closable" class="i-approval__nav" aria-label="关闭" @click="emit('close')">
        <IIcon name="close" :size="14" />
      </button>
    </header>

    <div class="i-approval__options" :role="current.multiple ? 'group' : 'radiogroup'">
      <button
        v-for="option in current.options"
        :key="option.value"
        type="button"
        class="i-approval__option"
        :class="{ 'is-selected': selected.includes(option.value) }"
        :role="current.multiple ? 'checkbox' : 'radio'"
        :aria-checked="selected.includes(option.value)"
        @click="pick(option.value)"
      >
        <IIcon
          :name="
            selected.includes(option.value)
              ? 'check-circle'
              : current.multiple
                ? 'plus'
                : 'info-circle'
          "
          :size="16"
        />
        <span>{{ option.label }}</span>
        <span v-if="option.hint" class="i-approval__hint">{{ option.hint }}</span>
      </button>
    </div>

    <!-- 自由输入：预设选项之外总有第三种答案，不给出口只会逼用户随便选一个 -->
    <input
      v-if="current.allowCustom"
      v-model="custom"
      class="i-approval__custom"
      :placeholder="current.customPlaceholder ?? '其他……'"
      :aria-label="current.customPlaceholder ?? '其他'"
    />

    <footer class="i-approval__foot">
      <div v-if="total > 1" class="i-approval__progress">
        <button
          class="i-approval__nav"
          aria-label="上一题"
          :disabled="index === 0"
          @click="index -= 1"
        >
          <IIcon name="chevron-up" :size="14" />
        </button>
        {{ progress }}
        <button
          class="i-approval__nav"
          aria-label="下一题"
          :disabled="isLast || !advanceable"
          @click="next"
        >
          <IIcon name="chevron-down" :size="14" />
        </button>
      </div>

      <div class="i-approval__actions">
        <IButton v-if="current.skippable" size="sm" @click="skip">{{ skipText }}</IButton>
        <IButton size="sm" variant="primary" :disabled="!advanceable" @click="next">
          {{ isLast ? confirmText : '下一题' }}
        </IButton>
      </div>
    </footer>
  </section>
</template>
