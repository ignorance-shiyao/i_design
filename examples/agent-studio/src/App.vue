<script setup lang="ts">
/**
 * Agent 第一切片（astra.md 的 G08）：销售问题 → 工具结果 → 人类确认 → 产物。
 *
 * 这个示例要证明的是一件事：**四种结局走的是同一条管道，而且都能重放。**
 *
 * 成功、取消、失败、拒绝，在真实链路上只是同一串事件的不同结尾。示例里若把
 * 成功写成顺序代码、把失败写成 catch，演出来的失败与真实的失败不是一回事——
 * 真实的失败停在某个中间状态上，工具已经调过、钱已经查过，那些都还在屏幕上。
 * 所以这里四条分支都是 `RunEvent[]`，同一个 reducer（`logic/run.ts` 的 `replay`）
 * 折叠出状态，界面只渲染折叠结果。
 *
 * 重放按钮不是装饰：同一串事件喂进去两次，得到的必须是同一个屏幕。
 * 「乱序」与「断线重连」用共用层的 `planDelivery` 造出来——它们由 seed 决定，
 * 随机乱序的话失败复现不了，视觉快照每跑一次也不一样。
 */
import { computed, onUnmounted, ref } from 'vue'
import AppShell from '@i-design/examples-shell/AppShell.vue'
import {
  approvalGate,
  emptyRun,
  messageText,
  replay,
  type IconName,
  type RunEvent,
  type RunState
} from '@i-design/common'
import { planDelivery } from '@i-design/examples-shared'
import IRunStatus from '@i-design/vue-next/IRunStatus.vue'
import IChatMessage from '@i-design/vue-next/IChatMessage.vue'
import IChatToolCall from '@i-design/vue-next/IChatToolCall.vue'
import IApprovalCard from '@i-design/vue-next/IApprovalCard.vue'
import IArtifactWorkspace from '@i-design/vue-next/IArtifactWorkspace.vue'
import IButton from '@i-design/vue-next/IButton.vue'
import ISegmented from '@i-design/vue-next/ISegmented.vue'
import { OUTCOMES, QUOTE_VERSIONS, scriptFor, type Outcome } from './script'

const QUESTION = '明远制造想订 2000 件 PK-200，能给什么价？交期多久？'

const outcome = ref<Outcome>('success')
/** 投递方式：正常 / 乱序 / 断线重连。三种都由 seed 决定，重放得到同一结果 */
const delivery = ref<'normal' | 'shuffle' | 'reconnect'>('normal')
const state = ref<RunState>(emptyRun('conv-1', 'run-8842'))
const applied = ref(0)
/** 这一局的时间基准：真实的此刻。确定性由事件序列保证，不靠冻结时钟 */
const startedAt = ref(Date.now())
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined

const script = computed(() => scriptFor(outcome.value, startedAt.value))

/**
 * 实际投递顺序。乱序只在窗口内发生：真实网络不会把第 1 条排到第 90 条之后，
 * 窗口之外造出来的是一个不会发生的场景，测出来的结论也没用。
 */
const deliveries = computed(() => {
  const options = {
    seed: 20260318,
    shuffleWindow: delivery.value === 'shuffle' ? 3 : 0,
    dropAfter: delivery.value === 'reconnect' ? 5 : undefined
  }
  // 人确认之后才会产生后半段事件，乱序窗口不能跨过这道人类确认边界。
  // 否则先收到 resolved 就停泵，尚在队尾的 requested 永远没有机会显示。
  const boundary = script.value.findIndex((event) => event.type === 'approval.resolved')
  if (boundary < 0) return planDelivery(script.value, options)
  return [
    ...planDelivery(script.value.slice(0, boundary), options),
    ...planDelivery(script.value.slice(boundary), { ...options, dropAfter: undefined })
  ]
})

function stop() {
  if (timer !== undefined) clearInterval(timer)
  timer = undefined
}
onUnmounted(stop)

/**
 * 运行停在「等人确认」上，等人真的点一下。
 *
 * 一开始这里是一路播到底的，于是确认卡只在两条事件之间存在半秒——人根本来不及看，
 * 更别说点。那等于把这条切片最要紧的一步演成了一帧动画。
 *
 * 真实链路本来就是停在这儿的：模型不会替人做决定。所以播到 `approval.resolved`
 * 之前就停住，由人点了卡片再继续——脚本里那个决定是「这一局的结局」，
 * 点击只是把它触发出来。
 */
