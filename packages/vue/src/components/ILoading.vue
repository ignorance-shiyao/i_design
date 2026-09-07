<script setup lang="ts">
withDefaults(
  defineProps<{
    loading?: boolean
    text?: string
    size?: 'sm' | 'md' | 'lg'
    fullscreen?: boolean
  }>(),
  { loading: true, text: '', size: 'md', fullscreen: false }
)
</script>

<template>
  <!--
    Vue 2 的模板必须单根，因此这里用一个包裹层统一承载两种形态：
    有插槽时作为区域遮罩的定位父级，无插槽时退化为纯指示器的行内容器。
  -->
  <span class="i-loading-host" :class="{ 'i-loading-wrap': !!$slots.default }">
    <slot />
    <span v-if="$slots.default && loading" class="i-loading-mask" :class="{ 'is-fullscreen': fullscreen }">
      <span class="i-loading" :class="`i-loading--${size}`" role="status" :aria-label="text || '加载中'">
        <span class="i-loading__spinner" />
        <span v-if="text" class="i-loading__text">{{ text }}</span>
      </span>
    </span>
    <span
      v-else-if="!$slots.default && loading"
      class="i-loading"
      :class="`i-loading--${size}`"
      role="status"
      :aria-label="text || '加载中'"
    >
      <span class="i-loading__spinner" />
      <span v-if="text" class="i-loading__text">{{ text }}</span>
    </span>
  </span>
</template>
