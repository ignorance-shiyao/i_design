<script setup lang="ts">
import IDivider from '@/components/IDivider.vue'
import DemoBlock from '@/site/DemoBlock.vue'
</script>

<template>
  <article>
    <h1>Divider 分割线</h1>
    <p class="i-lead">
      分隔内容区块。分隔优先用留白，留白不足以表达断点时才用分割线——它是一条视觉噪音，用得越少越好。
    </p>

    <DemoBlock title="基础用法" code='<IDivider />'>
      <div class="full">
        <p>上一段内容。</p>
        <IDivider />
        <p>下一段内容。</p>
      </div>
    </DemoBlock>

    <DemoBlock
      title="带文字"
      description="文字可居中或靠边，用于标注下方区块的性质。"
      code='<IDivider>基本信息</IDivider>
<IDivider align="left">高级设置</IDivider>'
    >
      <div class="full">
        <IDivider>基本信息</IDivider>
        <IDivider align="left">高级设置</IDivider>
        <IDivider align="right" dashed>危险操作</IDivider>
      </div>
    </DemoBlock>

    <DemoBlock
      title="垂直分割"
      description="用于分隔同一行内的操作项。"
      code='编辑 <IDivider direction="vertical" /> 复制 <IDivider direction="vertical" /> 删除'
    >
      <span class="inline">
        <a href="#" @click.prevent>编辑</a>
        <IDivider direction="vertical" />
        <a href="#" @click.prevent>复制</a>
        <IDivider direction="vertical" />
        <a href="#" @click.prevent>删除</a>
      </span>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>用间距就能分开两块内容时——留白比线更安静，页面上每多一条线就多一分拥挤。</li>
      <li>想用它表达层级时——线只能表达「这里断开了」，表达层级要靠标题与留白。</li>
      <li>列表项之间已经有边框时——再加分割线就是两条线叠在一起。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>direction</td><td><code>horizontal | vertical</code></td><td><code>horizontal</code></td><td>方向</td></tr>
        <tr><td>align</td><td><code>left | center | right</code></td><td><code>center</code></td><td>文字位置，仅横向有效</td></tr>
        <tr><td>dashed</td><td><code>boolean</code></td><td><code>false</code></td><td>虚线样式</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.full { width: 100%; }
.inline { display: inline-flex; align-items: center; }
</style>
