/// 智能体产物工作区的纯逻辑，对齐 packages/common/src/logic/artifact.ts。
///
/// 产物版本不可悄悄覆盖；采纳集合必须受当前版本约束；文档和代码均为纯文本预览，
/// 因而不会把生成内容作为宿主脚本执行。
library;

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
