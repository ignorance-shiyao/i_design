<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IAvatarGroup.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { avatarSizePx } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 超出部分折叠为 +N */
    max?: number
    size?: 'sm' | 'md' | 'lg' | number
    total?: number
  }>(),
  { max: 0, size: 'md', total: 0 }
)

/*
 * 「+N」那个圆点要和旁边的头像一样大。
 * 此前 size 只是声明了但没人读，样式里写死 32px——sm 与 lg 两档一直是错位的。
 */
const chipSize = computed(() => `${avatarSizePx(props.size)}px`)
</script>

<template>
  <div class="i-avatar-group" :style="{ '--i-avatar-group-size': chipSize }">
    <slot />
    <span v-if="total > max && max > 0" class="i-avatar-group__more">+{{ total - max }}</span>
  </div>
</template>
