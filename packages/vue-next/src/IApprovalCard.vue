<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, watchEffect } from 'vue'
import {
  approvalGate,
  approvalProgress,
  canAdvance,
  elapsedInterval,
  toggleApprovalValue,
  type ApprovalAnswer,
  type ApprovalQuestion
} from '@i-design/common'
import IIcon from './IIcon.vue'
import IButton from './IButton.vue'
import { useConfig } from './useConfig'

const props = withDefaults(
  defineProps<{
    /** 一组问题，逐题回答；只有一题时不显示分页 */
    questions: ApprovalQuestion[]
    /**
     * 过期时刻（毫秒时间戳）。不给表示这条确认不过期。
     *
     * 这张卡片会在屏幕上待很久——人去开了个会、切走看别的。回来时那个动作
     * 可能已经不该再执行了，而卡片长得和刚发出来时一模一样：按钮还亮着，
     * 点下去要么服务端报一个看不懂的错，要么更糟——真的执行了一次。
     */
    expiresAt?: number
    /** 这条确认是针对哪个版本发出的 */
    version?: number
    /** 被确认的东西现在是第几版。与 version 不同就说明前提变了 */
    currentVersion?: number
    confirmText?: string
    skipText?: string
    renewText?: string
    reviewText?: string
    closable?: boolean
  }>(),
  { confirmText: '', skipText: '', renewText: '重新发起', reviewText: '查看新版本', closable: true }
)

/* 「跳过」「下一题」「其他」都走字典；组件自己传了以传进来的为准 */
const { locale } = useConfig()
const skipText = computed(() => props.skipText || locale.value.skip)
const confirmText = computed(() => props.confirmText || locale.value.confirm)

const emit = defineEmits<{
  /** 全部答完后一次性给出，键为问题 id */
  complete: [answers: Record<string, ApprovalAnswer>]
  /** 过期了：请调用方重新发起同一次确认 */
  renew: []
  /** 版本变了：请调用方把新版本摊开给人看，而不是续期旧的 */
  review: []
  close: []
}>()

/*
 * 自己走的时钟，只为倒计时。交给使用方传「还剩几秒」等于要求每个页面
 * 自己开一个定时器，而且各家的进位还会不一样。
 */
const now = ref(Date.now())
let timer: ReturnType<typeof setTimeout> | undefined
const stopClock = () => {
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
}
onBeforeUnmount(stopClock)

const gate = computed(() =>
  approvalGate({
    expiresAt: props.expiresAt,
    version: props.version,
    currentVersion: props.currentVersion,
    now: now.value
  })
)

watchEffect(() => {
  stopClock()
  // 只在还剩时间时走表：已经过期或版本已失效之后再跳，除了耗电什么也不做
  if (gate.value.state !== 'expiring') return
  const tick = () => {
    now.value = Date.now()
    timer = setTimeout(tick, elapsedInterval(Date.now()))
  }
  timer = setTimeout(tick, elapsedInterval(now.value))
})

const index = ref(0)
const selected = ref<string[]>([])
const custom = ref('')
const answers = ref<Record<string, ApprovalAnswer>>({})

const current = computed(() => props.questions[index.value])
const total = computed(() => props.questions.length)
const progress = computed(() => approvalProgress(index.value, total.value))
const advanceable = computed(() =>
  // 不能拍板时连「下一题」都停掉：翻到最后一题再发现按钮是灰的更让人恼火
  gate.value.decidable && current.value
    ? canAdvance(current.value, selected.value, custom.value)
    : false
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
  if (!current.value || !gate.value.decidable) return
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

    <!--
      失效说明放在选项上方而不是按钮旁边：读者是先看选项再看按钮的，
      放在下面等于让他把一遍选项白读了。role="status" 让读屏在它出现时就播报，
      而不是等焦点走到这儿。
    -->
    <div
      v-if="gate.state !== 'open'"
      class="i-approval__gate"
      :class="`i-approval__gate--${gate.state}`"
      role="status"
    >
      <span class="i-approval__gate-icon">
        <IIcon :name="gate.state === 'stale' ? 'history' : 'clock'" :size="14" />
      </span>
      <span class="i-approval__gate-text">
        <strong>{{ gate.label }}</strong>
        <template v-if="gate.detail">{{ gate.detail }}</template>
      </span>
      <IButton
        v-if="gate.action === 'renew'"
        size="sm"
        class="i-approval__gate-action"
        @click="emit('renew')"
      >
        {{ renewText }}
      </IButton>
      <IButton
        v-else-if="gate.action === 'review'"
        size="sm"
        class="i-approval__gate-action"
        @click="emit('review')"
      >
        {{ reviewText }}
      </IButton>
    </div>

    <div class="i-approval__options" :role="current.multiple ? 'group' : 'radiogroup'">
      <button
        v-for="option in current.options"
        :key="option.value"
        type="button"
        class="i-approval__option"
        :class="{ 'is-selected': selected.includes(option.value) }"
        :role="current.multiple ? 'checkbox' : 'radio'"
        :aria-checked="selected.includes(option.value)"
        :disabled="!gate.decidable"
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
      :disabled="!gate.decidable"
      :placeholder="current.customPlaceholder ?? `${locale.otherOption}……`"
      :aria-label="current.customPlaceholder ?? locale.otherOption"
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
          :aria-label="locale.next"
          :disabled="isLast || !advanceable"
          @click="next"
        >
          <IIcon name="chevron-down" :size="14" />
        </button>
      </div>

      <div class="i-approval__actions">
        <IButton v-if="current.skippable" size="sm" :disabled="!gate.decidable" @click="skip">
          {{ skipText }}
        </IButton>
        <IButton size="sm" variant="primary" :disabled="!advanceable" @click="next">
          {{ isLast ? confirmText : locale.next }}
        </IButton>
      </div>
    </footer>
  </section>
</template>
