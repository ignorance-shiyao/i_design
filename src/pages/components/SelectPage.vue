<script setup lang="ts">
import { ref } from 'vue'
import ISelect, { type SelectOption } from '@/components/ISelect.vue'
import DemoBlock from '@/site/DemoBlock.vue'
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
</script>

<template>
  <article>
    <h1>Select 下拉选择</h1>
    <p class="i-lead">
      从一组预设项中选择一个值。选项少于三个时优先考虑单选框，用户可以少一次点击。
    </p>

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

    <h2>键盘操作</h2>
    <table class="i-table">
      <thead><tr><th>按键</th><th>行为</th></tr></thead>
      <tbody>
        <tr><td><code>↓</code> / <code>↑</code></td><td>展开下拉，或在选项间移动高亮（自动跳过禁用项）</td></tr>
        <tr><td><code>Enter</code> / <code>Space</code></td><td>展开下拉，或选中当前高亮项</td></tr>
        <tr><td><code>Esc</code></td><td>收起下拉</td></tr>
      </tbody>
    </table>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>string | number | null</code></td><td><code>null</code></td><td>选中值，支持 v-model</td></tr>
        <tr><td>options</td><td><code>SelectOption[]</code></td><td>—</td><td>选项列表，必填</td></tr>
        <tr><td>placeholder</td><td><code>string</code></td><td><code>请选择</code></td><td>未选中时的占位文本</td></tr>
        <tr><td>size</td><td><code>sm | md | lg</code></td><td><code>md</code></td><td>尺寸</td></tr>
        <tr><td>disabled</td><td><code>boolean</code></td><td><code>false</code></td><td>是否禁用</td></tr>
        <tr><td>invalid</td><td><code>boolean</code></td><td><code>false</code></td><td>校验失败态</td></tr>
        <tr><td>clearable</td><td><code>boolean</code></td><td><code>false</code></td><td>是否可清除</td></tr>
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
</style>
