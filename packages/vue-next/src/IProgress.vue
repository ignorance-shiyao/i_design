<script setup lang="ts">
import { computed } from 'vue'
import { useConfig } from './useConfig'

const props = withDefaults(
  defineProps<{
    /** 0-100；indeterminate 时忽略 */
    percent?: number
    type?: 'line' | 'circle'
    /** 100% 不自动变成功色：进度走完不等于任务成功 */
    status?: 'normal' | 'success' | 'warning' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    /** 不知道还剩多少：显示来回滑动的一小段 */
    indeterminate?: boolean
    showText?: boolean
    /** 自定义文字，留空则显示百分比 */
    text?: string
    /** 无障碍名。不传时用字典里的「加载中」——读屏遇到没有名字的进度条只会念「进度条」 */
    ariaLabel?: string
    /** 环形直径 */
    width?: number
  }>(),
  {
    percent: 0,
    type: 'line',
    status: 'normal',
    size: 'md',
    indeterminate: false,
    showText: true,
    text: '',
    ariaLabel: '',
    width: 96
  }
)

/* 进度条没有名字时，读屏只会念「进度条」，听不出这是在加载什么 */
const { locale } = useConfig()

const clamped = computed(() => Math.min(100, Math.max(0, props.percent)))
const label = computed(() => props.text || `${Math.round(clamped.value)}%`)

// 环形：用 stroke-dasharray 画弧，周长要按实际半径算，写死会在改尺寸时错位
const stroke = computed(() => (props.size === 'sm' ? 4 : props.size === 'lg' ? 10 : 6))
const radius = computed(() => (props.width - stroke.value) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => circumference.value * (1 - clamped.value / 100))
</script>

<template>
  <div
    v-if="type === 'circle'"
    class="i-progress i-progress--circle"
    :class="[`i-progress--${status}`, `i-progress--${size}`]"
    role="progressbar"
    :aria-label="ariaLabel || locale.loading"
    :aria-valuenow="indeterminate ? undefined : clamped"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <svg class="i-progress__circle" :width="width" :height="width">
      <circle
        class="i-progress__circle-track"
        :cx="width / 2"
        :cy="width / 2"
        :r="radius"
        :stroke-width="stroke"
      />
      <circle
        class="i-progress__circle-bar"
        :cx="width / 2"
        :cy="width / 2"
        :r="radius"
        :stroke-width="stroke"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
      />
    </svg>
    <span v-if="showText" class="i-progress__circle-label">{{ label }}</span>
  </div>

  <div
    v-else
    class="i-progress"
    :class="[`i-progress--${status}`, `i-progress--${size}`, { 'is-indeterminate': indeterminate }]"
    role="progressbar"
    :aria-label="ariaLabel || locale.loading"
    :aria-valuenow="indeterminate ? undefined : clamped"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div class="i-progress__track">
      <div class="i-progress__bar" :style="{ width: `${clamped}%` }" />
    </div>
    <span v-if="showText && !indeterminate" class="i-progress__text">{{ label }}</span>
  </div>
</template>
