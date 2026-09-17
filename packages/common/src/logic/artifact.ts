/**
 * 智能体产物工作区的共享判断（astra.md F10）。
 *
 * 产物是运行结果，不是聊天气泡里的附件：同一份产物可能被重生多次，用户必须能
 * 回看版本、逐项采纳并撤销。生成内容一律按数据预览，绝不作为宿主 HTML / 脚本执行。
 */
import type { Artifact } from '../contracts/run'

export interface ArtifactRevision extends Artifact {
  /** 已脱敏的预览数据；document / code 只作为纯文本渲染 */
  content?: string
  /** 可逐项采纳的稳定 id；未传时整份产物只能整体采纳 */
  itemIds?: readonly string[]
  /** 表格与图表走结构化数据，不把未经处理的 HTML 交给任一端执行。 */
  payload?: ArtifactPayload
}

export type ArtifactPayload =
  | { kind: 'table'; columns: readonly string[]; rows: readonly (readonly string[])[] }
  | { kind: 'chart'; points: readonly { label: string; value: number }[] }

export interface ArtifactWorkspace {
  current?: ArtifactRevision
  revisions: ArtifactRevision[]
  /** 当前版本已经采纳的项；切版本时不借用另一个版本的选择 */
  adopted: string[]
}

/** 同一产物只展示一个版本序列，最新版本在前；旧版仍可回看，不能被悄悄覆盖。 */
export function artifactVersions(
  artifacts: readonly ArtifactRevision[],
  artifactId: string
): ArtifactRevision[] {
  return artifacts
    .filter((artifact) => artifact.id === artifactId)
    .slice()
    .sort((a, b) => b.version - a.version || b.createdAt - a.createdAt)
}

/** 打开一个版本时，采纳集合只能保留该版本声明过的项，避免撤销错误版本的内容。 */
export function openArtifact(
  artifacts: readonly ArtifactRevision[],
  artifactId: string,
  version?: number,
  adopted: Iterable<string> = []
): ArtifactWorkspace {
  const revisions = artifactVersions(artifacts, artifactId)
  const current = version === undefined ? revisions[0] : revisions.find((item) => item.version === version)
  // 未拆项时的整体采纳 key 也必须能在受控重渲染后保留；不能只在按钮点击时认它。
  const allowed = new Set(artifactAdoptableIds(current))
  return {
    current,
    revisions,
    adopted: [...new Set(adopted)].filter((id) => allowed.has(id))
  }
}

/** 没有逐项 id 的产物用自身 id 表示「整份采纳」，保证撤销也能精确定位。 */
export function artifactAdoptableIds(artifact?: ArtifactRevision): string[] {
  if (!artifact) return []
  return artifact.itemIds?.length ? [...artifact.itemIds] : [`${artifact.id}@${artifact.version}`]
}

/** 采纳和撤销走同一条切换逻辑，重复点击不会出现两次相同的采纳记录。 */
export function toggleArtifactAdoption(
  artifact: ArtifactRevision | undefined,
  adopted: Iterable<string>,
  id: string
): string[] {
  const allowed = new Set(artifactAdoptableIds(artifact))
  const next = new Set(adopted)
  if (!allowed.has(id)) return [...next]
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return [...next]
}

export interface ArtifactPreview {
  mode: 'text' | 'table' | 'chart' | 'file'
  /** HTML 永远是 false：即便文档内容看起来像 HTML，也只作为文本显示 */
  executable: false
  label: string
}

export interface ArtifactVersionDiff {
  current?: ArtifactRevision
  previous?: ArtifactRevision
  /** 当前版本相对紧邻旧版改变的维度；无旧版时不给假差异。 */
  changes: ('content' | 'payload' | 'items')[]
}

/**
 * 版本差异始终只与紧邻旧版比，不能拿 v3 直接同 v1 比却把 v2 的变更误写进来。
 * 具体绘制由各端负责；这里给出确定的比较对象和变更维度。
 */
export function artifactVersionDiff(
  artifacts: readonly ArtifactRevision[],
  artifactId: string,
  version?: number
): ArtifactVersionDiff {
  const revisions = artifactVersions(artifacts, artifactId)
  const current = version === undefined ? revisions[0] : revisions.find((item) => item.version === version)
  const index = current ? revisions.indexOf(current) : -1
  const previous = index >= 0 ? revisions[index + 1] : undefined
  if (!current || !previous) return { current, previous, changes: [] }
  const changes: ArtifactVersionDiff['changes'] = []
  if (current.content !== previous.content) changes.push('content')
  if (JSON.stringify(current.payload) !== JSON.stringify(previous.payload)) changes.push('payload')
  if (JSON.stringify(current.itemIds ?? []) !== JSON.stringify(previous.itemIds ?? [])) changes.push('items')
  return { current, previous, changes }
}

export function artifactPreview(artifact?: ArtifactRevision): ArtifactPreview {
  const kind = artifact?.kind ?? 'file'
  const mode = kind === 'document' || kind === 'code' ? 'text' : kind
  const labels: Record<ArtifactPreview['mode'], string> = {
    text: kind === 'code' ? '代码预览（只读）' : '文档预览（只读）',
    table: '表格预览（只读）',
    chart: '图表预览（只读）',
    file: '文件信息'
  }
  return { mode, executable: false, label: labels[mode] }
}

/** 结构化预览也要先限在产物种类内：表格不能伪装成图表，反之亦然。 */
export function artifactPayload(artifact?: ArtifactRevision): ArtifactPayload | undefined {
  const payload = artifact?.payload
  return payload?.kind === artifact?.kind ? payload : undefined
}
