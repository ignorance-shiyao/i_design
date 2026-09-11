<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ILink.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed } from 'vue'
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

const emit = defineEmits<{ (e: 'click', a0: MouseEvent): void }>()

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
    :is="href && !disabled ? 'a' : 'button'"
    class="i-link"
    :class="[
      `i-link--${theme}`,
      `i-link--${size}`,
      `i-link--underline-${underline}`,
      { 'is-disabled': disabled }
    ]"
    :href="href && !disabled ? href : undefined"
    :target="href ? target : undefined"
    :rel="href ? rel : undefined"
    :type="href && !disabled ? undefined : 'button'"
    :disabled="!href && disabled ? true : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    @click="onClick"
  >
    <IIcon v-if="prefixIcon" class="i-link__icon" :name="prefixIcon" :size="14" />
    <slot />
    <IIcon v-if="trailing" class="i-link__icon" :name="trailing" :size="14" />
  </component>
</template>
