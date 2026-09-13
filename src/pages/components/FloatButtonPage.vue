<script setup lang="ts">
import { ref } from 'vue'
import type { FloatAction } from '@i-design/common'
import IFloatButton from '@/components/IFloatButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'

/*
 * 示例里的按钮不能真的 fixed 在视口上——三个示例会叠在同一个角上，
 * 而且读者滚到别的组件页时它还赖着不走。这里放进一块相对定位的画布里，
 * 位置关系与真实使用完全一致，只是参照物换成了画布。
 */
const actions: FloatAction[] = [
  { key: 'doc', icon: 'file', label: '新建文档' },
  { key: 'folder', icon: 'folder', label: '新建目录' },
  { key: 'import', icon: 'download', label: '导入' }
]

const picked = ref('')
const clicks = ref(0)
</script>

<template>
  <article>
    <h1>FloatButton 悬浮操作按钮</h1>
    <p class="i-lead">
      常驻在页面角落的主操作入口。一页只该有一个：它代表「这一页最主要的那件事」，出现两个就等于没有主次，用户还得先读一遍才知道点哪个——那还不如放回工具栏里。
    </p>

    <DemoBlock
      title="单个操作"
      description="不带 actions 时就是一个按钮，点击直接触发。带文字时拉长，只有图标时收成正圆。"
      lang="vue"
      code='<IFloatButton @click="create" />
<IFloatButton icon="edit" text="写点什么" @click="compose" />'
    >
      <div class="fab-stage">
        <IFloatButton class="fab-stage__pin" @click="clicks++" />
      </div>
      <p class="fab-note">已点击 {{ clicks }} 次</p>
    </DemoBlock>

    <DemoBlock
      title="展开次级操作"
      description="点击展开一组动作。每个动作都带文字标签——一排只有图标的圆点，是这类组件最常见的失败形态，谁也认不出哪个是「导入」。"
      lang="vue"
      code='<IFloatButton :actions="actions" @select="onSelect" />'
    >
      <div class="fab-stage fab-stage--tall">
        <IFloatButton class="fab-stage__pin" :actions="actions" @select="picked = $event" />
      </div>
      <p class="fab-note">选中：{{ picked || '（还没选）' }}</p>
    </DemoBlock>

    <DemoBlock
      title="靠左放"
      description="页面右下角已经被别的东西占着时（例如客服入口），换到左边。"
      lang="vue"
      code='<IFloatButton placement="bottom-left" icon="edit" text="反馈" />'
    >
      <div class="fab-stage">
        <IFloatButton class="fab-stage__pin" placement="bottom-left" icon="edit" text="反馈" />
      </div>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>操作不止一个主次分明的入口时——那是工具栏该干的事，悬浮按钮只能表达一个重点。</li>
      <li>页面底部有固定的操作条时，两者会打架；悬浮按钮还会遮住列表最后一行。</li>
      <li>操作与当前选中的内容有关时（如「删除选中项」），它离选区太远，用户得来回看两处。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>icon</td><td><code>IconName</code></td><td><code>plus</code></td><td>主按钮图标</td></tr>
        <tr><td>text</td><td><code>string</code></td><td><code>''</code></td><td>带文字时按钮拉长</td></tr>
        <tr><td>actions</td><td><code>FloatAction[]</code></td><td><code>[]</code></td><td>展开后的次级动作；为空时只发 click</td></tr>
        <tr><td>placement</td><td><code>bottom-right | bottom-left</code></td><td><code>bottom-right</code></td><td>贴哪个角</td></tr>
        <tr><td>offset</td><td><code>number</code></td><td><code>24</code></td><td>距视口边缘的距离</td></tr>
        <tr><td>open</td><td><code>boolean</code></td><td>—</td><td>受控展开态；不传则组件自己管</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>事件</th><th>参数</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>click</td><td>—</td><td>没有 actions 时点击主按钮</td></tr>
        <tr><td>select</td><td><code>key</code></td><td>选中某个次级动作</td></tr>
        <tr><td>update:open</td><td><code>boolean</code></td><td>展开态变化</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
/* 示例画布：让 position: fixed 的按钮改以这块区域为参照 */
.fab-stage {
  position: relative;
  /* 给 fixed 定位一个新的包含块，示例之间不会叠在一起 */
  transform: translateZ(0);
  height: 160px;
  border: 1px dashed var(--i-color-hairline);
  border-radius: var(--i-radius-md);
  background: var(--i-color-bg-muted);
}
.fab-stage--tall {
  height: 280px;
}
.fab-note {
  margin: var(--i-spacing-3) 0 0;
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
}
</style>
