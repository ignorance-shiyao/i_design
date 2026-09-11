/// 多选的取值与标签折叠规则（对应 packages/common/src/logic/multiselect.ts）。
///
/// 「选中了哪些」和「挤不下的怎么办」各端各写一遍，最先露馅的是顺序：
/// 一端按点击先后排、一端按数据源顺序排，同一份选择在两端读出来不一样。
library;

/// 切换一个值。
///
/// 新选中的追加在末尾，按点击先后排——不回到数据源顺序是因为标签就排在输入框里，
/// 刚点的那个跳到队伍中间会让人以为点错了，还得回去找。
List<T> toggleValue<T>(List<T> values, T value) {
  final at = values.indexOf(value);
  if (at < 0) return [...values, value];
  final out = [...values];
  out.removeAt(at);
  return out;
}

class CollapsedTags<T> {
  /// 完整显示的那几个
  final List<T> shown;

  /// 折起来的个数，0 表示没折
  final int rest;

  const CollapsedTags({required this.shown, required this.rest});
}

/// 标签折叠成「前几个 + 加 N」。
///
/// max 为 0 表示不折叠——全部显示，让输入框自己换行。
/// 折叠时至少留一个：留 0 个的话输入框里只剩一个「+8」，用户完全不知道自己选了什么。
CollapsedTags<T> collapseTags<T>(List<T> items, [int max = 0]) {
  if (max <= 0 || items.length <= max) {
    return CollapsedTags(shown: [...items], rest: 0);
  }
  final keep = max < 1 ? 1 : max;
  return CollapsedTags(shown: items.sublist(0, keep), rest: items.length - keep);
}
