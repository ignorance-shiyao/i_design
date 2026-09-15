/// 批量操作的纯逻辑（对应 packages/common/src/logic/bulk.ts，astra.md 的 B07）。
///
/// 只解决两件事，但它们是批量操作里唯一会造成真实损失的两件：
///
/// 一、「对谁做」必须说死。列表页上「全选」这个词有三种完全不同的含义：
/// 勾中的这几行、当前这一页、符合当前筛选的全部。三者在屏幕上差别极小，
/// 后果差着数量级——用户以为勾的是当前页的 20 行，实际发出去的是 8000 行。
///
/// 二、部分失败之后重试只发失败项。把整批重发一遍等于让已经成功的那些再执行
/// 一次；扣款、发货、发通知这类动作，第二次执行就是事故。
library;

/// 作用域。三个值，不许再多：
///   selected  用户逐行勾中的（可能跨页累计）
///   page      当前这一页的全部
///   matched   符合当前筛选的全部——它包含用户没看见过的行
enum IBulkScope { selected, page, matched }

class IBulkSelection {
  const IBulkSelection({
    required this.scope,
    required this.count,
    required this.summary,
    required this.ids,
    required this.needsConfirm,
    required this.confirmMessage,
  });

  final IBulkScope scope;

  /// 这一刻真正会被操作的条数
  final int count;

  /// 一句话说清「对谁做」。它会出现在操作条上，不是可选项
  final String summary;

  /// 能不能逐条列出这些 id。matched 返回 null——名单在服务端，
  /// 前端硬凑一份只会凑出「当前页的那些」，那正是这层要防的误解。
  final List<Object>? ids;

  /// 跨出「看得见的范围」了，要再确认一次
  final bool needsConfirm;

  /// 确认语。复述条数与范围，不能只说「确定吗」
  final String confirmMessage;
}

IBulkSelection _nothing(IBulkScope scope) => IBulkSelection(
      scope: scope,
      count: 0,
      summary: '未选择任何项',
      ids: const [],
      needsConfirm: false,
      confirmMessage: '',
    );

IBulkSelection bulkSelection({
  required IBulkScope scope,
  required List<Object> pageIds,
  required List<Object> selectedIds,
  required int matchedTotal,
  bool filtered = false,
}) {
  if (scope == IBulkScope.matched) {
    if (matchedTotal <= 0) return _nothing(scope);
    final where = filtered ? '符合当前筛选条件' : '全表';
    return IBulkSelection(
      scope: scope,
      count: matchedTotal,
      summary: '$where的全部 $matchedTotal 项',
      ids: null,
      needsConfirm: true,
      confirmMessage: '即将对$where的全部 $matchedTotal 项执行操作，其中包含当前页看不到的数据。',
    );
  }

  if (scope == IBulkScope.page) {
    if (pageIds.isEmpty) return _nothing(scope);
    return IBulkSelection(
      scope: scope,
      count: pageIds.length,
      summary: '当前页的 ${pageIds.length} 项',
      ids: List<Object>.from(pageIds),
      needsConfirm: false,
      confirmMessage: '',
    );
  }

  if (selectedIds.isEmpty) return _nothing(scope);
  return IBulkSelection(
    scope: scope,
    count: selectedIds.length,
    summary: '已勾选的 ${selectedIds.length} 项',
    ids: List<Object>.from(selectedIds),
    needsConfirm: false,
    confirmMessage: '',
  );
}

/// 该不该给「选择符合筛选的全部 N 项」这个入口。
///
/// 只在「当前页已经全勾上、而匹配总数还更多」时给：这时候用户的意图明显是
/// 「我要的不止这一页」。在别的时候摆出来，只会让人在没想清楚范围时点到它。
bool canEscalate({
  required List<Object> pageIds,
  required List<Object> selectedIds,
  required int matchedTotal,
}) {
  if (pageIds.isEmpty) return false;
  final selected = selectedIds.toSet();
  final wholePageSelected = pageIds.every(selected.contains);
  return wholePageSelected && matchedTotal > pageIds.length;
}

