<script setup lang="ts">
import { computed } from 'vue'
import IIcon from './IIcon.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    value: number | string
    prefix?: string
    suffix?: string
    /** 小数位；字符串值不做处理 */
    precision?: number
    /** 千分位分隔 */
    separator?: boolean
    type?: 'default' | 'brand' | 'success' | 'danger'
    size?: 'md' | 'sm'
    /** 同比变化，正数向上、负数向下 */
    trend?: number
    extra?: string
  }>(),
  {
    title: '',
    prefix: '',
    suffix: '',
    precision: 0,
    separator: true,
    type: 'default',
    size: 'md',
    trend: 0,
    extra: ''
  }
)

const display = computed(() => {
  if (typeof props.value === 'string') return props.value
  const fixed = props.value.toFixed(props.precision)
  if (!props.separator) return fixed
  // 只给整数部分加分隔符，小数部分保持原样
  const [int, decimal] = fixed.split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decimal ? `${grouped}.${decimal}` : grouped
})
</script>

<template>
  <div class="i-statistic" :class="[`i-statistic--${type}`, `i-statistic--${size}`]">
    <div v-if="title" class="i-statistic__title">{{ title }}</div>
    <div class="i-statistic__value">
      <span v-if="prefix" class="i-statistic__affix">{{ prefix }}</span>
      <span>{{ display }}</span>
      <span v-if="suffix" class="i-statistic__affix">{{ suffix }}</span>
    </div>
    <div v-if="trend !== 0 || extra" class="i-statistic__extra">
      <span v-if="trend !== 0" class="i-statistic__trend" :class="trend > 0 ? 'is-up' : 'is-down'">
        <IIcon :name="trend > 0 ? 'chevron-up' : 'chevron-down'" :size="12" />
        {{ Math.abs(trend) }}%
      </span>
      <span v-if="extra">{{ extra }}</span>
    </div>
  </div>
</template>
