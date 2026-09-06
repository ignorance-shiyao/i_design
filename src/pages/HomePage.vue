<script setup lang="ts">
import { ref } from 'vue'
import IButton from '@/components/IButton.vue'
import IInput from '@/components/IInput.vue'
import ICard from '@/components/ICard.vue'
import ITag from '@/components/ITag.vue'
import IAlert from '@/components/IAlert.vue'
import ISwitch from '@/components/ISwitch.vue'

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
  { title: '一致的设计语言', desc: '从色彩、字号到间距与动效，统一到一套 4px 栅格与语义令牌之上。' },
  { title: 'Vue 3 + TypeScript', desc: '基于 Vite + Vue 3 组合式 API 与 TS 编写，完整类型提示，按需引入。' },
  { title: '深色模式内建', desc: '语义令牌天然支持双主题，业务组件无需任何适配代码。' },
  { title: '可访问性优先', desc: '语义化标签、键盘可达、可见的焦点样式与 ARIA 状态贯穿全部组件。' }
]

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
            <RouterLink to="/components/button"><IButton variant="primary" size="lg">开始使用</IButton></RouterLink>
            <RouterLink to="/design/values"><IButton size="lg">设计价值观</IButton></RouterLink>
          </div>
          <dl class="hero__stats">
            <div><dt>9</dt><dd>基础组件</dd></div>
            <div><dt>60+</dt><dd>设计令牌</dd></div>
            <div><dt>2</dt><dd>内建主题</dd></div>
          </dl>
        </div>

        <!-- 用组件本身搭出预览面板，既是展示也是回归用例 -->
        <div class="hero__preview" aria-label="组件预览">
          <ICard title="创建工作项" hoverable>
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
                <IButton variant="primary">提交</IButton>
              </div>
            </template>
          </ICard>
        </div>
      </div>
    </section>

    <!-- 设计价值观 -->
    <section class="i-container section">
      <h2 class="section__title">设计价值观</h2>
      <p class="section__desc i-lead">三条价值观贯穿每一次设计决策，也是评审组件是否合格的标尺。</p>
      <div class="values">
        <article v-for="value in values" :key="value.key" class="value">
          <span class="value__en">{{ value.en }}</span>
          <h3 class="value__title">{{ value.key }}</h3>
          <p>{{ value.desc }}</p>
        </article>
      </div>
    </section>

    <!-- 能力特性 -->
    <section class="section section--muted">
      <div class="i-container">
        <h2 class="section__title">为什么选择 Ignorance Design</h2>
        <div class="features">
          <ICard v-for="feature in features" :key="feature.title" :title="feature.title" hoverable>
            {{ feature.desc }}
          </ICard>
        </div>
      </div>
    </section>

    <!-- 快速上手 -->
    <section class="i-container section">
      <h2 class="section__title">三步接入</h2>
      <div class="steps">
        <div class="step">
          <span class="step__no">1</span>
          <h3>安装依赖</h3>
          <pre><code>npm install</code></pre>
        </div>
        <div class="step">
          <span class="step__no">2</span>
          <h3>引入令牌与组件</h3>
          <pre><code>import '@/styles/global.css'
import IDesign from '@/components'

app.use(IDesign)</code></pre>
        </div>
        <div class="step">
          <span class="step__no">3</span>
          <h3>直接使用</h3>
          <pre><code>&lt;IButton variant="primary"&gt;
  提交
&lt;/IButton&gt;</code></pre>
        </div>
      </div>
    </section>

    <section class="i-container">
      <div class="cta">
        <div>
          <h2>把设计决策沉淀成系统</h2>
          <p>浏览完整的令牌表与组件文档，或直接从组件示例开始。</p>
        </div>
        <RouterLink to="/design/tokens"><IButton variant="primary" size="lg">查看设计令牌</IButton></RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Hero */
.hero {
  padding: var(--i-spacing-24) 0 var(--i-spacing-20);
  background:
    radial-gradient(60% 80% at 15% 0%, var(--i-color-brand-subtle), transparent 70%),
    var(--i-color-bg);
}
.hero__inner {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: var(--i-spacing-16);
  align-items: center;
}
.hero__title {
  margin: var(--i-spacing-5) 0 var(--i-spacing-4);
  font-size: var(--i-font-size-5xl);
  letter-spacing: -0.02em;
}
.hero__title-accent { color: var(--i-color-brand); }
.hero__actions { display: flex; gap: var(--i-spacing-3); margin-top: var(--i-spacing-8); }
.hero__stats {
  display: flex;
  gap: var(--i-spacing-10);
  margin: var(--i-spacing-12) 0 0;
}
.hero__stats dt {
  font-size: var(--i-font-size-2xl);
  font-weight: 600;
  color: var(--i-color-text);
}
.hero__stats dd {
  margin: var(--i-spacing-1) 0 0;
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-tertiary);
}

.hero__preview { filter: drop-shadow(var(--i-shadow-xl)); }
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

/* 通用区块 */
.section { padding: var(--i-spacing-20) var(--i-spacing-6); }
.section--muted { background: var(--i-color-bg-subtle); }
.section__title { font-size: var(--i-font-size-3xl); margin-bottom: var(--i-spacing-3); }
.section__desc { margin-bottom: var(--i-spacing-10); }

.values {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--i-spacing-6);
}
.value {
  padding: var(--i-spacing-6);
  border-left: 2px solid var(--i-color-brand);
  background: var(--i-color-bg-subtle);
  border-radius: 0 var(--i-radius-lg) var(--i-radius-lg) 0;
}
.value__en {
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--i-color-brand);
}
.value__title { font-size: var(--i-font-size-xl); margin: var(--i-spacing-2) 0 var(--i-spacing-3); }
.value p { color: var(--i-color-text-secondary); }

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
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-lg);
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
.step pre {
  margin: 0;
  padding: var(--i-spacing-3);
  background: var(--i-color-bg-subtle);
  border-radius: var(--i-radius-md);
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
  overflow-x: auto;
}

.cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--i-spacing-6);
  padding: var(--i-spacing-12);
  border-radius: var(--i-radius-xl);
  background: linear-gradient(135deg, var(--i-color-brand), var(--i-color-brand-active));
  color: #fff;
}
.cta h2 { font-size: var(--i-font-size-2xl); }
.cta p { margin-top: var(--i-spacing-2); opacity: 0.85; }

@media (max-width: 960px) {
  .hero { padding-top: var(--i-spacing-16); }
  .hero__inner { grid-template-columns: 1fr; gap: var(--i-spacing-10); }
  .hero__title { font-size: var(--i-font-size-4xl); }
  .cta { padding: var(--i-spacing-8); }
}
</style>
