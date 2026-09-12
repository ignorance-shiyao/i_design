<script setup lang="ts">
/**
 * 悬浮操作按钮。
 *
 * 一页只该有一个：它代表「这一页最主要的那件事」。出现两个就等于没有主次，
 * 用户还得先读一遍才知道点哪个——那还不如放回工具栏里。
 *
 * 带 actions 时点击展开一组次级动作。次级动作也一律带文字标签：
 * 一排只有图标的圆点，是这类组件最常见的失败形态，谁也认不出哪个是「导出」。
 */
import { computed, ref, watch } from 'vue'
import IIcon from './IIcon.vue'
import {
  floatActionDelay,
  floatActionShift,
  type FloatAction,
  type IconName
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    icon?: IconName
    /** 带文字时按钮拉长；只有图标时收成正圆 */
    text?: string
    /** 展开后的次级动作。为空时按钮只发 click */
    actions?: FloatAction[]
    placement?: 'bottom-right' | 'bottom-left'
    /** 距视口边缘的距离 */
    offset?: number
    /** 受控展开态；不传则组件自己管 */
    open?: boolean
  }>(),
  { icon: 'plus', text: '', actions: () => [], placement: 'bottom-right', offset: 24, open: undefined }
)

const emit = defineEmits<{
  click: []
  select: [key: string]
  'update:open': [value: boolean]
}>()

const inner = ref(false)
watch(() => props.open, (value) => {
  if (value !== undefined) inner.value = value
}, { immediate: true })

const expanded = computed(() => props.open ?? inner.value)
const hasActions = computed(() => props.actions.length > 0)

function toggle() {
  if (!hasActions.value) {
    emit('click')
    return
  }
  const next = !expanded.value
  inner.value = next
  emit('update:open', next)
}

function choose(action: FloatAction) {
  emit('select', action.key)
  inner.value = false
  emit('update:open', false)
}

/* 几何走公共层：各端自己写间距的话，同一个组件在三端会错开几像素 */
const actionStyle = (index: number) => ({
  transform: `translateY(-${floatActionShift(index)}px)`,
  transitionDelay: `${floatActionDelay(index, props.actions.length)}ms`
})

const rootStyle = computed(() => ({
  [props.placement === 'bottom-left' ? 'left' : 'right']: `${props.offset}px`,
  bottom: `${props.offset}px`
}))
</script>

<template>
  <div class="i-float" :class="[`i-float--${placement}`, { 'is-expanded': expanded }]" :style="rootStyle">
    <!-- 动作在 DOM 里排在主按钮之前：键盘 Tab 到主按钮展开后，下一个焦点正好落在第一个动作上 -->
    <ul v-if="hasActions" class="i-float__actions" :hidden="!expanded">
      <li v-for="(action, index) in actions" :key="action.key" class="i-float__item" :style="actionStyle(index)">
        <span class="i-float__label">{{ action.label }}</span>
        <button class="i-float__action" type="button" :tabindex="expanded ? 0 : -1" @click="choose(action)">
          <IIcon v-if="action.icon" :name="action.icon as IconName" :size="18" />
          <!-- 没给图标时用文字首字兜底，而不是留一个空圆 -->
          <span v-else class="i-float__initial">{{ action.label.slice(0, 1) }}</span>
        </button>
      </li>
    </ul>

    <button
      class="i-float__main"
      :class="{ 'i-float__main--round': !text }"
      type="button"
      :aria-expanded="hasActions ? expanded : undefined"
      :aria-label="text || '主操作'"
      @click="toggle"
    >
      <IIcon :name="icon" :size="22" />
      <span v-if="text" class="i-float__text">{{ text }}</span>
    </button>
  </div>
</template>
