/// 穿梭框搬运规则的 Dart 移植（对应 packages/common/src/logic/transfer.ts）。
///
/// 「搬完之后勾选状态怎么办」「搜索时全选选的是谁」这两处各端极容易给出不同答案，
/// 而两种答案都说得通——正因如此才必须只写一份。
library;

class ITransferItem {
  const ITransferItem({required this.key, required this.label, this.disabled = false});
  final String key;
  final String label;
  final bool disabled;
}

enum ITransferSide { source, target }

/// 按当前搜索词过滤某一栏
List<ITransferItem> filterItems(List<ITransferItem> items, String keyword) {
  if (keyword.isEmpty) return items;
  final needle = keyword.toLowerCase();
  return items.where((item) => item.label.toLowerCase().contains(needle)).toList();
}

class ITransferSides {
  const ITransferSides({required this.source, required this.target});
  final List<ITransferItem> source;
  final List<ITransferItem> target;
}

/// 两栏的当前内容。target 按 targetKeys 给定的顺序排，而不是按原数组顺序
ITransferSides splitSides(List<ITransferItem> items, List<String> targetKeys) {
  final picked = targetKeys.toSet();
  final byKey = {for (final item in items) item.key: item};
  return ITransferSides(
    source: items.where((item) => !picked.contains(item.key)).toList(),
    // 用户自己搬过去的顺序是有意义的，按原数组重排会把它抹掉
    target: targetKeys.map((key) => byKey[key]).whereType<ITransferItem>().toList(),
  );
}

/// 搬运。
///
/// 禁用项不搬：它在界面上是灰的、勾不上，但「全选」很容易把它一起收进选中集合，
/// 于是点一下搬运，一个用户根本点不动的条目就跑到对面去了。
List<String> moveKeys(
  List<ITransferItem> items,
  List<String> targetKeys,
  List<String> moving,
  ITransferSide to,
) {
  final byKey = {for (final item in items) item.key: item};
  final movable = moving.where((key) => byKey[key] != null && !byKey[key]!.disabled).toList();
  if (to == ITransferSide.target) {
    final picked = targetKeys.toSet();
    // 追加在末尾而不是插回原位：刚搬过去的东西应当出现在用户看得见的地方
    return [...targetKeys, ...movable.where((key) => !picked.contains(key))];
  }
  final removing = movable.toSet();
  return targetKeys.where((key) => !removing.contains(key)).toList();
}

/// 搬运后剩下的勾选。
///
/// 搬走的那些要从勾选里清掉。不清的话，勾选集合里会留着已经不在这一栏的 key，
/// 于是「已选 3 项」而屏幕上一个勾都没有——这个状态用户无法自己纠正。
List<String> checkedAfterMove(List<String> checked, List<String> moved) {
  final gone = moved.toSet();
  return checked.where((key) => !gone.contains(key)).toList();
}

class ITransferHeaderState {
  const ITransferHeaderState({
    required this.selectable,
    required this.checked,
    required this.allChecked,
    required this.someChecked,
  });

  /// 这一栏当前可勾选的条目数（不含禁用项）
  final int selectable;
  final int checked;
  final bool allChecked;
  final bool someChecked;
}

/// 表头「全选」的状态。
///
/// 只统计当前可见的条目——搜索状态下点全选，用户的意思是「这些」，
/// 不是「包括我现在看不见的那些」。把不可见的一起选中，
/// 再点搬运就会搬走一批他从没见过的条目，而且没有任何提示。
ITransferHeaderState headerState(List<ITransferItem> visible, List<String> checked) {
  final picked = checked.toSet();
  final selectable = visible.where((item) => !item.disabled).toList();
  final hit = selectable.where((item) => picked.contains(item.key)).length;
  return ITransferHeaderState(
    selectable: selectable.length,
    checked: hit,
    allChecked: selectable.isNotEmpty && hit == selectable.length,
    someChecked: hit > 0 && hit < selectable.length,
  );
}

/// 点表头全选：全选中就取消这一批，否则补齐这一批
List<String> toggleAll(List<ITransferItem> visible, List<String> checked) {
  final state = headerState(visible, checked);
  final keys = visible.where((item) => !item.disabled).map((item) => item.key).toList();
  if (state.allChecked) {
    final gone = keys.toSet();
    return checked.where((key) => !gone.contains(key)).toList();
  }
  final picked = checked.toSet();
  return [...checked, ...keys.where((key) => !picked.contains(key))];
}

/// 勾选 / 取消一项
List<String> toggleItem(List<String> checked, String key) =>
    checked.contains(key) ? checked.where((k) => k != key).toList() : [...checked, key];
