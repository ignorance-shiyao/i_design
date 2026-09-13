<script setup lang="ts">
import { ref } from 'vue'
import ISwitch from '@/components/ISwitch.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const on = ref(true)
const off = ref(false)
</script>

<template>
  <article>
    <h1>Switch 开关</h1>
    <p class="i-lead">在两个互斥状态间切换，且立即生效。若变更需要提交后才生效，请改用复选框。</p>

    <DemoBlock title="基础用法" code='<ISwitch v-model="value" />'>
      <ISwitch v-model="on" aria-label="开启状态示例" />
      <ISwitch v-model="off" aria-label="关闭状态示例" />
    </DemoBlock>

    <DemoBlock title="禁用" code='<ISwitch :model-value="true" disabled />'>
      <ISwitch :model-value="true" disabled aria-label="禁用且开启" />
      <ISwitch :model-value="false" disabled aria-label="禁用且关闭" />
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>改动需要提交才生效时——用多选框：Switch 暗示「拨一下就生效了」。</li>
      <li>两个状态不是「开 / 关」而是两个并列选项时（如「按天 / 按周」）——用分段控件。</li>
      <li>操作有后果且不可逆时——拨一下就执行太轻，加一层确认。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>boolean</code></td><td><code>false</code></td><td>开关状态，支持 v-model</td></tr>
        <tr><td>disabled</td><td><code>boolean</code></td><td><code>false</code></td><td>是否禁用</td></tr>
      </tbody>
    </table>
    <p>组件渲染为 <code>role="switch"</code> 的按钮并同步 <code>aria-checked</code>，可直接通过键盘操作。</p>
  </article>
</template>
