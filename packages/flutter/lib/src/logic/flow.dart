/// 流程图几何计算的 Dart 移植（对应 packages/common/src/logic/flow.ts）。
///
/// 连线走向与自动分层必须与 Web 端一致，否则同一张流程图在两端上绕法不同。
library;

import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart' show Offset, Rect, Size;

const double kFlowNodeWidth = 132;
const double kFlowNodeHeight = 48;

@immutable
class FlowNodeData {
  const FlowNodeData({
    required this.id,
    required this.label,
    this.x = 0,
    this.y = 0,
    this.width = kFlowNodeWidth,
    this.height = kFlowNodeHeight,
    this.type = 'process',
  });

  final String id;
  final String label;
  final double x;
  final double y;
  final double width;
  final double height;

  /// start / process / decision / end：形状承担语义
  final String type;

  FlowNodeData copyWith({double? x, double? y, double? width, double? height}) =>
      FlowNodeData(
        id: id,
        label: label,
        x: x ?? this.x,
        y: y ?? this.y,
        width: width ?? this.width,
        height: height ?? this.height,
        type: type,
      );
}

@immutable
/// 连线走向：正交折线（默认）／直连／贝塞尔曲线
enum FlowEdgeType { polyline, straight, bezier }

class FlowEdgeData {
  const FlowEdgeData({required this.from, required this.to, this.label, this.type});

  final String from;
  final String to;
  final String? label;

  /// 单条连线可以覆盖整图的默认走向
  final FlowEdgeType? type;
}

/// 端点沿所在边的法线向外推：控制点必须在节点外侧，否则曲线会穿回节点里
({double x, double y}) offsetBySide(double x, double y, String side, double distance) {
  switch (side) {
    case 'left':
      return (x: x - distance, y: y);
    case 'right':
      return (x: x + distance, y: y);
    case 'top':
      return (x: x, y: y - distance);
    default:
      return (x: x, y: y + distance);
  }
}

/// 贝塞尔控制点的外推距离：取两端点间距的一半并设上下限，
/// 距离近时不甩出大圈，距离远时也仍有明显弧度
double bezierPush(double ax, double ay, double bx, double by) {
  final dist = math.sqrt(math.pow(bx - ax, 2) + math.pow(by - ay, 2));
  return math.min(120, math.max(32, dist / 2));
}

/// 连线端点吸附到节点边缘中点，而不是中心——连到中心箭头会钻进节点里
({double x, double y, String side}) anchorOf(FlowNodeData node, double towardX, double towardY) {
  final cx = node.x + node.width / 2;
  final cy = node.y + node.height / 2;
  final dx = towardX - cx;
  final dy = towardY - cy;

  if (dx.abs() * node.height > dy.abs() * node.width) {
    return (x: dx > 0 ? node.x + node.width : node.x, y: cy, side: dx > 0 ? 'right' : 'left');
  }
  return (x: cx, y: dy > 0 ? node.y + node.height : node.y, side: dy > 0 ? 'bottom' : 'top');
}

/// 自动分层：从入口出发求最长路径，跳过回边。
///
/// 「驳回 → 重新填写」是回边；顺着它继续推深度，整张图会一层层往下漂。
List<FlowNodeData> autoLayout(
  List<FlowNodeData> nodes,
  List<FlowEdgeData> edges, {
  double gapX = 190,
  double gapY = 92,
}) {
  final outgoing = <String, List<String>>{};
  final incoming = <String, List<String>>{};
  for (final n in nodes) {
    outgoing[n.id] = [];
    incoming[n.id] = [];
  }
  for (final e in edges) {
    outgoing[e.from]?.add(e.to);
    incoming[e.to]?.add(e.from);
  }

  final depth = {for (final n in nodes) n.id: 0};
  final roots = nodes.where((n) => (incoming[n.id] ?? []).isEmpty).map((n) => n.id).toList();
  final stack = <({String id, int d, Set<String> path})>[
    for (final id in (roots.isNotEmpty ? roots : [nodes.first.id])) (id: id, d: 0, path: {id})
  ];

  var steps = 0;
  while (stack.isNotEmpty && steps++ < 20000) {
    final item = stack.removeLast();
    if (item.d > (depth[item.id] ?? 0)) depth[item.id] = item.d;
    for (final next in outgoing[item.id] ?? const <String>[]) {
      if (item.path.contains(next)) continue;
      stack.add((id: next, d: item.d + 1, path: {...item.path, next}));
    }
  }

  final layers = <int, List<String>>{};
  for (final n in nodes) {
    layers.putIfAbsent(depth[n.id] ?? 0, () => []).add(n.id);
  }

  return nodes.map((n) {
    final d = depth[n.id] ?? 0;
    final row = layers[d] ?? const <String>[];
    final index = row.indexOf(n.id);
    final offset = (index - (row.length - 1) / 2) * gapX;
    return n.copyWith(x: 240 + offset, y: 40 + d * gapY);
  }).toList();
}

