<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { docNav } from "@/data/nav";
import IInput from "@/components/IInput.vue";
const search = ref("");
const filteredNav = computed(() =>
  docNav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.label.toLowerCase().includes(search.value.trim().toLowerCase())
      ),
    }))
    .filter((group) => group.items.length)
);

const side = ref<HTMLElement | null>(null);
const route = useRoute();

/**
 * 侧栏是独立滚动容器，进入深层页面时当前项可能在可视区之外。
 * 路由变化后把它滚进视野，用户才知道自己在导航树的哪个位置。
 */
async function revealActive() {
  await nextTick();
  const active = side.value?.querySelector("a.router-link-exact-active");
  active?.scrollIntoView({ block: "nearest" });
}

/*
 * 窄屏上给表格套一层横向滚动容器。
 *
 * API 表有四列，手机宽度装不下时浏览器会把每个单元格压到一两个字一行，
 * 「加载中，同时禁用点击」变成竖着排的七行——读不了，也看不出这是一张表。
 * 正确做法是让表格保持原宽、由容器横向滚动。
 *
 * 文档页里的表格是各页面直接写的 <table>，没法逐个包起来，因此在这里统一处理；
 * 路由切换后要重来一次，新页面的表格还没被包过。
 */
async function wrapTables() {
  await nextTick();
  for (const table of document.querySelectorAll<HTMLElement>(".i-doc .i-table")) {
    if (table.parentElement?.classList.contains("doc-layout__scroller")) continue;
    const scroller = document.createElement("div");
    scroller.className = "doc-layout__scroller";
    table.replaceWith(scroller);
    scroller.append(table);
  }
}

onMounted(() => {
  revealActive();
  wrapTables();
});
watch(() => route.path, () => {
  revealActive();
  wrapTables();
});
</script>

<template>
  <div class="i-container doc-layout">
    <aside ref="side" class="doc-layout__side">
      <IInput v-model="search" placeholder="搜索文档" aria-label="搜索文档" />
      <p v-if="!filteredNav.length" class="doc-layout__empty">没有匹配的文档</p>
      <div
        v-for="group in filteredNav"
        :key="group.title"
        class="doc-layout__group"
      >
        <p class="doc-layout__group-title">{{ group.title }}</p>
        <RouterLink v-for="item in group.items" :key="item.to" :to="item.to">{{
          item.label
        }}</RouterLink>
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
  max-width: 1440px;
  grid-template-columns: 224px minmax(0, 1fr);
  gap: 48px;
  padding-top: 32px;
  align-items: start;
}
.doc-layout__side {
  position: sticky;
  top: 88px;
  display: grid;
  gap: var(--i-spacing-6);
  align-content: start;
  /*
   * 侧栏比视口高时，仅靠 sticky 会让下半截永远够不到——粘住顶部后它不随页面滚动，
   * 只有父容器快结束时才「解锁」，表现为菜单与内容错位。因此让它自己成为滚动容器。
   */
  max-height: calc(100vh - 88px - var(--i-spacing-6));
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 20px;
  border-right: 1px solid var(--i-color-hairline);
}
/* 细滚动条，静止时隐藏，避免侧栏出现一条常驻竖线 */
.doc-layout__side::-webkit-scrollbar {
  width: 4px;
}
.doc-layout__side::-webkit-scrollbar-thumb {
  border-radius: var(--i-radius-full);
  background: transparent;
}
.doc-layout__side:hover::-webkit-scrollbar-thumb {
  background: var(--i-color-border);
}
.doc-layout__group {
  display: grid;
  gap: var(--i-spacing-1);
}
.doc-layout__group-title {
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0;
  color: var(--i-color-text-secondary);
  margin-bottom: var(--i-spacing-2);
  padding-left: var(--i-spacing-3);
}
.doc-layout__side a {
  position: relative;
  padding: var(--i-spacing-2) var(--i-spacing-3);
  border-radius: var(--i-radius-md);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-md);
  transition: color var(--i-motion-fast) var(--i-motion-easing),
    background var(--i-motion-fast) var(--i-motion-easing);
}
.doc-layout__side a:hover {
  background: var(--i-color-bg-subtle);
  color: var(--i-color-text);
}
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
.doc-layout__empty {
  padding: var(--i-spacing-3);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
}
.doc-layout__main {
  min-width: 0;
  max-width: 1000px;
  padding-bottom: var(--i-spacing-16);
}

@media (max-width: 860px) {
  /*
   * 窄屏不再把侧栏摊平：横向排列会把几十个入口铺成好几屏，正文被挤到视野之外。
   * 导航改由页头的抽屉承担（MobileNav），这里只留正文。
   */
  .doc-layout {
    grid-template-columns: 1fr;
    gap: 0;
    padding-top: var(--i-spacing-6);
  }
  .doc-layout__side {
    display: none;
  }
  .doc-layout__main {
    padding-bottom: var(--i-spacing-10);
  }
}
</style>
