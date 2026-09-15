/// 评论线程、活动记录与未读定位的 Dart 移植（对应 packages/common/src/logic/thread.ts）。
///
/// 四条规矩与 Web 端逐字一致：
///
/// 一、**删掉的父评论要留一个坑**——抽走之后底下那几条回复就挂在空气里：
/// 「同意」「那按这个来」——同意什么？有回复的删掉后留「该评论已删除」，
/// 没有回复的才真的消失。
///
/// 二、**未读分隔线在打开的那一刻钉死，之后不许动**——跟着新评论往下跑的话，
/// 用户正读到一半，那条线就从他上方溜到了下方，他再也找不到读到哪儿了。
///
/// 三、**自己说的话不算未读**——否则刚发完一条就有一个未读角标，
/// 那个数字永远回不到零。
///
/// 四、**发失败的评论留在原地带着原文**——悄悄丢掉是最糟的：
/// 用户切走再回来什么都没有，而他以为发出去了。
library;

enum IThreadEntryKind { comment, activity }

enum ISendState { sending, failed }

/// 线程里的一条。评论与活动记录共用一个基类，好让它们按时间穿插——
/// 分成两个列表的话，读者永远拼不出「当时到底发生了什么」
abstract class IThreadEntry {
  const IThreadEntry({required this.id, required this.createdAt});

  final String id;
  final int createdAt;

  IThreadEntryKind get kind;

  /// 这一条是谁产生的
  String get byId;
}

class IThreadComment extends IThreadEntry {
  const IThreadComment({
    required super.id,
    required super.createdAt,
    required this.authorId,
    required this.authorName,
    required this.body,
    this.parentId,
    this.editedAt,
    this.deleted = false,
    this.mentions = const [],
    this.sendState,
    this.sendError,
  });

  final String authorId;
  final String authorName;
  final String body;

  /// 回复谁。顶层评论没有
  final String? parentId;
  final int? editedAt;

  /// 已被删除。正文不再可信，界面上只留一个坑
  final bool deleted;
  final List<String> mentions;

  /// 发送状态。null 表示已经在服务端落下了
  final ISendState? sendState;
  final String? sendError;

  @override
  IThreadEntryKind get kind => IThreadEntryKind.comment;

  @override
  String get byId => authorId;

  IThreadComment copyWithSend(ISendState? state, String? error) => IThreadComment(
        id: id,
        createdAt: createdAt,
        authorId: authorId,
        authorName: authorName,
        body: body,
        parentId: parentId,
        editedAt: editedAt,
        deleted: deleted,
        mentions: mentions,
        sendState: state,
        sendError: error,
      );
}

class IThreadActivity extends IThreadEntry {
  const IThreadActivity({
    required super.id,
    required super.createdAt,
    required this.actorId,
    required this.actorName,
    required this.change,
  });

  final String actorId;
  final String actorName;

  /// 改了什么。「负责人：林岚 → 沈黎」
  final String change;

  @override
  IThreadEntryKind get kind => IThreadEntryKind.activity;

  @override
  String get byId => actorId;
}

class IThreadNode {
  const IThreadNode({
    required this.comment,
    required this.replies,
    required this.tombstone,
  });

  final IThreadComment comment;
  final List<IThreadNode> replies;

  /// 被删掉但**留着位置**：底下还有回复，抽走就会让它们挂在空气里
  final bool tombstone;
}

class IThreadItem {
  const IThreadItem.comment(IThreadNode this.node)
      : kind = IThreadEntryKind.comment,
        activities = const [],
        summary = '';
  const IThreadItem.activity(this.activities, this.summary)
      : kind = IThreadEntryKind.activity,
        node = null;

  final IThreadEntryKind kind;
  final IThreadNode? node;

  /// 连续的活动记录折起来的一组
  final List<IThreadActivity> activities;
  final String summary;
}

/// 删掉的评论显示什么
const String kDeletedBody = '该评论已删除';

/// 一组活动记录折起来之后那句话。
/// 几个人一起改的不合并人名——把三个人的改动说成一个人做的，是在记错账
String activitySummary(List<IThreadActivity> activities) {
  if (activities.length == 1) {
    return '${activities[0].actorName} ${activities[0].change}';
  }
  final actors = {for (final a in activities) a.actorId};
  return actors.length == 1
      ? '${activities[0].actorName} 修改了 ${activities.length} 项'
      : '${activities.length} 条变更';
}

/// 把一串平铺的条目组织成「按时间穿插、回复挂在父评论下面」的结构
List<IThreadItem> threadItems(List<IThreadEntry> entries) {
  final indexed = [
    for (var i = 0; i < entries.length; i += 1) (index: i, entry: entries[i])
  ];
  // 按原下标稳定化：JS 的 Array.sort 是稳定排序，Dart 的不是
  indexed.sort((a, b) {
    final byTime = a.entry.createdAt - b.entry.createdAt;
    return byTime != 0 ? byTime : a.index - b.index;
  });
  final sorted = [for (final e in indexed) e.entry];

  final childrenOf = <String, List<IThreadComment>>{};
  for (final entry in sorted) {
    if (entry is! IThreadComment) continue;
    final parentId = entry.parentId;
    if (parentId == null) continue;
    (childrenOf[parentId] ??= <IThreadComment>[]).add(entry);
  }

  IThreadNode? build(IThreadComment comment) {
    final replies = <IThreadNode>[];
    for (final child in childrenOf[comment.id] ?? const <IThreadComment>[]) {
      final node = build(child);
      if (node != null) replies.add(node);
    }
    // 没有回复的删除评论真的消失；有回复的留个坑
    if (comment.deleted && replies.isEmpty) return null;
    return IThreadNode(comment: comment, replies: replies, tombstone: comment.deleted);
  }

  final items = <IThreadItem>[];
  var bucket = <IThreadActivity>[];
  void flush() {
    if (bucket.isEmpty) return;
    items.add(IThreadItem.activity(bucket, activitySummary(bucket)));
    bucket = <IThreadActivity>[];
  }

  for (final entry in sorted) {
    if (entry is IThreadActivity) {
      bucket.add(entry);
      continue;
    }
    final comment = entry as IThreadComment;
    if (comment.parentId != null) continue;
    final node = build(comment);
    if (node == null) continue;
    flush();
    items.add(IThreadItem.comment(node));
  }
  flush();
  return items;
}

