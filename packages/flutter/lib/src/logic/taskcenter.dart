/// 异步任务中心的 Dart 移植（对应 packages/common/src/logic/taskcenter.ts）。
///
/// 三条规矩与 Web 端逐字一致：
///
/// 一、**每条任务都追得到它改了什么**——任务与通知都带业务对象与任务号；
/// 没有业务对象时给的是任务号与「查看任务详情」，绝不只报一句「完成了」。
///
/// 二、**角标数的是要人处理的**（失败的、跑完还没人看过的），进行中的不算——
/// 算进去那个数字永远回不到零，几天之后所有人都不再看它。
///
/// 三、**同一件事正在跑就不再排第二个**——导出点三次拿三份一样的文件，
/// 就是这一条没做。
library;

import 'command.dart';

enum ITaskState { queued, running, succeeded, failed, cancelled }

/// 任务动到的业务对象。有它，通知才点得下去
class ITaskTarget {
  const ITaskTarget({required this.kind, required this.id, required this.label});

  final String kind;
  final String id;
  final String label;
}

class IAsyncTask {
  const IAsyncTask({
    required this.id,
    required this.title,
    required this.state,
    required this.createdAt,
    this.finishedAt,
    this.actor,
    this.target,
    this.error,
    this.result,
    this.dedupeKey,
    this.seen = false,
  });

  /// 任务号。出问题时用户报给客服的就是它，因此它必须出现在界面上
  final String id;
  final String title;
  final ITaskState state;
  final int createdAt;
  final int? finishedAt;
  final String? actor;
  final ITaskTarget? target;
  final String? error;
  final String? result;

  /// 同一件事的去重键
  final String? dedupeKey;

  /// 用户看过结果了没有。只对已结束的任务有意义
  final bool seen;

  IAsyncTask copyWithSeen(bool value) => IAsyncTask(
        id: id,
        title: title,
        state: state,
        createdAt: createdAt,
        finishedAt: finishedAt,
        actor: actor,
        target: target,
        error: error,
        result: result,
        dedupeKey: dedupeKey,
        seen: value,
      );
}

bool isActive(IAsyncTask task) =>
    task.state == ITaskState.queued || task.state == ITaskState.running;

/// 任务中心的排序。进行中在最上面，失败的紧随其后，其余按结束时间倒序。
/// **结束之后就不再移动**——按「最近活动」排会让用户正要点的那条换了人。
List<IAsyncTask> taskOrder(List<IAsyncTask> tasks) {
  int rank(IAsyncTask task) =>
      isActive(task) ? 0 : (task.state == ITaskState.failed ? 1 : 2);
  final indexed = [
    for (var i = 0; i < tasks.length; i += 1) (index: i, task: tasks[i])
  ];
  // 按原下标稳定化：Dart 的 List.sort 不稳定，而 JS 的 Array.sort 是
  indexed.sort((a, b) {
    final byRank = rank(a.task) - rank(b.task);
    if (byRank != 0) return byRank;
    if (isActive(a.task) && isActive(b.task)) {
      final byCreated = a.task.createdAt - b.task.createdAt;
      return byCreated != 0 ? byCreated : a.index - b.index;
    }
    final af = a.task.finishedAt ?? a.task.createdAt;
    final bf = b.task.finishedAt ?? b.task.createdAt;
    return bf != af ? bf - af : a.index - b.index;
  });
  return [for (final entry in indexed) entry.task];
}

class ITaskBadge {
  const ITaskBadge({
    required this.count,
    required this.failed,
    required this.unseen,
    required this.running,
    required this.text,
  });

  /// 要人处理的条数。角标显示它
  final int count;
  final int failed;
  final int unseen;

  /// 正在跑的几条。它**不进角标**
  final int running;
  final String text;
}

ITaskBadge taskBadge(List<IAsyncTask> tasks) {
  final failed = tasks
      .where((t) => t.state == ITaskState.failed && !t.seen)
      .length;
  final unseen = tasks
      .where((t) => t.state == ITaskState.succeeded && !t.seen)
      .length;
  final running = tasks.where(isActive).length;
  final parts = <String>[];
  if (failed > 0) parts.add('$failed 条失败');
  if (unseen > 0) parts.add('$unseen 条已完成待查看');
  if (running > 0) parts.add('$running 条进行中');
  return ITaskBadge(
    count: failed + unseen,
    failed: failed,
    unseen: unseen,
    running: running,
    text: parts.isEmpty ? '任务中心：没有待处理的任务' : '任务中心：${parts.join('，')}',
  );
}

enum ITaskNoticeTone { neutral, success, danger }

class ITaskNotice {
  const ITaskNotice({
    required this.taskId,
    required this.tone,
    required this.title,
    required this.description,
    required this.actionLabel,
    this.target,
  });

  final String taskId;
  final ITaskNoticeTone tone;
  final String title;
  final String description;

  /// 点它去哪儿。没有业务对象时是「查看任务详情」，**永远不是没有出口**
  final String actionLabel;
  final ITaskTarget? target;
}

