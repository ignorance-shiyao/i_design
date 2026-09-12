<script setup lang="ts">
import IBreadcrumb, { type BreadcrumbItem } from '@/components/IBreadcrumb.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const items: BreadcrumbItem[] = [
  { label: '首页', to: '/' },
  { label: '组件', to: '/components' },
  { label: 'Breadcrumb 面包屑' }
]
</script>

<template>
  <article>
    <h1>Breadcrumb 面包屑</h1>
    <p class="i-lead">
      展示当前页面在信息层级中的位置，并提供逐级返回的路径。层级不超过 3 层时通常不需要它。
    </p>

    <DemoBlock
      title="基础用法"
      description="末项代表当前位置，不渲染为链接，并带上 aria-current=&quot;page&quot;。"
      code='const items = [
  { label: "首页", to: "/" },
  { label: "组件", to: "/components" },
  { label: "Breadcrumb 面包屑" }
]

<IBreadcrumb :items="items" />'
    >
      <IBreadcrumb :items="items" />
    </DemoBlock>

    <DemoBlock
      title="自定义分隔符"
      description="默认用图标分隔；也可换成其他图标，或传字符串改用文字分隔。"
      lang="vue"
      code='<IBreadcrumb :items="items" separator-icon="arrow-right" />
<IBreadcrumb :items="items" separator="/" />'
    >
      <div class="stack">
        <IBreadcrumb :items="items" separator-icon="arrow-right" />
        <IBreadcrumb :items="items" separator="/" />
      </div>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>层级只有一层时——面包屑除了占一行什么也没说。</li>
      <li>页面之间不是包含关系时（并列的几个功能页）——那是标签页或导航菜单，面包屑会让人误以为有上下级。</li>
      <li>用户是从搜索或外链直接进来的、并不存在「上一级」时——给一个明确的去处，比给一条假的路径诚实。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>items</td><td><code>BreadcrumbItem[]</code></td><td>—</td><td>层级列表，必填</td></tr>
        <tr><td>separator</td><td><code>string</code></td><td><code>''</code></td><td>文字分隔符；留空则使用图标</td></tr>
        <tr><td>separatorIcon</td><td><code>IconName</code></td><td><code>chevron-right</code></td><td>图标分隔符</td></tr>
      </tbody>
    </table>
    <p><code>BreadcrumbItem</code>：<code>{ label: string; to?: string }</code>，末项不传 <code>to</code>。</p>
  </article>
</template>

<style scoped>
.stack { display: grid; gap: var(--i-spacing-3); }
</style>
