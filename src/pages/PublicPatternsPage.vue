<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IInput from '@/components/IInput.vue'
import IIcon from '@/components/IIcon.vue'
import ITag from '@/components/ITag.vue'
import ICollapse from '@/components/ICollapse.vue'
import {
  PUBLIC_FAQ, PUBLIC_FEATURES, PUBLIC_PLANS, PUBLIC_SEARCH_LIMIT,
  PUBLIC_UPDATES, PUBLIC_VIEWS, publicLocation, publicPrice, publicRoute, searchPublicHelp
} from '@i-design/common/logic/public-pattern'

const route = useRoute(), router = useRouter()
const state = computed(() => publicRoute(route.query))
const search = ref(state.value.search)
const results = computed(() => searchPublicHelp(state.value.search))
const expanded = ref<string[]>([])
const heading = ref<HTMLElement | null>(null)
function submitSearch() { router.push(publicLocation('help', { search: search.value })) }
// 地址是已提交状态的唯一来源；返回、前进与刷新均恢复同一搜索。
watch(() => route.fullPath, async () => {
  search.value = state.value.search
  expanded.value = []
  await nextTick()
  heading.value?.focus({ preventScroll: true })
})
</script>

<template>
  <article class="public-page">
    <h1>公共网页</h1>
    <p class="i-lead">从介绍能力到解答问题，让访客沿着清楚的路径了解产品。下面的公共页面配方可切换栏目、比较示例方案、展开 FAQ，并搜索帮助内容。</p>
    <section class="public-site" aria-label="公共网页示例">
      <header class="public-header">
        <RouterLink class="public-brand" :to="publicLocation('home')"><IIcon name="layers" :size="20" />i_design <ITag>页面配方</ITag></RouterLink>
        <nav class="public-nav" aria-label="公共页面导航">
          <RouterLink v-for="(label, view) in PUBLIC_VIEWS" :key="view" :to="publicLocation(view)"
            :aria-current="!state.missingView && state.view === view ? 'page' : undefined">{{ label }}</RouterLink>
        </nav>
      </header>

      <div class="public-content">
        <section v-if="state.missingView" class="public-empty">
          <h2 ref="heading" tabindex="-1">未找到这个栏目</h2>
          <p>地址中的栏目不存在。可以回到概览，或从上方导航重新选择。</p>
          <RouterLink :to="publicLocation('home')">回到概览</RouterLink>
        </section>

        <template v-else-if="state.view === 'home'">
          <section class="public-hero">
            <span class="public-eyebrow">从入口到结果</span>
            <h2 ref="heading" tabindex="-1">把复杂流程，<br>做成清楚的界面。</h2>
            <p>用共享组件连接输入、协作与反馈。先体验具体场景，再决定怎样组织自己的产品页面。</p>
            <div class="public-actions">
              <RouterLink class="public-cta public-cta--primary" :to="publicLocation('help', { article: 'getting-started' })">开始了解<IIcon name="arrow-right" :size="16" /></RouterLink>
              <RouterLink class="public-cta" :to="publicLocation('pricing')">查看示例方案</RouterLink>
            </div>
          </section>
          <section aria-label="功能区">
            <h2>把关键路径连起来</h2>
            <div class="public-cards">
              <section v-for="feature in PUBLIC_FEATURES" :key="feature.id" class="public-card">
                <IIcon :name="feature.icon" :size="22" />
                <h3>{{ feature.title }}</h3><p>{{ feature.description }}</p>
                <RouterLink :to="feature.to">{{ feature.link }}<IIcon name="arrow-right" :size="14" /></RouterLink>
              </section>
            </div>
          </section>
          <aside class="public-note"><h3>带着问题继续看</h3><p>不确定如何选择页面模式？先看帮助中的具体路径，再回到组件示例操作一遍。</p><RouterLink :to="publicLocation('faq')">浏览常见问题</RouterLink></aside>
        </template>

        <section v-else-if="state.view === 'pricing'" aria-label="示例方案">
          <h2 ref="heading" tabindex="-1">清楚展示每一种选择</h2>
          <p class="public-pricing-notice">以下价格和权益均为虚构示例，仅用于展示方案排版。不产生订单，不收集支付信息，也不会扣费。</p>
          <nav class="public-cycle" aria-label="计价周期">
            <RouterLink :to="publicLocation('pricing', { cycle: 'monthly' })" :aria-current="state.cycle === 'monthly' ? 'page' : undefined">按月查看</RouterLink>
            <RouterLink :to="publicLocation('pricing', { cycle: 'yearly' })" :aria-current="state.cycle === 'yearly' ? 'page' : undefined">按年查看</RouterLink>
          </nav>
          <div class="public-cards">
            <section v-for="plan in PUBLIC_PLANS" :key="plan.id" class="public-card" :aria-label="`${plan.name}示例`">
              <ITag>示例方案</ITag><h3>{{ plan.name }}</h3><p>{{ plan.description }}</p>
              <p class="public-price">¥{{ publicPrice(plan, state.cycle).amount }}<span> / {{ publicPrice(plan, state.cycle).period }}</span></p>
              <p v-if="state.cycle === 'yearly'" class="public-price-note">全年示例总额；参考月均 ¥{{ publicPrice(plan, state.cycle).monthly }}</p>
              <p v-else class="public-price-note">每月示例金额</p>
              <ul><li v-for="benefit in plan.benefits" :key="benefit">{{ benefit }}</li></ul>
              <RouterLink class="public-cta" :to="publicLocation('help', { article: 'plans' })" :aria-label="`查看${plan.name}示例说明`">查看方案说明</RouterLink>
            </section>
          </div>
        </section>

        <section v-else-if="state.view === 'faq'" aria-label="常见问题">
          <h2 ref="heading" tabindex="-1">先把疑问说清楚</h2><p>点击问题展开回答，也可以使用键盘 Enter 或空格操作。</p>
          <ICollapse v-model="expanded" :items="[...PUBLIC_FAQ]" />
          <p><RouterLink :to="publicLocation('help')">继续搜索使用帮助</RouterLink></p>
        </section>

        <section v-else-if="state.view === 'help'" aria-label="使用帮助">
          <template v-if="state.article">
            <RouterLink :to="publicLocation('help', { search: state.search })">返回帮助列表</RouterLink>
            <h2 ref="heading" tabindex="-1">{{ state.article.title }}</h2><ITag>{{ state.article.category }}</ITag>
            <div class="public-article"><p v-for="paragraph in state.article.paragraphs" :key="paragraph">{{ paragraph }}</p></div>
            <RouterLink v-if="state.article.id === 'plans'" :to="publicLocation('pricing')">返回示例方案</RouterLink>
          </template>
          <template v-else-if="state.missingArticle">
            <h2 ref="heading" tabindex="-1">这篇帮助不存在</h2><p>文章可能已移动，或地址不完整。返回帮助列表重新查找。</p>
            <RouterLink :to="publicLocation('help', { search: state.search })">返回帮助列表</RouterLink>
          </template>
          <template v-else>
            <h2 ref="heading" tabindex="-1">找到下一步怎么做</h2>
            <form class="public-search" role="search" aria-label="搜索帮助" @submit.prevent="submitSearch">
              <label for="public-search">搜索帮助</label>
              <IInput id="public-search" v-model="search" :maxlength="PUBLIC_SEARCH_LIMIT" placeholder="例如：年付、主题、导航" />
              <button class="public-cta public-cta--primary" type="submit">搜索</button>
            </form>
            <p role="status">{{ results.length ? `找到 ${results.length} 篇帮助` : '没有匹配的帮助，请换一个关键词或清空搜索。' }}</p>
            <RouterLink v-if="state.search" :to="publicLocation('help')">清空搜索</RouterLink>
            <div class="public-cards">
              <section v-for="article in results" :key="article.id" class="public-card">
                <ITag>{{ article.category }}</ITag><h3>{{ article.title }}</h3><p>{{ article.summary }}</p>
                <RouterLink :to="publicLocation('help', { article: article.id, search: state.search })" :aria-label="`阅读：${article.title}`">阅读帮助<IIcon name="arrow-right" :size="14" /></RouterLink>
              </section>
            </div>
          </template>
        </section>

        <section v-else aria-label="更新日志">
          <h2 ref="heading" tabindex="-1">变化有迹可循</h2><p>以下日期与内容为页面配方的示例记录，不代表产品的正式发布版本或交付承诺。</p>
          <ol class="public-updates">
            <li v-for="update in PUBLIC_UPDATES" :key="update.id" class="public-card">
              <time :datetime="update.date">{{ update.date }}</time><h3>{{ update.title }}</h3>
              <ul><li v-for="item in update.items" :key="item">{{ item }}</li></ul>
              <RouterLink :to="publicLocation('help', { article: update.article })" :aria-label="`了解${update.title}`">查看使用说明</RouterLink>
            </li>
          </ol>
        </section>
      </div>
      <footer class="public-footer"><span>i_design · 公共页面配方</span><RouterLink :to="publicLocation('help')">使用帮助</RouterLink><RouterLink :to="publicLocation('updates')">查看更新日志</RouterLink></footer>
    </section>
    <h2>什么时候不该用它</h2>
    <p>需要真实订阅、交易、账号注册或内容管理时，应先对接对应服务。本页只提供内容组织和交互模式，示例价格不能直接作为商业报价使用。</p>
  </article>
