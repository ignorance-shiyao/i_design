<script setup lang="ts">
import { ref } from 'vue'
import ISelect, { type SelectOption } from '@/components/ISelect.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import Playground from '@/site/Playground.vue'
import { snippets } from '@/data/snippets'

const options: SelectOption[] = [
  { label: '需求', value: 'requirement' },
  { label: '缺陷', value: 'bug' },
  { label: '任务', value: 'task' },
  { label: '风险（暂不可选）', value: 'risk', disabled: true }
]

const basic = ref<string | number | null>('requirement')
const clearable = ref<string | number | null>('bug')
const empty = ref<string | number | null>(null)

const owners = ref<(string | number)[]>(['ay', 'zq'])
const members: SelectOption[] = [
  { label: '安阳', value: 'ay' },
  { label: '周其', value: 'zq' },
  { label: '沈黎', value: 'sl' },
  { label: '陆停云', value: 'ltl' },
  { label: '何叙', value: 'hx' },
  { label: '林向晚', value: 'lxw' }
]

const collapsed = ref<(string | number)[]>(['ay', 'zq', 'sl', 'ltl', 'hx'])

/* 一万条：不虚拟化的话，展开那一下会把整个页面卡住 */
const city = ref<string | number | null>(null)
const cities: SelectOption[] = Array.from({ length: 10000 }, (_, i) => ({
  label: `编号 ${String(i + 1).padStart(5, '0')} 号仓位`,
  value: i + 1
}))

/* playground 代码片段里固定属性的写法（模板里写会和属性引号打架） */
const selectPgCode = [':options="options"']
</script>

<template>
  <article>
    <h1>Select 下拉选择</h1>
    <p class="i-lead">
      从一组预设项中选择一个值。选项少于三个时优先考虑单选框，用户可以少一次点击。
    </p>

    <h2>现场调参</h2>
    <p>下面的控件由源码里的属性类型生成，改动即时生效，代码区给出对应写法。</p>
    <Playground
      name="ISelect"
      :is="ISelect"
      :fixed="{ options }"
      :fixed-code="selectPgCode"
    />

    <DemoBlock
      title="多端用法"
      description="选项禁用、键盘移动这些规则来自公共层，各端是同一份实现，因此不会某一端「少跳过一个禁用项」。"
      :snippets="snippets.select"
    >
      <div class="w"><ISelect v-model="basic" :options="options" clearable /></div>
    </DemoBlock>

    <DemoBlock
      title="基础用法"
      description="禁用项保留在列表中，让用户知道该选项存在但当前不可用。"
      code='<ISelect v-model="value" :options="options" />'
    >
      <div class="w"><ISelect v-model="basic" :options="options" /></div>
    </DemoBlock>

    <DemoBlock
      title="可清除与尺寸"
      description="clearable 仅在已有选中值且未禁用时显示清除按钮。"
      code='<ISelect v-model="value" :options="options" clearable />
<ISelect size="sm" :options="options" />
<ISelect size="lg" :options="options" />'
    >
      <div class="w"><ISelect v-model="clearable" :options="options" clearable /></div>
      <div class="w"><ISelect size="sm" :options="options" placeholder="小尺寸" /></div>
      <div class="w"><ISelect size="lg" :options="options" placeholder="大尺寸" /></div>
    </DemoBlock>

    <DemoBlock
      title="空数据与禁用"
      code='<ISelect :options="[]" />