/// 一条任务变成一条通知。只有已结束的任务才发：进行中的每动一下弹一条，
/// 用户会把整个通知区关掉，连失败那条一起关掉。
ITaskNotice? taskNotice(IAsyncTask task) {
  if (isActive(task)) return null;
  final target = task.target;
  final where = target == null ? '任务 ${task.id}' : '${target.kind}「${target.label}」';
  final actionLabel = target == null ? '查看任务详情' : '查看${target.kind}';
  if (task.state == ITaskState.failed) {
    final reason = (task.error ?? '').trim();
    return ITaskNotice(
      taskId: task.id,
      tone: ITaskNoticeTone.danger,
      title: '${task.title}失败',
      description: '$where：${reason.isEmpty ? '未知原因' : reason}',
      actionLabel: actionLabel,
      target: target,
    );
  }
  if (task.state == ITaskState.cancelled) {
    return ITaskNotice(
      taskId: task.id,
      tone: ITaskNoticeTone.neutral,
      title: '${task.title}已取消',
      description: '$where没有发生变化',
      actionLabel: actionLabel,
      target: target,
    );
  }
  final result = (task.result ?? '').trim();
  return ITaskNotice(
    taskId: task.id,
    tone: ITaskNoticeTone.success,
    title: '${task.title}完成',
    description: result.isEmpty ? where : '$where：$result',
    actionLabel: actionLabel,
    target: target,
  );
}

/// 同一个任务只保留最新的一条通知：每态弹一条的话，最要紧的那条会被挤到最下面
List<ITaskNotice> dedupeNotices(List<ITaskNotice> notices) {
  final latest = <String, ITaskNotice>{};
  for (final notice in notices) {
    latest[notice.taskId] = notice;
  }
  return latest.values.toList();
}

class ISubmitResult {
  const ISubmitResult({
    required this.tasks,
    required this.merged,
    required this.taskId,
    required this.message,
  });

  final List<IAsyncTask> tasks;
  final bool merged;
  final String taskId;
  final String message;
}

/// 提交一个任务。同 dedupeKey 的任务**正在跑**时合并过去并明说它已经在跑了；
/// 已经结束的同键任务不拦——改完数据再导一次是正当需求。
ISubmitResult submitTask(List<IAsyncTask> tasks, IAsyncTask incoming) {
  IAsyncTask? running;
  if (incoming.dedupeKey != null) {
    for (final t in tasks) {
      if (t.dedupeKey == incoming.dedupeKey && isActive(t)) {
        running = t;
        break;
      }
    }
  }
  if (running != null) {
    return ISubmitResult(
      tasks: List<IAsyncTask>.from(tasks),
      merged: true,
      taskId: running.id,
      message: '「${running.title}」已经在跑了，完成后会通知你（任务号 ${running.id}）',
    );
  }
  return ISubmitResult(
    tasks: [incoming, ...tasks],
    merged: false,
    taskId: incoming.id,
    message: '已提交，完成后会通知你（任务号 ${incoming.id}）',
  );
}

/// 看过了。只有已结束的任务谈得上「看过」
List<IAsyncTask> markSeen(List<IAsyncTask> tasks, String id) => [
      for (final task in tasks)
        task.id == id && !isActive(task) ? task.copyWithSeen(true) : task
    ];

/// 全部标为看过。失败的那些**也算看过**——「看过」不等于「处理完了」
List<IAsyncTask> markAllSeen(List<IAsyncTask> tasks) => [
      for (final task in tasks) isActive(task) ? task : task.copyWithSeen(true)
    ];

/// 任务的追踪行。任务号排第一：用户打电话给客服时，能报出来的只有它
List<String> taskTrail(IAsyncTask task, String Function(int ms) formatTime) {
  final lines = <String>['任务号：${task.id}', '提交时间：${formatTime(task.createdAt)}'];
  if (task.actor != null) lines.add('提交人：${task.actor}');
  final target = task.target;
  if (target != null) lines.add('影响对象：${target.kind}「${target.label}」');
  if (task.finishedAt != null) lines.add('结束时间：${formatTime(task.finishedAt!)}');
  return lines;
}

/// 命令面板里的一条命令，带上它需要的权限。
/// 复用 command.dart 的匹配打分，这里只多一个 permission
class IGuardedCommand {
  const IGuardedCommand({required this.item, this.permission});

  final ICommandItem item;
  final String? permission;

  String get key => item.key;
  String get label => item.label;
}

class ICommandEntry {
  const ICommandEntry({
    required this.command,
    required this.disabled,
    required this.reason,
  });

  final IGuardedCommand command;
  final bool disabled;

  /// 禁用的理由。摆在条目上，不是藏在提示里
  final String reason;
}

/// 命令面板里该出现哪些命令。
///
/// 与详情页的动作同一套口径（见 detail.dart）：**没权限的命令照常出现，
/// 但禁用并写明理由**。过滤掉的话，用户搜「导出」搜不到会以为系统没这个功能，
/// 而正确答案是「能，但你这个角色不行」。
List<ICommandEntry> commandEntries(
  List<IGuardedCommand> commands,
  String keyword,
  bool Function(String permission) can,
) {
  final byKey = {for (final command in commands) command.key: command};
  final matched = keyword.trim().isEmpty
      ? [for (final command in commands) command.item]
      : searchCommands([for (final command in commands) command.item], keyword)
          .map((match) => match.item)
          .toList();
  return [
    for (final item in matched)
      () {
        final command = byKey[item.key]!;
        final allowed = command.permission == null || can(command.permission!);
        return ICommandEntry(
          command: command,
          disabled: !allowed,
          reason: allowed ? '' : '当前角色没有这个权限',
        );
      }()
  ];
}

/// 回车会执行的那一条：第一条**可用**的命令，不是第一条
ICommandEntry? firstRunnable(List<ICommandEntry> entries) {
  for (final entry in entries) {
    if (!entry.disabled) return entry;
  }
  return null;
}