String escalateLabel(int matchedTotal, {bool filtered = false}) =>
    '选择${filtered ? '符合当前筛选条件' : '全表'}的全部 $matchedTotal 项';

/* ---------- 部分失败 ---------- */

class IBulkResultItem {
  const IBulkResultItem({required this.id, required this.ok, this.reason});
  final Object id;
  final bool ok;

  /// 失败原因。要能直接显示在那一行上，所以是给人看的句子，不是错误码
  final String? reason;
}

enum IBulkOutcomeKind { allOk, partial, allFailed }

class IBulkFailure {
  const IBulkFailure({required this.id, required this.reason});
  final Object id;
  final String reason;

  @override
  bool operator ==(Object other) =>
      other is IBulkFailure && other.id == id && other.reason == reason;

  @override
  int get hashCode => Object.hash(id, reason);
}

class IBulkOutcome {
  const IBulkOutcome({
    required this.kind,
    required this.total,
    required this.succeeded,
    required this.failed,
    required this.retryIds,
    required this.summary,
  });

  final IBulkOutcomeKind kind;
  final int total;
  final List<Object> succeeded;
  final List<IBulkFailure> failed;

  /// 重试只发这些：成功项再发一次就是重复执行
  final List<Object> retryIds;
  final String summary;
}

const String _kNoReason = '未知原因';

String _summarize(IBulkOutcomeKind kind, int total, int ok, int bad) {
  if (kind == IBulkOutcomeKind.allOk) return '$total 项全部成功';
  if (kind == IBulkOutcomeKind.allFailed) return '$total 项全部失败';
  return '$ok 项成功，$bad 项失败';
}

IBulkOutcome bulkOutcome(List<IBulkResultItem> items) {
  final succeeded = <Object>[];
  final failed = <IBulkFailure>[];
  for (final item in items) {
    if (item.ok) {
      succeeded.add(item.id);
    } else {
      final reason = (item.reason ?? '').trim();
      failed.add(IBulkFailure(id: item.id, reason: reason.isEmpty ? _kNoReason : reason));
    }
  }
  final total = items.length;
  final kind = failed.isEmpty
      ? IBulkOutcomeKind.allOk
      : succeeded.isEmpty
          ? IBulkOutcomeKind.allFailed
          : IBulkOutcomeKind.partial;
  return IBulkOutcome(
    kind: kind,
    total: total,
    succeeded: succeeded,
    failed: failed,
    retryIds: failed.map((f) => f.id).toList(),
    summary: _summarize(kind, total, succeeded.length, failed.length),
  );
}

/// 把一轮重试的结果并回上一轮。
///
/// 成功集只增不减：上一轮成功的那些这一轮根本没发出去，直接用后一轮覆盖，
/// 界面上就会显示「成功 2 项」而实际已经成功 18 项，用户会以为前面那批白做了。
IBulkOutcome mergeOutcome(IBulkOutcome previous, IBulkOutcome retry) {
  final succeeded = List<Object>.from(previous.succeeded);
  for (final id in retry.succeeded) {
    if (!succeeded.contains(id)) succeeded.add(id);
  }
  final stillFailed = retry.failed.where((f) => !succeeded.contains(f.id)).toList();
  final total = succeeded.length + stillFailed.length;
  final kind = stillFailed.isEmpty
      ? IBulkOutcomeKind.allOk
      : succeeded.isEmpty
          ? IBulkOutcomeKind.allFailed
          : IBulkOutcomeKind.partial;
  return IBulkOutcome(
    kind: kind,
    total: total,
    succeeded: succeeded,
    failed: stillFailed,
    retryIds: stillFailed.map((f) => f.id).toList(),
    summary: _summarize(kind, total, succeeded.length, stillFailed.length),
  );
}

/// 失败的行在表格里怎么标出来：给一张 id → 原因的表，行渲染时直接查
Map<String, String> failureIndex(IBulkOutcome outcome) => {
      for (final item in outcome.failed) '${item.id}': item.reason,
    };
