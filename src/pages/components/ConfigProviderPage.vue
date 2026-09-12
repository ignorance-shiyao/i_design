<script setup lang="ts">
import { ref } from 'vue'
import { enUS, zhCN, type Locale } from '@i-design/common'
import IConfigProvider from '@/components/IConfigProvider.vue'
import ISelect from '@/components/ISelect.vue'
import IEmpty from '@/components/IEmpty.vue'
import IPagination from '@/components/IPagination.vue'
import ISegmented from '@/components/ISegmented.vue'
import ICascader from '@/components/ICascader.vue'
import IDatePicker from '@/components/IDatePicker.vue'
import IPopconfirm from '@/components/IPopconfirm.vue'
import IButton from '@/components/IButton.vue'
import ITypography from '@/components/ITypography.vue'
import IChartPie from '@/components/IChartPie.vue'
import IChatMessage from '@/components/IChatMessage.vue'
import IApprovalCard from '@/components/IApprovalCard.vue'
import IInput from '@/components/IInput.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const lang = ref<'zh' | 'en'>('zh')
const langs = [
  { label: '中文', value: 'zh' },
  { label: 'English', value: 'en' }
]
const base = ref<Locale>(zhCN)
function onLang(value: string | number) {
  base.value = value === 'en' ? enUS : zhCN
}

const size = ref<'sm' | 'md' | 'lg'>('lg')
const sizes = [
  { label: 'sm', value: 'sm' },
  { label: 'md', value: 'md' },
  { label: 'lg', value: 'lg' }
]

/* 给「换一种语言」示例用：验证图表、AI 与逐题确认三类也跟着字典走 */
const pieItems = [
  { name: 'A', value: 40 },
  { name: 'B', value: 60 }
]
const approvalQuestions = [
  { id: 'scope', title: '这次改动要包含测试吗？', options: [{ value: 'yes', label: '要' }], skippable: true, allowCustom: true }
]

const page = ref(2)
const picked = ref<string | number | null>(null)
</script>

<template>
  <article>
    <h1>ConfigProvider 全局配置</h1>
    <p class="i-lead">
      包住一棵子树，里面的组件就用这里给的文案字典与默认尺寸。组件里那些用户看得见的固定字——「暂无数据」「加载中…」「共 12 条」——不再写死在各端各处。
    </p>

    <DemoBlock
      title="统一尺寸"
      description="没有自己写 size 的表单控件跟随这里的设置；写了的以自己的为准——全局配置是兜底，不是强制。"
      lang="vue"
      code='<IConfigProvider size="lg">
  <IInput placeholder="跟随全局" />
  <ISelect :options="options" />
  <IButton>跟随全局</IButton>
  <IButton size="sm">我自己定了 sm</IButton>
</IConfigProvider>'
    >
      <div class="cfg-size">
        <ISegmented :model-value="size" :options="sizes" @update:model-value="size = $event as 'sm' | 'md' | 'lg'" />
        <IConfigProvider :size="size">
          <div class="cfg-size__row">
            <IInput placeholder="跟随全局" />
            <ISelect :options="[{ label: '需求', value: 'requirement' }]" />
            <IButton>跟随全局</IButton>
            <IButton size="sm">我自己定了 sm</IButton>
          </div>
        </IConfigProvider>
      </div>
    </DemoBlock>

    <DemoBlock
      title="换一种语言"
      description="下面这几个组件没有传任何文案属性，它们的字全部来自字典。切换语言时空态、占位、分页文案会一起变。"
      code='<IConfigProvider :base="enUS">
  <ISelect :options="options" />
  <IEmpty />
</IConfigProvider>'
    >
      <div class="cp-demo">
        <ISegmented :model-value="lang" :options="langs" @change="onLang" />
        <IConfigProvider :base="base">
          <div class="cp-demo__grid">
            <ISelect v-model="picked" :options="[]" clearable />
            <IPagination v-model="page" :total="95" :page-size="10" show-total />
            <ICascader :data="[]" />
            <IDatePicker />
            <IPopconfirm title="确认执行该操作？">
              <IButton size="sm">气泡确认</IButton>
            </IPopconfirm>
            <ITypography :ellipsis="2" expandable>
              可展开的多行省略：展开与收起两个字也来自字典，换语言时不会剩下一个中文按钮。这段文字要足够长才会被截断，因此再补上一句凑够两行以上的篇幅。
            </ITypography>
            <IEmpty size="sm" type="search" />
          </div>

          <!--
            图表、AI 与逐题确认这三类也接了字典。
            它们以前各自写死中文，换语言后会是整页里唯一还在说中文的地方。
          -->
          <div class="cp-demo__grid">
            <IChartPie :items="pieItems" :height="150" />
            <IChatMessage role="assistant" :actions="['regenerate']">生成的一段答复。</IChatMessage>
            <IApprovalCard :questions="approvalQuestions" />
          </div>
        </IConfigProvider>
      </div>
    </DemoBlock>

    <DemoBlock
      title="只改其中几句"
      description="缺的键沿用基准字典，不会显示成空串或键名。接入方十有八九只想改两三句话，不该逼他们抄一整份字典，也不该因为抄漏了一个键就在界面上开天窗。"
      code="<IConfigProvider :locale=&quot;{ empty: '这个筛选条件下没有工单' }&quot;>
  <IEmpty />
