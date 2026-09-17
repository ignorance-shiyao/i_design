/// 树表与分组汇总的 Dart 移植（对应 packages/common/src/logic/treetable.ts）。
///
/// 三条规矩与 Web 端逐字一致，跨端对齐测试逐条核对：
///
/// 一、**排序只在兄弟之间排，不打平层级**——层级是数据的一部分，
/// 排序改变的是同一个父节点下的先后，不是归属。
///
/// 二、**折叠不丢选择，但必须数出来**——收起分组后悄悄清掉选择，是
/// 「我明明勾了」的来源；留着却不说，用户按下删除时会删掉他看不见的那几行。
///
/// 三、**汇总按全部叶子行算，不受折叠影响**——一个合计数字在折叠之后变小，
/// 用户会当成数据错了。
///
/// 还有一条贯穿全部：行的身份是 key，不是下标。
library;

import 'dataset.dart';
import 'table.dart';

class ITreeRow {
  const ITreeRow({
    required this.key,
    this.children = const [],
    this.selectableReason,
    this.fields = const {},
  });

  final String key;
  final List<ITreeRow> children;

  /// 不可选的行。给了原因才好在界面上说清楚
  final String? selectableReason;

  /// 其余列的值
  final Map<String, Object?> fields;

  ITreeRow copyWithChildren(List<ITreeRow> next) => ITreeRow(
        key: key,
        children: next,
        selectableReason: selectableReason,
        fields: fields,
      );
}

class IFlatRow {
  const IFlatRow({
    required this.key,
    required this.row,
    required this.level,
    required this.hasChildren,
    required this.expanded,
    this.parentKey,
  });

  final String key;
  final ITreeRow row;
  final int level;
  final String? parentKey;
  final bool hasChildren;
  final bool expanded;
}

/// 树表列的共享结构。分组列只有标题和 children；正文/排序只使用 leaves。
class ITreeTableColumnSpec {
  const ITreeTableColumnSpec({
    this.key,
    required this.title,
    this.mergeVertical = false,
    this.children = const [],
  });

  final String? key;
  final String title;
  final bool mergeVertical;
  final List<ITreeTableColumnSpec> children;
}

class IHeaderCell {
  const IHeaderCell(this.column, this.colSpan, this.rowSpan);
  final ITreeTableColumnSpec column;
  final int colSpan;
  final int rowSpan;
}

class IHeaderLayout {
  const IHeaderLayout(this.rows, this.leaves, this.depth);
  final List<List<IHeaderCell>> rows;
  final List<ITreeTableColumnSpec> leaves;
  final int depth;
}

/// 各端从同一列树推导表头，叶子列补满剩余高度，分组列横跨全部后代。
IHeaderLayout buildHeaderLayout(List<ITreeTableColumnSpec> columns) {
  int depthOf(ITreeTableColumnSpec column) => column.children.isEmpty
      ? 1
      : 1 + column.children.map(depthOf).reduce((a, b) => a > b ? a : b);
  int leafCount(ITreeTableColumnSpec column) => column.children.isEmpty
      ? 1
      : column.children.map(leafCount).reduce((a, b) => a + b);
  final depth = columns.isEmpty ? 1 : columns.map(depthOf).reduce((a, b) => a > b ? a : b);
  final rows = List.generate(depth, (_) => <IHeaderCell>[]);
  final leaves = <ITreeTableColumnSpec>[];
  void walk(List<ITreeTableColumnSpec> list, int level) {
    for (final column in list) {
      final grouped = column.children.isNotEmpty;
      rows[level].add(IHeaderCell(column, grouped ? leafCount(column) : 1, grouped ? 1 : depth - level));
      if (grouped) walk(column.children, level + 1); else leaves.add(column);
    }
  }
  walk(columns, 0);
  return IHeaderLayout(rows, leaves, depth);
}

/// 一行能不能选。理由有值就不能选，那句话直接给用户看
bool rowSelectable(ITreeRow row) =>
    row.selectableReason == null || row.selectableReason!.isEmpty;

/// 排序。**只在兄弟之间排**，递归下去每一层各排各的。
///
/// 比较规则与 table.dart 的 sortRows 一致（数值按大小、空值恒在末尾），
/// 但这里额外按原下标做了稳定化：JS 的 Array.sort 是稳定排序，
/// Dart 的 List.sort 不是——不补这一手，金额相同的两行在两端会一个在前一个在后。
List<ITreeRow> sortTree(List<ITreeRow> rows, String? key, ISortOrder? order) {
  if (key == null || order == null) return rows;
  final factor = order == ISortOrder.asc ? 1 : -1;
  final indexed = [
    for (var i = 0; i < rows.length; i += 1) (index: i, row: rows[i])
  ];
  indexed.sort((a, b) {
    final av = a.row.fields[key];
    final bv = b.row.fields[key];
    var result = 0;
    if (av == bv) {
      result = 0;
    } else if (av == null) {
      // 空值总在末尾，不受升降序影响
      result = 1;
    } else if (bv == null) {
      result = -1;
    } else if (av is num && bv is num) {
      result = (av < bv ? -1 : 1) * factor;
    } else {
      result = av.toString().compareTo(bv.toString()) * factor;
    }
    return result != 0 ? result : a.index - b.index;
  });
  return [
    for (final entry in indexed)
      entry.row.children.isEmpty
          ? entry.row
          : entry.row.copyWithChildren(sortTree(entry.row.children, key, order))
  ];
}

