<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import {
  flattenTree,
  rafThrottle,
  resolveCheckState,
  searchTree,
  shouldVirtualize,
  toggleChecked,
  virtualWindow,
  visibleRows,
  type TreeNode
} from '@i-design/common'
import IIcon from './IIcon.vue'
import ICheckbox from './ICheckbox.vue'
import IInput from './IInput.vue'
import { useConfig } from './useConfig'

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
    /**
     * 列表区高度，如 `320px`。给了才能虚拟化——没有可视高度就算不出该渲染哪几行。
     * 不给时整棵树平铺，由外层页面滚动。
     */
    height?: string
    emptyText?: string
  }>(),
  {
    checked: () => [],
    expanded: () => [],
    checkable: false,
    searchable: false,
    selected: '',
    height: '',
    emptyText: '没有匹配的节点'
  }
)

const emit = defineEmits<{
  'update:checked': [keys: string[]]
  'update:expanded': [keys: string[]]
  'update:selected': [key: string]
  select: [node: TreeNode]
}>()

const { locale } = useConfig()

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

/* ----------------------------------------------------------- 虚拟滚动 */

/*
 * 展开一棵大树会一次铺出上万行。行本身不复杂，但每行都带一个复选框与一个折叠键，
 * 真正拖慢的是这三样东西乘以行数。
 *
 * 只有给了 height 才虚拟化：没有可视高度就算不出该渲染哪几行，
 * 这时不如老老实实全渲染，也不要拿一个猜的高度去算，那会把行定位到看不见的地方。
 */
const ROW_FALLBACK_HEIGHT = 32
const list = ref<HTMLElement | null>(null)
const rowHeight = ref(ROW_FALLBACK_HEIGHT)
const scrollTop = ref(0)
const viewportHeight = ref(0)

const virtual = computed(() => Boolean(props.height) && shouldVirtualize(rows.value.length))
const window_ = computed(() =>
  virtualWindow(scrollTop.value, viewportHeight.value, rowHeight.value, rows.value.length)
)
const visible = computed(() => {
  if (!virtual.value) return rows.value
  return rows.value.slice(window_.value.start, window_.value.end + 1)
})

/* 滚动事件远多于帧，而每次都要读一次布局 */
const onScroll = rafThrottle(() => {
  if (list.value) scrollTop.value = list.value.scrollTop
})
onBeforeUnmount(() => onScroll.cancel())

function measure() {
  const el = list.value
  if (!el) return
  viewportHeight.value = el.clientHeight
  const first = el.querySelector<HTMLElement>('.i-tree__row')
  if (first && first.offsetHeight > 0) rowHeight.value = first.offsetHeight
}

watch(
  () => [props.height, rows.value.length],
  () => nextTick(measure),
  { immediate: true }
)

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
      :placeholder="locale.searchNode"
    />

    <ul
      ref="list"
      class="i-tree__list"
      :class="{ 'is-scrollable': !!height }"
      :style="{ height: height || undefined }"
      role="tree"
      @scroll.passive="onScroll"
    >
      <!-- 上下两块撑开的空白替代没渲染的那些行，滚动条长度才和真实行数相称 -->
      <li v-if="virtual" class="i-tree__spacer" role="none" :style="{ height: `${window_.paddingTop}px` }" />
      <li
        v-for="row in visible"
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
          :aria-label="row.expanded ? locale.collapse : locale.expand"
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
      <li
        v-if="virtual"
        class="i-tree__spacer"
        role="none"
        :style="{ height: `${window_.paddingBottom}px` }"
      />
    </ul>

    <p v-if="!rows.length" class="i-tree__empty">{{ emptyText }}</p>
  </div>
</template>
