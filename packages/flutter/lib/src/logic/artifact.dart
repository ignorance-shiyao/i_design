/// 智能体产物工作区的纯逻辑，对齐 packages/common/src/logic/artifact.ts。
///
/// 产物版本不可悄悄覆盖；采纳集合必须受当前版本约束；文档和代码均为纯文本预览，
/// 因而不会把生成内容作为宿主脚本执行。
library;

import 'diff.dart';

enum IArtifactKind { document, table, code, chart, file }
enum IArtifactPreviewMode { text, table, chart, file }

class IArtifactRevision {
  const IArtifactRevision({
    required this.id,
    required this.kind,
    required this.title,
    required this.version,
    required this.createdAt,
    this.content,
    this.itemIds = const [],
    this.meta = const {},
    this.payload,
  });

  final String id;
  final IArtifactKind kind;
  final String title;
  final int version;
  final int createdAt;
  final String? content;
  final List<String> itemIds;
  final Map<String, String> meta;
  final IArtifactPayload? payload;
}

sealed class IArtifactPayload { const IArtifactPayload(); }
class IArtifactTablePayload extends IArtifactPayload {
  const IArtifactTablePayload({required this.columns, required this.rows});
  final List<String> columns;
  final List<List<String>> rows;
}
class IArtifactChartPoint { const IArtifactChartPoint(this.label, this.value); final String label; final num value; }
class IArtifactChartPayload extends IArtifactPayload {
  const IArtifactChartPayload({required this.points});
  final List<IArtifactChartPoint> points;
}

class IArtifactWorkspaceView {
  const IArtifactWorkspaceView({required this.current, required this.revisions, required this.adopted});
  final IArtifactRevision? current;
  final List<IArtifactRevision> revisions;
  final List<String> adopted;
}

class IArtifactPreview {
  const IArtifactPreview({required this.mode, required this.label});
  final IArtifactPreviewMode mode;
  // executable 永远为 false，Dart 端没有 HTML / WebView 执行路径
  bool get executable => false;
  final String label;
}

class IArtifactVersionDiff {
  const IArtifactVersionDiff({required this.current, required this.previous, required this.changes});
  final IArtifactRevision? current;
  final IArtifactRevision? previous;
  final List<String> changes;
}

List<IArtifactRevision> artifactVersions(List<IArtifactRevision> artifacts, String artifactId) {
  final out = artifacts.where((item) => item.id == artifactId).toList();
  out.sort((a, b) => b.version != a.version ? b.version.compareTo(a.version) : b.createdAt.compareTo(a.createdAt));
  return out;
}

IArtifactVersionDiff artifactVersionDiff(List<IArtifactRevision> artifacts, String artifactId, {int? version}) {
  final revisions = artifactVersions(artifacts, artifactId);
  IArtifactRevision? current;
  if (version == null) current = revisions.isEmpty ? null : revisions.first;
  else { for (final item in revisions) { if (item.version == version) { current = item; break; } } }
  final index = current == null ? -1 : revisions.indexOf(current);
  final previous = index >= 0 && index + 1 < revisions.length ? revisions[index + 1] : null;
  if (current == null || previous == null) return IArtifactVersionDiff(current: current, previous: previous, changes: const []);
  final changes = <String>[];
  if (current.content != previous.content) changes.add('content');
  if (_payloadSignature(current.payload) != _payloadSignature(previous.payload)) changes.add('payload');
  if (current.itemIds.join('\u0000') != previous.itemIds.join('\u0000')) changes.add('items');
  return IArtifactVersionDiff(current: current, previous: previous, changes: changes);
}

String _payloadSignature(IArtifactPayload? payload) => switch (payload) {
  IArtifactTablePayload() => 'table:${payload.columns.join("\\u0001")}:${payload.rows.map((row) => row.join("\\u0001")).join("\\u0002")}',
  IArtifactChartPayload() => "chart:${payload.points.map((point) => '${point.label}=${point.value}').join("\\u0001")}",
  null => '',
};

IArtifactWorkspaceView openArtifact(
  List<IArtifactRevision> artifacts,
  String artifactId, {
  int? version,
  Iterable<String> adopted = const [],
}) {
  final revisions = artifactVersions(artifacts, artifactId);
  IArtifactRevision? current;
  if (version == null) {
    current = revisions.isEmpty ? null : revisions.first;
  } else {
    for (final item in revisions) {
      if (item.version == version) {
        current = item;
        break;
      }
    }
  }
  final allowed = artifactAdoptableIds(current).toSet();
  return IArtifactWorkspaceView(
    current: current,
    revisions: revisions,
    adopted: adopted.toSet().where(allowed.contains).toList(),
  );
}

List<String> artifactAdoptableIds(IArtifactRevision? artifact) {
  if (artifact == null) return [];
  return artifact.itemIds.isNotEmpty ? List.of(artifact.itemIds) : ['${artifact.id}@${artifact.version}'];
}

List<String> toggleArtifactAdoption(IArtifactRevision? artifact, Iterable<String> adopted, String id) {
  final allowed = artifactAdoptableIds(artifact).toSet();
  final next = adopted.toSet();
  if (!allowed.contains(id)) return next.toList();
  if (!next.add(id)) next.remove(id);
  return next.toList();
}

