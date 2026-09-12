<script setup lang="ts">
import ITable, { type TableColumn, type TableRow } from '@/components/ITable.vue'
import ITag from '@/components/ITag.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import Playground from '@/site/Playground.vue'

import { ref } from 'vue'

const picked = ref<(string | number)[]>([])
const bigPicked = ref<(string | number)[]>([])

/* 两万行：不虚拟化的话，光是把 <tr> 建出来就要好几秒 */
const owners = ['林岚', '沈黎', '周其', '安阳', '陆停云']
const states = ['done', 'doing', 'todo']
const bigData: TableRow[] = Array.from({ length: 20000 }, (_, i) => ({
  id: `WI-${String(i + 1).padStart(5, '0')}`,
  title: `第 ${i + 1} 个工作项`,
  owner: owners[i % owners.length],
  points: (i % 13) + 1,
  status: states[i % states.length]
}))

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

/* playground 代码片段里固定属性的写法（模板里写会和属性引号打架） */
const tablePgCode = [':columns="columns"', ':data="data"']
</script>

<template>
  <article>
    <h1>Table 表格</h1>
    <p class="i-lead">
      展示结构化的行列数据。列宽应按内容语义固定，避免用户在翻页时因列宽跳动而重新定位。
    </p>

    <h2>现场调参</h2>
    <p>下面的控件由源码里的属性类型生成，改动即时生效，代码区给出对应写法。</p>
    <Playground
      name="ITable"
      :is="ITable"
      :fixed="{ columns, data }"
      :fixed-code="tablePgCode"
    />

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
      title="行选择"
      description="表头的复选框只作用于当前这一页：分页表格里若「全选」悄悄勾上没显示出来的行，用户点下删除时删掉的会远比他看到的多。部分勾选时表头是半选态，不会看上去像一个都没选。"
      code='<ITable v-model:selected="picked" :columns="columns" :data="data" row-key="id" selectable />'
    >
      <div class="stack">
        <ITable v-model:selected="picked" :columns="columns" :data="data" row-key="id" selectable>
          <template #status="{ value }">
            <ITag :type="statusMap[value].type">{{ statusMap[value].label }}</ITag>
          </template>
        </ITable>
        <p class="picked-hint">已选 {{ picked.length }} 项{{ picked.length ? `：${picked.join('、')}` : '' }}</p>
      </div>
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

    <DemoBlock
      title="长表格"
      description="给了 height 之后表头吸顶、表体自己滚，行数超过一定条数就只渲染看得见的那几行，上下用两行空白撑开滚动条。下面这张是两万行，排序、勾选、滚动都和十行时一样跟手。不给 height 就不虚拟化——没有可视高度算不出该渲染哪几行。"
      code='<ITable :columns="columns" :data="data" row-key="id" height="360px" selectable />'
    >
      <div class="stack">
        <ITable
          v-model:selected="bigPicked"
          :columns="columns"
          :data="bigData"
          row-key="id"
          height="360px"
          size="sm"
          selectable
        />
        <p class="big-hint">共 {{ bigData.length }} 行，已选 {{ bigPicked.length }} 行</p>
      </div>
    </DemoBlock>

    <h2>各端差异</h2>
    <p>
      Web 与小程序端自己算窗口，只渲染看得见的那几行；Flutter 端交给能按需建子项的列表。
      三端共同的一条：列宽必须算死了同时喂给表头与每一行——让每一行各自去量内容宽度的话，
      滚起来列会左右跳，表头也对不上。所以 Web 端的滚动容器是表格外层而不是
      <code>tbody</code>：给 <code>tbody</code> 加 <code>overflow</code> 会让它脱离表格布局，
      列宽随即变成各行各算各的。
    </p>

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
        <tr><td>height</td><td><code>string</code></td><td><code>''</code></td><td>表体高度。给了之后表头吸顶、表体自己滚，行多时只渲染看得见的那几行</td></tr>
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
.big-hint {
  margin-top: var(--i-spacing-3);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
}
.picked-hint { margin: 0; font-size: var(--i-font-size-sm); color: var(--i-color-text-tertiary); }
.stack { display: grid; gap: var(--i-spacing-6); width: 100%; }
</style>
