<script setup lang="ts">
import { computed } from 'vue'
import { safeHref } from '@i-design/common'
import IIcon from './IIcon.vue'
import type { IconName } from './icons'

const props = withDefaults(
  defineProps<{
    href?: string
    target?: '_self' | '_blank'
    theme?: 'default' | 'brand' | 'success' | 'warning' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    /** 下划线时机。默认一直有——颜色不能是「这是个链接」的唯一线索 */
    underline?: 'always' | 'hover' | 'never'
    disabled?: boolean
    prefixIcon?: IconName | ''
    suffixIcon?: IconName | ''
  }>(),
  {
    href: '',
    target: '_self',
    theme: 'brand',
    size: 'md',
    underline: 'always',
    disabled: false,
    prefixIcon: '',
    suffixIcon: ''
  }
)

/*
 * 地址过一道白名单。组件不知道 href 是谁给的——在 AI 产品里它常常来自模型输出，
 * 过不了就退化成不可点的文本，而不是渲染出一个点了会出事的链接。
 */
const url = computed(() => safeHref(props.href))

const emit = defineEmits<{ click: [MouseEvent] }>()

/*
 * 新标签页打开时补 rel="noopener"。
 *
 * 不补的话，被打开的页面能通过 window.opener 把原页面导航到任意地址——
 * 这是一个真实的钓鱼手法，而且默认行为就是不安全的那一侧。
 */
const rel = computed(() => (props.target === '_blank' ? 'noopener noreferrer' : undefined))

/* 外链默认补一个角标：点下去会离开当前站点，这件事该在点之前就看得出来 */
const trailing = computed(() =>
  props.suffixIcon || (props.target === '_blank' ? 'external-link' : '')
)

function onClick(event: MouseEvent) {
  if (props.disabled) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<template>
  <component
    :is="url && !disabled ? 'a' : 'button'"
    class="i-link"
    :class="[
      `i-link--${theme}`,
      `i-link--${size}`,
      `i-link--underline-${underline}`,
      { 'is-disabled': disabled }
    ]"
    :href="url && !disabled ? url : undefined"
    :target="url ? target : undefined"
    :rel="href ? rel : undefined"
    :type="href && !disabled ? undefined : 'button'"
    :disabled="!href && disabled ? true : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    @click="onClick"
  >
    <IIcon v-if="prefixIcon" class="i-link__icon" :name="prefixIcon" :size="14" />
    <slot />
    <IIcon v-if="trailing" class="i-link__icon" :name="trailing as IconName" :size="14" />
  </component>
</template>
