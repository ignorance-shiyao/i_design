<script setup lang="ts">
import { computed, ref } from 'vue'
import { componentCategories } from '@/data/components'
import { frameworks } from '@/data/frameworks'
import IAlert from '@/components/IAlert.vue'
import IButton from '@/components/IButton.vue'
import ICard from '@/components/ICard.vue'
import IIcon from '@/components/IIcon.vue'
import IInput from '@/components/IInput.vue'
import ISwitch from '@/components/ISwitch.vue'
import ITag from '@/components/ITag.vue'
import { message } from '@/components/message'

const demoTitle = ref('设计系统升级')
const demoAutoAssign = ref(true)

const allComponents = computed(() => componentCategories.flatMap((category) => category.items))
const readyCount = computed(() => allComponents.value.filter((item) => item.status === 'ready').length)
const plannedCount = computed(() => allComponents.value.filter((item) => item.status === 'planned').length)

const highlights = computed(() => [
  { value: `${readyCount.value}`, label: '已实现组件' },
  { value: `${frameworks.length}`, label: '运行时覆盖' },
  { value: `${componentCategories.length}`, label: '场景分类' },
  { value: `${plannedCount.value}`, label: '规划中' }
])

const architecture = [
  {
    icon: 'layers',
    index: '01',
    title: '一套语义令牌',
    desc: '颜色、间距、圆角与动效从统一语义层生成，各端只消费结果，不各自维护设计常量。'
  },
  {
    icon: 'code',
    index: '02',
    title: '一套交互规则',
    desc: '把分页、浮层、树选择等行为收敛成可测试的规则，框架层只负责渲染与事件适配。'
  },
  {
    icon: 'check-circle',
    index: '03',
    title: '一条一致性基线',
    desc: '构建、类型检查与跨端 parity 校验进入同一条质量链，减少“同名组件、不同表现”。'
  }
] as const

const featuredCategories = computed(() =>
  componentCategories.map((category) => ({
    ...category,
    ready: category.items.filter((item) => item.status === 'ready').length,
    preview: category.items.filter((item) => item.status === 'ready').slice(0, 4)
  }))
)
</script>

