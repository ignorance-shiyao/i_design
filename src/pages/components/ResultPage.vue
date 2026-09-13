<script setup lang="ts">
import IResult from '@/components/IResult.vue'
import IButton from '@/components/IButton.vue'
import IDescriptions from '@/components/IDescriptions.vue'
import DemoBlock from '@/site/DemoBlock.vue'
</script>

<template>
  <article>
    <h1>Result 结果页</h1>
    <p class="i-lead">
      一次操作或一段流程结束后的整页反馈。与 Message 的分界很清楚：Message 是「顺手告诉你一声」，
      Result 是「这一页的任务到此为止，接下来该往哪走」——所以它必须给出下一步操作。
    </p>

    <DemoBlock
      title="操作结果"
      description="成功页要给出「继续」和「返回」两条路：用户可能想再来一次，也可能想去看结果。"
      lang="vue"
      code='<IResult status="success" title="工作项已创建" description="WI-1088 已同步到本迭代看板。">
  <IButton variant="primary">查看详情</IButton>
  <IButton>再建一个</IButton>
</IResult>'
    >
      <IResult
        status="success"
        size="sm"
        title="工作项已创建"
        description="WI-1088 已同步到本迭代看板。"
      >
        <IButton variant="primary">查看详情</IButton>
        <IButton>再建一个</IButton>
      </IResult>
    </DemoBlock>

    <DemoBlock
      title="异常状态"
      description="403 / 404 / 500 各有默认文案；404 与 500 配有插画，其余状态用图标即可——不必为每种状态都画一张。"
      lang="vue"
      code='<IResult status="403" />
<IResult status="500" />'
    >
      <div class="stack">
        <IResult status="403" size="sm">
          <IButton variant="primary">申请权限</IButton>
        </IResult>
        <IResult status="500" size="sm">
          <IButton variant="primary">重试</IButton>
          <IButton>返回首页</IButton>
        </IResult>
      </div>
    </DemoBlock>

    <DemoBlock
      title="附加信息"
      description="失败时把可核对的上下文放进 extra，比只说一句「失败了」有用得多。"
      lang="vue"
      code='<IResult status="error" title="提交未通过校验">
  <IButton variant="primary">返回修改</IButton>
  <template #extra>
    <IDescriptions :items="items" :column="1" size="sm" />
  </template>
</IResult>'
    >
      <IResult status="error" size="sm" title="提交未通过校验" description="以下字段需要修正后重新提交。">
        <IButton variant="primary">返回修改</IButton>
        <template #extra>
          <IDescriptions
            size="sm"
            :column="1"
            :items="[
              { label: '标题', value: '不能少于 4 个字符' },
              { label: '负责人工号', value: '格式应为 1 位大写字母 + 5 位数字' }
            ]"
          />
        </template>
      </IResult>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>结果只是一句「已保存」时——用 message 飘一下，整页的结果页会打断流程。</li>
      <li>错误可以就地修复时——留在原页面并指出哪一项有问题，跳到结果页等于把用户填的东西藏起来了。</li>
      <li>结果页上没有下一步可去时——补一个明确的去处，否则用户只能按浏览器的后退。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>status</td><td><code>success | info | warning | error | 403 | 404 | 500</code></td><td><code>info</code></td><td>状态，决定插画/图标与默认文案</td></tr>
        <tr><td>title / description</td><td><code>string</code></td><td>—</td><td>覆盖默认文案</td></tr>
        <tr><td>size</td><td><code>sm | md</code></td><td><code>md</code></td><td>整页用 md，嵌在卡片内用 sm</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>插槽</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>default</td><td>下一步操作按钮；建议至少一个</td></tr>
        <tr><td>extra</td><td>附加信息区，左对齐，适合放错误明细或摘要</td></tr>
        <tr><td>illustration</td><td>替换插画或图标</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.stack { display: grid; gap: var(--i-spacing-6); width: 100%; }
</style>
