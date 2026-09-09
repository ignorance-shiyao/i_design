<script setup lang="ts">
import ITag from '@/components/ITag.vue'
import { componentCatalog, type CatalogStatus } from '@/data/componentCatalog'

const label: Record<CatalogStatus, string> = {
  ready: '可用',
  planned: '规划中',
  excluded: '不做'
}
const tone: Record<CatalogStatus, 'success' | 'warning' | 'default'> = {
  ready: 'success',
  planned: 'warning',
  excluded: 'default'
}
</script>

<template>
  <article>
    <h1>组件全景</h1>
    <p class="i-lead">
      按使用场景组织的完整清单。除了「现在有什么」，也写清「还缺什么」与「有意不做什么」——
      选型时真正卡住人的，往往不是已有能力的多寡，而是不知道缺的那块是暂时没有，还是永远不会有。
    </p>

    <section v-for="group in componentCatalog" :key="group.title" class="cat-group">
      <h2>{{ group.title }}</h2>
      <p class="cat-intent">{{ group.intent }}</p>

      <ul class="cat-list">
        <li v-for="item in group.items" :key="item.label" class="cat-item" :class="`is-${item.status}`">
          <div class="cat-item__head">
            <span class="cat-item__name">{{ item.label }}</span>
            <ITag :type="tone[item.status]">{{ label[item.status] }}</ITag>
          </div>
          <code v-if="item.api" class="cat-item__api">{{ item.api }}</code>
          <p v-if="item.note" class="cat-item__note">{{ item.note }}</p>
        </li>
      </ul>
    </section>
  </article>
</template>

<style scoped>
.cat-group { margin-bottom: var(--i-spacing-10); }
.cat-intent {
  margin-top: calc(var(--i-spacing-2) * -1);
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-sm);
}
.cat-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--i-spacing-3);
  margin: var(--i-spacing-4) 0 0;
  padding: 0;
  list-style: none;
}
.cat-item {
  padding: var(--i-spacing-4);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-lg);
  background: var(--i-color-bg-elevated);
}
/* 规划中与不做的项降一档存在感：它们是背景信息，不该和可用能力抢注意力 */
.cat-item.is-planned { background: var(--i-color-bg-subtle); }
.cat-item.is-excluded { background: none; border-style: dashed; }
.cat-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-2);
}
.cat-item__name { font-size: var(--i-font-size-md); color: var(--i-color-text); font-weight: 500; }
.cat-item__api {
  display: inline-block;
  margin-top: var(--i-spacing-2);
  font-size: var(--i-font-size-xs);
}
.cat-item__note {
  margin: var(--i-spacing-2) 0 0;
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-tertiary);
  line-height: 1.7;
}
</style>