</IConfigProvider>"
    >
      <IConfigProvider :locale="{ empty: '这个筛选条件下没有工单' }">
        <div class="cp-demo__grid">
          <ISelect :options="[]" />
          <IEmpty size="sm" />
        </div>
      </IConfigProvider>
    </DemoBlock>

    <h2>为什么用上下文而不是全局单例</h2>
    <p>
      同一个页面里可能嵌着一块另一种语言的内容——英文合同原文旁边配中文说明。单例表达不了「这一块用另一份字典」。嵌套时内层覆盖外层，这正是上下文天然的行为。
    </p>
    <p>
      组件自己传了属性就以自己的为准：<code>placeholder</code>、<code>emptyText</code>这些仍然优先于字典。字典是兜底，不是强制。
    </p>
    <p>
      这个组件不额外包一层元素：配置是纯粹的上下文，多出来的 <code>div</code>会打断 flex / grid 的父子关系，接上去才发现布局塌了。
    </p>

    <h2>各端差异</h2>
    <p>
      Vue 与 React 用上下文、Flutter 用 <code>InheritedWidget</code>，三者都支持嵌套覆盖。小程序没有上下文机制，配置落在模块级的 <code>setLocale()</code>，代价是表达不了「页面里这一块换另一种语言」——需要局部覆盖时给那几个组件单独传属性。这是平台限制，不是取舍。
    </p>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>只是想改某一处的文案时——直接给那个组件传属性，为一句话套一层全局配置，后面的人会找不到它从哪来。</li>
      <li>想用它做主题切换时——主题走的是令牌与 data-theme，这里管的是文案字典与默认尺寸。</li>
      <li>在组件树之外调用命令式方法（message、confirm）时——它们不在这棵树里，配置要单独设一次。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>locale</td><td><code>Partial&lt;Locale&gt;</code></td><td><code>{}</code></td><td>只写要改的那几句；缺的沿用基准字典</td></tr>
        <tr><td>base</td><td><code>Locale</code></td><td><code>zhCN</code></td><td>基准字典，另有 <code>enUS</code></td></tr>
        <tr><td>size</td><td><code>sm | md | lg</code></td><td><code>md</code></td><td>表单类组件的默认尺寸</td></tr>
      </tbody>
    </table>

    <h2>字典里有什么</h2>
    <table class="i-table">
      <thead><tr><th>键</th><th>中文</th><th>English</th></tr></thead>
      <tbody>
        <tr v-for="key in ['empty', 'emptyContent', 'loading', 'loadFailed', 'noMore', 'placeholder', 'noMatch', 'confirm', 'cancel', 'expand', 'collapse', 'required']" :key="key">
          <td><code>{{ key }}</code></td>
          <td>{{ (zhCN as unknown as Record<string, string>)[key] }}</td>
          <td>{{ (enUS as unknown as Record<string, string>)[key] }}</td>
        </tr>
        <tr>
          <td><code>rangeText</code></td>
          <td>{{ zhCN.rangeText(11, 20, 95) }}</td>
          <td>{{ enUS.rangeText(11, 20, 95) }}</td>
        </tr>
        <tr>
          <td><code>emptyPresets</code></td>
          <td>{{ zhCN.emptyPresets.search.title }}</td>
          <td>{{ enUS.emptyPresets.search.title }}</td>
        </tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.cfg-size {
  display: flex;
  flex-direction: column;
  gap: var(--i-spacing-5);
  align-items: flex-start;
}
.cfg-size__row {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-3);
  flex-wrap: wrap;
}
</style>

<style scoped>
.cp-demo {
  display: flex;
  flex-direction: column;
  gap: var(--i-spacing-5);
}
.cp-demo__grid {
  display: flex;
  flex-direction: column;
  gap: var(--i-spacing-5);
  align-items: flex-start;
  max-width: 420px;
}
</style>
