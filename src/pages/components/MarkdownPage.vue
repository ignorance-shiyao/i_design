<script setup lang="ts">
import { computed, ref } from 'vue'
import IMarkdown from '@/components/IMarkdown.vue'
import ITextarea from '@/components/ITextarea.vue'
import ISegmented from '@/components/ISegmented.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import Playground from '@/site/Playground.vue'

const sample = `## 采购建议

比对了 **12 家**供应商，交期与单价的权衡如下：

| 供应商 | 交期 | 单价 |
| --- | ---: | ---: |
| 明远制造 | 7 天 | ¥ 128 |
| 合力重工 | 12 天 | ¥ 119 |

1. 急单走明远，交期短
2. 常备库存走合力，单价低
   - 需要提前两周下单

> 单笔超过五万元要区域总监复核。

\`\`\`ts
const plan = suppliers.filter((s) => s.leadTime <= 7)
\`\`\`

参考：[采购制度 v3](/components/table)，~~旧版已作废~~。`

const hostile = `正常的一段文字。

<img src=x onerror="alert(1)"> 这段 HTML 原样显示，不会被执行。

[看起来正常的链接](javascript:alert(1)) 会退化成纯文本。

![风险图](java\tscript:alert(1))`

const source = ref(sample)
const preset = ref<'sample' | 'hostile'>('sample')
const shown = computed(() => (preset.value === 'hostile' ? hostile : source.value))

/* 流式演示：按字符喂进去，看停在任何一处时的样子 */
const streamed = ref('')
let timer: ReturnType<typeof setInterval> | null = null
function stream() {
  if (timer) clearInterval(timer)
  streamed.value = ''
  let index = 0
  timer = setInterval(() => {
    streamed.value = sample.slice(0, (index += 3))
    if (index >= sample.length && timer) clearInterval(timer)
  }, 40)
}
</script>

<template>
  <article>
    <h1>Markdown 渲染</h1>
    <p class="i-lead">
      内容来自模型与后端，也就是不可信的地方。所以这里不走「渲染成 HTML 再清洗」那条路——清洗要穷举所有变形，漏一种就等于给了对方一个 XSS，而 HTML 字符串在小程序与 Flutter 上也根本没法渲染。解析成 token 树，各端用自己的原生元素渲染：原始 HTML 一律当纯文本，地址一律过白名单，这两条不是可配置项。
    </p>

    <h2>现场调参</h2>
    <Playground name="IMarkdown" :is="IMarkdown" :only="['compact']" :fixed="{ source: sample }" />

    <DemoBlock
      title="常见语法"
      description="标题、列表（含嵌套一层）、表格、引用、代码块、行内代码、粗体、斜体、删除线、链接。不支持脚注与 HTML 内嵌——它们在对话里几乎不出现，而每多支持一种就多一处要防的地方。"
      lang="vue"
      code='<IMarkdown :source="text" />'
    >
      <div class="md-demo">
        <ISegmented
          v-model="preset"
          :options="[
            { label: '正常内容', value: 'sample' },
            { label: '带攻击载荷', value: 'hostile' }
          ]"
          aria-label="示例内容"
        />
        <IMarkdown :source="shown" />
      </div>
    </DemoBlock>

    <DemoBlock
      title="自己改着看"
      description="左边改，右边即时渲染。贴一段模型的真实输出进来最能说明问题。"
      lang="vue"
      code='<IMarkdown :source="source" />'
    >
      <div class="md-edit">
        <ITextarea v-model="source" :rows="10" aria-label="Markdown 原文" />
        <div class="md-edit__preview"><IMarkdown :source="source" /></div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="流式"
      description="模型一边写一边渲染，随时可能停在代码块中间。停在中间时按「还没收完的代码块」渲染，不会满屏反引号，写完的一瞬间也不会整段跳变——而且没收完的代码块不给复制按钮，复制到一半的代码比不给复制更坑。"
      lang="vue"
      code='<IMarkdown :source="streamedText" />'
    >
      <div class="md-demo">
        <IButton variant="secondary" size="sm" @click="stream">重放一次</IButton>
        <IMarkdown :source="streamed || sample.slice(0, 60)" />
      </div>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>内容是自己写死的静态文案时——直接写模板，多绕一层解析只会让排版更难控。</li>
      <li>需要所见即所得编辑时——这是只读渲染，编辑器是另一回事。</li>
      <li>内容里必须带自定义 HTML 或脚本时——那不属于这个组件的能力范围，也不该属于。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>source</td><td><code>string</code></td><td><code>''</code></td><td>Markdown 原文</td></tr>
        <tr><td>compact</td><td><code>boolean</code></td><td><code>false</code></td><td>紧凑排版，用在气泡、卡片这类空间紧张的地方</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.md-demo { display: flex; flex-direction: column; gap: var(--i-spacing-3); width: 100%; }
.md-edit {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
  gap: var(--i-spacing-3);
  width: 100%;
}
.md-edit__preview {
  min-width: 0;
  padding: var(--i-spacing-3);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-md);
}
</style>
