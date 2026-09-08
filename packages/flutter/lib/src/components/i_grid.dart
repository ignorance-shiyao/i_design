import 'package:flutter/material.dart';

/// 24 栅格中的一列。
///
/// Flutter 没有 CSS 的百分比宽度，因此列宽由 IRow 用 LayoutBuilder 量出容器宽度后
/// 分配——这也是为什么 ICol 只能放在 IRow 里，单独使用会拿不到跨度。
@immutable
class ICol {
  const ICol({
    required this.child,
    this.span = 24,
    this.offset = 0,
    this.sm,
  });

  final Widget child;

  /// 24 栅格中的跨度
  final int span;
  final int offset;

  /// 窄屏（宽度 ≤ 768）下的跨度；不传时整行铺满——
  /// 中后台表单在小屏上并排两列几乎不可用
  final int? sm;
}

/// 栅格行。
class IRow extends StatelessWidget {
  const IRow({
    super.key,
    required this.columns,
    this.gutter = 16,
    this.crossAxisAlignment = CrossAxisAlignment.start,
  });

  final List<ICol> columns;

  /// 列间距，由行统一控制，列自己不设间距
  final double gutter;
  final CrossAxisAlignment crossAxisAlignment;

  static const double _narrow = 768;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final total = constraints.maxWidth;
        final narrow = total <= _narrow;

        int spanOf(ICol col) => narrow ? (col.sm ?? 24) : col.span;
        double widthOf(int span) => total * span / 24;

        // 用 Wrap 而不是 Row：跨度之和超过 24 时应当折行，
        // Row 会挤压子项直到溢出报错
        return Wrap(
          spacing: 0,
          runSpacing: 0,
          children: [
            for (final col in columns) ...[
              if (col.offset > 0) SizedBox(width: widthOf(narrow ? 0 : col.offset)),
              SizedBox(
                width: widthOf(spanOf(col)),
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: gutter / 2),
                  child: col.child,
                ),
              ),
            ],
          ],
        );
      },
    );
  }
}
