<script setup lang="ts">
import { computed } from 'vue'
import { adjacencyShade, type AdjacencyModel } from '@i-design/common'

const props = withDefaults(defineProps<{
  /** buildAdjacency 生成的同源模型，可直接序列化给其他端 */
  model: AdjacencyModel
  title?: string
  selectedRow?: number | null
  selectedCol?: number | null
}>(), { title: '邻接矩阵', selectedRow: null, selectedCol: null })
const emit = defineEmits<{ select: [row: number, col: number] }>()

function cellClass(row: number, col: number) {
  const cell = props.model.cells[row]?.[col]
  if (!cell) return 'is-absent'
  if (cell.state === 'absent') return 'is-absent'
  if (cell.state === 'unknown') return 'is-unknown'
  const step = adjacencyShade(cell, props.model.min, props.model.max)
  return step === null ? 'is-absent' : `is-s${step}`
}

function stateLabel(state: string, value: number | null) {
  if (state === 'absent') return '无边'
  if (state === 'unknown') return '未观测'
  if (value === 0) return '零权'
  return ''
}

const zeroCount = computed(() =>
  props.model.cells.flat().filter((cell) => cell.state === 'ready' && cell.value === 0).length
)
</script>

<template>
  <figure class="i-adjacency">
    <figcaption class="i-adjacency__title">{{ title }}</figcaption>
    <p class="i-adjacency__caption">{{ model.caption }}</p>
    <p class="i-adjacency__basis">口径：{{ model.basis }}</p>

    <div class="i-adjacency__status" aria-label="矩阵状态">
      <span class="i-adjacency__chip">{{ model.directed ? '有向' : '无向' }}</span>
      <span class="i-adjacency__chip">排序 · {{ model.sort === 'input' ? '输入序' : model.sort === 'degree' ? '度数' : '社群' }}</span>
      <span v-if="model.counts.absent" class="i-adjacency__chip is-absent">{{ model.counts.absent }} 个无边空档</span>
      <span v-if="model.counts.unknown" class="i-adjacency__chip is-unknown">{{ model.counts.unknown }} 个未观测</span>
      <span v-if="zeroCount" class="i-adjacency__chip is-zero">{{ zeroCount }} 条零权边</span>
    </div>

    <template v-if="model.state === 'ready'">
      <div class="i-adjacency__scroll">
        <table class="i-adjacency__table">
          <caption class="i-adjacency__sr">{{ title }}：{{ model.caption }}。{{ model.basis }}</caption>
          <thead>
            <tr>
              <th scope="col" class="i-adjacency__corner">从 \\ 到</th>
              <th v-for="node in model.nodes" :key="`h-${node.id}`" scope="col">{{ node.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in model.cells" :key="model.nodes[rowIndex].id">
              <th scope="row" class="i-adjacency__row-head">
                {{ model.nodes[rowIndex].label }}
                <span class="i-adjacency__state">度 {{ model.nodes[rowIndex].degree }}</span>
              </th>
              <td v-for="(cell, colIndex) in row" :key="`${cell.rowId}-${cell.columnId}`">
                <button
                  type="button"
                  class="i-adjacency__cell"
                  :class="[
                    cellClass(rowIndex, colIndex),
                    { 'is-selected': selectedRow === rowIndex && selectedCol === colIndex }
                  ]"
                  :aria-pressed="selectedRow === rowIndex && selectedCol === colIndex ? 'true' : 'false'"
                  :aria-label="cell.description"
                  @click="emit('select', rowIndex, colIndex)"
                >
                  <span class="i-adjacency__value">{{ cell.valueText }}</span>
                  <span v-if="stateLabel(cell.state, cell.value)" class="i-adjacency__state">
                    {{ stateLabel(cell.state, cell.value) }}
                  </span>
                  <span class="i-adjacency__sr">{{ cell.description }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="i-adjacency__note">
        「—」且标「无边」是确认没有边；「—」且标「未观测」是没统计到；「0」是权重为零的边。
        三者不是一回事。
      </p>
    </template>

    <ul v-if="model.excluded.length" class="i-adjacency__issues" aria-label="未计入的节点或边">
      <li v-for="row in model.excluded" :key="`${row.id}-${row.sourceIndex}`">
        未计入 · {{ row.id }}：{{ row.reason }}
      </li>
    </ul>
  </figure>
</template>
