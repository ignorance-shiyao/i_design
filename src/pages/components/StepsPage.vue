<script setup lang="ts">
import { ref } from 'vue'
import ISteps, { type StepItem } from '@/components/ISteps.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const items: StepItem[] = [
  { title: '填写基本信息', description: '标题、类型与负责人' },
  { title: '关联迭代', description: '选择目标迭代与优先级' },
  { title: '确认提交', description: '核对后提交到看板' }
]

const current = ref(1)
const errorStep = ref(1)
</script>

<template>
  <article>
    <h1>Steps 步骤条</h1>
    <p class="i-lead">
      把一个长任务拆成有序的几步，并随时告诉用户「走到哪了、还剩几步」。步骤超过 5 步时考虑重新拆分任务。
    </p>

    <DemoBlock
      title="基础用法"
      description="clickable 只允许回到已完成的步骤，防止用户跳过尚未填写的表单。"
      code='<ISteps :items="items" :current="current" clickable @change="current = $event" />'
    >
      <div class="stack">
        <ISteps :items="items" :current="current" clickable @change="current = $event" />
        <div class="row">
          <IButton size="sm" :disabled="current === 0" @click="current--">上一步</IButton>
          <IButton size="sm" variant="primary" :disabled="current === items.length - 1" @click="current++">
            下一步
          </IButton>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="出错状态"
      description="校验或执行失败时把当前步骤标为 error，用户一眼能看出卡在哪一步。"
      code='<ISteps :items="items" :current="1" status="error" />'
    >
      <ISteps :items="items" :current="errorStep" status="error" />
    </DemoBlock>

    <DemoBlock
      title="纵向排列"
      description="步骤描述较长、或嵌在侧边栏时使用纵向。"
      code='<ISteps :items="items" :current="1" direction="vertical" />'
    >
      <ISteps :items="items" :current="1" direction="vertical" />
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>步骤之间可以任意跳时——那是标签页，编号会让人以为必须按顺序来。</li>
      <li>只有两步时——直接做成一页，或用「下一步」按钮，画一条步骤条太隆重。</li>
      <li>步骤多到十几个时——先分组，再在组内分步；一条横着排十几个点谁也读不出自己在哪。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>items</td><td><code>StepItem[]</code></td><td>—</td><td>步骤列表，必填</td></tr>
        <tr><td>current</td><td><code>number</code></td><td><code>0</code></td><td>当前步骤下标，从 0 开始</td></tr>
        <tr><td>status</td><td><code>process | error</code></td><td><code>process</code></td><td>当前步骤的状态</td></tr>
        <tr><td>direction</td><td><code>horizontal | vertical</code></td><td><code>horizontal</code></td><td>排列方向</td></tr>
        <tr><td>clickable</td><td><code>boolean</code></td><td><code>false</code></td><td>允许点击回到已完成步骤</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>事件</th><th>回调参数</th><th>说明</th></tr></thead>
      <tbody><tr><td>change</td><td><code>number</code></td><td>点击已完成步骤时触发</td></tr></tbody>
    </table>
    <p><code>StepItem</code>：<code>{ title: string; description?: string }</code></p>
  </article>
</template>

<style scoped>
.stack { display: grid; gap: var(--i-spacing-6); width: 100%; }
.row { display: flex; gap: var(--i-spacing-2); }
</style>
