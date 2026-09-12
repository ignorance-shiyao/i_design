<script setup lang="ts">
import { ref } from 'vue'
import IRadio from '@/components/IRadio.vue'
import IRadioGroup from '@/components/IRadioGroup.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const basic = ref('all')
const button = ref('week')
const vertical = ref('auto')
</script>

<template>
  <article>
    <h1>Radio 单选框</h1>
    <p class="i-lead">
      从一组互斥选项中选择一个。选项超过 5 个时改用 Select——单选框的优势是把所有选项一次摊开，选项一多这个优势就不存在了。
    </p>

    <DemoBlock
      title="基础用法"
      description="用 RadioGroup 包裹时，选中值由 group 统一管理，子项只需声明自己的 value。"
      code='<IRadioGroup v-model="value">
  <IRadio value="all">全部</IRadio>
  <IRadio value="mine">我负责的</IRadio>
  <IRadio value="closed" disabled>已归档</IRadio>
</IRadioGroup>'
    >
      <IRadioGroup v-model="basic">
        <IRadio value="all">全部</IRadio>
        <IRadio value="mine">我负责的</IRadio>
        <IRadio value="closed" disabled>已归档</IRadio>
      </IRadioGroup>
    </DemoBlock>

    <DemoBlock
      title="按钮形态"
      description="用于筛选条或工具栏，占位更紧凑，视觉上更像一组分段控件。"
      code='<IRadioGroup v-model="value" variant="button">
  <IRadio value="day">今日</IRadio>
  <IRadio value="week">本周</IRadio>
</IRadioGroup>'
    >
      <IRadioGroup v-model="button" variant="button">
        <IRadio value="day">今日</IRadio>
        <IRadio value="week">本周</IRadio>
        <IRadio value="month">本月</IRadio>
        <IRadio value="quarter" disabled>本季度</IRadio>
      </IRadioGroup>
    </DemoBlock>

    <DemoBlock
      title="纵向排列"
      description="选项文案较长时改为纵向，避免横向换行造成的对齐混乱。"
      code='<IRadioGroup v-model="value" direction="vertical">…</IRadioGroup>'
    >
      <IRadioGroup v-model="vertical" direction="vertical">
        <IRadio value="auto">自动分配给当前迭代的负责人</IRadio>
        <IRadio value="manual">提交后手动指派</IRadio>
        <IRadio value="none">暂不分配</IRadio>
      </IRadioGroup>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>选项超过五六个时——用下拉，一排单选按钮会把版面撑开且难以扫读。</li>
      <li>选项可以多选时——那是多选框。</li>
      <li>两个选项且是开关语义、改完立即生效时——用 Switch，「开 / 关」两个单选按钮是绕远路。</li>
    </ul>

    <h2>API</h2>
    <h3>IRadioGroup</h3>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>string | number | boolean</code></td><td>—</td><td>选中值，支持 v-model</td></tr>
        <tr><td>variant</td><td><code>default | button</code></td><td><code>default</code></td><td>视觉形态，下发给所有子项</td></tr>
        <tr><td>direction</td><td><code>horizontal | vertical</code></td><td><code>horizontal</code></td><td>排列方向</td></tr>
        <tr><td>disabled</td><td><code>boolean</code></td><td><code>false</code></td><td>整组禁用</td></tr>
      </tbody>
    </table>
    <h3>IRadio</h3>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>value</td><td><code>string | number | boolean</code></td><td>—</td><td>该项的值，必填</td></tr>
        <tr><td>modelValue</td><td><code>string | number | boolean</code></td><td>—</td><td>脱离 Group 单独使用时的绑定值</td></tr>
        <tr><td>disabled</td><td><code>boolean</code></td><td><code>false</code></td><td>单项禁用</td></tr>
      </tbody>
    </table>

    <h2>无障碍</h2>
    <p>
      组件保留原生 <code>&lt;input type="radio"&gt;</code>（仅视觉隐藏），同组共享 <code>name</code>，因此浏览器原生的方向键切换、表单提交与读屏播报均可正常工作。
    </p>
  </article>
</template>
