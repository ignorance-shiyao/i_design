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
  });

  final List<ITableColumn> columns;
  final List<Map<String, Object?>> rows;
  final bool stripe;
  final bool bordered;
  final String emptyText;

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
                for (final column in widget.columns)
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: IDesignTokensLight.spacing3,
                      vertical: IDesignTokensLight.spacing3,
                    ),
                    child: Align(
                      alignment: alignOf(column.align),
                      child: column.cellBuilder != null
                          ? column.cellBuilder!(rows[i])
                          : Text(
                              rows[i][column.key]?.toString() ?? '',
                              style: TextStyle(
                                color: c.text,
                                fontSize: IDesignTokensLight.fontSizeMd,
                              ),
                            ),
                    ),
                  ),
              ],
            ),
        ],
      ),
    );
  }
}
