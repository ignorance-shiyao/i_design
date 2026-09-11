<script setup lang="ts">
import IIcon from './IIcon.vue'

/**
 * 页头：返回、标题、副标题、右侧操作。
 *
 * 返回键与标题同一行而不是叠在标题上方：叠起来会让标题看着像副标题，
 * 而它是这一页最重要的那行字。
 */
withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    /** 返回键文案；传空字符串则只显示箭头 */
    backText?: string
    /** 不需要返回时整块去掉，而不是留一个点不动的箭头 */
    back?: boolean
  }>(),
  { title: '', subtitle: '', backText: '返回', back: true }
)

const emit = defineEmits<{ back: [] }>()
</script>

<template>
  <header class="i-page-header">
    <template v-if="back">
      <button class="i-page-header__back" type="button" @click="emit('back')">
        <IIcon name="chevron-left" :size="18" />
        <span v-if="backText">{{ backText }}</span>
      </button>
      <span class="i-page-header__divider" aria-hidden="true" />
    </template>

    <div class="i-page-header__main">
      <h1 class="i-page-header__title"><slot name="title">{{ title }}</slot></h1>
      <p v-if="subtitle || $slots.subtitle" class="i-page-header__subtitle">
        <slot name="subtitle">{{ subtitle }}</slot>
      </p>
    </div>

    <div v-if="$slots.extra" class="i-page-header__extra"><slot name="extra" /></div>
    <div v-if="$slots.default" class="i-page-header__content"><slot /></div>
  </header>
</template>
