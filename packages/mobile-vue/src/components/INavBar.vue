<script setup lang="ts">
import IIcon from './_Icon.vue'

withDefaults(
  defineProps<{
    title?: string
    /** 显示返回箭头 */
    back?: boolean
    backText?: string
    /** 透明底：用于沉浸式头图页面 */
    transparent?: boolean
    fixed?: boolean
  }>(),
  { title: '', back: false, backText: '', transparent: false, fixed: false }
)

defineEmits<{ back: [] }>()
</script>

<template>
  <!-- 左右两侧等宽，标题才不会因为一侧多一个按钮就偏移 -->
  <header
    class="i-nav-bar"
    :class="[{ 'i-nav-bar--transparent': transparent, 'is-fixed': fixed }]"
  >
    <div class="i-nav-bar__side">
      <button v-if="back" class="i-nav-bar__action" @click="$emit('back')">
        <IIcon name="chevron-left" :size="20" />
        <span v-if="backText">{{ backText }}</span>
      </button>
      <slot name="left" />
    </div>

    <h1 class="i-nav-bar__title"><slot>{{ title }}</slot></h1>

    <div class="i-nav-bar__side i-nav-bar__side--right">
      <slot name="right" />
    </div>
  </header>
</template>
