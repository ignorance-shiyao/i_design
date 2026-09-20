<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildHierarchy, type HierarchyInput } from '@i-design/common'
import IChartIcicle from '@/components/IChartIcicle.vue'
import IChartSunburst from '@/components/IChartSunburst.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const selectedId = ref('')
const focusId = ref('')
const shape = ref<'icicle' | 'sunburst'>('icicle')

/* 三层数据：旭日在第三层已经细到点不中，矩形还读得出来——这页要演的就是这件事 */
const source: HierarchyInput[] = [
  { id: 'cn', parentId: null, label: '国内', value: null },
  { id: 'cn-east', parentId: 'cn', label: '华东', value: 120 },
  { id: 'cn-east-sh', parentId: 'cn-east', label: '上海', value: 70 },
  { id: 'cn-east-js', parentId: 'cn-east', label: '江苏', value: 30 },
  { id: 'cn-north', parentId: 'cn', label: '华北', value: 60 },
  { id: 'cn-north-bj', parentId: 'cn-north', label: '北京', value: 45 },
  { id: 'oversea', parentId: null, label: '海外', value: 80 },
  { id: 'oversea-sea', parentId: 'oversea', label: '东南亚', value: 50 }
]

const model = computed(() => buildHierarchy(source, { unit: ' 万' }))
const selected = computed(() => model.value.nodes.find(node => node.id === selectedId.value))
</script>

<template>
  <article class="doc-page icicle-page">
    <h1>Icicle 图</h1>
    <p class="i-lead">和旭日图看的是同一份层级汇总，只是摊成一排横向色块：每一行是一层，宽度按占全体的比例分配。层数深的时候它比旭日好读——矩形的宽度是线性的，可以直接比，标签也放得下。</p>

    <h2>同一份数据，两种摊法</h2>
    <p>示例为虚构的销售构成，三层。切换到旭日看同一份数据：最外圈的扇段已经细到点不中，长度还被曲率压缩，比不出大小；换成矩形就读得出来。代价是圆环能一眼看出「整体是一个 100%」，矩形不行——所以两张图都留着，按层数深浅选。</p>
    <p>两张图共用 buildHierarchy 的结果，因此顺序、分母、取色号和「未细分」的位置逐项一致。切过去再切回来，选中的还是同一个节点。</p>
    <DemoBlock
      title="销售构成（三层）"
      description="点色块或用 Tab 与 Enter 选择，双击下钻；切换图形可以对照同一份数据的两种摊法。"
      lang="vue"
      code="const model = buildHierarchy(source, { unit: ' 万' })"
    >
      <div class="icicle-demo">
        <div class="icicle-controls" aria-label="图形">
          <IButton :aria-pressed="shape === 'icicle'" @click="shape = 'icicle'">Icicle</IButton>
          <IButton :aria-pressed="shape === 'sunburst'" @click="shape = 'sunburst'">旭日</IButton>
        </div>
        <IChartIcicle
          v-if="shape === 'icicle'"
          :model="model"
          :focus-id="focusId"
          :selected-id="selectedId"
          title="销售构成"
          @select="selectedId = $event"
          @focus="focusId = $event"
        />
        <IChartSunburst
          v-else
          :model="model"
          :focus-id="focusId"
          :selected-id="selectedId"
          title="销售构成"
          @select="selectedId = $event"
          @focus="focusId = $event"
        />
        <p class="icicle-selection" role="status">{{ selected ? `已选：${selected.description}` : '尚未选择节点' }}</p>
      </div>
    </DemoBlock>

    <h2>写不下的标签</h2>
    <p>格子窄到写不下名字时不写，而不是让文字溢出到隔壁格子上——那看起来会像是隔壁那一格的名字。放不放得下由共享逻辑按字数估算，估窄一点，宁可少写。名字始终在下方清单里，读屏器也念得到。</p>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>只有一两层时不用：一排矩形不如条形图直观，也读不出层级关系。</li>
      <li>要强调「合起来是一个整体」时用旭日：圆环有边界，矩形没有。</li>
      <li>分类超过八支时不用：颜色不再区分得开，先在数据侧合并成「其他」。</li>
    </ul>

    <h2>模型与交互</h2>
    <p>用 buildHierarchy 生成 model，传入 title、focusId、selectedId 与 rowHeight；select 返回稳定节点 ID，focus 返回下钻焦点（空串表示返回全部）。各端接收同一个可序列化模型，格子的位置与取色号同样来自共享逻辑。小程序事件的 ID 位于 detail.id，Flutter 使用 onSelect / onFocus 回调，并额外接收 icicleCells 与 icicleHeight 的结果。</p>
  </article>
</template>

<style scoped>
.icicle-demo { width: 100%; min-width: 0; }
.icicle-page p { max-width: 45em; }
.icicle-page li { max-width: 45em; }
.icicle-controls { display: flex; flex-wrap: wrap; gap: var(--i-spacing-2); margin-bottom: var(--i-spacing-4); }
.icicle-selection { margin-top: var(--i-spacing-3); color: var(--i-color-text-secondary); }
</style>
