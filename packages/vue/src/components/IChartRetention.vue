<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChartRetention.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { retentionShade, type RetentionModel } from '@i-design/common'

const props = withDefaults(defineProps<{
  /** buildRetention 生成的同源模型，可直接序列化给其他端 */
  model: RetentionModel
  title?: string
  selectedId?: string
}>(), { title: '留存', selectedId: '' })
const emit = defineEmits<{ (e: 'select', id: string): void }>()

const columns = computed(() => Array.from({ length: props.model.periods }, (_, i) => i + 1))
const cellAt = (cohortId: string, period: number) =>
  props.model.cohorts.find(cohort => cohort.id === cohortId)?.cells.find(cell => cell.period === period)

/*
 * 色阶的五档都自带配好的字色，因此深浅与字色是一起换的，不是「底色变深、字还是那个字色」。
 * 未到期留空——最浅那一档是「几乎没人留下」，和「这一期还没到」是两回事。
 */
function shadeClass(cohortId: string, period: number) {
  const cell = cellAt(cohortId, period)
  const step = cell ? retentionShade(cell) : null
  return step === null ? 'is-pending' : `is-s${step}`
}
</script>

<template>
  <figure class="i-retention">
    <figcaption class="i-retention__title">{{ title }}</figcaption>
    <p class="i-retention__caption">{{ model.caption }}</p>
    <p class="i-retention__basis">口径：{{ model.basis }}。空格表示这一期还没到，不是 0。</p>
    <template v-if="model.state === 'ready'">
      <div class="i-retention__scroll">
        <table class="i-retention__table">
          <caption class="i-retention__sr">{{ title }}：{{ model.caption }}。{{ model.basis }}</caption>
          <thead>
            <tr>
              <th scope="col">批次</th>
              <th scope="col">期初</th>
              <th v-for="period in columns" :key="period" scope="col">第 {{ period }} 期</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="cohort in model.cohorts"
              :key="cohort.id"
              :class="{ 'is-selected': cohort.id === selectedId }"
            >
              <th scope="row">
                <button type="button" class="i-retention__pick" :aria-pressed="String(cohort.id === selectedId)" @click="emit('select', cohort.id)">
                  {{ cohort.label }}
                </button>
              </th>
              <td class="i-retention__size">{{ cohort.sizeText }}</td>
              <td
                v-for="period in columns"
                :key="period"
                class="i-retention__cell"
                :class="shadeClass(cohort.id, period)"
              >
                <span class="i-retention__value">{{ cellAt(cohort.id, period)?.rateText ?? '—' }}</span>
                <span class="i-retention__sr">{{ cellAt(cohort.id, period)?.description }}</span>
              </td>
            </tr>
            <tr class="i-retention__average">
              <th scope="row">各期平均</th>
              <td class="i-retention__size">—</td>
              <td v-for="average in model.averages" :key="average.period" :class="{ 'is-partial': !average.comparable }">
                <span class="i-retention__value">{{ average.rateText }}</span>
                <span v-if="!average.comparable" class="i-retention__flag">{{ average.cohorts }} / {{ model.cohorts.length }} 批</span>
                <span class="i-retention__sr">{{ average.description }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="model.averages.some(average => !average.comparable)" class="i-retention__caption">
        标着「N / M 批」的那几期只有部分批次到得了，是幸存者平均，不能和左边几期比。
      </p>
    </template>
    <ul v-if="model.excluded.length" class="i-retention__issues" aria-label="未计入的批次">
      <li v-for="row in model.excluded" :key="row.id">源行 {{ row.sourceIndex + 1 }} · {{ row.label }}：{{ row.reason }}</li>
    </ul>
  </figure>
</template>
