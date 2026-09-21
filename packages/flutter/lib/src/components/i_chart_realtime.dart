import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 接收 common `buildRealtimeWindow` 序列化后的模型：
/// 桶的合计、断流空档、延迟与口径都已算好，这里只负责画出来。
class IChartRealtime extends StatelessWidget {
  const IChartRealtime({
    super.key,
    required this.model,
    this.title = '实时滑窗',
    this.selectedIndex,
    this.height = 180,
    this.onSelect,
  });

  final Map<String, dynamic> model;
  final String title;
  final int? selectedIndex;
  final double height;
  final ValueChanged<int>? onSelect;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final buckets = (model['buckets'] as List).cast<Map<String, dynamic>>();
    final late = (model['late'] as List).cast<Map<String, dynamic>>();
    final excluded = (model['excluded'] as List).cast<Map<String, dynamic>>();
    final marks = (model['marks'] as List).cast<Map<String, dynamic>>();
    final min = (model['min'] as num).toDouble();
    final max = (model['max'] as num).toDouble();
    final span = max - min == 0 ? 1.0 : max - min;
    final gapCount = buckets.where((bucket) => bucket['state'] == 'gap').length;

    Widget paragraph(String text, {Color? color}) => Padding(
          padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing2),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 45 * IDesignTokensLight.fontSizeSm),
            child: Text(
              text,
              style: TextStyle(
                color: color ?? c.textSecondary,
                fontSize: IDesignTokensLight.fontSizeSm,
              ),
            ),
          ),
        );

    Widget chip(String text, {Color? foreground, Color? background}) => Container(
          padding: const EdgeInsets.symmetric(
            horizontal: IDesignTokensLight.spacing2,
            vertical: IDesignTokensLight.spacing1,
          ),
          decoration: BoxDecoration(
            color: background ?? c.bgSubtle,
            border: Border.all(color: c.border),
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
          ),
          child: Text(
            text,
            style: TextStyle(
              color: foreground ?? c.text,
              fontSize: IDesignTokensLight.fontSizeXs,
            ),
          ),
        );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            color: c.text,
            fontSize: IDesignTokensLight.fontSizeMd,
            fontWeight: FontWeight.w600,
          ),
        ),
        paragraph(model['caption'] as String),
        paragraph('口径：${model['basis']}', color: c.text),
        Wrap(
          spacing: IDesignTokensLight.spacing2,
          runSpacing: IDesignTokensLight.spacing2,
          children: [
            chip(
              model['paused'] == true ? '已暂停' : '直播中',
              foreground: model['paused'] == true ? c.warning : c.success,
              background: model['paused'] == true ? c.warningSubtle : c.successSubtle,
            ),
            chip(model['lagText'] as String),
            if (gapCount > 0)
              chip(
                '$gapCount 个断流空档',
                foreground: c.danger,
                background: c.dangerSubtle,
              ),
          ],
        ),
        if (model['state'] == 'ready') ...[
          const SizedBox(height: IDesignTokensLight.spacing3),
          SizedBox(
            height: height,
            width: double.infinity,
            child: CustomPaint(
              painter: _RealtimePainter(
                buckets: buckets,
                marks: marks,
                min: min,
                span: span,
                selectedIndex: selectedIndex,
                brand: c.brand,
                brandSolid: c.brand,
                border: c.border,
                borderStrong: c.borderStrong,
                danger: c.danger,
                warning: c.warning,
                bg: c.bg,
              ),
            ),
          ),
          const SizedBox(height: IDesignTokensLight.spacing3),
          Wrap(
            spacing: IDesignTokensLight.spacing2,
            runSpacing: IDesignTokensLight.spacing2,
            children: [
              for (final bucket in buckets)
                Semantics(
                  button: true,
                  selected: selectedIndex == bucket['index'],
                  label: bucket['description'] as String,
                  child: InkWell(
                    onTap: onSelect == null
                        ? null
                        : () => onSelect!(bucket['index'] as int),
                    child: Container(
                      width: 96,
                      padding: const EdgeInsets.all(IDesignTokensLight.spacing2),
                      decoration: BoxDecoration(
                        color: selectedIndex == bucket['index']
                            ? c.brandSubtle
                            : bucket['state'] == 'gap'
                                ? c.dangerSubtle
                                : c.bg,
                        border: Border.all(color: c.border),
                        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            bucket['state'] == 'gap'
                                ? '断流'
                                : '桶 ${(bucket['index'] as int) + 1}',
                            style: TextStyle(
                              color: bucket['state'] == 'gap' ? c.danger : c.textSecondary,
                              fontSize: IDesignTokensLight.fontSizeXs,
                            ),
                          ),
                          Text(
                            bucket['valueText'] as String,
                            style: TextStyle(
                              color: c.text,
                              fontSize: IDesignTokensLight.fontSizeSm,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
          paragraph('折线在断流空档处断开，不把空档连成斜线。下方每个桶都可以选中；断流桶标着「断流」，不是 0。'),
        ],
        for (final row in late)
          paragraph('未入窗 · ${row['id']}：${row['reason']}'),
        for (final row in excluded)
          paragraph('未计入 · 源行 ${(row['sourceIndex'] as int) + 1} · ${row['id']}：${row['reason']}'),
      ],
    );
  }
}

class _RealtimePainter extends CustomPainter {
  _RealtimePainter({
    required this.buckets,
    required this.marks,
    required this.min,
    required this.span,
    required this.selectedIndex,
    required this.brand,
    required this.brandSolid,
    required this.border,
    required this.borderStrong,
    required this.danger,
    required this.warning,
    required this.bg,
  });

  final List<Map<String, dynamic>> buckets;
  final List<Map<String, dynamic>> marks;
  final double min;
  final double span;
  final int? selectedIndex;
  final Color brand;
  final Color brandSolid;
  final Color border;
  final Color borderStrong;
  final Color danger;
  final Color warning;
  final Color bg;

  double _x(int index, Size size) =>
      buckets.length <= 1 ? size.width / 2 : index / (buckets.length - 1) * size.width;

  double _y(num value, Size size) => size.height - ((value.toDouble() - min) / span) * size.height;

  @override
  void paint(Canvas canvas, Size size) {
    final grid = Paint()
      ..color = border
      ..strokeWidth = 1;
    for (final t in [0.0, 0.25, 0.5, 0.75, 1.0]) {
      final y = size.height * t;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), grid);
    }
    final zero = Paint()
      ..color = borderStrong
      ..strokeWidth = 1;
    final zeroY = _y(0, size);
    canvas.drawLine(Offset(0, zeroY), Offset(size.width, zeroY), zero);

    final gapPaint = Paint()..color = danger.withValues(alpha: 0.12);
    for (var index = 0; index < buckets.length; index++) {
      if (buckets[index]['state'] != 'gap') continue;
      final left = buckets.length <= 1
          ? 0.0
          : ((index - 0.5) / (buckets.length - 1) * size.width).clamp(0.0, size.width);
      final right = buckets.length <= 1
          ? size.width
          : ((index + 0.5) / (buckets.length - 1) * size.width).clamp(0.0, size.width);
      canvas.drawRect(Rect.fromLTRB(left, 0, right, size.height), gapPaint);
    }

    final markPaint = Paint()
      ..color = warning
      ..strokeWidth = 1;
    for (final mark in marks) {
      final x = _x(mark['bucketIndex'] as int, size);
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), markPaint);
    }

    final line = Paint()
      ..color = brand
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeJoin = StrokeJoin.round
      ..strokeCap = StrokeCap.round;
    List<Offset> segment = [];
    void flush() {
      if (segment.length < 2) {
        segment = [];
        return;
      }
      final path = Path()..moveTo(segment.first.dx, segment.first.dy);
      for (final point in segment.skip(1)) {
        path.lineTo(point.dx, point.dy);
      }
      canvas.drawPath(path, line);
      segment = [];
    }

    for (var index = 0; index < buckets.length; index++) {
      final bucket = buckets[index];
      if (bucket['state'] == 'gap' || bucket['value'] == null) {
        flush();
        continue;
      }
      segment.add(Offset(_x(index, size), _y(bucket['value'] as num, size)));
    }
    flush();

    for (var index = 0; index < buckets.length; index++) {
      final bucket = buckets[index];
      if (bucket['state'] != 'ready' || bucket['value'] == null) continue;
      final selected = selectedIndex == index;
      final fill = Paint()..color = selected ? brand : brandSolid;
      final stroke = Paint()
        ..color = bg
        ..style = PaintingStyle.stroke
        ..strokeWidth = selected ? 2 : 1;
      final center = Offset(_x(index, size), _y(bucket['value'] as num, size));
      canvas.drawCircle(center, selected ? 4 : 3, fill);
      canvas.drawCircle(center, selected ? 4 : 3, stroke);
    }
  }

  @override
  bool shouldRepaint(covariant _RealtimePainter oldDelegate) =>
      oldDelegate.buckets != buckets ||
      oldDelegate.selectedIndex != selectedIndex ||
      oldDelegate.min != min ||
      oldDelegate.span != span;
}
