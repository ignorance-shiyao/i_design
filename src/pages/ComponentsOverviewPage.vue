<script setup lang="ts">
import { computed, ref } from 'vue'
import { componentCategories } from '@/data/components'
import IInput from '@/components/IInput.vue'
import IIcon from '@/components/IIcon.vue'

const keyword = ref('')
const query = computed(() => keyword.value.trim().toLowerCase())

const readyCount = computed(() => componentCategories.reduce((sum, category) => sum + category.items.filter((item) => item.status === 'ready').length, 0))
const totalCount = computed(() => componentCategories.reduce((sum, category) => sum + category.items.length, 0))

const filteredCategories = computed(() => {
  if (!query.value) return componentCategories
  return componentCategories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => `${item.name} ${item.cn} ${item.desc} ${category.title}`.toLowerCase().includes(query.value))
    }))
    .filter((category) => category.items.length)
})

const resultCount = computed(() => filteredCategories.value.reduce((sum, category) => sum + category.items.length, 0))
</script>

<template>
  <article class="overview">
    <header class="hero">
      <div class="hero__kicker"><span>COMPONENTS</span><span>v0.1.0</span></div>
      <h1>组件</h1>
      <p>按真实任务组织，而不是按控件实现分类。搜索名称、中文名或使用场景，直接进入对应文档。</p>
      <div class="hero__meta"><span><strong>{{ readyCount }}</strong> ready</span><span><strong>{{ totalCount }}</strong> total</span><span><strong>{{ componentCategories.length }}</strong> categories</span></div>
    </header>

    <div class="searchbar">
      <div class="searchbar__field"><IIcon name="search" :size="15" /><IInput v-model="keyword" placeholder="搜索 Button、表格、流程、AI 会话…" /></div>
      <span>{{ query ? `${resultCount} 个结果` : '全部组件' }}</span>
    </div>

    <div v-if="filteredCategories.length" class="catalog">
      <section v-for="(category, index) in filteredCategories" :key="category.title" class="group">
        <div class="group__intro">
          <span class="group__index">{{ String(index + 1).padStart(2, '0') }}</span>
          <h2>{{ category.title }}</h2>
          <p>{{ category.desc }}</p>
          <span class="group__count">{{ category.items.length }}</span>
        </div>

        <div class="group__items">
          <component
            :is="item.status === 'ready' ? 'RouterLink' : 'div'"
            v-for="item in category.items"
            :key="item.name"
            :to="item.status === 'ready' ? item.to : undefined"
            class="component-row"
            :class="{ 'is-planned': item.status === 'planned' }"
          >
            <div class="component-row__title"><strong>{{ item.name }}</strong><span>{{ item.cn }}</span></div>
            <p>{{ item.desc }}</p>
            <span v-if="item.status === 'planned'" class="component-row__status">PLANNED</span>
            <IIcon v-else name="arrow-right" :size="14" />
          </component>
        </div>
      </section>
    </div>

    <div v-else class="empty">
      <span>NO RESULT</span>
      <h2>没有匹配的组件</h2>
      <p>换一个关键词，或者清除搜索查看全部组件。</p>
      <button type="button" @click="keyword = ''">清除搜索</button>
    </div>
  </article>
</template>