/*
 * 两个标志分工不同，别合成一个：
 *   waitingForHuman  现在是不是停着（界面上那句「等人点一下」看它）
 *   humanReleased    人已经点过了，别再停第二次
 * 合成一个的话，「放行」与「正在等待」会互为反面，人点完之后下一拍又满足
 * 暂停条件——运行永远停在原地。这个错我自己先犯了一次。
 */
const waitingForHuman = ref(false)
const humanReleased = ref(false)

function pump() {
  stop()
  const list = deliveries.value
  timer = setInterval(() => {
    if (applied.value >= list.length) {
      stop()
      return
    }
    const nextEvent = list[applied.value].event
    if (nextEvent.type === 'approval.resolved' && !humanReleased.value) {
      waitingForHuman.value = true
      stop()
      return
    }
    state.value = replay(state.value, [nextEvent])
    applied.value += 1
    now.value = Date.now()
  }, 260)
}

/** 重放：从空状态开始，按投递顺序逐条喂进去 */
function run() {
  stop()
  startedAt.value = Date.now()
  state.value = emptyRun('conv-1', 'run-8842')
  applied.value = 0
  waitingForHuman.value = false
  humanReleased.value = false
  pump()
}

/** 人点完之后接着播。脚本里的决定就是这一局选定的结局 */
function decide() {
  waitingForHuman.value = false
  humanReleased.value = true
  pump()
}
run()

const conversation = computed(() => state.value.conversation)
const answer = computed(() => {
  const message = conversation.value.messages.find((m) => m.role === 'assistant')
  return message ? messageText(message) : ''
})
const pendingApproval = computed(() =>
  conversation.value.approvals.find((a) => !a.decision)
)
const decidedApproval = computed(() =>
  conversation.value.approvals.find((a) => a.decision)
)
/** 确认卡的有效期判断走共用逻辑：版本失效压过过期，这条在示例里也要成立 */
const gate = computed(() =>
  pendingApproval.value
    ? approvalGate({ expiresAt: pendingApproval.value.expiresAt, now: now.value })
    : null
)

const artifacts = computed(() =>
  conversation.value.artifacts.map((artifact) => ({
    ...artifact,
    content: QUOTE_VERSIONS[artifact.version] ?? ''
  }))
)
const artifactVersion = ref<number | undefined>(undefined)
const adopted = ref<string[]>([])

/* 丢弃计数直接摆在界面上：「消息少了一段」的排查第一现场就是它 */
const dropped = computed(() => state.value.dropped)

const nav: { key: string; label: string; icon: IconName }[] = [
  { key: 'studio', label: 'Agent Studio', icon: 'sparkle' }
]
</script>

