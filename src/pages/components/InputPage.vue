<script setup lang="ts">
import { ref } from 'vue'
import IInput from '@/components/IInput.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const basic = ref('')
const invalid = ref('非法输入')
</script>

<template>
  <article>
    <h1>Input 输入框</h1>
    <p class="i-lead">接收用户的单行文本输入。占位符用于示例而非说明，必要的解释请放在标签或下方提示中。</p>

    <DemoBlock
      title="基础用法"
      code='<IInput v-model="value" placeholder="请输入内容" />'
    >
      <div class="w"><IInput v-model="basic" placeholder="请输入内容" /></div>
    </DemoBlock>

    <DemoBlock
      title="尺寸"
      description="与同区域的按钮尺寸保持一致。"
      code='<IInput size="sm" />
<IInput size="md" />
<IInput size="lg" />'
    >
      <div class="w"><IInput size="sm" placeholder="小" /></div>
      <div class="w"><IInput size="md" placeholder="中" /></div>
      <div class="w"><IInput size="lg" placeholder="大" /></div>
    </DemoBlock>

    <DemoBlock
      title="校验失败与禁用"
      description="校验失败时同时设置 invalid，组件会输出 aria-invalid 供读屏软件识别。"
      code='<IInput v-model="value" invalid />
<IInput disabled placeholder="禁用" />'
    >
      <div class="w"><IInput v-model="invalid" invalid /></div>
      <div class="w"><IInput disabled placeholder="禁用" /></div>
    </DemoBlock>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>string</code></td><td><code>''</code></td><td>绑定值，支持 v-model</td></tr>
        <tr><td>placeholder</td><td><code>string</code></td><td><code>''</code></td><td>占位文本</td></tr>
        <tr><td>size</td><td><code>sm | md | lg</code></td><td><code>md</code></td><td>尺寸</td></tr>
        <tr><td>type</td><td><code>string</code></td><td><code>text</code></td><td>原生 input 类型</td></tr>
        <tr><td>disabled</td><td><code>boolean</code></td><td><code>false</code></td><td>是否禁用</td></tr>
        <tr><td>invalid</td><td><code>boolean</code></td><td><code>false</code></td><td>校验失败态</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.w { width: 240px; }
</style>
