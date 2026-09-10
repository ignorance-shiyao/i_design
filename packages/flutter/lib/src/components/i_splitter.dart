import 'package:flutter/material.dart';
import '../logic/splitter.dart';
import '../theme/i_theme.dart';

/// 分割面板。
///
/// 两栏的下限一起夹，而不是只夹被拖的那一栏：只夹一栏的话，
/// 把它拖到很大时另一栏会被挤到零宽，里面的内容全部换行成一列单字。
class ISplitter extends StatefulWidget {
  const ISplitter({
    super.key,
    required this.first,
    required this.second,
    this.value = 0.5,
    this.onChanged,
    this.direction = Axis.horizontal,
    this.minFirst = 120,
    this.minSecond = 120,
    this.maxFirst,
    this.gutter = 4,
  });

  final Widget first;
  final Widget second;

  /// 第一栏占比 0-1
  final double value;
  final ValueChanged<double>? onChanged;
  final Axis direction;

  /// 两栏各自的最小尺寸，像素
  final double minFirst;
  final double minSecond;
  final double? maxFirst;
  final double gutter;

  @override
  State<ISplitter> createState() => _ISplitterState();
}

class _ISplitterState extends State<ISplitter> {
  bool _dragging = false;

  void _apply(double total, double next) {
    final clamped = resizePane(
      total,
      next,
      firstMin: widget.minFirst,
      firstMax: widget.maxFirst,
      secondMin: widget.minSecond,
      gutter: widget.gutter,
    );
    widget.onChanged?.call(paneRatio(clamped, total, gutter: widget.gutter));
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final isRow = widget.direction == Axis.horizontal;

    return LayoutBuilder(
      builder: (context, constraints) {
        final total = isRow ? constraints.maxWidth : constraints.maxHeight;
        final firstSize = paneSize(widget.value, total, gutter: widget.gutter);

        final gutter = MouseRegion(
          cursor: isRow ? SystemMouseCursors.resizeColumn : SystemMouseCursors.resizeRow,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onHorizontalDragStart: isRow ? (_) => setState(() => _dragging = true) : null,
            onHorizontalDragEnd: isRow ? (_) => setState(() => _dragging = false) : null,
            onHorizontalDragUpdate:
                isRow ? (d) => _apply(total, firstSize + d.delta.dx) : null,
            onVerticalDragStart: isRow ? null : (_) => setState(() => _dragging = true),
            onVerticalDragEnd: isRow ? null : (_) => setState(() => _dragging = false),
            onVerticalDragUpdate:
                isRow ? null : (d) => _apply(total, firstSize + d.delta.dy),
            child: Semantics(
              // 读屏使用者靠这个值知道现在是几几开
              slider: true,
              label: '调整分栏比例，当前 ${(widget.value * 100).round()}%',
              child: Container(
                width: isRow ? widget.gutter : null,
                height: isRow ? null : widget.gutter,
                color: _dragging ? c.brand : c.hairline,
                child: Center(
                  // 抓手常显：触摸端没有光标变化可以提示「这里能拖」
                  child: Container(
                    width: isRow ? 2 : 24,
                    height: isRow ? 24 : 2,
                    decoration: BoxDecoration(
                      color: c.bgElevated,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
              ),
            ),
          ),
        );

        final children = [
          SizedBox(
            width: isRow ? firstSize : null,
            height: isRow ? null : firstSize,
            child: widget.first,
          ),
          gutter,
          Expanded(child: widget.second),
        ];

        return isRow
            ? Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: children)
            : Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: children);
      },
    );
  }
}
