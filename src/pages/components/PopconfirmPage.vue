<script setup lang="ts">
import IPopconfirm from '@/components/IPopconfirm.vue'
import IButton from '@/components/IButton.vue'
import IIcon from '@/components/IIcon.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { message } from '@/components/message'
</script>

<template>
  <article>
    <h1>Popconfirm 气泡确认</h1>
    <p class="i-lead">
      就地确认一个轻量操作。与 Modal 的分界：影响范围小、能一句话说清、用户不需要额外信息就能决定的，用气泡；需要用户读完一段说明或核对数据的，用对话框。
    </p>

    <DemoBlock
      title="基础用法"
      description="气泡出现在触发元素旁边，用户的视线不用离开操作现场。"
      lang="vue"
      code='<IPopconfirm title="确认归档该工作项？" @confirm="onConfirm">
  <IButton>归档</IButton>
</IPopconfirm>'
    >
      <IPopconfirm title="确认归档该工作项？" @confirm="message.success('已归档')">
        <IButton>归档</IButton>
      </IPopconfirm>

      <IPopconfirm
        title="移出本迭代？"
        content="工作项会回到待规划池，不会被删除。"
        placement="bottom"
        @confirm="message.success('已移出迭代')"
      >
        <IButton>移出迭代</IButton>
      </IPopconfirm>
    </DemoBlock>

    <DemoBlock
      title="破坏性操作"
      description="用 danger 让确认按钮本身说明后果；content 要写清影响范围，别只说「确定吗」。"
      lang="vue"
      code='<IPopconfirm
  type="danger"
  icon="warning-triangle"
  title="删除这条评论？"
  content="删除后无法恢复。"
  confirm-text="删除"
  @confirm="onDelete"
>
  <IButton variant="text"><IIcon name="trash" :size="15" />删除</IButton>
</IPopconfirm>'
    >
      <IPopconfirm
        type="danger"
        icon="warning-triangle"
        title="删除这条评论？"
        content="删除后无法恢复，其他成员的回复也会一并移除。"
        confirm-text="删除"
        @confirm="message.error('已删除')"
        @cancel="message.info('已取消')"
      >
        <IButton variant="text"><IIcon name="trash" :size="15" />删除</IButton>
      </IPopconfirm>
    </DemoBlock>

    <DemoBlock
      title="弹出方向"
      lang="vue"
      code='<IPopconfirm placement="right" title="…"><IButton>右侧</IButton></IPopconfirm>'
    >
      <IPopconfirm placement="top" title="出现在上方"><IButton>上方</IButton></IPopconfirm>
      <IPopconfirm placement="bottom" title="出现在下方"><IButton>下方</IButton></IPopconfirm>
      <IPopconfirm placement="right" title="出现在右侧"><IButton>右侧</IButton></IPopconfirm>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>操作不可逆且影响很大时（删除整个项目、清空数据）——用对话框，并要求用户读完后果再确认。</li>
      <li>操作随手可撤销时——直接执行，给一个「撤销」更省事：每次都问一句会把人训练成闭眼点确定。</li>
      <li>确认时还要填东西时——那是一个小表单，弹出框装不下，用对话框。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>title</td><td><code>string</code></td><td><code>确认执行该操作？</code></td><td>主问句</td></tr>
        <tr><td>content</td><td><code>string</code></td><td><code>''</code></td><td>补充说明，写清影响范围</td></tr>
        <tr><td>type</td><td><code>brand | danger</code></td><td><code>brand</code></td><td>破坏性操作用 danger</td></tr>
        <tr><td>confirmText / cancelText</td><td><code>string</code></td><td><code>确定 / 取消</code></td><td>按钮文案；建议写成动词</td></tr>
        <tr><td>placement</td><td><code>top | bottom | left | right</code></td><td><code>top</code></td><td>弹出方向</td></tr>
        <tr><td>icon</td><td><code>IconName</code></td><td><code>help-circle</code></td><td>提示图标</td></tr>
        <tr><td>disabled</td><td><code>boolean</code></td><td><code>false</code></td><td>禁用后点击不弹出</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>事件</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>confirm</td><td>点击确认按钮</td></tr>
        <tr><td>cancel</td><td>点击取消按钮</td></tr>
      </tbody>
    </table>

    <h2>无障碍</h2>
    <p>
      气泡是 <code>role="dialog"</code>，打开后焦点移入第一个按钮，因此 Tab 可在两个按钮间移动、<code>Esc</code> 可关闭。点击气泡之外的任意位置也会关闭且不触发确认——误触的代价必须是「什么都没发生」。
    </p>
  </article>
</template>
