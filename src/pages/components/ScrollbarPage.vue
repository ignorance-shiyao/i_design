<script setup lang="ts">
import IScrollbar from '@/components/IScrollbar.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const rows = Array.from({ length: 24 }, (_, i) => `第 ${i + 1} 行内容`)
</script>

<template>
  <article>
    <h1>Scrollbar 滚动条</h1>
    <p class="i-lead">
      把系统滚动条换成一条不占布局的细条。Windows 的系统滚动条是一条十几像素宽的灰槽，会把右侧内容挤窄，而 macOS 上默认不占位——同一份布局在两个系统上看到的宽度不一样。滚动本身仍交给浏览器：滚轮惯性、触控板、键盘与读屏工具都指望原生滚动，这里只是把那条槽藏起来、另画一条。
    </p>

    <DemoBlock
      title="基础用法"
      description="给一个固定高度，内容超出即可滚动。鼠标停在区域上滑块才出现，拖动滑块或点轨道空白处都能定位。"
      code='<IScrollbar height="180px">…</IScrollbar>'
    >
      <IScrollbar class="sb-box" height="180px">
        <p v-for="row in rows" :key="row" class="sb-row">{{ row }}</p>
      </IScrollbar>
    </DemoBlock>

    <DemoBlock
      title="最大高度"
      description="内容不足时不出现滚动条，容器也不会被撑到固定高度。"
      code='<IScrollbar max-height="160px">…</IScrollbar>'
    >
      <IScrollbar class="sb-box" max-height="160px">
        <p v-for="row in rows.slice(0, 3)" :key="row" class="sb-row">{{ row }}</p>
      </IScrollbar>
    </DemoBlock>

    <DemoBlock
      title="常驻显示"
      description="默认只在悬停与滚动时显形，免得一条竖线一直杵在内容边上。数据表这类需要「一眼看出还有多少没看」的场景可以让它常驻。"
      code='<IScrollbar height="180px" always>…</IScrollbar>'
    >
      <IScrollbar class="sb-box" height="180px" always>
        <p v-for="row in rows" :key="row" class="sb-row">{{ row }}</p>
      </IScrollbar>
    </DemoBlock>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>height</td><td><code>string</code></td><td><code>''</code></td><td>固定高度</td></tr>
        <tr><td>maxHeight</td><td><code>string</code></td><td><code>''</code></td><td>最大高度，内容不足时不撑开</td></tr>
        <tr><td>always</td><td><code>boolean</code></td><td><code>false</code></td><td>滑块常驻，不再只在悬停时显形</td></tr>
      </tbody>
    </table>

    <h2>各端差异</h2>
    <p>
      小程序端退回系统滚动条：那一端的滚动交给 <code>scroll-view</code> 承担，平台不允许把它的滚动条替换掉。外层的尺寸与留白规则一致，只是那条槽是系统画的。
      Flutter 端用平台自带的滚动条组件，滑块的最短长度与显形时机与这里一致。
    </p>
    <p class="sb-note">
      内容横向超出时仍由外层自行处理，这个组件只接管纵向——两个方向都接管会让「滚到哪了」出现两套判定，而横向滚动在文档里本就少见。需要横向滚动的表格请看 <RouterLink to="/components/table">Table</RouterLink>。
    </p>
  </article>
</template>

<style scoped>
/* 演示用的外框：滚动区域得有个边界，不然看不出内容是在哪一块里滚 */
.sb-box {
  width: 100%;
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-md);
  background: var(--i-color-surface);
}
.sb-row {
  margin: 0;
  padding: var(--i-spacing-2) var(--i-spacing-3);
  border-bottom: 1px solid var(--i-color-hairline);
  color: var(--i-color-text);
}
.sb-row:last-child {
  border-bottom: none;
}
.sb-note {
  color: var(--i-color-text-secondary);
}
</style>