<template>
  <main class="home">
    <section class="hero">
      <div class="hero__grid" aria-hidden="true" />
      <div class="i-container hero__inner">
        <div class="hero__copy">
          <div class="hero__meta">
            <span class="hero__status"><i /> Open source</span>
            <span class="hero__version">iDesign · v0.1.0</span>
          </div>

          <h1>
            为复杂产品，建立一套
            <span>清晰、稳定、可复用</span>
            的界面语言。
          </h1>

          <p class="hero__lead">
            面向企业中后台与智能体产品的跨端设计系统。组件、令牌和交互规则统一维护，
            Vue、React、小程序与 Flutter 使用同一套设计语义。
          </p>

          <div class="hero__actions">
            <RouterLink to="/components">
              <IButton variant="primary" size="lg">
                浏览组件
                <IIcon name="arrow-right" :size="16" />
              </IButton>
            </RouterLink>
            <RouterLink to="/design/tokens">
              <IButton size="lg">查看设计令牌</IButton>
            </RouterLink>
          </div>

          <div class="hero__stats" aria-label="iDesign 概览">
            <div v-for="item in highlights" :key="item.label" class="hero__stat">
              <strong>{{ item.value }}</strong>
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>

        <div class="lab" aria-label="组件实时预览">
          <div class="lab__glow" aria-hidden="true" />
          <div class="lab__window">
            <div class="lab__bar">
              <div class="lab__dots" aria-hidden="true"><i /><i /><i /></div>
              <span>Live component</span>
              <ITag type="success" round>Ready</ITag>
            </div>

            <div class="lab__body">
              <div class="lab__caption">
                <span>FORM / DEFAULT</span>
                <span>实时交互</span>
              </div>

              <ICard title="创建工作项" class="lab__card">
                <div class="lab__field">
                  <label>标题</label>
                  <IInput v-model="demoTitle" placeholder="请输入工作项标题" />
                </div>

                <div class="lab__row">
                  <div>
                    <strong>自动分配负责人</strong>
                    <p>根据当前迭代和工作负载自动选择。</p>
                  </div>
                  <ISwitch v-model="demoAutoAssign" />
                </div>

                <div class="lab__tags">
                  <ITag type="brand">需求</ITag>
                  <ITag type="success">已评审</ITag>
                  <ITag type="warning">高优先级</ITag>
                </div>

                <IAlert type="info">提交后将同步到当前迭代。</IAlert>

                <template #footer>
                  <div class="lab__footer">
                    <IButton variant="text">取消</IButton>
                    <IButton variant="primary" @click="message.success('工作项已创建')">提交</IButton>
                  </div>
                </template>
              </ICard>
            </div>
          </div>

          <div class="lab__chip lab__chip--top">
            <IIcon name="palette" :size="15" />
            Semantic tokens
          </div>
          <div class="lab__chip lab__chip--bottom">
            <IIcon name="check-circle" :size="15" />
            Cross-platform parity
          </div>
        </div>
      </div>
    </section>

    <section class="i-container section section--components">
      <div class="section__head">
        <div>
          <span class="i-eyebrow">Components</span>
          <h2>从场景找到组件</h2>
          <p>不按技术实现堆目录，按用户在产品里要完成的任务组织。</p>
        </div>
        <RouterLink class="section__link" to="/components">
          查看全部组件 <IIcon name="arrow-right" :size="15" />
        </RouterLink>
      </div>

      <div class="category-grid">
        <article v-for="category in featuredCategories" :key="category.title" class="category-card">
          <div class="category-card__head">
            <div>
              <h3>{{ category.title }}</h3>
              <p>{{ category.desc }}</p>
            </div>
            <span>{{ category.ready }}/{{ category.items.length }}</span>
          </div>
          <div class="category-card__items">
            <RouterLink v-for="item in category.preview" :key="item.name" :to="item.to">
              <span>{{ item.name }}</span>
              <small>{{ item.cn }}</small>
            </RouterLink>
          </div>
        </article>
      </div>
    </section>

    <section class="platform-section">
      <div class="i-container platform">
        <div class="platform__copy">
          <span class="i-eyebrow">One system · Many runtimes</span>
          <h2>设计决策只做一次，渲染适配交给各端。</h2>
          <p>
            组件 API 可以因框架语法而不同，但视觉令牌、交互语义和验收基线保持一致。
            业务团队无需再维护多套“长得差不多”的组件规范。
          </p>
          <RouterLink class="section__link" to="/design/cross-platform">
            查看跨端实现 <IIcon name="arrow-right" :size="15" />
          </RouterLink>
        </div>

        <div class="platform__stack">
          <div v-for="(framework, index) in frameworks" :key="framework.id" class="runtime">
            <span class="runtime__index">0{{ index + 1 }}</span>
            <div>
              <strong>{{ framework.label }}</strong>
              <small>{{ framework.runtime }}</small>
            </div>
            <code>{{ framework.pkg }}</code>
          </div>
        </div>
      </div>
    </section>

    <section class="i-container section">
      <div class="section__head section__head--architecture">
        <div>
          <span class="i-eyebrow">Architecture</span>
          <h2>组件库之外，还有一套可验证的约束。</h2>
          <p>设计系统的稳定性来自单一数据源、明确契约和自动校验，而不是文档约定。</p>
        </div>
      </div>

      <div class="architecture-grid">
        <article v-for="item in architecture" :key="item.title" class="architecture-card">
          <div class="architecture-card__top">
            <span class="architecture-card__icon"><IIcon :name="item.icon" :size="19" /></span>
            <span>{{ item.index }}</span>
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </article>
      </div>

      <div class="token-strip">
        <div class="token-strip__copy">
          <span>DESIGN TOKENS</span>
          <strong>换一个主色，各端一起变化。</strong>
          <p>组件只消费语义令牌，不直接绑定业务色值。</p>
        </div>
        <div class="token-strip__swatches" aria-hidden="true">
          <i /><i /><i /><i /><i />
        </div>
        <RouterLink to="/design/tokens">
          <IButton>查看 Token 体系</IButton>
        </RouterLink>
      </div>
    </section>

    <section class="i-container final-cta">
      <div>
        <span>START BUILDING</span>
        <h2>先从一个真实页面开始。</h2>
        <p>浏览组件、复制示例，再按语义令牌完成业务主题适配。</p>
      </div>
      <div class="final-cta__actions">
        <RouterLink to="/components"><IButton variant="primary" size="lg">进入组件库</IButton></RouterLink>
        <a href="https://github.com/ignorance-shiyao/i_design" target="_blank" rel="noreferrer">
          <IButton size="lg"><IIcon name="github" :size="16" /> GitHub</IButton>
        </a>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home { overflow: hidden; }

