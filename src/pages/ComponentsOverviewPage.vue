<script setup lang="ts">
import { computed, ref } from 'vue'
import { componentCategories } from '@/data/components'
import IInput from '@/components/IInput.vue'
import ITag from '@/components/ITag.vue'
import IIcon from '@/components/IIcon.vue'

const keyword = ref('')
const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase())

const readyCount = computed(() =>
  componentCategories.reduce(
    (total, category) => total + category.items.filter((item) => item.status === 'ready').length,
    0
  )
)

const totalCount = computed(() =>
  componentCategories.reduce((total, category) => total + category.items.length, 0)
)

const filteredCategories = computed(() => {
  if (!normalizedKeyword.value) return componentCategories

  return componentCategories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => {
        const text = `${item.name} ${item.cn} ${item.desc} ${category.title}`.toLowerCase()
        return text.includes(normalizedKeyword.value)
      })
    }))
    .filter((category) => category.items.length > 0)
})
</script>

<template>
  <article class="overview">
    <header class="overview__hero">
      <div class="overview__eyebrow">
        <span>COMPONENT LIBRARY</span>
        <span>v0.1.0</span>
      </div>
      <div class="overview__headline">
        <div>
          <h1>组件总览</h1>
          <p class="i-lead">
            按真实业务任务组织组件。先找到用户要完成的动作，再进入对应组件查看 API、状态与示例。
          </p>
        </div>
        <div class="overview__metrics" aria-label="组件库统计">
          <div>
            <strong>{{ readyCount }}</strong>
            <span>已实现</span>
          </div>
          <div>
            <strong>{{ totalCount }}</strong>
            <span>组件总数</span>
          </div>
          <div>
            <strong>{{ componentCategories.length }}</strong>
            <span>场景分类</span>
          </div>
        </div>
      </div>
    </header>

    <div class="overview__toolbar">
      <div class="overview__search">
        <IIcon name="search" :size="16" />
        <IInput v-model="keyword" placeholder="搜索组件名称、中文名或使用场景" />
      </div>
      <span class="overview__result">
        {{ normalizedKeyword ? `找到 ${filteredCategories.reduce((sum, category) => sum + category.items.length, 0)} 个组件` : '浏览全部组件' }}
      </span>
    </div>

    <div v-if="filteredCategories.length" class="overview__categories">
      <section v-for="(category, categoryIndex) in filteredCategories" :key="category.title" class="category">
        <div class="category__intro">
          <span class="category__index">{{ String(categoryIndex + 1).padStart(2, '0') }}</span>
          <div>
            <h2>{{ category.title }}</h2>
            <p>{{ category.desc }}</p>
          </div>
          <span class="category__count">{{ category.items.length }}</span>
        </div>

        <div class="component-grid">
          <component
            :is="item.status === 'ready' ? 'RouterLink' : 'div'"
            v-for="item in category.items"
            :key="item.name"
            :to="item.status === 'ready' ? item.to : undefined"
            class="component-card"
            :class="{ 'is-planned': item.status === 'planned' }"
          >
            <div class="component-card__top">
              <div class="component-card__name">
                <strong>{{ item.name }}</strong>
                <span>{{ item.cn }}</span>
              </div>
              <ITag v-if="item.status === 'planned'" type="default">规划中</ITag>
              <span v-else class="component-card__arrow" aria-hidden="true">
                <IIcon name="arrow-right" :size="14" />
              </span>
            </div>
            <p>{{ item.desc }}</p>
          </component>
        </div>
      </section>
    </div>

    <div v-else class="overview__empty">
      <span class="overview__empty-mark">0</span>
      <h2>没有匹配的组件</h2>
      <p>换一个名称、中文词或业务场景继续搜索。</p>
      <button type="button" @click="keyword = ''">清除搜索</button>
    </div>
  </article>
</template>

<style scoped>
.overview { padding-top: var(--i-spacing-2); }

.overview__hero {
  padding: var(--i-spacing-3) 0 var(--i-spacing-8);
  border-bottom: 1px solid var(--i-color-hairline);
}

.overview__eyebrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-4);
  margin-bottom: var(--i-spacing-4);
  color: var(--i-color-text-tertiary);
  font: 500 10px/1 var(--i-font-family-mono);
  letter-spacing: .12em;
}

.overview__eyebrow span:first-child { color: var(--i-color-brand); }

.overview__headline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--i-spacing-10);
  align-items: end;
}

.overview__headline h1 {
  margin: 0;
  font-size: clamp(38px, 5vw, 58px);
  line-height: 1.06;
  letter-spacing: -.05em;
}

.overview__headline .i-lead {
  margin: var(--i-spacing-4) 0 0;
  max-width: 680px;
  line-height: 1.75;
}

.overview__metrics {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--i-color-hairline);
  border-radius: 14px;
  background: var(--i-color-bg-elevated);
  overflow: hidden;
}

.overview__metrics > div {
  display: grid;
  gap: 3px;
  min-width: 86px;
  padding: 14px 16px;
}

.overview__metrics > div + div { border-left: 1px solid var(--i-color-hairline); }
.overview__metrics strong { font: 600 var(--i-font-size-lg)/1.2 var(--i-font-family-mono); }
.overview__metrics span { color: var(--i-color-text-tertiary); font-size: 10px; }

