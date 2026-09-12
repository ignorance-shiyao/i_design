<script setup lang="ts">
import { ref } from 'vue'
import ISelectInput from '@/components/ISelectInput.vue'
import ITag from '@/components/ITag.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const open = ref(false)
const value = ref('华东一区')

const multiOpen = ref(false)
const picked = ref(['华东一区', '华北二区'])

const filterOpen = ref(false)
const keyword = ref('')

const zones = ['华东一区', '华东二区', '华北二区', '华南三区']

function pick(zone: string) {
  value.value = zone
  open.value = false
}
function toggle(zone: string) {
  picked.value = picked.value.includes(zone)
    ? picked.value.filter((item) => item !== zone)
    : [...picked.value, zone]
}
</script>

<template>
  <article>
    <h1>SelectInput 选择器外壳</h1>
    <p class="i-lead">
      长得像输入框、点开是一个面板。Select、Cascader、TreeSelect、日期范围这些控件，外面那一层是同一件东西——一个可聚焦的框、里面是单行文本或一排标签、右侧一个箭头与清除键。各自写一遍的结果是聚焦态、清除键位置、禁用色一个个对不齐，因此它单独成件。
    </p>
    <p>
      它只管外壳：面板内容由调用方给，选中值怎么来它不管。直接用它的场合是「要做一个本体系还没有的选择器」——已有的 Select 这类请直接用成品。
    </p>

    <DemoBlock
      title="单选"
      code='<ISelectInput v-model:open="open" :value="value" clearable />'
    >
      <div class="demo-field">
        <ISelectInput
          v-model:open="open"
          :value="value"
          clearable
          placeholder="选择可用区"
          @clear="value = ''"
        />
        <ul v-if="open" class="fake-panel">
          <li v-for="zone in zones" :key="zone" @click="pick(zone)">{{ zone }}</li>
        </ul>
      </div>
    </DemoBlock>

    <DemoBlock
      title="多选：标签放进 tags 插槽"
      description="标签长什么样、能不能删，是上层的事，外壳只负责让它们在框里排好、行数增加时跟着长高。"
      code='<ISelectInput v-model:open="open">
  <template #tags>
    <ITag v-for="item in picked" :key="item" closable>{{ item }}</ITag>
  </template>
</ISelectInput>'
    >
      <div class="demo-field">
        <ISelectInput v-model:open="multiOpen" :value="picked.length ? ' ' : ''">
          <template #tags>
            <ITag v-for="item in picked" :key="item" type="brand">{{ item }}</ITag>
          </template>
        </ISelectInput>
        <ul v-if="multiOpen" class="fake-panel">
          <li
            v-for="zone in zones"
            :key="zone"
            :class="{ 'is-picked': picked.includes(zone) }"
            @click="toggle(zone)"
          >
            {{ zone }}
          </li>
        </ul>
      </div>
    </DemoBlock>

    <DemoBlock
      title="可输入"
      description="filterable 时框内是一个真正的输入框，空格是正常字符而不是开合面板的快捷键。"
      code='<ISelectInput filterable v-model:keyword="keyword" v-model:open="open" />'
    >
      <div class="demo-field">
        <ISelectInput
          v-model:open="filterOpen"
          v-model:keyword="keyword"
          filterable
          clearable
          placeholder="搜索可用区"
        />
        <ul v-if="filterOpen" class="fake-panel">
          <li
            v-for="zone in zones.filter((z) => z.includes(keyword))"
            :key="zone"
            @click="((keyword = zone), (filterOpen = false))"
          >
            {{ zone }}
          </li>
        </ul>
      </div>
    </DemoBlock>

    <DemoBlock title="禁用与错误" code='<ISelectInput disabled />
<ISelectInput invalid />'>
      <div class="demo-field">
        <ISelectInput value="华东一区" disabled />
        <ISelectInput value="" placeholder="必填项" invalid />
      </div>
    </DemoBlock>

    <h2>键盘</h2>
    <table class="i-table">
      <thead><tr><th>按键</th><th>行为</th></tr></thead>
      <tbody>
        <tr><td><code>Enter</code></td><td>开合面板</td></tr>
        <tr><td><code>空格</code></td><td>开合面板；<code>filterable</code> 时是正常字符</td></tr>
        <tr><td><code>↓</code></td><td>打开面板</td></tr>
        <tr><td><code>Esc</code></td><td>关闭面板</td></tr>
      </tbody>
    </table>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>value</td><td><code>string</code></td><td><code>''</code></td><td>单选时显示的文案</td></tr>
        <tr><td>open</td><td><code>boolean</code></td><td><code>false</code></td><td>面板开合，支持 <code>v-model:open</code>。由调用方持有——它才知道选完要不要关</td></tr>
        <tr><td>keyword</td><td><code>string</code></td><td><code>''</code></td><td>可输入时的关键词，支持 <code>v-model:keyword</code></td></tr>
        <tr><td>filterable</td><td><code>boolean</code></td><td><code>false</code></td><td>框内可输入</td></tr>
        <tr><td>clearable</td><td><code>boolean</code></td><td><code>false</code></td><td>悬停或聚焦时出现清除键</td></tr>
        <tr><td>size / disabled / invalid</td><td>—</td><td>—</td><td>与其他表单控件一致</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.demo-field {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--i-spacing-3);
  max-width: 320px;
}
.fake-panel {
  list-style: none;
  margin: 0;
  padding: var(--i-spacing-1);
  border: 1px solid var(--i-color-border);
  border-radius: var(--i-radius-md);
  background: var(--i-color-bg-elevated);
  box-shadow: var(--i-shadow-md);
}
.fake-panel li {
  padding: var(--i-spacing-2) var(--i-spacing-3);
  border-radius: var(--i-radius-sm);
  font-size: var(--i-font-size-md);
  cursor: pointer;
}
.fake-panel li:hover {
  background: var(--i-color-bg-subtle);
}
.fake-panel li.is-picked {
  color: var(--i-color-brand);
  background: var(--i-color-brand-subtle);
}
</style>