.hero {
  position: relative;
  min-height: 700px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--i-color-hairline);
  background:
    radial-gradient(circle at 74% 30%, color-mix(in srgb, var(--i-color-brand) 13%, transparent), transparent 28%),
    linear-gradient(180deg, color-mix(in srgb, var(--i-color-bg-subtle) 48%, transparent), transparent 64%);
}
.hero__grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: .58;
  background-image:
    linear-gradient(color-mix(in srgb, var(--i-color-hairline) 68%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--i-color-hairline) 68%, transparent) 1px, transparent 1px);
  background-size: 44px 44px;
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, transparent 88%);
  mask-image: linear-gradient(to bottom, #000 0%, transparent 88%);
}
.hero__inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, .95fr) minmax(460px, .8fr);
  gap: clamp(48px, 7vw, 112px);
  align-items: center;
  padding-top: 88px;
  padding-bottom: 88px;
}
.hero__copy { min-width: 0; }
.hero__meta {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-3);
  margin-bottom: var(--i-spacing-6);
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-tertiary);
}
.hero__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--i-color-text-secondary);
}
.hero__status i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #27b36a;
  box-shadow: 0 0 0 4px color-mix(in srgb, #27b36a 14%, transparent);
}
.hero__version {
  padding-left: var(--i-spacing-3);
  border-left: 1px solid var(--i-color-border);
}
.hero h1 {
  max-width: 780px;
  margin: 0;
  font-size: clamp(46px, 5.4vw, 78px);
  line-height: 1.06;
  letter-spacing: -0.055em;
  font-weight: 650;
  text-wrap: balance;
}
.hero h1 span {
  color: var(--i-color-brand);
}
.hero__lead {
  max-width: 670px;
  margin: var(--i-spacing-6) 0 0;
  font-size: clamp(17px, 1.5vw, 20px);
  line-height: 1.8;
  color: var(--i-color-text-secondary);
}
.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-3);
  margin-top: var(--i-spacing-8);
}
.hero__actions :deep(.i-button) { min-height: 44px; }
.hero__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  margin-top: var(--i-spacing-10);
  padding-top: var(--i-spacing-6);
  border-top: 1px solid var(--i-color-hairline);
}
.hero__stat {
  display: grid;
  gap: 5px;
  padding-right: var(--i-spacing-4);
}
.hero__stat + .hero__stat {
  padding-left: var(--i-spacing-4);
  border-left: 1px solid var(--i-color-hairline);
}
.hero__stat strong {
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xl);
  letter-spacing: -.03em;
}
.hero__stat span { font-size: var(--i-font-size-xs); color: var(--i-color-text-tertiary); }

