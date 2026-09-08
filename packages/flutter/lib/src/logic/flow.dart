/// 流程图几何计算的 Dart 移植（对应 packages/common/src/logic/flow.ts）。
///
/// 连线走向与自动分层必须与 Web 端一致，否则同一张流程图在两端上绕法不同。
library;

import 'dart:math' as math;

import 'package:flutter/foundation.dart';

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

  FlowNodeData copyWith({double? x, double? y}) => FlowNodeData(
        id: id,
        label: label,
        x: x ?? this.x,
        y: y ?? this.y,
        width: width,
        height: height,
        type: type,
      );
}

@immutable
class FlowEdgeData {
  const FlowEdgeData({required this.from, required this.to, this.label});

  final String from;
  final String to;
  final String? label;
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
