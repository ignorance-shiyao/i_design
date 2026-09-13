import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
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
    this.selection = const <String>[],
    this.onSelectionChanged,
    this.onMove,
    this.edgeType = FlowEdgeType.polyline,
    this.onExport,
  });

  final List<FlowNodeData> nodes;
  final List<FlowEdgeData> edges;
  final double height;

  /// 只读：仍可平移缩放与选中，但不能拖动、缩放节点
  final bool readOnly;

  /// 选中的节点 id。单选也是长度为 1 的列表——两套选中状态迟早会对不上
  final List<String> selection;
  final ValueChanged<List<String>>? onSelectionChanged;

  /// 拖动或缩放结束抛出一组新几何；组件不改传入的数据
  final void Function(List<FlowNodeData> changes)? onMove;

  /// 整图默认连线走向；单条连线可用 FlowEdgeData.type 覆盖
  final FlowEdgeType edgeType;

  /// 导出快照后拿到 PNG 字节；存盘还是分享由调用方决定
  final ValueChanged<Uint8List>? onExport;

  @override
  State<IFlow> createState() => _IFlowState();
}

const Size _kMinimap = Size(120, 80);
/// 手柄在屏幕上的半径。触摸的命中区要比画出来的大，手指没有指针那么准
const double _kHandleRadius = 5;
const double _kHandleTouchRadius = 14;

class _IFlowState extends State<IFlow> {
  final GlobalKey _boundary = GlobalKey();
  Offset _pan = Offset.zero;
  double _scale = 1;
  /// 拖动时的对齐辅助线。松手就清空——它是操作时的提示，不是图的一部分
  List<IFlowGuide> _guides = const [];
  Size _canvas = Size.zero;

  /// 一次拖动涉及的整组节点与它们按下时的几何
  List<String> _dragIds = const <String>[];
  List<FlowNodeData> _dragBase = const <FlowNodeData>[];
  Offset _dragFrom = Offset.zero;
  ({String id, FlowResizeHandle handle})? _resizing;
  ({Offset from, Offset to})? _marquee;

  /// 触摸端没有 Shift 键，框选只能做成一个显式开关。
  /// 长按进入框选也是一种选择，但那样「想平移却按久了」就会莫名画出选框。
  bool _marqueeMode = false;
  bool _showMinimap = true;

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

  Set<String> get _selected => widget.selection.toSet();

  /// 恰好选中一个节点时四角才有手柄：多选时拖角改的是哪一个并不清楚
  FlowNodeData? get _resizeTarget {
    if (widget.readOnly || widget.selection.length != 1) return null;
    for (final node in widget.nodes) {
      if (node.id == widget.selection.first) return node;
    }
    return null;
  }

  List<({FlowResizeHandle handle, Offset at})> _handlePoints(FlowNodeData n) => [
        (handle: FlowResizeHandle.nw, at: Offset(n.x, n.y)),
        (handle: FlowResizeHandle.ne, at: Offset(n.x + n.width, n.y)),
        (handle: FlowResizeHandle.se, at: Offset(n.x + n.width, n.y + n.height)),
        (handle: FlowResizeHandle.sw, at: Offset(n.x, n.y + n.height)),
      ];

  ({String id, FlowResizeHandle handle})? _hitHandle(Offset point) {
    final node = _resizeTarget;
    if (node == null) return null;
    // 命中半径按屏幕像素折算回画布：缩小后手柄看起来更小，手指却没变细
    final r = _kHandleTouchRadius / _scale;
    for (final h in _handlePoints(node)) {
      if ((point.dx - h.at.dx).abs() <= r && (point.dy - h.at.dy).abs() <= r) {
        return (id: node.id, handle: h.handle);
      }
    }
    return null;
  }

  MinimapLayout? get _minimap {
    if (_canvas == Size.zero || widget.nodes.isEmpty) return null;
    return minimapLayout(
      widget.nodes,
      FlowView(x: _pan.dx, y: _pan.dy, scale: _scale),
      _canvas,
      _kMinimap,
    );
  }

