<script setup lang="ts">
import { computed, ref } from 'vue'
import ICheckbox from '@/components/ICheckbox.vue'
import ICheckboxGroup from '@/components/ICheckboxGroup.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const single = ref(true)
const group = ref<(string | number)[]>(['bug'])
const limited = ref<(string | number)[]>([])

const all = ['bug', 'requirement', 'task']
const selectAll = computed({
  get: () => group.value.length === all.length,
  set: (checked: boolean) => (group.value = checked ? [...all] : [])
})
const indeterminate = computed(() => group.value.length > 0 && group.value.length < all.length)
</script>

<template>
  <article>
    <h1>Checkbox 多选框</h1>
    <p class="i-lead">
      从一组选项中选择任意多个。单独使用时表示一个开关式的确认项（如「记住我」），成组使用时表示筛选或批量选择。
    </p>

    <DemoBlock
      title="单独使用"
      code='<ICheckbox v-model="checked">同步到迭代看板</ICheckbox>'
    >
      <ICheckbox v-model="single">同步到迭代看板</ICheckbox>
    </DemoBlock>

    <DemoBlock
      title="成组使用与全选"
      description="全选项用 indeterminate 表达「部分选中」，它只影响视觉，选中逻辑仍由使用方控制。"
      code='const selectAll = computed({
  get: () => group.length === all.length,
  set: (checked) => (group = checked ? [...all] : [])
})
const indeterminate = computed(
  () => group.length > 0 && group.length < all.length
)

<ICheckbox v-model="selectAll" :indeterminate="indeterminate">全选</ICheckbox>
<ICheckboxGroup v-model="group">
  <ICheckbox value="bug">缺陷</ICheckbox>
  <ICheckbox value="requirement">需求</ICheckbox>
</ICheckboxGroup>'
    >
      <div class="stack">
        <ICheckbox v-model="selectAll" :indeterminate="indeterminate">全选</ICheckbox>
        <ICheckboxGroup v-model="group">
          <ICheckbox value="bug">缺陷</ICheckbox>
          <ICheckbox value="requirement">需求</ICheckbox>
          <ICheckbox value="task">任务</ICheckbox>
        </ICheckboxGroup>
        <span class="hint">已选：{{ group.length ? group.join('、') : '无' }}</span>
      </div>
    </DemoBlock>

    <DemoBlock
      title="限制选择数量"
      description="达到 max 后未选中项自动禁用，已选中的仍可取消——不让用户陷入必须先取消才能操作的死角。"
      code='<ICheckboxGroup v-model="value" :max="2">…</ICheckboxGroup>'
    >
      <div class="stack">
        <ICheckboxGroup v-model="limited" :max="2">
          <ICheckbox value="a">林岚</ICheckbox>
          <ICheckbox value="b">陈序</ICheckbox>
          <ICheckbox value="c">苏禾</ICheckbox>
          <ICheckbox value="d">周迟</ICheckbox>
        </ICheckboxGroup>
        <span class="hint">最多选 2 人，已选 {{ limited.length }} 人</span>
      </div>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>选项互斥时——那是单选框。用多选框表达互斥，用户会以为可以都选。</li>
      <li>只有一个开关语义的选项、且改完立即生效时——用 Switch：多选框暗示「要等提交」。</li>
      <li>选项超过十来个时——用穿梭框或带搜索的多选下拉，一屏排不下的复选框谁也数不清选了几个。</li>
    </ul>

    <h2>API</h2>
    <h3>ICheckboxGroup</h3>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>(string | number)[]</code></td><td><code>[]</code></td><td>选中值数组，支持 v-model</td></tr>
        <tr><td>max</td><td><code>number</code></td><td>—</td><td>最多可选数量</td></tr>
        <tr><td>direction</td><td><code>horizontal | vertical</code></td><td><code>horizontal</code></td><td>排列方向</td></tr>
        <tr><td>disabled</td><td><code>boolean</code></td><td><code>false</code></td><td>整组禁用</td></tr>
      </tbody>
    </table>
    <h3>ICheckbox</h3>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>modelValue</td><td><code>boolean</code></td><td><code>false</code></td><td>单独使用时的选中态</td></tr>
        <tr><td>value</td><td><code>string | number</code></td><td>—</td><td>置于 Group 内时该项的值</td></tr>
        <tr><td>indeterminate</td><td><code>boolean</code></td><td><code>false</code></td><td>半选态，输出 <code>aria-checked="mixed"</code></td></tr>
        <tr><td>disabled</td><td><code>boolean</code></td><td><code>false</code></td><td>单项禁用</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.stack { display: grid; gap: var(--i-spacing-3); }
.hint { font-size: var(--i-font-size-sm); color: var(--i-color-text-tertiary); }
</style>
