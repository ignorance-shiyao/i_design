<script setup lang="ts">
import ICard from '@/components/ICard.vue'

const resources = [
  { title: '设计令牌表', desc: '完整的色彩、字号、间距、圆角、阴影与动效令牌，含语义层映射。', to: '/design/tokens' },
  { title: '设计价值观', desc: '沉浸、灵活、至简三条原则，以及它们如何影响具体的组件默认值。', to: '/design/values' },
  { title: '组件文档', desc: '每个组件的用法、可配置项与交互示例，示例可直接复制到业务中。', to: '/components/button' }
]

const contributing = [
  '新增组件前先确认无法由现有组件组合实现。',
  '样式只引用语义令牌，不出现硬编码色值、字号与间距。',
  '尺寸沿用 sm / md / lg 三档，状态沿用 hover / active / disabled 命名。',
  '交互组件需通过键盘操作验证，并给出正确的 ARIA 状态。',
  '为组件补充一页文档，包含至少一个可交互示例。'
]
</script>

<template>
  <article>
    <h1>设计资源</h1>
    <p class="i-lead">从这里进入体系的各个部分，或按下列约定参与共建。</p>

    <div class="resources">
      <RouterLink v-for="item in resources" :key="item.to" :to="item.to" class="resources__link">
        <ICard :title="item.title" hoverable>{{ item.desc }}</ICard>
      </RouterLink>
    </div>

    <h2>本地运行</h2>
    <pre class="code"><code>npm install
npm run dev     # 启动文档站
npm run build   # 类型检查 + 生产构建</code></pre>

    <h2>共建约定</h2>
    <ol>
      <li v-for="rule in contributing" :key="rule">{{ rule }}</li>
    </ol>

    <h2>目录结构</h2>
    <pre class="code"><code>src/
├─ tokens/       设计令牌（TS 常量，供文档站与工具消费）
├─ styles/       令牌的 CSS 变量声明与全局样式
├─ components/   组件库
├─ site/         文档站骨架（页头、页脚、侧栏、示例容器）
├─ pages/        文档页面
└─ data/nav.ts   文档导航配置</code></pre>
  </article>
</template>

<style scoped>
.resources {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--i-spacing-5);
  margin-top: var(--i-spacing-6);
}
.resources__link { color: inherit; }
.code {
  padding: var(--i-spacing-4);
  background: var(--i-color-bg-subtle);
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-md);
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-secondary);
  overflow-x: auto;
}
ol { color: var(--i-color-text-secondary); padding-left: var(--i-spacing-5); }
ol li { margin-bottom: var(--i-spacing-2); }
</style>