/// 当前该渲染的行，按渲染顺序。折叠的分支整段跳过
List<IFlatRow> flattenRows(List<ITreeRow> rows, Set<String> expandedKeys) {
  final out = <IFlatRow>[];
  void walk(List<ITreeRow> list, int level, String? parentKey) {
    for (final row in list) {
      final hasChildren = row.children.isNotEmpty;
      final isExpanded = expandedKeys.contains(row.key);
      out.add(IFlatRow(
        key: row.key,
        row: row,
        level: level,
        parentKey: parentKey,
        hasChildren: hasChildren,
        expanded: isExpanded,
      ));
      if (hasChildren && isExpanded) walk(row.children, level + 1, row.key);
    }
  }

  walk(rows, 0, null);
  return out;
}

/// 渲染序列里的一项：一行数据，或者一个分组的小计
class IRenderRow {
  const IRenderRow.row(this.row)
      : kind = IRenderKind.row,
        group = null,
        level = 0;
  const IRenderRow.summary(ITreeRow this.group, this.level)
      : kind = IRenderKind.summary,
        row = null;

  final IRenderKind kind;
  final IFlatRow? row;
  final ITreeRow? group;
  final int level;

  String get groupKey => group?.key ?? '';
}

enum IRenderKind { row, summary }

/// 连小计一起排好的渲染序列。
///
/// 小计跟在**这个分组最后一条子行之后**，不是紧跟在标题下面——
/// 摆在标题下面的话它读起来像这一行自己的数字，而它是底下那几行的和。
/// 收起的分组不出小计：那一行自己就代表它。
List<IRenderRow> renderRows(
  List<ITreeRow> rows,
  Set<String> expandedKeys, {
  bool withSummary = true,
}) {
  final out = <IRenderRow>[];
  void walk(List<ITreeRow> list, int level, String? parentKey) {
    for (final row in list) {
      final hasChildren = row.children.isNotEmpty;
      final isExpanded = expandedKeys.contains(row.key);
      out.add(IRenderRow.row(IFlatRow(
        key: row.key,
        row: row,
        level: level,
        parentKey: parentKey,
        hasChildren: hasChildren,
        expanded: isExpanded,
      )));
      if (hasChildren && isExpanded) {
        walk(row.children, level + 1, row.key);
        if (withSummary) out.add(IRenderRow.summary(row, level));
      }
    }
  }

  walk(rows, 0, null);
  return out;
}

/// 整棵树上的全部行，不管展开与否
List<ITreeRow> allRows(List<ITreeRow> rows) {
  final out = <ITreeRow>[];
  void walk(List<ITreeRow> list) {
    for (final row in list) {
      out.add(row);
      if (row.children.isNotEmpty) walk(row.children);
    }
  }

  walk(rows);
  return out;
}

/// 只要叶子行。汇总按叶子算，否则父行的金额与子行的金额会被加两遍
List<ITreeRow> leafRows(List<ITreeRow> rows) =>
    allRows(rows).where((row) => row.children.isEmpty).toList();

/// 展开 / 收起。收起时**不动**选择集合：收起是视图操作，不是取消选择
Set<String> toggleExpanded(Set<String> expanded, String key) {
  final next = Set<String>.from(expanded);
  if (next.contains(key)) {
    next.remove(key);
  } else {
    next.add(key);
  }
  return next;
}

/// 全部展开
Set<String> expandAll(List<ITreeRow> rows) => {
      for (final row in allRows(rows))
        if (row.children.isNotEmpty) row.key
    };

class ISelectionSummary {
  const ISelectionSummary({
    required this.total,
    required this.visible,
    required this.hidden,
    required this.text,
  });

  final int total;
  final int visible;

  /// 藏在收起的分组里的有几项
  final int hidden;

  /// 摆给用户看的那句话。hidden 大于 0 时它必须点出来
  final String text;
}

