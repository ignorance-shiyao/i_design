<script setup lang="ts">
import { message } from '@/components/message'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'
</script>

<template>
  <article>
    <h1>Message 全局提示</h1>
    <p class="i-lead">
      操作结果的轻量反馈：不打断流程、不需要用户确认、几秒后自行消失。
      需要用户读完并做决定的信息，请用 Alert 或 Modal。
    </p>

    <DemoBlock
      title="四种语义"
      description="以命令式 API 调用，无需在模板里放置组件——容器在首次调用时才挂载。"
      code="import { message } from '@/components/message'

message.success('工作项已创建')
message.info('内容已保存为草稿')
message.warning('当前配额已使用 90%')
message.error('提交失败，请稍后重试')"
    >
      <IButton @click="message.success('工作项已创建')">成功</IButton>
      <IButton @click="message.info('内容已保存为草稿')">信息</IButton>
      <IButton @click="message.warning('当前配额已使用 90%')">警告</IButton>
      <IButton @click="message.error('提交失败，请稍后重试')">错误</IButton>
    </DemoBlock>

    <DemoBlock
      title="持续显示与手动关闭"
      description="duration 传 0 表示不自动关闭，此时应同时开启 closable，否则用户无法消除它。"
      code="const handle = message.open({
  content: '正在同步到迭代看板…',
  duration: 0,
  closable: true
})

// 同步完成后主动关闭
handle.close()"
    >
      <IButton @click="message.open({ content: '正在同步到迭代看板…', duration: 0, closable: true })">
        常驻提示
      </IButton>
      <IButton variant="text" @click="message.closeAll()">全部关闭</IButton>
    </DemoBlock>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>方法</th><th>签名</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>message.open</td><td><code>(options: MessageOptions) =&gt; { close }</code></td><td>完整配置，返回可主动关闭的句柄</td></tr>
        <tr><td>message.success / info / warning / error</td><td><code>(content, options?) =&gt; { close }</code></td><td>四种语义的快捷方式</td></tr>
        <tr><td>message.closeAll</td><td><code>() =&gt; void</code></td><td>清空全部消息，常用于路由切换</td></tr>
      </tbody>
    </table>
    <h3>MessageOptions</h3>
    <table class="i-table">
      <thead><tr><th>字段</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>content</td><td><code>string</code></td><td>—</td><td>提示文案，必填</td></tr>
        <tr><td>type</td><td><code>info | success | warning | danger</code></td><td><code>info</code></td><td>语义类型</td></tr>
        <tr><td>duration</td><td><code>number</code></td><td><code>3000</code></td><td>毫秒；传 0 表示不自动关闭</td></tr>
        <tr><td>closable</td><td><code>boolean</code></td><td><code>false</code></td><td>是否显示关闭按钮</td></tr>
      </tbody>
    </table>

    <h2>无障碍</h2>
    <p>
      消息容器带 <code>role="status" aria-live="polite"</code>：读屏软件会在当前朗读结束后播报新消息，
      既不抢焦点，也不会漏掉反馈。
    </p>
  </article>
</template>
