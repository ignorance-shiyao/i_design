<script setup lang="ts">
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
