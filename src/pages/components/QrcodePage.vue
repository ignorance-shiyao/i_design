<script setup lang="ts">
import { ref } from 'vue'
import IQrcode from '@/components/IQrcode.vue'
import IInput from '@/components/IInput.vue'
import ISegmented from '@/components/ISegmented.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import type { QrEcLevel } from '@i-design/common'

const text = ref('https://ignorance-shiyao.github.io/')
const level = ref<QrEcLevel>('M')
</script>

<template>
  <article>
    <h1>Qrcode 二维码</h1>
    <p class="i-lead">
      把一段文本变成可扫的码。编码算法在公共层，各端共用同一份——同一段文本必须在 Web、小程序与 Flutter 上得到同一个版本与掩码，否则模块数对不上，设计稿里的尺寸与留白就得各端各调一遍。
    </p>

    <DemoBlock title="基础用法" code='<IQrcode value="https://example.com" />'>
      <IQrcode value="https://ignorance-shiyao.github.io/" label="Ignorance Design" />
    </DemoBlock>

    <DemoBlock
      title="纠错等级"
      description="等级越高，可被遮挡的比例越大，但同样的内容需要更多模块。加了中心图标就要提到 Q 或 H，否则被遮住的部分无法恢复。"
      code='<IQrcode value="..." level="H" />'
    >
      <div class="levels">
        <IQrcode
          v-for="lv in (['L', 'M', 'Q', 'H'] as QrEcLevel[])"
          :key="lv"
          :value="text"
          :level="lv"
          :size="120"
          :label="`${lv} 级`"
        />
      </div>
    </DemoBlock>

    <DemoBlock
      title="实时编码"
      description="改动内容或等级，版本会自动选到刚好装得下的那一档。内容超出版本 10 的容量时不画残码——残缺的码扫出来是另一个地址，据实报错更安全。"
      code='<IQrcode :value="text" :level="level" />'
    >
      <div class="playground">
        <div class="playground__form">
          <IInput v-model="text" placeholder="输入要编码的内容" />
          <ISegmented
            v-model="level"
            aria-label="纠错等级"
            :options="[
              { value: 'L', label: 'L 7%' },
              { value: 'M', label: 'M 15%' },
              { value: 'Q', label: 'Q 25%' },
              { value: 'H', label: 'H 30%' },
            ]"
            block
          />
        </div>
        <IQrcode :value="text" :level="level" :size="180" />
      </div>
    </DemoBlock>

    <h2>为什么颜色不跟随主题色</h2>
    <p>
      扫描靠的是码与底的明暗差。主题色一旦落在中等明度，对比度就掉到相机读不出来，而这件事在设计稿上看不出来——图是清楚的，只是扫不动。因此这里只提供「深色码 + 浅色底」，不把主题色接进来。
    </p>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>用户就在这台设备上、可以直接点链接时——二维码是给「换一台设备」用的。</li>
      <li>要编码的内容很长时——码点会密到扫不动，先做短链。</li>
      <li>内容会过期或变化时——把有效期写在码旁边，一张过期的码看起来和有效的一模一样。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>value</td><td><code>string</code></td><td>—</td><td>要编码的文本，按 UTF-8 处理</td></tr>
        <tr><td>size</td><td><code>number</code></td><td><code>160</code></td><td>边长（px），含静默区</td></tr>
        <tr><td>level</td><td><code>L | M | Q | H</code></td><td><code>M</code></td><td>纠错等级</td></tr>
        <tr><td>color / background</td><td><code>string</code></td><td><code>#000 / #fff</code></td><td>码点色与底色</td></tr>
        <tr><td>label</td><td><code>string</code></td><td><code>''</code></td><td>码下方的说明文字，同时作为读屏标签</td></tr>
      </tbody>
    </table>

    <h2>容量</h2>
    <p>
      实现覆盖版本 1–10 的字节模式，版本 10 在 M 级下可放 213 字节。更大的版本模块数超过 57×57，印在屏幕上已经扫不动了——那时该换一种载体，而不是继续加版本。
    </p>
  </article>
</template>

<style scoped>
.levels {
  display: flex;
  flex-wrap: wrap;
  gap: var(--i-spacing-5);
}
.playground {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--i-spacing-6);
}
.playground__form {
  display: flex;
  flex: 1;
  min-width: 260px;
  flex-direction: column;
  gap: var(--i-spacing-3);
}
</style>
