<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTilt } from '@/composables/useTilt'
import ValueCube from '@/site/ValueCube.vue'
import IButton from '@/components/IButton.vue'
import IInput from '@/components/IInput.vue'
import ICard from '@/components/ICard.vue'
import ITag from '@/components/ITag.vue'
import IAlert from '@/components/IAlert.vue'
import ISwitch from '@/components/ISwitch.vue'
import { componentCategories } from '@/data/components'
import { useTheme } from '@/composables/useTheme'
import { heroIllustrations } from '@i-design/common'
import CodeBlock from '@/site/CodeBlock.vue'
import IIcon from '@/components/IIcon.vue'
import ISteps from '@/components/ISteps.vue'
import ILoading from '@/components/ILoading.vue'
import { message } from '@/components/message'
import { frameworks } from '@/data/frameworks'

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

/*
 * 这一组讲的是「靠什么保证不跑偏」，而不是「我们有多好」。
 * 每条都对应仓库里一个具体的机制，读者可以去代码里核对。
 */
const guards = [
  {
    icon: 'layers',
    title: '令牌只有一份',
    desc: 'CSS 变量、WXSS 变量与 Dart 常量都由同一份令牌编译产出。任何一端想改颜色，都得回到那份定义。'
  },
  {
    icon: 'code',
    title: '交互规则是纯函数',
    desc: '翻页判定、浮层避让、树的半选推导写成不依赖框架的函数，各端只负责渲染，不重新解释一遍规则。'
  },
  {
    icon: 'check-circle',
    title: '一致性由测试兜底',
    desc: '跨端期望值由同一份实现算出，逐值比对。「两端表现不同」会让构建失败，而不是等用户发现。'
  },
  {
    icon: 'palette',
    title: '换肤不改组件',
    desc: '组件只引用语义令牌，不写死色值。深色模式与品牌换肤都只覆盖语义层，业务代码零改动。'
  }
] as const

const { theme } = useTheme()
// 插画有明暗两版，跟随主题切换而不是靠滤镜硬套
const hero = computed(() =>
  theme.value === 'dark'
    ? heroIllustrations.dark
    : heroIllustrations.light
)

/*
 * Hero 预览卡随指针轻微倾斜，插画层浮在卡片之前形成纵深。
 * 角度压到 3 度：再大就从「有厚度」变成「在耍花样」，
 * 而首屏承载的是「这套体系长什么样」，不是特效演示。
 */
const preview = ref<HTMLElement | null>(null)
useTilt(preview, { max: 3 })

const usageSnippet = `<IButton variant="primary">
  提交
</IButton>`

const previewSteps = [{ title: '基本信息' }, { title: '关联迭代' }, { title: '确认' }]

const demoInput = ref('')
const demoSwitch = ref(true)

/*
 * 立方体转到读者正在看的那一条价值观上。
 * 键盘同样要能驱动它——只挂 hover 的话，用 Tab 浏览的人看到的是一个不动的方块。
 */
/*
 * 首页每类只列前几项。
 *
 * 首页是「先看看这是什么」，不是查手册：一列 19 项、另一列 4 项，
 * 高矮相差五倍，读者既数不完也对不齐。完整清单在组件总览里，那里才需要穷举。
 */
const COVERAGE_PREVIEW = 6

const activeValue = ref(-1)
const cubeFaces = [
  ...values.map((v) => ({ key: v.key, en: v.en })),
  { key: '一致', en: 'Consistent' }
]
</script>

