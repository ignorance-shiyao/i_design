<script setup lang="ts">
import { computed, ref } from 'vue'
import IIcon from './IIcon.vue'
import ICheckbox from './ICheckbox.vue'
import IInput from './IInput.vue'
import {
  checkedAfterMove,
  filterItems,
  headerState,
  moveKeys,
  splitSides,
  toggleAll,
  toggleItem,
  type TransferItem,
  type TransferSide
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    items: TransferItem[]
    /** 右栏的 key，顺序即用户搬过去的顺序 */
    modelValue?: string[]
    titles?: [string, string]
    searchable?: boolean
    height?: number
  }>(),
  {
    modelValue: () => [],
    titles: () => ['待选', '已选'],
    searchable: true,
    height: 260
  }
)

const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

const checked = ref<Record<TransferSide, string[]>>({ source: [], target: [] })
const keyword = ref<Record<TransferSide, string>>({ source: '', target: '' })

const sides = computed(() => splitSides(props.items, props.modelValue))
const visible = computed(() => ({
  source: filterItems(sides.value.source, keyword.value.source),
  target: filterItems(sides.value.target, keyword.value.target)
}))
const header = computed(() => ({
  source: headerState(visible.value.source, checked.value.source),
  target: headerState(visible.value.target, checked.value.target)
}))

function move(to: TransferSide) {
  const from: TransferSide = to === 'target' ? 'source' : 'target'
  const moving = checked.value[from]
  if (!moving.length) return
  emit('update:modelValue', moveKeys(props.items, props.modelValue, moving, to))
  // 搬走的要从勾选里清掉，否则会出现「已选 3 项」而屏幕上一个勾都没有
  checked.value = { ...checked.value, [from]: checkedAfterMove(checked.value[from], moving) }
}

function onToggleAll(side: TransferSide) {
  checked.value = { ...checked.value, [side]: toggleAll(visible.value[side], checked.value[side]) }
}

function onToggle(side: TransferSide, key: string) {
  checked.value = { ...checked.value, [side]: toggleItem(checked.value[side], key) }
}

const panes: { side: TransferSide; title: string }[] = [
  { side: 'source', title: props.titles[0] },
  { side: 'target', title: props.titles[1] }
]
</script>

<template>
  <div class="i-transfer" :style="{ '--i-transfer-height': `${height}px` }">
    <template v-for="(pane, index) in panes" :key="pane.side">
      <section class="i-transfer__pane">
        <header class="i-transfer__head">
          <!--
            表头的全选只管当前可见的条目：搜索状态下用户的意思是「这些」，
            把看不见的一起选中，再点搬运就会搬走一批他从没见过的条目。
          -->
          <ICheckbox
            :model-value="header[pane.side].allChecked"
            :indeterminate="header[pane.side].someChecked"
            :disabled="header[pane.side].selectable === 0"
            @update:model-value="onToggleAll(pane.side)"
          />
          <span class="i-transfer__title">{{ pane.title }}</span>
          <span class="i-transfer__count">
            {{ header[pane.side].checked }} / {{ visible[pane.side].length }}
          </span>
        </header>

        <div v-if="searchable" class="i-transfer__search">
          <!-- 不带清除按钮：React 端的 Input 还没有 clearable，两端先保持一致 -->
          <IInput v-model="keyword[pane.side]" size="sm" placeholder="搜索" />
        </div>

        <ul class="i-transfer__list">
          <li
            v-for="item in visible[pane.side]"
            :key="item.key"
            class="i-transfer__item"
            :class="{ 'is-disabled': item.disabled }"
          >
            <ICheckbox
              :model-value="checked[pane.side].includes(item.key)"
              :disabled="item.disabled"
              @update:model-value="onToggle(pane.side, item.key)"
            >
              {{ item.label }}
            </ICheckbox>
          </li>
          <li v-if="!visible[pane.side].length" class="i-transfer__empty">
            {{ keyword[pane.side] ? '没有匹配的条目' : '空' }}
          </li>
        </ul>
      </section>

      <!--
        按钮列是两栏之间真正的一格，不是浮在上面的绝对定位块。
        绝对定位的网格子项，包含块是它自己那一格——而那一格因为没有内容宽度是 0，
        于是按钮会落到隔壁栏里去。
      -->
      <div v-if="index === 0" class="i-transfer__actions">
        <button
          class="i-transfer__move"
          type="button"
          aria-label="移到右栏"
          :disabled="!checked.source.length"
          @click="move('target')"
        >
          <IIcon name="chevron-right" :size="16" />
        </button>
        <button
          class="i-transfer__move"
          type="button"
          aria-label="移到左栏"
          :disabled="!checked.target.length"
          @click="move('source')"
        >
          <IIcon name="chevron-left" :size="16" />
        </button>
      </div>
    </template>
  </div>
</template>
