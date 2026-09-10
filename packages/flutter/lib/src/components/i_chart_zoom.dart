import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import '../logic/chart.dart';

/// 区间缩放条：图表下方的缩略走势 + 可拖拽的窗口。
///
/// 缩略走势只表达形状、不给坐标轴——它的作用是让人知道自己拖到了哪一段。
class IChartZoom extends StatefulWidget {
  const IChartZoom({
    super.key,
    required this.values,
    required this.window,
    this.labels = const [],
    this.minSpan = 3,
    this.height = 48,
    this.onChanged,
  });

  /// 全量数据，只用来画缩略走势
  final List<double> values;
  final IZoomWindow window;
  final List<String> labels;

  /// 窗口最少包含几个点
  final int minSpan;
  final double height;
  final ValueChanged<IZoomWindow>? onChanged;

  @override
  State<IChartZoom> createState() => _IChartZoomState();
}

enum _DragMode { left, right, move }

class _IChartZoomState extends State<IChartZoom> {
  _DragMode? _mode;
  IZoomWindow? _origin;
  double _trackWidth = 1;

  void _start(Offset local, double width) {
    _trackWidth = width;
    final count = widget.values.length;
    final r = windowRatio(widget.window, count);
    final ratio = (local.dx / width).clamp(0.0, 1.0);
    // 离哪一端近就拖哪一端；中间则整体平移
    final dLeft = (ratio - r.from).abs();
    final dRight = (ratio - r.to).abs();
    final span = r.to - r.from;
    _origin = widget.window;
    if (dLeft < dRight && dLeft < span / 4) {
      _mode = _DragMode.left;
    } else if (dRight <= dLeft && dRight < span / 4) {
      _mode = _DragMode.right;
    } else {
      _mode = _DragMode.move;
    }
  }

  void _update(Offset local, double delta) {
    final count = widget.values.length;
    final origin = _origin;
    if (_mode == null || origin == null) return;

    if (_mode == _DragMode.move) {
      // 位移换算成下标增量：按像素直接改下标会让长序列拖不动
      final step = delta / _trackWidth * (count - 1);
      widget.onChanged?.call(panWindow(widget.window, step, count));
      return;
    }
    final ratio = (local.dx / _trackWidth).clamp(0.0, 1.0);
    final r = windowRatio(widget.window, count);
    final other = _mode == _DragMode.left ? r.to : r.from;
    widget.onChanged?.call(windowFromRatio(
      ratio < other ? ratio : other,
      ratio < other ? other : ratio,
      count,
      widget.minSpan,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final count = widget.values.length;
    final r = windowRatio(widget.window, count);
    final labels = widget.labels;
    final text = labels.isNotEmpty
        ? '${labels.elementAtOrNull(widget.window.start) ?? ''} – ${labels.elementAtOrNull(widget.window.end) ?? ''}'
        : '${widget.window.start + 1} – ${widget.window.end + 1}';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        LayoutBuilder(
          builder: (context, box) => GestureDetector(
            onHorizontalDragStart: (d) => _start(d.localPosition, box.maxWidth),
            onHorizontalDragUpdate: (d) => _update(d.localPosition, d.delta.dx),
            onHorizontalDragEnd: (_) => _mode = null,
            child: Container(
              height: widget.height,
              decoration: BoxDecoration(
                color: c.bgSubtle,
                border: Border.all(color: c.hairline),
                borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                children: [
                  Positioned.fill(
                    child: CustomPaint(
                      painter: _PreviewPainter(
                        values: widget.values,
                        color: c.textTertiary,
                      ),
                    ),
                  ),
                  // 窗口之外压暗：被排除的区间仍然可见，用户才知道自己漏看了什么
                  Positioned(
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: box.maxWidth * r.from,
                    child: ColoredBox(color: c.bg.withValues(alpha: 0.66)),
                  ),
                  Positioned(
                    left: box.maxWidth * r.to,
                    top: 0,
                    bottom: 0,
                    right: 0,
                    child: ColoredBox(color: c.bg.withValues(alpha: 0.66)),
                  ),
                  Positioned(
                    left: box.maxWidth * r.from,
                    width: box.maxWidth * (r.to - r.from),
                    top: 0,
                    bottom: 0,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: c.brandSubtle.withValues(alpha: 0.5),
                        border: Border.all(color: c.brand),
                        borderRadius:
                            BorderRadius.circular(IDesignTokensLight.radiusSm),
                      ),
                      // 手柄做成 12px 宽的抓取区：1px 的目标没人拖得中
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(width: 12, color: c.brand),
                          Container(width: 12, color: c.brand),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: IDesignTokensLight.spacing2),
        Row(
          children: [
            Text(
              text,
              style: TextStyle(
                fontSize: IDesignTokensLight.fontSizeXs,
                color: c.textTertiary,
              ),
            ),
            const Spacer(),
            GestureDetector(
              onTap: () => widget.onChanged?.call(
                clampWindow(
                  IZoomWindow(start: 0, end: count - 1),
                  count,
                  widget.minSpan,
                ),
              ),
              child: Text(
                '重置',
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeXs,
                  color: c.textTertiary,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _PreviewPainter extends CustomPainter {
  _PreviewPainter({required this.values, required this.color});
  final List<double> values;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    if (values.length < 2) return;
    var min = values.first;
    var max = values.first;
    for (final v in values) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    final span = max - min == 0 ? 1.0 : max - min;
    final path = Path();
    for (var i = 0; i < values.length; i++) {
      final x = i / (values.length - 1) * size.width;
      // 上下各留 6px：贴着边缘的折线看起来像被裁掉了
      final y = size.height - 6 - (values[i] - min) / span * (size.height - 12);
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..strokeWidth = 1.5
        ..style = PaintingStyle.stroke,
    );
  }

  @override
  bool shouldRepaint(_PreviewPainter old) => old.values != values;
}
