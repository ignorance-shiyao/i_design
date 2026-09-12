<script setup lang="ts">
import { ref } from 'vue'
import IDatePicker from '@/components/IDatePicker.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { toISO, addDays } from '@/components/date'

const basic = ref<string | null>('2026-09-07')
const clearable = ref<string | null>('2026-09-15')
const ranged = ref<string | null>(null)
const workday = ref<string | null>(null)
const formatted = ref<string | null>('2026-09-07')

const today = new Date()
const min = toISO(today)
const max = toISO(addDays(today, 30))

// 周末不可选：中后台常见的「仅工作日」场景
const noWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6
</script>

<template>
  <article>
    <h1>DatePicker 日期选择器</h1>
    <p class="i-lead">
      选择一个日期。对外的值始终是 <code>YYYY-MM-DD</code> 字符串——可排序、可直接比较、不带时区歧义；显示格式与存储格式分开，互不影响。
    </p>

    <DemoBlock
      title="基础用法"
      description="面板固定 6 行，切换月份时高度不跳动。今天以品牌色加粗标记。"
      lang="vue"
      code='<IDatePicker v-model="value" />'
    >
      <div class="w"><IDatePicker v-model="basic" /></div>
    </DemoBlock>

    <DemoBlock
      title="可清除与尺寸"
      description="clearable 在触发器和面板底部各提供一个清除入口。"
      lang="vue"
      code='<IDatePicker v-model="value" clearable />
<IDatePicker size="sm" />
<IDatePicker size="lg" />'
    >
      <div class="w"><IDatePicker v-model="clearable" clearable /></div>
      <div class="w"><IDatePicker size="sm" placeholder="小尺寸" /></div>
      <div class="w"><IDatePicker size="lg" placeholder="大尺寸" /></div>
    </DemoBlock>

    <DemoBlock
      title="限制可选范围"
      description="min / max 是闭区间；不可选日期加删除线，比单纯变灰更明确。"
      lang="vue"
      code='<IDatePicker v-model="value" :min="today" :max="todayPlus30" />'
    >
      <div class="w"><IDatePicker v-model="ranged" :min="min" :max="max" placeholder="仅未来 30 天" /></div>
    </DemoBlock>

    <DemoBlock
      title="自定义禁用规则"
      description="disabledDate 接收 Date 返回布尔值，用于「仅工作日」「排除节假日」这类规则。"
      lang="ts"
      code='const noWeekend = (date: Date) =>
  date.getDay() === 0 || date.getDay() === 6

<IDatePicker v-model="value" :disabled-date="noWeekend" />'
    >
      <div class="w"><IDatePicker v-model="workday" :disabled-date="noWeekend" placeholder="仅工作日" /></div>
    </DemoBlock>

    <DemoBlock
      title="显示格式"
      description="format 只影响输入框里的显示，v-model 的值不变，因此不用在提交前做二次转换。"
      lang="vue"
      code='<IDatePicker v-model="value" format="YYYY 年 MM 月 DD 日" />'
    >
      <div class="w"><IDatePicker v-model="formatted" format="YYYY 年 MM 月 DD 日" /></div>
      <span class="hint">v-model 实际值：{{ formatted ?? 'null' }}</span>
    </DemoBlock>

    <h2>键盘操作</h2>
    <table class="i-table">
      <thead><tr><th>按键</th><th>行为</th></tr></thead>
      <tbody>
        <tr><td><code>Enter</code> / <code>Space</code> / <code>↓</code></td><td>打开面板；面板已开时选中当前焦点日期</td></tr>
        <tr><td><code>← →</code></td><td>前后移动一天，越出当月时面板自动翻页</td></tr>
        <tr><td><code>↑ ↓</code></td><td>前后移动一周</td></tr>
        <tr><td><code>PageUp</code> / <code>PageDown</code></td><td>上一月 / 下一月</td></tr>
        <tr><td><code>Esc</code></td><td>关闭面板</td></tr>
      </tbody>
    </table>
    <p>
      焦点日期与选中值是两个状态：方向键浏览时只移动焦点（面板上以描边标记），按下 Enter 才真正改值——避免用户翻看日历的过程被记成一次次选择。
    </p>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>用户填的是一个众所周知的日期（生日、身份证上的日期）时——直接输入比翻日历快得多。</li>
      <li>只需要年月时——整张日历的日格是噪音，用年月选择。</li>
      <li>跨度以「最近 7 天 / 本月」这类相对区间为主时——先给快捷项，日历放在后面当补充。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>string | null</code></td><td><code>null</code></td><td>YYYY-MM-DD，支持 v-model</td></tr>
        <tr><td>placeholder</td><td><code>string</code></td><td><code>请选择日期</code></td><td>未选中时的占位文本</td></tr>
        <tr><td>size</td><td><code>sm | md | lg</code></td><td><code>md</code></td><td>尺寸，与其他表单控件一致</td></tr>
        <tr><td>min / max</td><td><code>string</code></td><td><code>''</code></td><td>可选范围，闭区间</td></tr>
        <tr><td>disabledDate</td><td><code>(date: Date) =&gt; boolean</code></td><td>—</td><td>自定义禁用规则</td></tr>
        <tr><td>format</td><td><code>string</code></td><td><code>YYYY-MM-DD</code></td><td>仅影响显示；支持 YYYY / MM / DD</td></tr>
        <tr><td>weekStart</td><td><code>0 | 1</code></td><td><code>1</code></td><td>0 周日开头，1 周一开头</td></tr>
        <tr><td>clearable</td><td><code>boolean</code></td><td><code>false</code></td><td>是否可清除</td></tr>
        <tr><td>disabled / invalid</td><td><code>boolean</code></td><td><code>false</code></td><td>禁用 / 校验失败态</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>事件</th><th>回调参数</th><th>说明</th></tr></thead>
      <tbody><tr><td>change</td><td><code>string | null</code></td><td>选中或清除时触发</td></tr></tbody>
    </table>

    <h2>时区</h2>
    <p>
      所有计算都走本地时区并以 <code>YYYY-MM-DD</code> 交换，不用<code>toISOString()</code>——后者按 UTC 输出，在东八区会把当天日期整体挪成前一天。日期工具从 <code>@/components/date</code> 导出，业务侧可直接复用。
    </p>
  </article>
</template>

<style scoped>
.w { width: 240px; }
.hint { font-size: var(--i-font-size-sm); color: var(--i-color-text-tertiary); }
</style>
