/// 表单壳的纯逻辑（对应 packages/common/src/logic/formhost.ts，astra.md 的 B09）。
///
/// SchemaForm 负责「一张表单里的字段怎么算」，这一层负责「这张表单被放进
/// 页面 / 抽屉 / 弹窗 / 分步流程之后，围着它的那些事怎么算」：重复提交、
/// 失败保留输入、离开保护、重置范围、分步不丢数据。
///
/// 它们全都是「该不该拦住用户」这类决定——各端各判一遍，就会出现同一张表
/// 在网页上拦住了、在小程序里直接放走。
library;

import 'dart:convert';

/* ---------- 提交闸门 ---------- */

enum ISubmitPhase { idle, submitting, failed, succeeded }

class ISubmitGate {
  const ISubmitGate({required this.allowed, required this.busy, required this.reason});

  /// 这一刻能不能真的发出去
  final bool allowed;

  /// 按钮要不要显示加载中
  final bool busy;

  /// 拦下来的原因。allowed 为 true 时是空串
  final String reason;
}

/// 这一刻能不能提交。
///
/// 判定顺序就是给用户的解释顺序：正在发的时候说「正在提交」而不是「表单有错」——
/// 后者会让他以为是自己填错了，回头去逐个字段找。
ISubmitGate submitGate({
  required ISubmitPhase phase,
  required bool valid,
  bool disabled = false,
  bool resubmittable = false,
}) {
  if (disabled) {
    return const ISubmitGate(allowed: false, busy: false, reason: '当前不可提交');
  }
  if (phase == ISubmitPhase.submitting) {
    // 这一档就是重复提交的闸：人一定会在网络慢的时候再点一次
    return const ISubmitGate(allowed: false, busy: true, reason: '正在提交，请稍候');
  }
  if (phase == ISubmitPhase.succeeded && !resubmittable) {
    return const ISubmitGate(allowed: false, busy: false, reason: '已提交');
  }
  if (!valid) {
    return const ISubmitGate(allowed: false, busy: false, reason: '还有字段没填对');
  }
  return const ISubmitGate(allowed: true, busy: false, reason: '');
}

/* ---------- 改没改过 ---------- */

/// 与基准相比，哪些字段变了。
///
/// 用「逐字段比对」而不是「有没有输入事件」：用户把字改了又改回去，
/// 那就是没改过，这时候拦住他是纯粹的骚扰。
List<String> changedFields(
  Map<String, Object?> base,
  Map<String, Object?> current,
) {
  final keys = <String>{...base.keys, ...current.keys}.toList()..sort();
  return keys
      .where((k) => jsonEncode(base[k]) != jsonEncode(current[k]))
      .toList();
}

bool isDirty(Map<String, Object?> base, Map<String, Object?> current) =>
    changedFields(base, current).isNotEmpty;

class ILeaveGuard {
  const ILeaveGuard({required this.blocked, required this.message});

  final bool blocked;
  final String message;
}

/// 现在离开要不要拦。
///
/// 三种不拦：没改过、正在提交（提交完自己会走）、已经提交成功。
/// 存过草稿也不拦——东西没丢，拦住只会让人以为出了事。
ILeaveGuard leaveGuard({
  required Map<String, Object?> base,
  required Map<String, Object?> current,
  required ISubmitPhase phase,
  bool draftSaved = false,
}) {
  if (phase == ISubmitPhase.submitting || phase == ISubmitPhase.succeeded) {
    return const ILeaveGuard(blocked: false, message: '');
  }
  final changed = changedFields(base, current);
  if (changed.isEmpty) return const ILeaveGuard(blocked: false, message: '');
  if (draftSaved) return const ILeaveGuard(blocked: false, message: '');
  return ILeaveGuard(blocked: true, message: '有 ${changed.length} 项修改还没保存，确定离开吗？');
}

/* ---------- 重置范围 ---------- */

/// 「重置」到底重置到哪儿。
///
/// initial 回到打开这张表时的样子，draft 回到上次存的草稿，empty 才是真的清空。
/// 默认是 initial：多数人按下「重置」时想的是「撤销我刚才的改动」。
enum IResetScope { initial, draft, empty }

Map<String, Object?> resetValues(
  IResetScope scope,
  Map<String, Object?> initial, [
  Map<String, Object?>? draft,
]) {
  if (scope == IResetScope.empty) return <String, Object?>{};
  // 要回到草稿却没有草稿时，退回到初始值而不是清空
  if (scope == IResetScope.draft) return {...(draft ?? initial)};
  return {...initial};
}

/// 重置按钮上该写什么。含糊的「重置」正是最危险的那一种
String resetLabel(IResetScope scope, {bool hasDraft = false}) {
  if (scope == IResetScope.empty) return '清空';
  if (scope == IResetScope.draft) return hasDraft ? '回到草稿' : '撤销修改';
  return '撤销修改';
}

/* ---------- 分步 ---------- */

class IStepSpec {
  const IStepSpec({
    required this.key,
    required this.title,
    required this.fields,
    this.optional = false,
  });

  final String key;
  final String title;

  /// 这一步用到哪些字段。校验与「哪一步出了错」都靠它
  final List<String> fields;
  final bool optional;
}

enum IStepMarkState { done, current, error, todo }

class IStepMark {
  const IStepMark({required this.key, required this.title, required this.state});
  final String key;
  final String title;
  final IStepMarkState state;
}

class IStepState {
  const IStepState({
    required this.index,
    required this.blocked,
    required this.canPrev,
    required this.canNext,
    required this.isLast,
    required this.marks,
  });

  final int index;

  /// 这一步自己有没有错
  final bool blocked;
  final bool canPrev;
  final bool canNext;
  final bool isLast;
  final List<IStepMark> marks;
}

/// 分步表单此刻的状态。
///
/// 只用「这一步自己的字段」判断能不能往下走；没走到过的步骤不标红——
/// 一进来就满屏红叉，说的是「你还没填」，不是「你填错了」。
IStepState stepState({
  required List<IStepSpec> steps,
  required int index,
  required List<String> errorPaths,
  required List<int> visited,
}) {
  final errored = errorPaths.toSet();
  bool hasError(IStepSpec step) => step.fields.any(errored.contains);

  final current = index >= 0 && index < steps.length ? steps[index] : null;
  final blocked = current == null ? false : !current.optional && hasError(current);

  return IStepState(
    index: index,
    blocked: blocked,
    canPrev: index > 0,
    canNext: index < steps.length - 1 && !blocked,
    isLast: index == steps.length - 1,
    marks: [
      for (var i = 0; i < steps.length; i++)
        IStepMark(
          key: steps[i].key,
          title: steps[i].title,
          state: i == index
              ? IStepMarkState.current
              : visited.contains(i) && hasError(steps[i])
                  ? IStepMarkState.error
                  : visited.contains(i)
                      ? IStepMarkState.done
                      : IStepMarkState.todo,
        ),
    ],
  );
}

/// 提交失败时该跳到哪一步。-1 表示错误不属于任何一步（表单级错误）。
///
/// 光在当前步显示一句「提交失败」没有用——错的字段可能在第一步，
/// 而用户正站在第三步上，他只会反复点提交。
int stepOfError(List<IStepSpec> steps, List<String> errorPaths) {
  final errored = errorPaths.toSet();
  return steps.indexWhere((step) => step.fields.any(errored.contains));
}
