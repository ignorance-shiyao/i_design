import 'dart:ui' show FontFeature;
import 'package:flutter/material.dart';
import '../logic/table.dart';
import '../logic/treetable.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 树表与分组汇总（astra.md 的 B06）。
///
/// 判断全在 logic/treetable.dart，与 Web 端同一份规则：
/// 排序只在兄弟之间排、折叠不丢选择（并且把「有几项在收起的分组里」数出来）、
/// 汇总按全部叶子行算因而不受折叠影响。
///
/// 层级只用**缩进 + 一个展开箭头**表示：拿加粗的边线或整行底色标「这是父行」，
/// 既是 CLAUDE.md 禁的那条，也让真正需要着色的选中行没了对比。
class ITreeTableColumn {
  const ITreeTableColumn({
    required this.key,
    required this.title,
    this.width,
    this.numeric = false,
    this.sortable = false,
  });

  final String key;
  final String title;
  final double? width;

  /// 数字列：右对齐并用等宽数字
  final bool numeric;
  final bool sortable;
}

class ITreeTable extends StatelessWidget {
  const ITreeTable({
    super.key,
    required this.columns,
    required this.data,
    this.expanded = const {},
    this.selected = const {},
    this.selectable = false,
    this.sortKey,
    this.sortOrder,
    this.aggregates = const [],
    this.showTotal = false,
    this.labelKey = 'name',
    this.onExpandedChanged,
    this.onSelectedChanged,
    this.onSortChanged,
  });

  final List<ITreeTableColumn> columns;
  final List<ITreeRow> data;

  /// 展开的行 key，受控
  final Set<String> expanded;

  /// 已选行 key，受控
  final Set<String> selected;
  final bool selectable;
  final String? sortKey;
  final ISortOrder? sortOrder;

  /// 每个分组下要汇总哪些字段。给了才出现小计行
  final List<IAggregateSpec> aggregates;
  final bool showTotal;
  final String labelKey;
  final void Function(Set<String> expanded)? onExpandedChanged;
  final void Function(Set<String> selected)? onSelectedChanged;
  final void Function(String? key, ISortOrder? order)? onSortChanged;