</template>

<style scoped>
.public-page p, .public-page li { max-width: 45em; }
.public-site { border: 1px solid var(--i-color-hairline); border-radius: var(--i-radius-xl); background: var(--i-color-bg-elevated); overflow-wrap: anywhere; }
.public-header, .public-footer { display: flex; flex-wrap: wrap; align-items: center; gap: var(--i-spacing-4); padding: var(--i-spacing-5); }
.public-brand { display: inline-flex; align-items: center; gap: var(--i-spacing-2); font-weight: 600; text-decoration: none; color: var(--i-color-text); }
.public-nav, .public-cycle, .public-actions { display: flex; flex-wrap: wrap; gap: var(--i-spacing-2); }
.public-nav a, .public-cycle a { display: inline-block; padding: var(--i-spacing-2) var(--i-spacing-3); border-radius: var(--i-radius-md); color: var(--i-color-text-secondary); text-decoration: none; }
.public-nav a[aria-current], .public-cycle a[aria-current] { background: var(--i-color-brand-subtle); color: var(--i-color-brand-text); }
.public-content { padding: var(--i-spacing-5); }
.public-hero { padding: var(--i-spacing-6); background: var(--i-color-bg-subtle); border-radius: var(--i-radius-lg); margin-bottom: var(--i-spacing-6); }
.public-eyebrow { color: var(--i-color-brand-text); font-size: var(--i-font-size-sm); }
.public-hero h2 { font-size: var(--i-font-size-3xl); line-height: var(--i-line-height-tight); border: 0; margin-block: var(--i-spacing-3); }
.public-hero p { max-width: 32em; }
.public-actions { margin-top: var(--i-spacing-5); }
.public-cta { display: inline-flex; align-items: center; justify-content: center; gap: var(--i-spacing-2); padding: var(--i-spacing-2) var(--i-spacing-4); border: 1px solid var(--i-color-border); border-radius: var(--i-radius-md); background: var(--i-color-bg-elevated); color: var(--i-color-text); text-decoration: none; font: inherit; cursor: pointer; }
.public-cta--primary { background: var(--i-color-brand-solid); color: var(--i-color-on-brand); border-color: transparent; }
.public-site a:focus-visible, .public-cta:focus-visible { outline: 2px solid var(--i-color-brand); outline-offset: 2px; }
.public-cards { columns: 18em; column-gap: var(--i-spacing-4); margin-top: var(--i-spacing-5); }
.public-card { break-inside: avoid; padding: var(--i-spacing-5); margin-bottom: var(--i-spacing-4); border: 1px solid var(--i-color-hairline); border-radius: var(--i-radius-lg); background: var(--i-color-bg-elevated); }
.public-card h3 { margin-block: var(--i-spacing-3); }
.public-card a { display: inline-flex; align-items: center; flex-wrap: wrap; gap: var(--i-spacing-2); }
.public-card ul { padding-left: var(--i-spacing-5); }
.public-price { font-size: var(--i-font-size-2xl); font-weight: 600; color: var(--i-color-text); }
.public-price span, .public-price-note { font-size: var(--i-font-size-sm); color: var(--i-color-text-secondary); font-weight: 400; }
.public-note { padding: var(--i-spacing-5); border-radius: var(--i-radius-lg); background: var(--i-color-bg-subtle); }
.public-note h3 { margin-top: 0; }
.public-search { display: flex; flex-direction: column; align-items: stretch; gap: var(--i-spacing-2); max-width: 28em; }
.public-article { margin-block: var(--i-spacing-5); }
.public-updates { list-style: none; padding: 0; }
.public-updates time { color: var(--i-color-text-secondary); font-size: var(--i-font-size-sm); }
.public-footer { border-top: 1px solid var(--i-color-hairline); color: var(--i-color-text-secondary); font-size: var(--i-font-size-sm); }
.public-page :deep(.i-collapse__body) { max-width: 45em; }
</style>
