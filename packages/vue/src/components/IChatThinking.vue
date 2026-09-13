<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChatThinking.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import IIcon from './IIcon.vue'
import ILoading from './ILoading.vue'
import { useConfig } from './useConfig'
import {
  defaultOpenSteps,
  summarizeThinking,
  thinkingStepIcon,
  toggleThinkingStep,
  type ThinkingStep
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 推理耗时的展示文案，如「思考了 12 秒」 */
    duration?: string
    label?: string
    /** 仍在推理中：标题旁的点持续呼吸 */
    pending?: boolean
    /** 初始是否展开；默认折叠——推理过程有用，但它不是答案 */
    defaultOpen?: boolean
    /**
     * 分步轨迹。给了就按步展示，每步可单独展开；
     * 不给则退回默认插槽，仍是一整段文字。
     */
    steps?: ThinkingStep[]
  }>(),
  { duration: '', label: '', pending: false, defaultOpen: false, steps: () => [] }
)

/*
 * 标题走字典：不传时用「推理过程」那一句，传了以传进来的为准。
 * 默认值写死中文的话，换成英文字典后这里会是整块界面里唯一还说中文的地方。
 */
const { locale } = useConfig()
const label = computed(() => props.label || locale.value.thinking)

// 推理结束后不自动展开：用户此时正在读答案，弹开一大段过程会把答案推走
const open = ref(props.defaultOpen)

const summary = computed(() => summarizeThinking(props.steps))

/* 折叠时把进度顶在标题上：折叠不该连「走到第几步」一起藏掉 */
const progress = computed(() =>
  summary.value.total ? `${summary.value.activeIndex + 1}/${summary.value.total}` : ''
)

const openSteps = ref<string[]>(defaultOpenSteps(props.steps))
/* 步骤换了一批就重算默认展开：出错的那步是新出现的，用户此刻要看的正是它 */
watch(
  () => props.steps.map((s) => `${s.key}:${s.status ?? 'done'}`).join(),
  () => (openSteps.value = defaultOpenSteps(props.steps))
)
</script>

<template>
  <section class="i-chat-thinking" :class="{ 'is-open': open }">
    <button class="i-chat-thinking__head" :aria-expanded="String(open)" @click="open = !open">
      <span v-if="pending" class="i-chat-thinking__pulse" />
      <IIcon class="i-chat-thinking__arrow" name="chevron-right" :size="14" />
      <span class="i-chat-thinking__label">{{ label }}</span>
      <span v-if="progress" class="i-chat-thinking__progress">{{ progress }}</span>
      <span v-if="duration" class="i-chat-thinking__duration">{{ duration }}</span>
    </button>

    <div v-show="open" class="i-chat-thinking__body">
      <ol v-if="steps.length" class="i-chat-thinking__steps">
        <li
          v-for="step in steps"
          :key="step.key"
          class="i-chat-thinking__step"
          :class="`i-chat-thinking__step--${step.status ?? 'done'}`"
        >
          <button
            class="i-chat-thinking__step-head"
            type="button"
            :aria-expanded="String(openSteps.includes(step.key))"
            :disabled="!step.detail"
            @click="openSteps = toggleThinkingStep(openSteps, step.key)"
          >
            <span class="i-chat-thinking__step-icon">
              <ILoading v-if="step.status === 'running'" size="sm" />
              <IIcon v-else :name="thinkingStepIcon(step.kind)" :size="13" />
            </span>
            <span class="i-chat-thinking__step-title">{{ step.title }}</span>
            <IIcon
              v-if="step.detail"
              class="i-chat-thinking__step-arrow"
              name="chevron-right"
              :size="12"
            />
          </button>
          <p v-if="step.detail && openSteps.includes(step.key)" class="i-chat-thinking__step-detail">{{ step.detail }}</p>
        </li>
      </ol>
      <slot v-else />
    </div>
  </section>
</template>
