<script setup lang="ts">
import ICard from '@/components/ICard.vue'
import {
  emptyIllustrations,
  errorIllustrations,
  heroIllustrations,
  mascotIllustration
} from '@i-design/common'

const mascot = mascotIllustration.src
const mascot2x = mascotIllustration.srcset

const illustrations = [
  { src: emptyIllustrations.empty.src, name: 'no-data', usage: '空状态 · 从未创建' },
  { src: emptyIllustrations.search.src, name: 'search-empty', usage: '空状态 · 筛选无果' },
  { src: emptyIllustrations.error.src, name: 'load-failed', usage: '空状态 · 加载失败' },
  { src: emptyIllustrations.permission.src, name: 'no-permission', usage: '空状态 · 无权限' },
  { src: errorIllustrations['404'].src, name: '404', usage: '错误页 · 地址不存在' },
  { src: errorIllustrations['500'].src, name: '500', usage: '错误页 · 服务异常' },
  { src: heroIllustrations.light.src, name: 'hero-light', usage: '首页 Hero · 浅色' },
  { src: heroIllustrations.dark.src, name: 'hero-dark', usage: '首页 Hero · 深色' }
]

const resources = [
  { title: '设计令牌表', desc: '完整的色彩、字号、间距、圆角、阴影与动效令牌，含语义层映射。', to: '/design/tokens' },
  { title: '设计价值观', desc: '沉浸、灵活、至简三条原则，以及它们如何影响具体的组件默认值。', to: '/design/values' },
  { title: '组件文档', desc: '每个组件的用法、可配置项与交互示例，示例可直接复制到业务中。', to: '/components' }
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

    <h2>插画</h2>
    <p>
      体系的吉祥物是「小白」与「十五」两只猫。插画用于空状态与错误页——这些位置本就令人
      沮丧，一只猫能把「出问题了」说得不那么冷硬。
    </p>
    <div class="mascot">
      <img :src="mascot" :srcset="mascot2x" width="320" alt="小白与十五主形象" />
      <div>
        <h3>主形象</h3>
        <p>
          白色长毛猫「小白」与三花猫「十五」。配色沿用品牌蓝紫与中性灰阶，
          因此插画放进任何页面都不会与界面打架。
        </p>
      </div>
    </div>

    <div class="gallery">
      <figure v-for="item in illustrations" :key="item.name">
        <img :src="item.src" :alt="item.usage" loading="lazy" />
        <figcaption>
          <code>{{ item.name }}</code>
          <span>{{ item.usage }}</span>
        </figcaption>
      </figure>
    </div>

    <h3>为什么是 WebP 位图而不是 SVG</h3>
    <p>
      这批插画是带连续渐变与毛发笔触的绘画稿，单张有 7 万到 15 万种独立颜色。矢量化后要么把
      毛发抹成色块、丢掉神态，要么产生数万条路径、体积比位图还大且渲染更慢。因此按显示尺寸
      导出 1x / 2x 的 WebP，由 <code>srcset</code> 交给浏览器按屏幕像素密度取用——位图只有被
      放大时才会失真，而这里始终是缩小使用。整套素材从 8.8 MB 压到 750 KB 左右。
    </p>
    <p>
      需要跟随主题变色的小图形（箭头、勾选、状态标识）走的是另一条路：它们是
      <RouterLink to="/components/icon">图标系统</RouterLink>里的内联 SVG，用
      <code>currentColor</code> 着色。两者分工明确——图标表意，插画表情绪。
    </p>

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

.mascot {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-6);
  flex-wrap: wrap;
  padding: var(--i-spacing-6);
  margin: var(--i-spacing-5) 0;
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-xl);
  background: var(--i-gradient-surface);
  box-shadow: var(--i-shadow-sm);
}
.mascot img { width: 240px; height: auto; }
.mascot h3 { margin-bottom: var(--i-spacing-2); }
.mascot div { flex: 1; min-width: 240px; }

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--i-spacing-4);
  margin-top: var(--i-spacing-5);
}
.gallery figure {
  margin: 0;
  padding: var(--i-spacing-3);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-lg);
  background: var(--i-color-bg-elevated);
  text-align: center;
}
.gallery img { width: 100%; height: auto; }
.gallery figcaption {
  display: grid;
  gap: 2px;
  margin-top: var(--i-spacing-2);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-tertiary);
}
.gallery code { font-size: 11px; }
ol li { margin-bottom: var(--i-spacing-2); }
</style>
