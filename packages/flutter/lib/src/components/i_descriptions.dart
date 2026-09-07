import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

@immutable
class IDescriptionItem {
  const IDescriptionItem({required this.label, required this.value, this.span = 1});

  final String label;
  final Widget value;

  /// 跨列数，超过 column 时按 column 截断。
  ///
  /// Flutter 的 Table 没有 colspan，因此这里 span 只参与折行计算：
  /// span 大的项会独占更多行内名额，右侧补空单元格，而不是真的把格子拉宽。
  final int span;
}

/// 描述列表：成对的字段名与值。
///
/// 用 Table 而非 Wrap 排版，是为了让同一列的值左边缘对齐；
/// 松散排版在字段名长度不一时会显得歪斜。
class IDescriptions extends StatelessWidget {
  const IDescriptions({
    super.key,
    required this.items,
    this.column = 2,
    this.bordered = false,
    this.title,
  });

  final List<IDescriptionItem> items;
  final int column;
  final bool bordered;
  final String? title;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    // 先按 span 折行：一行装满 column 列就换行
    final rows = <List<IDescriptionItem>>[];
    var current = <IDescriptionItem>[];
    var used = 0;
    for (final item in items) {
      final span = item.span.clamp(1, column);
      if (used + span > column) {
        rows.add(current);
        current = <IDescriptionItem>[];
        used = 0;
      }
      current.add(item);
      used += span;
    }
    if (current.isNotEmpty) rows.add(current);

    Widget cell(IDescriptionItem item) => Padding(
          padding: const EdgeInsets.all(IDesignTokensLight.spacing3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.label,
                style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeSm),
              ),
              const SizedBox(height: IDesignTokensLight.spacing1),
              DefaultTextStyle(
                style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd),
                child: item.value,
              ),
            ],
          ),
        );

    final table = Table(
      border: bordered ? TableBorder.all(color: c.border, width: 1) : null,
      defaultColumnWidth: const FlexColumnWidth(),
      children: [
        for (final row in rows)
          TableRow(
            children: [
              for (final item in row)
                TableCell(
                  verticalAlignment: TableCellVerticalAlignment.top,
                  child: cell(item),
                ),
              // 补空单元格：Table 要求每行列数一致
              for (var i = row.fold<int>(0, (sum, it) => sum + it.span.clamp(1, column));
                  i < column;
                  i++)
                const SizedBox.shrink(),
            ],
          ),
      ],
    );

    if (title == null) return table;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title!,
          style: TextStyle(
            color: c.text,
            fontSize: IDesignTokensLight.fontSizeLg,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: IDesignTokensLight.spacing3),
        table,
      ],
    );
  }
}
