import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_chart.dart';

/// 接收 common `icicleCells` 序列化后的格子：位置、宽度与取色号都已算好。
/// 层级汇总与排序不在 Flutter 侧重做，因此和 Web 端逐格对得上。
class IChartIcicle extends StatelessWidget {
  const IChartIcicle({super.key, required this.model, required this.cells,
    this.title = 'Icicle 图', this.focusId = '', this.selectedId = '',
    this.width = 640, this.height = 56, this.onSelect, this.onFocus});

  /// buildHierarchy 的模型（已随下钻取好视图）
  final Map<String, dynamic> model;

  /// icicleCells 的结果，逐项含 x / y / width / height / colorIndex / kind
  final List<Map<String, dynamic>> cells;
  final String title;
  final String focusId;
  final String selectedId;

  /// 与生成 cells 时传给 icicleCells 的 width 一致，否则格子对不上画布
  final double width;

  /// icicleHeight 的结果
  final double height;
  final ValueChanged<String>? onSelect;
  final ValueChanged<String>? onFocus;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final nodes = (model['nodes'] as List).cast<Map<String, dynamic>>();
    final excluded = (model['excluded'] as List).cast<Map<String, dynamic>>();
    final focused = focusId.isEmpty
        ? null
        : nodes.cast<Map<String, dynamic>?>().firstWhere((n) => n!['id'] == focusId, orElse: () => null);

    Widget paragraph(String text) => Padding(
      padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing2),
      child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 45 * IDesignTokensLight.fontSizeSm),
        child: Text(text, style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm))));

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd, fontWeight: FontWeight.w600)),
      paragraph(model['caption'] as String),
      if (model['state'] == 'ready') ...[
        if (focused != null) Padding(padding: const EdgeInsets.only(bottom: IDesignTokensLight.spacing2),
          child: Row(children: [
            TextButton(onPressed: onFocus == null ? null : () => onFocus!(''), child: const Text('返回全部')),
            Expanded(child: Text('当前只看：${focused['label']}（${focused['valueText']}）',
              style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm))),
          ])),
        Semantics(image: true, label: '$title，数据见下方层级列表',
          child: SizedBox(height: height, width: double.infinity,
            child: CustomPaint(painter: _IciclePainter(cells, selectedId, c, sourceWidth: width)))),
        paragraph('每一行是一层，上一行是下一行的上级；宽度按占全体的比例分配，同一支各层同色。'),
      ],
      for (final node in nodes) Padding(
        padding: EdgeInsets.only(bottom: IDesignTokensLight.spacing2, left: ((node['depth'] as int) * 16).toDouble()),
        child: Semantics(selected: selectedId == node['id'], label: node['description'] as String,
          child: Material(color: selectedId == node['id'] ? c.brandSubtle : c.bgElevated,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd), side: BorderSide(color: c.hairline)),
            child: InkWell(onTap: onSelect == null ? null : () => onSelect!(node['id'] as String),
              child: Container(width: double.infinity, padding: const EdgeInsets.all(IDesignTokensLight.spacing3),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${node['label']}${selectedId == node['id'] ? ' · 已选' : ''}', style: TextStyle(color: c.text)),
                  paragraph('${node['valueText']} · 占全体 ${node['shareText']}'
                    '${node['shareOfParent'] == null ? '' : ' · 占上级 ${(((node['shareOfParent'] as num) * 100)).toStringAsFixed(1)}%'}'
                    ' · 源行 ${(node['sourceIndex'] as int) + 1}'),
                ])))))),
      for (final row in excluded) paragraph('源行 ${(row['sourceIndex'] as int) + 1} · ${row['label']}：${row['reason']}'),
    ]);
  }
}

class _IciclePainter extends CustomPainter {
  const _IciclePainter(this.cells, this.selectedId, this.colors, {required this.sourceWidth});
  final List<Map<String, dynamic>> cells;
  final String selectedId;
  final IColors colors;

  /// 生成 cells 时用的宽度：画布实际更窄时整幅等比缩放，而不是把格子挤变形
  final double sourceWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final scale = sourceWidth <= 0 ? 1.0 : size.width / sourceWidth;
    for (final cell in cells) {
      final rect = Rect.fromLTWH(
        (cell['x'] as num).toDouble() * scale,
        (cell['y'] as num).toDouble(),
        (cell['width'] as num).toDouble() * scale,
        (cell['height'] as num).toDouble());
      // 「未细分」与第九支起的超出支都用中性色：前者不是类别，后者不能循环取色
      final index = cell['colorIndex'] as int;
      final fill = cell['kind'] == 'rest' || index >= iChartPalette.length
          ? colors.bgMuted
          : iChartPalette[index];
      canvas.drawRect(rect, Paint()..color = fill);
      final selected = cell['id'] == selectedId;
      canvas.drawRect(rect, Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = selected ? 2 : 1
        ..color = selected ? colors.text : colors.bg);
    }
  }

  @override
  bool shouldRepaint(covariant _IciclePainter oldDelegate) =>
      oldDelegate.cells != cells ||
      oldDelegate.selectedId != selectedId ||
      oldDelegate.sourceWidth != sourceWidth ||
      oldDelegate.colors != colors;
}
