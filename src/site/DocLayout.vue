<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { docNav } from "@/data/nav";
import IInput from "@/components/IInput.vue";
import DocPager from "./DocPager.vue";
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
      <!--
        搜索框单独包一层：它要粘在侧栏顶部，而分组标题粘在它下面，
        两者得是两个独立的粘性元素，中间不能再隔一层普通容器。
      -->
      <div class="doc-layout__search">
        <IInput v-model="search" placeholder="搜索文档" aria-label="搜索文档" />
      </div>
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
      <!--
        翻页放在这里而不是每个页面各写一遍：一百多个文档页，漏掉一个不会报错，
        只会让那一页成为读者的死胡同。
      -->
      <DocPager />
    </main>
  </div>
</template>

<style scoped>
.doc-layout {
  display: grid;
  max-width: 1440px;
  grid-template-columns: 224px minmax(0, 1fr);
  gap: 48px;
  /*
   * 顶部留白给正文那一列，不给侧栏。
   *
   * 原先写在容器上，两列一起下移，于是侧栏顶上空出一条白带——它不承载任何东西，
   * 看起来却像菜单没对齐。侧栏的第一行应当就是搜索框，紧贴页头。
   */
  align-items: start;
}
.doc-layout__side {
  position: sticky;
  /*
   * 紧贴页头下沿，不再空出一截。
   *
   * 原先是 88px：页头 64、再加 24 的空白。那段空白在侧栏顶上是白的，
   * 看起来像菜单「没对齐」，而它并不承载任何东西——正文那一列的留白
   * 由 .doc-layout 的 padding-top 给，侧栏不需要再来一份。
   */
  top: calc(var(--doc-header-h) + 1px);
  /* 搜索框那一块的高度，分组标题要粘在它下面。与输入框用同一组令牌算出来 */
  --doc-search-h: calc(var(--i-control-height-md) + var(--i-spacing-3) * 2);
  display: grid;
  gap: var(--i-spacing-4);
  align-content: start;
  /*
   * 侧栏比视口高时，仅靠 sticky 会让下半截永远够不到——粘住顶部后它不随页面滚动，
   * 只有父容器快结束时才「解锁」，表现为菜单与内容错位。因此让它自己成为滚动容器。
   */
  max-height: calc(100vh - var(--doc-header-h) - var(--i-spacing-4));
  /* 顶部那一档留白由搜索块自己的 padding 给，容器不再重复一份 */
  overflow-y: auto;
  overscroll-behavior: contain;
  /*
   * 下边缘渐隐。
   *
   * 侧栏内容 3177px、可视只有 788px，下边缘永远有一行被切成两半——
   * 一条被拦腰截断的文字读起来像「这一项就叫 ConfigProvide」，
   * 而不是「下面还有」。渐隐把截断变成一个明确的信号：这里还没到头。
   * mask 只影响绘制，不改布局，滚动与点击都不受影响。
   *
   * 上边缘原本也渐隐，现在不了：分组标题粘在顶部，渐隐会把它一起淡掉，
   * 看起来像这行字正在消失——而它恰恰是要一直看得见的那一行。
   */
  mask-image: linear-gradient(
    to bottom,
    #000 calc(100% - var(--i-spacing-5)),
    transparent 100%
  );
  padding-right: 20px;
  border-right: 1px solid var(--i-color-hairline);
}

/*
 * 搜索框粘在侧栏最上面。
 *
 * 侧栏有三千多像素的内容，滚到中段想换个关键词就得先滚回顶部——
 * 而「搜一下」恰恰是内容多了之后最常用的那个入口。
 * 底色不能省：下面的链接要从它身后滚过去。
 */
.doc-layout__search {
  position: sticky;
  top: 0;
  /* 比分组标题高一层：两者都粘住时，搜索框该压在上面 */
  z-index: 2;
  padding: var(--i-spacing-3) 0;
  background: var(--i-color-bg);
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
/*
 * 分组标题粘在侧栏顶部。
 *
 * 侧栏内容三千多像素、可视只有八百，滚到中段时屏幕上只剩一列组件名，
 * 「我现在在哪一组」得靠往回滚才能知道。粘住之后，当前分组名始终在最上面一行。
 *
 * 需要一块不透明的底：下面的链接要从它身后滚过去，没有底色就会两行字叠在一起。
 * 内边距与链接取同一档，两者左边缘才对得齐。
 */
.doc-layout__group-title {
  position: sticky;
  /* 粘在搜索框下沿，而不是侧栏顶——否则两者会叠在一起 */
  top: var(--doc-search-h);
  z-index: 1;
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0;
  color: var(--i-color-text-secondary);
  margin: 0 0 var(--i-spacing-2);
  padding: var(--i-spacing-2) var(--i-spacing-3);
  background: var(--i-color-bg);
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
  /* 淡底上的字用 brand-text 那一档：填充色写在同色淡底上只有 3.37:1 */
  color: var(--i-color-brand-text);
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
  padding-top: 32px;
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
  }
  .doc-layout__main { padding-top: var(--i-spacing-6); }
  .doc-layout__side {
    display: none;
  }
  .doc-layout__main {
    padding-bottom: var(--i-spacing-10);
  }
}
</style>
