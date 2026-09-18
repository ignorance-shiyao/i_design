/**
 * 智能体产物工作区的共享判断（astra.md F10）。
 *
 * 产物是运行结果，不是聊天气泡里的附件：同一份产物可能被重生多次，用户必须能
 * 回看版本、逐项采纳并撤销。生成内容一律按数据预览，绝不作为宿主 HTML / 脚本执行。
 */
import type { Artifact } from '../contracts/run'
import { diffLines, diffStat, type DiffLine } from './diff'

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

/* ---------- 具体改了哪几行 ---------- */

export type DiffMode =
  /** 文本产物：逐行比 */
  | 'lines'
  /** 结构化产物：只报规模变化，不假装做单元格级比对 */
  | 'summary'
  /** 比不了：没有旧版，或者两版根本不是同一种东西 */
  | 'none'

export interface ArtifactContentDiff {
  current?: ArtifactRevision
  previous?: ArtifactRevision
  mode: DiffMode
  /** mode 为 lines 时才有内容 */
  lines: DiffLine[]
  added: number
  removed: number
  /** 摆给用户看的那一句。任何 mode 下都有话可说，不会只剩一个空白区域 */
  summary: string
}

/** 结构化产物的规模：表格数行、图表数点。用来说「从 3 行变成 5 行」 */
function payloadSize(artifact: ArtifactRevision): number | null {
  const payload = artifact.payload
  if (!payload) return null
  return payload.kind === 'table' ? payload.rows.length : payload.points.length
}

/**
 * 相对紧邻旧版，具体改了哪几行。
 *
 * 这一层补的是「只说 content 变了，看不见改了什么」那个缺口——
 * 一句「内容有变化」等于没说：用户要么逐字重读一遍，要么干脆不看，
 * 而产物工作区存在的理由恰恰是**让人能复核**。
 *
 * 三条边界：
 *
 * **一、只跟紧邻旧版比。** 与 `artifactVersionDiff` 同一条规矩：v3 直接同 v1 比，
 * 会把 v2 的改动算到 v3 头上，读者据此去问「谁改的」，问到的是错的人。
 *
 * **二、两版不是同一种东西就不逐行比。** 上一版是表格、这一版是文档，
 * 硬拿两段文本比出来的加减行毫无意义——如实说「产物类型变了」，
 * 让人去整份重看，比给一堆假的行号诚实。
 *
 * **三、结构化产物不假装做单元格级比对。** 表格与图表只报规模变化
 * （从 3 行变成 5 行）。做到单元格级需要稳定的行标识，而产物是重新生成的，
 * 行与行之间没有可靠的对应关系——按位置对齐会把「中间插了一行」说成
 * 「后面每一行都变了」，那正是 `diff.ts` 里用 LCS 而不是逐行对齐要避开的事。
 *
 * 行级比对复用 `diff.ts` 的 `diffLines`：同一段改动在代码块里与在产物里
 * 必须给出同一个结果，各写一份迟早会差出几行。
 */
export function artifactContentDiff(
  artifacts: readonly ArtifactRevision[],
  artifactId: string,
  version?: number
): ArtifactContentDiff {
  const { current, previous } = artifactVersionDiff(artifacts, artifactId, version)
  const empty = { current, previous, lines: [] as DiffLine[], added: 0, removed: 0 }

  if (!current || !previous) {
    return { ...empty, mode: 'none', summary: current ? '这是最早的一版，没有可比对的旧版' : '没有可比对的版本' }
  }

  if (current.kind !== previous.kind) {
    return {
      ...empty,
      mode: 'none',
      summary: `产物类型从「${previous.kind}」变成了「${current.kind}」，两版无法逐行比较，请整份重看`
    }
  }

  const isText = current.kind === 'document' || current.kind === 'code'
  if (!isText) {
    const before = payloadSize(previous)
    const after = payloadSize(current)
    const unit = current.kind === 'table' ? '行' : '个数据点'
    if (before === null || after === null || before === after) {
      const same = JSON.stringify(current.payload) === JSON.stringify(previous.payload)
      return {
        ...empty,
        mode: 'summary',
        summary: same ? `与 v${previous.version} 相比，数据没有变化` : `与 v${previous.version} 相比，数据有改动（规模未变）`
      }
    }
    return {
      ...empty,
      mode: 'summary',
      summary: `与 v${previous.version} 相比，从 ${before} ${unit}变成 ${after} ${unit}`
    }
  }

  const lines = diffLines(previous.content ?? '', current.content ?? '')
  const { added, removed } = diffStat(lines)
  if (!added && !removed) {
    return { ...empty, mode: 'lines', lines, summary: `与 v${previous.version} 相比，正文没有变化` }
  }
  return {
    current,
    previous,
    mode: 'lines',
    lines,
    added,
    removed,
    // 加减各报各的数，不合成一个「改了 N 行」：改 3 行与「删 3 行又加 3 行」不是一回事
    summary: `与 v${previous.version} 相比，+${added} −${removed} 行`
  }
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
