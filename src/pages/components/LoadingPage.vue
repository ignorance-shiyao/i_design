<script setup lang="ts">
import { ref } from 'vue'
import ILoading from '@/components/ILoading.vue'
import IButton from '@/components/IButton.vue'
import ICard from '@/components/ICard.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const areaLoading = ref(true)
const waiting = ref(true)
</script>

<template>
  <article>
    <h1>Loading 加载中</h1>
    <p class="i-lead">
      标识某处正在加载。区域加载优先于全屏加载——保留已渲染的内容，用户才知道自己还在原来的位置。
    </p>

    <DemoBlock
      title="独立指示器"
      code='<ILoading size="sm" />
<ILoading />
<ILoading size="lg" text="加载中" />'
    >
      <ILoading size="sm" />
      <ILoading />
      <ILoading size="lg" text="加载中" />
    </DemoBlock>

    <DemoBlock
      title="显示已等多久"
      description="智能体的一次调用动辄十几秒。只转圈不给数字的话，三秒和三十秒看起来一样，于是有人反复点，或者以为卡死了刷新页面——前一次的结果就此丢掉。前三秒不显示：比它更快的请求，用户来不及产生「是不是卡了」的疑问。"
      code='<ILoading elapsed text="正在生成" />'
    >
      <div class="stack">
        <IButton size="sm" @click="waiting = !waiting">
          {{ waiting ? '停止' : '重新开始' }}
        </IButton>
        <ILoading :loading="waiting" elapsed text="正在生成" />
      </div>
    </DemoBlock>

    <DemoBlock
      title="包裹内容"
      description="传入默认插槽时渲染为区域遮罩，内容仍在下方可见，加载结束不产生布局跳动。"
      code='<ILoading :loading="loading" text="正在加载工作项">
  <ICard title="迭代概览">…</ICard>
</ILoading>'
    >
      <div class="stack">
        <IButton size="sm" @click="areaLoading = !areaLoading">
          {{ areaLoading ? '结束加载' : '开始加载' }}
        </IButton>
        <ILoading :loading="areaLoading" text="正在加载工作项">
          <ICard title="迭代概览">
            本迭代共 24 个工作项，已完成 18 个，剩余 3 天。
          </ICard>
        </ILoading>
      </div>
    </DemoBlock>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>loading</td><td><code>boolean</code></td><td><code>true</code></td><td>是否加载中；包裹内容时用它控制遮罩</td></tr>
        <tr><td>text</td><td><code>string</code></td><td><code>''</code></td><td>提示文案，同时作为 aria-label</td></tr>
        <tr><td>size</td><td><code>sm | md | lg</code></td><td><code>md</code></td><td>尺寸</td></tr>
        <tr><td>fullscreen</td><td><code>boolean</code></td><td><code>false</code></td><td>遮罩铺满视口</td></tr>
      </tbody>
    </table>

    <h2>动效偏好</h2>
    <p>
      在系统开启「减少动效」时，旋转会自动替换为透明度呼吸——前庭敏感的用户不会因持续旋转而不适，
      同时仍能看出加载正在进行。
    </p>
  </article>
</template>

<style scoped>
.stack { display: grid; gap: var(--i-spacing-4); width: 100%; max-width: 420px; }
</style>
