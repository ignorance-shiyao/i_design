import 'package:flutter/material.dart';
import '../logic/table.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_empty.dart';
import 'i_icon.dart';

@immutable
class ITableColumn {
  const ITableColumn({
    required this.key,
    required this.title,
    this.sortable = false,
    this.align = TextAlign.left,
    this.width,
    this.cellBuilder,
  });

  final String key;
  final String title;
  final bool sortable;
  final TextAlign align;

  /// 为空则按剩余空间等分
  final double? width;

  /// 自定义单元格；不传时按字符串渲染
  final Widget Function(Map<String, Object?> row)? cellBuilder;
}

/// 数据表格。
///
/// 排序走 logic/table.dart 的共享规则，因此同一份数据在 Web、小程序、
/// Flutter 上点三次表头得到的顺序完全相同。
class ITable extends StatefulWidget {
  const ITable({
    super.key,
    required this.columns,
    required this.rows,
    this.stripe = false,
    this.bordered = false,
    this.emptyText = '暂无数据',
    this.height,
  });

  final List<ITableColumn> columns;
  final List<Map<String, Object?>> rows;
  final bool stripe;
  final bool bordered;
  final String emptyText;

  /// 表体高度。给了就在这个高度里滚动、表头固定在上方，由 ListView.builder
  /// 按需建行——Table 会把每一行都先建出来，上万行时直接卡住。
  final double? height;

  @override
  State<ITable> createState() => _ITableState();
}

class _ITableState extends State<ITable> {
  String? _sortKey;
  ISortOrder? _sortOrder;

  void _toggleSort(ITableColumn column) {
    setState(() {
      if (_sortKey != column.key) {
        _sortKey = column.key;
        _sortOrder = ISortOrder.asc;
        return;
      }
      _sortOrder = nextSortOrder(_sortOrder);
      if (_sortOrder == null) _sortKey = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final rows = sortRows(widget.rows, _sortKey, _sortOrder);

    if (rows.isEmpty) {
      return IEmpty(description: widget.emptyText);
    }

    Map<int, TableColumnWidth> widths() => {
          for (var i = 0; i < widget.columns.length; i++)
            if (widget.columns[i].width != null)
              i: FixedColumnWidth(widget.columns[i].width!)
            else
              i: const FlexColumnWidth(),
        };

    Alignment alignOf(TextAlign align) => switch (align) {
          TextAlign.right => Alignment.centerRight,
          TextAlign.center => Alignment.center,
          _ => Alignment.centerLeft,
        };

    Widget header(ITableColumn column) {
      final active = _sortKey == column.key && _sortOrder != null;
      final label = Text(
        column.title,
        style: TextStyle(
          color: active ? c.brand : c.textSecondary,
          fontSize: IDesignTokensLight.fontSizeSm,
          fontWeight: FontWeight.w600,
        ),
      );

      final content = Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing3,
          vertical: IDesignTokensLight.spacing3,
        ),
        child: Row(
          mainAxisAlignment: column.align == TextAlign.right
              ? MainAxisAlignment.end
              : MainAxisAlignment.start,
          children: [
            label,
            if (column.sortable) ...[
              const SizedBox(width: IDesignTokensLight.spacing1),
              IIcon(
                _sortKey == column.key && _sortOrder == ISortOrder.desc
                    ? 'chevron-down'
                    : 'chevron-up',
                size: 12,
                color: active ? c.brand : c.textTertiary,
                semanticLabel: active
                    ? (_sortOrder == ISortOrder.asc ? '已按升序排列' : '已按降序排列')
                    : '点击排序',
              ),
            ],
          ],
        ),
      );

      if (!column.sortable) return content;
      return InkWell(onTap: () => _toggleSort(column), child: content);
    }

    Widget cell(ITableColumn column, Map<String, Object?> row) => Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: IDesignTokensLight.spacing3,
            vertical: IDesignTokensLight.spacing3,
          ),
          child: Align(
            alignment: alignOf(column.align),
            child: column.cellBuilder != null
                ? column.cellBuilder!(row)
                : Text(
                    row[column.key]?.toString() ?? '',
                    style: TextStyle(
                      color: c.text,
                      fontSize: IDesignTokensLight.fontSizeMd,
                    ),
                  ),
          ),
        );

    if (widget.height != null) {
      /*
       * 表头单独一行、表体交给 ListView.builder 按需建行。
       *
       * 列宽在这里必须自己算死并同时喂给表头与每一行：让每一行各自去量内容宽度的话，
       * 每行算出来的宽度都不一样，滚起来列会左右跳，表头也对不上。
       */
      return LayoutBuilder(
        builder: (_, constraints) {
          final fixed = widget.columns
              .where((col) => col.width != null)
              .fold<double>(0, (sum, col) => sum + col.width!);
          final flexCount = widget.columns.where((col) => col.width == null).length;
          final rest = constraints.maxWidth - fixed;
          final flexWidth = flexCount == 0 ? 0.0 : (rest > 0 ? rest / flexCount : 0.0);
          double widthOf(ITableColumn col) => col.width ?? flexWidth;

          return DecoratedBox(
            decoration: BoxDecoration(
              border: widget.bordered ? Border.all(color: c.border) : null,
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: c.bgSubtle,
                    border: Border(bottom: BorderSide(color: c.border)),
                  ),
                  child: Row(
                    children: [
                      for (final column in widget.columns)
                        SizedBox(width: widthOf(column), child: header(column)),
                    ],
                  ),
                ),
                SizedBox(
                  height: widget.height,
                  child: ListView.builder(
                    itemCount: rows.length,
                    itemBuilder: (_, i) => DecoratedBox(
                      decoration: BoxDecoration(
                        color: widget.stripe && i.isOdd ? c.bgSubtle : c.bg,
                        border: Border(bottom: BorderSide(color: c.hairline)),
                      ),
                      child: Row(
                        children: [
                          for (final column in widget.columns)
                            SizedBox(width: widthOf(column), child: cell(column, rows[i])),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      );
    }

    return DecoratedBox(
      decoration: BoxDecoration(
        border: widget.bordered ? Border.all(color: c.border) : null,
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      child: Table(
        columnWidths: widths(),
        border: widget.bordered ? TableBorder.all(color: c.border) : null,
        children: [
          TableRow(
            decoration: BoxDecoration(
              color: c.bgSubtle,
              border: Border(bottom: BorderSide(color: c.border)),
            ),
            children: [for (final column in widget.columns) header(column)],
          ),
          for (var i = 0; i < rows.length; i++)
            TableRow(
              decoration: BoxDecoration(
                color: widget.stripe && i.isOdd ? c.bgSubtle : c.bg,
                border: Border(bottom: BorderSide(color: c.hairline)),
              ),
              children: [
                for (final column in widget.columns) cell(column, rows[i]),
              ],
            ),
        ],
      ),
    );
  }
}
