<script setup lang="ts">
import { ref } from 'vue'
import IStickyTool from '@/components/IStickyTool.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import type { StickyToolItem } from '@/components/IStickyTool.vue'

const items: StickyToolItem[] = [
  { value: 'chat', label: '咨询', icon: 'user' },
  { value: 'doc', label: '文档', icon: 'file-text' },
  { value: 'code', label: '源码', icon: 'code' },
  { value: 'top', label: '顶部', icon: 'chevron-up' }
]

const shown = ref(false)
const active = ref('doc')

function onClick(item: StickyToolItem) {
  active.value = item.value
  if (item.value === 'top') window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <article>
    <h1>StickyTool 侧边工具条</h1>
    <p class="i-lead">
      贴在视口一侧、跟着页面走的一组快捷入口：咨询、反馈、回到顶部。竖排而不是横排——横排会占掉正文的宽度，而这些入口的重要性远低于正文。
    </p>

    <DemoBlock
      title="基础用法"
      description="点击下方按钮在页面右侧显示工具条。窄屏下自动收成只剩图标：56px 一条竖栏在手机上会压住正文。"
      code='<IStickyTool :items="items" :active="active" @click="onClick" />'
    >
      <IButton @click="shown = !shown">{{ shown ? '隐藏工具条' : '显示工具条' }}</IButton>
      <IStickyTool v-if="shown" :items="items" :active="active" @click="onClick" />
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>操作与当前页面强相关时——它始终压在内容之上，放进去会让人以为那是全站功能，换一页发现点不动更糟。</li>
      <li>入口超过五六个时——贴边的一条会长到盖住内容，那是导航该解决的问题。</li>
      <li>窄屏为主时——它占掉一侧本就不多的宽度，移动端改用悬浮操作按钮或底部操作条。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>items</td><td><code>StickyToolItem[]</code></td><td>—</td><td>入口列表：<code>{ value, label, icon, disabled }</code></td></tr>
        <tr><td>placement</td><td><code>right | left</code></td><td><code>right</code></td><td>贴哪一侧</td></tr>
        <tr><td>active</td><td><code>string</code></td><td><code>''</code></td><td>当前高亮项</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>事件</th><th>参数</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>click</td><td><code>(item: StickyToolItem)</code></td><td>点击某一项</td></tr>
      </tbody>
    </table>
  </article>
</template>
