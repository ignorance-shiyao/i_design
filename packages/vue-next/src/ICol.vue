<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 24 栅格中的跨度 */
    span?: number
    offset?: number
    /** 窄屏（≤768px）下的跨度；默认整行铺满 */
    sm?: number
    /** 不随窄屏变化，保持 span */
    keep?: boolean
    /** 占满剩余空间，忽略 span */
    flex?: boolean
  }>(),
  { span: 24, offset: 0, sm: 24, keep: false, flex: false }
)

const style = computed(() => ({
  '--i-col-span': props.span,
  '--i-col-span-sm': props.sm,
  '--i-col-offset': props.offset
}))
</script>

<template>
  <div
    class="i-col"
    :class="{ 'is-offset': offset > 0, 'is-keep': keep, 'is-flex': flex }"
    :style="style"
  >
    <slot />
  </div>
</template>
