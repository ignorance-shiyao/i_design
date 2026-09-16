<script setup lang="ts">
import { ref } from 'vue'
import IBoard from '@/components/IBoard.vue'
import DemoBlock from '@/site/DemoBlock.vue'
import { message } from '@/components/message'
import { moveCard, type BoardCard, type BoardColumn, type BoardLane } from '@i-design/common'

/*
 * 演示数据刻意把四种「落不下」摆齐：在制品满、状态流转不允许、
 * 泳道不收（离职）、卡片自己锁着（已归档）。
 */
const columns: BoardColumn[] = [
  { id: 'todo', title: '待办' },
  { id: 'doing', title: '进行中', wipLimit: 2 },
  { id: 'done', title: '已完成', allowFrom: ['doing'] }
]
const lanes: BoardLane[] = [
  { id: 'lan', title: '林岚' },
  { id: 'shen', title: '沈黎' },
  { id: 'zhou', title: '周其', blockedReason: '已离职，不能再分派' }
]
const cards = ref<BoardCard[]>([
  { id: 'k1', title: '对账单核对', columnId: 'todo', laneId: 'lan' },
  { id: 'k2', title: '合同附件更新', columnId: 'doing', laneId: 'lan' },
  { id: 'k3', title: '发货单打印', columnId: 'doing', laneId: 'lan' },
  { id: 'k4', title: '去年的结转单', columnId: 'todo', laneId: 'shen', lockedReason: '已归档，不能再改' },
  { id: 'k5', title: '客户回访', columnId: 'todo', laneId: 'shen' }
])

/* 演示「另一条路径」：这个按钮走的是同一个 moveCard，因此结果必然一致 */
function moveByMenu() {
  const result = moveCard(cards.value, 'k1', { columnId: 'doing', laneId: 'lan' }, columns, lanes)
  message[result.ok ? 'success' : 'warning'](result.message)
  if (result.ok) cards.value = result.cards
}
</script>

<template>
  <article class="i-doc">
    <h1>Board 看板</h1>
    <p class="i-lead">
      一张按列排的看板，可以再按人分成泳道。它真正难的地方不是拖动本身，而是「同一次移动，走哪条路都得是同一个结果」。
    </p>

    <h2>移动只有一个实现</h2>
    <p>
      拖动是一条路径，右键菜单里的「移动到…」是另一条，键盘上的方向键是第三条。三条各写一遍的话，同一次移动会落到三个结果——拖过去成了，用菜单却提示「不允许」，用户会以为其中一条坏了，从此只用他试出来管用的那一条。所以这里只有一个 <code>moveCard</code>，三条路径都走它；能不能落、为什么不能落，也只有 <code>moveCheck</code> 一个口径。
    </p>
    <p>
      <strong>不能落的地方，在拖起来之前就要看得出来并说明原因。</strong>拖着一张卡在一列上悬停半天没反应，用户的结论是「这破东西又卡了」，不是「这一列不收」。<strong>键盘要有等价动作</strong>，而且清单与拖动完全一致——只能拖的看板对键盘与读屏用户等于不可用。<strong>跨泳道移动同时改了负责人与状态两件事</strong>，只提示「已移动」的话，用户不会想到自己顺手换了人。
    </p>

    <DemoBlock
      title="拖动、菜单与键盘"
      description="点一张卡把它拿起来（或直接拖）：所有格子立刻分成两类——能落的提亮，落不下的压暗并在格子里写出原因。「林岚 / 进行中」写着在制品已满 2/2，「已完成」写着待办不能直接进，周其那条泳道写着已离职。拿起后按 ← → 在能落的格子之间跳（落不下的直接跳过），Esc 放下。下面那份「移动到…」清单与拖动允许的完全一致，落不下的也列着并带理由。"
      lang="vue"
      code='<IBoard v-model:cards="cards" :columns="columns" :lanes="lanes" @moved="(msg) => toast(msg)" />'
    >
      <div class="board-demo">
        <IBoard
          v-model:cards="cards"
          :columns="columns"
          :lanes="lanes"
          @moved="(msg: string, ok: boolean) => message[ok ? 'success' : 'warning'](msg)"
        />
        <button type="button" class="i-button i-button--sm" @click="moveByMenu">
          用另一条路径移动「对账单核对」到 林岚 / 进行中
        </button>
      </div>
    </DemoBlock>

    <h2>在制品上限</h2>
    <p>
      列头写的是「2/2」而不是只写「2」：没有分母的话，用户要等到拖不进去才知道有上限这回事。超了只是<strong>不让新的再进，已经在里面的不赶出去</strong>——把超出的卡弹回去，会把一次误操作变成两次数据变更。
    </p>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>状态多到一屏排不下时——看板的价值在「一眼看到全局」，横向滚动的看板还不如一张表。</li>
      <li>每张卡都要填很多字段时——那是表单的活，看板上只放做决定需要的那几项。</li>
      <li>只有一个人用时——泳道是给「谁在做什么」这个问题准备的，一个人不需要它。</li>
    </ul>

    <h2>API</h2>
    <table class="i-table">
      <thead><tr><th>属性</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>cards</td><td><code>BoardCard[]</code></td><td><code>[]</code></td><td>卡片，支持 v-model</td></tr>
        <tr><td>columns</td><td><code>BoardColumn[]</code></td><td><code>[]</code></td><td>列；可带 wipLimit 与 allowFrom</td></tr>
        <tr><td>lanes</td><td><code>BoardLane[]</code></td><td><code>[]</code></td><td>人员泳道；不给就是一张平看板</td></tr>
      </tbody>
    </table>
    <table class="i-table">
      <thead><tr><th>事件</th><th>回调参数</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>moved</td><td><code>(message, ok)</code></td><td>成了说动了什么，没成说为什么</td></tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
.board-demo { display: grid; gap: var(--i-spacing-3); width: 100%; }
</style>
