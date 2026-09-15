import 'package:flutter/material.dart';
import '../logic/protable.dart';
import '../logic/table.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// ProTable：带查询层与列能力的表格（astra.md 的 B04 + B05）。
///
/// 组件不发请求：它把「现在该请求什么」抛出去，由调用方取数。取消、重试、鉴权
/// 在每个项目里的做法都不一样，塞进组件等于给所有人一套用不上的实现。
///
/// 过期响应的判定在 logic/protable.dart 里，与 Web 端同一份——乱序返回时，
/// 旧结果覆盖新结果的界面看不出任何异常，只有序号能判出来。
class IProTable extends StatefulWidget {
  const IProTable({
    super.key,
    required this.columns,
    required this.state,
    required this.onRequest,
    this.columnState,
    this.onColumnStateChange,
    this.rowKey = 'id',
    this.emptyText = '没有符合条件的数据',
  });

  final List<IColumnSpec> columns;

  /// 查询层状态。由调用方持有，组件只读它
  final ITableState<Map<String, Object?>> state;

  /// 该请求什么了
  final ValueChanged<ITableQuery> onRequest;
  final IColumnState? columnState;
  final ValueChanged<IColumnState>? onColumnStateChange;
  final String rowKey;
  final String emptyText;

  @override
  State<IProTable> createState() => _IProTableState();
}

class _IProTableState extends State<IProTable> {
  IColumnState? _inner;
  bool _panel = false;

  IColumnState get _columnState =>
      widget.columnState ?? (_inner ??= defaultColumnState(widget.columns));

  void _setColumnState(IColumnState next) {
    setState(() => _inner = next);
    widget.onColumnStateChange?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final resolved = resolveTableColumns(widget.columns, _columnState);
    final shown = resolved.where((col) => !col.hidden).toList();
    final rowHeight = kDensityRowHeight[_columnState.density]!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              '共 ${widget.state.total} 条',
              style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeSm),
            ),
            // 还有请求在路上时明说，而不是让用户对着一份旧数据以为是新的
            if (widget.state.status == IRequestStatus.loading)
              Text(
                '（正在更新…）',
                style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeSm),
              ),
            const Spacer(),
            for (final density in ITableDensity.values)
              TextButton(
                onPressed: () => _setColumnState(setDensity(_columnState, density)),
                child: Text(switch (density) {
                  ITableDensity.compact => '紧凑',
                  ITableDensity.normal => '默认',
                  ITableDensity.loose => '宽松',
                }),
              ),
            TextButton(
              onPressed: () => setState(() => _panel = !_panel),
              child: const Text('列设置'),
            ),
          ],
        ),

        // 列设置：显隐与恢复默认。恢复默认这个出口必须一直在，
        // 否则调乱了的表格就永远乱着
        if (_panel)
          Container(
            padding: const EdgeInsets.all(IDesignTokensLight.spacing3),
            decoration: BoxDecoration(
              border: Border.all(color: c.hairline),
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final column in resolved)
                  Row(
                    children: [
                      Checkbox(
                        value: !column.hidden,
                        onChanged: column.spec.locked
                            ? null
                            : (_) => _setColumnState(
                                  toggleColumn(_columnState, column.key, widget.columns),
                                ),
                      ),
                      Text(column.title),
                      if (column.spec.locked)
                        Text(
                          '（主键不可隐藏）',
                          style: TextStyle(
                            color: c.textTertiary,
                            fontSize: IDesignTokensLight.fontSizeXs,
                          ),
                        )
                      else if (column.spec.restricted)
                        Text(
                          '（受权限控制）',
                          style: TextStyle(
                            color: c.textTertiary,
                            fontSize: IDesignTokensLight.fontSizeXs,
                          ),
                        ),
                    ],
                  ),
                TextButton(
                  onPressed: () => _setColumnState(resetColumns(widget.columns)),
                  child: const Text('恢复默认'),
                ),
              ],
            ),
          ),

        // 列一多就横向滚动：压下来只会把每列压成一竖条字
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            headingRowHeight: rowHeight,
            dataRowMinHeight: rowHeight,
            dataRowMaxHeight: rowHeight,
            sortColumnIndex: widget.state.query.sort.key == null
                ? null
                : shown.indexWhere((col) => col.key == widget.state.query.sort.key),
            sortAscending: widget.state.query.sort.order != ISortOrder.desc,
            columns: [
              for (final column in shown)
                DataColumn(
                  label: Text(column.title),
                  onSort: column.spec.sortable
                      ? (_, __) => widget.onRequest(setSort(widget.state, column.key).query)
                      : null,
                ),
            ],
            rows: [
              for (final row in widget.state.rows)
                DataRow(
                  cells: [
                    for (final column in shown) DataCell(Text('${row[column.key] ?? ''}')),
                  ],
                ),
            ],
          ),
        ),

        if (widget.state.rows.isEmpty)
          Padding(
            padding: const EdgeInsets.all(IDesignTokensLight.spacing4),
            child: Text(
              widget.state.status == IRequestStatus.error
                  ? (widget.state.error ?? widget.emptyText)
                  : widget.emptyText,
              style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeSm),
            ),
          ),

        Row(
          children: [
            TextButton(
              onPressed: widget.state.query.page > 1
                  ? () => widget.onRequest(setPage(widget.state, widget.state.query.page - 1).query)
                  : null,
              child: const Text('上一页'),
            ),
            Text(
              '第 ${widget.state.query.page} / '
              '${pageCountOfTotal(widget.state.total, widget.state.query.pageSize)} 页',
              style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
            ),
            TextButton(
              onPressed: widget.state.query.page <
                      pageCountOfTotal(widget.state.total, widget.state.query.pageSize)
                  ? () => widget.onRequest(setPage(widget.state, widget.state.query.page + 1).query)
                  : null,
              child: const Text('下一页'),
            ),
          ],
        ),
      ],
    );
  }
}
