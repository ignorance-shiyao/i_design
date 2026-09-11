/// 区间取值的共用规则（与 packages/common/src/logic/range.ts 同名同算法）。
///
/// 「起大于止」这件事每个端都会遇到，而处理方式必须一致：
/// 一端自动对调、另一端标红报错的话，同一份数据在两端上得到的结果不同。

/// 两端都为空才算空。只填了一头是「填了一半」，不是没填
bool isRangeEmpty(List<String> value) => value[0].isEmpty && value[1].isEmpty;

/// 默认比较：两端都是数字就按数字比，否则按字典序。
/// 日期按 ISO 格式写时字典序与时间序一致，因此不需要单独一条分支。
int defaultRangeCompare(String a, String b) {
  final na = num.tryParse(a);
  final nb = num.tryParse(b);
  if (na != null && nb != null) {
    return na == nb ? 0 : (na > nb ? 1 : -1);
  }
  return a == b ? 0 : (a.compareTo(b) > 0 ? 1 : -1);
}

/// 起止对调。
///
/// 只在两端都有值、且确实反了的时候动手——用户正在把「100」改成「10」的中途，
/// 数值会短暂地小于起点，这时对调会把他刚敲的字搬到另一个框里。
/// 因此只在失焦或提交时调用，不在输入过程中调用。
List<String> orderRange(List<String> value, [int Function(String, String)? compare]) {
  final start = value[0];
  final end = value[1];
  if (start.isEmpty || end.isEmpty) return value;
  final cmp = compare ?? defaultRangeCompare;
  return cmp(start, end) > 0 ? [end, start] : value;
}
