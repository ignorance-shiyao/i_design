<script setup lang="ts">
import { computed, ref } from 'vue'
import { componentCategories } from '@/data/components'
import { frameworks } from '@/data/frameworks'
import IButton from '@/components/IButton.vue'
import IIcon from '@/components/IIcon.vue'
import IInput from '@/components/IInput.vue'
import ISwitch from '@/components/ISwitch.vue'
import ITag from '@/components/ITag.vue'
import { message } from '@/components/message'

const keyword = ref('')
const autoAssign = ref(true)
const copied = ref(false)

const allComponents = computed(() => componentCategories.flatMap((category) => category.items))
const readyCount = computed(() => allComponents.value.filter((item) => item.status === 'ready').length)

const featuredCategories = computed(() =>
  componentCategories.slice(0, 8).map((category) => ({
    ...category,
    ready: category.items.filter((item) => item.status === 'ready').length,
    preview: category.items.filter((item) => item.status === 'ready').slice(0, 6)
  }))
)

const incidentRows = [
  { id: 'INC-1048', title: '核心交换链路抖动', level: 'P1', owner: '网络组', status: '处理中' },
  { id: 'INC-1047', title: 'API 网关错误率升高', level: 'P2', owner: '平台组', status: '观察中' },
  { id: 'INC-1046', title: '批处理任务执行超时', level: 'P2', owner: '数据组', status: '已恢复' }
]

async function copyInstall() {
  await navigator.clipboard?.writeText('npm i @i-design/vue-next')
  copied.value = true
  window.setTimeout(() => (copied.value = false), 1200)
}
</script>

