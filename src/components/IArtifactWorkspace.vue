<script setup lang="ts">
import { computed } from 'vue'
import { artifactAdoptableIds, artifactPayload, artifactPreview, artifactVersionDiff, openArtifact, toggleArtifactAdoption, type ArtifactRevision } from '@i-design/common'
import IButton from './IButton.vue'
import ITag from './ITag.vue'

const props = withDefaults(defineProps<{
  artifacts: ArtifactRevision[]
  artifactId: string
  version?: number
  adopted?: string[]
  title?: string
}>(), { version: undefined, adopted: () => [], title: '产物工作区' })
const emit = defineEmits<{ 'update:version': [number]; 'update:adopted': [string[]]; download: [ArtifactRevision] }>()
const workspace = computed(() => openArtifact(props.artifacts, props.artifactId, props.version, props.adopted))
const preview = computed(() => artifactPreview(workspace.value.current))
const payload = computed(() => artifactPayload(workspace.value.current))
const versionDiff = computed(() => artifactVersionDiff(props.artifacts, props.artifactId, workspace.value.current?.version))
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
    <p v-if="versionDiff.previous" class="i-artifact-workspace__diff">
      相比 v{{ versionDiff.previous.version }}：{{ versionDiff.changes.length ? versionDiff.changes.map((item) => ({ content: '正文', payload: '结构数据', items: '采纳项' })[item]).join('、') + '已变更' : '内容未变更' }}
    </p>
    <footer v-if="ids.length" class="i-artifact-workspace__foot">
      <span>{{ adopted.length ? `已采纳 ${adopted.length} 项` : '尚未采纳' }}</span>
      <IButton v-for="id in ids" :key="id" size="sm" :variant="adopted.includes(id) ? 'secondary' : 'primary'" @click="toggle(id)">{{ adopted.includes(id) ? '撤销采纳' : '采纳' }}</IButton>
    </footer>
  </section>
</template>
