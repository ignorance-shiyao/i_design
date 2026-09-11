<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { docNav } from '@/data/nav'

const side = ref<HTMLElement | null>(null)
const route = useRoute()

async function revealActive() {
  await nextTick()
  const active = side.value?.querySelector('a.router-link-exact-active')
  active?.scrollIntoView({ block: 'nearest' })
}

onMounted(revealActive)
watch(() => route.path, revealActive)
</script>

<template>
  <div class="i-container doc-layout">
    <aside ref="side" class="doc-layout__side" aria-label="文档导航">
      <div class="doc-layout__side-head">
        <span>DOCUMENTATION</span>
        <i />
      </div>

      <div v-for="group in docNav" :key="group.title" class="doc-layout__group">
        <p class="doc-layout__group-title">{{ group.title }}</p>
        <RouterLink v-for="item in group.items" :key="item.to" :to="item.to">
          <span>{{ item.label }}</span>
          <i aria-hidden="true" />
        </RouterLink>
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
  grid-template-columns: 214px minmax(0, 1fr);
  gap: clamp(40px, 5vw, 72px);
  align-items: start;
  padding-top: var(--i-spacing-8);
}

.doc-layout__side {
  position: sticky;
  top: 86px;
  display: grid;
  gap: var(--i-spacing-7);
  align-content: start;
  max-height: calc(100vh - 104px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: var(--i-spacing-3);
}

.doc-layout__side-head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 22px;
  padding: 0 var(--i-spacing-2);
  color: var(--i-color-text-tertiary);
  font: 500 9px/1 var(--i-font-family-mono);
  letter-spacing: .13em;
}

.doc-layout__side-head i {
  flex: 1;
  height: 1px;
  background: var(--i-color-hairline);
}

.doc-layout__side::-webkit-scrollbar { width: 4px; }
.doc-layout__side::-webkit-scrollbar-thumb { border-radius: var(--i-radius-full); background: transparent; }
.doc-layout__side:hover::-webkit-scrollbar-thumb { background: var(--i-color-border); }

.doc-layout__group { display: grid; gap: 2px; }

.doc-layout__group-title {
  margin: 0 0 7px;
  padding: 0 var(--i-spacing-2);
  color: var(--i-color-text-tertiary);
  font: 600 10px/1 var(--i-font-family-mono);
  letter-spacing: .08em;
  text-transform: uppercase;
}

.doc-layout__side a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-3);
  min-height: 34px;
  padding: 7px var(--i-spacing-2);
  border-radius: 8px;
  color: var(--i-color-text-secondary);
  font-size: 12px;
  transition:
    color var(--i-motion-fast) var(--i-motion-easing),
    background var(--i-motion-fast) var(--i-motion-easing),
    transform var(--i-motion-fast) var(--i-motion-easing);
}

.doc-layout__side a > i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: transparent;
  transition: background var(--i-motion-fast) var(--i-motion-easing), box-shadow var(--i-motion-fast) var(--i-motion-easing);
}

.doc-layout__side a:hover {
  color: var(--i-color-text);
  background: var(--i-color-bg-subtle);
  transform: translateX(1px);
}

.doc-layout__side a.router-link-exact-active {
  background: var(--i-color-brand-subtle);
  color: var(--i-color-brand);
  font-weight: 550;
}

.doc-layout__side a.router-link-exact-active > i {
  background: var(--i-color-brand);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--i-color-brand) 12%, transparent);
}

.doc-layout__main {
  min-width: 0;
  width: 100%;
  max-width: 960px;
  padding-bottom: var(--i-spacing-16);
}

@media (max-width: 860px) {
  .doc-layout {
    grid-template-columns: 1fr;
    gap: 0;
    padding-top: var(--i-spacing-6);
  }
  .doc-layout__side { display: none; }
  .doc-layout__main { max-width: none; padding-bottom: var(--i-spacing-10); }
}
</style>
