<script setup lang="ts">
import ITable, { type TableColumn, type TableRow } from '@/components/ITable.vue'
import ITag from '@/components/ITag.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const columns: TableColumn[] = [
  { key: 'id', title: '编号', width: '90px' },
  { key: 'title', title: '标题', sortable: true },
  { key: 'owner', title: '负责人', width: '110px' },
  { key: 'points', title: '故事点', width: '100px', align: 'right', sortable: true },
  { key: 'status', title: '状态', width: '110px' }
]

const data: TableRow[] = [
  { id: 'WI-1024', title: '登录页支持短信验证码', owner: '林岚', points: 5, status: 'done' },
  { id: 'WI-1031', title: '工作项列表虚拟滚动', owner: '陈序', points: 8, status: 'doing' },
  { id: 'WI-1042', title: '深色模式对比度校准', owner: '苏禾', points: 3, status: 'todo' },
  { id: 'WI-1050', title: '导出 CSV 编码问题修复', owner: '周迟', points: 2, status: 'doing' }
]

const statusMap: Record<string, { label: string; type: 'default' | 'brand' | 'success' }> = {
  todo: { label: '待开始', type: 'default' },
  doing: { label: '进行中', type: 'brand' },
  done: { label: '已完成', type: 'success' }
}

const actionColumns: TableColumn[] = [
  { key: 'title', title: '标题' },
  { key: 'owner', title: '负责人', width: '110px' },
  { key: 'action', title: '操作', width: '120px', align: 'right' }
]
</script>

<template>
  <article>
    <h1>Table 表格</h1>
    <p class="i-lead">
      展示结构化的行列数据。列宽应按内容语义固定，避免用户在翻页时因列宽跳动而重新定位。
    </p>

    <DemoBlock
      title="基础用法与排序"
      description="点击带排序标识的表头切换：升序 → 降序 → 恢复原始顺序。数值列按数值比较，文本列按中文拼音比较。"
      code='const columns = [
  { key: "id", title: "编号", width: "90px" },
  { key: "title", title: "标题", sortable: true },
  { key: "points", title: "故事点", align: "right", sortable: true }
]

<ITable :columns="columns" :data="data" row-key="id" />'
    >
      <ITable :columns="columns" :data="data" row-key="id">
        <template #status="{ value }">
          <ITag :type="statusMap[value].type">{{ statusMap[value].label }}</ITag>
        </template>
      </ITable>
    </DemoBlock>

    <DemoBlock
      title="列插槽"
      description="每一列都开放一个与 key 同名的插槽，用于渲染标签、按钮等自定义内容。"
      code='<ITable :columns="columns" :data="data" row-key="id">
  <template #action="{ row }">
    <IButton size="sm" variant="text">编辑</IButton>
  </template>
</ITable>'
    >
      <ITable :columns="actionColumns" :data="data" row-key="id" size="sm" striped>
        <template #action>
          <IButton size="sm" variant="text">编辑</IButton>
        </template>
      </ITable>
    </DemoBlock>

    <DemoBlock
      title="加载中与空数据"
      description="空态文案应说明为何为空，而不是只写「暂无数据」。"
      code='<ITable :columns="columns" :data="[]" loading />
<ITable :columns="columns" :data="[]" empty-text="当前筛选条件下没有工作项" />'
    >
      <div class="stack">
        <ITable :columns="actionColumns" :data="[]" loading />
        <ITable :columns="actionColumns" :data="[]" empty-text="当前筛选条件下没有工作项" />
      </div>
    </DemoBlock>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>columns</td><td><code>TableColumn[]</code></td><td>—</td><td>列定义，必填</td></tr>
        <tr><td>data</td><td><code>TableRow[]</code></td><td>—</td><td>行数据，必填</td></tr>
        <tr><td>rowKey</td><td><code>string</code></td><td><code>id</code></td><td>行唯一标识字段</td></tr>
        <tr><td>size</td><td><code>sm | md</code></td><td><code>md</code></td><td>行高密度</td></tr>
        <tr><td>striped</td><td><code>boolean</code></td><td><code>false</code></td><td>斑马纹</td></tr>
        <tr><td>loading</td><td><code>boolean</code></td><td><code>false</code></td><td>加载态</td></tr>
        <tr><td>emptyText</td><td><code>string</code></td><td><code>暂无数据</code></td><td>空态文案</td></tr>
      </tbody>
    </table>

    <h3>TableColumn</h3>
    <table class="i-table">
      <thead><tr><th>字段</th><th>类型</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>key</td><td><code>string</code></td><td>取值字段名，同时是该列插槽的名字</td></tr>
        <tr><td>title</td><td><code>string</code></td><td>表头文案</td></tr>
        <tr><td>width</td><td><code>string</code></td><td>列宽，如 <code>120px</code></td></tr>
        <tr><td>align</td><td><code>left | center | right</code></td><td>对齐方式，数值列建议右对齐</td></tr>
        <tr><td>sortable</td><td><code>boolean</code></td><td>是否可排序</td></tr>
      </tbody>
    </table>

    <h3>插槽</h3>
    <p>
      每列提供一个以 <code>key</code> 命名的插槽，作用域参数为
      <code>{ row, value, index }</code>。
    </p>
  </article>
</template>

<style scoped>
.stack { display: grid; gap: var(--i-spacing-6); width: 100%; }
</style>
