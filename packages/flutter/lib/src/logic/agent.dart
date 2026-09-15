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

/* ---------- 确认还作不作数 ---------- */

/// 一条待确认在这一刻还能不能拍板（对应 Web 端的 approvalGate）。
///
/// 征求确认的卡片会在屏幕上待很久——人去开了个会、切走看别的。回来时那个动作
/// 可能已经不该再执行了，而卡片长得和刚发出来时一模一样：按钮还亮着。
///
/// 两种「不该再执行」出口不同：过期只是等太久了，前提没变，出口是重新发起；
/// 版本失效是被确认的东西改了，出口是先看新版本——对着 v2 点的「同意」
/// 不该落到 v3 上。两者同时成立时以版本失效为准。
enum IApprovalGateState { open, expiring, expired, stale }

enum IApprovalGateAction { none, renew, review }

class IApprovalGate {
  const IApprovalGate({
    required this.state,
    required this.decidable,
    required this.label,
    required this.detail,
    required this.action,
    this.remaining,
  });

  final IApprovalGateState state;

  /// 这一刻还能不能做决定。false 时选项与确认按钮都要停用
  final bool decidable;

  /// 距离过期还有几秒。没有期限或已过期时为 null
  final int? remaining;

  /// 状态本身。颜色不是唯一线索，这句话必须出现
  final String label;
  final String detail;
  final IApprovalGateAction action;
}

/// 默认提前 30 秒开始报剩余时间：再早会变成一直在催，再晚来不及反应
const int kApprovalWarnBefore = 30000;

/// 剩余秒数。向上取整：显示「10 秒」时真实剩余不超过 10 秒
int approvalRemaining(int expiresAt, int now) {
  final diff = expiresAt - now;
  if (diff <= 0) return 0;
  return (diff + 999) ~/ 1000;
}

IApprovalGate approvalGate({
  required int now,
  int? expiresAt,
  int? version,
  int? currentVersion,
  int warnBefore = kApprovalWarnBefore,
}) {
  // 版本失效压过过期：给一条针对旧版本的确认续期，等于把「内容变了」悄悄抹掉
  if (version != null && currentVersion != null && currentVersion != version) {
    return IApprovalGate(
      state: IApprovalGateState.stale,
      decidable: false,
      label: '内容已更新',
      detail: '这条确认是针对第 $version 版发出的，现在是第 $currentVersion 版',
      action: IApprovalGateAction.review,
    );
  }

  if (expiresAt == null) {
    return const IApprovalGate(
      state: IApprovalGateState.open,
      decidable: true,
      label: '待确认',
      detail: '',
      action: IApprovalGateAction.none,
    );
  }

  final remaining = approvalRemaining(expiresAt, now);
  if (remaining <= 0) {
    return const IApprovalGate(
      state: IApprovalGateState.expired,
      decidable: false,
      label: '已过期',
      detail: '这条确认等待太久已失效，需要重新发起',
      action: IApprovalGateAction.renew,
    );
  }

  if (expiresAt - now <= warnBefore) {
    return IApprovalGate(
      state: IApprovalGateState.expiring,
      decidable: true,
      remaining: remaining,
      label: '即将过期',
      detail: '还有 $remaining 秒',
      action: IApprovalGateAction.none,
    );
  }

  return IApprovalGate(
    state: IApprovalGateState.open,
    decidable: true,
    remaining: remaining,
    label: '待确认',
    detail: '',
    action: IApprovalGateAction.none,
  );
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


/* ---------- 上下文卡（检索到的知识片段） ---------- */

class IContextChunk {
  const IContextChunk({
    required this.id,
    required this.title,
    required this.content,
    this.source,
    this.href,
    this.score,
  });

  final String id;
  final String title;
  final String content;

  /// 出处文件名，用于取类型图标
  final String? source;
  final String? href;

  /// 检索相关度 0–1
  final double? score;
}

/// 片段的字符数。
/// 用字符数而不是 token 数：token 是模型的内部单位，同一段文字在不同模型下
/// 数值不同，用户无从判断这个数字意味着什么。
/// 按 runes 计数而不是 length——Dart 的 String.length 是 UTF-16 单元数，
/// emoji 会被算成 2。
int chunkLength(String content) => content.runes.length;

/// 超长片段折叠后的预览文本，按字符截断并补省略号
String chunkPreview(String content, [int limit = 140]) {
  final runes = content.runes.toList();
  if (runes.length <= limit) return content;
  return '\${String.fromCharCodes(runes.take(limit))}…';
}

/* ---------- 差异表（智能体提出的成批改动） ---------- */

enum IDiffRowKind { added, removed, changed, unchanged }

class IDiffCell {
  const IDiffCell({required this.value, this.before});
  final String value;

  /// 变更前的值；有它才渲染删除线
  final String? before;
}

class IDiffRow {
  const IDiffRow({required this.id, required this.kind, required this.cells});
  final String id;
  final IDiffRowKind kind;
  final Map<String, IDiffCell> cells;
}

class IDiffSummary {
  const IDiffSummary({
    required this.added,
    required this.removed,
    required this.changed,
    required this.selected,
    required this.total,
  });

  final int added;
  final int removed;
  final int changed;

  /// 已勾选的改动数 —— 底部按钮上的 N
  final int selected;

  /// 有改动的行总数（不含未变行）
  final int total;
}

/// 差异统计。
/// 未变的行不计入总数——它们只是上下文，让用户看清改动落在哪里。
/// 把它们算进「共 N 处改动」会让数字大得没有意义。
IDiffSummary summarizeDiff(List<IDiffRow> rows, Iterable<String> selected) {
  final picked = selected.toSet();
  final changedRows =
      rows.where((r) => r.kind != IDiffRowKind.unchanged).toList();
  return IDiffSummary(
    added: changedRows.where((r) => r.kind == IDiffRowKind.added).length,
    removed: changedRows.where((r) => r.kind == IDiffRowKind.removed).length,
    changed: changedRows.where((r) => r.kind == IDiffRowKind.changed).length,
    selected: changedRows.where((r) => picked.contains(r.id)).length,
    total: changedRows.length,
  );
}

/// 默认全选所有改动：智能体给的是一整套方案，逐个勾选反而是例外
List<String> defaultDiffSelection(List<IDiffRow> rows) => rows
    .where((r) => r.kind != IDiffRowKind.unchanged)
    .map((r) => r.id)
    .toList();

/// 切换一行的采纳状态；未变行不可切换
List<String> toggleDiffRow(
  List<IDiffRow> rows,
  Iterable<String> selected,
  String id,
) {
  IDiffRow? row;
  for (final r in rows) {
    if (r.id == id) {
      row = r;
      break;
    }
  }
  if (row == null || row.kind == IDiffRowKind.unchanged) {
    return selected.toList();
  }
  final next = <String>{...selected};
  if (next.contains(id)) {
    next.remove(id);
  } else {
    next.add(id);
  }
  return next.toList();
}

/// 底部按钮文案：没有勾选时说清楚为什么不能点
String diffActionLabel(IDiffSummary summary) {
  if (summary.total == 0) return '没有需要应用的改动';
  if (summary.selected == 0) return '未选择改动';
  return '应用 \${summary.selected} 处改动';
}
