<script setup lang="ts">
/**
 * 评论线程与活动记录（astra.md 的 B14）。
 *
 * 人说的话与系统记的账按时间穿插在一条时间轴上——分成两个标签页的话，
 * 读者永远拼不出「当时到底发生了什么」。
 *
 * 这个组件不碰任何 IO：发送、删除、重发都交给调用方。它负责摆出四件事：
 * 删掉的父评论留下的那个坑、钉死不动的未读分隔线、编辑痕迹、发失败那条的原文。
 *
 * 判断全在 logic/thread.ts，五端共用一份。
 */
import { computed, ref, watch } from 'vue'
import {
  DELETED_BODY,
  editNote,
  keepDivider,
  readUpTo,
  threadItems,
  unreadState,
  type ThreadComment,
  type ThreadEntry,
  type ThreadNode,
  type UnreadState
} from '@i-design/common'
import IIcon from './IIcon.vue'
import IButton from './IButton.vue'
import IAvatar from './IAvatar.vue'

const props = withDefaults(
  defineProps<{
    entries: ThreadEntry[]
    /** 我是谁。自己说的话不算未读 */
    meId?: string
    /** 上次读到哪个时刻 */
    lastReadAt?: number
    /** 把时间戳排成人话。时区是各端从系统拿的，因此留在调用方 */
    formatTime?: (ms: number) => string
  }>(),
  {
    meId: '',
    lastReadAt: 0,
    formatTime: (ms: number) => new Date(ms).toLocaleString('zh-CN')
  }
)

const emit = defineEmits<{
  reply: [comment: ThreadComment]
  retry: [comment: ThreadComment]
  discard: [comment: ThreadComment]
  /** 用户点了「跳到第一条新消息」 */
  jump: [id: string]
  /** 全都读完了。参数是新的 lastReadAt */
  read: [lastReadAt: number]
}>()

const items = computed(() => threadItems(props.entries))

/*
 * 未读分隔线在打开的那一刻钉死。
 *
 * 之后 entries 变了只更新计数，不挪分隔线——它跟着往下跑的话，
 * 用户正读到一半，那条线就从他上方溜到了下方，他再也找不到读到哪儿了。
 */
const unread = ref<UnreadState>(unreadState(props.entries, props.lastReadAt, props.meId))
watch(
  () => props.entries,
  (next) => {
    unread.value = keepDivider(unread.value, next, props.lastReadAt, props.meId)
  },
  { deep: true }
)

const flatNodes = (node: ThreadNode): ThreadNode[] => [node, ...node.replies.flatMap(flatNodes)]
const noteOf = (comment: ThreadComment) => editNote(comment, props.formatTime)
</script>

<template>
  <section class="i-thread">
    <div v-if="unread.count" class="i-thread__bar" role="status">
      <span class="i-thread__bar-text">{{ unread.text }}</span>
      <IButton v-if="unread.dividerId" size="sm" @click="emit('jump', unread.dividerId)">
        跳到第一条
      </IButton>
      <IButton size="sm" @click="emit('read', readUpTo(entries, lastReadAt))">
        全部标为已读
      </IButton>
    </div>

    <template v-for="item in items" :key="item.kind === 'comment' ? item.node.comment.id : item.activities[0].id">
      <!-- 连续的活动记录折成一组：逐条铺开会把人说的话淹掉 -->
      <div v-if="item.kind === 'activity'" class="i-thread__activity">
        <template v-if="unread.dividerId === item.activities[0].id">
          <div class="i-thread__divider">{{ unread.text }}</div>
        </template>
        <span class="i-thread__activity-icon"><IIcon name="history" :size="12" /></span>
        <div>
          <span>{{ item.summary }}</span>
          <ul v-if="item.activities.length > 1" class="i-thread__activity-list">
            <li v-for="activity in item.activities" :key="activity.id">{{ activity.change }}</li>
          </ul>
        </div>
      </div>

      <template v-else>
        <div v-for="node in flatNodes(item.node)" :key="node.comment.id" :class="{ 'i-thread__replies': !!node.comment.parentId }">
          <!-- 分隔线钉在它打开时算出的那一条之前，之后不再移动 -->
          <div v-if="unread.dividerId === node.comment.id" class="i-thread__divider">
            {{ unread.text }}
          </div>

          <!-- 删掉但底下还有回复：留一个坑，否则那几句「同意」挂在空气里 -->
          <p v-if="node.tombstone" class="i-thread__tombstone">{{ DELETED_BODY }}</p>
          <article v-else class="i-comment" :class="{ 'i-comment--reply': !!node.comment.parentId }">
            <div class="i-comment__avatar">
              <IAvatar :name="node.comment.authorName" :size="node.comment.parentId ? 'sm' : 'md'" />
            </div>
            <div class="i-comment__main">
              <header class="i-comment__head">
                <span class="i-comment__author">{{ node.comment.authorName }}</span>
                <span class="i-comment__time">{{ formatTime(node.comment.createdAt) }}</span>
                <!-- 编辑过就看得见：一句话被改了意思，读者不该毫无察觉 -->
                <span v-if="noteOf(node.comment)" class="i-thread__edited">
                  {{ noteOf(node.comment) }}
                </span>
                <span v-if="node.comment.sendState === 'sending'" class="i-thread__send">
                  <IIcon name="clock" :size="11" />发送中
                </span>
                <span
                  v-else-if="node.comment.sendState === 'failed'"
                  class="i-thread__send i-thread__send--failed"
                >
                  <IIcon name="error-circle" :size="11" />
                  发送失败：{{ node.comment.sendError || '网络没连上' }}
                </span>
              </header>

              <div class="i-comment__content">{{ node.comment.body }}</div>

              <!-- 失败那条的原文还在，动作摆在旁边：悄悄丢掉是最糟的 -->
              <div v-if="node.comment.sendState === 'failed'" class="i-thread__failed-actions">
                <IButton size="sm" variant="primary" @click="emit('retry', node.comment)">重发</IButton>
                <IButton size="sm" @click="emit('discard', node.comment)">放弃这条</IButton>
              </div>
              <div v-else-if="!node.comment.sendState" class="i-comment__actions">
                <IButton size="sm" @click="emit('reply', node.comment)">回复</IButton>
              </div>
            </div>
          </article>
        </div>
      </template>
    </template>

    <p v-if="!items.length" class="i-thread__empty">还没有评论。第一条通常是把背景说清楚。</p>
  </section>
</template>
