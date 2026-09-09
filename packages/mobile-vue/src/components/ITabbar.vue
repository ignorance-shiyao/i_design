<script setup lang="ts">
import IIcon from './_Icon.vue'
import type { IconName } from '@i-design/common'

export interface TabbarItem {
  value: string
  label: string
  icon: IconName
  /** 角标数字；0 或不传则不显示 */
  badge?: number
  /** 只显示一个小红点，用于「有更新」这类无需计数的提示 */
  dot?: boolean
}

withDefaults(
  defineProps<{ modelValue: string; items: TabbarItem[]; fixed?: boolean }>(),
  { fixed: false }
)

const emit = defineEmits<{ 'update:modelValue': [string]; change: [string] }>()

function pick(value: string) {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<template>
  <nav class="i-tabbar" :class="{ 'is-fixed': fixed }" role="tablist">
    <button
      v-for="item in items"
      :key="item.value"
      class="i-tabbar__item"
      :class="{ 'is-active': item.value === modelValue }"
      role="tab"
      :aria-selected="item.value === modelValue"
      @click="pick(item.value)"
    >
      <span class="i-tabbar__icon">
        <IIcon :name="item.icon" :size="22" />
        <span v-if="item.badge" class="i-tabbar__badge">{{ item.badge > 99 ? '99+' : item.badge }}</span>
        <span v-else-if="item.dot" class="i-tabbar__dot" />
      </span>
      {{ item.label }}
    </button>
  </nav>
</template>