.overview__toolbar {
  position: sticky;
  top: 64px;
  z-index: calc(var(--i-z-sticky) - 1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-5);
  margin: 0 calc(var(--i-spacing-3) * -1);
  padding: var(--i-spacing-4) var(--i-spacing-3);
  background: color-mix(in srgb, var(--i-color-bg) 88%, transparent);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--i-color-hairline);
}

.overview__search {
  position: relative;
  width: min(470px, 100%);
}

.overview__search > :deep(svg) {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  color: var(--i-color-text-tertiary);
  pointer-events: none;
}

.overview__search :deep(input) { padding-left: 36px; }
.overview__result { flex: none; color: var(--i-color-text-tertiary); font-size: var(--i-font-size-xs); }

.overview__categories { display: grid; }

.category {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: var(--i-spacing-7);
  padding: var(--i-spacing-9) 0;
  border-bottom: 1px solid var(--i-color-hairline);
}

.category:last-child { border-bottom: 0; }

.category__intro {
  position: sticky;
  top: 142px;
  align-self: start;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: start;
}

.category__index,
.category__count {
  padding-top: 3px;
  color: var(--i-color-text-tertiary);
  font: 500 9px/1 var(--i-font-family-mono);
}

.category__count {
  display: grid;
  place-items: center;
  width: 24px;
  height: 20px;
  padding: 0;
  border-radius: 99px;
  background: var(--i-color-bg-subtle);
}

.category__intro h2 {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: var(--i-font-size-md);
  letter-spacing: -.01em;
}

.category__intro p {
  margin: 7px 0 0;
  color: var(--i-color-text-tertiary);
  font-size: 11px;
  line-height: 1.6;
}

.component-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.component-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 126px;
  padding: 16px;
  border: 1px solid var(--i-color-hairline);
  border-radius: 14px;
  background: var(--i-color-bg-elevated);
  color: var(--i-color-text);
  transition:
    transform var(--i-motion-base) var(--i-motion-easing),
    border-color var(--i-motion-base) var(--i-motion-easing),
    box-shadow var(--i-motion-base) var(--i-motion-easing),
    background var(--i-motion-base) var(--i-motion-easing);
}

.component-card:not(.is-planned):hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--i-color-brand) 34%, var(--i-color-border));
  box-shadow: var(--i-shadow-md);
}

.component-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--i-spacing-3);
}

.component-card__name { display: grid; gap: 4px; }
.component-card__name strong { font-size: var(--i-font-size-sm); letter-spacing: -.01em; }
.component-card__name span { color: var(--i-color-text-tertiary); font-size: 10px; }

.component-card__arrow {
  display: grid;
  place-items: center;
  width: 27px;
  height: 27px;
  border-radius: 8px;
  background: var(--i-color-bg-subtle);
  color: var(--i-color-text-tertiary);
  transition: color var(--i-motion-fast) var(--i-motion-easing), background var(--i-motion-fast) var(--i-motion-easing), transform var(--i-motion-fast) var(--i-motion-easing);
}

.component-card:hover .component-card__arrow {
  color: var(--i-color-brand);
  background: var(--i-color-brand-subtle);
  transform: translateX(2px);
}

.component-card > p {
  margin: auto 0 0;
  padding-top: var(--i-spacing-5);
  color: var(--i-color-text-secondary);
  font-size: 11px;
  line-height: 1.55;
}

.component-card.is-planned {
  border-style: dashed;
  background: var(--i-color-bg-subtle);
  color: var(--i-color-text-tertiary);
}
.component-card.is-planned > p { color: var(--i-color-text-tertiary); }

.overview__empty {
  display: grid;
  place-items: center;
  min-height: 360px;
  padding: var(--i-spacing-10);
  text-align: center;
}
.overview__empty-mark {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border: 1px solid var(--i-color-hairline);
  border-radius: 18px;
  color: var(--i-color-text-tertiary);
  font: 600 var(--i-font-size-xl)/1 var(--i-font-family-mono);
}
.overview__empty h2 { margin: var(--i-spacing-4) 0 0; padding: 0; border: 0; }
.overview__empty p { margin: var(--i-spacing-2) 0 0; color: var(--i-color-text-tertiary); }
.overview__empty button {
  margin-top: var(--i-spacing-5);
  border: 0;
  background: transparent;
  color: var(--i-color-brand);
  cursor: pointer;
}

@media (max-width: 1120px) {
  .component-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 900px) {
  .overview__headline { grid-template-columns: 1fr; }
  .overview__metrics { justify-self: start; }
  .overview__toolbar { top: 64px; }
  .category { grid-template-columns: 1fr; gap: var(--i-spacing-4); }
  .category__intro { position: static; grid-template-columns: auto 1fr auto; }
}

@media (max-width: 620px) {
  .overview__metrics { width: 100%; }
  .overview__metrics > div { min-width: 0; flex: 1; padding: 12px; }
  .overview__toolbar { align-items: stretch; flex-direction: column; gap: var(--i-spacing-2); }
  .overview__search { width: 100%; }
  .component-grid { grid-template-columns: 1fr; }
  .component-card { min-height: 112px; }
}
</style>
