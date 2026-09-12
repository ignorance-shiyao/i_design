<script setup lang="ts">
import IButtonGroup from '@/components/IButtonGroup.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import Playground from '@/site/Playground.vue'
import { snippets } from '@/data/snippets'
</script>

<template>
  <article>
    <h1>Button 按钮</h1>
    <p class="i-lead">触发一个即时操作。一屏之内主按钮应当只有一个，指向该页面最主要的动作。</p>

    <h2>现场调参</h2>
    <p>下面的控件由源码里的属性类型生成，改动即时生效，代码区给出对应写法。</p>
    <Playground name="IButton" :is="IButton" slot-text="提交" />

    <DemoBlock
      title="多端用法"
      description="同一个按钮在 Vue 3 / Vue 2 / React / 小程序 / 移动端 / Flutter 上怎么写——属性名由校验脚本核对，不会与实现分叉。"
      :snippets="snippets.button"
    >
      <IButton variant="primary">提交</IButton>
      <IButton :loading="true">保存</IButton>
    </DemoBlock>

    <DemoBlock
      title="视觉层级"
      description="主按钮承载页面主操作，次按钮用于并列操作，文字按钮用于低权重操作，危险按钮用于不可逆操作。"
      code='<IButton variant="primary">主按钮</IButton>
<IButton>次按钮</IButton>
<IButton variant="text">文字按钮</IButton>
<IButton variant="danger">删除</IButton>'
    >
      <IButton variant="primary">主按钮</IButton>
      <IButton>次按钮</IButton>
      <IButton variant="text">文字按钮</IButton>
      <IButton variant="danger">删除</IButton>
    </DemoBlock>

    <DemoBlock
      title="尺寸"
      description="三档尺寸与表单控件对齐，同一区域内保持一致。"
      code='<IButton size="sm">小</IButton>
<IButton size="md">中</IButton>
<IButton size="lg">大</IButton>'
    >
      <IButton size="sm">小</IButton>
      <IButton size="md">中</IButton>
      <IButton size="lg">大</IButton>
    </DemoBlock>

    <DemoBlock
      title="加载与禁用"
      description="加载态自动禁用点击，避免重复提交。"
      code='<IButton variant="primary" loading>提交中</IButton>
<IButton disabled>禁用</IButton>'
    >
      <IButton variant="primary" loading>提交中</IButton>
      <IButton disabled>禁用</IButton>
    </DemoBlock>

    <h2>ButtonGroup 按钮组</h2>
    <p>
      一组紧挨着的按钮，表达「同一类操作的几个变体」。相接的两边去掉圆角、边框合成一条——两个 1px 边框贴在一起，视觉上就是加粗了一条线。
    </p>
    <DemoBlock
      title="按钮组"
      code='<IButtonGroup>
  <IButton>上一页</IButton>
  <IButton>下一页</IButton>
</IButtonGroup>'
    >
      <IButtonGroup>
        <IButton>上一页</IButton>
        <IButton>下一页</IButton>
      </IButtonGroup>
    </DemoBlock>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>variant</td><td><code>primary | secondary | text | danger</code></td><td><code>secondary</code></td><td>视觉层级</td></tr>
        <tr><td>size</td><td><code>sm | md | lg</code></td><td><code>md</code></td><td>尺寸</td></tr>
        <tr><td>disabled</td><td><code>boolean</code></td><td><code>false</code></td><td>是否禁用</td></tr>
        <tr><td>loading</td><td><code>boolean</code></td><td><code>false</code></td><td>加载中，同时禁用点击</td></tr>
        <tr><td>block</td><td><code>boolean</code></td><td><code>false</code></td><td>撑满父容器宽度</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>事件</th><th>回调参数</th><th>说明</th></tr></thead>
      <tbody><tr><td>click</td><td><code>MouseEvent</code></td><td>点击时触发</td></tr></tbody>
    </table>
  </article>
</template>
