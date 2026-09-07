<script setup lang="ts">
import IEmpty from '@/components/IEmpty.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'
</script>

<template>
  <article>
    <h1>Empty 空状态</h1>
    <p class="i-lead">
      解释为什么这里没有内容，并给出下一步。空态是产品与用户的一次对话机会，不要只写「暂无数据」四个字。
    </p>

    <DemoBlock
      title="按成因区分"
      description="四种预设覆盖最常见的成因：从未创建、筛选无果、加载失败、无权限。文案可用 title / description 覆盖。"
      code='<IEmpty />
<IEmpty type="search" />
<IEmpty type="error" />
<IEmpty type="permission" />'
    >
      <div class="grid">
        <IEmpty type="empty" size="sm" />
        <IEmpty type="search" size="sm" />
        <IEmpty type="error" size="sm" />
        <IEmpty type="permission" size="sm" />
      </div>
    </DemoBlock>

    <DemoBlock
      title="带操作"
      description="默认插槽用于放置下一步操作；成因不同，操作也应不同（创建 / 清除筛选 / 重试）。"
      code='<IEmpty title="还没有工作项" description="创建第一个工作项，开始跟踪迭代进度。">
  <IButton variant="primary">新建工作项</IButton>
</IEmpty>'
    >
      <IEmpty title="还没有工作项" description="创建第一个工作项，开始跟踪迭代进度。">
        <IButton variant="primary">新建工作项</IButton>
      </IEmpty>
    </DemoBlock>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>type</td><td><code>empty | search | error | permission</code></td><td><code>empty</code></td><td>成因，决定默认文案</td></tr>
        <tr><td>title</td><td><code>string</code></td><td>—</td><td>覆盖默认标题</td></tr>
        <tr><td>description</td><td><code>string</code></td><td>—</td><td>覆盖默认描述</td></tr>
        <tr><td>size</td><td><code>sm | md</code></td><td><code>md</code></td><td>尺寸，嵌在卡片内用 sm</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--i-spacing-4);
  width: 100%;
}
</style>
