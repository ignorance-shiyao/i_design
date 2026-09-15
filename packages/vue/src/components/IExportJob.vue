<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IExportJob.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
/**
 * 导出任务卡（astra.md 的 B11 后半）。
 *
 * 任务怎么排队、文件怎么生成、下载走哪个地址，都在调用方手里——
 * 这个组件不碰任何 IO，它只负责把「现在到哪一步、还能做什么」说清楚。
 *
 * 两条规矩落在版面上：进度条只在总数已知时出现（假进度条是谎）；
 * 出处永远在（什么时候、按哪套筛选、哪些列、多少行），它不是可选的补充说明，
 * 是这份文件能不能拿去对账的前提。
 *
 * 判断全在 logic/exportjob.ts，五端共用一份。
 */
import { computed } from 'vue'
import {
  describeExport,
  exportFileName,
  exportProvenance,
  type ExportMeta,
  type ExportStatus,
  type IconName
} from '@i-design/common'
import IIcon from './IIcon.vue'
import IButton from './IButton.vue'

const props = withDefaults(
  defineProps<{
    status?: ExportStatus
    /** 队列里前面还有几个 */
    queuePosition?: number
    processed?: number
    /** 总行数。**不知道就不要给**——给一个猜的数就成了假进度条 */
    total?: number
    /** 文件的过期时刻（毫秒时间戳） */
    expiresAt?: number
    error?: string
    /** 这份导出的出处。永远显示 */
    meta?: ExportMeta
    /** 当前时间，受控——好让演示与测试给得出确定的值 */
    now?: number
  }>(),
  {
    status: 'queued',
    queuePosition: undefined,
    processed: undefined,
    total: undefined,
    expiresAt: undefined,
    error: '',
    meta: undefined,
    now: undefined
  }
)

const emit = defineEmits<{ (e: 'cancel'): void; (e: 'download', fileName: string): void; (e: 'regenerate'): void; (e: 'retry'): void }>()

const view = computed(() =>
  describeExport({
    status: props.status,
    queuePosition: props.queuePosition,
    processed: props.processed,
    total: props.total,
    expiresAt: props.expiresAt,
    error: props.error,
    now: props.now ?? Date.now()
  })
)

/* 图标名用图标表的类型：写错一个名字界面上是个空位，不会有任何报错 */
const icons: Record<ExportStatus, IconName> = {
  queued: 'clock',
  running: 'refresh',
  ready: 'download',
  expired: 'history',
  failed: 'error-circle',
  cancelled: 'close'
}

const provenance = computed(() => (props.meta ? exportProvenance(props.meta) : []))
const fileName = computed(() => (props.meta ? exportFileName(props.meta) : ''))
</script>

<template>
  <section class="i-export-job" :class="`i-export-job--${view.tone}`" role="status">
    <div class="i-export-job__head">
      <span class="i-export-job__icon">
        <IIcon :name="icons[view.status]" :size="16" />
      </span>
      <span class="i-export-job__text">
        <span class="i-export-job__label">{{ view.label }}</span>
        <span class="i-export-job__detail">{{ view.detail }}</span>
      </span>
      <span class="i-export-job__actions">
        <IButton v-if="view.action === 'cancel'" size="sm" @click="emit('cancel')">取消</IButton>
        <IButton
          v-else-if="view.action === 'download'"
          size="sm"
          variant="primary"
          @click="emit('download', fileName)"
        >
          下载
        </IButton>
        <IButton
          v-else-if="view.action === 'regenerate'"
          size="sm"
          @click="emit('regenerate')"
        >
          重新生成
        </IButton>
        <IButton v-else-if="view.action === 'retry'" size="sm" @click="emit('retry')">
          重试
        </IButton>
      </span>
    </div>

    <!-- 总数未知时这里什么也不画：走到 90% 就卡住的条子比没有条子更让人不敢离开 -->
    <div
      v-if="view.percent !== null"
      class="i-export-job__bar"
      role="progressbar"
      :aria-valuenow="view.percent"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="`${view.label}，${view.detail}`"
    >
      <div class="i-export-job__bar-fill" :style="{ width: `${view.percent}%` }" />
    </div>

    <!-- 出处永远在：它是这份文件能不能拿去对账的前提 -->
    <ul v-if="provenance.length" class="i-export-job__provenance">
      <li v-for="line in provenance" :key="line">{{ line }}</li>
      <li v-if="fileName" class="i-export-job__file">{{ fileName }}</li>
    </ul>
  </section>
</template>
