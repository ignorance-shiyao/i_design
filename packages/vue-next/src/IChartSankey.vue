<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatTick, sankeyLayout, type SankeyLink } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    links: SankeyLink[]
    /** key → 显示名；不传就直接用 key */
    labels?: Record<string, string>
    title?: string
    height?: number
    unit?: string
  }>(),
  { labels: () => ({}), title: '', height: 300, unit: '' }
)

const W = 640
const PAD = { top: 12, right: 96, bottom: 12, left: 12 }

const layout = computed(() =>
  sankeyLayout(props.links, W - PAD.left - PAD.right, props.height - PAD.top - PAD.bottom, {
    labels: props.labels
  })
)

/* 节点是「身份」，因此用分类色按层内顺序分配，超过 8 个不再循环 */
const colorOf = (key: string) => {
  const index = layout.value.nodes.findIndex((n) => n.key === key)
  return index >= 0 && index < 8 ? `var(--i-chart-${index + 1})` : 'var(--i-color-text-tertiary)'
}

const active = ref<string | null>(null)
const showTable = ref(false)
</script>

<template>
  <figure class="i-chart">
    <figcaption v-if="title" class="i-chart__title">{{ title }}</figcaption>

    <svg
      class="i-chart__svg"
      :viewBox="`0 0 ${W} ${height}`"
      role="img"
      :aria-label="title || '桑基图'"
      @mouseleave="active = null"
    >
      <g :transform="`translate(${PAD.left} ${PAD.top})`">
        <!--
          缎带先画、节点后画：缎带在节点处收口，节点压在上面才能盖住接缝。
          半透明让交叉处仍能看出下面还有一条流。
        -->
        <path
          v-for="(ribbon, i) in layout.ribbons"
          :key="`r-${i}`"
          class="i-sankey__ribbon"
          :class="{ 'is-dim': active !== null && active !== ribbon.from && active !== ribbon.to }"
          :d="ribbon.path"
          :fill="colorOf(ribbon.from)"
          @mouseenter="active = ribbon.from"
        >
          <title>{{ labels[ribbon.from] ?? ribbon.from }} → {{ labels[ribbon.to] ?? ribbon.to }}：{{ formatTick(ribbon.value) }}{{ unit }}</title>
        </path>

        <g
          v-for="node in layout.nodes"
          :key="node.key"
          class="i-sankey__node"
          @mouseenter="active = node.key"
        >
          <rect
            :x="node.x"
            :y="node.y"
            :width="node.width"
            :height="node.height"
            :fill="colorOf(node.key)"
            rx="2"
          />
          <!-- 名称与流量直接标在节点旁：桑基图没有坐标轴，不标就读不出量 -->
          <text
            class="i-chart__tick i-sankey__label"
            :x="node.x + node.width + 6"
            :y="node.y + node.height / 2 + 4"
          >
            {{ node.label }} {{ formatTick(node.value) }}{{ unit }}
          </text>
        </g>
      </g>
    </svg>

    <button class="i-chart__table-toggle" @click="showTable = !showTable">
      {{ showTable ? '收起数据表' : '查看数据表' }}
    </button>
    <table v-if="showTable" class="i-chart__table">
      <thead>
        <tr><th>从</th><th>到</th><th>流量</th></tr>
      </thead>
      <tbody>
        <tr v-for="(link, i) in links" :key="i">
          <td>{{ labels[link.from] ?? link.from }}</td>
          <td>{{ labels[link.to] ?? link.to }}</td>
          <td>{{ formatTick(link.value) }}{{ unit }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>
