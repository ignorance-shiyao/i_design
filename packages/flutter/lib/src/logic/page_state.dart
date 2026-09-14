/// 页面状态判定的 Dart 移植。
///
/// Flutter 无法复用 TypeScript，因此按同一套规则重写；
/// 判定顺序是这一层唯一的复杂度，两边必须完全一致——
/// 差一步就会在某一端把「部分成功」判成「失败」，把已经成功的那批数据清空。
enum IPageStateKind { ready, loading, empty, forbidden, failed, offline, partial, stale }

enum IPageStateAction { retry, reload, requestAccess, goOnline, refresh }

class IPageStateResult {
  const IPageStateResult({
    required this.kind,
    required this.reason,
    required this.keepsContent,
    this.action,
  });

  final IPageStateKind kind;
  final String reason;
  final bool keepsContent;
  final IPageStateAction? action;
}

const Map<IPageStateAction, String> iPageStateActionLabels = {
  IPageStateAction.retry: '重试',
  IPageStateAction.reload: '重新加载',
  IPageStateAction.requestAccess: '申请权限',
  IPageStateAction.goOnline: '重新连接',
  IPageStateAction.refresh: '刷新数据',
};

/// 判定顺序：离线 → 无权限 → 部分成功 → 失败 → 加载中 → 空 → 过期 → 正常
IPageStateResult iPageState({
  bool loading = false,
  bool online = true,
  Object? errorCode,
  String? errorMessage,
  bool hasError = false,
  int loaded = 0,
  int failed = 0,
  int? fetchedAt,
  int? staleAfter,
  int? now,
}) {
  if (!online) {
    return IPageStateResult(
      kind: IPageStateKind.offline,
      reason: '当前网络不可用',
      keepsContent: loaded > 0,
      action: IPageStateAction.goOnline,
    );
  }

  final error = hasError || errorCode != null || errorMessage != null;
  if (errorCode == 403 || errorCode == '403') {
    return IPageStateResult(
      kind: IPageStateKind.forbidden,
      reason: (errorMessage == null || errorMessage.isEmpty) ? '当前账号没有这个资源的权限' : errorMessage,
      keepsContent: false,
      action: IPageStateAction.requestAccess,
    );
  }

  if (failed > 0 && loaded > 0) {
    return IPageStateResult(
      kind: IPageStateKind.partial,
      reason: '$loaded 条成功，$failed 条失败',
      keepsContent: true,
      action: IPageStateAction.retry,
    );
  }

  if (error) {
    final message = (errorMessage == null || errorMessage.isEmpty) ? '请求失败' : errorMessage;
    final code = errorCode == null ? '' : '（$errorCode）';
    return IPageStateResult(
      kind: IPageStateKind.failed,
      reason: '$message$code',
      keepsContent: false,
      action: IPageStateAction.retry,
    );
  }

  if (loading) {
    return IPageStateResult(
      kind: IPageStateKind.loading,
      reason: '正在加载',
      keepsContent: loaded > 0,
    );
  }

  if (loaded == 0) {
    return const IPageStateResult(
      kind: IPageStateKind.empty,
      reason: '这里还没有内容',
      keepsContent: false,
    );
  }

  if (fetchedAt != null && staleAfter != null) {
    final current = now ?? DateTime.now().millisecondsSinceEpoch;
    if (current - fetchedAt > staleAfter) {
      return IPageStateResult(
        kind: IPageStateKind.stale,
        reason: '数据是 ${((current - fetchedAt) / 60000).round()} 分钟前的',
        keepsContent: true,
        action: IPageStateAction.refresh,
      );
    }
  }

  return const IPageStateResult(kind: IPageStateKind.ready, reason: '', keepsContent: true);
}