  static String _format(num? value) {
    if (value == null) return '—';
    if (value == value.roundToDouble()) return value.toInt().toString();
    return value.toStringAsFixed(2);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final sorted = sortTree(data, sortKey, sortOrder);
    final rows = flattenRows(sorted, expanded);
    final summary = selectionSummary(selected, rows);
    final state = selectAllState(data, selected);
    final total =
        showTotal && aggregates.isNotEmpty ? grandTotal(data, aggregates) : null;

    Widget cellText(String text, ITreeTableColumn column, {Color? color}) => Text(
          text,
          textAlign: column.numeric ? TextAlign.right : TextAlign.left,
          style: TextStyle(
            fontSize: IDesignTokensLight.fontSizeSm,
            color: color ?? c.textSecondary,
            // 等宽数字：一列数字不对齐，扫一眼看不出哪个更大
            fontFeatures: column.numeric
                ? const [FontFeature.tabularFigures()]
                : null,
          ),
        );

    Widget wrapCell(Widget child, ITreeTableColumn column) => column.width == null
        ? Expanded(child: child)
        : SizedBox(width: column.width, child: child);

    final body = <Widget>[];
    for (final entry in renderRows(sorted, expanded,
        withSummary: aggregates.isNotEmpty)) {
      // 小计跟在这个分组最后一条子行之后：摆在标题下面会读成这一行自己的数字
      if (entry.kind == IRenderKind.summary) {
        final group = groupSummary(entry.group!, aggregates);
        body.add(Container(
          color: c.bgSubtle,
          padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing2),
          child: Row(
            children: [
              if (selectable) const SizedBox(width: 44),
              for (var i = 0; i < columns.length; i += 1)
                wrapCell(
                  i == 0
                      ? Padding(
                          padding: EdgeInsets.only(left: (entry.level + 1) * 20.0),
                          child: cellText(summaryLabel(group), columns[i], color: c.text),
                        )
                      : cellText(
                          group.values.containsKey(columns[i].key)
                              ? _format(group.values[columns[i].key])
                              : '',
                          columns[i],
                          color: c.text,
                        ),
                  columns[i],
                ),
            ],
          ),
        ));
        continue;
      }

      final row = entry.row!;
      final canSelect = rowSelectable(row.row);
      body.add(Container(
        color: selectable && selected.contains(row.key) ? c.brandSubtle : null,
        padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing2),
        child: Row(
          children: [
            if (selectable)
              SizedBox(
                width: 44,
                child: Checkbox(
                  value: selected.contains(row.key),
                  onChanged: canSelect
                      ? (_) => onSelectedChanged
                          ?.call(toggleRow(data, selected, row.key))
                      : null,
                ),
              ),
            for (var i = 0; i < columns.length; i += 1)
              wrapCell(
                i == 0
                    // 第一列带缩进与箭头：层级只靠这两样表示
                    ? Padding(
                        padding: EdgeInsets.only(left: row.level * 20.0),
                        child: Row(
                          children: [
                            if (row.hasChildren)
                              // 折叠只动展开集合，绝不动选择：收起是视图操作
                              InkWell(
                                onTap: () => onExpandedChanged
                                    ?.call(toggleExpanded(expanded, row.key)),
                                child: SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: Center(
                                    child: RotatedBox(
                                      quarterTurns: row.expanded ? 1 : 0,
                                      child: IIcon('chevron-right',
                                          size: 14, color: c.textTertiary),
                                    ),
                                  ),
                                ),
                              )
                            else
                              const SizedBox(width: 24),
                            Flexible(
                              child: cellText(
                                '${row.row.fields[columns[i].key] ?? ''}',
                                columns[i],
                                color: c.text,
                              ),
                            ),
                            // 不可选的行把理由写在旁边：只禁用不说理由，用户只会反复点
                            if (!canSelect) ...[
                              const SizedBox(width: IDesignTokensLight.spacing1),
                              Text(
                                row.row.selectableReason ?? '',
                                style: TextStyle(
                                  fontSize: IDesignTokensLight.fontSizeXs,
                                  color: c.textTertiary,
                                ),
                              ),
                            ],
                          ],
                        ),
                      )
                    : cellText('${row.row.fields[columns[i].key] ?? ''}', columns[i]),
                columns[i],
              ),
          ],
        ),
      ));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // 「其中 N 项在收起的分组里」是用户敢按下一步的前提，跟着选择一起出现
        if (selectable)
          Container(
            width: double.infinity,
            margin: const EdgeInsets.only(bottom: IDesignTokensLight.spacing2),
            padding: const EdgeInsets.symmetric(
              horizontal: IDesignTokensLight.spacing3,
              vertical: IDesignTokensLight.spacing2,
            ),
            decoration: BoxDecoration(
              color: c.bgSubtle,
              border: Border.all(color: c.hairline),
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
            ),
            child: Semantics(
              liveRegion: true,
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      summary.text,
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeSm,
                        color: c.textSecondary,
                      ),
                    ),
                  ),
                  if (summary.hidden > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: IDesignTokensLight.spacing2,
                      ),
                      decoration: BoxDecoration(
                        color: c.warningSubtle,
                        borderRadius:
                            BorderRadius.circular(IDesignTokensLight.radiusFull),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IIcon('eye-off', size: 12, color: c.warning),
                          const SizedBox(width: IDesignTokensLight.spacing1),
                          Text(
                            '${summary.hidden} 项已折叠',
                            style: TextStyle(
                              fontSize: IDesignTokensLight.fontSizeXs,
                              color: c.warning,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),

        // 表头
        Container(
          color: c.bgSubtle,
          padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing2),
          child: Row(
            children: [
              if (selectable)
                SizedBox(
                  width: 44,
                  child: Checkbox(
                    value: state == ISelectAllState.all,
                    tristate: true,
                    onChanged: (_) =>
                        onSelectedChanged?.call(toggleSelectAll(data, selected)),
                  ),
                ),
              for (final column in columns)
                wrapCell(
                  InkWell(
                    onTap: column.sortable && onSortChanged != null
                        ? () {
                            if (sortKey != column.key) {
                              onSortChanged!(column.key, ISortOrder.asc);
                              return;
                            }
                            final next = nextSortOrder(sortOrder);
                            onSortChanged!(next == null ? null : column.key, next);
                          }
                        : null,
                    child: Text(
                      column.title,
                      textAlign: column.numeric ? TextAlign.right : TextAlign.left,
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeSm,
                        fontWeight: FontWeight.w600,
                        color: c.text,
                      ),
                    ),
                  ),
                  column,
                ),
            ],
          ),
        ),
        ...body,

        if (total != null)
          Container(
            color: c.bgMuted,
            padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing2),
            child: Row(
              children: [
                if (selectable) const SizedBox(width: 44),
                for (var i = 0; i < columns.length; i += 1)
                  wrapCell(
                    cellText(
                      i == 0
                          ? summaryLabel(total, '合计')
                          : (total.values.containsKey(columns[i].key)
                              ? _format(total.values[columns[i].key])
                              : ''),
                      columns[i],
                      color: c.text,
                    ),
                    columns[i],
                  ),
              ],
            ),
          ),

        if (rows.isEmpty)
          Padding(
            padding: const EdgeInsets.all(IDesignTokensLight.spacing10),
            child: Center(
              child: Text(
                '没有数据',
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeSm,
                  color: c.textTertiary,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
