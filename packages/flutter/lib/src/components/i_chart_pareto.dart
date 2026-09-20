import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 接收 common buildPareto 序列化后的模型，统计与排序只在 common 执行。
class IChartPareto extends StatelessWidget {
  const IChartPareto({super.key, required this.model, this.title = '帕累托图',
    this.selectedId = '', this.height = 220, this.onSelect});
  final Map<String, dynamic> model;
  final String title;
  final String selectedId;
  final double height;
  final ValueChanged<String>? onSelect;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final rows = (model['rows'] as List).cast<Map<String, dynamic>>();
    final excluded = (model['excluded'] as List).cast<Map<String, dynamic>>();
    Widget paragraph(String text) => Padding(
      padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing2),
      child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 45 * IDesignTokensLight.fontSizeSm),
        child: Text(text, style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm))));
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd, fontWeight: FontWeight.w600)),
      paragraph(model['caption'] as String),
      if (model['state'] == 'ready') ...[
        paragraph('柱形：0 — ${model['maxText']}；折线：累计占比 0 — 100%'),
        Semantics(image: true, label: '$title，数据见下方类别列表', child: SizedBox(height: height, width: double.infinity,
          child: CustomPaint(painter: _ParetoPainter(rows, (model['threshold'] as num).toDouble(), c)))),
        Row(children: [for (final row in rows) Expanded(child: Text('${row['rank']}', textAlign: TextAlign.center,
          style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm)))]),
        paragraph('虚线：${model['thresholdText']} 累计阈值。序号对应下方类别；累计只表示数量构成，不说明因果。'),
      ],
      for (final row in rows) Padding(padding: const EdgeInsets.only(bottom: IDesignTokensLight.spacing2),
        child: Semantics(selected: selectedId == row['id'], label: row['description'] as String,
          child: Material(color: selectedId == row['id'] ? c.brandSubtle : c.bgElevated,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd), side: BorderSide(color: c.hairline)),
            child: InkWell(onTap: onSelect == null ? null : () => onSelect!(row['id'] as String),
              child: Container(width: double.infinity, padding: const EdgeInsets.all(IDesignTokensLight.spacing3),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${row['rank']}. ${row['label']}${selectedId == row['id'] ? ' · 已选' : ''}', style: TextStyle(color: c.text)),
                  paragraph('${row['valueText']} · 占比 ${row['shareText']} · 累计 ${row['cumulativeText']} · 源行 ${(row['sourceIndex'] as int) + 1}'),
                ])))))),
      for (final row in excluded) paragraph('源行 ${(row['sourceIndex'] as int) + 1} · ${row['label']}：${row['reason']}'),
    ]);
  }
}

class _ParetoPainter extends CustomPainter {
  const _ParetoPainter(this.rows, this.threshold, this.colors);
  final List<Map<String, dynamic>> rows;
  final double threshold;
  final IColors colors;
  @override
  void paint(Canvas canvas, Size size) {
    final grid = Paint()..color = colors.hairline..strokeWidth = 1;
    for (final y in [0.0, .25, .5, .75, 1.0]) {
      canvas.drawLine(Offset(0, y * size.height), Offset(size.width, y * size.height), grid);
    }
    final bar = Paint()..color = colors.brand;
    final line = Paint()..color = colors.text..style = PaintingStyle.stroke..strokeWidth = 2;
    final path = Path();
    for (var i = 0; i < rows.length; i++) {
      final row = rows[i], relative = (rows[i]['relative'] as num).toDouble();
      canvas.drawRect(Rect.fromLTWH((i + .1) * size.width / rows.length, (1 - relative) * size.height,
        .8 * size.width / rows.length, relative * size.height), bar);
      final x = (i + .5) * size.width / rows.length, y = (1 - (row['cumulative'] as num).toDouble()) * size.height;
      if (i == 0) { path.moveTo(x, y); } else { path.lineTo(x, y); }
    }
    canvas.drawPath(path, line);
    for (var i = 0; i < rows.length; i++) {
      canvas.drawCircle(Offset((i + .5) * size.width / rows.length, (1 - (rows[i]['cumulative'] as num).toDouble()) * size.height), 2.5, Paint()..color = colors.text);
    }
    final dashed = Paint()..color = colors.textSecondary..strokeWidth = 1;
    for (double x = 0; x < size.width; x += 8) {
      canvas.drawLine(Offset(x, (1 - threshold) * size.height), Offset((x + 4).clamp(0, size.width).toDouble(), (1 - threshold) * size.height), dashed);
    }
  }
  @override
  bool shouldRepaint(covariant _ParetoPainter oldDelegate) => oldDelegate.rows != rows || oldDelegate.threshold != threshold || oldDelegate.colors != colors;
}