/// 编辑痕迹。编辑过就要看得见，否则一句话被改了意思，读者毫无察觉
String editNote(IThreadComment comment, String Function(int ms) formatTime) {
  if (comment.deleted || comment.editedAt == null) return '';
  return '已编辑 · ${formatTime(comment.editedAt!)}';
}

class IUnreadState {
  const IUnreadState({
    required this.count,
    required this.dividerId,
    required this.text,
  });

  /// 未读条数。**不含自己发的**
  final int count;

  /// 未读分隔线钉在哪条之前。没有未读时是 null
  final String? dividerId;
  final String text;
}

/// 打开这一栏的那一刻算一次未读，**之后不要再算**（见 keepDivider）
IUnreadState unreadState(List<IThreadEntry> entries, int lastReadAt, String meId) {
  final unread = entries
      .where((entry) => entry.createdAt > lastReadAt && entry.byId != meId)
      .toList()
    ..sort((a, b) => a.createdAt - b.createdAt);
  if (unread.isEmpty) {
    return const IUnreadState(count: 0, dividerId: null, text: '没有新消息');
  }
  return IUnreadState(
    count: unread.length,
    dividerId: unread.first.id,
    text: '${unread.length} 条新消息，从这里继续',
  );
}

/// 有新条目进来之后的未读态。**分隔线不动**：
/// 「又来了两条」是该知道的，「你读到哪儿了」则不该被改写
IUnreadState keepDivider(
  IUnreadState current,
  List<IThreadEntry> entries,
  int lastReadAt,
  String meId,
) {
  final next = unreadState(entries, lastReadAt, meId);
  final divider = current.dividerId;
  if (divider == null) return next;
  final alive = entries.any((entry) => entry.id == divider);
  if (!alive) return next;
  return IUnreadState(count: next.count, dividerId: divider, text: next.text);
}

/// 标记读到哪儿了。取的是**这一栏里最后一条的时间**，不是当前时刻——
/// 拿当前时刻会把用户还没滚到的那几条也一并标成已读
int readUpTo(List<IThreadEntry> entries, int lastReadAt) {
  var max = lastReadAt;
  for (final entry in entries) {
    if (entry.createdAt > max) max = entry.createdAt;
  }
  return max;
}

class IMentionCheck {
  const IMentionCheck({required this.outsiders, required this.warning});

  final List<String> outsiders;
  final String warning;
}

/// @ 到了话题外的人：**不拦，但要说**。
/// 他收不到，而发的人以为他收到了，于是等一个永远不会来的回复
IMentionCheck checkMentions(
  List<String> mentions,
  List<String> participants,
  String Function(String id) nameOf,
) {
  final inside = participants.toSet();
  final seen = <String>{};
  final outsiders = <String>[];
  for (final id in mentions) {
    if (inside.contains(id) || !seen.add(id)) continue;
    outsiders.add(id);
  }
  return IMentionCheck(
    outsiders: outsiders,
    warning: outsiders.isEmpty
        ? ''
        : '${outsiders.map(nameOf).join('、')}还不在这个话题里，发出后会把 TA 加进来',
  );
}

class IFailedComment {
  const IFailedComment({
    required this.comment,
    required this.body,
    required this.reason,
  });

  final IThreadComment comment;

  /// 原文还在。用户写的三百字不能因为一次超时就没了
  final String body;
  final String reason;
}

/// 发失败的那些：留在原地、带着原文、说明原因
List<IFailedComment> failedComments(List<IThreadEntry> entries) => [
      for (final entry in entries)
        if (entry is IThreadComment && entry.sendState == ISendState.failed)
          IFailedComment(
            comment: entry,
            body: entry.body,
            reason: (entry.sendError ?? '').trim().isEmpty
                ? '网络没连上'
                : entry.sendError!.trim(),
          )
    ];

/// 重发：把失败的那条重新排回「发送中」，**不新建一条**，否则会发出两条一样的
List<IThreadEntry> retryComment(List<IThreadEntry> entries, String id) => [
      for (final entry in entries)
        if (entry is IThreadComment &&
            entry.id == id &&
            entry.sendState == ISendState.failed)
          entry.copyWithSend(ISendState.sending, null)
        else
          entry
    ];

/// 放弃：这一条彻底拿掉。只有用户明确说了不要，才允许丢掉他写的字
List<IThreadEntry> discardComment(List<IThreadEntry> entries, String id) =>
    [for (final entry in entries) if (entry.id != id) entry];
