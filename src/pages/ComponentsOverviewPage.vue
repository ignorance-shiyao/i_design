<script setup lang="ts">
import { computed, ref } from "vue";
import { componentCategories } from "@/data/components";
import ITag from "@/components/ITag.vue";
import IIcon from "@/components/IIcon.vue";
import IInput from "@/components/IInput.vue";
import type { IconName } from "@i-design/common";
const query = ref("");
const selected = ref("全部");
const categoryIcons: Record<string, IconName> = {
  基础: "grid",
  导航: "arrow-right",
  数据录入: "edit",
  数据展示: "grid",
  消息反馈: "info-circle",
  图表: "palette",
  流程图: "layers",
  "AI 会话": "sparkle",
  移动端: "menu",
};
const categories = computed(() =>
  componentCategories
    .filter(
      (category) =>
        selected.value === "全部" || selected.value === category.title
    )
    .map((category) => ({
      ...category,
      items: category.items.filter((item) =>
        `${item.name} ${item.cn} ${item.desc}`
          .toLowerCase()
          .includes(query.value.trim().toLowerCase())
      ),
    }))
    .filter((category) => category.items.length)
);
const resultCount = computed(() =>
  categories.value.reduce((sum, category) => sum + category.items.length, 0)
);
function reset() {
  query.value = "";
  selected.value = "全部";
}
</script>
<template>
  <article class="component-library">
    <header class="library-header">
      <span class="library-eyebrow">THE COMPONENT LIBRARY</span>
      <h1>组件总览</h1>
      <p class="i-lead">
        从界面的细节，到复杂业务的表达。找到适合当前场景的组件，直接体验交互与多端实现。
      </p>
      <div class="library-shortcuts">
        <RouterLink to="/components/chart"
          ><IIcon name="palette" :size="15" /> 图表</RouterLink
        ><RouterLink to="/components/flow"
          ><IIcon name="layers" :size="15" /> 流程图</RouterLink
        ><RouterLink to="/components/chat"
          ><IIcon name="sparkle" :size="15" /> AI 会话</RouterLink
        ><RouterLink to="/components/icon"
          ><IIcon name="grid" :size="15" /> 图标</RouterLink
        >
      </div>
    </header>
    <div class="library-tools">
      <div class="library-search">
        <IIcon name="search" :size="18" /><IInput
          v-model="query"
          aria-label="搜索组件"
          placeholder="搜索组件名称、用途，例如：表格 / Chart"
        />
      </div>
      <div class="library-filters" role="group" aria-label="组件分类">
        <button
          v-for="category in [
            '全部',
            ...componentCategories.map((item) => item.title),
          ]"
          :key="category"
          type="button"
          :aria-pressed="selected === category"
          @click="selected = category"
        >
          {{ category }}
        </button>
      </div>
      <p class="library-result" role="status">
        {{ selected === "全部" ? "全部分类" : selected }} ·
        {{ resultCount }} 个匹配结果<span v-if="query"> · “{{ query }}”</span>
      </p>
    </div>
    <div v-if="!categories.length" class="library-empty">
      <IIcon name="search" :size="32" />
      <h2>没有找到匹配组件</h2>
      <p>试试中文名称、英文名称，或切换分类。</p>
      <button type="button" @click="reset">清除筛选</button>
    </div>
    <section v-for="category in categories" :key="category.title" class="cat">
      <div class="cat-heading">
        <span class="cat-icon"
          ><IIcon :name="categoryIcons[category.title] || 'grid'" :size="20"
        /></span>
        <div>
          <h2>{{ category.title }}</h2>
          <p>{{ category.desc }}</p>
        </div>
      </div>
      <div class="grid">
        <component
          :is="item.status === 'ready' ? 'RouterLink' : 'div'"
          v-for="item in category.items"
          :key="item.name"
          :to="item.status === 'ready' ? item.to : undefined"
          class="tile"
          :class="{ 'is-planned': item.status === 'planned' }"
          ><div class="tile__head">
            <span class="tile__cn">{{ item.cn }}</span
            ><ITag v-if="item.status === 'planned'" type="default">规划中</ITag
            ><IIcon v-else name="arrow-right" :size="15" />
          </div>
          <span class="tile__name">{{ item.name }}</span>
          <p class="tile__desc">{{ item.desc }}</p></component
        >
      </div>
    </section>
  </article>
