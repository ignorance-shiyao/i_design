/// 索引列表的分组与定位（与 packages/common/src/logic/indexes.ts 同名同算法）。
///
/// 分组规则与「当前停在哪一组」写在组件里，各端就会各自解释一遍：
/// 一端把数字归到 #、另一端归到 0-9，同一份数据在两端上的索引条长度都不一样。
library;

class IndexGroup<T> {
  const IndexGroup(this.index, this.items);

  /// 索引字母，非字母一律归到 #
  final String index;
  final List<T> items;
}

/// 非字母（数字、符号、未取到拼音的中文）统一归到 #，排在最后
const String kIndexOther = '#';

String _indexOf(String letter) {
  final trimmed = letter.trim();
  if (trimmed.isEmpty) return kIndexOther;
  final first = trimmed.substring(0, 1).toUpperCase();
  return RegExp(r'^[A-Z]$').hasMatch(first) ? first : kIndexOther;
}

/// 按首字母分组。中文要先转拼音，那是业务的事——
/// 组件不该替它决定用哪套拼音表（「重庆」归 C 还是 Z 取决于词库）。
List<IndexGroup<T>> groupByIndex<T>(List<T> items, String Function(T) keyOf) {
  final map = <String, List<T>>{};
  for (final item in items) {
    map.putIfAbsent(_indexOf(keyOf(item)), () => <T>[]).add(item);
  }

  final letters = map.keys.where((key) => key != kIndexOther).toList()..sort();
  final groups = [for (final index in letters) IndexGroup(index, map[index]!)];
  // # 永远排最后：它是「其余」，不是某个字母
  if (map.containsKey(kIndexOther)) groups.add(IndexGroup(kIndexOther, map[kIndexOther]!));
  return groups;
}

/// 当前停在哪一组。
///
/// 判定用「组的顶边越过容器顶部」而不是「组还在视口里」——
/// 后者在一屏能看到三四组时会同时命中好几个，索引条上的高亮会来回跳。
String activeIndexAt(List<({String index, double top})> offsets, double scrollTop) {
  var active = offsets.isEmpty ? '' : offsets.first.index;
  for (final group in offsets) {
    // 留 1 的容差：滚动位置常是小数，相等判断在缩放屏上会漏掉
    if (group.top - 1 <= scrollTop) {
      active = group.index;
    } else {
      break;
    }
  }
  return active;
}
