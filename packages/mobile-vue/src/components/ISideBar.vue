<script setup lang="ts">
export interface SideBarItem {
  value: string
  label: string
  /** 角标数字；0 或不传则不显示 */
  badge?: number
  disabled?: boolean
}

/**
 * 侧边导航：左边是类目，右边是该类目的内容。
 *
 * 选中项用淡底色块加主题色文字，底色与右侧内容区相同，
 * 表达「右边这块属于它」——不用左侧粗竖线，那是被禁用的状态暗示。
 */
defineProps<{ modelValue: string; items: SideBarItem[] }>()

const emit = defineEmits<{ 'update:modelValue': [string]; change: [string] }>()

function pick(item: SideBarItem) {
  if (item.disabled) return
  emit('update:modelValue', item.value)
  emit('change', item.value)
}
</script>

<template>
  <nav class="i-side-bar" role="tablist" aria-orientation="vertical">
    <button
      v-for="item in items"
      :key="item.value"
      class="i-side-bar__item"
      :class="{ 'is-active': item.value === modelValue }"
      type="button"
      role="tab"
      :aria-selected="item.value === modelValue"
      :disabled="item.disabled"
      @click="pick(item)"
    >
      {{ item.label }}
      <span v-if="item.badge" class="i-side-bar__badge">
        {{ item.badge > 99 ? '99+' : item.badge }}
      </span>
    </button>
  </nav>
</template>