/// 选择的去向，数出来。没有它，用户按下删除才发现删掉了看不见的几行
ISelectionSummary selectionSummary(
  Set<String> selected,
  List<IFlatRow> visibleRows,
) {
  final onScreen = {for (final r in visibleRows) r.key};
  var visible = 0;
  for (final key in selected) {
    if (onScreen.contains(key)) visible += 1;
  }
  final total = selected.length;
  final hidden = total - visible;
  if (total == 0) {
    return const ISelectionSummary(
      total: 0,
      visible: 0,
      hidden: 0,
      text: '未选择任何行',
    );
  }
  return ISelectionSummary(
    total: total,
    visible: visible,
    hidden: hidden,
    text: hidden > 0 ? '已选 $total 项，其中 $hidden 项在收起的分组里' : '已选 $total 项',
  );
}

enum ISelectAllState { none, some, all }

/// 表头复选框的状态。口径是**整棵树里可选的行**，不随折叠变化
ISelectAllState selectAllState(List<ITreeRow> rows, Set<String> selected) {
  final selectable = allRows(rows).where(rowSelectable).toList();
  if (selectable.isEmpty) return ISelectAllState.none;
  var hit = 0;
  for (final row in selectable) {
    if (selected.contains(row.key)) hit += 1;
  }
  if (hit == 0) return ISelectAllState.none;
  return hit == selectable.length ? ISelectAllState.all : ISelectAllState.some;
}

/// 点表头复选框之后的新选择。全选覆盖整棵树，包括收起的分组里那些行
Set<String> toggleSelectAll(List<ITreeRow> rows, Set<String> selected) {
  if (selectAllState(rows, selected) == ISelectAllState.all) return <String>{};
  return {
    for (final row in allRows(rows))
      if (rowSelectable(row)) row.key
  };
}

/// 勾选一行。**父行与子行各选各的**，不联动——
/// 树表不是树形选择器，这里的父行是一条真实记录
Set<String> toggleRow(List<ITreeRow> rows, Set<String> selected, String key) {
  final next = Set<String>.from(selected);
  ITreeRow? target;
  for (final row in allRows(rows)) {
    if (row.key == key) {
      target = row;
      break;
    }
  }
  if (target == null || !rowSelectable(target)) return next;
  if (next.contains(key)) {
    next.remove(key);
  } else {
    next.add(key);
  }
  return next;
}

/// 摘掉已经不在数据里的 key。**只在数据换了的时候调用**，折叠时调用就是丢选择
Set<String> pruneSelection(List<ITreeRow> rows, Set<String> selected) {
  final alive = {for (final row in allRows(rows)) row.key};
  return {
    for (final key in selected)
      if (alive.contains(key)) key
  };
}

/// 聚合方式沿用 dataset.dart 那一套，不另起一份
typedef IAggregateKind = IAggregation;

class IAggregateSpec {
  const IAggregateSpec({required this.field, required this.kind, this.label});

  final String field;
  final IAggregateKind kind;
  final String? label;
}

/// 一组行在某个字段上的汇总值。
///
/// 取值与判空交给 dataset.dart 的 iAggregate：空值不参与平均，
/// 一条都没填给 null 而不是 0。
///
/// 只有 count 是这里自己算的：dataset 的 count 数的是**有值的个数**，
/// 而汇总行上那个「N 条明细」回答的是「这个分组有多少条」——
/// 一条没填金额的记录也是一条记录。
num? aggregateField(List<ITreeRow> rows, IAggregateSpec spec) {
  if (spec.kind == IAggregation.count) return rows.length;
  final values = <double?>[
    for (final row in rows)
      () {
        final raw = row.fields[spec.field];
        return raw is num && raw.isFinite ? raw.toDouble() : null;
      }()
  ];
  return iAggregate(values, spec.kind);
}

class IGroupSummary {
  const IGroupSummary({
    required this.key,
    required this.count,
    required this.values,
  });

  final String key;

  /// 这个分组一共多少叶子行
  final int count;

  /// 字段 → 汇总值。null 表示这一组里这个字段一条都没填
  final Map<String, num?> values;
}

/// 一个分组的汇总。**按它全部的叶子后代算**，与展开与否无关
IGroupSummary groupSummary(ITreeRow group, List<IAggregateSpec> specs) {
  final leaves = group.children.isNotEmpty ? leafRows(group.children) : [group];
  final values = <String, num?>{};
  for (final spec in specs) {
    values[spec.field] = aggregateField(leaves, spec);
  }
  return IGroupSummary(key: group.key, count: leaves.length, values: values);
}

/// 整张表的合计。同样按叶子算，同样与折叠无关
IGroupSummary grandTotal(List<ITreeRow> rows, List<IAggregateSpec> specs) {
  final leaves = leafRows(rows);
  final values = <String, num?>{};
  for (final spec in specs) {
    values[spec.field] = aggregateField(leaves, spec);
  }
  return IGroupSummary(key: '__total__', count: leaves.length, values: values);
}

/// 汇总行上那句说明。「小计」两个字单独摆着，读者不知道它算的是哪些行
String summaryLabel(IGroupSummary summary, [String name = '小计']) =>
    '$name（${summary.count} 条明细）';
