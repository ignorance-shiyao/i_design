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
      'has-prepend': !!(prepend || $slots.prepend),
      'has-append': !!(append || $slots.append)
    }"
  >
    <span
      v-if="prepend || $slots.prepend"
      class="i-input-adornment__part i-input-adornment__part--prepend"
    >
      <slot name="prepend">{{ prepend }}</slot>
    </span>

    <span class="i-input-adornment__body"><slot /></span>

    <span
      v-if="append || $slots.append"
      class="i-input-adornment__part i-input-adornment__part--append"
    >
      <slot name="append">{{ append }}</slot>
    </span>
  </div>
</template>
