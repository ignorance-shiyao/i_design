<script setup lang="ts">
import IDescriptions, { type DescriptionItem } from '@/components/IDescriptions.vue'
import ITag from '@/components/ITag.vue'
import IButton from '@/components/IButton.vue'
import IAvatar from '@/components/IAvatar.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const items: DescriptionItem[] = [
  { label: '编号', value: 'WI-1024' },
  { label: '类型', value: '需求' },
  { label: '负责人', slot: 'owner' },
  { label: '状态', slot: 'status' },
  { label: '迭代', value: '2026 S9 · 第 3 迭代' },
  { label: '故事点', value: 5 },
  { label: '创建时间', value: '2026-09-01 10:24' },
  { label: '预计完成', value: '' },
  { label: '描述', value: '登录页支持短信验证码，覆盖注册与找回密码两条路径。', span: 2 }
]
</script>

<template>
  <article>
    <h1>Descriptions 描述列表</h1>
    <p class="i-lead">
      成组展示只读字段，是详情页的主力版式。字段顺序应按用户查阅频率排，而不是按数据库表的列顺序。
    </p>

    <DemoBlock
      title="基础用法"
      description="span 让长字段跨列；空值显示占位符「—」而不是留白，否则用户分不清「没有」和「没加载出来」。"
      lang="vue"
      code='const items = [
  { label: "编号", value: "WI-1024" },
  { label: "负责人", slot: "owner" },
  { label: "描述", value: "…", span: 2 }
]

<IDescriptions title="工作项详情" :items="items" :column="2" />'
    >
      <div class="w">
        <IDescriptions title="工作项详情" :items="items" :column="2">
          <template #owner>
            <span class="inline"><IAvatar name="林岚" size="sm" />林岚</span>
          </template>
          <template #status><ITag type="brand">进行中</ITag></template>
          <template #extra><IButton size="sm">编辑</IButton></template>
        </IDescriptions>
      </div>
    </DemoBlock>

    <DemoBlock
      title="纵向标签"
      description="值较长或需要换行时把标签放到上方，避免左侧标签列被撑得过宽。"
      lang="vue"
      code='<IDescriptions :items="items" layout="vertical" :column="3" />'
    >
      <div class="w">
        <IDescriptions
          layout="vertical"
          :column="3"
          :items="items.slice(0, 6)"
        >
          <template #owner>林岚</template>
          <template #status><ITag type="brand">进行中</ITag></template>
        </IDescriptions>
      </div>
    </DemoBlock>

    <DemoBlock
      title="无边框与紧凑尺寸"
      description="嵌在卡片、抽屉或 Result 的 extra 里时，去掉外框避免出现「框套框」。"
      lang="vue"
      code='<IDescriptions :items="items" :bordered="false" size="sm" :column="1" />'
    >
      <div class="w">
        <IDescriptions :items="items.slice(0, 4)" :bordered="false" size="sm" :column="1">
          <template #owner>林岚</template>
          <template #status><ITag type="brand">进行中</ITag></template>
        </IDescriptions>
      </div>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>字段可编辑时——那是表单。描述列表是只读的，把输入框塞进来会让人分不清哪些能改。</li>
      <li>同构数据有很多条时——用表格，一条条描述列表排下去无法横向对比。</li>
      <li>只有两三个字段时——直接写成段落更自然，键值对的对齐反而显得公文腔。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>items</td><td><code>DescriptionItem[]</code></td><td>—</td><td>字段列表，必填</td></tr>
        <tr><td>title</td><td><code>string</code></td><td><code>''</code></td><td>标题，留空且无 extra 时不渲染头部</td></tr>
        <tr><td>column</td><td><code>number</code></td><td><code>2</code></td><td>列数；窄屏自动降为单列</td></tr>
        <tr><td>layout</td><td><code>horizontal | vertical</code></td><td><code>horizontal</code></td><td>标签在左或在上</td></tr>
        <tr><td>bordered</td><td><code>boolean</code></td><td><code>true</code></td><td>是否显示外框</td></tr>
        <tr><td>size</td><td><code>sm | md</code></td><td><code>md</code></td><td>密度</td></tr>
      </tbody>
    </table>
    <h3>DescriptionItem</h3>
    <table class="i-table">
      <thead><tr><th>字段</th><th>类型</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>label</td><td><code>string</code></td><td>字段名</td></tr>
        <tr><td>value</td><td><code>string | number</code></td><td>字段值；空值渲染为 —</td></tr>
        <tr><td>span</td><td><code>number</code></td><td>跨列数，不超过 column</td></tr>
        <tr><td>slot</td><td><code>string</code></td><td>插槽名，默认与 label 同名</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.w { width: 100%; }
.inline { display: inline-flex; align-items: center; gap: var(--i-spacing-2); }
</style>