<template>
  <main class="home">
    <section class="hero i-container">
      <div class="hero__eyebrow">
        <span class="hero__dot" />
        <span>OPEN SOURCE DESIGN SYSTEM</span>
        <span>v0.1.0</span>
      </div>

      <div class="hero__copy">
        <h1>让复杂产品，<br><span>保持同一种秩序。</span></h1>
        <p>
          面向企业中后台与智能体产品的跨端设计系统。组件、设计令牌和交互规则统一维护，
          让 Vue、React、小程序与 Flutter 共享同一套产品语言。
        </p>
      </div>

      <div class="hero__actions">
        <RouterLink to="/components">
          <IButton variant="primary" size="lg">浏览组件 <IIcon name="arrow-right" :size="16" /></IButton>
        </RouterLink>
        <RouterLink to="/design/tokens"><IButton size="lg">设计令牌</IButton></RouterLink>
      </div>

      <button class="install" type="button" @click="copyInstall">
        <span class="install__prompt">$</span>
        <code>npm i @i-design/vue-next</code>
        <span class="install__copy"><IIcon :name="copied ? 'check' : 'copy'" :size="14" />{{ copied ? '已复制' : '复制' }}</span>
      </button>

      <div class="runtime-row" aria-label="支持的技术栈">
        <span v-for="framework in frameworks" :key="framework.id">{{ framework.label }}</span>
      </div>
    </section>

    <section class="showcase-wrap">
      <div class="i-container showcase-section">
        <div class="showcase-section__meta">
          <span>01 / PRODUCT CONTEXT</span>
          <p>不做孤立 Demo。组件放回真实产品上下文里，才能看到层级、密度和状态是否成立。</p>
        </div>

        <div class="workspace">
          <aside class="workspace__side">
            <div class="workspace__brand"><span>i</span><strong>Ops Console</strong></div>
            <nav>
              <a class="is-active"><IIcon name="grid" :size="15" />概览</a>
              <a><IIcon name="warning-triangle" :size="15" />事件</a>
              <a><IIcon name="layers" :size="15" />资源</a>
              <a><IIcon name="code" :size="15" />自动化</a>
            </nav>
            <div class="workspace__side-foot">
              <span class="avatar">SY</span>
              <div><strong>管理员</strong><small>在线</small></div>
            </div>
          </aside>

          <div class="workspace__main">
            <header class="workspace__topbar">
              <div class="workspace__crumb"><span>工作台</span><i>/</i><strong>事件中心</strong></div>
              <div class="workspace__tools">
                <div class="workspace__search"><IIcon name="search" :size="14" /><IInput v-model="keyword" placeholder="搜索事件" /></div>
                <IButton variant="primary" @click="message.success('已创建事件')"><IIcon name="plus" :size="14" />新建事件</IButton>
              </div>
            </header>

            <div class="workspace__content">
              <div class="workspace__title-row">
                <div>
                  <span class="workspace__label">INCIDENT MANAGEMENT</span>
                  <h2>事件中心</h2>
                  <p>统一查看、分派并跟踪需要处理的异常事件。</p>
                </div>
                <div class="workspace__stats">
                  <div><strong>12</strong><span>处理中</span></div>
                  <div><strong>4</strong><span>高优先级</span></div>
                  <div><strong>96.2%</strong><span>SLA</span></div>
                </div>
              </div>

              <div class="workspace__toolbar">
                <div class="segmented"><button class="is-active">全部</button><button>处理中</button><button>已恢复</button></div>
                <div class="workspace__auto"><span>自动分派</span><ISwitch v-model="autoAssign" /></div>
              </div>

              <div class="incident-table">
                <div class="incident-table__head"><span>事件</span><span>级别</span><span>负责人</span><span>状态</span><span /></div>
                <div v-for="row in incidentRows" :key="row.id" class="incident-table__row">
                  <div><strong>{{ row.title }}</strong><small>{{ row.id }}</small></div>
                  <span><ITag :type="row.level === 'P1' ? 'warning' : 'default'">{{ row.level }}</ITag></span>
                  <span>{{ row.owner }}</span>
                  <span class="status"><i :class="{ 'is-done': row.status === '已恢复' }" />{{ row.status }}</span>
                  <button aria-label="更多操作"><IIcon name="more" :size="15" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="i-container component-section">
      <div class="section-heading">
        <span>02 / COMPONENTS</span>
        <div>
          <h2>{{ readyCount }} 个已实现组件，按任务组织。</h2>
          <p>先回答“用户要完成什么”，再决定使用哪个控件。</p>
        </div>
        <RouterLink to="/components">查看全部 <IIcon name="arrow-right" :size="14" /></RouterLink>
      </div>

      <div class="category-list">
        <article v-for="category in featuredCategories" :key="category.title" class="category-row">
          <div class="category-row__name"><strong>{{ category.title }}</strong><span>{{ category.ready }}/{{ category.items.length }}</span></div>
          <p>{{ category.desc }}</p>
          <div class="category-row__items">
            <RouterLink v-for="item in category.preview" :key="item.name" :to="item.to">{{ item.name }}<small>{{ item.cn }}</small></RouterLink>
          </div>
        </article>
      </div>
    </section>

    <section class="foundation">
      <div class="i-container foundation__inner">
        <div class="foundation__intro">
          <span>03 / FOUNDATION</span>
          <h2>稳定感来自约束，<br>不是装饰。</h2>
          <p>视觉只是结果。底层由同一份 Token、同一套交互规则和自动化校验共同约束。</p>
          <RouterLink to="/design/values">查看设计原则 <IIcon name="arrow-right" :size="14" /></RouterLink>
        </div>

        <div class="foundation__detail">
          <div class="foundation-row">
            <span>01</span>
            <div><strong>Semantic tokens</strong><p>组件不直接写业务色值，主题切换与品牌适配只覆盖语义层。</p></div>
            <div class="swatches"><i /><i /><i /><i /><i /></div>
          </div>
          <div class="foundation-row">
            <span>02</span>
            <div><strong>Interaction rules</strong><p>复杂行为收敛成独立规则，框架层只负责渲染和事件适配。</p></div>
            <code>logic → renderer</code>
          </div>
          <div class="foundation-row">
            <span>03</span>
            <div><strong>Cross-platform parity</strong><p>构建阶段逐值验证核心表现，差异进入 CI，而不是留给用户发现。</p></div>
            <code>7 runtimes</code>
          </div>
        </div>
      </div>
    </section>

    <section class="i-container closing">
      <span>iDESIGN</span>
      <h2>从真实业务页面开始使用。</h2>
      <p>组件、文档、Token 和跨端实现都在同一套体系里。</p>
      <div><RouterLink to="/components"><IButton variant="primary" size="lg">进入组件库</IButton></RouterLink><a href="https://github.com/ignorance-shiyao/i_design" target="_blank" rel="noreferrer"><IButton size="lg"><IIcon name="github" :size="15" />GitHub</IButton></a></div>
    </section>
  </main>
</template>

