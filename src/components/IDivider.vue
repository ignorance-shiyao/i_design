<script setup lang="ts">
withDefaults(
  defineProps<{
    direction?: 'horizontal' | 'vertical'
    /** 带文字时的对齐位置 */
    align?: 'left' | 'center' | 'right'
    dashed?: boolean
  }>(),
  { direction: 'horizontal', align: 'center', dashed: false }
)
</script>

<template>
  <div
    class="i-divider"
    :class="[`i-divider--${direction}`, `is-${align}`, { 'is-dashed': dashed, 'has-text': !!$slots.default }]"
    role="separator"
  >
    <span v-if="$slots.default && direction === 'horizontal'" class="i-divider__text"><slot /></span>
  </div>
</template>

<style scoped>
.i-divider--horizontal {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-4);
  margin: var(--i-spacing-6) 0;
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
}
/* 用伪元素画左右两段线，文字居中/靠边只需调整两段的 flex 比例 */
.i-divider--horizontal::before,
.i-divider--horizontal::after {
  content: '';
  flex: 1;
  border-top: 1px solid var(--i-color-border);
}
.i-divider--horizontal.is-dashed::before,
.i-divider--horizontal.is-dashed::after { border-top-style: dashed; }
.i-divider--horizontal:not(.has-text)::after { display: none; }
.i-divider--horizontal.is-left::before { flex: 0 0 var(--i-spacing-6); }
.i-divider--horizontal.is-right::after { flex: 0 0 var(--i-spacing-6); }
.i-divider__text { white-space: nowrap; }

.i-divider--vertical {
  display: inline-block;
  width: 1px;
  height: 1em;
  margin: 0 var(--i-spacing-3);
  vertical-align: middle;
  background: var(--i-color-border);
}
.i-divider--vertical.is-dashed {
  width: 0;
  background: none;
  border-left: 1px dashed var(--i-color-border);
}
</style>
