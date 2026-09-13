<script setup lang="ts">
import { ref } from 'vue'
import ICollapse, { type CollapseItem } from '@/components/ICollapse.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const items: CollapseItem[] = [
  {
    name: 'what',
    title: '什么是设计令牌？',
    content:
      '令牌是设计与代码之间唯一的契约。基础层描述值，语义层描述用途，组件只消费语义层，因此主题切换是一次变量覆盖而不是一次重构。'
  },
  {
    name: 'why',
    title: '为什么组件不能写死色值？',
    content:
      '写死色值意味着每加一套主题就要改一遍全部组件。引用语义令牌后，换肤与深色模式只需覆盖语义层。'
  },
  {
    name: 'how',
    title: '如何新增一个组件？',
    content:
      '先确认无法由现有组件组合实现；样式只引用语义令牌；尺寸沿用 sm / md / lg；交互组件需通过键盘验证；最后补一页含可交互示例的文档。'
  },
  { name: 'more', title: '暂不可展开的条目', content: '', disabled: true }
]

const multiple = ref<string[]>(['what'])
const accordion = ref<string[]>(['what'])
</script>

<template>
  <article>
    <h1>Collapse 折叠面板</h1>
    <p class="i-lead">
      把次要或冗长的内容折起来，让页面先呈现结构。默认展开哪一项要慎重——默认收起意味着用户可能永远看不到里面的内容。
    </p>

    <DemoBlock
      title="基础用法"
      description="可同时展开多项。内容用 v-show 保留而非销毁，展开时不重新挂载，表单填了一半也不会丢。"
      lang="vue"
      code='<ICollapse v-model="active" :items="items" />'
    >
      <div class="w"><ICollapse v-model="multiple" :items="items" /></div>
    </DemoBlock>

    <DemoBlock
      title="手风琴"
      description="同时只展开一项，适合内容较长、并列关系明确的场景。"
      lang="vue"
      code='<ICollapse v-model="active" :items="items" accordion />'
    >
      <div class="w"><ICollapse v-model="accordion" :items="items" accordion /></div>
    </DemoBlock>

    <DemoBlock
      title="自定义内容"
      description="每项提供一个与 name 同名的插槽，可放置任意组件。"
      lang="vue"
      code='<ICollapse v-model="active" :items="items">
  <template #what>
    <ITable :columns="columns" :data="data" />
  </template>
</ICollapse>'
    >
      <div class="w">
        <ICollapse v-model="multiple" :items="items.slice(0, 2)" :bordered="false">
          <template #what>
            <p>插槽里可以放任意内容，包括表格、表单或另一个折叠面板。</p>
          </template>
        </ICollapse>
      </div>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>内容是页面的主线时——折叠起来等于把它藏了，用户不会去点开一个不知道里面有什么的标题。</li>
      <li>只有一段内容时——那是一个多余的开关，直接展示。</li>
      <li>用户需要对比两段内容时——手风琴一次只开一段，来回点开会把对比拆成两次记忆。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>string[]</code></td><td><code>[]</code></td><td>展开项的 name 数组，支持 v-model</td></tr>
        <tr><td>items</td><td><code>CollapseItem[]</code></td><td>—</td><td>面板列表，必填</td></tr>
        <tr><td>accordion</td><td><code>boolean</code></td><td><code>false</code></td><td>手风琴模式，同时只展开一项</td></tr>
        <tr><td>bordered</td><td><code>boolean</code></td><td><code>true</code></td><td>是否显示外边框</td></tr>
      </tbody>
    </table>
    <p>
      <code>CollapseItem</code>：<code>{ name: string; title: string; content?: string; disabled?: boolean }</code>；每项对应一个与 <code>name</code> 同名的插槽。
    </p>
  </article>
</template>

<style scoped>
.w { width: 100%; max-width: 560px; }
</style>
