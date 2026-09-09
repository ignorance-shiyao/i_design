<script setup lang="ts">
import { ref } from 'vue'
import ITextarea from '@/components/ITextarea.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const basic = ref('')
const counted = ref('复现步骤：1. 打开工作项列表')
const fixed = ref('')
</script>

<template>
  <article>
    <h1>Textarea 多行文本框</h1>
    <p class="i-lead">
      接收多行文本。默认行数应贴近预期输入长度——给一个三行的框，用户就会写三行。
    </p>

    <DemoBlock
      title="基础用法"
      code='<ITextarea v-model="value" placeholder="请输入描述" :rows="3" />'
    >
      <div class="w"><ITextarea v-model="basic" placeholder="请输入描述" /></div>
    </DemoBlock>

    <DemoBlock
      title="字数统计"
      description="showCount 需配合 maxlength；超出上限时计数与边框同时转为危险色。"
      code='<ITextarea v-model="value" :maxlength="120" show-count :rows="4" />'
    >
      <div class="w"><ITextarea v-model="counted" :maxlength="120" show-count :rows="4" /></div>
    </DemoBlock>

    <DemoBlock
      title="禁止缩放与禁用"
      description="嵌在固定高度的面板里时把 resize 设为 none，避免用户拖动后撑破布局。"
      code='<ITextarea v-model="value" resize="none" />
<ITextarea disabled placeholder="已禁用" />'
    >
      <div class="stack">
        <div class="w"><ITextarea v-model="fixed" resize="none" placeholder="不可拖动缩放" /></div>
        <div class="w"><ITextarea disabled placeholder="已禁用" /></div>
      </div>
    </DemoBlock>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>string</code></td><td><code>''</code></td><td>绑定值，支持 v-model</td></tr>
        <tr><td>placeholder</td><td><code>string</code></td><td><code>''</code></td><td>占位文本</td></tr>
        <tr><td>rows</td><td><code>number</code></td><td><code>3</code></td><td>默认显示行数</td></tr>
        <tr><td>maxlength</td><td><code>number</code></td><td>—</td><td>最大字符数</td></tr>
        <tr><td>showCount</td><td><code>boolean</code></td><td><code>false</code></td><td>显示字数统计</td></tr>
        <tr><td>resize</td><td><code>none | vertical | both</code></td><td><code>vertical</code></td><td>缩放方向</td></tr>
        <tr><td>disabled</td><td><code>boolean</code></td><td><code>false</code></td><td>是否禁用</td></tr>
        <tr><td>invalid</td><td><code>boolean</code></td><td><code>false</code></td><td>校验失败态</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.w { width: 360px; max-width: 100%; }
.stack { display: grid; gap: var(--i-spacing-4); }
</style>