<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="i-container hero__inner">
        <div class="hero__text">
          <ITag type="brand" round>v0.1.0 · 开源设计体系</ITag>
          <!--
            两行是写死的，不交给 text-wrap 平衡。
            自动断行会把「一次决策落到每个端」从中间劈开，行尾留一个孤零零的「一」——
            中文标题断错位置比断得不匀难看得多，而这句的语义分界本来就在这里。
          -->
          <h1 class="hero__title">
            中后台设计体系
            <span class="hero__title-accent">一次决策，落到每个端</span>
          </h1>
          <!--
            中文没有连字符，长句换行会从词中间断开（「渲染适配」被劈成两行）。
            与其加断行控制，不如把句子写短——一句话说完的事不必写成三句。
          -->
          <p class="hero__desc i-lead">
            令牌、图标与交互规则只写一份，Web、小程序、移动端与 Flutter 只做渲染适配。
            换一个主色，各端同时生效。
          </p>
          <div class="hero__actions">
            <RouterLink to="/components">
              <IButton variant="primary" size="lg">开始使用<IIcon name="arrow-right" :size="16" /></IButton>
            </RouterLink>
            <RouterLink to="/design/values"><IButton size="lg">设计价值观</IButton></RouterLink>
          </div>
          <ul class="hero__facts">
            <li><IIcon name="layers" :size="16" /><span>令牌是唯一数据源</span></li>
            <li><IIcon name="palette" :size="16" /><span>换肤只改语义层</span></li>
            <li><IIcon name="code" :size="16" /><span>跨端行为逐值比对</span></li>
            <li><IIcon name="check-circle" :size="16" /><span>对比度与键盘可达经校验</span></li>
          </ul>
        </div>

        <!-- 用组件本身搭出预览面板，既是展示也是回归用例 -->
        <div ref="preview" class="hero__preview" aria-label="组件预览">
          <img
            class="hero__art i-tilt__layer"
            style="--i-layer-depth: 24"
            :src="hero.src"
            :srcset="hero.srcset"
            width="600"
            alt=""
            fetchpriority="high"
          />
          <ICard class="i-tilt__layer" style="--i-layer-depth: 10" title="创建工作项" hoverable>
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
        <ValueCube :size="200" :active="activeValue" :faces="cubeFaces" />
        <div class="values i-stagger">
          <article
            v-for="(value, index) in values"
            :key="value.key"
            v-reveal:left
            class="value"
            tabindex="0"
            @mouseenter="activeValue = index"
            @focusin="activeValue = index"
            @mouseleave="activeValue = -1"
            @focusout="activeValue = -1"
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
        <span class="i-eyebrow">How</span>
        <h2 class="section__title">靠什么保证不跑偏</h2>
        <p class="section__desc i-lead">
          跨端体系最容易烂在「哪一端偷偷改了一点」。下面四条都是仓库里的具体机制，
          可以直接去代码里核对。
        </p>
        <div class="features i-stagger">
          <ICard
            v-for="(feature, index) in guards"
            :key="feature.title"
            v-reveal:depth
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
        按中后台的真实使用场景分类，而不是按实现难度。标为规划中的是该有、但还没做到可用的——
        把边界写出来，比让人在文档里反复搜一个不存在的组件要好。
      </p>
      <div class="coverage i-stagger">
        <div
          v-for="(category, index) in componentCategories"
          :key="category.title"
          v-reveal
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
              v-for="item in category.items.slice(0, COVERAGE_PREVIEW)"
              :key="item.name"
              :class="{ 'is-planned': item.status === 'planned' }"
            >
              <RouterLink v-if="item.status === 'ready'" :to="item.to">{{ item.name }}</RouterLink>
              <span v-else>{{ item.name }}</span>
            </li>
            <li v-if="category.items.length > COVERAGE_PREVIEW" class="coverage__more">
              <RouterLink to="/components">还有 {{ category.items.length - COVERAGE_PREVIEW }} 个</RouterLink>
            </li>
          </ul>
        </div>
      </div>
      <p class="coverage__legend">
        <span class="dot" /> 已实现
        <span class="dot dot--planned" /> 规划中
      </p>
    </section>

    <!-- 跨端 -->
    <section class="section section--muted">
      <div class="i-container">
        <span class="i-eyebrow">Cross-platform</span>
        <h2 class="section__title">你的技术栈在里面</h2>
        <p class="section__desc i-lead">
          各端不是「移植版」，而是同一份令牌与规则的不同渲染层。
          因此不必为某一端单独维护一套设计稿，也不会出现「Web 上是这样，小程序上不是」。
        </p>
        <div class="stacks i-stagger">
          <RouterLink
            v-for="(f, index) in frameworks"
            :key="f.id"
            v-reveal
            class="stack"
            to="/design/cross-platform"
          >
            <span class="stack__label">{{ f.label }}</span>
            <span class="stack__runtime">{{ f.runtime }}</span>
          </RouterLink>
        </div>
        <p class="stacks__foot">
          <RouterLink to="/design/cross-platform">看同一个组件在各端怎么写 →</RouterLink>
        </p>
      </div>
    </section>

    <!-- 快速上手 -->
    <section class="i-container section">
      <span class="i-eyebrow">Get started</span>
      <h2 class="section__title">三步接入</h2>
      <!--
        第一步写清楚是 clone 而不是 npm install。
        包还没发到 npm，只写「npm install」对外部使用者是一条执行不了的指令——
        照着做失败一次，人就走了。没发布就直说没发布。
      -->
      <p class="section__desc i-lead">
        还没有发到 npm，先克隆仓库使用；令牌与组件都在 <code>packages/</code> 下，可以整包引，也可以只取需要的那几个。
      </p>
      <div class="steps i-stagger">
        <div v-reveal:depth class="step i-lift">
          <span class="step__no">1</span>
          <h3>取得代码</h3>
          <CodeBlock
            lang="bash"
            :copyable="false"
            code="git clone https://github.com/ignorance-shiyao/i_design
