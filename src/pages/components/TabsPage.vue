<script setup lang="ts">
import { ref } from 'vue'
import ITabs, { type TabItem } from '@/components/ITabs.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const items: TabItem[] = [
  { name: 'overview', label: '概览' },
  { name: 'members', label: '成员' },
  { name: 'settings', label: '设置' },
  { name: 'audit', label: '审计日志', disabled: true }
]

const line = ref('overview')
const card = ref('members')
</script>

<template>
  <article>
    <h1>Tabs 标签页</h1>
    <p class="i-lead">
      在同一块区域内切换并列的内容视图。页签数量建议不超过 7 个，超出时改用左侧导航。
    </p>

    <DemoBlock
      title="下划线样式"
      description="line 用于页面级切换。面板内容通过与 name 同名的插槽提供。"
      code='const items = [
  { name: "overview", label: "概览" },
  { name: "members", label: "成员" },
  { name: "audit", label: "审计日志", disabled: true }
]

<ITabs v-model="active" :items="items">
  <template #overview>项目概览内容</template>
  <template #members>成员列表内容</template>
</ITabs>'
    >
      <div class="full">
        <ITabs v-model="line" :items="items">
          <template #overview>本迭代共 24 个工作项，已完成 18 个，剩余 3 天。</template>
          <template #members>当前项目共 8 名成员，其中 2 名为管理员。</template>
          <template #settings>在此配置迭代周期、工作流状态与通知规则。</template>
        </ITabs>
      </div>
    </DemoBlock>

    <DemoBlock
      title="卡片样式"
      description="card 用于内容区内的次级切换，选中页签与面板连成一体。"
      code='<ITabs v-model="active" :items="items" variant="card" />'
    >
      <div class="full">
        <ITabs v-model="card" :items="items" variant="card" size="sm">
          <template #overview>概览面板。</template>
          <template #members>成员面板。</template>
          <template #settings>设置面板。</template>
        </ITabs>
      </div>
    </DemoBlock>

    <h2>键盘操作</h2>
    <p>
      遵循 WAI-ARIA 的 tabs 模式：页签组内只有选中项参与 Tab 键序列（<code>tabindex="0"</code>，其余为 <code>-1</code>），进入后用方向键切换。
    </p>
    <table class="i-table">
      <thead><tr><th>按键</th><th>行为</th></tr></thead>
      <tbody>
        <tr><td><code>Tab</code></td><td>进入 / 离开页签组，不会逐个遍历页签</td></tr>
        <tr><td><code>→</code> / <code>←</code></td><td>循环切换页签，自动跳过禁用项并把焦点带过去</td></tr>
      </tbody>
    </table>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>几块内容需要同时看到时——标签页一次只留一块，那种场景该并排。</li>
      <li>标签多到要横向滚动时——改成侧边导航或二级页面，滚动的标签栏里永远有一半看不见。</li>
      <li>内容之间是先后顺序时——那是步骤条。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>string</code></td><td><code>''</code></td><td>选中页签的 name，支持 v-model</td></tr>
        <tr><td>items</td><td><code>TabItem[]</code></td><td>—</td><td>页签列表，必填</td></tr>
        <tr><td>variant</td><td><code>line | card</code></td><td><code>line</code></td><td>视觉样式</td></tr>
        <tr><td>size</td><td><code>sm | md</code></td><td><code>md</code></td><td>尺寸</td></tr>
      </tbody>
    </table>
    <p><code>TabItem</code>：<code>{ name: string; label: string; disabled?: boolean }</code></p>
    <table class="i-table">
      <thead><tr><th>插槽 / 事件</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>[name]</td><td>与页签 name 同名的插槽，渲染该页签的面板内容</td></tr>
        <tr><td>change</td><td>选中页签变化时触发，参数为新的 name</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.full { width: 100%; }
</style>
