/// 工具芯片的统计与汇总（对应 packages/common/src/logic/toolchip.ts）。
///
/// 同一次调用在这一端写「13 增 4 删」、在 Web 上写「+13 −4」的话，
/// 读者会以为是两件事。所以写法必须逐字一致。
library;

enum IToolChipStatus { running, success, error }

class IToolChipItem {
  const IToolChipItem({
    required this.key,
    required this.label,
    this.status = IToolChipStatus.success,
    this.added = 0,
    this.removed = 0,
  });

  final String key;

  /// 芯片上的主文字：工具名或被改的文件名
  final String label;
  final IToolChipStatus status;
  final int added;
  final int removed;
}

class IToolChipSummary {
  const IToolChipSummary({
    required this.total,
    required this.running,
    required this.failed,
    required this.added,
    required this.removed,
  });

  final int total;
  final int running;
  final int failed;
  final int added;
  final int removed;
}

/// 改动统计写成一段字。
///
/// 零的那一半不写——「+13 −0」里的 0 不带信息，却和真数字长得一样。
/// 减号用 U+2212 而不是连字符：连字符比数字矮一截，排在一起看着像断开的。
String toolChipStat([int added = 0, int removed = 0]) {
  final parts = <String>[];
  if (added > 0) parts.add('+$added');
  if (removed > 0) parts.add('−$removed');
  return parts.join(' ');
}

/// 一排芯片的汇总。失败单独计数：十次里有一次失败与十次全成是两件事。
IToolChipSummary summarizeToolChips(List<IToolChipItem> items) {
  var running = 0;
  var failed = 0;
  var added = 0;
  var removed = 0;
  for (final item in items) {
    if (item.status == IToolChipStatus.running) running++;
    if (item.status == IToolChipStatus.error) failed++;
    added += item.added;
    removed += item.removed;
  }
  return IToolChipSummary(
    total: items.length,
    running: running,
    failed: failed,
    added: added,
    removed: removed,
  );
}

/// 状态对应的图标名。进行中不在这里：那一格是转圈的加载指示器，不是静态图标。
String toolChipIcon([IToolChipStatus status = IToolChipStatus.success]) =>
    status == IToolChipStatus.error ? 'error-circle' : 'check-circle';
