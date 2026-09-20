import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_chart.dart';

/// 接收 common `sunburstSectors` 序列化后的扇段：角度、半径与取色号都已算好，
/// 这里只负责把弧画出来。层级汇总与排序不在 Flutter 侧重做。
class IChartSunburst extends StatelessWidget {
  const IChartSunburst({super.key, required this.model, required this.sectors,
    this.title = '旭日图', this.focusId = '', this.selectedId = '', this.size = 220,
    this.onSelect, this.onFocus});

  /// buildHierarchy 的模型（已随下钻取好视图）
  final Map<String, dynamic> model;

  /// sunburstSectors 的结果，逐项含 r0 / r1 / a0 / a1 / colorIndex / kind
  final List<Map<String, dynamic>> sectors;
  final String title;
  final String focusId;
  final String selectedId;
  final double size;
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
            Expanded(child: Text('当前只看：${focused['label']}',
              style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm))),
          ])),
        Semantics(image: true, label: '$title，数据见下方层级列表',
          child: SizedBox(height: size, width: size,
            child: CustomPaint(painter: _SunburstPainter(sectors, selectedId, c,
              centerText: focused == null ? model['totalText'] as String : focused['valueText'] as String)))),
        paragraph('内圈是上级，外圈是它的下级；同一支各层同色。占比同时给出占全体与占上级两种分母。'),
      ],
      for (final node in nodes) Padding(
        padding: EdgeInsets.only(bottom: IDesignTokensLight.spacing2, left: ((node['depth'] as int) * 16).toDouble()),
        child: Semantics(selected: selectedId == node['id'], label: node['description'] as String,
          child: Material(color: selectedId == node['id'] ? c.brandSubtle : c.bgElevated,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd), side: BorderSide(color: c.hairline)),
            child: InkWell(onTap: onSelect == null ? null : () => onSelect!(node['id'] as String),
              child: Container(width: double.infinity, padding: const EdgeInsets.all(IDesignTokensLight.spacing3),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${node['label']}${selectedId == node['id'] ? ' · 已选' : ''}',
                    style: TextStyle(color: c.text)),
                  paragraph('${node['valueText']} · 占全体 ${node['shareText']}'
                    '${node['shareOfParent'] == null ? '' : ' · 占上级 ${(((node['shareOfParent'] as num) * 100)).toStringAsFixed(1)}%'}'
                    ' · 源行 ${(node['sourceIndex'] as int) + 1}'),
                ])))))),
      for (final row in excluded) paragraph('源行 ${(row['sourceIndex'] as int) + 1} · ${row['label']}：${row['reason']}'),
    ]);
  }
}

class _SunburstPainter extends CustomPainter {
  const _SunburstPainter(this.sectors, this.selectedId, this.colors, {required this.centerText});
  final List<Map<String, dynamic>> sectors;
  final String selectedId;
  final IColors colors;
  final String centerText;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    for (final sector in sectors) {
      final r0 = (sector['r0'] as num).toDouble(), r1 = (sector['r1'] as num).toDouble();
      final a0 = (sector['a0'] as num).toDouble(), a1 = (sector['a1'] as num).toDouble();
      final path = Path()
        ..arcTo(Rect.fromCircle(center: center, radius: r1), a0, a1 - a0, true)
        ..arcTo(Rect.fromCircle(center: center, radius: r0), a1, a0 - a1, false)
        ..close();
      // 「未细分」与第九支起的超出支都用中性色：前者不是类别，后者不能循环取色
      final index = sector['colorIndex'] as int;
      final fill = sector['kind'] == 'rest' || index >= iChartPalette.length
          ? colors.bgMuted
          : iChartPalette[index];
      canvas.drawPath(path, Paint()..color = fill);
      final selected = sector['id'] == selectedId;
      canvas.drawPath(path, Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = selected ? 2 : 1
        ..color = selected ? colors.text : colors.bg);
    }
    final painter = TextPainter(
      text: TextSpan(text: centerText, style: TextStyle(color: colors.text, fontSize: IDesignTokensLight.fontSizeSm)),
      textDirection: TextDirection.ltr)..layout();
    painter.paint(canvas, center - Offset(painter.width / 2, painter.height / 2));
  }

  @override
  bool shouldRepaint(covariant _SunburstPainter oldDelegate) =>
      oldDelegate.sectors != sectors ||
      oldDelegate.selectedId != selectedId ||
      oldDelegate.centerText != centerText ||
      oldDelegate.colors != colors;
}
