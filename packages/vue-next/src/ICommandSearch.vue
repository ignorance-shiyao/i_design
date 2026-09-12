<script setup lang="ts">
/**
 * 命令搜索：一个搜索框，一串实时过滤的结果，键盘全程可用。
 *
 * 它解决的是「东西太多，翻不动」——超过几十项的菜单、设置、文档页，
 * 再怎么分组都不如直接搜。所以它的成败全在两件事：排序对不对，
 * 以及能不能一次都不碰鼠标地走完「唤起 → 选中 → 打开」。
 */
import { computed, nextTick, ref, watch } from 'vue'
import { useConfig } from './useConfig'
import IIcon from './IIcon.vue'
import IEmpty from './IEmpty.vue'
import { moveCommandIndex, searchCommands, type CommandItem } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 可搜的全部条目 */
    items: CommandItem[]
    /** 是否打开；用 v-model:open 控制 */
    open?: boolean
    placeholder?: string
    /** 最多显示多少条 */
    limit?: number
  }>(),
  { open: false, placeholder: '', limit: 20 }
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [item: CommandItem]
}>()

const { locale } = useConfig()

const keyword = ref('')
const active = ref(0)
const input = ref<HTMLInputElement | null>(null)
const listEl = ref<HTMLElement | null>(null)

const matches = computed(() => searchCommands(props.items, keyword.value, props.limit))

/* 结果变了就把高亮拉回第一条：停在原来的序号上会指到一条完全不相干的结果 */
watch(matches, () => (active.value = 0))

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    // 每次打开都从空查询开始：上一次搜过什么与这一次要找什么没有关系
    keyword.value = ''
    active.value = 0
    await nextTick()
    input.value?.focus()
  },
  { immediate: true }
)

function close() {
  emit('update:open', false)
}

function choose(item: CommandItem) {
  emit('select', item)
  close()
}

/** 高亮命中的那几个字：把整行都标起来反而看不出重点 */
function parts(label: string, ranges: [number, number][]) {
  if (!ranges.length) return [{ text: label, hit: false }]
  const [[from, to]] = ranges
  return [
    { text: label.slice(0, from), hit: false },
    { text: label.slice(from, to), hit: true },
    { text: label.slice(to), hit: false }
  ].filter((p) => p.text)
}

async function move(delta: number) {
  active.value = moveCommandIndex(active.value, delta, matches.value.length)
  await nextTick()
  /*
   * 让高亮项滚进视野。用 nearest 而不是 center：
   * 每按一下方向键整个列表就重新居中一次，读者会失去「我在列表哪个位置」的感觉。
   */
  listEl.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
  } else if (event.key === 'Enter') {
    const hit = matches.value[active.value]
    if (hit) {
      event.preventDefault()
      choose(hit.item)
    }
  } else if (event.key === 'Escape') {
    close()
  }
}
</script>

<template>
  <!-- 挂到 body：命令面板压在所有内容之上，父容器的 overflow 与层级都不该影响它 -->
  <Teleport to="body">
    <div v-if="open" class="i-cmd" @click.self="close">
      <div class="i-cmd__panel" role="dialog" aria-modal="true" :aria-label="placeholder || locale.search">
        <div class="i-cmd__field">
          <IIcon class="i-cmd__icon" name="search" :size="16" />
          <input
            ref="input"
            v-model="keyword"
            class="i-cmd__input"
            type="text"
            :placeholder="placeholder || locale.search"
            :aria-label="placeholder || locale.search"
            role="combobox"
            aria-expanded="true"
            aria-controls="i-cmd-list"
            :aria-activedescendant="matches[active] ? `i-cmd-opt-${matches[active].item.key}` : undefined"
            @keydown="onKeydown"
          />
          <kbd class="i-cmd__kbd">Esc</kbd>
        </div>

        <ul v-if="matches.length" id="i-cmd-list" ref="listEl" class="i-cmd__list" role="listbox">
          <li
            v-for="(match, index) in matches"
            :id="`i-cmd-opt-${match.item.key}`"
            :key="match.item.key"
            class="i-cmd__item"
            :class="{ 'is-active': index === active }"
            :data-active="index === active"
            role="option"
            :aria-selected="index === active"
            @click="choose(match.item)"
            @mousemove="active = index"
          >
            <div class="i-cmd__main">
              <span class="i-cmd__label">
                <span v-for="(part, i) in parts(match.item.label, match.ranges)" :key="i" :class="{ 'i-cmd__hit': part.hit }">{{ part.text }}</span>
              </span>
              <span v-if="match.item.description" class="i-cmd__desc">{{ match.item.description }}</span>
            </div>
            <span v-if="match.item.group" class="i-cmd__group">{{ match.item.group }}</span>
          </li>
        </ul>

        <!-- 空态给的是「换个词」而不是「没有结果」：后者只是把已经看到的事实重复一遍 -->
        <div v-else class="i-cmd__empty">
          <IEmpty size="sm" type="search" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
