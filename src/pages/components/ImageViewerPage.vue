<script setup lang="ts">
import { ref } from 'vue'
import IImageViewer from '@/components/IImageViewer.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const shots = [
  'https://picsum.photos/id/1015/1200/800',
  'https://picsum.photos/id/1025/1200/800',
  'https://picsum.photos/id/1039/1200/800'
]

const single = ref(false)
const group = ref(false)
const start = ref(0)

function openAt(index: number) {
  start.value = index
  group.value = true
}
</script>

<template>
  <article>
    <h1>ImageViewer 图片预览</h1>
    <p class="i-lead">
      全屏看大图：缩放、旋转、翻页。它与 Image 共用同一套预览实现，
      单独成件是因为「点开看大图」的入口未必是一张 Image——
      列表页、聊天记录、上传回显都可能只有一个按钮或一块缩略图。
    </p>

    <DemoBlock
      title="基础用法"
      code='<IButton @click="open = true">查看大图</IButton>
<IImageViewer v-model:open="open" :images="[url]" />'
    >
      <IButton @click="single = true">查看大图</IButton>
      <IImageViewer v-model:open="single" :images="[shots[0]]" alt="示例图片" />
    </DemoBlock>

    <DemoBlock
      title="多图与起始位置"
      description="从任意一张打开，左右翻页。到头不循环——循环会让「这是最后一张」这个信息消失，用户分不清是翻完了还是自己看漏了。"
      code='<IImageViewer v-model:open="open" :images="shots" :start-index="2" />'
    >
      <div class="thumbs">
        <button
          v-for="(shot, i) in shots"
          :key="shot"
          class="thumbs__item"
          type="button"
          @click="openAt(i)"
        >
          <img :src="shot" :alt="`示例图片 ${i + 1}`" />
        </button>
      </div>
      <IImageViewer v-model:open="group" :images="shots" :start-index="start" />
    </DemoBlock>

    <h2>键盘</h2>
    <table class="i-table">
      <thead><tr><th>按键</th><th>行为</th></tr></thead>
      <tbody>
        <tr><td><code>Esc</code></td><td>关闭</td></tr>
        <tr><td><code>← / →</code></td><td>上一张 / 下一张</td></tr>
        <tr><td><code>+ / -</code></td><td>放大 / 缩小</td></tr>
      </tbody>
    </table>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>open</td><td><code>boolean</code></td><td><code>false</code></td><td>是否打开，支持 <code>v-model:open</code></td></tr>
        <tr><td>images</td><td><code>string[]</code></td><td>—</td><td>图片地址列表</td></tr>
        <tr><td>startIndex</td><td><code>number</code></td><td><code>0</code></td><td>打开时定位到第几张</td></tr>
        <tr><td>alt</td><td><code>string</code></td><td><code>''</code></td><td>替代文本</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>事件</th><th>参数</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>change</td><td><code>(index: number)</code></td><td>翻页后触发</td></tr>
      </tbody>
    </table>

    <h2>与 Image 的关系</h2>
    <p>
      <code>IImage</code> 的 <code>preview</code> 就是内部挂了一个 <code>IImageViewer</code>。
      缩放边界、旋转归一化、翻页规则都在 <code>logic/image</code> 里，各端共用同一份——
      写在组件里的话，一端能缩到 10 倍、另一端 3 倍就到头，同一份设计稿在两端上体验不同。
    </p>
  </article>
</template>

<style scoped>
.thumbs {
  display: flex;
  gap: var(--i-spacing-3);
  flex-wrap: wrap;
}
.thumbs__item {
  width: 120px;
  height: 80px;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-md);
  background: var(--i-color-bg-subtle);
  cursor: pointer;
}
.thumbs__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
