<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IBoard.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 看板与人员泳道（astra.md 的 B15）。
 *
 * 拖动、右键菜单里的「移动到…」、键盘上的方向键，**三条路径调的是同一个
 * `moveCard`**：各写一遍的话，同一次移动会落到三个结果，用户会以为其中一条坏了。
 *
 * 拿起卡片的那一刻，每个格子的可落性就都算出来了——能落的提起来，
 * 落不下的压暗并在格子里写出理由。拖着卡悬停半天没反应，
 * 用户的结论是「这破东西又卡了」，不是「这一列不收」。
 *
 * 判断全在 logic/board.ts，五端共用一份。
 */
import { computed, ref } from 'vue'
import {
  columnStat,
  dropTargets,
  moveCard,
  moveMenu,
  nextDropTarget,
  type BoardCard,
  type BoardColumn,
  type BoardLane,
  type MoveTarget
} from '@i-design/common'
import IIcon from './IIcon.vue'

const props = withDefaults(
  defineProps<{
    cards: BoardCard[]
    columns: BoardColumn[]
    /** 人员泳道。不给就是一张平看板 */
    lanes?: BoardLane[]
  }>(),
  { lanes: () => [] }
)

const emit = defineEmits<{ (e: 'update:cards', a0: BoardCard[]): void; (e: 'moved', message: string, ok: boolean): void }>()

/** 拿起来的那张卡。拖动与键盘共用它 */
const picked = ref<string | null>(null)
const pickedCard = computed(() => props.cards.find((c) => c.id === picked.value) ?? null)

/* 拿起的那一刻一次算完：每个格子能不能落、不能的理由是什么 */
const targets = computed(() =>
  pickedCard.value ? dropTargets(pickedCard.value, props.columns, props.cards, props.lanes) : []
)
const menu = computed(() =>
  pickedCard.value ? moveMenu(pickedCard.value, props.columns, props.cards, props.lanes) : []
)

const laneList = computed(() => (props.lanes.length ? props.lanes : [undefined]))

function targetOf(columnId: string, laneId?: string) {
  return targets.value.find(
    (t) => t.columnId === columnId && (t.laneId ?? undefined) === (laneId ?? undefined)
  )
}

function cardsIn(columnId: string, laneId?: string) {
  return props.cards.filter(
    (card) => card.columnId === columnId && (card.laneId ?? undefined) === (laneId ?? undefined)
  )
}

function pick(card: BoardCard) {
  // 锁着的卡拿不起来，但理由一直写在卡上，用户不必反复试
  if (card.lockedReason) return
  picked.value = picked.value === card.id ? null : card.id
}

/** 拖动、菜单、键盘都落到这里——三条路径的结果因此必然一致 */
function commit(to: MoveTarget) {
  if (!pickedCard.value) return
  const result = moveCard(props.cards, pickedCard.value.id, to, props.columns, props.lanes)
  emit('moved', result.message, result.ok)
  if (!result.ok) return
  emit('update:cards', result.cards)
  picked.value = null
}

function onKey(event: KeyboardEvent, card: BoardCard) {
  if (card.lockedReason) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    pick(card)
    return
  }
  if (!pickedCard.value || pickedCard.value.id !== card.id) return
  if (event.key === 'Escape') {
    picked.value = null
    return
  }
  const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (!delta) return
  event.preventDefault()
  // 方向键跳过落不下的格子，而不是停在上面等用户发现按了没反应
  const next = nextDropTarget(targets.value, { columnId: card.columnId, laneId: card.laneId }, delta)
  if (!next) {
    emit('moved', '这张卡现在没有能落的地方', false)
    return
  }
  commit({ columnId: next.columnId, laneId: next.laneId })
}

function onDrop(columnId: string, laneId?: string) {
  commit({ columnId, laneId })
}
</script>

<template>
  <section class="i-board">
    <p v-if="pickedCard" class="i-board__hint" role="status">
      <IIcon name="arrow-right" :size="14" />
      拿起「{{ pickedCard.title }}」：拖到别的格子，或用 ← → 移动、Esc 放下。落不下的格子已经压暗并写明原因。
    </p>

    <div v-for="lane in laneList" :key="lane?.id ?? '__flat__'" class="i-board__lane">
      <div v-if="lane" class="i-board__lane-title">
        {{ lane.title }}
        <!-- 不收新卡的泳道：理由跟在名字后面，而不是只把它变灰 -->
        <span v-if="lane.blockedReason" class="i-board__lane-blocked">{{ lane.blockedReason }}</span>
      </div>

      <!-- 这片网格的空白是落点，不是浪费：check:layout 的豁免要写明理由 -->
      <div
        class="i-board__columns"
        data-stretch-reason="看板的列：格子里的空白本身就是放卡片的落点，压到内容高度就没地方放了"
        :style="{ '--i-board-columns': columns.length }"
      >
        <div
          v-for="column in columns"
          :key="column.id"
          class="i-board__cell"
          :class="{
            'is-droppable': !!pickedCard && targetOf(column.id, lane?.id)?.allowed,
            'is-blocked': !!pickedCard && targetOf(column.id, lane?.id)?.allowed === false
          }"
          @dragover.prevent
          @drop.prevent="onDrop(column.id, lane?.id)"
        >
          <div class="i-board__head">
            <span>{{ column.title }}</span>
            <!-- 计数写成 2/2：没有分母，用户要等到拖不进去才知道有上限 -->
            <span
              class="i-board__count"
              :class="{ 'is-over': columnStat(column, cards, lane?.id).over }"
            >
              {{ columnStat(column, cards, lane?.id).text }}
            </span>
          </div>

          <button
            v-for="card in cardsIn(column.id, lane?.id)"
            :key="card.id"
            type="button"
            class="i-board__card"
            :class="{ 'is-picked': picked === card.id, 'is-locked': !!card.lockedReason }"
            :draggable="!card.lockedReason"
            :aria-pressed="String(picked === card.id)"
            :aria-disabled="!!card.lockedReason"
            @click="pick(card)"
            @keydown="onKey($event, card)"
            @dragstart="picked = card.id"
            @dragend="picked = null"
          >
            <span>{{ card.title }}</span>
            <!-- 锁着的卡说清为什么，而不是只变灰让人反复试 -->
            <span v-if="card.lockedReason" class="i-board__card-locked">{{ card.lockedReason }}</span>
          </button>

          <!-- 落不下的原因就写在格子里，不靠悬停提示 -->
          <p
            v-if="pickedCard && targetOf(column.id, lane?.id)?.allowed === false"
            class="i-board__cell-reason"
          >
            {{ targetOf(column.id, lane?.id)?.reason }}
          </p>
        </div>
      </div>
    </div>

    <!-- 「移动到…」：与拖动同一份清单，落不下的也列出来并写明理由 -->
    <ul v-if="pickedCard" class="i-board__menu">
      <li v-for="target in menu" :key="`${target.laneId ?? ''}/${target.columnId}`">
        <button
          type="button"
          class="i-board__menu-item"
          :disabled="!target.allowed"
          @click="commit({ columnId: target.columnId, laneId: target.laneId })"
        >
          <span>移动到 {{ target.title }}</span>
          <span v-if="!target.allowed" class="i-board__menu-reason">{{ target.reason }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>
