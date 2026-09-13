<script setup lang="ts">
import { ref } from "vue";
import CodeBlock from "./CodeBlock.vue";
import FrameworkTabs from "./FrameworkTabs.vue";
import IIcon from "@/components/IIcon.vue";
import type { SnippetSet } from "@/data/snippets";

defineProps<{
  title?: string;
  description?: string;
  code?: string;
  lang?: string;
  /** 传入后代码区变成多端标签页；片段的属性名由 scripts/check-snippets.mjs 核对 */
  snippets?: SnippetSet;
}>();
const showCode = ref(false);
</script>

<template>
  <section class="demo">
    <header v-if="title" class="demo__head">
      <h3 class="demo__title">{{ title }}</h3>
      <p v-if="description" class="demo__desc">{{ description }}</p>
    </header>
    <div class="demo__stage"><slot /></div>
    <footer v-if="code || snippets" class="demo__foot">
      <button
        class="demo__toggle"
        :aria-expanded="showCode"
        @click="showCode = !showCode"
      >
        <IIcon :name="showCode ? 'chevron-up' : 'code'" :size="14" />
        {{ showCode ? "隐藏代码" : "查看代码" }}
      </button>
    </footer>
    <div v-if="showCode" class="demo__code">
      <FrameworkTabs v-if="snippets" :snippets="snippets" />
      <CodeBlock v-else-if="code" :code="code" :lang="lang" />
    </div>
  </section>
</template>

<style scoped>
.demo {
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-md);
  /* 不能裁剪：Select、DatePicker 等浮层会溢出示例区，裁掉就看不全了 */
  overflow: visible;
  margin-bottom: var(--i-spacing-6);
  background: var(--i-color-bg-elevated);
  box-shadow: none;
  transition: box-shadow var(--i-motion-base) var(--i-motion-easing);
}
.demo:hover {
  border-color: var(--i-color-border-strong);
}
.demo__head {
  padding: var(--i-spacing-5) var(--i-spacing-6) 0;
}
.demo__title {
  font-size: var(--i-font-size-md);
  letter-spacing: 0;
}
.demo__desc {
  margin-top: var(--i-spacing-1);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
}
.demo__stage {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--i-spacing-3);
  padding: var(--i-spacing-8) var(--i-spacing-6);
  /* 极淡的点阵底纹，把示例区与说明区分开又不抢眼 */
  background: var(--i-color-bg-elevated);
}
.demo__foot {
  border-top: 1px solid var(--i-color-hairline);
  padding: var(--i-spacing-2) var(--i-spacing-4);
  display: flex;
  justify-content: flex-end;
}
.demo__toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--i-spacing-2);
  padding: var(--i-spacing-1) var(--i-spacing-3);
  border: none;
  border-radius: var(--i-radius-md);
  background: none;
  font-family: inherit;
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
  cursor: pointer;
  transition: color var(--i-motion-fast) var(--i-motion-easing),
    background var(--i-motion-fast) var(--i-motion-easing);
}
.demo__toggle:hover {
  color: var(--i-color-brand-text);
  background: var(--i-color-brand-subtle);
}
.demo__code {
  padding: 0 var(--i-spacing-4) var(--i-spacing-4);
}
.demo__code :deep(.code) {
  border-radius: var(--i-radius-lg);
}

@media (max-width: 768px) {
  /* 窄屏把内边距收一档：示例区本身才是内容，边距吃掉的是可用宽度 */
  .demo__head {
    padding: var(--i-spacing-4) var(--i-spacing-4) 0;
  }
  .demo__stage {
    padding: var(--i-spacing-5) var(--i-spacing-4);
  }
  .demo {
    margin-bottom: var(--i-spacing-5);
  }
}
</style>