<style scoped>
.home { overflow: clip; }
.hero { padding-top: 104px; padding-bottom: 76px; }
.hero__eyebrow { display:flex; align-items:center; gap:12px; color:var(--i-color-text-tertiary); font:500 10px/1 var(--i-font-family-mono); letter-spacing:.12em; }
.hero__dot { width:7px; height:7px; border-radius:50%; background:var(--i-color-brand); }
.hero__eyebrow span:last-child { margin-left:auto; }
.hero__copy { max-width:980px; margin-top:44px; }
.hero h1 { margin:0; font-size:clamp(58px,8vw,112px); line-height:.98; letter-spacing:-.07em; font-weight:620; }
.hero h1 span { color:var(--i-color-text-tertiary); }
.hero__copy p { max-width:720px; margin:30px 0 0; color:var(--i-color-text-secondary); font-size:18px; line-height:1.8; }
.hero__actions { display:flex; gap:10px; margin-top:32px; }
.install { width:min(620px,100%); margin-top:46px; display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:12px; min-height:50px; padding:0 14px; border:1px solid var(--i-color-hairline); border-radius:10px; background:var(--i-color-bg-elevated); color:var(--i-color-text-secondary); cursor:pointer; text-align:left; }
.install:hover { border-color:var(--i-color-border); }
.install__prompt { color:var(--i-color-brand); font-family:var(--i-font-family-mono); }
.install code { font:500 12px/1 var(--i-font-family-mono); color:var(--i-color-text); }
.install__copy { display:flex; align-items:center; gap:6px; color:var(--i-color-text-tertiary); font-size:11px; }
.runtime-row { display:flex; flex-wrap:wrap; gap:8px 18px; margin-top:18px; color:var(--i-color-text-tertiary); font:500 10px/1.5 var(--i-font-family-mono); }
.runtime-row span + span::before { content:'·'; margin-right:18px; color:var(--i-color-border); }

