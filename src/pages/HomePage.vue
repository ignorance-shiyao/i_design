<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTilt } from '@/composables/useTilt'
import { useCountUp } from '@/composables/useCountUp'
import ValueCube from '@/site/ValueCube.vue'
import IButton from '@/components/IButton.vue'
import IInput from '@/components/IInput.vue'
import ICard from '@/components/ICard.vue'
import ITag from '@/components/ITag.vue'
import IAlert from '@/components/IAlert.vue'
import ISwitch from '@/components/ISwitch.vue'
import { componentCategories, plannedCount, readyCount } from '@/data/components'
import { useTheme } from '@/composables/useTheme'
import { heroIllustrations } from '@i-design/common'
import CodeBlock from '@/site/CodeBlock.vue'
import IIcon from '@/components/IIcon.vue'
import ISteps from '@/components/ISteps.vue'
import ILoading from '@/components/ILoading.vue'
import { message } from '@/components/message'

const values = [
  {
    key: '沉浸',
    en: 'Immersive',
    desc: '减少视觉噪音，把注意力还给内容本身。以克制的色彩与留白，让用户长时间专注于任务。'
  },
  {
    key: '灵活',
    en: 'Flexible',
    desc: '令牌驱动的主题体系，组件不写死任何具体色值，换肤、深色模式与业务定制均只改语义层。'
  },
  {
    key: '至简',
    en: 'Minimal',
    desc: '每个组件只暴露必要的 API，默认值即最佳实践，让常见场景零配置可用。'
  }
]

const features = [
  { icon: 'palette', title: '一致的设计语言', desc: '从色彩、字号到间距与动效，统一到一套 4px 栅格与语义令牌之上。' },
  { icon: 'code', title: 'Vue 3 + TypeScript', desc: '基于 Vite + Vue 3 组合式 API 与 TS 编写，完整类型提示，按需引入。' },
  { icon: 'moon', title: '深色模式内建', desc: '语义令牌天然支持双主题，业务组件无需任何适配代码。' },
  { icon: 'check-circle', title: '可访问性优先', desc: '语义化标签、键盘可达、可见的焦点样式与 ARIA 状态贯穿全部组件。' }
] as const

const { theme } = useTheme()
// 插画有明暗两版，跟随主题切换而不是靠滤镜硬套
const hero = computed(() =>
  theme.value === 'dark'
    ? heroIllustrations.dark
    : heroIllustrations.light
)

// Hero 预览卡随指针做 3D 倾斜，插画层浮在卡片之前形成纵深
const preview = ref<HTMLElement | null>(null)
useTilt(preview, { max: 6 })

const statsEl = ref<HTMLElement | null>(null)
const readyDisplay = useCountUp(statsEl, readyCount)
const categoryDisplay = useCountUp(statsEl, componentCategories.length)

const usageSnippet = `<IButton variant="primary">
  提交
</IButton>`

const previewSteps = [{ title: '基本信息' }, { title: '关联迭代' }, { title: '确认' }]

const demoInput = ref('')
const demoSwitch = ref(true)
</script>

