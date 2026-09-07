/// 分页规则的 Dart 移植。
///
/// Flutter 无法复用 TypeScript，因此这里按同一套算法重写；
/// scripts/check-parity.mjs 会用同一组用例校验两边输出一致，防止分叉。

/// 页码序列里的一项：要么是具体页码，要么是一处省略
class IPageItem {
  const IPageItem.page(this.page) : gap = null;
  const IPageItem.gap(this.gap) : page = null;

  final int? page;

  /// 'left' 或 'right'
  final String? gap;

  bool get isPage => page != null;
  bool get isLeftGap => gap == 'left';
}

int pageCountOf(int total, int pageSize) {
  final size = pageSize < 1 ? 1 : pageSize;
  final count = (total / size).ceil();
  return count < 1 ? 1 : count;
}

int clampPage(int page, int pageCount) {
  final max = pageCount < 1 ? 1 : pageCount;
  if (page < 1) return 1;
  return page > max ? max : page;
}

/// 始终保留首尾页，中间窗口跟随当前页滑动，断开处以省略占位
List<IPageItem> buildPages(int current, int pageCount, [int maxVisible = 5]) {
  final count = pageCount < 1 ? 1 : pageCount;
  final window = maxVisible < 1 ? 1 : maxVisible;

  if (count <= window + 2) {
    return List.generate(count, (i) => IPageItem.page(i + 1));
  }

  final half = window ~/ 2;
  var start = current - half;
  if (start < 2) start = 2;
  var end = start + window - 1;
  if (end >= count) {
    end = count - 1;
    start = end - window + 1;
    if (start < 2) start = 2;
  }

  final result = <IPageItem>[const IPageItem.page(1)];
  if (start > 2) result.add(const IPageItem.gap('left'));
  for (var i = start; i <= end; i++) {
    result.add(IPageItem.page(i));
  }
  if (end < count - 1) result.add(const IPageItem.gap('right'));
  result.add(IPageItem.page(count));
  return result;
}

String rangeText(int current, int pageSize, int total) {
  if (total == 0) return '共 0 条';
  final from = (current - 1) * pageSize + 1;
  final rawTo = current * pageSize;
  final to = rawTo > total ? total : rawTo;
  return '第 $from-$to 条 / 共 $total 条';
}
