<script setup lang="ts">
import IComment from '@/components/IComment.vue'
import ILink from '@/components/ILink.vue'
import DemoBlock from '@/site/DemoBlock.vue'
</script>

<template>
  <article>
    <h1>Comment 评论</h1>
    <p class="i-lead">
      展示一条讨论记录：谁、什么时候、说了什么。回复用缩进表达从属关系，不用加粗的竖线——那在这套体系里是留给状态与类型的暗示，会被读成别的意思。
    </p>

    <DemoBlock
      title="基础用法"
      code='<IComment author="沈言" datetime="3 小时前" content="这个改动我验过了，表格在窄屏下不再横向滚动。" />'
    >
      <IComment
        author="沈言"
        datetime="3 小时前"
        content="这个改动我验过了，表格在窄屏下不再横向滚动。"
      />
    </DemoBlock>

    <DemoBlock
      title="引用与操作"
      description="引用用淡底色块承载被回复的原文；操作区通常放回复、点赞这类轻量入口。"
      code='<IComment author="林澈" datetime="1 小时前" quote="表格在窄屏下不再横向滚动。" content="窄屏下建议直接切卡片，横向滚动在触屏上很难操作。">
  <template #actions>
    <ILink size="sm" underline="hover">回复</ILink>
  </template>
</IComment>'
    >
      <IComment
        author="林澈"
        datetime="1 小时前"
        quote="表格在窄屏下不再横向滚动。"
        content="窄屏下建议直接切卡片，横向滚动在触屏上很难操作。"
      >
        <template #actions>
          <ILink size="sm" underline="hover" href="#" @click.prevent>回复</ILink>
          <ILink size="sm" underline="hover" theme="default" href="#" @click.prevent>复制链接</ILink>
        </template>
      </IComment>
    </DemoBlock>

    <DemoBlock
      title="嵌套回复"
      description="回复放进 replies 插槽，缩进对齐到头像右侧，视线落在同一条竖轴上。"
      code='<IComment author="沈言" datetime="昨天" content="发版前最后一次确认。">
  <template #replies>
    <IComment reply author="林澈" datetime="昨天" content="确认过了，可以发。" />
  </template>
</IComment>'
    >
      <IComment author="沈言" datetime="昨天" content="发版前最后一次确认。">
        <template #replies>
          <IComment reply author="林澈" datetime="昨天" content="确认过了，可以发。" />
          <IComment reply author="周砚" datetime="昨天" content="移动端我也回归了一遍。" />
        </template>
      </IComment>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>只是要展示一段引用或一条通知时——用引用块或提示条，评论的头像与时间会让人以为有人在等回复。</li>
      <li>讨论长到需要分页、搜索、@ 提醒时——那是一个讨论区功能，不是一个展示组件。</li>
      <li>内容来自不可信来源且未经处理时——评论正文按纯文本渲染，别自行拼 HTML。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>author</td><td><code>string</code></td><td><code>''</code></td><td>作者名，同时作为无图头像的取字来源</td></tr>
        <tr><td>datetime</td><td><code>string</code></td><td><code>''</code></td><td>已格式化的时间文案。相对时间用 <code>logic/date</code> 自行换算</td></tr>
        <tr><td>content</td><td><code>string</code></td><td><code>''</code></td><td>正文，也可用默认插槽传富文本</td></tr>
        <tr><td>quote</td><td><code>string</code></td><td><code>''</code></td><td>被回复的原文</td></tr>
        <tr><td>avatar</td><td><code>string</code></td><td><code>''</code></td><td>头像地址</td></tr>
        <tr><td>reply</td><td><code>boolean</code></td><td><code>false</code></td><td>作为回复出现，收紧留白并缩小头像</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>插槽</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>default</td><td>正文</td></tr>
        <tr><td>avatar</td><td>自定义头像</td></tr>
        <tr><td>quote</td><td>自定义引用内容</td></tr>
        <tr><td>actions</td><td>操作区</td></tr>
        <tr><td>replies</td><td>回复列表</td></tr>
      </tbody>
    </table>
  </article>
</template>
