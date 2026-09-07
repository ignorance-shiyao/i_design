<script setup lang="ts">
import IIcon from './_Icon.vue'

withDefaults(
  defineProps<{
    title: string
    description?: string
    value?: string | number
    /** 声明可点击后显示右箭头并给出按压反馈 */
    clickable?: boolean
  }>(),
  { description: '', value: undefined, clickable: false }
)

defineEmits<{ click: [] }>()
</script>

<template>
  <div
    class="i-cell"
    :class="{ 'is-clickable': clickable }"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    @click="clickable && $emit('click')"
  >
    <div class="i-cell__body">
      <span class="i-cell__title">{{ title }}</span>
      <span v-if="description" class="i-cell__desc">{{ description }}</span>
    </div>
    <span v-if="value !== undefined || $slots.value" class="i-cell__value">
      <slot name="value">{{ value }}</slot>
    </span>
    <IIcon v-if="clickable" class="i-cell__arrow" name="chevron-right" :size="16" />
  </div>
</template>
