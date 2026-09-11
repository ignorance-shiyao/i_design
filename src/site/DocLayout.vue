<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { docNav } from '@/data/nav'

const side = ref<HTMLElement | null>(null)
const route = useRoute()

/**
 * 侧栏是独立滚动容器，进入深层页面时当前项可能在可视区之外。
 * 路由变化后把它滚进视野，用户才知道自己在导航树的哪个位置。
 */
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
    <aside ref="side" class="doc-layout__side">
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
  align-content: start;
  /*
   * 侧栏比视口高时，仅靠 sticky 会让下半截永远够不到——粘住顶部后它不随页面滚动，
   * 只有父容器快结束时才「解锁」，表现为菜单与内容错位。因此让它自己成为滚动容器。
   */
  max-height: calc(100vh - 84px - var(--i-spacing-6));
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: var(--i-spacing-2);
}
/* 细滚动条，静止时隐藏，避免侧栏出现一条常驻竖线 */
.doc-layout__side::-webkit-scrollbar { width: 4px; }
.doc-layout__side::-webkit-scrollbar-thumb {
  border-radius: var(--i-radius-full);
  background: transparent;
}
.doc-layout__side:hover::-webkit-scrollbar-thumb { background: var(--i-color-border); }
.doc-layout__group { display: grid; gap: var(--i-spacing-1); }
.doc-layout__group-title {
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--i-color-text-tertiary);
  margin-bottom: var(--i-spacing-2);
  padding-left: var(--i-spacing-3);
}
/*
 * 侧栏排得紧一些。
 *
 * 组件有一百来个，条目按正文字号、松散排下来时，一屏只装得下十来条，
 * 找任何一个都要滚半天。文档站的侧栏是导航不是正文，
 * 密一点才扫得快——这也是所有真正被用起来的文档站的做法。
 */
.doc-layout__side a {
  position: relative;
  padding: 5px var(--i-spacing-3);
  border-radius: var(--i-radius-md);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
  transition: color var(--i-motion-fast) var(--i-motion-easing),
    background var(--i-motion-fast) var(--i-motion-easing);
}
.doc-layout__side a:hover { background: var(--i-color-bg-subtle); color: var(--i-color-text); }
/* 用 exact-active：否则父路径（如 /components 总览）在所有子页都会被标记为选中 */
.doc-layout__side a.router-link-exact-active {
  background: var(--i-color-brand-subtle);
  color: var(--i-color-brand);
  font-weight: 500;
}
/*
 * 选中态只用底色 + 文字色 + 字重，不加左侧竖条。
 * 那种「一条更粗更深的边线」的标记方式在本体系里是禁止的，见 CLAUDE.md。
 */
.doc-layout__main { min-width: 0; padding-bottom: var(--i-spacing-16); }

@media (max-width: 860px) {
  /*
   * 窄屏不再把侧栏摊平：横向排列会把几十个入口铺成好几屏，正文被挤到视野之外。
   * 导航改由页头的抽屉承担（MobileNav），这里只留正文。
   */
  .doc-layout { grid-template-columns: 1fr; gap: 0; padding-top: var(--i-spacing-6); }
  .doc-layout__side { display: none; }
  .doc-layout__main { padding-bottom: var(--i-spacing-10); }
}
</style>