.lab { position: relative; padding: 44px 16px 36px 30px; }
.lab__glow {
  position: absolute;
  inset: 16% 8% 12%;
  border-radius: 50%;
  background: var(--i-color-brand);
  opacity: .12;
  filter: blur(70px);
}
.lab__window {
  position: relative;
  z-index: 1;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--i-color-border) 82%, transparent);
  border-radius: 22px;
  background: color-mix(in srgb, var(--i-color-bg-elevated) 94%, transparent);
  box-shadow: 0 34px 90px color-mix(in srgb, #000 13%, transparent), var(--i-shadow-md);
  transform: perspective(1200px) rotateY(-3deg) rotateX(1deg);
}
.lab__bar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--i-spacing-3);
  min-height: 48px;
  padding: 0 var(--i-spacing-4);
  border-bottom: 1px solid var(--i-color-hairline);
  color: var(--i-color-text-tertiary);
  font: 500 var(--i-font-size-xs)/1 var(--i-font-family-mono);
}
.lab__bar > :last-child { justify-self: end; }
.lab__dots { display: flex; gap: 6px; }
.lab__dots i { width: 7px; height: 7px; border-radius: 50%; background: var(--i-color-border); }
.lab__body { padding: var(--i-spacing-5); background: color-mix(in srgb, var(--i-color-bg-subtle) 52%, transparent); }
.lab__caption {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--i-spacing-3);
  color: var(--i-color-text-tertiary);
  font: 500 10px/1 var(--i-font-family-mono);
  letter-spacing: .1em;
}
.lab__card { box-shadow: var(--i-shadow-sm); }
.lab__field { display: grid; gap: var(--i-spacing-2); }
.lab__field label, .lab__row strong { font-size: var(--i-font-size-sm); font-weight: 550; }
.lab__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-6);
  margin-top: var(--i-spacing-5);
  padding: var(--i-spacing-4) 0;
  border-top: 1px solid var(--i-color-hairline);
  border-bottom: 1px solid var(--i-color-hairline);
}
.lab__row p { margin: 4px 0 0; font-size: var(--i-font-size-xs); color: var(--i-color-text-tertiary); }
.lab__tags { display: flex; flex-wrap: wrap; gap: var(--i-spacing-2); margin: var(--i-spacing-4) 0; }
.lab__footer { display: flex; justify-content: flex-end; gap: var(--i-spacing-2); }
.lab__chip {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-full);
  background: color-mix(in srgb, var(--i-color-bg-elevated) 88%, transparent);
  backdrop-filter: blur(16px);
  box-shadow: var(--i-shadow-md);
  color: var(--i-color-text-secondary);
  font-size: 11px;
}
.lab__chip :deep(svg) { color: var(--i-color-brand); }
.lab__chip--top { top: 13px; right: -7px; }
.lab__chip--bottom { left: 0; bottom: 4px; }

.section { padding-top: 112px; padding-bottom: 112px; }
.section__head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--i-spacing-8);
  margin-bottom: var(--i-spacing-8);
}
.section__head h2, .platform h2, .final-cta h2 {
  margin: var(--i-spacing-3) 0 0;
  max-width: 760px;
  font-size: clamp(32px, 3.4vw, 48px);
  line-height: 1.15;
  letter-spacing: -.04em;
}
.section__head p, .platform__copy > p, .final-cta p {
  max-width: 680px;
  margin: var(--i-spacing-3) 0 0;
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-md);
  line-height: 1.75;
}
.section__link {
  display: inline-flex;
  align-items: center;
  flex: none;
  gap: 7px;
  color: var(--i-color-brand);
  font-size: var(--i-font-size-sm);
  font-weight: 550;
}
.section__link:hover { gap: 10px; }

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--i-spacing-4);
}
.category-card {
  min-height: 250px;
  padding: var(--i-spacing-5);
  border: 1px solid var(--i-color-hairline);
  border-radius: 18px;
  background: var(--i-color-bg-elevated);
  transition: transform var(--i-motion-base) var(--i-motion-easing), border-color var(--i-motion-base) var(--i-motion-easing), box-shadow var(--i-motion-base) var(--i-motion-easing);
}
.category-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--i-color-brand) 28%, var(--i-color-border));
  box-shadow: var(--i-shadow-md);
}
.category-card__head { display: flex; justify-content: space-between; gap: var(--i-spacing-4); min-height: 82px; }
.category-card__head h3 { margin: 0; font-size: var(--i-font-size-lg); letter-spacing: -.02em; }
.category-card__head p { margin: 7px 0 0; color: var(--i-color-text-tertiary); font-size: var(--i-font-size-sm); line-height: 1.55; }
.category-card__head > span {
  flex: none;
  font: 500 var(--i-font-size-xs)/1 var(--i-font-family-mono);
  color: var(--i-color-text-tertiary);
}
.category-card__items { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: var(--i-spacing-5); }
.category-card__items a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-2);
  padding: 10px 11px;
  border-radius: var(--i-radius-md);
  background: var(--i-color-bg-subtle);
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-xs);
}
.category-card__items a:hover { background: var(--i-color-brand-subtle); color: var(--i-color-brand); }
.category-card__items small { color: var(--i-color-text-tertiary); }

