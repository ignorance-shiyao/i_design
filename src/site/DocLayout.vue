<script setup lang="ts">
import { docNav } from '@/data/nav'
</script>

<template>
  <div class="i-container doc-layout">
    <aside class="doc-layout__side">
      <div v-for="group in docNav" :key="group.title" class="doc-layout__group">
        <p class="doc-layout__group-title">{{ group.title }}</p>
        <RouterLink v-for="item in group.items" :key="item.to" :to="item.to">{{ item.label }}</RouterLink>
      </div>
    </aside>
    <main class="doc-layout__main i-doc">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.doc-layout {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: var(--i-spacing-12);
  padding-top: var(--i-spacing-10);
  align-items: start;
}
.doc-layout__side {
  position: sticky;
  top: 84px;
  display: grid;
  gap: var(--i-spacing-6);
}
.doc-layout__group { display: grid; gap: var(--i-spacing-1); }
.doc-layout__group-title {
  font-size: var(--i-font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--i-color-text-tertiary);
  margin-bottom: var(--i-spacing-2);
}
.doc-layout__side a {
  padding: var(--i-spacing-2) var(--i-spacing-3);
  border-radius: var(--i-radius-md);
  color: var(--i-color-text-secondary);
}
.doc-layout__side a:hover { background: var(--i-color-bg-subtle); }
.doc-layout__side a.router-link-active {
  background: var(--i-color-brand-subtle);
  color: var(--i-color-brand);
  font-weight: 500;
}
.doc-layout__main { min-width: 0; padding-bottom: var(--i-spacing-16); }

@media (max-width: 860px) {
  .doc-layout { grid-template-columns: 1fr; gap: var(--i-spacing-6); }
  .doc-layout__side {
    position: static;
    grid-auto-flow: column;
    overflow-x: auto;
    gap: var(--i-spacing-4);
  }
}
</style>