/// 所有节点的包围盒，用于「适应画布」
({double x, double y, double width, double height}) boundsOf(
  List<FlowNodeData> nodes, {
  double padding = 40,
}) {
  if (nodes.isEmpty) return (x: 0, y: 0, width: 1, height: 1);
  final x = nodes.map((n) => n.x).reduce(math.min) - padding;
  final y = nodes.map((n) => n.y).reduce(math.min) - padding;
  final right = nodes.map((n) => n.x + n.width).reduce(math.max) + padding;
  final bottom = nodes.map((n) => n.y + n.height).reduce(math.max) + padding;
  return (x: x, y: y, width: right - x, height: bottom - y);
}

/* ---------- 框选 ---------- */

/// 由按下点与当前点算出框选矩形。
///
/// 两点顺序不做要求：往左上拖也是合法的框选，
/// 不归一化的话宽高会变成负数，命中判定与描边都会失效。
Rect marqueeRect(Offset a, Offset b) => Rect.fromLTRB(
      math.min(a.dx, b.dx),
      math.min(a.dy, b.dy),
      math.max(a.dx, b.dx),
      math.max(a.dy, b.dy),
    );

/// 框选命中的节点。
///
/// 默认 contain（整个节点都在框内才算中）而不是 intersect：
/// 相交判定下，框边缘扫过的节点会被顺手选中，
/// 用户拖框经过一个节点却没打算选它，是最常见的误操作。
List<String> nodesInRect(
  List<FlowNodeData> nodes,
  Rect rect, {
  bool intersect = false,
}) =>
    nodes
        .where((node) {
          final box = Rect.fromLTWH(node.x, node.y, node.width, node.height);
          if (intersect) return box.overlaps(rect);
          // 不用 Rect.contains：它对右边与下边是开区间，
          // 一个正好贴着框边的节点在 Web 端算选中、在这里算没选中
          return box.left >= rect.left &&
              box.top >= rect.top &&
              box.right <= rect.right &&
              box.bottom <= rect.bottom;
        })
        .map((node) => node.id)
        .toList();

/// 批量移动：整组一起吸附，而不是各自吸附。
///
/// 逐个吸附会把组里原本的相对间距抹平——两个相距 12px 的节点，
/// 各自对齐到 8 格后可能变成 8px 或 16px，一次批量移动就把手工排好的版毁了。
/// 因此位移量本身吸附一次，组内所有节点用同一个位移。
List<FlowNodeData> moveNodes(
  List<FlowNodeData> nodes,
  Set<String> ids,
  Offset delta, {
  double grid = 8,
}) {
  final dx = grid > 0 ? (delta.dx / grid).round() * grid : delta.dx;
  final dy = grid > 0 ? (delta.dy / grid).round() * grid : delta.dy;
  return nodes
      .where((node) => ids.contains(node.id))
      .map((node) => node.copyWith(x: node.x + dx, y: node.y + dy))
      .toList();
}

/* ---------- 节点缩放 ---------- */

/// 缩放手柄的位置。只放四个角：边中点手柄在小节点上会和角手柄挤在一起
enum FlowResizeHandle { nw, ne, se, sw }

const double kFlowMinNodeWidth = 72;
const double kFlowMinNodeHeight = 32;

