<script setup lang="ts">
import { ref } from 'vue'
import ISkeleton from '@/components/ISkeleton.vue'
import ICard from '@/components/ICard.vue'
import IButton from '@/components/IButton.vue'
import IAvatar from '@/components/IAvatar.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const loading = ref(true)
</script>

<template>
  <article>
    <h1>Skeleton 骨架屏</h1>
    <p class="i-lead">
      在内容到达前占住它将要出现的位置。与 Loading 的分工：区域里<strong>结构已知</strong>时用骨架屏，
      因为它能避免内容到达时的布局跳动；结构未知或等待时间很短时用 Loading。
    </p>

    <DemoBlock
      title="预设版式"
      description="四种常见版式免去每处手写行数。段落末行更短，视觉上更接近真实文本。"
      lang="vue"
      code='<ISkeleton variant="paragraph" :rows="3" />
<ISkeleton variant="avatar" />
<ISkeleton variant="list" :rows="3" />
<ISkeleton variant="card" />'
    >
      <div class="grid">
        <div><p class="cap">paragraph</p><ISkeleton variant="paragraph" :rows="3" /></div>
        <div><p class="cap">avatar</p><ISkeleton variant="avatar" /></div>
        <div><p class="cap">list</p><ISkeleton variant="list" :rows="2" /></div>
        <div><p class="cap">card</p><ISkeleton variant="card" /></div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="包裹真实内容"
      description="loading 为 false 时渲染默认插槽——同一处代码同时描述加载态与完成态，两者不会走散。"
      lang="vue"
      code='<ISkeleton :loading="loading" variant="avatar">
  <div class="user">
    <IAvatar name="林岚" />
    <div>林岚 · 前端工程师</div>
  </div>
</ISkeleton>'
    >
      <div class="wrap">
        <IButton size="sm" @click="loading = !loading">
          {{ loading ? '加载完成' : '重新加载' }}
        </IButton>
        <ICard>
          <ISkeleton :loading="loading" variant="avatar">
            <div class="user">
              <IAvatar name="林岚" size="lg" />
              <div>
                <p class="user__name">林岚</p>
                <p class="user__desc">前端工程师 · 本迭代负责 6 个工作项</p>
              </div>
            </div>
          </ISkeleton>
        </ICard>
      </div>
    </DemoBlock>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>loading</td><td><code>boolean</code></td><td><code>true</code></td><td>为 false 时渲染默认插槽</td></tr>
        <tr><td>variant</td><td><code>text | paragraph | card | list | avatar</code></td><td><code>paragraph</code></td><td>预设版式</td></tr>
        <tr><td>rows</td><td><code>number</code></td><td><code>3</code></td><td>段落行数 / 列表条数</td></tr>
        <tr><td>animated</td><td><code>boolean</code></td><td><code>true</code></td><td>微光扫过动画</td></tr>
      </tbody>
    </table>

    <h2>动效偏好</h2>
    <p>
      骨架屏用一道微光扫过而不是整体闪烁——闪烁在长列表里会形成密集的明暗跳动。
      系统开启「减少动效」时动画自动关闭，只保留静态占位。
    </p>
  </article>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--i-spacing-6);
  width: 100%;
}
.cap {
  margin-bottom: var(--i-spacing-3);
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-tertiary);
}
.wrap { display: grid; gap: var(--i-spacing-4); width: 100%; max-width: 460px; }
.user { display: flex; align-items: center; gap: var(--i-spacing-3); }
.user__name { color: var(--i-color-text); font-weight: 500; }
.user__desc { font-size: var(--i-font-size-sm); color: var(--i-color-text-tertiary); }
</style>