IArtifactPreview artifactPreview(IArtifactRevision? artifact) {
  final kind = artifact?.kind ?? IArtifactKind.file;
  final mode = switch (kind) {
    IArtifactKind.document || IArtifactKind.code => IArtifactPreviewMode.text,
    IArtifactKind.table => IArtifactPreviewMode.table,
    IArtifactKind.chart => IArtifactPreviewMode.chart,
    IArtifactKind.file => IArtifactPreviewMode.file,
  };
  final label = switch (mode) {
    IArtifactPreviewMode.text => kind == IArtifactKind.code ? '代码预览（只读）' : '文档预览（只读）',
    IArtifactPreviewMode.table => '表格预览（只读）',
    IArtifactPreviewMode.chart => '图表预览（只读）',
    IArtifactPreviewMode.file => '文件信息',
  };
  return IArtifactPreview(mode: mode, label: label);
}

IArtifactPayload? artifactPayload(IArtifactRevision? artifact) {
  final payload = artifact?.payload;
  if (artifact?.kind == IArtifactKind.table && payload is IArtifactTablePayload) return payload;
  if (artifact?.kind == IArtifactKind.chart && payload is IArtifactChartPayload) return payload;
  return null;
}

/* ---------- 具体改了哪几行 ---------- */

enum IDiffMode {
  /// 文本产物：逐行比
  lines,

  /// 结构化产物：只报规模变化，不假装做单元格级比对
  summary,

  /// 比不了：没有旧版，或者两版根本不是同一种东西
  none,
}

class IArtifactContentDiff {
  const IArtifactContentDiff({
    required this.current,
    required this.previous,
    required this.mode,
    required this.lines,
    required this.added,
    required this.removed,
    required this.summary,
  });

  final IArtifactRevision? current;
  final IArtifactRevision? previous;
  final IDiffMode mode;
  final List<IDiffLine> lines;
  final int added;
  final int removed;

  /// 摆给用户看的那一句。任何 mode 下都有话可说，不会只剩一个空白区域
  final String summary;
}

/// 结构化产物的规模：表格数行、图表数点
int? _payloadSize(IArtifactRevision artifact) => switch (artifact.payload) {
      IArtifactTablePayload(:final rows) => rows.length,
      IArtifactChartPayload(:final points) => points.length,
      null => null,
    };

const Map<IArtifactKind, String> _kindLabels = {
  IArtifactKind.document: 'document',
  IArtifactKind.table: 'table',
  IArtifactKind.code: 'code',
  IArtifactKind.chart: 'chart',
  IArtifactKind.file: 'file',
};

/// 相对紧邻旧版，具体改了哪几行。
///
/// 补的是「只说 content 变了，看不见改了什么」那个缺口——一句「内容有变化」
/// 等于没说：用户要么逐字重读一遍，要么干脆不看，而产物工作区存在的理由
/// 恰恰是**让人能复核**。
///
/// 三条边界与 Web 端逐字一致：只跟紧邻旧版比（v3 直接同 v1 比会把 v2 的改动
/// 算到 v3 头上）；两版不是同一种东西就不逐行比；结构化产物只报规模变化，
/// 不假装做单元格级比对（产物是重新生成的，行与行之间没有可靠的对应关系）。
IArtifactContentDiff artifactContentDiff(
  List<IArtifactRevision> artifacts,
  String artifactId, {
  int? version,
}) {
  final base = artifactVersionDiff(artifacts, artifactId, version: version);
  final current = base.current;
  final previous = base.previous;

  if (current == null || previous == null) {
    return IArtifactContentDiff(
      current: current,
      previous: previous,
      mode: IDiffMode.none,
      lines: const [],
      added: 0,
      removed: 0,
      summary: current != null ? '这是最早的一版，没有可比对的旧版' : '没有可比对的版本',
    );
  }

  if (current.kind != previous.kind) {
    return IArtifactContentDiff(
      current: current,
      previous: previous,
      mode: IDiffMode.none,
      lines: const [],
      added: 0,
      removed: 0,
      summary:
          '产物类型从「${_kindLabels[previous.kind]}」变成了「${_kindLabels[current.kind]}」，两版无法逐行比较，请整份重看',
    );
  }

  final isText =
      current.kind == IArtifactKind.document || current.kind == IArtifactKind.code;
  if (!isText) {
    final before = _payloadSize(previous);
    final after = _payloadSize(current);
    final unit = current.kind == IArtifactKind.table ? '行' : '个数据点';
    if (before == null || after == null || before == after) {
      final same = _payloadSignature(current.payload) == _payloadSignature(previous.payload);
      return IArtifactContentDiff(
        current: current,
        previous: previous,
        mode: IDiffMode.summary,
        lines: const [],
        added: 0,
        removed: 0,
        summary: same
            ? '与 v${previous.version} 相比，数据没有变化'
            : '与 v${previous.version} 相比，数据有改动（规模未变）',
      );
    }
    return IArtifactContentDiff(
      current: current,
      previous: previous,
      mode: IDiffMode.summary,
      lines: const [],
      added: 0,
      removed: 0,
      summary: '与 v${previous.version} 相比，从 $before $unit变成 $after $unit',
    );
  }

  final lines = diffLines(previous.content ?? '', current.content ?? '');
  final stat = diffStat(lines);
  if (stat.added == 0 && stat.removed == 0) {
    return IArtifactContentDiff(
      current: current,
      previous: previous,
      mode: IDiffMode.lines,
      lines: lines,
      added: 0,
      removed: 0,
      summary: '与 v${previous.version} 相比，正文没有变化',
    );
  }
  return IArtifactContentDiff(
    current: current,
    previous: previous,
    mode: IDiffMode.lines,
    lines: lines,
    added: stat.added,
    removed: stat.removed,
    // 加减各报各的数，不合成一个「改了 N 行」：改 3 行与「删 3 行又加 3 行」不是一回事
    summary: '与 v${previous.version} 相比，+${stat.added} −${stat.removed} 行',
  );
}