/// 拖动某个角把节点缩放到指针位置。
///
/// 对角固定不动：拖右下角时左上角不该跟着跑，否则节点会一边变大一边平移，
/// 手感像在拖整个节点而不是在改尺寸。
/// 尺寸下限之外还要夹住位置——只夹尺寸的话，拖过头时节点会继续往反方向滑。
Rect resizeNode(
  FlowNodeData node,
  FlowResizeHandle handle,
  Offset point, {
  double grid = 8,
  double minWidth = kFlowMinNodeWidth,
  double minHeight = kFlowMinNodeHeight,
}) {
  double snap(double v) => grid > 0 ? (v / grid).round() * grid : v;
  final west = handle == FlowResizeHandle.nw || handle == FlowResizeHandle.sw;
  final north = handle == FlowResizeHandle.nw || handle == FlowResizeHandle.ne;

  // 固定对角，另一角跟指针走
  final anchorX = west ? node.x + node.width : node.x;
  final anchorY = north ? node.y + node.height : node.y;
  var movingX = snap(point.dx);
  var movingY = snap(point.dy);

  movingX = west ? math.min(movingX, anchorX - minWidth) : math.max(movingX, anchorX + minWidth);
  movingY = north ? math.min(movingY, anchorY - minHeight) : math.max(movingY, anchorY + minHeight);

  return Rect.fromLTWH(
    math.min(anchorX, movingX),
    math.min(anchorY, movingY),
    (anchorX - movingX).abs(),
    (anchorY - movingY).abs(),
  );
}

/* ---------- 缩略图 ---------- */

@immutable
class FlowView {
  const FlowView({this.x = 0, this.y = 0, this.scale = 1});
  final double x;
  final double y;
  final double scale;

  FlowView copyWith({double? x, double? y, double? scale}) =>
      FlowView(x: x ?? this.x, y: y ?? this.y, scale: scale ?? this.scale);
}

@immutable
class MinimapLayout {
  const MinimapLayout({
    required this.scale,
    required this.offset,
    required this.viewport,
  });

  /// 画布坐标 → 缩略图坐标的缩放比
  final double scale;

  /// 缩略图内的居中偏移
  final Offset offset;

  /// 当前视口对应到缩略图上的取景框
  final Rect viewport;
}

/// 缩略图布局。
///
/// 横纵取较小的比例并居中，而不是各自拉伸：分别缩放会让缩略图里的节点
/// 与主画布长宽比不同，那样缩略图就不再是同一张图的缩小版，指路作用也就没了。
MinimapLayout minimapLayout(
  List<FlowNodeData> nodes,
  FlowView view,
  Size canvas,
  Size minimap, {
  double padding = 40,
}) {
  final bounds = boundsOf(nodes, padding: padding);
  final scale = math.min(minimap.width / bounds.width, minimap.height / bounds.height);
  final offsetX = (minimap.width - bounds.width * scale) / 2 - bounds.x * scale;
  final offsetY = (minimap.height - bounds.height * scale) / 2 - bounds.y * scale;

  // 视口在画布坐标里的位置：屏幕原点反算回去，再按缩略图比例投影
  final viewX = -view.x / view.scale;
  final viewY = -view.y / view.scale;
  return MinimapLayout(
    scale: scale,
    offset: Offset(offsetX, offsetY),
    viewport: Rect.fromLTWH(
      viewX * scale + offsetX,
      viewY * scale + offsetY,
      (canvas.width / view.scale) * scale,
      (canvas.height / view.scale) * scale,
    ),
  );
}

/// 点击缩略图某处，算出让该点居中所需的主画布视图。
///
/// 这是 minimapLayout 的逆运算——缩略图上点一下就跳过去，
/// 是大图导航里唯一比反复拖画布快的操作。
FlowView viewFromMinimap(
  Offset point,
  MinimapLayout layout,
  FlowView view,
  Size canvas,
) {
  final canvasX = (point.dx - layout.offset.dx) / layout.scale;
  final canvasY = (point.dy - layout.offset.dy) / layout.scale;
  return FlowView(
    scale: view.scale,
    x: canvas.width / 2 - canvasX * view.scale,
    y: canvas.height / 2 - canvasY * view.scale,
  );
}

/// 导出用的包围盒：包住全部节点，与当前视口无关。
///
/// 导出的是「这张图」，不是「我现在看到的这一块」——
/// 按当前视口导出，用户拿到的图会缺掉他没滚动到的部分，而他并不会察觉。
Rect snapshotViewBox(List<FlowNodeData> nodes, {double padding = 24}) {
  final b = boundsOf(nodes, padding: padding);
  return Rect.fromLTWH(b.x, b.y, b.width, b.height);
}
