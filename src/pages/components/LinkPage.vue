<script setup lang="ts">
import ILink from '@/components/ILink.vue'
import ISpace from '@/components/ISpace.vue'
import DemoBlock from '@/site/DemoBlock.vue'
</script>

<template>
  <article>
    <h1>Link 链接</h1>
    <p class="i-lead">
      跳转到另一个地址。它与按钮的区别不是长相而是后果：链接换一个位置，按钮做一件事——能被收藏、能在新标签页打开的才是链接。
    </p>

    <DemoBlock
      title="基础用法"
      code='<ILink href="/components/button">查看按钮文档</ILink>'
    >
      <ILink href="#" @click.prevent>查看按钮文档</ILink>
    </DemoBlock>

    <DemoBlock
      title="语义"
      description="默认档用于正文里的普通跳转，其余几档跟随语义色。"
      code='<ILink theme="default">默认</ILink>
<ILink theme="brand">主题</ILink>
<ILink theme="danger">删除说明</ILink>'
    >
      <ISpace size="md">
        <ILink theme="default" href="#" @click.prevent>默认</ILink>
        <ILink theme="brand" href="#" @click.prevent>主题</ILink>
        <ILink theme="success" href="#" @click.prevent>成功</ILink>
        <ILink theme="warning" href="#" @click.prevent>警告</ILink>
        <ILink theme="danger" href="#" @click.prevent>危险</ILink>
      </ISpace>
    </DemoBlock>

    <DemoBlock
      title="下划线"
      description="默认一直带下划线。颜色不能是「这是个链接」的唯一线索——色觉障碍用户与灰度打印都读不出来。只有本身已经成区块的入口（卡片标题、导航项）才适合关掉。"
      code='<ILink underline="always">一直有</ILink>
<ILink underline="hover">悬停时</ILink>
<ILink underline="never">从不</ILink>'
    >
      <ISpace size="md">
        <ILink underline="always" href="#" @click.prevent>一直有</ILink>
        <ILink underline="hover" href="#" @click.prevent>悬停时</ILink>
        <ILink underline="never" href="#" @click.prevent>从不</ILink>
      </ISpace>
    </DemoBlock>

    <DemoBlock
      title="外链与图标"
      description="target=&quot;_blank&quot; 时自动补一个外链角标，并补上 rel=&quot;noopener&quot;：点下去会离开当前站点，这件事该在点之前就看得出来。"
      code='<ILink href="https://example.com" target="_blank">打开外部文档</ILink>
<ILink prefix-icon="download">下载报表</ILink>'
    >
      <ISpace size="md">
        <ILink href="https://example.com" target="_blank">打开外部文档</ILink>
        <ILink prefix-icon="download" href="#" @click.prevent>下载报表</ILink>
      </ISpace>
    </DemoBlock>

    <DemoBlock
      title="尺寸与禁用"
      code='<ILink size="sm">小</ILink>
<ILink disabled>不可用</ILink>'
    >
      <ISpace size="md" align="center">
        <ILink size="sm" href="#" @click.prevent>小号</ILink>
        <ILink size="md" href="#" @click.prevent>默认</ILink>
        <ILink size="lg" href="#" @click.prevent>大号</ILink>
        <ILink disabled>不可用</ILink>
      </ISpace>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>点下去不离开当前地址、只是触发一个动作时——那是按钮。链接的右键菜单会给出「在新标签页打开」，而那一项在这里是坏的。</li>
      <li>整块区域都可点时——让整块可点，一行里只有几个字能点会让人反复试。</li>
      <li>链接文字是「点击这里」时——把目的地写进文字里，读屏用户听到的正是这几个字。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>href</td><td><code>string</code></td><td><code>''</code></td><td>目标地址。为空时渲染成 button，仍可接收点击</td></tr>
        <tr><td>target</td><td><code>_self | _blank</code></td><td><code>_self</code></td><td>新窗口打开时自动补 rel="noopener" 与外链角标</td></tr>
        <tr><td>theme</td><td><code>default | brand | success | warning | danger</code></td><td><code>brand</code></td><td>语义色</td></tr>
        <tr><td>size</td><td><code>sm | md | lg</code></td><td><code>md</code></td><td>字号档位</td></tr>
        <tr><td>underline</td><td><code>always | hover | never</code></td><td><code>always</code></td><td>下划线时机</td></tr>
        <tr><td>disabled</td><td><code>boolean</code></td><td><code>false</code></td><td>禁用</td></tr>
        <tr><td>prefixIcon / suffixIcon</td><td><code>IconName</code></td><td>—</td><td>前后图标</td></tr>
      </tbody>
    </table>
  </article>
</template>
