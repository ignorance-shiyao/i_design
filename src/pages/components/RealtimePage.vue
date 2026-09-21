<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildRealtimeWindow, type RealtimePointInput } from '@i-design/common'
import IChartRealtime from '@/components/IChartRealtime.vue'
import IButton from '@/components/IButton.vue'
import DemoBlock from '@/site/DemoBlock.vue'

const selectedIndex = ref<number | null>(null)
const state = ref<'live' | 'gap' | 'paused' | 'empty'>('live')

/*
 * 演示要能演出正文说的那几件事：
 * 直播合计、中间一段断流（不是 0）、暂停钉住窗口、以及空窗。
 * 事件时间落在 0–4000；墙钟 4000。断流盖住 1000–3000 两个桶。
 */
const source: RealtimePointInput[] = [
  { id: 'a', at: 400, value: 2 },
  { id: 'b', at: 800, value: 3 },
  { id: 'c', at: 1500, value: 5 },
  { id: 'd', at: 2200, value: 1 },
  { id: 'e', at: 3100, value: 4, mark: '发布' },
  { id: 'f', at: 3600, value: 0 },
  { id: 'late', at: -500, value: 9 }
]

const model = computed(() => {
  if (state.value === 'empty') {
    return buildRealtimeWindow([], { now: 4000, windowMs: 4000, bucketMs: 1000, unit: ' 次' })
  }
  if (state.value === 'paused') {
    return buildRealtimeWindow(source, {
      now: 99999,
      windowMs: 4000,
      bucketMs: 1000,
      paused: true,
      freezeAt: 4000,
      unit: ' 次'
    })
  }
  if (state.value === 'gap') {
    return buildRealtimeWindow(
      [
        { id: 'a', at: 400, value: 2 },
        { id: 'f', at: 3600, value: 0 },
        { id: 'late', at: -500, value: 9 }
      ],
      {
        now: 4000,
        windowMs: 4000,
        bucketMs: 1000,
        gaps: [{ from: 1000, to: 3000 }],
        unit: ' 次'
      }
    )
  }
  return buildRealtimeWindow(source, {
    now: 4000,
    windowMs: 4000,
    bucketMs: 1000,
    unit: ' 次'
  })
})

const selected = computed(() =>
  selectedIndex.value === null ? null : model.value.buckets[selectedIndex.value] ?? null
)

function changeState(value: typeof state.value) {
  state.value = value
  selectedIndex.value = null
}
</script>

<template>
  <article class="doc-page realtime-page">
    <h1>实时滑窗</h1>
    <p class="i-lead">此刻往回看，最近这一段发生了什么。和留存一样，最危险的不是算错，而是把「没有数据」画成「数据是 0」——断流期间画成一串零，值班的人会以为流量掉光了，而其实是线断了。</p>

    <h2>窗口按时间切，点按事件时间归桶</h2>
    <p>「最近 100 条」在流量尖峰时可能只覆盖 3 秒，在低谷时覆盖半小时——同一张图上的横轴含义会跟着数据密度漂。这里窗口是一段固定时长，桶宽也是固定时长；条数只用来限制缓存，不定义窗口。</p>
    <p>14:00:05 发生的事，14:00:20 才送到，归进 14:00:00 那个桶——那是它真正发生的时刻。归进「当前桶」会在最新的位置凭空冒出一个尖峰，而那个尖峰在历史上从未存在。已经滑出窗口的点列为「未入窗」，不静默丢掉。</p>

    <h2>断流不是 0，暂停时窗口钉死</h2>
    <p>某个桶的时间范围内一根点都没收到，且这段时间落在已知的断流区间里，桶的状态是空档，值是空，连折线都不连过去。真正测到的 0 仍然画成 0。两者在图上必须能分开——否则断线会被读成业务归零。</p>
    <p>暂停是人的意图：「让我看清楚这一段」。窗口继续滑，人就永远看不清。暂停期间到达的点仍按事件时间入缓存；恢复时窗口跳到最新。暂停状态必须看得见。</p>

    <DemoBlock
      title="最近四秒的请求"
      description="点一个桶或用 Tab 与 Enter 选中；切换状态可以看到断流、暂停与空窗。"
      lang="vue"
      code="const model = buildRealtimeWindow(points, { now, windowMs: 4000, bucketMs: 1000, unit: ' 次' })"
    >
      <div class="realtime-demo">
        <div class="realtime-controls" aria-label="示例数据状态">
          <IButton :aria-pressed="state === 'live'" @click="changeState('live')">直播</IButton>
          <IButton :aria-pressed="state === 'gap'" @click="changeState('gap')">中间断流</IButton>
          <IButton :aria-pressed="state === 'paused'" @click="changeState('paused')">已暂停</IButton>
          <IButton :aria-pressed="state === 'empty'" @click="changeState('empty')">空窗</IButton>
        </div>
        <IChartRealtime
          :model="model"
          :selected-index="selectedIndex"
          title="最近四秒的请求"
          @select="selectedIndex = $event"
        />
        <p class="realtime-selection" role="status">
          {{ selected ? `已选：${selected.description}` : '尚未选择桶' }}
        </p>
      </div>
    </DemoBlock>

    <h2>什么时候不该用它</h2>
    <ul>
      <li>只想看总量、不关心时间分布时用指标卡：滑窗回答的是「最近这段怎么走」，不是「一共多少」。</li>
      <li>事件稀少到多数桶都空时慎用：满屏的 0 会把偶发尖峰衬得过重，先加宽桶或改用事件列表。</li>
      <li>需要按条数看「最近 N 笔」时不要硬改这张图：那是另一条口径，混在时间窗里横轴会骗人。</li>
    </ul>

    <h2>模型与交互</h2>
    <p>用 buildRealtimeWindow 生成 model，传入 now、windowMs、bucketMs；暂停时再加 paused 与 freezeAt。select 返回桶下标。各端接收同一个可序列化模型，折线在断流空档处断开、延迟文案与口径说明都来自共享逻辑。</p>
    <p>同一 id 后写覆盖前写；观测值为 null 的点不参与合计，也不把桶变成断流。空 ID、坏时间、坏值列为未计入。窗口时长必须能被桶宽整除。</p>
  </article>
</template>

<style scoped>
.realtime-demo { width: 100%; min-width: 0; }
.realtime-page p { max-width: 45em; }
.realtime-page li { max-width: 45em; }
.realtime-controls { display: flex; flex-wrap: wrap; gap: var(--i-spacing-2); margin-bottom: var(--i-spacing-4); }
.realtime-selection { margin-top: var(--i-spacing-3); color: var(--i-color-text-secondary); }
</style>
