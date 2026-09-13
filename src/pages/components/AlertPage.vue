<script setup lang="ts">
import { ref } from 'vue'
import IAlert from '@/components/IAlert.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const visible = ref(true)
</script>

<template>
  <article>
    <h1>Alert 警告提示</h1>
    <p class="i-lead">
      在页面内展示需要用户关注但不打断操作的信息。需要用户立刻响应的场景请使用对话框。
    </p>

    <DemoBlock
      title="语义类型"
      code='<IAlert type="info">系统将于今晚 22:00 维护。</IAlert>
<IAlert type="success" title="提交成功">工作项已同步到看板。</IAlert>
<IAlert type="warning">当前配额已使用 90%。</IAlert>
<IAlert type="danger" title="构建失败">请查看流水线日志。</IAlert>'
    >
      <div class="stack">
        <IAlert type="info">系统将于今晚 22:00 维护。</IAlert>
        <IAlert type="success" title="提交成功">工作项已同步到看板。</IAlert>
        <IAlert type="warning">当前配额已使用 90%。</IAlert>
        <IAlert type="danger" title="构建失败">请查看流水线日志。</IAlert>
      </div>
    </DemoBlock>

    <DemoBlock
      title="可关闭"
      description="关闭由使用方控制显隐，组件只抛出 close 事件。"
      code='<IAlert v-if="visible" closable @close="visible = false">
  可关闭的提示。
</IAlert>'
    >
      <div class="stack">
        <IAlert v-if="visible" closable @close="visible = false">可关闭的提示。</IAlert>
        <a v-else href="#" @click.prevent="visible = true">重新显示</a>
      </div>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>提示只与某一个输入项有关时——那是表单项自己的错误文案，写在字段下面，用户不必抬头找。</li>
      <li>消息是一次性的、看过就不必再看时（保存成功、已复制）——用 message 飘一下，常驻的横幅会一直占着版面。</li>
      <li>需要用户当场做决定时——横幅拦不住人，那是对话框或 Popconfirm 的事。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>type</td><td><code>info | success | warning | danger</code></td><td><code>info</code></td><td>语义类型</td></tr>
        <tr><td>title</td><td><code>string</code></td><td><code>''</code></td><td>标题，留空则只渲染内容</td></tr>
        <tr><td>closable</td><td><code>boolean</code></td><td><code>false</code></td><td>是否展示关闭按钮</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>事件</th><th>说明</th></tr></thead>
      <tbody><tr><td>close</td><td>点击关闭按钮时触发</td></tr></tbody>
    </table>
  </article>
</template>

<style scoped>
.stack { display: grid; gap: var(--i-spacing-3); width: 100%; }
</style>
