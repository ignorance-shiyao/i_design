/// 智能体交互的共享逻辑：与 Web 端 logic/agent.ts 同一套判断。
library;

/* ---------- 征求确认 ---------- */

class IApprovalOption {
  const IApprovalOption({required this.value, required this.label, this.hint});
  final String value;
  final String label;

  /// 附加说明，比如「（核心线）」
  final String? hint;
}

class IApprovalQuestion {
  const IApprovalQuestion({
    required this.id,
    required this.title,
    required this.options,
    this.multiple = false,
    this.allowCustom = false,
    this.customPlaceholder,
    this.skippable = false,
  });

  final String id;
  final String title;
  final List<IApprovalOption> options;
  final bool multiple;
  final bool allowCustom;
  final String? customPlaceholder;
  final bool skippable;
}

/// 能否进入下一题。
/// 有自由输入时，填了文字也算已回答——否则用户写完「其他」的内容却发现
/// 继续按钮仍然是灰的，只能回头再去点一个不想选的选项。
bool canAdvance(
  IApprovalQuestion question,
  Iterable<String> selected, [
  String custom = '',
]) {
  if (question.skippable) return true;
  return selected.isNotEmpty || custom.trim().isNotEmpty;
}

/// 当前进度文本，如「2/3」
String approvalProgress(int index, int total) =>
    '${index + 1 > total ? total : index + 1}/$total';

/// 单选时替换、多选时切换
List<String> toggleApprovalValue(
  IApprovalQuestion question,
  Iterable<String> selected,
  String value,
) {
  if (!question.multiple) return [value];
  final next = <String>{...selected};
  if (next.contains(value)) {
    next.remove(value);
  } else {
    next.add(value);
  }
  return next.toList();
}

/* ---------- 任务行 ---------- */

enum IAgentTaskStatus { pending, running, completed, failed }

class IAgentTask {
  const IAgentTask({
    required this.id,
    required this.title,
    required this.status,
    this.meta,
    this.detail,
    this.step,
  });

  final String id;
  final String title;
  final IAgentTaskStatus status;

  /// 右侧的量化结果，如「12 个供应商」
  final String? meta;

  /// 展开后的细节
  final String? detail;

  /// 运行中的序号
  final int? step;
}

class ITaskSummary {
  const ITaskSummary({
    required this.total,
    required this.completed,
    required this.failed,
    required this.running,
    required this.settled,
    required this.percent,
  });

  final int total;
  final int completed;
  final int failed;
  final int running;
  final bool settled;
  final int percent;
}

/// 任务列表的汇总。
/// percent 把失败也算作「已结束」，否则一个永远失败的任务会让进度条
/// 卡在 90% 不动，用户以为还在跑。
ITaskSummary summarizeTasks(List<IAgentTask> tasks) {
  final total = tasks.length;
  final completed =
      tasks.where((t) => t.status == IAgentTaskStatus.completed).length;
  final failed = tasks.where((t) => t.status == IAgentTaskStatus.failed).length;
  final running =
      tasks.where((t) => t.status == IAgentTaskStatus.running).length;
  final settledCount = completed + failed;
  return ITaskSummary(
    total: total,
    completed: completed,
    failed: failed,
    running: running,
    settled: total > 0 && settledCount == total,
    percent: total == 0 ? 0 : ((settledCount / total) * 100).round(),
  );
}

/* ---------- 建议卡的置信度 ---------- */

enum IConfidenceLevel { low, medium, high }

class IConfidence {
  const IConfidence({
    required this.level,
    required this.bars,
    required this.label,
  });

  final IConfidenceLevel level;

  /// 点亮几格，共 3 格
  final int bars;
  final String label;
}

/// 把 0–1 的置信度分档。
/// 用三档而不是直接显示百分比：模型给出的 0.73 并不比 0.71 更可信，
/// 把它当成精确数字展示会让用户对它做过度解读。
IConfidence confidenceOf(double score) {
  final value = score.isFinite ? score.clamp(0.0, 1.0) : 0.0;
  if (value >= 0.75) {
    return const IConfidence(
        level: IConfidenceLevel.high, bars: 3, label: '高置信度');
  }
  if (value >= 0.45) {
    return const IConfidence(
        level: IConfidenceLevel.medium, bars: 2, label: '中等置信度');
  }
  return const IConfidence(level: IConfidenceLevel.low, bars: 1, label: '低置信度');
}
