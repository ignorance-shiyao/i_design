<script setup lang="ts">
import { ref } from 'vue'
import IRangeInput from '@/components/IRangeInput.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import type { RangeValue } from '@i-design/common'

const price = ref<RangeValue>(['', ''])
const dates = ref<RangeValue>(['2026-01-01', '2026-03-31'])
const invalid = ref<RangeValue>(['900', '100'])
</script>

<template>
  <article>
    <h1>RangeInput 区间输入</h1>
    <p class="i-lead">
      一次填一个区间的两端：价格区间、数量区间、日期区间。两端共用一圈边框，因为「起」与「止」是同一个字段的两头——校验、清空、聚焦态都该作为一个整体。
    </p>

    <DemoBlock
      title="基础用法"
      code='<IRangeInput v-model="price" :placeholders="[&quot;最低价&quot;, &quot;最高价&quot;]" />'
    >
      <div class="demo-field">
        <IRangeInput v-model="price" :placeholders="['最低价', '最高价']" />
        <p class="demo-value">当前值：{{ JSON.stringify(price) }}</p>
      </div>
    </DemoBlock>

    <DemoBlock
      title="自动对调"
      description="失焦时若起大于止就自动对调，且只在失焦时做——用户把 900 改成 100 的中途，数值会短暂小于起点，那时对调会把他刚敲的字搬到另一个框里。对调规则在 logic/range，各端共用同一份。"
      code='<IRangeInput v-model="value" auto-order />'
    >
      <div class="demo-field">
        <IRangeInput v-model="invalid" :placeholders="['起', '止']" />
        <p class="demo-value">失焦后：{{ JSON.stringify(invalid) }}</p>
      </div>
    </DemoBlock>

    <DemoBlock
      title="分隔符与尺寸"
      code='<IRangeInput v-model="dates" separator="至" size="lg" />'
    >
      <div class="demo-field">
        <IRangeInput v-model="dates" separator="至" size="sm" />
        <IRangeInput v-model="dates" separator="至" />
        <IRangeInput v-model="dates" separator="至" size="lg" />
      </div>
    </DemoBlock>

    <DemoBlock title="禁用与错误" code='<IRangeInput disabled />
<IRangeInput invalid />'>
      <div class="demo-field">
        <IRangeInput :model-value="['10', '20']" disabled />
        <IRangeInput :model-value="['900', '100']" invalid :auto-order="false" />
      </div>
    </DemoBlock>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>[string, string]</code></td><td><code>['', '']</code></td><td>区间两端，支持 <code>v-model</code></td></tr>
        <tr><td>placeholders</td><td><code>[string, string]</code></td><td><code>['开始', '结束']</code></td><td>两端占位文案，同时作为读屏标签</td></tr>
        <tr><td>separator</td><td><code>string</code></td><td><code>—</code></td><td>分隔符</td></tr>
        <tr><td>size</td><td><code>sm | md | lg</code></td><td><code>md</code></td><td>控件高度档位</td></tr>
        <tr><td>autoOrder</td><td><code>boolean</code></td><td><code>true</code></td><td>失焦时自动把反了的区间对调</td></tr>
        <tr><td>disabled / invalid</td><td><code>boolean</code></td><td><code>false</code></td><td>禁用 / 错误态</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.demo-field {
  display: flex;
  flex-direction: column;
  gap: var(--i-spacing-3);
  max-width: 360px;
}
.demo-value {
  font-family: var(--i-font-family-mono);
  font-size: var(--i-font-size-xs);
  color: var(--i-color-text-secondary);
}
</style>
