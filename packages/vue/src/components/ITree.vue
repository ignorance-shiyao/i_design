<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ITree.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  flattenTree,
  resolveCheckState,
  searchTree,
  toggleChecked,
  visibleRows,
  type TreeNode
} from '@i-design/common'
import IIcon from './IIcon.vue'
import ICheckbox from './ICheckbox.vue'
import IInput from './IInput.vue'

const props = withDefaults(
  defineProps<{
    data: TreeNode[]
    /** 勾选值；父子联动由组件负责，调用方只管收结果 */
    checked?: string[]
    expanded?: string[]
    /** 显示复选框；不显示时点击行即为选中 */
    checkable?: boolean
    /** 顶部带搜索框 */
    searchable?: boolean
    /** 单选场景下当前选中的节点 */
    selected?: string
    emptyText?: string
  }>(),
  {
    checked: () => [],
    expanded: () => [],
    checkable: false,
    searchable: false,
    selected: '',
    emptyText: '没有匹配的节点'
  }
)

const emit = defineEmits<{ (e: 'update:checked', a0: keys: string[]): void; (e: 'update:expanded', a0: keys: string[]): void; (e: 'update:selected', a0: key: string): void; (e: 'select', a0: node: TreeNode): void }>()

const entities = computed(() => flattenTree(props.data))
const keyword = ref('')

const search = computed(() => searchTree(entities.value, keyword.value))
const filtering = computed(() => keyword.value.trim().length > 0)

const localExpanded = ref<string[]>([...props.expanded])
watch(
  () => props.expanded,
  (next) => (localExpanded.value = [...next])
)
// 搜索时用命中路径覆盖展开态，但不写回调用方——清空关键字后应回到用户原来的展开状态
const effectiveExpanded = computed(() =>
  filtering.value ? [...search.value.expand] : localExpanded.value
)

const rows = computed(() =>
  visibleRows(
    props.data,
    entities.value,
    effectiveExpanded.value,
    filtering.value ? search.value.visible : undefined
  )
)

const state = computed(() => resolveCheckState(entities.value, props.checked))

function toggleExpand(key: string) {
  if (filtering.value) return
  const next = new Set(localExpanded.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  localExpanded.value = [...next]
  emit('update:expanded', localExpanded.value)
}

function onCheck(key: string, next: boolean) {
  emit('update:checked', [...toggleChecked(entities.value, props.checked, key, next)])
}

function onRowClick(key: string, disabled: boolean) {
  if (disabled) return
  const entity = entities.value.get(key)
  if (!entity) return
  if (props.checkable) {
    onCheck(key, !state.value.checked.has(key))
    return
  }
  emit('update:selected', key)
  emit('select', entity.node)
}

/** 搜索命中的部分用 <mark> 包起来，让用户看清为什么这一行被留下 */
function highlight(label: string) {
  const needle = keyword.value.trim()
  if (!needle) return [{ text: label, hit: false }]
  const parts: { text: string; hit: boolean }[] = []
  let rest = label
  let index = rest.toLowerCase().indexOf(needle.toLowerCase())
  while (index !== -1) {
    if (index > 0) parts.push({ text: rest.slice(0, index), hit: false })
    parts.push({ text: rest.slice(index, index + needle.length), hit: true })
    rest = rest.slice(index + needle.length)
    index = rest.toLowerCase().indexOf(needle.toLowerCase())
  }
  if (rest) parts.push({ text: rest, hit: false })
  return parts
}
</script>

<template>
  <div class="i-tree">
    <IInput
      v-if="searchable"
      v-model="keyword"
      class="i-tree__search"
      placeholder="搜索节点"
    />

    <ul class="i-tree__list" role="tree">
      <li
        v-for="row in rows"
        :key="row.key"
        class="i-tree__row"
        :class="{
          'is-selected': !checkable && selected === row.key,
          'is-disabled': row.disabled
        }"
        role="treeitem"
        :aria-expanded="row.hasChildren ? row.expanded : undefined"
        :aria-level="row.level + 1"
        :aria-disabled="row.disabled || undefined"
        :style="{ paddingLeft: `${row.level * 20 + 4}px` }"
        :tabindex="row.disabled ? -1 : 0"
        @click="onRowClick(row.key, row.disabled)"
        @keydown.enter.prevent="onRowClick(row.key, row.disabled)"
      >
        <button
          type="button"
          class="i-tree__toggle"
          :class="{ 'is-expanded': row.expanded, 'is-leaf': !row.hasChildren }"
          :aria-label="row.expanded ? '折叠' : '展开'"
          :tabindex="-1"
          @click.stop="toggleExpand(row.key)"
        >
          <IIcon name="chevron-right" :size="14" />
        </button>

        <ICheckbox
          v-if="checkable"
          :model-value="state.checked.has(row.key)"
          :indeterminate="state.halfChecked.has(row.key)"
          :disabled="row.disabled"
          @click.stop
          @update:model-value="(next: boolean) => onCheck(row.key, next)"
        />

        <span class="i-tree__label">
          <template v-for="(part, index) in highlight(row.node.label)" :key="index">
            <mark v-if="part.hit">{{ part.text }}</mark>
            <template v-else>{{ part.text }}</template>
          </template>
        </span>
      </li>
    </ul>

    <p v-if="!rows.length" class="i-tree__empty">{{ emptyText }}</p>
  </div>
</template>
