<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IInputAdornment.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 固定前缀，例如 https:// */
    prepend?: string
    /** 固定后缀，例如 .com、元 */
    append?: string
  }>(),
  { prepend: '', append: '' }
)
</script>

<template>
  <div
    class="i-input-adornment"
    :class="{
      'has-prepend': !!(prepend || $scopedSlots.prepend),
      'has-append': !!(append || $scopedSlots.append)
    }"
  >
    <span
      v-if="prepend || $scopedSlots.prepend"
      class="i-input-adornment__part i-input-adornment__part--prepend"
    >
      <slot name="prepend">{{ prepend }}</slot>
    </span>

    <span class="i-input-adornment__body"><slot /></span>

    <span
      v-if="append || $scopedSlots.append"
      class="i-input-adornment__part i-input-adornment__part--append"
    >
      <slot name="append">{{ append }}</slot>
    </span>
  </div>
</template>
