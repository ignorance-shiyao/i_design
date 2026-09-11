<script setup lang="ts">
import { ref } from 'vue'
import ITimeSelect from '@/components/ITimeSelect.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const basic = ref('')
const from = ref('')
const to = ref('')
const coarse = ref('')
</script>

<template>
  <article>
    <h1>TimeSelect 时间下拉</h1>
    <p class="i-lead">
      在若干个固定时间点里挑一个。与 TimePicker 的分工：能选任意时刻的用 TimePicker，
      只在整点或半点里挑的用这个——用三列滚轮去选「上午九点半」既慢又容易滑过头。
    </p>

    <DemoBlock
      title="基础用法"
      description="从 start 到 end（含端点）每隔 step 分钟一个时间点。"
      code='<ITimeSelect v-model="value" start="09:00" end="18:00" :step="30" />'
    >
      <div class="ts-field"><ITimeSelect v-model="basic" /></div>
    </DemoBlock>

    <DemoBlock
      title="不整除 60 的间隔"
      description="步长按分钟递增，因此 45 分钟这类不能整除 60 的间隔也能跨小时排下去：09:45 之后是 10:30，而不是回到 10:00。"
      code='<ITimeSelect start="09:00" end="14:00" :step="45" />'
    >
      <div class="ts-field"><ITimeSelect v-model="coarse" start="09:00" end="14:00" :step="45" /></div>
    </DemoBlock>

    <DemoBlock
      title="两端联动"
      description="结束时间里早于开始时间的那些点会被标记为不可选，但仍然留在列表里——直接过滤掉的话，列表长度会随开始时间变来变去，用户刚记住「第三个是 10:00」，换个开始时间就不是了。"
      code='<ITimeSelect v-model="to" :min-time="from" />'
    >
      <div class="ts-demo">
        <div class="ts-field"><ITimeSelect v-model="from" placeholder="开始时间" :max-time="to" /></div>
        <span class="ts-demo__sep">至</span>
        <div class="ts-field"><ITimeSelect v-model="to" placeholder="结束时间" :min-time="from" /></div>
      </div>
    </DemoBlock>

    <DemoBlock title="禁用" code='<ITimeSelect disabled />'>
      <div class="ts-field"><ITimeSelect model-value="09:30" disabled /></div>
    </DemoBlock>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>string</code></td><td><code>''</code></td><td>选中的时间点，形如 <code>09:30</code></td></tr>
        <tr><td>start / end</td><td><code>string</code></td><td><code>09:00</code> / <code>18:00</code></td><td>首末时间点，两端都含</td></tr>
        <tr><td>step</td><td><code>number</code></td><td><code>30</code></td><td>间隔分钟数</td></tr>
        <tr><td>minTime / maxTime</td><td><code>string</code></td><td><code>''</code></td><td>早于 / 晚于它的时间点不可选</td></tr>
        <tr><td>placeholder</td><td><code>string</code></td><td><code>选择时间</code></td><td>未选时的提示</td></tr>
        <tr><td>disabled / invalid</td><td><code>boolean</code></td><td><code>false</code></td><td>禁用 / 错误态</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>事件</th><th>参数</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>change</td><td><code>(value: string)</code></td><td>选中某个时间点时触发</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.ts-field {
  /* 组件本身跟随容器宽度（表单里它该和别的字段一样宽），演示里给它一个表单字段的宽度 */
  width: 180px;
}
.ts-demo {
  display: flex;
  align-items: center;
  gap: var(--i-spacing-3);
  flex-wrap: wrap;
}
.ts-demo__sep {
  color: var(--i-color-text-secondary);
}
</style>