<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="i-container hero__inner">
        <div class="hero__text">
          <ITag type="brand" round>v0.1.0 · 开源设计体系</ITag>
          <h1 class="hero__title">
            为企业中后台而生的<br />
            <span class="hero__title-accent">设计体系</span>
          </h1>
          <p class="hero__desc i-lead">
            Ignorance Design 提供一套从设计价值观、设计令牌到 Vue 3 组件库的完整解决方案，
            让设计与研发在同一套语言下协作，把重复的决策交给系统。
          </p>
          <div class="hero__actions">
            <RouterLink to="/components">
              <IButton variant="primary" size="lg">开始使用<IIcon name="arrow-right" :size="16" /></IButton>
            </RouterLink>
            <RouterLink to="/design/values"><IButton size="lg">设计价值观</IButton></RouterLink>
          </div>
          <dl ref="statsEl" class="hero__stats">
            <div><dt>{{ readyDisplay }}</dt><dd>已实现组件</dd></div>
            <div><dt>{{ categoryDisplay }}</dt><dd>场景分类</dd></div>
            <div><dt>60+</dt><dd>设计令牌</dd></div>
            <div><dt>2</dt><dd>内建主题</dd></div>
          </dl>
        </div>

        <!-- 用组件本身搭出预览面板，既是展示也是回归用例 -->
        <div ref="preview" class="hero__preview" aria-label="组件预览">
          <img
            class="hero__art i-tilt__layer"
            style="--i-layer-depth: 40"
            :src="hero.src"
            :srcset="hero.srcset"
            width="600"
            alt=""
            fetchpriority="high"
          />
          <ICard class="i-tilt__layer" style="--i-layer-depth: 18" title="创建工作项" hoverable>
            <ISteps class="preview__steps" :items="previewSteps" :current="1" />
            <div class="preview__field">
              <label>标题</label>
              <IInput v-model="demoInput" placeholder="请输入工作项标题" />
            </div>
            <div class="preview__field preview__field--row">
              <label>自动分配负责人</label>
              <ISwitch v-model="demoSwitch" />
            </div>
            <div class="preview__tags">
              <ITag type="brand">需求</ITag>
              <ITag type="success">已评审</ITag>
              <ITag type="warning">高优先级</ITag>
            </div>
            <IAlert type="info">提交后将同步到迭代看板。</IAlert>
            <template #footer>
              <div class="preview__footer">
                <IButton variant="text">取消</IButton>
                <IButton variant="primary" @click="message.success('工作项已创建')">提交</IButton>
              </div>
            </template>
          </ICard>
        </div>
      </div>
    </section>

    <!-- 设计价值观 -->
    <section class="i-container section">
      <span class="i-eyebrow">Principles</span>
      <h2 class="section__title">设计价值观</h2>
      <p class="section__desc i-lead">三条价值观贯穿每一次设计决策，也是评审组件是否合格的标尺。</p>
      <div class="values-3d">
        <ValueCube :size="200" />
        <div class="values">
          <article
            v-for="(value, index) in values"
            :key="value.key"
            v-reveal:left="index * 90"
            class="value"
          >
          <span class="value__en">{{ value.en }}</span>
          <h3 class="value__title">{{ value.key }}</h3>
            <p>{{ value.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- 能力特性 -->
    <section class="section section--muted">
      <div class="i-container">
        <span class="i-eyebrow">Why</span>
        <h2 class="section__title">为什么选择 Ignorance Design</h2>
        <div class="features">
          <ICard
            v-for="(feature, index) in features"
            :key="feature.title"
            v-reveal:depth="index * 80"
            hoverable
            class="feature i-lift"
          >
            <span class="feature__icon"><IIcon :name="feature.icon" :size="20" /></span>
            <h3 class="feature__title">{{ feature.title }}</h3>
            <p class="feature__desc">{{ feature.desc }}</p>
          </ICard>
        </div>
      </div>
    </section>

    <!-- 覆盖范围 -->
    <section class="i-container section">
      <span class="i-eyebrow">Coverage</span>
      <h2 class="section__title">覆盖范围</h2>
      <p class="section__desc i-lead">
        按中后台的真实使用场景划分五类。已实现 {{ readyCount }} 个组件，
        另有 {{ plannedCount }} 个在规划中——把边界写出来，比让使用者去猜要诚实。
      </p>
      <div class="coverage">
        <div
          v-for="(category, index) in componentCategories"
          :key="category.title"
          v-reveal="index * 70"
          class="coverage__col"
        >
          <div class="coverage__head">
            <h3>{{ category.title }}</h3>
            <span class="coverage__count">
              {{ category.items.filter((i) => i.status === 'ready').length }} / {{ category.items.length }}
            </span>
          </div>
          <ul>
            <li
              v-for="item in category.items"
              :key="item.name"
              :class="{ 'is-planned': item.status === 'planned' }"
            >
              <RouterLink v-if="item.status === 'ready'" :to="item.to">{{ item.name }}</RouterLink>
              <span v-else>{{ item.name }}</span>
            </li>
          </ul>
        </div>
      </div>
      <p class="coverage__legend">
        <span class="dot" /> 已实现
        <span class="dot dot--planned" /> 规划中
      </p>
    </section>

    <!-- 快速上手 -->
    <section class="i-container section">
      <span class="i-eyebrow">Get started</span>
      <h2 class="section__title">三步接入</h2>
      <div class="steps">
        <div v-reveal:depth="0" class="step i-lift">
          <span class="step__no">1</span>
          <h3>安装依赖</h3>
          <CodeBlock code="npm install" lang="bash" :copyable="false" />
        </div>
        <div v-reveal:depth="100" class="step i-lift">
          <span class="step__no">2</span>
          <h3>引入令牌与组件</h3>
          <CodeBlock
            lang="ts"
            :copyable="false"
            code="import '@/styles/global.css'
import IDesign from '@/components'

app.use(IDesign)"
          />
        </div>
        <div v-reveal:depth="200" class="step i-lift">
          <span class="step__no">3</span>
          <h3>直接使用</h3>
          <CodeBlock
            lang="vue"
            :copyable="false"
            :code="usageSnippet"
          />
        </div>
      </div>
    </section>

    <section class="i-container">
      <div v-reveal:depth class="cta">
        <div>
          <h2>把设计决策沉淀成系统</h2>
          <p>浏览完整的令牌表与组件文档，或直接从组件示例开始。</p>
        </div>
        <RouterLink to="/design/tokens">
          <IButton variant="primary" size="lg">
            查看设计令牌<IIcon name="arrow-right" :size="16" />
          </IButton>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Hero */
.hero {
  position: relative;
  padding: var(--i-spacing-20) 0 var(--i-spacing-16);
  overflow: hidden;
  background:
    radial-gradient(50% 60% at 12% -10%, var(--i-color-brand-subtle), transparent 70%),
    radial-gradient(40% 50% at 90% 0%, var(--i-color-ring), transparent 70%),
    var(--i-color-bg);
}
/* 细网格只出现在顶部，越往下越淡，避免整块背景显脏 */
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--i-color-hairline) 1px, transparent 1px),
    linear-gradient(90deg, var(--i-color-hairline) 1px, transparent 1px);
  background-size: 40px 40px;
  -webkit-mask-image: radial-gradient(60% 50% at 50% 0%, #000, transparent 100%);
  mask-image: radial-gradient(60% 50% at 50% 0%, #000, transparent 100%);
  pointer-events: none;
}
.hero__inner { position: relative; }
.hero__inner {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: var(--i-spacing-16);
  align-items: center;
}
.hero__title {
  margin: var(--i-spacing-5) 0 var(--i-spacing-4);
  font-size: var(--i-font-size-5xl);
  letter-spacing: -0.03em;
  line-height: 1.15;
}
.hero__title-accent {
  background: var(--i-gradient-brand);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.hero__actions { display: flex; gap: var(--i-spacing-3); margin-top: var(--i-spacing-8); }
.hero__stats {
  display: flex;
  gap: var(--i-spacing-10);
  margin: var(--i-spacing-10) 0 0;
}
.hero__stats { gap: var(--i-spacing-8); }
.hero__stats dt {
  font-size: var(--i-font-size-2xl);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--i-color-text);
}
.hero__stats dd {
  margin: var(--i-spacing-1) 0 0;
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-tertiary);
}