<ISelect :options="options" disabled />'
    >
      <div class="w"><ISelect v-model="empty" :options="[]" /></div>
      <div class="w"><ISelect :options="options" disabled placeholder="已禁用" /></div>
    </DemoBlock>

    <DemoBlock
      title="多选"
      description="选中的项排成一排标签，按点击先后排——不回到数据源顺序是因为标签就排在输入框里，刚点的那个跳到队伍中间会让人以为点错了。多选时面板不收起：一次要选好几个，每选一个都收起来再展开是折磨。"
      code='<ISelect v-model="owners" :options="members" multiple clearable />'
    >
      <div class="w-lg"><ISelect v-model="owners" :options="members" multiple clearable /></div>
      <p class="hint">当前值：{{ owners.join('、') || '（空）' }}</p>
    </DemoBlock>

    <DemoBlock
      title="标签折叠"
      description="超过 maxTagCount 的折成「+N」。折叠时至少留一个：留 0 个的话输入框里只剩一个「+5」，用户完全不知道自己选了什么。"
      code='<ISelect v-model="value" :options="members" multiple :max-tag-count="2" />'
    >
      <div class="w-lg"><ISelect v-model="collapsed" :options="members" multiple :max-tag-count="2" clearable /></div>
    </DemoBlock>

    <DemoBlock
      title="长列表"
      description="选项超过一定条数就只渲染看得见的那十来行，上下用两块空白撑开滚动条。下面这个是一万条，展开、滚动、按方向键都和四条时一样跟手。行高是实测的，不是写死的——主题面板能调字号与间距，写死会让定位越往下偏得越多。"
      code='<ISelect v-model="value" :options="tenThousandOptions" />'
    >
      <div class="w-lg"><ISelect v-model="city" :options="cities" clearable placeholder="一万个仓位里挑一个" /></div>
    </DemoBlock>

    <h2>键盘操作</h2>
    <table class="i-table">
      <thead><tr><th>按键</th><th>行为</th></tr></thead>
      <tbody>
        <tr><td><code>↓</code> / <code>↑</code></td><td>展开下拉，或在选项间移动高亮（自动跳过禁用项）</td></tr>
        <tr><td><code>Enter</code> / <code>Space</code></td><td>展开下拉，或选中当前高亮项</td></tr>
        <tr><td><code>Esc</code></td><td>收起下拉</td></tr>
        <tr><td><code>Backspace</code></td><td>多选时删掉最后一个标签</td></tr>
      </tbody>
    </table>

    <h2>各端差异</h2>
    <p>
      长列表在 Web 与小程序端是「只渲染看得见的那十来行，上下用两块空白撑开滚动条」；
      Flutter 端改用能按需建子项的列表面板，由框架自己决定建哪几项，结果一样。多选在 Flutter 端也走这层面板而不是系统菜单——菜单点一下就收，而多选需要面板留在原处连点几下。取值顺序与标签折叠的规则各端共用同一份。
    </p>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>选项只有两三个时——用单选按钮，全部摊开比点一下再看一眼快。</li>
      <li>选项超过几百条且没有搜索时——先加搜索或改成带检索的选择器，让人滚三屏找一项不是选择。</li>
      <li>用户要输入的是任意值时——用输入框加建议（自动完成），下拉会把「不在列表里」的情况堵死。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>string | number | null | (string | number)[]</code></td><td><code>null</code></td><td>选中值，支持 v-model；多选时是数组</td></tr>
        <tr><td>options</td><td><code>SelectOption[]</code></td><td>—</td><td>选项列表，必填</td></tr>
        <tr><td>placeholder</td><td><code>string</code></td><td><code>请选择</code></td><td>未选中时的占位文本</td></tr>
        <tr><td>size</td><td><code>sm | md | lg</code></td><td><code>md</code></td><td>尺寸</td></tr>
        <tr><td>disabled</td><td><code>boolean</code></td><td><code>false</code></td><td>是否禁用</td></tr>
        <tr><td>invalid</td><td><code>boolean</code></td><td><code>false</code></td><td>校验失败态</td></tr>
        <tr><td>clearable</td><td><code>boolean</code></td><td><code>false</code></td><td>是否可清除</td></tr>
        <tr><td>multiple</td><td><code>boolean</code></td><td><code>false</code></td><td>多选。值变成数组，触发器里改成一排标签</td></tr>
        <tr><td>maxTagCount</td><td><code>number</code></td><td><code>0</code></td><td>多选时最多完整显示几个标签，其余折成「+N」；0 表示全部显示</td></tr>
      </tbody>
    </table>
    <p><code>SelectOption</code>：<code>{ label: string; value: string | number; disabled?: boolean }</code></p>
    <table class="i-table">
      <thead><tr><th>事件</th><th>回调参数</th><th>说明</th></tr></thead>
      <tbody><tr><td>change</td><td><code>string | number | null</code></td><td>选中值变化时触发，清除时为 null</td></tr></tbody>
    </table>
  </article>
</template>

<style scoped>
.w { width: 240px; }
.w-lg { width: 360px; max-width: 100%; }
.hint {
  margin-top: var(--i-spacing-3);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
}
</style>