cd i_design && npm install"
          />
        </div>
        <div v-reveal:depth class="step i-lift">
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
        <div v-reveal:depth class="step i-lift">
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
          <h2>从令牌开始读</h2>
          <p>令牌表是这套体系的地基，组件的每一个取值都能在那里找到出处。</p>
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
/*
 * 首屏收紧一点：原先上下各留 80/64px，加上插画与预览卡纵向叠起来，
 * 1440×900 的屏上卡片会被折线切掉一截——首屏露出半张卡，
 * 观感上就是「没做完」，而不是「下面还有」。
 */
.hero {
  position: relative;
  padding: var(--i-spacing-12) 0;
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
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--i-spacing-12);
  align-items: center;
}
.hero__title {
  margin: var(--i-spacing-5) 0 var(--i-spacing-4);
  font-size: var(--i-font-size-5xl);
  letter-spacing: -0.02em;
  line-height: 1.18;
}
/* 副句独占一行：语义分界在这里，断行也该在这里 */
.hero__title-accent {
  display: block;
  color: var(--i-color-brand);
}
.hero__actions { display: flex; gap: var(--i-spacing-3); margin-top: var(--i-spacing-8); }
.hero__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: var(--i-spacing-3) var(--i-spacing-6);
  margin: var(--i-spacing-8) 0 0;
  padding: 0;
  list-style: none;
}
.hero__facts li {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-2);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
}
.hero__facts svg { color: var(--i-color-brand); flex: none; }

/*
 * 插画收小并右对齐，让它退成陪衬。
 *
 * 首屏真正该被看见的是右边那张用组件本身搭出来的卡片——它同时是展示与回归用例。
 * 插画铺满一整列时，读者第一眼落在插画上，而插画说明不了这套体系能做什么。
 */
.hero__art {
  display: block;
  width: 100%;
  max-width: 340px;
  height: auto;
  margin: 0 0 calc(var(--i-spacing-4) * -1) auto;
}
.hero__preview {
  filter: drop-shadow(var(--i-shadow-xl));
  /* 时长与「不超过 320ms」这条价值观对齐；曲线用 easing-out，进场要快进慢停 */
  animation: hero-float var(--i-motion-slow) var(--i-motion-easing-out) both;
}
@keyframes hero-float {
  from { opacity: 0; transform: translateY(8px); }
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
  gap: var(--i-spacing-8) var(--i-spacing-6);
  margin-top: var(--i-spacing-8);
  align-items: start;
}
.coverage__more a {
  color: var(--i-color-text-tertiary);
  font-size: var(--i-font-size-sm);
}
.coverage__more a:hover { color: var(--i-color-brand); }
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
.stacks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--i-spacing-3);
}
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--i-spacing-1);
  padding: var(--i-spacing-5) var(--i-spacing-4);
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-lg);
  background: var(--i-color-bg-elevated);
  text-decoration: none;
  transition: transform var(--i-motion-base) var(--i-motion-easing),
    box-shadow var(--i-motion-base) var(--i-motion-easing),
    border-color var(--i-motion-fast) var(--i-motion-easing);
}
.stack:hover {
  transform: translateY(-3px);
  border-color: var(--i-color-brand);
  box-shadow: var(--i-shadow-md);
}
.stack__label {
  font-size: var(--i-font-size-lg);
  font-weight: 600;
  color: var(--i-color-text);
}
.stack__runtime { font-size: var(--i-font-size-xs); color: var(--i-color-text-tertiary); }
.stacks__foot { margin-top: var(--i-spacing-6); font-size: var(--i-font-size-md); }
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
  background: var(--i-color-bg-elevated);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-xl);
  box-shadow: var(--i-shadow-sm);
  overflow: hidden;
  transition: box-shadow var(--i-motion-base) var(--i-motion-easing),
    transform var(--i-motion-base) var(--i-motion-easing);
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
  background: var(--i-color-brand);
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
  .hero__facts { grid-template-columns: 1fr; gap: var(--i-spacing-3); }
  .cta { padding: var(--i-spacing-8); }
}
</style>
