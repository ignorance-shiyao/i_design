<script setup lang="ts">
import { palette, fontSize, spacing, radius, shadow, motion } from '@/tokens'

const semanticColors = [
  { name: '--i-color-brand', usage: '主按钮、选中态、链接强调' },
  { name: '--i-color-bg / -subtle / -muted', usage: '页面、区块、填充背景三层' },
  { name: '--i-color-text / -secondary / -tertiary', usage: '正文、说明、占位三级文本' },
  { name: '--i-color-border / -strong', usage: '分割线、表单描边' },
  { name: '--i-color-success / -warning / -danger / -info', usage: '状态语义色' }
]
</script>

<template>
  <article>
    <h1>设计令牌</h1>
    <p class="i-lead">
      令牌是设计与代码之间唯一的契约。基础层描述值，语义层描述用途，组件只消费语义层——这让主题切换成为一次变量覆盖，而不是一次重构。
    </p>

    <h2>色彩</h2>
    <p>基础调色板每色 9 阶，10 最浅、90 最深。50 为该色的标准值。</p>
    <div v-for="(scales, name) in palette" :key="name" class="swatch-row">
      <span class="swatch-row__name">{{ name }}</span>
      <div class="swatch-row__items">
        <div v-for="(value, scale) in scales" :key="scale" class="swatch">
          <span class="swatch__chip" :style="{ background: value }" />
          <span class="swatch__label">{{ scale }}</span>
          <span class="swatch__value">{{ value }}</span>
        </div>
      </div>
    </div>

    <h3>语义色</h3>
    <table class="i-table">
      <thead><tr><th>令牌</th><th>用途</th></tr></thead>
      <tbody>
        <tr v-for="item in semanticColors" :key="item.name">
          <td><code>{{ item.name }}</code></td>
          <td>{{ item.usage }}</td>
        </tr>
      </tbody>
    </table>

    <h2>字号</h2>
    <div class="type-scale">
      <div v-for="(value, key) in fontSize" :key="key" class="type-scale__row">
        <code>--i-font-size-{{ key }}</code>
        <span class="type-scale__sample" :style="{ fontSize: value }">设计即决策 Design</span>
        <span class="type-scale__value">{{ value }}</span>
      </div>
    </div>

    <h2>间距</h2>
    <p>以 4px 为基准栅格，所有内外边距均取自该刻度。</p>
    <div class="bars">
      <div v-for="(value, key) in spacing" :key="key" class="bars__row">
        <code>{{ key }}</code>
        <span class="bars__bar" :style="{ width: value }" />
        <span class="bars__value">{{ value }}</span>
      </div>
    </div>

    <h2>圆角</h2>
    <div class="tiles">
      <div v-for="(value, key) in radius" :key="key" class="tile">
        <span class="tile__box" :style="{ borderRadius: value }" />
        <code>{{ key }}</code><span class="tile__value">{{ value }}</span>
      </div>
    </div>

    <h2>阴影</h2>
    <div class="tiles">
      <div v-for="(value, key) in shadow" :key="key" class="tile">
        <span class="tile__box tile__box--plain" :style="{ boxShadow: value }" />
        <code>{{ key }}</code>
      </div>
    </div>

    <h2>动效</h2>
    <table class="i-table">
      <thead><tr><th>令牌</th><th>值</th><th>使用场景</th></tr></thead>
      <tbody>
        <tr><td><code>--i-motion-fast</code></td><td>{{ motion.fast }}</td><td>悬浮、按压等即时反馈</td></tr>
        <tr><td><code>--i-motion-base</code></td><td>{{ motion.base }}</td><td>展开、切换等状态变化</td></tr>
        <tr><td><code>--i-motion-slow</code></td><td>{{ motion.slow }}</td><td>浮层入场、页面级过渡</td></tr>
        <tr><td><code>--i-motion-easing</code></td><td>{{ motion.easing }}</td><td>统一缓动曲线</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.swatch-row { margin-bottom: var(--i-spacing-5); }
.swatch-row__name {
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-sm);
  color: var(--i-color-text-tertiary);
}
.swatch-row__items {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-2);
  margin-top: var(--i-spacing-2);
}
.swatch { width: 76px; }
.swatch__chip {
  display: block;
  height: 44px;
  border-radius: var(--i-radius-md);
  border: 1px solid var(--i-color-border);
}
.swatch__label { display: block; font-size: var(--i-font-size-xs); margin-top: var(--i-spacing-1); }
.swatch__value {
  display: block;
  font-family: var(--i-font-family-mono);
  font-size: 10px;
  color: var(--i-color-text-tertiary);
}

.type-scale__row {
  display: grid;
  grid-template-columns: 180px 1fr 60px;
  align-items: baseline;
  gap: var(--i-spacing-4);
  padding: var(--i-spacing-2) 0;
  border-bottom: 1px solid var(--i-color-border);
}
.type-scale__sample { line-height: 1.3; }
.type-scale__value { font-size: var(--i-font-size-sm); color: var(--i-color-text-tertiary); }

.bars__row {
  display: grid;
  grid-template-columns: 40px 1fr 60px;
  align-items: center;
  gap: var(--i-spacing-4);
  padding: var(--i-spacing-1) 0;
}
.bars__bar { height: 12px; background: var(--i-color-brand); border-radius: var(--i-radius-sm); }
.bars__value { font-size: var(--i-font-size-sm); color: var(--i-color-text-tertiary); }

.tiles { display: flex; flex-wrap: wrap; gap: var(--i-spacing-5); }
.tile { text-align: center; font-size: var(--i-font-size-xs); }
.tile__box {
  display: block;
  width: 72px;
  height: 56px;
  margin-bottom: var(--i-spacing-2);
  background: var(--i-color-brand-subtle);
  border: 1px solid var(--i-color-brand);
}
.tile__box--plain {
  background: var(--i-color-bg);
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-lg);
}
.tile__value { display: block; color: var(--i-color-text-tertiary); }

@media (max-width: 720px) {
  .type-scale__row { grid-template-columns: 1fr; gap: var(--i-spacing-1); }
}
</style>
