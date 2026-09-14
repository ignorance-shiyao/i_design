/// 会话列表的纯逻辑（对应 packages/common/src/logic/chatlist.ts）。
///
/// 分组的档位、空标题的兜底、删除之后选谁——这三条各端各写一遍的话，
/// 同一份会话在两端会分进不同的组、删一条之后跳到不同的位置。
library;

/// 一条会话现在还能不能打开。「没权限」与「已失效」必须分开说——
/// 都笼统写成打不开的话，用户会一直重试一条永远打不开的会话。
enum ChatAccess { ok, forbidden, expired }

class ChatSessionData {
  const ChatSessionData({
    required this.id,
    required this.updatedAt,
    this.title = '',
    this.preview = '',
    this.pinned = false,
    this.archived = false,
    this.access = ChatAccess.ok,
    this.accessReason = '',
  });

  final String id;

  /// 最后活动时间（毫秒）
  final int updatedAt;

  /// 会话标题。智能体还没起名时是空的
  final String title;

  /// 已归档：默认不出现在列表里，但不是删除
  final bool archived;

  /// 能不能打开
  final ChatAccess access;

  /// 打不开的原因，直接显示给用户看
  final String accessReason;

  /// 最后一条消息的摘要，标题为空时顶上
  final String preview;

  /// 置顶的会话单独成组，排在时间分组之前
  final bool pinned;
}

/// 会话在列表里显示的标题。
///
/// 标题为空时用摘要顶上，摘要也没有才退到「新会话」——直接显示空白的话，
/// 用户会以为这条会话坏了。
String sessionTitle(ChatSessionData session, {int max = 28}) {
  final title = session.title.trim();
  if (title.isNotEmpty) return title;
  final preview = session.preview.replaceAll(RegExp(r'\s+'), ' ').trim();
  if (preview.isEmpty) return '新会话';
  return preview.length <= max ? preview : '${preview.substring(0, max - 1)}…';
}

enum ChatGroupKey { pinned, today, yesterday, week, earlier }

const Map<ChatGroupKey, String> _groupLabels = {
  ChatGroupKey.pinned: '置顶',
  ChatGroupKey.today: '今天',
  ChatGroupKey.yesterday: '昨天',
  ChatGroupKey.week: '最近 7 天',
  ChatGroupKey.earlier: '更早',
};

String chatGroupLabel(ChatGroupKey key) => _groupLabels[key]!;

class ChatGroupData {
  const ChatGroupData({required this.key, required this.label, required this.sessions});

  final ChatGroupKey key;
  final String label;
  final List<ChatSessionData> sessions;
}

int _startOfDay(int ms) {
  final d = DateTime.fromMillisecondsSinceEpoch(ms);
  return DateTime(d.year, d.month, d.day).millisecondsSinceEpoch;
}

bool _sameDay(DateTime a, DateTime b) =>
    a.year == b.year && a.month == b.month && a.day == b.day;

/// 一条会话属于哪一组。置顶优先于时间——置顶的意思就是「别让它沉下去」
ChatGroupKey groupKeyOf(ChatSessionData session, int now) {
  if (session.pinned) return ChatGroupKey.pinned;
  final today = DateTime.fromMillisecondsSinceEpoch(now);
  final at = DateTime.fromMillisecondsSinceEpoch(session.updatedAt);
  if (_sameDay(today, at)) return ChatGroupKey.today;
  final yesterday = DateTime.fromMillisecondsSinceEpoch(now - 24 * 3600 * 1000);
  if (_sameDay(yesterday, at)) return ChatGroupKey.yesterday;
  // 按天数而不是按 7×24 小时：昨晚 23 点的会话今早不该因为差了几小时就掉进「更早」
  final days = ((_startOfDay(now) - _startOfDay(session.updatedAt)) / (24 * 3600 * 1000)).floor();
  return days <= 7 ? ChatGroupKey.week : ChatGroupKey.earlier;
}

/// 分组后的会话。组内按最后活动时间倒序；空组不返回——
/// 「今天」底下一条也没有的话，那行组标题只是在占地方
List<ChatGroupData> groupSessions(List<ChatSessionData> sessions, int now) {
  const order = [
    ChatGroupKey.pinned,
    ChatGroupKey.today,
    ChatGroupKey.yesterday,
    ChatGroupKey.week,
    ChatGroupKey.earlier,
  ];
  final buckets = <ChatGroupKey, List<ChatSessionData>>{};
  for (final session in sessions) {
    buckets.putIfAbsent(groupKeyOf(session, now), () => []).add(session);
  }
  final out = <ChatGroupData>[];
  for (final key in order) {
    final list = buckets[key];
    if (list == null || list.isEmpty) continue;
    final sorted = [...list]..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    out.add(ChatGroupData(key: key, label: chatGroupLabel(key), sessions: sorted));
  }
  return out;
}

/// 按关键词过滤。标题与摘要都要搜——用户记得的往往是自己说过的那句话，
/// 而不是智能体起的标题。空白关键词返回全部而不是空列表
List<ChatSessionData> filterSessions(List<ChatSessionData> sessions, String query) {
  final q = query.trim().toLowerCase();
  if (q.isEmpty) return sessions;
  return [
    for (final s in sessions)
      if ('${s.title} ${s.preview}'.toLowerCase().contains(q)) s,
  ];
}

/// 删掉一条之后该选谁。
///
/// 删的不是当前这条时，当前选中不变。删的就是当前这条时选它的**后一条**，
/// 没有后一条才退到前一条：跳回第一条是最省事的写法，也是最坏的——
/// 用户正在看列表中段，删一条就被弹回顶部，他得重新找位置。
///
/// 「后一条」按分组压平之后的顺序算，不按原列表顺序。两者几乎从不一致：
/// 置顶的会话显示时被提到最前，原列表里还待在原位。
String nextAfterDelete(List<ChatGroupData> groups, String deletedId, String activeId) {
  if (deletedId != activeId) return activeId;
  final flat = [for (final g in groups) ...g.sessions];
  final index = flat.indexWhere((s) => s.id == deletedId);
  if (index < 0) return activeId;
  final rest = [
    for (final s in flat)
      if (s.id != deletedId) s,
  ];
  if (rest.isEmpty) return '';
  return (index < rest.length ? rest[index] : rest.last).id;
}

/// 上下移动落到哪一条。走的是分组压平之后的顺序，而不是原列表顺序：
/// 用户看到的是分好组的列表，按一下向下键却跳到别的组里去，那是两套顺序在打架
String moveActiveSession(List<ChatGroupData> groups, String activeId, int step) {
  final flat = [for (final g in groups) ...g.sessions];
  if (flat.isEmpty) return activeId;
  final index = flat.indexWhere((s) => s.id == activeId);
  if (index < 0) return flat.first.id;
  var next = index + step;
  if (next < 0) next = 0;
  if (next > flat.length - 1) next = flat.length - 1;
  return flat[next].id;
}


/// 打不开时显示什么。原因由后端给，给不出时也要有一句能读的话
String accessReasonOf(ChatSessionData session) {
  if (session.access == ChatAccess.ok) return '';
  if (session.accessReason.trim().isNotEmpty) return session.accessReason.trim();
  return session.access == ChatAccess.forbidden ? '没有这条会话的权限' : '这条会话已失效';
}

bool canOpenSession(ChatSessionData session) => session.access == ChatAccess.ok;

/// 列表视图：默认只看未归档的，归档视图只看归档的。两边都不含彼此
List<ChatSessionData> visibleSessions(List<ChatSessionData> sessions, {bool archived = false}) =>
    sessions.where((s) => s.archived == archived).toList();
