<script setup lang="ts">
import { ref } from 'vue'
import ICommandSearch from '@/components/ICommandSearch.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import type { CommandItem } from '@i-design/common'

const open = ref(false)
const picked = ref('')

const items: CommandItem[] = [
  { key: 'button', label: '按钮', description: '触发一个动作', keywords: ['button'], group: '基础' },
  { key: 'button-group', label: '按钮组', description: '一组并排的按钮', keywords: ['button group'], group: '基础' },
  { key: 'tag', label: '标签', description: '标记分类或状态', keywords: ['tag'], group: '基础' },
  { key: 'table', label: '表格', description: '成行成列的数据', keywords: ['table'], group: '数据展示' },
  { key: 'form', label: '表单', description: '收集并校验输入', keywords: ['form'], group: '数据录入' },
  { key: 'empty', label: '空状态', description: '解释为什么这里没有内容', keywords: ['empty'], group: '反馈' }
]
</script>

<template>
  <article>
    <h1>CommandSearch 命令搜索</h1>
    <p class="i-lead">
      一个搜索框，一串实时过滤的结果，键盘全程可用。东西超过几十项之后，再怎么分组都不如直接搜——菜单、设置项、文档页都一样。
    </p>

    <DemoBlock
      title="基本用法"
      description="打开后从空查询开始，先让人看到「有哪些东西可搜」，而不是一片空白等着猜。输入即过滤，命中的字会被标出来。"
      lang="vue"
      code='<ICommandSearch v-model:open="open" :items="items" @select="onSelect" />'
    >
      <IButton type="primary" @click="open = true">打开搜索</IButton>
      <p v-if="picked" class="i-cmd-demo__result">刚刚选中：{{ picked }}</p>
      <ICommandSearch v-model:open="open" :items="items" @select="(item) => (picked = item.label)" />
    </DemoBlock>

    <h2>排序是怎么定的</h2>
    <p>
      搜索的成败全在排序：输入「按钮」，第一条必须是「按钮」而不是「按钮组」。所以匹配分三档，差距拉得很开——整串相等 &gt; 从头开始 &gt; 出现在词首 &gt; 出现在词中；字段再加权重，标题 &gt; 关键词 &gt; 描述，描述里命中只当补充证据，顶不到前面。同分时短标题排前面：它是这个词本身，而不是以它开头的另一件东西。
    </p>
    <p>
      这套规则放在公共层的 <code>searchCommands</code> 里，各端共用一份。各写一遍的话，同一个词在站点里与在应用里给出的第一条会不一样。
    </p>

    <h2>键盘</h2>
    <table class="i-table">
      <thead><tr><th>按键</th><th>行为</th></tr></thead>
      <tbody>
        <tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>在结果间移动，到头绕回另一端</td></tr>
        <tr><td><kbd>Enter</kbd></td><td>选中当前条目</td></tr>
        <tr><td><kbd>Esc</kbd></td><td>关闭</td></tr>
      </tbody>
    </table>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>只有十来项的菜单——直接列出来更快，多一次「唤起再输入」反而慢。</li>
      <li>需要翻页、排序、筛选条件组合的列表——那是表格与筛选器的活。</li>
      <li>结果需要预览或对比——它一次只让人选一条，选完就关。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>items</td><td><code>CommandItem[]</code></td><td>—</td><td>可搜的全部条目</td></tr>
        <tr><td>open</td><td><code>boolean</code></td><td><code>false</code></td><td>是否打开；用 v-model:open 控制</td></tr>
        <tr><td>placeholder</td><td><code>string</code></td><td><code>''</code></td><td>输入框占位文案；不传用字典里的「搜索」</td></tr>
        <tr><td>limit</td><td><code>number</code></td><td><code>20</code></td><td>最多显示多少条</td></tr>
      </tbody>
    </table>

    <table class="i-table">
      <thead><tr><th>事件</th><th>参数</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>select</td><td><code>CommandItem</code></td><td>选中一条，随后自动关闭</td></tr>
        <tr><td>update:open</td><td><code>boolean</code></td><td>打开状态变化</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.i-cmd-demo__result {
  margin-top: var(--i-spacing-3);
  color: var(--i-color-text-secondary);
}
</style>
