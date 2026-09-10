<script setup lang="ts">
import { computed, ref } from 'vue'
import { summarizeTasks, type AgentTask } from '@i-design/common'
import IIcon from './IIcon.vue'
import ILoading from './ILoading.vue'

const props = withDefaults(
  defineProps<{
    tasks: AgentTask[]
    /** 胶囊适合稀疏展示，列表适合密集场景 */
    variant?: 'capsule' | 'list'
    /** 显示底部的完成计数 */
    showSummary?: boolean
  }>(),
  { variant: 'capsule', showSummary: true }
)

const emit = defineEmits<{ select: [task: AgentTask] }>()
const opened = ref<Set<string>>(new Set())
const summary = computed(() => summarizeTasks(props.tasks))

function toggle(task: AgentTask) {
  if (!task.detail) {
    emit('select', task)
    return
  }
  const next = new Set(opened.value)
  if (next.has(task.id)) next.delete(task.id)
  else next.add(task.id)
  opened.value = next
  emit('select', task)
}
</script>

<template>
  <div class="i-tasks" :class="`i-tasks--${variant}`">
    <div v-for="task in tasks" :key="task.id">
      <div
        class="i-task"
        :class="`is-${task.status}`"
        role="button"
        :tabindex="0"
        :aria-expanded="task.detail ? opened.has(task.id) : undefined"
        @click="toggle(task)"
        @keydown.enter.prevent="toggle(task)"
      >
        <!--
          状态标记同时用形状与颜色：完成是勾、失败是叹号、进行中是转圈、
          待办是序号。只靠颜色的话，灰绿两色在灰度打印下分不出来。
        -->
        <span class="i-task__mark">
          <IIcon v-if="task.status === 'completed'" name="check" :size="13" :stroke-width="2.6" />
          <IIcon v-else-if="task.status === 'failed'" name="close" :size="13" :stroke-width="2.6" />
          <ILoading v-else-if="task.status === 'running'" size="sm" />
          <template v-else>{{ task.step ?? '' }}</template>
        </span>

        <span class="i-task__title">{{ task.title }}</span>
        <span v-if="task.meta" class="i-task__meta">{{ task.meta }}</span>
        <IIcon
          v-if="task.detail"
          class="i-task__arrow"
          :class="{ 'is-open': opened.has(task.id) }"
          name="chevron-right"
          :size="14"
        />
      </div>

      <p v-if="task.detail && opened.has(task.id)" class="i-task__detail">{{ task.detail }}</p>
    </div>

    <p v-if="showSummary && tasks.length" class="i-tasks__summary">
      {{ summary.completed }} / {{ summary.total }} 已完成<template v-if="summary.failed">
        · {{ summary.failed }} 项失败</template
      ><template v-if="summary.running"> · {{ summary.running }} 项进行中</template>
    </p>
  </div>
</template>
