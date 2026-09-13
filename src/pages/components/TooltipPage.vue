<script setup lang="ts">
import ITooltip from '@/components/ITooltip.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'
</script>

<template>
  <article>
    <h1>Tooltip 文字提示</h1>
    <p class="i-lead">
      悬浮时补充一句说明。提示内容必须是「锦上添花」——关键信息不能只放在 Tooltip 里，触屏用户没有悬浮态。
    </p>

    <DemoBlock
      title="四个方向"
      code='<ITooltip content="提示内容" placement="top">
  <IButton>上方</IButton>
</ITooltip>'
    >
      <ITooltip content="出现在上方" placement="top"><IButton>上方</IButton></ITooltip>
      <ITooltip content="出现在下方" placement="bottom"><IButton>下方</IButton></ITooltip>
      <ITooltip content="出现在左侧" placement="left"><IButton>左侧</IButton></ITooltip>
      <ITooltip content="出现在右侧" placement="right"><IButton>右侧</IButton></ITooltip>
    </DemoBlock>

    <DemoBlock
      title="延迟与富文本"
      description="delay 避免鼠标划过一排按钮时提示连续闪烁；content 插槽可放置多行说明。"
      code='<ITooltip :delay="400">
  <template #content>
    <strong>故事点</strong><br />用于估算工作量的相对单位。
  </template>
  <span class="dashed">故事点</span>
</ITooltip>'
    >
      <ITooltip :delay="400">
        <template #content>
          <strong>故事点</strong><br />用于估算工作量的相对单位，不等于人天。
        </template>
        <span class="dashed">故事点</span>
      </ITooltip>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>信息是必读的时——提示只在悬停时出现，触屏上根本摸不到。</li>
      <li>内容里有可点的东西时——鼠标移过去的路上提示就消失了，用弹出框。</li>
      <li>提示文字比被提示的元素还长时——那是说明文字，写在界面上。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>content</td><td><code>string</code></td><td><code>''</code></td><td>提示文案，也可用 content 插槽</td></tr>
        <tr><td>placement</td><td><code>top | bottom | left | right</code></td><td><code>top</code></td><td>弹出方向</td></tr>
        <tr><td>delay</td><td><code>number</code></td><td><code>100</code></td><td>悬浮多少毫秒后出现</td></tr>
        <tr><td>disabled</td><td><code>boolean</code></td><td><code>false</code></td><td>禁用提示</td></tr>
      </tbody>
    </table>

    <h2>无障碍</h2>
    <p>
      提示同时响应 <code>focus</code>，键盘用户 Tab 到触发元素即可看到；显示时触发元素带上<code>aria-describedby</code>，读屏软件会连同提示一起播报，<code>Esc</code> 可关闭。
    </p>
  </article>
</template>

<style scoped>
.dashed { border-bottom: 1px dashed var(--i-color-border-strong); cursor: help; }
</style>