<style scoped>
.overview { padding-top:18px; }
.hero { padding:34px 0 46px; border-bottom:1px solid var(--i-color-hairline); }
.hero__kicker { display:flex; justify-content:space-between; color:var(--i-color-text-tertiary); font:500 10px/1 var(--i-font-family-mono); letter-spacing:.12em; }
.hero__kicker span:first-child { color:var(--i-color-brand); }
.hero h1 { margin:32px 0 0; font-size:clamp(54px,7vw,88px); line-height:.95; letter-spacing:-.065em; font-weight:620; }
.hero > p { max-width:660px; margin:22px 0 0; color:var(--i-color-text-secondary); font-size:16px; line-height:1.75; }
.hero__meta { display:flex; gap:24px; margin-top:30px; color:var(--i-color-text-tertiary); font:500 10px/1 var(--i-font-family-mono); }.hero__meta strong { margin-right:5px; color:var(--i-color-text); font-size:12px; }
.searchbar { position:sticky; top:58px; z-index:calc(var(--i-z-sticky) - 1); display:flex; align-items:center; justify-content:space-between; gap:24px; padding:14px 0; border-bottom:1px solid var(--i-color-hairline); background:color-mix(in srgb,var(--i-color-bg) 94%,transparent); backdrop-filter:blur(12px); }
.searchbar__field { position:relative; width:min(520px,100%); }.searchbar__field > :deep(svg) { position:absolute; z-index:1; left:11px; top:50%; transform:translateY(-50%); color:var(--i-color-text-tertiary); pointer-events:none; }.searchbar__field :deep(input) { padding-left:34px; }.searchbar > span { flex:none; color:var(--i-color-text-tertiary); font:500 10px/1 var(--i-font-family-mono); }
.catalog { border-top:1px solid var(--i-color-border); margin-top:38px; }
.group { display:grid; grid-template-columns:190px minmax(0,1fr); gap:42px; padding:38px 0 42px; border-bottom:1px solid var(--i-color-border); }
.group__intro { position:sticky; top:132px; align-self:start; display:grid; grid-template-columns:28px 1fr auto; column-gap:10px; }.group__index { padding-top:4px; color:var(--i-color-text-tertiary); font:500 9px/1 var(--i-font-family-mono); }.group__intro h2 { margin:0; padding:0; border:0; font-size:15px; letter-spacing:-.01em; }.group__intro p { grid-column:2 / -1; margin:8px 0 0; color:var(--i-color-text-tertiary); font-size:10px; line-height:1.55; }.group__count { color:var(--i-color-text-tertiary); font:500 9px/1 var(--i-font-family-mono); }
.group__items { border-top:1px solid var(--i-color-hairline); }
.component-row { display:grid; grid-template-columns:180px minmax(0,1fr) auto; gap:24px; align-items:center; min-height:68px; border-bottom:1px solid var(--i-color-hairline); color:var(--i-color-text); transition:padding var(--i-motion-fast) var(--i-motion-easing),background var(--i-motion-fast) var(--i-motion-easing); }.component-row:not(.is-planned):hover { padding:0 10px; background:var(--i-color-bg-subtle); }.component-row__title { display:flex; align-items:baseline; gap:8px; }.component-row__title strong { font-size:12px; }.component-row__title span { color:var(--i-color-text-tertiary); font-size:10px; }.component-row p { margin:0; color:var(--i-color-text-secondary); font-size:10px; }.component-row > :deep(svg) { color:var(--i-color-text-tertiary); }.component-row:hover > :deep(svg) { color:var(--i-color-brand); }.component-row.is-planned { color:var(--i-color-text-tertiary); }.component-row.is-planned p { color:var(--i-color-text-tertiary); }.component-row__status { font:500 8px/1 var(--i-font-family-mono); letter-spacing:.1em; color:var(--i-color-text-tertiary); }
.empty { display:grid; place-items:center; min-height:420px; text-align:center; }.empty > span { color:var(--i-color-text-tertiary); font:500 9px/1 var(--i-font-family-mono); letter-spacing:.12em; }.empty h2 { margin:16px 0 0; padding:0; border:0; }.empty p { margin:8px 0 0; color:var(--i-color-text-tertiary); }.empty button { margin-top:18px; border:0; background:transparent; color:var(--i-color-brand); cursor:pointer; }
@media (max-width:900px) { .group { grid-template-columns:1fr; gap:18px; }.group__intro { position:static; }.component-row { grid-template-columns:150px 1fr auto; } }
@media (max-width:620px) { .hero { padding-top:20px; }.hero h1 { font-size:58px; }.searchbar { align-items:stretch; flex-direction:column; gap:8px; }.searchbar__field { width:100%; }.component-row { grid-template-columns:1fr auto; gap:6px 14px; padding:12px 0; }.component-row p { grid-column:1; }.component-row__status,.component-row > :deep(svg) { grid-row:1 / 3; grid-column:2; }.component-row:not(.is-planned):hover { padding:12px 8px; }.hero__meta { gap:14px; flex-wrap:wrap; } }
</style>
