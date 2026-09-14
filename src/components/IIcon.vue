<script setup lang="ts">
import { computed } from 'vue'
import { icons, type IconName } from './icons'

const props = withDefaults(
  defineProps<{
    name: IconName
    /**
     * 直接给 path 数据，跳过按名字查表。
     *
     * 只用少数几个图标、又在意体积时用它：`import { iconTrash }` 只会带走那一条，
     * 而按名字查表是整张表一起进产物（表是一个对象，摇树摇不掉没用到的条目）。
     * 小程序与 Flutter 没有 JS 摇树这回事，那两端不提供这个属性。
     */
    path?: string
    /** 尺寸跟随字号更自然，传数字则按 px */
    size?: number | string
    /** 线宽；小尺寸下适当加粗才不显虚 */
    strokeWidth?: number
    /** 无障碍标签；不传时视为装饰性图标，对读屏隐藏 */
    label?: string
    spin?: boolean
  }>(),
  { size: '1em', strokeWidth: 1.8, label: '', spin: false, path: undefined }
)

const path = computed(() => props.path ?? icons[props.name])
const dimension = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
/*
 * 默认尺寸由 .i-icon 的类给出，这里就不写内联样式了——
 * 不带 unsafe-inline 的 CSP 会拒绝整个 style 属性，那样图标会全部塌成 0。
 */
const sizing = computed(() => (dimension.value === '1em' ? undefined : { width: dimension.value, height: dimension.value }))
</script>

<template>
  <svg
    class="i-icon"
    :class="{ 'is-spin': spin }"
    :style="sizing"
    viewBox="0 0 24 24"
    fill="none"
    :stroke-width="strokeWidth"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  >
    <path :d="path" />
  </svg>
</template>
