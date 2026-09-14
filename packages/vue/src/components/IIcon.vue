<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IIcon.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { icons, type IconName } from './icons'
import { filledIcons, hasFilled, FILLED_SECONDARY_OPACITY } from '@i-design/common'

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
    /**
     * 描边还是填充。
     *
     * 填充用在小尺寸、低对比的位置：徽标里的勾、16px 的状态点、
     * 移动端底栏的选中项——描边在那些地方会「化掉」。
     * 没有填充版的图标自动退回描边，任何时候都有东西可画。
     */
    variant?: 'stroke' | 'fill'
    /** 尺寸跟随字号更自然，传数字则按 px */
    size?: number | string
    /** 线宽；小尺寸下适当加粗才不显虚 */
    strokeWidth?: number
    /** 无障碍标签；不传时视为装饰性图标，对读屏隐藏 */
    label?: string
    spin?: boolean
  }>(),
  { size: '1em', strokeWidth: 1.8, label: '', spin: false, path: undefined, variant: 'stroke' }
)

const path = computed(() => props.path ?? icons[props.name])

/* 填充版是可选增补：没有的图标退回描边，而不是画一个空白 */
const filled = computed(() =>
  props.variant === 'fill' && !props.path && hasFilled(props.name) ? filledIcons[props.name] : null
)
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
    :fill="filled ? 'currentColor' : 'none'"
    :stroke-width="filled ? 0 : strokeWidth"
    :stroke="filled ? 'none' : 'currentColor'"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  >
    <!--
      双色靠同一个 currentColor 的两档不透明度，不引第二种颜色：
      引入第二色就得为每个主题、每种底色重新验一遍对比度，
      而同色两档在任何底色上的对比关系都是确定的，灰度打印也不会糊成一块。
    -->
    <template v-if="filled">
      <path v-if="filled.secondary" :d="filled.secondary" :opacity="FILLED_SECONDARY_OPACITY" />
      <path :d="filled.path" />
    </template>
    <path v-else :d="path" />
  </svg>
</template>
