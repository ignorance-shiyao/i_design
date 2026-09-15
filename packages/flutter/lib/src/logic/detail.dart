/// 详情页的纯逻辑（对应 packages/common/src/logic/detail.ts，astra.md 的 B12）。
///
/// 详情页看着只是「把一条记录摊开」，真正难的是四件事：
///
/// 一、这条记录现在能做什么。状态不允许的动作**不出现**（它在这个状态下根本
/// 不是一个动作，灰着只会让人反复去试）；没权限的动作**出现但停用并说明原因**
/// （藏起来的话用户会以为功能不存在，转头去提工单）。
///
/// 二、看到的这一份还作不作数。详情页停留期间别人改了、删了，写动作要停掉，
/// 并明说「你看到的是 v3，现在已经是 v5」——只说「操作失败」等于让人再点一次。
///
/// 三、回到列表要回到原来那个位置。
///
/// 四、上一条 / 下一条。到头了不要把按钮藏掉，说清「已经是第一条」。
library;

import 'dart:convert';

/* ---------- 这一份还作不作数 ---------- */

enum IRecordFreshness { fresh, stale, deleted }

enum IFreshnessAction { none, refresh, back }

class IFreshnessState {
  const IFreshnessState({
    required this.kind,
    required this.label,
    required this.detail,
    required this.action,
  });

  final IRecordFreshness kind;

  /// 状态本身。颜色不是唯一线索，这句话必须出现
  final String label;
  final String detail;
  final IFreshnessAction action;
}

IFreshnessState recordFreshness({
  required int seenRevision,
  required int currentRevision,
  bool exists = true,
}) {
  if (!exists) {
    return const IFreshnessState(
      kind: IRecordFreshness.deleted,
      label: '已被删除',
      detail: '这条记录已经不在了，页面上显示的是你进来时的那一份',
      action: IFreshnessAction.back,
    );
  }
  if (currentRevision > seenRevision) {
    return IFreshnessState(
      kind: IRecordFreshness.stale,
      label: '已被他人更新',
      // 只说「操作失败」等于让用户再点一次，所以把两个版本号都摆出来
      detail: '你看到的是 v$seenRevision，现在已经是 v$currentRevision',
      action: IFreshnessAction.refresh,
    );
  }
  return const IFreshnessState(
    kind: IRecordFreshness.fresh,
    label: '最新',
    detail: '',
    action: IFreshnessAction.none,
  );
}

/* ---------- 这条记录现在能做什么 ---------- */

enum IDetailActionKind { primary, standard, danger }

class IDetailActionSpec {
  const IDetailActionSpec({
    required this.key,
    required this.label,
    this.kind = IDetailActionKind.standard,
    this.states,
    this.permission,
    this.readOnly = false,
  });

  final String key;
  final String label;
  final IDetailActionKind kind;

  /// 这个动作在哪些状态下才算一个动作。null 表示任何状态都算。
  /// 不在其中就**不出现**——不是灰着。
  final List<String>? states;

  /// 需要的权限。缺了就出现但停用，并说明原因
  final String? permission;

  /// 只读动作（导出、打印）。记录失效时它们照样可用——
  /// 把「打印」一起停掉，只会让用户以为整页坏了。
  final bool readOnly;
}

class IDetailAction {
  const IDetailAction({
    required this.key,
    required this.label,
    required this.kind,
    required this.disabled,
    required this.reason,
  });

  final String key;
  final String label;
  final IDetailActionKind kind;
  final bool disabled;

  /// 停用原因。disabled 为 true 时一定不是空串
  final String reason;
}

/// 算出这一刻该摆出哪些动作、哪些是灰的、为什么灰。
///
/// 三条停用理由的优先级：权限 > 失效 > 业务规则。权限排第一是因为它最稳定——
/// 刷新一百次也不会变，先说它才不会让用户去做无用功。
List<IDetailAction> detailActions(
  List<IDetailActionSpec> specs, {
  required String status,
  List<String> permissions = const [],
  IRecordFreshness freshness = IRecordFreshness.fresh,
  Map<String, String> denied = const {},
}) {
  final granted = permissions.toSet();
  final out = <IDetailAction>[];

  for (final spec in specs) {
    // 状态不允许的动作根本不出现：灰着摆在那儿只会让人反复去试
    if (spec.states != null && !spec.states!.contains(status)) continue;

    var reason = '';
    if (spec.permission != null && !granted.contains(spec.permission)) {
      reason = '需要「${spec.permission}」权限';
    } else if (!spec.readOnly && freshness != IRecordFreshness.fresh) {
      reason = freshness == IRecordFreshness.deleted
          ? '这条记录已被删除'
          : '这条记录已被他人更新，请先刷新';
    } else if (denied[spec.key] != null) {
      reason = denied[spec.key]!;
    }

    out.add(IDetailAction(
      key: spec.key,
      label: spec.label,
      kind: spec.kind,
      disabled: reason.isNotEmpty,
      reason: reason,
    ));
  }
  return out;
}