<template>
  <AppShell app-id="agent-studio" :nav="nav" current="studio" :crumbs="[{ label: 'Agent Studio' }]">
    <div class="studio">
      <section class="studio__console" aria-label="重放控制台">
        <div class="studio__row">
          <span class="studio__label">结局</span>
          <ISegmented
            :model-value="outcome"
            :options="OUTCOMES.map((o) => ({ value: o.value, label: o.label }))"
            @update:model-value="(v: string | number) => { outcome = v as Outcome; run() }"
          />
        </div>
        <div class="studio__row">
          <span class="studio__label">投递</span>
          <ISegmented
            :model-value="delivery"
            :options="[
              { value: 'normal', label: '正常' },
              { value: 'shuffle', label: '乱序' },
              { value: 'reconnect', label: '断线重连' }
            ]"
            @update:model-value="(v: string | number) => { delivery = v as 'normal' | 'shuffle' | 'reconnect'; run() }"
          />
        </div>
        <div class="studio__row">
          <IButton size="sm" variant="primary" @click="run">重放这一局</IButton>
          <span class="studio__hint">
            {{ OUTCOMES.find((o) => o.value === outcome)?.hint }}
            ——同一串事件喂进去两次，屏幕上得是同一个结果。
          </span>
        </div>
      </section>

      <section class="studio__thread" aria-label="对话">
        <!-- 正文走默认插槽，不是属性 -->
        <IChatMessage role="user">{{ QUESTION }}</IChatMessage>

        <!--
          工具调用排在回答**之前**：回答的依据要先摆出来。
          取消与失败的那两局里，这几张卡片照样留在屏幕上——
          失败不等于什么都没发生，已经查到的数据是有价值的。
        -->
        <IChatToolCall
          v-for="call in conversation.toolCalls"
          :key="call.id"
          :name="call.name"
          :status="call.status === 'succeeded' ? 'success' : call.status === 'failed' ? 'error' : 'running'"
          :args="call.input"
          :result="call.output"
          :error="call.error"
          summary="回答的依据"
        />

        <IChatMessage v-if="answer" role="assistant" name="销售助手">{{ answer }}</IChatMessage>

        <!-- 还没到终态时，说清楚现在停在哪一步，而不是一个转圈 -->
        <IRunStatus
          v-if="!['completed', 'failed', 'cancelled'].includes(conversation.status)"
          :status="conversation.status"
          :started-at="startedAt"
        />

        <p v-if="conversation.status === 'failed'" class="studio__failed">
          运行失败：{{ conversation.error }}
        </p>
        <p v-else-if="conversation.status === 'cancelled'" class="studio__cancelled">
          已取消。上面的工具结果与已经写出的那段正文都还在——取消不等于白跑一趟。
        </p>

        <!-- 人类确认：卡片上要看得见「确认的是哪一件事」，而不只是「确定吗」 -->
        <!--
          运行**停在这里等人**。一路播到底的话，这张卡只在两条事件之间存在半秒，
          人根本来不及看——而它恰恰是这条切片最要紧的一步。
        -->
        <template v-if="pendingApproval">
          <p class="studio__waiting">
            运行停在这里，等人点一下——模型不替人做决定。
          </p>
          <IApprovalCard
            :questions="[
              {
                id: pendingApproval.action,
                title: pendingApproval.summary,
                options: [
                  { value: 'send', label: '同意发出' },
                  { value: 'hold', label: '先不发' }
                ]
              }
            ]"
            :expires-at="pendingApproval.expiresAt"
            @complete="decide"
          />
        </template>
        <p v-if="gate && gate.state !== 'open'" class="studio__gate">
          这张确认卡已经{{ gate.state === 'expired' ? '过期' : '快过期' }}：{{ gate.detail }}
        </p>
        <p v-if="decidedApproval" class="studio__decided">
          人的决定：{{ decidedApproval.decision === 'approved' ? '同意发出' : '否掉了' }}
          （{{ decidedApproval.summary }}）
        </p>

        <!-- 产物：拒绝那一局不产出，屏幕上也就不该有这一块 -->
        <IArtifactWorkspace
          v-if="artifacts.length"
          v-model:version="artifactVersion"
          v-model:adopted="adopted"
          :artifacts="artifacts"
          artifact-id="quote"
        />
      </section>

      <p class="studio__meta">
        已投递 {{ applied }} / {{ deliveries.length }} 条事件
        <template v-if="dropped.length">
          ；丢弃 {{ dropped.length }} 条（{{ dropped.map((d) => d.reason).join('、') }}）——
          重复投递与乱序补齐都算在这里，它是「消息少了一段」的排查第一现场
        </template>
      </p>
    </div>
  </AppShell>
</template>

<style scoped>
.studio { display: grid; gap: var(--i-spacing-4); padding: var(--i-spacing-4); }
.studio__console {
  display: grid;
  gap: var(--i-spacing-3);
  padding: var(--i-spacing-3);
  border: 1px solid var(--i-color-hairline);
  border-radius: var(--i-radius-md);
  background: var(--i-color-bg-subtle);
}
.studio__row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--i-spacing-3); }
.studio__label { font-size: var(--i-font-size-sm); color: var(--i-color-text-secondary); min-width: 3em; }
.studio__hint { font-size: var(--i-font-size-sm); color: var(--i-color-text-tertiary); max-width: 45em; }
.studio__thread { display: grid; gap: var(--i-spacing-3); max-width: 45em; }
.studio__failed { margin: 0; color: var(--i-color-danger-text); font-size: var(--i-font-size-sm); }
.studio__cancelled,
.studio__waiting,
.studio__gate,
.studio__decided,
.studio__meta {
  margin: 0;
  color: var(--i-color-text-secondary);
  font-size: var(--i-font-size-sm);
  max-width: 45em;
}
</style>