</template>
<style scoped>
.library-header {
  padding-bottom: var(--i-spacing-6);
}
.library-eyebrow {
  display: block;
  margin-bottom: var(--i-spacing-4);
  font: var(--i-font-size-xs) var(--i-font-family-mono);
  letter-spacing: 0.12em;
  color: var(--i-color-text-secondary);
}
.library-header h1 {
  font-size: var(--i-font-size-4xl);
  letter-spacing: -0.04em;
}
.library-shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-3);
  margin-top: var(--i-spacing-6);
}
.library-shortcuts a {
  display: inline-flex;
  align-items: center;
  gap: var(--i-spacing-2);
  padding: var(--i-spacing-2) var(--i-spacing-3);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-full);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
}
.library-shortcuts a:hover {
  color: var(--i-color-brand-text);
  background: var(--i-color-brand-subtle);
}
.library-tools {
  padding: var(--i-spacing-5);
  background: var(--i-color-bg-subtle);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-xl);
}
.library-search {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-3);
  color: var(--i-color-text-secondary);
}
.library-search > :last-child {
  flex: 1;
  min-width: 0;
}
.library-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-2);
  margin-top: var(--i-spacing-4);
}
.library-filters button {
  border: 1px solid transparent;
  border-radius: var(--i-radius-md);
  padding: var(--i-spacing-1) var(--i-spacing-3);
  color: var(--i-color-text-secondary);
  background: transparent;
  font-size: var(--i-font-size-sm);
  cursor: pointer;
}
.library-filters button:hover {
  color: var(--i-color-text);
  background: var(--i-color-bg-muted);
}
.library-filters button[aria-pressed="true"] {
  border-color: var(--i-color-hairline);
  background: var(--i-color-bg-elevated);
  color: var(--i-color-brand-text);
  font-weight: var(--i-font-weight-semibold);
  box-shadow: var(--i-shadow-sm);
}
.library-result {
  margin: var(--i-spacing-4) 0 0;
  font-size: var(--i-font-size-xs);
  overflow-wrap: anywhere;
}
.cat {
  margin-top: var(--i-spacing-10);
}
.cat-heading {
  display: flex;
  align-items: start;
  gap: var(--i-spacing-3);
  margin-bottom: var(--i-spacing-5);
}
.cat-icon {
  display: grid;
  place-items: center;
  flex: none;
  background: var(--i-color-brand-subtle);
  color: var(--i-color-brand-text);
  width: var(--i-spacing-10);
  height: var(--i-spacing-10);
  border-radius: var(--i-radius-lg);
}
.cat h2 {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: var(--i-font-size-xl);
  font-weight: var(--i-font-weight-medium);
}
.cat-heading p {
  margin: var(--i-spacing-1) 0 0;
  font-size: var(--i-font-size-sm);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(215px, 100%), 1fr));
  gap: var(--i-spacing-3);
}
.tile {
  display: block;
  padding: var(--i-spacing-5);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-lg);
  color: var(--i-color-text);
  background: var(--i-color-bg-elevated);
  transition: border-color var(--i-motion-base), background var(--i-motion-base);
}
.tile:not(.is-planned):hover {
  border-color: var(--i-color-border-strong);
  background: var(--i-color-bg-subtle);
}
.tile.is-planned {
  background: var(--i-color-bg-subtle);
  border-style: dashed;
  cursor: default;
}
.tile__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-2);
}
.tile__head > svg {
  flex: none;
  color: var(--i-color-text-secondary);
}
.tile__cn {
  font-weight: var(--i-font-weight-medium);
  font-size: var(--i-font-size-md);
}
.tile__name {
  display: block;
  margin-top: var(--i-spacing-2);
  font: var(--i-font-size-xs) var(--i-font-family-mono);
  color: var(--i-color-text-secondary);
  overflow-wrap: anywhere;
}
.tile__desc {
  margin: var(--i-spacing-4) 0 0;
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
}

/*
 * 窄屏上把卡片压紧：一屏只装得下两三张卡时，卡片之间那几十像素的呼吸感
 * 换来的是要滑十几屏才翻得完一个分类——量出来整页 22000px 高。
 * 压紧之后信息一条不少，只是行距回到正文的密度。
 */
@media (max-width: 560px) {
  .tile {
    padding: var(--i-spacing-3) var(--i-spacing-4);
  }

  .tile__name {
    display: inline;
    margin-top: 0;
    margin-left: var(--i-spacing-2);
  }

  .tile__desc {
    margin-top: var(--i-spacing-1);
  }
}
.library-empty {
  padding: var(--i-spacing-16) var(--i-spacing-4);
  text-align: center;
  color: var(--i-color-text-secondary);
}
.library-empty h2 {
  border: 0;
  margin: var(--i-spacing-4) 0;
  padding: 0;
}
.library-empty button {
  background: var(--i-color-brand-solid);
  color: var(--i-color-on-brand);
  border: 0;
  padding: var(--i-spacing-2) var(--i-spacing-4);
  border-radius: var(--i-radius-md);
  cursor: pointer;
}
@media (max-width: 640px) {
  .library-header h1 {
    font-size: var(--i-font-size-3xl);
  }
  .library-tools {
    padding: var(--i-spacing-3);
  }
  .library-search > svg {
    display: none;
  }
  .library-filters {
    gap: var(--i-spacing-1);
  }
  .library-filters button {
    padding: var(--i-spacing-2);
  }
}
</style>
