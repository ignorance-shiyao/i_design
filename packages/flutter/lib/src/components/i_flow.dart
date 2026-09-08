import 'package:flutter/material.dart';
import '../logic/flow.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 流程图画布。
///
/// 节点形状承担语义：开始与结束是胶囊，判断是菱形，其余是矩形。
/// 形状比颜色可靠——打印成黑白或读者有色觉障碍时，颜色会失效，形状不会。
class IFlow extends StatefulWidget {
  const IFlow({
    super.key,
    required this.nodes,
    required this.edges,
    this.height = 360,
    this.readOnly = false,
    this.selected,
    this.onSelect,
    this.onMove,
  });

  final List<FlowNodeData> nodes;
  final List<FlowEdgeData> edges;
  final double height;

  /// 只读：仍可平移缩放与选中，但不能拖动节点
  final bool readOnly;
  final String? selected;
  final ValueChanged<String?>? onSelect;

  /// 拖动结束抛出新坐标；组件不改传入的数据
  final void Function(String id, double x, double y)? onMove;

  @override
  State<IFlow> createState() => _IFlowState();
}

class _IFlowState extends State<IFlow> {
  Offset _pan = Offset.zero;
  double _scale = 1;
  String? _dragId;
  Offset _dragDelta = Offset.zero;
  Size _canvas = Size.zero;

  @override
  void initState() {
    super.initState();
    // 首帧后适应画布：自动布局的图往往比画布高，
    // 不做这一步用户只会看到第一个节点，还以为图坏了
    WidgetsBinding.instance.addPostFrameCallback((_) => _fit());
  }

  void _fit() {
    if (_canvas == Size.zero) return;
    final b = boundsOf(widget.nodes);
    if (b.width <= 0 || b.height <= 0) return;
    final scale = (_canvas.width / b.width).clamp(0.4, 2.0).toDouble();
    final fitted =
        scale < (_canvas.height / b.height) ? scale : (_canvas.height / b.height).clamp(0.4, 2.0).toDouble();
    setState(() {
      _scale = fitted;
      _pan = Offset(
        _canvas.width / 2 - (b.x + b.width / 2) * fitted,
        _canvas.height / 2 - (b.y + b.height / 2) * fitted,
      );
    });
  }

  Offset _toCanvas(Offset local) => (local - _pan) / _scale;

