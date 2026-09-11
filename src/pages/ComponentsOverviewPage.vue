<script setup lang="ts">
import { componentCategories } from "@/data/components";
import ITag from "@/components/ITag.vue";
</script>

<template>
  <article>
    <h1>组件总览</h1>
    <p class="i-lead">
      按业务场景浏览组件，查看交互示例、接口说明与跨端代码。标记为「规划中」的组件尚未开放使用。
    </p>

    <section
      v-for="category in componentCategories"
      :key="category.title"
      class="cat"
    >
      <h2>{{ category.title }}</h2>
      <p>{{ category.desc }}</p>
      <div class="grid">
        <component
          :is="item.status === 'ready' ? 'RouterLink' : 'div'"
          v-for="item in category.items"
          :key="item.name"
          :to="item.status === 'ready' ? item.to : undefined"
          class="tile"
          :class="{ 'is-planned': item.status === 'planned' }"
        >
          <div class="tile__head">
            <span class="tile__name">{{ item.name }}</span>
            <ITag v-if="item.status === 'planned'" type="default">规划中</ITag>
          </div>
          <span class="tile__cn">{{ item.cn }}</span>
          <p class="tile__desc">{{ item.desc }}</p>
        </component>
      </div>
    </section>
  </article>
</template>

<style scoped>
.cat h2 {
  margin-top: var(--i-spacing-10);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--i-spacing-4);
  margin-top: var(--i-spacing-5);
}
.tile {
  display: block;
  padding: var(--i-spacing-4);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-md);
  color: var(--i-color-text);
  background: var(--i-color-bg-elevated);
  box-shadow: none;
  transition: border-color var(--i-motion-base) var(--i-motion-easing),
    box-shadow var(--i-motion-base) var(--i-motion-easing),
    transform var(--i-motion-base) var(--i-motion-easing);
}
.tile:not(.is-planned):hover {
  border-color: color-mix(in srgb, var(--i-color-brand) 40%, transparent);
  box-shadow: var(--i-shadow-md);
  transform: translateY(-2px);
}
.tile.is-planned {
  background: var(--i-color-bg-subtle);
  box-shadow: none;
  border-style: dashed;
  color: var(--i-color-text-tertiary);
  cursor: default;
}
.tile__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-2);
}
.tile__name {
  font-weight: 600;
}
.tile__cn {
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-tertiary);
}
.tile__desc {
  margin: var(--i-spacing-2) 0 0;
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
}
.tile.is-planned .tile__desc {
  color: var(--i-color-text-tertiary);
}
</style>
