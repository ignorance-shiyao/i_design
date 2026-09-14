<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChatList.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 会话列表：多轮会话的切换与管理。
 *
 * 攒到几十条之后，列表本身就成了一个要解决的问题。三个决定写在这里：
 *
 * **按时间分组，而不是一条长列表。** 「今天」「昨天」「最近 7 天」「更早」
 * 四档就够——再细分，读者得先读组标题才知道自己在看哪一段。
 *
 * **标题为空时用摘要顶上。** 智能体还没来得及给会话起名时标题是空的，
 * 此时显示一片空白，用户会以为这条会话坏了。
 *
 * **删掉当前这条之后选它的后一条。** 跳回第一条是最省事的写法，也是最坏的：
 * 用户正在看列表中段，删一条就被弹回顶部，他得重新找位置。
 */
import { computed, ref } from 'vue'
import IIcon from './IIcon.vue'
import IInput from './IInput.vue'
import IEmpty from './IEmpty.vue'
import {
  accessReasonOf,
  canOpenSession,
  filterSessions,
  groupSessions,
  moveActiveSession,
  nextAfterDelete,
  sessionTitle,
  visibleSessions,
  type ChatSession
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    sessions: ChatSession[]
    /** 当前选中的会话 id（用 v-model:active 控制） */
    active?: string
    /** 会话多了才需要搜索框；少几条时那个框只是占地方 */
    searchable?: boolean
    /** 超过这个条数自动显示搜索框 */
    searchAfter?: number
    /** 看未归档的还是已归档的。两个视图互不包含 */
    view?: 'active' | 'archived'
  }>(),
  { active: '', searchable: undefined, searchAfter: 8, view: 'active' }
)

const emit = defineEmits<{ (e: 'update:active', id: string): void; (e: 'create'): void; (e: 'remove', id: string): void; (e: 'pin', id: string): void; (e: 'archive', id: string, archived: boolean): void }>()

const query = ref('')

const showSearch = computed(() =>
  props.searchable ?? props.sessions.length > props.searchAfter
)

/* 先按视图分，再按关键词过滤：搜索不该把归档的会话搜出来混在里面 */
const shown = computed(() => filterSessions(visibleSessions(props.sessions, props.view), query.value))
/* 分组的「现在」每次求值都取一次：跨过零点之后「今天」得变成「昨天」 */
const groups = computed(() => groupSessions(shown.value, Date.now()))

function onKey(event: KeyboardEvent) {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  event.preventDefault()
  emit('update:active', moveActiveSession(groups.value, props.active, event.key === 'ArrowDown' ? 1 : -1))
}

function remove(session: ChatSession) {
  // 先算好接下来选谁，再把删除抛出去：抛出去之后列表已经变了，算不准了。
  // 传的是分好组的列表——「后一条」说的是用户看到的下一条，不是数组里的下一个
  const next = nextAfterDelete(groups.value, session.id, props.active)
  emit('remove', session.id)
  if (next !== props.active) emit('update:active', next)
}
</script>

<template>
  <nav class="i-chatlist" aria-label="会话列表">
    <div class="i-chatlist__head">
      <button class="i-chatlist__new" type="button" @click="emit('create')">
        <IIcon name="plus" :size="14" />
        新会话
      </button>
    </div>

    <div v-if="showSearch" class="i-chatlist__search">
      <IInput v-model="query" placeholder="搜索会话" clearable aria-label="搜索会话" />
    </div>

    <!-- 列表本身可聚焦：上下键要在整份列表上生效，而不是逐个 Tab 过去 -->
    <div class="i-chatlist__body" tabindex="0" @keydown="onKey">
      <template v-for="group in groups" :key="group.key">
        <!-- 空组不渲染组标题：一条也没有的组标题只是在占地方 -->
        <h4 class="i-chatlist__group">{{ group.label }}</h4>
        <div
          v-for="session in group.sessions"
          :key="session.id"
          class="i-chatlist__item"
          :class="{ 'is-active': session.id === active }"
        >
          <!--
            切换会话的按钮就是标题本身，而不是整行套一个 role="button"：
            套在外面的话，里面那两个操作按钮就成了嵌套的交互控件，
            读屏软件读不清「现在焦点在哪一个」——axe 的 nested-interactive 实测报过。
          -->
          <button
            class="i-chatlist__pick"
            type="button"
            :aria-current="session.id === active ? 'true' : undefined"
            :disabled="!canOpenSession(session)"
            @click="emit('update:active', session.id)"
          >
            <IIcon v-if="session.pinned" class="i-chatlist__pin" name="pin" :size="12" />
            <span class="i-chatlist__title">{{ sessionTitle(session) }}</span>
            <!--
              打不开的原因要写出来，而且要分清「没权限」与「已失效」：
              都笼统显示成打不开的话，用户会一直重试一条永远打不开的会话。
            -->
            <span v-if="accessReasonOf(session)" class="i-chatlist__reason">
              <IIcon :name="session.access === 'forbidden' ? 'lock' : 'history'" :size="12" />
              {{ accessReasonOf(session) }}
            </span>
          </button>
          <span class="i-chatlist__actions">
            <button
              class="i-chatlist__action"
              type="button"
              :aria-label="`${session.pinned ? '取消置顶' : '置顶'}${sessionTitle(session)}`"
              @click.stop="emit('pin', session.id)"
            >
              <IIcon name="pin" :size="12" />
            </button>
            <button
              class="i-chatlist__action"
              type="button"
              :aria-label="`${session.archived ? '取消归档' : '归档'}${sessionTitle(session)}`"
              @click.stop="emit('archive', session.id, !session.archived)"
            >
              <IIcon :name="session.archived ? 'undo' : 'box'" :size="12" />
            </button>
            <button
              class="i-chatlist__action"
              type="button"
              :aria-label="`删除 ${sessionTitle(session)}`"
              @click.stop="remove(session)"
            >
              <IIcon name="trash" :size="12" />
            </button>
          </span>
        </div>
      </template>

      <!-- 搜不到时说清楚是搜不到，而不是让列表空着——空着看起来像会话全没了 -->
      <IEmpty
        v-if="!groups.length"
        :title="query ? `没有匹配「${query}」的会话` : '还没有会话'"
        description=" "
      />
    </div>
  </nav>
</template>