.showcase-wrap { border-top:1px solid var(--i-color-hairline); border-bottom:1px solid var(--i-color-hairline); background:var(--i-color-bg-subtle); }
.showcase-section { padding-top:72px; padding-bottom:88px; }
.showcase-section__meta { display:grid; grid-template-columns:220px 1fr; gap:32px; margin-bottom:24px; color:var(--i-color-text-tertiary); }
.showcase-section__meta > span, .section-heading > span, .foundation__intro > span, .closing > span { font:500 10px/1 var(--i-font-family-mono); letter-spacing:.12em; color:var(--i-color-text-tertiary); }
.showcase-section__meta p { margin:0; max-width:650px; font-size:12px; line-height:1.65; }
.workspace { display:grid; grid-template-columns:180px minmax(0,1fr); min-height:620px; overflow:hidden; border:1px solid var(--i-color-border); border-radius:12px; background:var(--i-color-bg-elevated); box-shadow:0 18px 50px color-mix(in srgb,#000 8%,transparent); }
.workspace__side { display:flex; flex-direction:column; padding:18px 12px 14px; border-right:1px solid var(--i-color-hairline); background:var(--i-color-bg); }
.workspace__brand { display:flex; align-items:center; gap:9px; padding:0 8px 18px; font-size:12px; }
.workspace__brand > span { display:grid; place-items:center; width:22px; height:22px; border-radius:6px; background:var(--i-color-text); color:var(--i-color-bg); font:700 12px/1 var(--i-font-family-mono); }
.workspace__side nav { display:grid; gap:3px; }
.workspace__side nav a { display:flex; align-items:center; gap:9px; padding:9px 10px; border-radius:7px; color:var(--i-color-text-tertiary); font-size:11px; }
.workspace__side nav a.is-active { background:var(--i-color-bg-subtle); color:var(--i-color-text); font-weight:550; }
.workspace__side-foot { margin-top:auto; display:flex; align-items:center; gap:8px; padding:12px 8px 0; border-top:1px solid var(--i-color-hairline); }
.avatar { display:grid; place-items:center; width:28px; height:28px; border-radius:50%; background:var(--i-color-brand-subtle); color:var(--i-color-brand); font:600 9px/1 var(--i-font-family-mono); }
.workspace__side-foot div { display:grid; gap:2px; }
.workspace__side-foot strong { font-size:10px; }.workspace__side-foot small { color:var(--i-color-text-tertiary); font-size:9px; }
.workspace__main { min-width:0; }
.workspace__topbar { display:flex; align-items:center; justify-content:space-between; gap:18px; min-height:58px; padding:0 20px; border-bottom:1px solid var(--i-color-hairline); }
.workspace__crumb { display:flex; gap:8px; align-items:center; font-size:10px; color:var(--i-color-text-tertiary); }.workspace__crumb strong { color:var(--i-color-text-secondary); }.workspace__crumb i { font-style:normal; }
.workspace__tools { display:flex; align-items:center; gap:8px; }.workspace__search { position:relative; width:190px; }.workspace__search > :deep(svg) { position:absolute; z-index:1; left:10px; top:50%; transform:translateY(-50%); color:var(--i-color-text-tertiary); }.workspace__search :deep(input) { padding-left:32px; }
.workspace__content { padding:34px 34px 40px; }
.workspace__title-row { display:flex; align-items:end; justify-content:space-between; gap:30px; }
.workspace__label { color:var(--i-color-brand); font:500 9px/1 var(--i-font-family-mono); letter-spacing:.1em; }.workspace__title-row h2 { margin:8px 0 0; font-size:30px; letter-spacing:-.04em; }.workspace__title-row p { margin:7px 0 0; color:var(--i-color-text-tertiary); font-size:11px; }
.workspace__stats { display:flex; border-left:1px solid var(--i-color-hairline); }.workspace__stats div { display:grid; gap:4px; min-width:82px; padding-left:18px; }.workspace__stats strong { font:600 17px/1 var(--i-font-family-mono); }.workspace__stats span { color:var(--i-color-text-tertiary); font-size:9px; }
.workspace__toolbar { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:30px; padding:12px 0; border-top:1px solid var(--i-color-hairline); }
.segmented { display:inline-flex; gap:2px; padding:3px; border-radius:8px; background:var(--i-color-bg-subtle); }.segmented button { padding:6px 10px; border:0; border-radius:6px; background:transparent; color:var(--i-color-text-tertiary); font-size:10px; cursor:pointer; }.segmented button.is-active { background:var(--i-color-bg-elevated); color:var(--i-color-text); box-shadow:var(--i-shadow-sm); }
.workspace__auto { display:flex; align-items:center; gap:8px; color:var(--i-color-text-secondary); font-size:10px; }
.incident-table { border-top:1px solid var(--i-color-hairline); }
.incident-table__head,.incident-table__row { display:grid; grid-template-columns:minmax(240px,1.4fr) 80px 100px 100px 24px; gap:14px; align-items:center; min-height:48px; border-bottom:1px solid var(--i-color-hairline); }
.incident-table__head { min-height:38px; color:var(--i-color-text-tertiary); font-size:9px; }.incident-table__row { color:var(--i-color-text-secondary); font-size:10px; }.incident-table__row > div:first-child { display:grid; gap:3px; }.incident-table__row strong { color:var(--i-color-text); font-size:10px; }.incident-table__row small { color:var(--i-color-text-tertiary); font:500 9px/1 var(--i-font-family-mono); }
.status { display:flex; align-items:center; gap:7px; }.status i { width:6px; height:6px; border-radius:50%; background:#e29c32; }.status i.is-done { background:#28a86b; }.incident-table__row > button { display:grid; place-items:center; width:24px; height:24px; border:0; border-radius:6px; background:transparent; color:var(--i-color-text-tertiary); cursor:pointer; }.incident-table__row > button:hover { background:var(--i-color-bg-subtle); color:var(--i-color-text); }

.component-section { padding-top:112px; padding-bottom:112px; }
.section-heading { display:grid; grid-template-columns:180px minmax(0,1fr) auto; gap:36px; align-items:end; margin-bottom:42px; }.section-heading h2 { margin:0; font-size:clamp(34px,4vw,52px); line-height:1.08; letter-spacing:-.05em; }.section-heading p { margin:12px 0 0; color:var(--i-color-text-secondary); }.section-heading > a,.foundation__intro > a { display:inline-flex; align-items:center; gap:6px; color:var(--i-color-brand); font-size:12px; }
.category-list { border-top:1px solid var(--i-color-border); }
.category-row { display:grid; grid-template-columns:180px 230px minmax(0,1fr); gap:36px; align-items:start; padding:26px 0; border-bottom:1px solid var(--i-color-hairline); }.category-row__name { display:flex; align-items:center; justify-content:space-between; gap:10px; }.category-row__name strong { font-size:14px; }.category-row__name span { color:var(--i-color-text-tertiary); font:500 9px/1 var(--i-font-family-mono); }.category-row > p { margin:0; color:var(--i-color-text-tertiary); font-size:11px; line-height:1.6; }.category-row__items { display:flex; flex-wrap:wrap; gap:7px; }.category-row__items a { display:inline-flex; align-items:center; gap:6px; padding:7px 9px; border-radius:7px; background:var(--i-color-bg-subtle); color:var(--i-color-text-secondary); font-size:10px; }.category-row__items a:hover { background:var(--i-color-brand-subtle); color:var(--i-color-brand); }.category-row__items small { color:var(--i-color-text-tertiary); }

.foundation { border-top:1px solid var(--i-color-hairline); border-bottom:1px solid var(--i-color-hairline); background:var(--i-color-bg-subtle); }.foundation__inner { display:grid; grid-template-columns:minmax(300px,.72fr) minmax(0,1fr); gap:100px; padding-top:112px; padding-bottom:112px; }.foundation__intro h2 { margin:24px 0 0; font-size:clamp(42px,5vw,68px); line-height:1.02; letter-spacing:-.055em; }.foundation__intro p { max-width:470px; margin:20px 0 0; color:var(--i-color-text-secondary); line-height:1.75; }.foundation__intro > a { margin-top:26px; }
.foundation__detail { border-top:1px solid var(--i-color-border); }.foundation-row { display:grid; grid-template-columns:34px 1fr auto; gap:18px; align-items:center; min-height:146px; border-bottom:1px solid var(--i-color-hairline); }.foundation-row > span { align-self:start; padding-top:31px; color:var(--i-color-text-tertiary); font:500 9px/1 var(--i-font-family-mono); }.foundation-row strong { font-size:15px; }.foundation-row p { max-width:500px; margin:8px 0 0; color:var(--i-color-text-secondary); font-size:11px; line-height:1.65; }.foundation-row code { color:var(--i-color-text-tertiary); font:500 10px/1 var(--i-font-family-mono); }.swatches { display:flex; }.swatches i { width:28px; height:28px; margin-left:-5px; border:3px solid var(--i-color-bg-subtle); border-radius:50%; background:var(--i-color-brand); }.swatches i:nth-child(2){opacity:.78}.swatches i:nth-child(3){opacity:.56}.swatches i:nth-child(4){opacity:.34}.swatches i:nth-child(5){opacity:.16}

.closing { padding-top:104px; padding-bottom:112px; text-align:center; }.closing h2 { margin:18px 0 0; font-size:clamp(38px,5vw,64px); letter-spacing:-.055em; }.closing p { margin:14px 0 0; color:var(--i-color-text-secondary); }.closing > div { display:flex; justify-content:center; gap:10px; margin-top:28px; }

@media (max-width:980px) {
  .hero { padding-top:82px; }.workspace { grid-template-columns:1fr; }.workspace__side { display:none; }.workspace__content { padding:28px 24px 32px; }.section-heading { grid-template-columns:1fr; gap:14px; }.category-row { grid-template-columns:160px 1fr; }.category-row__items { grid-column:2; }.foundation__inner { grid-template-columns:1fr; gap:52px; }.showcase-section__meta { grid-template-columns:1fr; gap:10px; }
}
@media (max-width:720px) {
  .hero { padding-top:64px; padding-bottom:58px; }.hero h1 { font-size:clamp(52px,15vw,78px); }.hero__copy p { font-size:16px; }.hero__actions { flex-wrap:wrap; }.runtime-row { display:none; }.workspace { min-height:0; border-radius:10px; }.workspace__topbar { align-items:flex-start; flex-direction:column; padding:14px; }.workspace__tools { width:100%; }.workspace__search { flex:1; width:auto; }.workspace__content { padding:24px 16px; }.workspace__title-row { align-items:flex-start; flex-direction:column; }.workspace__stats { width:100%; border-left:0; border-top:1px solid var(--i-color-hairline); padding-top:14px; }.workspace__stats div { flex:1; min-width:0; padding-left:0; }.workspace__toolbar { align-items:flex-start; flex-direction:column; }.incident-table__head { display:none; }.incident-table__row { grid-template-columns:1fr auto; gap:10px; padding:12px 0; }.incident-table__row > span:nth-of-type(2),.incident-table__row > span:nth-of-type(3),.incident-table__row > button { display:none; }.component-section,.foundation__inner { padding-top:78px; padding-bottom:78px; }.category-row { grid-template-columns:1fr; gap:12px; }.category-row__items { grid-column:auto; }.foundation-row { grid-template-columns:28px 1fr; }.foundation-row > :last-child { grid-column:2; justify-self:start; }.closing { padding-top:78px; padding-bottom:86px; }
}
</style>
