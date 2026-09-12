<script setup lang="ts">
import ICard from '@/components/ICard.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'
</script>

<template>
  <article>
    <h1>Card 卡片</h1>
    <p class="i-lead">承载一组相关信息的容器。同级卡片应保持等高与等宽，避免视觉上的主次误读。</p>

    <DemoBlock
      title="基础卡片"
      code='<ICard title="迭代概览">本迭代共 24 个工作项，已完成 18 个。</ICard>'
    >
      <div class="w"><ICard title="迭代概览">本迭代共 24 个工作项，已完成 18 个。</ICard></div>
    </DemoBlock>

    <DemoBlock
      title="悬浮与页脚"
      description="hoverable 用于可点击进入详情的卡片，为其提供明确的可交互暗示。"
      code='<ICard title="发布计划" hoverable>
  下一次发布定于本周五。
  <template #footer>
    <IButton variant="text">查看详情</IButton>
  </template>
</ICard>'
    >
      <div class="w">
        <ICard title="发布计划" hoverable>
          下一次发布定于本周五。
          <template #footer><IButton variant="text">查看详情</IButton></template>
        </ICard>
      </div>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>内容是同构的一长串时——用列表或表格，卡片的边框与留白会让扫读变慢。</li>
      <li>只是想给一段文字加个底色时——卡片是「一个独立对象」的容器，滥用之后页面会变成一堆方块。</li>
      <li>卡片里只有一行字时——它的内边距比内容还多，直接写在页面上更好。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>title</td><td><code>string</code></td><td><code>''</code></td><td>标题，留空且无 header 插槽时不渲染头部</td></tr>
        <tr><td>hoverable</td><td><code>boolean</code></td><td><code>false</code></td><td>悬浮时抬升并加深阴影</td></tr>
        <tr><td>bordered</td><td><code>boolean</code></td><td><code>true</code></td><td>是否显示描边</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>插槽</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>default</td><td>卡片内容</td></tr>
        <tr><td>header</td><td>自定义头部，覆盖 title</td></tr>
        <tr><td>footer</td><td>页脚操作区，未提供时不渲染</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.w { width: 320px; }
</style>
