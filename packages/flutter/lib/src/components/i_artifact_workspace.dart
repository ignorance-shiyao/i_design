import 'package:flutter/material.dart';
import '../logic/artifact.dart';
import '../logic/diff.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_button.dart';
import 'i_tag.dart';

/// 智能体产物工作区：版本可回看，采纳只能落在当前版本，正文永远只读。
class IArtifactWorkspace extends StatelessWidget {
  const IArtifactWorkspace({
    super.key,
    required this.artifacts,
    required this.artifactId,
    this.version,
    this.adopted = const [],
    this.title = '产物工作区',
    this.onVersionChanged,
    this.onAdoptedChanged,
    this.onDownload,
  });

  final List<IArtifactRevision> artifacts;
  final String artifactId;
  final int? version;
  final List<String> adopted;
  final String title;
  final ValueChanged<int>? onVersionChanged;
  final ValueChanged<List<String>>? onAdoptedChanged;
  final ValueChanged<IArtifactRevision>? onDownload;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final workspace = openArtifact(artifacts, artifactId, version: version, adopted: adopted);
    final current = workspace.current;
    final preview = artifactPreview(current);
    final payload = artifactPayload(current);
    // 差异不止说「变了」，还要说清改了哪几行：一句「内容有变化」等于没说，
    // 用户要么逐字重读一遍，要么干脆不看
    final versionDiff = artifactContentDiff(artifacts, artifactId, version: current?.version);
    final changedLines = versionDiff.mode == IDiffMode.lines && versionDiff.added + versionDiff.removed > 0
        ? versionDiff.lines.where((line) => line.kind != IDiffKind.same).toList()
        : const <IDiffLine>[];
    final ids = artifactAdoptableIds(current);
    return Container(
      decoration: BoxDecoration(
        color: c.bg,
        border: Border.all(color: c.hairline),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(IDesignTokensLight.spacing3),
            color: c.bgSubtle,
            child: Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(current?.title ?? title, style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd)),
                Text(preview.label, style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs)),
              ])),
              if (current != null) IButton(child: const Text('导出'), size: IButtonSize.sm, onPressed: onDownload == null ? null : () => onDownload!(current)),
            ]),
          ),
          if (workspace.revisions.length > 1)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing3, vertical: IDesignTokensLight.spacing2),
              decoration: BoxDecoration(border: Border(bottom: BorderSide(color: c.hairline))),
              child: Wrap(spacing: IDesignTokensLight.spacing1, children: [
                for (final item in workspace.revisions)
                  OutlinedButton(
                    onPressed: onVersionChanged == null ? null : () => onVersionChanged!(item.version),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: item.version == current?.version ? c.brand : c.textSecondary,
                      backgroundColor: item.version == current?.version ? c.brandSubtle : c.bg,
                      side: BorderSide(color: c.hairline),
                      padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing2),
                    ),
                    child: Text('v${item.version}'),
                  ),
              ]),
            ),
          if (current != null)
            Padding(
              padding: const EdgeInsets.all(IDesignTokensLight.spacing3),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                ITag(child: Text(current.kind.name)),
                const SizedBox(height: IDesignTokensLight.spacing2),
                if (preview.mode == IArtifactPreviewMode.text)
                  SelectableText(current.content ?? '此版本未提供正文预览。', style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm, height: 1.6))
                else if (payload is IArtifactTablePayload)
                  Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    for (final row in [payload.columns, ...payload.rows])
                      Padding(padding: const EdgeInsets.only(top: IDesignTokensLight.spacing1), child: Row(children: [for (final cell in row) Expanded(child: Text(cell, style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm)))])),
                  ])
                else if (payload is IArtifactChartPayload)
                  Column(children: [for (final point in payload.points) Row(children: [SizedBox(width: 72, child: Text(point.label, style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm))), Expanded(child: FractionallySizedBox(alignment: Alignment.centerLeft, widthFactor: (point.value.clamp(0, 100) / 100).toDouble(), child: Container(height: IDesignTokensLight.spacing2, color: c.brand))), const SizedBox(width: IDesignTokensLight.spacing2), Text('${point.value}', style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm))])])
                else
                  Text(current.meta['summary'] ?? '此版本可作为结构化结果查看或导出。', style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm, height: 1.6)),
              ]),
            ),
          // 任何情况下都有话可说：比不了也说清为什么，不会只剩一块空白
          Padding(
            padding: const EdgeInsets.fromLTRB(IDesignTokensLight.spacing3, 0, IDesignTokensLight.spacing3, IDesignTokensLight.spacing2),
            child: Text(versionDiff.summary, style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs)),
          ),
          if (changedLines.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(IDesignTokensLight.spacing3, 0, IDesignTokensLight.spacing3, IDesignTokensLight.spacing3),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (final line in changedLines)
                    Container(
                      width: double.infinity,
                      color: line.kind == IDiffKind.add ? c.successSubtle : c.dangerSubtle,
                      padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing1),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(
                            width: 24,
                            child: Text(
                              '${line.kind == IDiffKind.add ? line.after ?? '' : line.before ?? ''}',
                              textAlign: TextAlign.right,
                              style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs, fontFamily: 'monospace'),
                            ),
                          ),
                          const SizedBox(width: IDesignTokensLight.spacing2),
                          // 符号与底色一起给：只靠颜色的话，灰度打印与色觉障碍下读不出增删
                          Text(
                            line.kind == IDiffKind.add ? '+' : '−',
                            style: TextStyle(color: line.kind == IDiffKind.add ? c.success : c.danger, fontSize: IDesignTokensLight.fontSizeXs, fontFamily: 'monospace'),
                          ),
                          const SizedBox(width: IDesignTokensLight.spacing1),
                          Expanded(
                            child: Text(
                              line.text,
                              style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeXs, fontFamily: 'monospace', height: 1.7),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          if (ids.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(IDesignTokensLight.spacing3),
              decoration: BoxDecoration(color: c.bgSubtle, border: Border(top: BorderSide(color: c.hairline))),
              child: Wrap(spacing: IDesignTokensLight.spacing2, runSpacing: IDesignTokensLight.spacing2, crossAxisAlignment: WrapCrossAlignment.center, children: [
                Text(workspace.adopted.isEmpty ? '尚未采纳' : '已采纳 ${workspace.adopted.length} 项', style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm)),
                for (final id in ids)
                  IButton(
                    child: Text(workspace.adopted.contains(id) ? '撤销采纳' : '采纳'),
                    size: IButtonSize.sm,
                    variant: workspace.adopted.contains(id) ? IButtonVariant.secondary : IButtonVariant.primary,
                    onPressed: onAdoptedChanged == null ? null : () => onAdoptedChanged!(toggleArtifactAdoption(current, workspace.adopted, id)),
                  ),
              ]),
            ),
        ],
      ),
    );
  }
}