.platform-section {
  border-top: 1px solid var(--i-color-hairline);
  border-bottom: 1px solid var(--i-color-hairline);
  background: var(--i-color-bg-subtle);
}
.platform {
  display: grid;
  grid-template-columns: minmax(0, .82fr) minmax(520px, 1fr);
  gap: clamp(56px, 9vw, 140px);
  align-items: center;
  padding-top: 112px;
  padding-bottom: 112px;
}
.platform__copy .section__link { margin-top: var(--i-spacing-6); }
.platform__stack {
  overflow: hidden;
  border: 1px solid var(--i-color-hairline);
  border-radius: 18px;
  background: var(--i-color-bg-elevated);
  box-shadow: var(--i-shadow-sm);
}
.runtime {
  display: grid;
  grid-template-columns: 38px 1fr auto;
  gap: var(--i-spacing-4);
  align-items: center;
  min-height: 66px;
  padding: 0 var(--i-spacing-5);
  border-bottom: 1px solid var(--i-color-hairline);
}
.runtime:last-child { border-bottom: 0; }
.runtime:hover { background: var(--i-color-bg-subtle); }
.runtime__index { font: 500 10px/1 var(--i-font-family-mono); color: var(--i-color-text-tertiary); }
.runtime div { display: grid; gap: 3px; }
.runtime strong { font-size: var(--i-font-size-sm); }
.runtime small { color: var(--i-color-text-tertiary); font-size: 11px; }
.runtime code {
  padding: 6px 8px;
  border-radius: 7px;
  background: var(--i-color-bg-subtle);
  color: var(--i-color-text-secondary);
  font: 500 10px/1 var(--i-font-family-mono);
}

.architecture-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--i-spacing-4); }
.architecture-card {
  padding: var(--i-spacing-6);
  border: 1px solid var(--i-color-hairline);
  border-radius: 18px;
  background: var(--i-color-bg-elevated);
}
.architecture-card__top { display: flex; align-items: center; justify-content: space-between; color: var(--i-color-text-tertiary); font: 500 10px/1 var(--i-font-family-mono); }
.architecture-card__icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: var(--i-color-brand-subtle);
  color: var(--i-color-brand);
}
.architecture-card h3 { margin: var(--i-spacing-8) 0 0; font-size: var(--i-font-size-xl); letter-spacing: -.025em; }
.architecture-card p { margin: var(--i-spacing-3) 0 0; color: var(--i-color-text-secondary); line-height: 1.7; font-size: var(--i-font-size-sm); }
.token-strip {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: var(--i-spacing-8);
  margin-top: var(--i-spacing-4);
  padding: var(--i-spacing-6);
  border: 1px solid color-mix(in srgb, var(--i-color-brand) 24%, var(--i-color-hairline));
  border-radius: 18px;
  background: linear-gradient(110deg, var(--i-color-brand-subtle), var(--i-color-bg-elevated) 46%);
}
.token-strip__copy { display: grid; gap: 6px; }
.token-strip__copy > span { font: 500 10px/1 var(--i-font-family-mono); letter-spacing: .12em; color: var(--i-color-brand); }
.token-strip__copy strong { font-size: var(--i-font-size-lg); }
.token-strip__copy p { margin: 0; color: var(--i-color-text-secondary); font-size: var(--i-font-size-sm); }
.token-strip__swatches { display: flex; align-items: center; }
.token-strip__swatches i { width: 36px; height: 36px; margin-left: -7px; border: 3px solid var(--i-color-bg-elevated); border-radius: 50%; background: var(--i-color-brand); }
.token-strip__swatches i:nth-child(2) { opacity: .78; }
.token-strip__swatches i:nth-child(3) { opacity: .56; }
.token-strip__swatches i:nth-child(4) { opacity: .34; }
.token-strip__swatches i:nth-child(5) { opacity: .16; }

