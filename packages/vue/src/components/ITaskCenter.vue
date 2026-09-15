<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ITaskCenter.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 异步任务中心（astra.md 的 B18）。
 *
 * 任务怎么跑、通知怎么发、点过去落到哪个页面，都在调用方手里——
 * 这个组件不碰任何 IO。它负责把三件事摆出来：
 *
 * - 每条任务的**任务号**与**影响的业务对象**（追踪行里逐条写着）；
 * - 角标只数「要人处理的」，因此它有归零的一天；
 * - 结束的任务给一个点得下去的出口，而不是一句「完成了」。
 *
 * 判断全在 logic/taskcenter.ts，五端共用一份。
 */
import { computed, ref } from 'vue'
import {
  isActive,
  markAllSeen,
  markSeen,
  taskBadge,
  taskNotice,
  taskOrder,
  taskTrail,
  type AsyncTaskItem,
  type IconName,
  type TaskState,
  type TaskTarget
} from '@i-design/common'
import IIcon from './IIcon.vue'
import IButton from './IButton.vue'
import ILoading from './ILoading.vue'

const props = withDefaults(
  defineProps<{
    tasks: AsyncTaskItem[]
    title?: string
    /** 把时间戳排成人话。放在调用方：时区是各端从系统拿的 */
    formatTime?: (ms: number) => string
    /** 默认展开追踪行。排查场景下把它打开 */
    showTrail?: boolean
  }>(),
  {
    title: '任务中心',
    formatTime: (ms: number) => new Date(ms).toLocaleString('zh-CN'),
    showTrail: false
  }
)

const emit = defineEmits<{ (e: 'open', target: TaskTarget, task: AsyncTaskItem): void; (e: 'inspect', task: AsyncTaskItem): void; (e: 'retry', task: AsyncTaskItem): void; (e: 'cancel', task: AsyncTaskItem): void; (e: 'update:tasks', a0: AsyncTaskItem[]): void }>()

const ordered = computed(() => taskOrder(props.tasks))
const badge = computed(() => taskBadge(props.tasks))

/* 状态图标同时给形状与文字：灰度打印下失败与完成是同一个灰 */
const icons: Record<TaskState, IconName> = {
  queued: 'clock',
  running: 'refresh',
  succeeded: 'check',
  failed: 'error-circle',
  cancelled: 'close'
}
const stateLabels: Record<TaskState, string> = {
  queued: '排队中',
  running: '进行中',
  succeeded: '已完成',
  failed: '失败',
  cancelled: '已取消'
}

const opened = ref<Set<string>>(new Set())
function toggleTrail(id: string) {
  const next = new Set(opened.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  opened.value = next
}
const trailOpen = (id: string) => props.showTrail || opened.value.has(id)

function onOpen(task: AsyncTaskItem) {
  // 看过了就从角标里去掉——「看过」不等于「处理完了」，失败的也照样标
  emit('update:tasks', markSeen(props.tasks, task.id))
  if (task.target) emit('open', task.target, task)
  else emit('inspect', task)
}
</script>

<template>
  <section class="i-task-center">
    <header class="i-task-center__head">
      <span class="i-task-center__title">{{ title }}</span>
      <!-- 角标只数要人处理的：把进行中的算进去，它永远回不到零 -->
      <span v-if="badge.count" class="i-task-center__badge">{{ badge.count }}</span>
      <span class="i-task-center__summary" role="status">{{ badge.text }}</span>
      <IButton v-if="badge.count" size="sm" @click="emit('update:tasks', markAllSeen(tasks))">
        全部标为已读
      </IButton>
    </header>

    <ul v-if="ordered.length" class="i-task-center__list">
      <li
        v-for="task in ordered"
        :key="task.id"
        class="i-task-center__item"
        :class="[`i-task-center__item--${task.state}`, { 'is-unseen': !isActive(task) && !task.seen }]"
      >
        <span class="i-task-center__icon">
          <ILoading v-if="task.state === 'running'" size="sm" />
          <IIcon v-else :name="icons[task.state]" :size="16" />
        </span>

        <div class="i-task-center__main">
          <div class="i-task-center__name">
            <span>{{ task.title }}</span>
            <!-- 状态文字与图标同时给：颜色不能是唯一线索 -->
            <span class="i-task-center__state">{{ stateLabels[task.state] }}</span>
          </div>
          <p class="i-task-center__detail">
            {{ taskNotice(task)?.description ?? (task.target ? `${task.target.kind}「${task.target.label}」` : `任务 ${task.id}`) }}
          </p>
        </div>

        <div class="i-task-center__actions">
          <IButton v-if="isActive(task)" size="sm" @click="emit('cancel', task)">取消</IButton>
          <template v-else>
            <IButton v-if="task.state === 'failed'" size="sm" @click="emit('retry', task)">
              重试
            </IButton>
            <!-- 出口永远有：没有业务对象时至少能去任务详情 -->
            <IButton size="sm" variant="primary" @click="onOpen(task)">
              {{ taskNotice(task)?.actionLabel ?? '查看任务详情' }}
            </IButton>
          </template>
          <IButton size="sm" :aria-expanded="String(trailOpen(task.id))" @click="toggleTrail(task.id)">
            {{ trailOpen(task.id) ? '收起' : '追踪' }}
          </IButton>
        </div>

        <!-- 追踪行：任务号排第一，用户打给客服时能报出来的只有它 -->
        <ul v-if="trailOpen(task.id)" class="i-task-center__trail">
          <li v-for="line in taskTrail(task, formatTime)" :key="line">{{ line }}</li>
        </ul>
      </li>
    </ul>

    <p v-else class="i-task-center__empty">还没有任务。导出、导入这类要跑一会儿的动作会出现在这里。</p>
  </section>
</template>