/// 一个动作都没有时说什么。空白一片会让人以为页面没加载完
String noActionHint(String status) => '「$status」状态下没有可执行的操作';

/* ---------- 上一条 / 下一条 ---------- */

class INeighbours {
  const INeighbours({
    required this.index,
    required this.total,
    required this.prevId,
    required this.nextId,
    required this.position,
    required this.edgeHint,
  });

  /// 在这批 id 里排第几，从 0 起。不在其中是 -1
  final int index;
  final int total;
  final String? prevId;
  final String? nextId;

  /// 「第 3 条，共 128 条」。不在这批里时是空串
  final String position;

  /// 到头了说什么。没到头是空串
  final String edgeHint;
}

INeighbours detailNeighbours(List<String> ids, String currentId) {
  final index = ids.indexOf(currentId);
  final total = ids.length;
  if (index < 0) {
    return INeighbours(
      index: -1,
      total: total,
      prevId: null,
      nextId: null,
      position: '',
      edgeHint: '',
    );
  }
  final prevId = index > 0 ? ids[index - 1] : null;
  final nextId = index < total - 1 ? ids[index + 1] : null;
  // 到头了不把按钮藏掉——藏掉会让人以为是页面坏了
  final edgeHint = total <= 1
      ? '只有这一条'
      : prevId == null
          ? '已经是第一条'
          : nextId == null
              ? '已经是最后一条'
              : '';
  return INeighbours(
    index: index,
    total: total,
    prevId: prevId,
    nextId: nextId,
    position: '第 ${index + 1} 条，共 $total 条',
    edgeHint: edgeHint,
  );
}

/* ---------- 从哪儿来，回哪儿去 ---------- */

class IReturnTicket {
  const IReturnTicket({required this.search, required this.scrollY, this.focusId});

  /// 列表当时的查询串（含筛选与页码），原样带回去
  final String search;

  /// 列表当时滚到哪儿。取整到像素——小数在不同缩放下还原不回同一位置
  final int scrollY;

  /// 从哪一行点进来的。回去之后把它高亮一下
  final String? focusId;

  @override
  bool operator ==(Object other) =>
      other is IReturnTicket &&
      other.search == search &&
      other.scrollY == scrollY &&
      other.focusId == focusId;

  @override
  int get hashCode => Object.hash(search, scrollY, focusId);
}

/// 用 JSON 而不是自定义分隔符：查询串里本来就什么字符都可能有，
/// 自己拼分隔符迟早会被一个带 & 的筛选值劈开。
String packReturn(IReturnTicket ticket) {
  final payload = <String, Object?>{
    's': ticket.search,
    'y': ticket.scrollY < 0 ? 0 : ticket.scrollY,
  };
  if (ticket.focusId != null && ticket.focusId!.isNotEmpty) payload['f'] = ticket.focusId;
  return jsonEncode(payload);
}

/// 解不出来就返回 null，不抛错：这张票据来自 URL，用户会手改、会截断。
/// 调用方拿到 null 就退回列表顶部——不精确但绝不出错的落点。
IReturnTicket? unpackReturn(String? raw) {
  if (raw == null || raw.isEmpty) return null;
  try {
    final parsed = jsonDecode(raw);
    if (parsed is! Map) return null;
    final search = parsed['s'] is String ? parsed['s'] as String : '';
    final rawY = parsed['y'];
    final y = rawY is num && rawY.isFinite ? (rawY < 0 ? 0 : rawY.toInt()) : 0;
    final f = parsed['f'];
    return IReturnTicket(
      search: search,
      scrollY: y,
      focusId: f is String && f.isNotEmpty ? f : null,
    );
  } catch (_) {
    return null;
  }
}

/// 返回按钮上该写什么。带上「回到第几页」比光写「返回」有用得多
String returnLabel(IReturnTicket? ticket, {String fallback = '返回列表'}) {
  if (ticket == null) return fallback;
  final match = RegExp(r'(?:^|[?&])page=(\d+)').firstMatch(ticket.search);
  if (match == null) return fallback;
  // page 参数从 0 起算的居多，显示时补成人读的第几页
  return '返回列表第 ${int.parse(match.group(1)!) + 1} 页';
}
