<script setup lang="ts">
import IAvatar from '@/components/IAvatar.vue'
import IAvatarGroup from '@/components/IAvatarGroup.vue'
import DemoBlock from '@/site/DemoBlock.vue'
</script>

<template>
  <article>
    <h1>Avatar 头像</h1>
    <p class="i-lead">
      代表一个用户或实体。头像的首要职责是「在一列相似的行里让人一眼认出是谁」，
      因此可辨识度比精致度更重要。
    </p>

    <DemoBlock
      title="三种内容来源"
      description="有图用图；无图用姓名首字；再没有就退到图标。图片加载失败会自动降级，不留破图。"
      lang="vue"
      code='<IAvatar src="/avatar.png" name="林岚" />
<IAvatar name="林岚" />
<IAvatar />'
    >
      <IAvatar name="林岚" />
      <IAvatar name="陈序" />
      <IAvatar name="Susan Wong" />
      <IAvatar />
      <IAvatar src="/broken-path.png" name="周迟" />
    </DemoBlock>

    <DemoBlock
      title="尺寸与形状"
      lang="vue"
      code='<IAvatar name="苏禾" size="sm" />
<IAvatar name="苏禾" size="lg" />
<IAvatar name="苏禾" :size="56" />
<IAvatar name="苏禾" shape="square" />'
    >
      <IAvatar name="苏禾" size="sm" />
      <IAvatar name="苏禾" size="md" />
      <IAvatar name="苏禾" size="lg" />
      <IAvatar name="苏禾" :size="56" />
      <IAvatar name="苏禾" shape="square" size="lg" />
    </DemoBlock>

    <DemoBlock
      title="头像组"
      description="max 之外的部分折叠为 +N。叠压处加一圈与背景同色的描边，把层次分开。"
      lang="vue"
      code='<IAvatarGroup :max="4" :total="9">
  <IAvatar name="林岚" />
  <IAvatar name="陈序" />
  …
</IAvatarGroup>'
    >
      <IAvatarGroup :max="4" :total="9">
        <IAvatar name="林岚" />
        <IAvatar name="陈序" />
        <IAvatar name="苏禾" />
        <IAvatar name="周迟" />
      </IAvatarGroup>
    </DemoBlock>

    <DemoBlock
      title="头像组的尺寸"
      description="size 同时决定头像与 +N 圆点的大小，两者始终一样高。"
      lang="vue"
      code='<IAvatarGroup size="sm" :max="2" :total="7">
  <IAvatar name="林岚" size="sm" />
  <IAvatar name="陈序" size="sm" />
</IAvatarGroup>'
    >
      <div class="avatar-group-sizes">
        <IAvatarGroup v-for="s in (['sm', 'md', 'lg'] as const)" :key="s" :size="s" :max="2" :total="7">
          <IAvatar name="林岚" :size="s" />
          <IAvatar name="陈序" :size="s" />
        </IAvatarGroup>
      </div>
    </DemoBlock>

    <h2>底色</h2>
    <p>
      无图时的底色由姓名的字符码求和取模得到——同一个人在任何页面、任何列表里颜色都一致，
      不需要额外存储，也不会因为排序变化而换色。
    </p>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>src</td><td><code>string</code></td><td><code>''</code></td><td>图片地址；加载失败自动降级</td></tr>
        <tr><td>name</td><td><code>string</code></td><td><code>''</code></td><td>姓名；中文取末两字，西文取首字母缩写</td></tr>
        <tr><td>icon</td><td><code>IconName</code></td><td><code>user</code></td><td>无图无名时的兜底图标</td></tr>
        <tr><td>size</td><td><code>sm | md | lg | number</code></td><td><code>md</code></td><td>24 / 32 / 44 px，或自定义像素值</td></tr>
        <tr><td>shape</td><td><code>circle | square</code></td><td><code>circle</code></td><td>形状</td></tr>
        <tr><td>colorful</td><td><code>boolean</code></td><td><code>true</code></td><td>按姓名生成稳定底色</td></tr>
      </tbody>
    </table>
    <h3>IAvatarGroup</h3>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>max</td><td><code>number</code></td><td>展示的头像个数上限</td></tr>
        <tr><td>total</td><td><code>number</code></td><td>成员总数，用于计算 +N</td></tr>
        <tr><td>size</td><td><code>sm | md | lg | number</code></td><td>与组内头像一致的尺寸档位，决定 +N 圆点的大小</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.avatar-group-sizes {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-5);
  flex-wrap: wrap;
}
</style>
