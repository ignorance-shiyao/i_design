<script setup lang="ts">
import { computed, ref } from 'vue'
import IPagination from '@/components/IPagination.vue'
import ITable, { type TableColumn, type TableRow } from '@/components/ITable.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { snippets } from '@/data/snippets'

const basic = ref(1)
const many = ref(12)
const small = ref(3)

// 与 Table 联动的示例数据
const columns: TableColumn[] = [
  { key: 'id', title: '编号', width: '100px' },
  { key: 'title', title: '标题' },
  { key: 'owner', title: '负责人', width: '110px' }
]
const owners = ['林岚', '陈序', '苏禾', '周迟']
const allRows: TableRow[] = Array.from({ length: 43 }, (_, i) => ({
  id: `WI-${1000 + i}`,
  title: `工作项标题示例 ${i + 1}`,
  owner: owners[i % owners.length]
}))

const page = ref(1)
const pageSize = 5
const pagedRows = computed(() =>
  allRows.slice((page.value - 1) * pageSize, page.value * pageSize)
)
</script>

<template>
  <article>
    <h1>Pagination 分页</h1>
    <p class="i-lead">
      把长列表切成可控的片段。页码区间始终保留首尾页，中间窗口跟随当前页滑动，让用户无论翻到哪里都能一步回到开头或结尾。
    </p>

    <DemoBlock
      title="多端用法"
      description="页码序列由公共层的 buildPages 计算，各端逐项相同——Flutter 端另有黄金测试逐个用例比对。"
      :snippets="snippets.pagination"
    >
      <IPagination v-model="basic" :total="240" :page-size="10" />
    </DemoBlock>

    <DemoBlock
      title="基础用法"
      description="总数较少时直接铺开全部页码，不出现省略号。"
      code='<IPagination v-model="page" :total="48" :page-size="10" />'
    >
      <IPagination v-model="basic" :total="48" :page-size="10" />
    </DemoBlock>

    <DemoBlock
      title="大量页码"
      description="点击省略号一次前进/后退一个窗口（maxVisible 页），比逐页点击快得多。"
      code='<IPagination v-model="page" :total="1000" :page-size="10" :max-visible="5" />'
    >
      <IPagination v-model="many" :total="1000" :page-size="10" :max-visible="5" />
    </DemoBlock>

    <DemoBlock
      title="小尺寸与禁用"
      description="嵌在卡片或抽屉内时用 sm；数据加载中用 disabled 冻结翻页。"
      code='<IPagination v-model="page" :total="200" size="sm" :show-total="false" />
<IPagination :model-value="1" :total="200" disabled />'
    >
      <div class="stack">
        <IPagination v-model="small" :total="200" size="sm" :show-total="false" />
        <IPagination :model-value="1" :total="200" disabled />
      </div>
    </DemoBlock>

    <DemoBlock
      title="与 Table 联动"
      description="分页只负责页码，数据切片由使用方控制——服务端分页时在 change 事件里发请求即可。"
      code='const pagedRows = computed(() =>
  allRows.slice((page - 1) * pageSize, page * pageSize)
)

<ITable :columns="columns" :data="pagedRows" row-key="id" />
<IPagination v-model="page" :total="allRows.length" :page-size="5" />'
    >
      <div class="stack">
        <ITable :columns="columns" :data="pagedRows" row-key="id" size="sm" />
        <IPagination v-model="page" :total="allRows.length" :page-size="pageSize" />
      </div>
    </DemoBlock>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>number</code></td><td><code>1</code></td><td>当前页码，从 1 开始，支持 v-model</td></tr>
        <tr><td>total</td><td><code>number</code></td><td>—</td><td>数据总条数，必填</td></tr>
        <tr><td>pageSize</td><td><code>number</code></td><td><code>10</code></td><td>每页条数</td></tr>
        <tr><td>maxVisible</td><td><code>number</code></td><td><code>5</code></td><td>中间连续页码个数，也是省略号的跳跃步长</td></tr>
        <tr><td>size</td><td><code>sm | md</code></td><td><code>md</code></td><td>尺寸</td></tr>
        <tr><td>disabled</td><td><code>boolean</code></td><td><code>false</code></td><td>是否禁用</td></tr>
        <tr><td>showTotal</td><td><code>boolean</code></td><td><code>true</code></td><td>是否显示条目范围文案</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>事件</th><th>回调参数</th><th>说明</th></tr></thead>
      <tbody><tr><td>change</td><td><code>number</code></td><td>页码变化时触发，服务端分页在此发请求</td></tr></tbody>
    </table>
    <p>页码会自动收敛到 <code>[1, 总页数]</code>；<code>total</code> 为 0 时仍保留第 1 页，避免出现空白分页条。</p>
  </article>
</template>

<style scoped>
.stack { display: grid; gap: var(--i-spacing-5); width: 100%; }
</style>
