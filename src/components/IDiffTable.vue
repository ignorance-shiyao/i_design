<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  defaultDiffSelection,
  diffActionLabel,
  summarizeDiff,
  toggleDiffRow,
  type DiffRow
} from '@i-design/common'
import IButton from './IButton.vue'
import ICheckbox from './ICheckbox.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    /** 列的 key 与表头文案 */
    columns: { key: string; label: string }[]
    rows: DiffRow[]
  }>(),
  { title: '待应用的改动' }
)

const emit = defineEmits<{ apply: [ids: string[]] }>()

// 默认全选：智能体给的是一整套方案，逐个勾选反而是例外
const selected = ref<string[]>(defaultDiffSelection(props.rows))
watch(
  () => props.rows,
  (rows) => (selected.value = defaultDiffSelection(rows))
)

const summary = computed(() => summarizeDiff(props.rows, selected.value))
const label = computed(() => diffActionLabel(summary.value))

const SIGN: Record<string, string> = { added: '＋', removed: '−', changed: '~', unchanged: '' }

function toggle(id: string) {
  selected.value = toggleDiffRow(props.rows, selected.value, id)
}
</script>

<template>
  <section class="i-difftable">
    <header class="i-difftable__head">
      <span class="i-difftable__title">{{ title }}</span>
      <span class="i-difftable__hint">点击改动行可以取消采纳</span>
    </header>

    <table class="i-difftable__grid">
      <thead>
        <tr>
          <th style="width: 40px" aria-label="采纳" />
          <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.id"
          class="i-difftable__row"
          :class="[
            `is-${row.kind}`,
            { 'is-off': row.kind !== 'unchanged' && !selected.includes(row.id) }
          ]"
          @click="toggle(row.id)"
        >
          <td>
            <ICheckbox
              v-if="row.kind !== 'unchanged'"
              :model-value="selected.includes(row.id)"
              :aria-label="String(row.cells[columns[0].key] ?? row.id)"
              @click.stop
              @update:model-value="() => toggle(row.id)"
            />
          </td>
          <td v-for="(column, index) in columns" :key="column.key">
            <!--
              改动类型用前缀符号 + 淡底双重表达：只用红绿底色的话，
              色觉障碍用户看到的是两块一样的灰。符号只出现在首列，避免每格都重复。
            -->
            <span v-if="index === 0" class="i-difftable__sign" aria-hidden="true">
              {{ SIGN[row.kind] }}
            </span>
            <span v-if="row.cells[column.key]?.before" class="i-difftable__before">
              {{ row.cells[column.key].before }}
            </span>
            {{ row.cells[column.key]?.value ?? '' }}
          </td>
        </tr>
      </tbody>
    </table>

    <footer class="i-difftable__foot">
      <span class="i-difftable__stat">
        {{ summary.removed }} 处删除 · {{ summary.added }} 处新增 · {{ summary.changed }} 处修改
      </span>
      <IButton
        variant="primary"
        size="sm"
        :disabled="summary.selected === 0"
        @click="emit('apply', selected)"
      >
        {{ label }}
      </IButton>
    </footer>
  </section>
</template>