.hero__art {
  display: block;
  width: 100%;
  max-width: 520px;
  height: auto;
  margin: 0 auto var(--i-spacing-5);
}
.hero__preview {
  filter: drop-shadow(var(--i-shadow-xl));
  animation: hero-float 600ms var(--i-motion-easing) both;
}
@keyframes hero-float {
  from { opacity: 0; transform: translateY(12px); }
}
@media (prefers-reduced-motion: reduce) {
  .hero__preview { animation: none; }
}
.preview__field { margin-bottom: var(--i-spacing-4); }
.preview__field label {
  display: block;
  margin-bottom: var(--i-spacing-2);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
}
.preview__field--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.preview__field--row label { margin-bottom: 0; }
.preview__tags { display: flex; gap: var(--i-spacing-2); margin-bottom: var(--i-spacing-4); }
.preview__footer { display: flex; justify-content: flex-end; gap: var(--i-spacing-2); }

/* 价值观：立方体与文案并排 */
.values-3d {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: var(--i-spacing-12);
  align-items: center;
  margin-top: var(--i-spacing-8);
}
.values-3d .values { grid-template-columns: 1fr; gap: var(--i-spacing-4); }

@media (max-width: 860px) {
  .values-3d { grid-template-columns: 1fr; gap: var(--i-spacing-10); }
}