.final-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-8);
  margin-bottom: 96px;
  padding-top: var(--i-spacing-10);
  padding-bottom: var(--i-spacing-10);
  border-top: 1px solid var(--i-color-hairline);
}
.final-cta > div:first-child > span { font: 500 10px/1 var(--i-font-family-mono); letter-spacing: .13em; color: var(--i-color-brand); }
.final-cta h2 { margin-top: var(--i-spacing-3); font-size: clamp(30px, 3vw, 42px); }
.final-cta__actions { display: flex; flex: none; gap: var(--i-spacing-3); }

@media (max-width: 1080px) {
  .hero { min-height: auto; }
  .hero__inner { grid-template-columns: 1fr; gap: var(--i-spacing-8); padding-top: 84px; padding-bottom: 84px; }
  .hero__copy { max-width: 820px; }
  .lab { width: min(720px, 100%); padding-right: 30px; }
  .category-grid { grid-template-columns: repeat(2, 1fr); }
  .platform { grid-template-columns: 1fr; }
  .platform__copy { max-width: 720px; }
}

@media (max-width: 760px) {
  .hero__inner { padding-top: 64px; padding-bottom: 64px; }
  .hero h1 { font-size: clamp(40px, 11vw, 58px); }
  .hero__stats { grid-template-columns: repeat(2, 1fr); row-gap: var(--i-spacing-5); }
  .hero__stat:nth-child(3) { padding-left: 0; border-left: 0; }
  .hero__stat:nth-child(3), .hero__stat:nth-child(4) { padding-top: var(--i-spacing-4); border-top: 1px solid var(--i-color-hairline); }
  .lab { padding: 30px 0 28px; }
  .lab__window { transform: none; border-radius: 16px; }
  .lab__chip { display: none; }
  .lab__body { padding: var(--i-spacing-3); }
  .section { padding-top: 78px; padding-bottom: 78px; }
  .section__head { align-items: start; flex-direction: column; }
  .category-grid, .architecture-grid { grid-template-columns: 1fr; }
  .platform { padding-top: 78px; padding-bottom: 78px; gap: var(--i-spacing-8); }
  .platform__stack { border-radius: 14px; }
  .runtime { grid-template-columns: 28px 1fr; padding: var(--i-spacing-3) var(--i-spacing-4); }
  .runtime code { grid-column: 2; justify-self: start; }
  .token-strip { grid-template-columns: 1fr; gap: var(--i-spacing-5); }
  .token-strip__swatches { display: none; }
  .final-cta { align-items: flex-start; flex-direction: column; margin-bottom: 56px; }
}

@media (max-width: 480px) {
  .hero__actions, .final-cta__actions { display: grid; width: 100%; }
  .hero__actions a, .final-cta__actions a { display: block; }
  .hero__actions :deep(.i-button), .final-cta__actions :deep(.i-button) { width: 100%; }
  .category-card__items { grid-template-columns: 1fr; }
  .hero__stats { font-size: 90%; }
}
</style>
