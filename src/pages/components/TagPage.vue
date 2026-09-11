<script setup lang="ts">
import ICheckTag from '@/components/ICheckTag.vue'
import { ref } from 'vue'

const interests = ['设计系统', '无障碍', '数据可视化', '性能']
const picked = ref<string[]>(['设计系统'])
function toggle(tag: string, on: boolean) {
  picked.value = on ? [...picked.value, tag] : picked.value.filter((t) => t !== tag)
}
import ITag from '@/components/ITag.vue'
import DemoBlock from '@/site/DemoBlock.vue'
</script>

<template>
  <article>
    <h1>Tag 标签</h1>
    <p class="i-lead">标记分类或状态。标签本身不承载操作，需要点击的场景请用按钮。</p>

    <DemoBlock
      title="语义类型"
      code='<ITag>默认</ITag>
<ITag type="brand">品牌</ITag>
<ITag type="success">成功</ITag>
<ITag type="warning">警告</ITag>
<ITag type="danger">危险</ITag>'
    >
      <ITag>默认</ITag>
      <ITag type="brand">品牌</ITag>
      <ITag type="success">成功</ITag>
      <ITag type="warning">警告</ITag>
      <ITag type="danger">危险</ITag>
    </DemoBlock>

    <DemoBlock title="圆角标签" code='<ITag type="brand" round>进行中</ITag>'>
      <ITag type="brand" round>进行中</ITag>
      <ITag type="success" round>已完成</ITag>
    </DemoBlock>

    <h2>CheckTag 可选标签</h2>
    <p>
      长得像标签、行为像多选框，用在「兴趣标签」「快捷筛选」这类场景——
      比一排 Checkbox 省地方，也比 Checkbox 更适合数量不定的项。
      选中态用填充色而不是加一圈粗边：粗边会让选中项的视觉面积变大，
      一排标签选中几个之后，间距看起来就不匀了。
    </p>
    <DemoBlock
      title="可选标签"
      code='<ICheckTag v-model="checked">设计系统</ICheckTag>'
    >
      <div class="check-tags">
        <ICheckTag
          v-for="tag in interests"
          :key="tag"
          :model-value="picked.includes(tag)"
          round
          @change="(on) => toggle(tag, on)"
          >{{ tag }}</ICheckTag
        >
      </div>
      <p class="check-tags__value">已选：{{ picked.join('、') || '（无）' }}</p>
    </DemoBlock>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>type</td><td><code>default | brand | success | warning | danger</code></td><td><code>default</code></td><td>语义类型</td></tr>
        <tr><td>round</td><td><code>boolean</code></td><td><code>false</code></td><td>全圆角样式</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.check-tags { display: flex; flex-wrap: wrap; gap: var(--i-spacing-2); }
</style>