/* 覆盖范围 */
.coverage {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--i-spacing-6);
  margin-top: var(--i-spacing-8);
}
.coverage__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: var(--i-spacing-2);
  border-bottom: 1px solid var(--i-color-border);
}
.coverage__head h3 { font-size: var(--i-font-size-md); }
.coverage__count {
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-tertiary);
}
.coverage__col ul {
  margin: var(--i-spacing-3) 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: var(--i-spacing-2);
  font-size: var(--i-font-size-sm);
}
.coverage__col li::before {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-right: var(--i-spacing-2);
  border-radius: var(--i-radius-full);
  background: var(--i-color-brand);
  vertical-align: middle;
}
.coverage__col li.is-planned { color: var(--i-color-text-tertiary); }
.coverage__col li.is-planned::before { background: var(--i-color-border-strong); }
.coverage__col a { color: var(--i-color-text-secondary); }
.coverage__col a:hover { color: var(--i-color-brand); }
.coverage__legend {
  margin-top: var(--i-spacing-6);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-tertiary);
}
.coverage__legend .dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  margin: 0 var(--i-spacing-2) 0 var(--i-spacing-4);
  border-radius: var(--i-radius-full);
  background: var(--i-color-brand);
  vertical-align: middle;
}
.coverage__legend .dot:first-child { margin-left: 0; }
.coverage__legend .dot--planned { background: var(--i-color-border-strong); }

.preview__steps { margin-bottom: var(--i-spacing-5); }

/* 通用区块 */
.section { padding: var(--i-spacing-16) var(--i-spacing-6); }
.section--muted { background: var(--i-color-bg-subtle); }
.section__title { font-size: var(--i-font-size-3xl); margin-bottom: var(--i-spacing-3); }
.section__desc { margin-bottom: var(--i-spacing-10); }

.values {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--i-spacing-6);
}
.value {
  position: relative;
  padding: var(--i-spacing-6);
  background: var(--i-gradient-surface);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-xl);
  box-shadow: var(--i-shadow-sm);
  overflow: hidden;
  transition: box-shadow var(--i-motion-base) var(--i-motion-easing),
    transform var(--i-motion-base) var(--i-motion-easing);
}
.value::before {
  content: '';
  position: absolute;
  left: 0;
  top: var(--i-spacing-6);
  bottom: var(--i-spacing-6);
  width: 2px;
  border-radius: 0 2px 2px 0;
  background: var(--i-gradient-brand);
}
.value:hover { transform: translateY(-2px); box-shadow: var(--i-shadow-md); }
.value__en {
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--i-color-brand);
}
.value__title { font-size: var(--i-font-size-xl); margin: var(--i-spacing-2) 0 var(--i-spacing-3); }
.value p { color: var(--i-color-text-secondary); }

.feature__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-bottom: var(--i-spacing-4);
  border-radius: var(--i-radius-lg);
  color: var(--i-color-brand);
  background: var(--i-color-brand-subtle);
}
.feature__title { font-size: var(--i-font-size-lg); margin-bottom: var(--i-spacing-2); }
.feature__desc { color: var(--i-color-text-secondary); font-size: var(--i-font-size-md); }

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--i-spacing-5);
  margin-top: var(--i-spacing-8);
}

.steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--i-spacing-6);
  margin-top: var(--i-spacing-8);
}
.step {
  padding: var(--i-spacing-6);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-xl);
  background: var(--i-color-bg-elevated);
  box-shadow: var(--i-shadow-sm);
}
.step__no {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--i-radius-full);
  background: var(--i-color-brand-subtle);
  color: var(--i-color-brand);
  font-weight: 600;
  margin-bottom: var(--i-spacing-3);
}
.step h3 { font-size: var(--i-font-size-lg); margin-bottom: var(--i-spacing-3); }


.cta {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-6);
  padding: var(--i-spacing-12);
  border-radius: var(--i-radius-xl);
  background: var(--i-gradient-brand);
  color: #fff;
  overflow: hidden;
  box-shadow: var(--i-shadow-brand);
}
.cta::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px);
  background-size: 20px 20px;
  -webkit-mask-image: radial-gradient(60% 100% at 100% 0%, #000, transparent);
  mask-image: radial-gradient(60% 100% at 100% 0%, #000, transparent);
}
.cta > * { position: relative; }
.cta :deep(.i-button--primary) {
  background: #fff;
  color: var(--i-color-brand-active);
}
.cta :deep(.i-button--primary:hover) { background: rgba(255, 255, 255, 0.9); }
.cta h2 { font-size: var(--i-font-size-2xl); }
.cta p { margin-top: var(--i-spacing-2); opacity: 0.85; }

@media (max-width: 960px) {
  .hero { padding-top: var(--i-spacing-16); }
  .hero__inner { grid-template-columns: 1fr; gap: var(--i-spacing-10); }
  .hero__title { font-size: var(--i-font-size-4xl); }
  .cta { padding: var(--i-spacing-8); }
}
</style>
