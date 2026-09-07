<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 空态成因决定文案与可用操作 */
    type?: 'empty' | 'search' | 'error' | 'permission'
    title?: string
    description?: string
    size?: 'sm' | 'md'
  }>(),
  { type: 'empty', title: '', description: '', size: 'md' }
)

const presets: Record<string, { title: string; description: string }> = {
  empty: { title: '暂无数据', description: '这里还没有内容，创建第一条试试。' },
  search: { title: '没有匹配结果', description: '换个关键词，或减少筛选条件。' },
  error: { title: '加载失败', description: '请检查网络后重试。' },
  permission: { title: '无访问权限', description: '请联系管理员申请该资源的访问权限。' }
}
</script>

<template>
  <div class="i-empty" :class="`i-empty--${size}`">
    <svg class="i-empty__art" viewBox="0 0 120 90" fill="none" aria-hidden="true">
      <ellipse cx="60" cy="76" rx="38" ry="6" class="i-empty__shadow" />
      <path d="M26 34h68v34a6 6 0 0 1-6 6H32a6 6 0 0 1-6-6z" class="i-empty__box" />
      <path d="M26 34 38 14h44l12 20" class="i-empty__lid" />
      <path d="M26 34h20l5 10h18l5-10h20" class="i-empty__slot" />
    </svg>
    <p class="i-empty__title">{{ title || presets[type].title }}</p>
    <p class="i-empty__desc">{{ description || presets[type].description }}</p>
    <div v-if="$slots.default" class="i-empty__action"><slot /></div>
  </div>
</template>

<style scoped>
.i-empty {
  display: grid;
  justify-items: center;
  gap: var(--i-spacing-2);
  padding: var(--i-spacing-12) var(--i-spacing-6);
  text-align: center;
}
.i-empty--sm { padding: var(--i-spacing-6); }
.i-empty__art { width: 120px; height: 90px; margin-bottom: var(--i-spacing-2); }
.i-empty--sm .i-empty__art { width: 84px; height: 63px; }
.i-empty__shadow { fill: var(--i-color-bg-muted); }
.i-empty__box { fill: var(--i-color-bg-subtle); stroke: var(--i-color-border-strong); stroke-width: 1.5; }
.i-empty__lid,
.i-empty__slot {
  stroke: var(--i-color-border-strong);
  stroke-width: 1.5;
  stroke-linejoin: round;
  fill: none;
}
.i-empty__title { color: var(--i-color-text); font-weight: 500; }
.i-empty__desc { color: var(--i-color-text-tertiary); font-size: var(--i-font-size-sm); max-width: 42ch; }
.i-empty__action { margin-top: var(--i-spacing-3); }
</style>
