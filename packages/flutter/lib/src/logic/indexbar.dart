/// 索引栏的分组与命中。
///
/// 与 packages/common/src/logic/indexbar.ts 一一对应。
/// 右侧那条字母条看着简单，两处容易各端不一致：
///「#」放开头还是结尾、手指滑到两个字母中间时算哪一个。
class IIndexGroup<T> {
  const IIndexGroup({required this.key, required this.items});

  /// 索引字母，通常是 A-Z 或 #
  final String key;
  final List<T> items;
}

/// 按首字母分组。
///
/// 取不到字母的（数字、符号、无拼音的生僻字）统一归到「#」，并且排在最后。
/// 排在开头是常见做法，但那会让用户第一眼看到的是一堆杂项——
/// 而他打开通讯录是来找人的，不是来看「未分类」的。
List<IIndexGroup<T>> groupByIndex<T>(List<T> items, String Function(T) keyOf) {
  // LinkedHashMap（Dart 的 Map 默认实现）保持插入顺序，与 TS 的 Map 一致
  final map = <String, List<T>>{};
  for (final item in items) {
    final raw = keyOf(item).trim();
    final first = raw.isEmpty ? '' : raw.substring(0, 1).toUpperCase();
    final key = RegExp(r'^[A-Z]$').hasMatch(first) ? first : '#';
    map.putIfAbsent(key, () => <T>[]).add(item);
  }

  final letters = map.keys.where((k) => k != '#').toList()..sort();
  final groups = letters.map((k) => IIndexGroup<T>(key: k, items: map[k]!)).toList();
  // 「#」压到最后：用户是来找人的，不该第一眼看到一堆杂项
  if (map.containsKey('#')) {
    groups.add(IIndexGroup<T>(key: '#', items: map['#']!));
  }
  return groups;
}

/// 手指在字母条上的位置对应哪个字母。
///
/// 用「落在哪一格」而不是「离哪个字母最近」：最近判定在两格交界处会来回跳，
/// 手指几乎没动、列表却在两个分组之间反复横跳。
int indexAt(double offsetY, double barHeight, int count) {
  if (count <= 0 || barHeight <= 0) return -1;
  final cell = barHeight / count;
  final raw = (offsetY / cell).floor();
  return raw < 0 ? 0 : (raw > count - 1 ? count - 1 : raw);
}

/// 列表滚到某处时，哪个分组该高亮。
///
/// 取「最后一个已经滚过顶部的分组」，而不是「第一个还在视野里的」：
/// 后者在分组很长时会一直高亮下一个分组——用户明明还在 A 里面，
/// 字母条却已经高亮到 B 了。
int activeIndex(List<double> offsets, double scrollTop) {
  var active = 0;
  for (var i = 0; i < offsets.length; i++) {
    if (offsets[i] <= scrollTop + 1) {
      active = i;
    } else {
      break;
    }
  }
  return active;
}