  /// 导出快照。
  ///
  /// 走 RepaintBoundary 而不是自己再画一遍：再画一遍就有了第二份绘制代码，
  /// 改了画布却忘了改导出，两边迟早对不上，而且没有任何检查会发现。
  /// 导出前先把选框、手柄、缩略图这些编辑器界面件收起来——
  /// 它们不是图的一部分，留在图里等于把工具条一起交给用户。
  Future<void> _export() async {
    final callback = widget.onExport;
    if (callback == null) return;
    setState(() {
      _marquee = null;
      _showMinimap = false;
    });
    // 等一帧，让上面的收起真正画出去，否则截到的还是带界面件的旧帧
    await WidgetsBinding.instance.endOfFrame;
    final object = _boundary.currentContext?.findRenderObject();
    if (object is RenderRepaintBoundary) {
      final image = await object.toImage(pixelRatio: 2);
      final data = await image.toByteData(format: ui.ImageByteFormat.png);
      if (data != null) callback(data.buffer.asUint8List());
    }
    if (mounted) setState(() => _showMinimap = true);
  }

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
                  // 缩略图压在画布上，点它是导航而不是选节点，要先判定
                  final layout = _minimap;
                  if (_showMinimap && layout != null) {
                    final local = d.localPosition -
                        const Offset(IDesignTokensLight.spacing3, IDesignTokensLight.spacing3);
                    if (local.dx >= 0 &&
                        local.dy >= 0 &&
                        local.dx <= _kMinimap.width &&
                        local.dy <= _kMinimap.height) {
                      final next = viewFromMinimap(
                        local,
                        layout,
                        FlowView(x: _pan.dx, y: _pan.dy, scale: _scale),
                        _canvas,
                      );
                      setState(() => _pan = Offset(next.x, next.y));
                      return;
                    }
                  }
                  final node = _hitTest(_toCanvas(d.localPosition));
                  widget.onSelectionChanged?.call(node == null ? const [] : [node.id]);
                },
                onPanStart: (d) {
                  final point = _toCanvas(d.localPosition);

                  // 手柄压在节点角上，必须先于节点判定，否则永远抓不到
                  final handle = _hitHandle(point);
                  if (handle != null) {
                    _resizing = handle;
                    return;
                  }

                  final node = _hitTest(point);
                  if (_marqueeMode && node == null) {
                    setState(() => _marquee = (from: point, to: point));
                    return;
                  }
                  if (node == null || widget.readOnly) {
                    _dragIds = const [];
                    return;
                  }
                  // 点已在选中集合里的节点不清空选择，否则批量拖动第一下就把组拆了
                  final ids = _selected.contains(node.id) ? widget.selection : [node.id];
                  widget.onSelectionChanged?.call(ids);
                  _dragIds = ids;
                  _dragFrom = point;
                  _dragBase = widget.nodes.where((n) => ids.contains(n.id)).toList();
                },
                onPanUpdate: (d) {
                  final point = _toCanvas(d.localPosition);

                  if (_marquee != null) {
                    setState(() => _marquee = (from: _marquee!.from, to: point));
                    return;
                  }

                  if (_resizing != null) {
                    final node = widget.nodes.firstWhere((n) => n.id == _resizing!.id);
                    final box = resizeNode(node, _resizing!.handle, point);
                    widget.onMove?.call([
                      node.copyWith(x: box.left, y: box.top, width: box.width, height: box.height),
                    ]);
                    return;
                  }

                  if (_dragIds.isEmpty) {
                    setState(() => _pan += d.delta);
                    return;
                  }
                  /*
                   * 位移量整体吸附一次：逐个吸附会把组内原本的相对间距抹平。
                   *
                   * 对齐优先于网格：两者都是吸附，但网格吸的是「整齐」，
                   * 对齐吸的是「和那一个对上」——后者才是用户此刻在做的事。
                   * 先按网格吸的话，节点只能落在 8 的倍数上，中间那几像素到不了，
                   * 辅助线也就永远不出现。
                   */
                  final delta = point - _dragFrom;
                  final free = moveNodes(_dragBase, _dragIds.toSet(), delta, grid: 0);
                  final grid = moveNodes(_dragBase, _dragIds.toSet(), delta);
                  final picked = _dragIds.toSet();
                  final anchor = free.isEmpty ? null : free.first;
                  final aligned = anchor == null
                      ? const IFlowAlignment(dx: 0, dy: 0, guides: [])
                      : alignGuides(
                          anchor,
                          [for (final n in widget.nodes) if (!picked.contains(n.id)) n],
                          threshold: 6 / _scale,
                        );
                  setState(() => _guides = aligned.guides);

                  final onX = aligned.guides
                      .any((g) => g.orientation == IFlowGuideOrientation.vertical);
                  final onY = aligned.guides
                      .any((g) => g.orientation == IFlowGuideOrientation.horizontal);
                  widget.onMove?.call([
                    for (var i = 0; i < free.length; i++)
                      free[i].copyWith(
                        x: onX ? free[i].x + aligned.dx : grid[i].x,
                        y: onY ? free[i].y + aligned.dy : grid[i].y,
                      ),
                  ]);
                },
                onPanEnd: (_) {
                  if (_marquee != null) {
                    final rect = marqueeRect(_marquee!.from, _marquee!.to);
                    // 只有拖出了实际面积才当作框选：原地一点应当理解为「取消选中」
                    widget.onSelectionChanged?.call(
                      rect.width > 4 && rect.height > 4 ? nodesInRect(widget.nodes, rect) : const [],
                    );
                    setState(() => _marquee = null);
                  }
                  _dragIds = const [];
                  _resizing = null;
                  // 辅助线是拖动时的提示，松手就清空
                  setState(() => _guides = const []);
                },
                child: RepaintBoundary(
                  key: _boundary,
                  child: CustomPaint(
                    size: Size.infinite,
                    painter: _FlowPainter(
                      nodes: widget.nodes,
                      edges: widget.edges,
                      selected: _selected,
                      edgeType: widget.edgeType,
                      pan: _pan,
                      scale: _scale,
                      colors: c,
                      marquee: _marquee == null ? null : marqueeRect(_marquee!.from, _marquee!.to),
                      handles: _resizeTarget == null
                          ? const []
                          : _handlePoints(_resizeTarget!).map((h) => h.at).toList(),
                      guides: _guides,
                      minimap: _showMinimap ? _minimap : null,
                      minimapSize: _kMinimap,
                      minimapOrigin: const Offset(
                        IDesignTokensLight.spacing3,
                        IDesignTokensLight.spacing3,
                      ),
                    ),
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
                      if (!widget.readOnly)
                        _tool('marquee', '框选', () => setState(() => _marqueeMode = !_marqueeMode),
                            on: _marqueeMode, colors: c),
                      _tool('minimap', '缩略图', () => setState(() => _showMinimap = !_showMinimap),
                          on: _showMinimap, colors: c),
                      if (widget.onExport != null) _tool('download', '导出快照', _export),
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

  /// 开关型按钮的按下态用淡底色块，而不是给按钮加一条重边线
  Widget _tool(String icon, String label, VoidCallback onTap, {bool on = false, IColors? colors}) =>
      InkWell(
        onTap: onTap,
        child: Container(
          width: 30,
          height: 30,
          decoration: on && colors != null
              ? BoxDecoration(
                  color: colors.brandSubtle,
                  borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
                )
              : null,
          child: Center(
            child: IIcon(
              icon,
              size: 14,
              semanticLabel: label,
              color: on && colors != null ? colors.brand : null,
            ),
          ),
        ),
      );
}

class _FlowPainter extends CustomPainter {
  const _FlowPainter({
    required this.nodes,
    required this.edges,
    required this.selected,
    required this.edgeType,
    required this.pan,
    required this.scale,
    required this.colors,
    required this.marquee,
    required this.handles,
    required this.guides,
    required this.minimap,
    required this.minimapSize,
    required this.minimapOrigin,
  });

  final List<FlowNodeData> nodes;
  final List<FlowEdgeData> edges;
  final Set<String> selected;
  final FlowEdgeType edgeType;
  final Offset pan;
  final double scale;
  final IColors colors;

  /// 编辑器界面件。导出快照时它们为 null / 空，图里就不会混进工具
  final Rect? marquee;
  final List<Offset> handles;
  final List<IFlowGuide> guides;
  final MinimapLayout? minimap;
  final Size minimapSize;
  final Offset minimapOrigin;

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
      final active = selected.contains(edge.from) || selected.contains(edge.to);
      final paint = Paint()
        ..color = active ? colors.brand : colors.borderStrong
        ..style = PaintingStyle.stroke
        ..strokeWidth = active ? 2 : 1.5;

      final a = anchorOf(from, to.x + to.width / 2, to.y + to.height / 2);
      final b = anchorOf(to, from.x + from.width / 2, from.y + from.height / 2);

      final kind = edge.type ?? edgeType;
      final path = Path()..moveTo(a.x, a.y);
      var labelAt = Offset((a.x + b.x) / 2, (a.y + b.y) / 2);

      if (kind == FlowEdgeType.straight) {
        path.lineTo(b.x, b.y);
      } else if (kind == FlowEdgeType.bezier) {
        final push = bezierPush(a.x, a.y, b.x, b.y);
        final c1 = offsetBySide(a.x, a.y, a.side, push);
        final c2 = offsetBySide(b.x, b.y, b.side, push);
        path.cubicTo(c1.x, c1.y, c2.x, c2.y, b.x, b.y);
        // 标签取 t=0.5 的曲线点：弧度大时两端点中点会离曲线很远
        labelAt = Offset(
          (a.x + 3 * c1.x + 3 * c2.x + b.x) / 8,
          (a.y + 3 * c1.y + 3 * c2.y + b.y) / 8,
        );
      } else {
        // 直角折线：斜线穿过其他节点时难辨走向
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
      }
      canvas.drawPath(path, paint);
      _arrow(canvas, Offset(b.x, b.y), b.side, paint.color);

      if (edge.label != null) {
        _label(canvas, edge.label!, labelAt);
      }
    }

    for (final node in nodes) {
      final isSelected = selected.contains(node.id);
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

    // 手柄画在所有节点之上：压在下面会被相邻节点盖住，抓不到
    for (final at in handles) {
      final r = _kHandleRadius / scale;
      final box = Rect.fromCenter(center: at, width: r * 2, height: r * 2);
      canvas.drawRRect(
        RRect.fromRectAndRadius(box, Radius.circular(2 / scale)),
        Paint()..color = colors.bgElevated,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(box, Radius.circular(2 / scale)),
        Paint()
          ..color = colors.brand
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.5 / scale,
      );
    }

    if (marquee != null) {
      // 淡填充加虚线描边：只描边的话看不出框盖住了哪些节点
      canvas.drawRect(marquee!, Paint()..color = colors.brand.withValues(alpha: 0.08));
      _dashedRect(canvas, marquee!, colors.brand, 1 / scale, 4 / scale, 3 / scale);
    }

    /*
     * 对齐辅助线。虚线而不是实线：实线会和真正的连线混在一起，
     * 读者要多看一眼才知道那不是图的一部分。
     */
    for (final guide in guides) {
      final vertical = guide.orientation == IFlowGuideOrientation.vertical;
      _dashedLine(
        canvas,
        vertical ? Offset(guide.at, guide.from) : Offset(guide.from, guide.at),
        vertical ? Offset(guide.at, guide.to) : Offset(guide.to, guide.at),
        colors.brand,
        1 / scale,
        4 / scale,
        3 / scale,
      );
    }

    canvas.restore();

    if (minimap != null) _paintMinimap(canvas);
  }

  /// 缩略图画在同一块画布上：只为几个小方块再挂一层 CustomPaint 并不划算
  void _paintMinimap(Canvas canvas) {
    final layout = minimap!;
    canvas.save();
    canvas.translate(minimapOrigin.dx, minimapOrigin.dy);
    final frame = Rect.fromLTWH(0, 0, minimapSize.width, minimapSize.height);
    // 裁掉溢出：视口比整图大时取景框会伸到缩略图外面，看起来像画歪了
    canvas.clipRect(frame);
    canvas.drawRect(frame, Paint()..color = colors.bgElevated.withValues(alpha: 0.88));

    for (final node in nodes) {
      canvas.drawRect(
        Rect.fromLTWH(
          node.x * layout.scale + layout.offset.dx,
          node.y * layout.scale + layout.offset.dy,
          node.width * layout.scale,
          node.height * layout.scale,
        ),
        Paint()..color = selected.contains(node.id) ? colors.brand : colors.borderStrong,
      );
    }

    // 取景框只描边不填充：填了就看不见它盖住的是哪几个节点
    canvas.drawRect(
      layout.viewport,
      Paint()
        ..color = colors.brand
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5,
    );
    canvas.restore();

    canvas.drawRect(
      frame.shift(minimapOrigin),
      Paint()
        ..color = colors.border
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1,
    );
  }

  /// Flutter 没有 strokeDasharray，虚线只能自己按段画
  void _dashedRect(Canvas canvas, Rect rect, Color color, double width, double dash, double gap) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = width;
    final metrics = (Path()..addRect(rect)).computeMetrics();
    for (final metric in metrics) {
      var start = 0.0;
      while (start < metric.length) {
        final end = start + dash < metric.length ? start + dash : metric.length;
        canvas.drawPath(metric.extractPath(start, end), paint);
        start = end + gap;
      }
    }
  }

  /// 画一段虚线。与 `_dashedRect` 同一套步进，虚线的节奏才一致
  void _dashedLine(
    Canvas canvas,
    Offset from,
    Offset to,
    Color color,
    double width,
    double dash,
    double gap,
  ) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = width;
    final metrics = (Path()
          ..moveTo(from.dx, from.dy)
          ..lineTo(to.dx, to.dy))
        .computeMetrics();
    for (final metric in metrics) {
      var start = 0.0;
      while (start < metric.length) {
        final end = start + dash < metric.length ? start + dash : metric.length;
        canvas.drawPath(metric.extractPath(start, end), paint);
        start = end + gap;
      }
    }
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
      old.marquee != marquee ||
      old.handles != handles ||
      old.guides != guides ||
      old.minimap != minimap ||
      old.edgeType != edgeType ||
      old.pan != pan ||
      old.scale != scale ||
      old.colors != colors;
}
