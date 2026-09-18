<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IArtifactWorkspace.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { artifactAdoptableIds, artifactContentDiff, artifactPayload, artifactPreview, openArtifact, toggleArtifactAdoption, type ArtifactRevision } from '@i-design/common'
import IButton from './IButton.vue'
import ITag from './ITag.vue'
import ICodeBlock from './ICodeBlock.vue'

const props = withDefaults(defineProps<{
  artifacts: ArtifactRevision[]
  artifactId: string
  version?: number
  adopted?: string[]
  title?: string
}>(), { version: undefined, adopted: () => [], title: '产物工作区' })
const emit = defineEmits<{ (e: 'update:version', a0: number): void; (e: 'update:adopted', a0: string[]): void; (e: 'download', a0: ArtifactRevision): void }>()
const workspace = computed(() => openArtifact(props.artifacts, props.artifactId, props.version, props.adopted))
const preview = computed(() => artifactPreview(workspace.value.current))
const payload = computed(() => artifactPayload(workspace.value.current))
/*
 * 差异不止说「变了」，还要说清改了哪几行——一句「内容有变化」等于没说：
 * 用户要么逐字重读一遍，要么干脆不看，而产物工作区存在的理由恰恰是让人能复核。
 */
const versionDiff = computed(() =>
  artifactContentDiff(props.artifacts, props.artifactId, workspace.value.current?.version)
)
/* 逐行视图直接复用 ICodeBlock：它已经有前后行号与 +/− 号（不靠颜色单独表意）。
   另写一套的话，同一段改动在代码块里与在产物里会显示成两个样子。 */
const showLines = computed(
  () => versionDiff.value.mode === 'lines' && versionDiff.value.added + versionDiff.value.removed > 0
)
const ids = computed(() => artifactAdoptableIds(workspace.value.current))
function select(version: number) { emit('update:version', version) }
function toggle(id: string) { emit('update:adopted', toggleArtifactAdoption(workspace.value.current, props.adopted, id)) }
</script>

<template>
  <section class="i-artifact-workspace" :aria-label="title">
    <header class="i-artifact-workspace__head">
      <div><h3>{{ workspace.current?.title ?? title }}</h3><span>{{ preview.label }}</span></div>
      <IButton v-if="workspace.current" size="sm" @click="emit('download', workspace.current)">导出</IButton>
    </header>
    <div v-if="workspace.revisions.length > 1" class="i-artifact-workspace__versions" aria-label="产物版本">
      <button v-for="item in workspace.revisions" :key="item.version" type="button" :class="{ 'is-active': item.version === workspace.current?.version }" @click="select(item.version)">v{{ item.version }}</button>
    </div>
    <div v-if="workspace.current" class="i-artifact-workspace__preview">
      <ITag type="default">{{ workspace.current.kind }}</ITag>
      <pre v-if="preview.mode === 'text'">{{ workspace.current.content ?? '此版本未提供正文预览。' }}</pre>
      <table v-else-if="payload?.kind === 'table'" class="i-artifact-workspace__table">
        <thead><tr><th v-for="column in payload.columns" :key="column">{{ column }}</th></tr></thead>
        <tbody><tr v-for="(row, index) in payload.rows" :key="index"><td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td></tr></tbody>
      </table>
      <div v-else-if="payload?.kind === 'chart'" class="i-artifact-workspace__chart" aria-label="图表预览">
        <div v-for="point in payload.points" :key="point.label" class="i-artifact-workspace__bar"><span>{{ point.label }}</span><i :style="{ width: `${Math.max(0, Math.min(100, point.value))}%` }" /><b>{{ point.value }}</b></div>
      </div>
      <p v-else>{{ workspace.current.meta?.summary ?? '此版本可作为结构化结果查看或导出。' }}</p>
    </div>
    <!-- 任何情况下都有话可说：比不了也说清为什么，不会只剩一块空白 -->
    <p class="i-artifact-workspace__diff">{{ versionDiff.summary }}</p>
    <div v-if="showLines" class="i-artifact-workspace__diff-lines">
      <ICodeBlock
        :code="versionDiff.current?.content ?? ''"
        :before="versionDiff.previous?.content ?? ''"
        :filename="`v${versionDiff.previous?.version} → v${versionDiff.current?.version}`"
        :copyable="false"
        :max-lines="14"
      />
    </div>
    <footer v-if="ids.length" class="i-artifact-workspace__foot">
      <span>{{ adopted.length ? `已采纳 ${adopted.length} 项` : '尚未采纳' }}</span>
      <IButton v-for="id in ids" :key="id" size="sm" :variant="adopted.includes(id) ? 'secondary' : 'primary'" @click="toggle(id)">{{ adopted.includes(id) ? '撤销采纳' : '采纳' }}</IButton>
    </footer>
  </section>
</template>
