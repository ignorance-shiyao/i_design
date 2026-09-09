/// 表格排序规则的 Dart 移植（对应 packages/common/src/logic/table.ts）。
///
/// 与分页一样，Flutter 端无法复用 TypeScript，只能按同一套算法重写；
/// scripts/check-parity.mjs 用同一组用例校验两边输出一致，防止分叉。
library;

enum ISortOrder { asc, desc }

/// 三态循环：无序 → 升序 → 降序 → 无序
ISortOrder? nextSortOrder(ISortOrder? order) => switch (order) {
      null => ISortOrder.asc,
      ISortOrder.asc => ISortOrder.desc,
      ISortOrder.desc => null,
    };

/// 数值按大小比较，其余按字符串比较；空值恒排在后面（不受升降序影响）。
///
/// 已知差异：Web 端用 localeCompare('zh-CN')，即中文按拼音排序，
/// 而 Dart 的 compareTo 按码点排序，中文结果会与 Web 端不同。
/// 需要严格一致时请给列传 cellBuilder 之外的显式排序键（如拼音字段），
/// 黄金测试因此只覆盖数值与 ASCII 文本。
List<Map<String, Object?>> sortRows(
  List<Map<String, Object?>> rows,
  String? key,
  ISortOrder? order,
) {
  if (key == null || order == null) return rows;
  final factor = order == ISortOrder.asc ? 1 : -1;
  final sorted = List<Map<String, Object?>>.from(rows);
  sorted.sort((a, b) {
    final av = a[key];
    final bv = b[key];
    if (av == bv) return 0;
    // 空值总在末尾：与 Web 端一致，避免「排一下序空行跑到最前面」
    if (av == null) return 1;
    if (bv == null) return -1;
    if (av is num && bv is num) return (av < bv ? -1 : 1) * factor;
    return av.toString().compareTo(bv.toString()) * factor;
  });
  return sorted;
}