  FlowNodeData? _hitTest(Offset point) {
    // 从后往前找：后画的节点在上面，点击应当命中它
    for (final node in widget.nodes.reversed) {
      final rect = Rect.fromLTWH(node.x, node.y, node.width, node.height);
      if (rect.contains(point)) return node;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    return Container(
      height: widget.height,
      decoration: BoxDecoration(
        color: c.bg,
        border: Border.all(color: c.border),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      clipBehavior: Clip.antiAlias,
      child: LayoutBuilder(
        builder: (context, constraints) {
          _canvas = Size(constraints.maxWidth, constraints.maxHeight);
          return Stack(
            children: [
              GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTapDown: (d) {
                  final node = _hitTest(_toCanvas(d.localPosition));
                  widget.onSelect?.call(node?.id);
                },
                onPanStart: (d) {
                  final node = _hitTest(_toCanvas(d.localPosition));
                  if (node == null || widget.readOnly) {
                    _dragId = null;
                    return;
                  }
                  _dragId = node.id;
                  _dragDelta = _toCanvas(d.localPosition) - Offset(node.x, node.y);
                  widget.onSelect?.call(node.id);
                },
                onPanUpdate: (d) {
                  if (_dragId == null) {
                    setState(() => _pan += d.delta);
                    return;
                  }
                  final point = _toCanvas(d.localPosition) - _dragDelta;
                  // 吸附到 8 的倍数：手绘位置总差几像素，对齐后整张图才整齐
                  widget.onMove?.call(
                    _dragId!,
                    (point.dx / 8).round() * 8,
                    (point.dy / 8).round() * 8,
                  );
                },
                onPanEnd: (_) => _dragId = null,
                child: CustomPaint(
                  size: Size.infinite,
                  painter: _FlowPainter(
                    nodes: widget.nodes,
                    edges: widget.edges,
                    selected: widget.selected,
                    pan: _pan,
                    scale: _scale,
                    colors: c,
                  ),
                ),
              ),
              Positioned(
                right: IDesignTokensLight.spacing3,
                bottom: IDesignTokensLight.spacing3,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: c.bgElevated,
                    border: Border.all(color: c.border),
                    borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _tool('minus', '缩小', () => setState(() => _scale = (_scale - 0.2).clamp(0.4, 2.0))),
                      SizedBox(
                        width: 46,
                        child: Text(
                          '${(_scale * 100).round()}%',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: c.textTertiary,
                            fontSize: IDesignTokensLight.fontSizeXs,
                          ),
                        ),
                      ),
                      _tool('plus', '放大', () => setState(() => _scale = (_scale + 0.2).clamp(0.4, 2.0))),
                      _tool('grid', '适应画布', _fit),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _tool(String icon, String label, VoidCallback onTap) => InkWell(
        onTap: onTap,
        child: SizedBox(
          width: 30,
          height: 30,
          child: Center(child: IIcon(icon, size: 14, semanticLabel: label)),
        ),
      );
}

class _FlowPainter extends CustomPainter {
  const _FlowPainter({
    required this.nodes,
    required this.edges,
    required this.selected,
    required this.pan,
    required this.scale,
    required this.colors,
  });

  final List<FlowNodeData> nodes;
  final List<FlowEdgeData> edges;
  final String? selected;
  final Offset pan;
  final double scale;
  final IColors colors;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.translate(pan.dx, pan.dy);
    canvas.scale(scale);

    final byId = {for (final n in nodes) n.id: n};

    for (final edge in edges) {
      final from = byId[edge.from];
      final to = byId[edge.to];
      if (from == null || to == null) continue;
      final active = selected != null && (edge.from == selected || edge.to == selected);
      final paint = Paint()
        ..color = active ? colors.brand : colors.borderStrong
        ..style = PaintingStyle.stroke
        ..strokeWidth = active ? 2 : 1.5;

      final a = anchorOf(from, to.x + to.width / 2, to.y + to.height / 2);
      final b = anchorOf(to, from.x + from.width / 2, from.y + from.height / 2);

      // 直角折线：斜线穿过其他节点时难辨走向
      final path = Path()..moveTo(a.x, a.y);
      if (a.side == 'bottom' || a.side == 'top') {
        final midY = (a.y + b.y) / 2;
        path.lineTo(a.x, midY);
        path.lineTo(b.x, midY);
      } else {
        final midX = a.side == 'right'
            ? (a.x + 18 > (a.x + b.x) / 2 ? a.x + 18 : (a.x + b.x) / 2)
            : (a.x - 18 < (a.x + b.x) / 2 ? a.x - 18 : (a.x + b.x) / 2);
        path.lineTo(midX, a.y);
        path.lineTo(midX, b.y);
      }
      path.lineTo(b.x, b.y);
      canvas.drawPath(path, paint);
      _arrow(canvas, Offset(b.x, b.y), b.side, paint.color);

      if (edge.label != null) {
        _label(canvas, edge.label!, Offset((a.x + b.x) / 2, (a.y + b.y) / 2));
      }
    }

    for (final node in nodes) {
      final isSelected = node.id == selected;
      final rect = Rect.fromLTWH(node.x, node.y, node.width, node.height);
      final fill = switch (node.type) {
        'start' => colors.brandSubtle,
        'end' => colors.successSubtle,
        'decision' => colors.warningSubtle,
        _ => colors.bgElevated,
      };
      final stroke = switch (node.type) {
        'start' => colors.brand,
        'end' => colors.success,
        'decision' => colors.warning,
        _ => colors.borderStrong,
      };

      final path = Path();
      if (node.type == 'decision') {
        path.moveTo(rect.center.dx, rect.top);
        path.lineTo(rect.right, rect.center.dy);
        path.lineTo(rect.center.dx, rect.bottom);
        path.lineTo(rect.left, rect.center.dy);
        path.close();
      } else {
        final radius = node.type == 'start' || node.type == 'end' ? node.height / 2 : 8.0;
        path.addRRect(RRect.fromRectAndRadius(rect, Radius.circular(radius)));
      }

      canvas.drawPath(path, Paint()..color = fill);
      canvas.drawPath(
        path,
        Paint()
          ..color = isSelected ? colors.brand : stroke
          ..style = PaintingStyle.stroke
          ..strokeWidth = isSelected ? 2 : 1.5,
      );

      _text(canvas, node.label, rect.center, colors.text, 13, bold: false);
    }

    canvas.restore();
  }

  void _arrow(Canvas canvas, Offset tip, String side, Color color) {
    const s = 5.0;
    final path = Path()..moveTo(tip.dx, tip.dy);
    switch (side) {
      case 'left':
        path.lineTo(tip.dx - s * 1.6, tip.dy - s);
        path.lineTo(tip.dx - s * 1.6, tip.dy + s);
      case 'right':
        path.lineTo(tip.dx + s * 1.6, tip.dy - s);
        path.lineTo(tip.dx + s * 1.6, tip.dy + s);
      case 'top':
        path.lineTo(tip.dx - s, tip.dy - s * 1.6);
        path.lineTo(tip.dx + s, tip.dy - s * 1.6);
      default:
        path.lineTo(tip.dx - s, tip.dy + s * 1.6);
        path.lineTo(tip.dx + s, tip.dy + s * 1.6);
    }
    path.close();
    canvas.drawPath(path, Paint()..color = color);
  }

  void _label(Canvas canvas, String text, Offset at) {
    final painter = TextPainter(
      text: TextSpan(text: text, style: TextStyle(color: colors.textTertiary, fontSize: 11)),
      textDirection: TextDirection.ltr,
    )..layout();
    // 标签底下垫一块底色：不垫的话线会从字中间穿过去
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(center: at, width: painter.width + 8, height: painter.height + 4),
        const Radius.circular(3),
      ),
      Paint()..color = colors.bg,
    );
    painter.paint(canvas, at - Offset(painter.width / 2, painter.height / 2));
  }

  void _text(Canvas canvas, String text, Offset center, Color color, double size, {bool bold = false}) {
    final painter = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: color,
          fontSize: size,
          fontWeight: bold ? FontWeight.w600 : FontWeight.w400,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    painter.paint(canvas, center - Offset(painter.width / 2, painter.height / 2));
  }

  @override
  bool shouldRepaint(_FlowPainter old) =>
      old.nodes != nodes ||
      old.selected != selected ||
      old.pan != pan ||
      old.scale != scale ||
      old.colors != colors;
}
