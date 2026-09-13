<script setup lang="ts">
import { computed } from 'vue'
import CodeBlock from './CodeBlock.vue'
import { frameworks, type FrameworkId } from '@/data/frameworks'
import type { SnippetSet } from '@/data/snippets'
import { currentFramework } from '@/composables/useFramework'

const props = defineProps<{ snippets: SnippetSet }>()

/** 只显示这个组件确实提供了片段的端，避免点进去是空的 */
const available = computed(() => frameworks.filter((f) => props.snippets[f.id]))

const active = computed<FrameworkId>(() => {
  const chosen = currentFramework.value
  if (props.snippets[chosen]) return chosen
  // 当前选中的端在这个组件上没有片段时，回落到第一个可用端，而不是留空
  return available.value[0]?.id ?? 'vue-next'
})

const activeMeta = computed(() => frameworks.find((f) => f.id === active.value)!)
</script>

<template>
  <div class="fw">
    <div class="fw__tabs" role="tablist" aria-label="选择技术栈">
      <button
        v-for="f in available"
        :key="f.id"
        class="fw__tab"
        :class="{ 'is-active': f.id === active }"
        role="tab"
        :aria-selected="f.id === active"
        @click="currentFramework = f.id"
      >
        {{ f.label }}
      </button>
      <span class="fw__hint">{{ activeMeta.pkg }}</span>
    </div>
    <CodeBlock :code="snippets[active] ?? ''" :lang="activeMeta.lang" />
  </div>
</template>

<style scoped>
.fw__tabs {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-1);
  padding: var(--i-spacing-2) var(--i-spacing-3);
  border-bottom: 1px solid var(--i-color-hairline);
  background: var(--i-color-code-bar);
  overflow-x: auto;
}
.fw__tab {
  flex: none;
  padding: var(--i-spacing-1) var(--i-spacing-3);
  border: none;
  border-radius: var(--i-radius-md);
  background: none;
  font-family: inherit;
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-tertiary);
  cursor: pointer;
  transition: color var(--i-motion-fast) var(--i-motion-easing),
    background var(--i-motion-fast) var(--i-motion-easing);
}
.fw__tab:hover { color: var(--i-color-text); }
.fw__tab.is-active {
  background: var(--i-color-bg-elevated);
  color: var(--i-color-brand-text);
  font-weight: 500;
}
.fw__hint {
  margin-left: auto;
  padding-left: var(--i-spacing-3);
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-tertiary);
  white-space: nowrap;
}
</style>
