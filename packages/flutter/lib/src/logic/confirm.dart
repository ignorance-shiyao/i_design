/// 命令式确认框的按钮编排与输入校验（对应 packages/common/src/logic/confirm.ts）。
///
/// 一端「取消」在左、另一端在右，同一个产品里点错的人会怪自己手滑；
/// 校验规则不一致则更糟——一端拦下的输入在另一端提交成功了。
library;

enum IConfirmKind { confirm, alert, prompt }

/// 用户按了哪个键。close 表示按返回键或点遮罩关掉，与主动取消区分开
enum IConfirmRole { confirm, cancel, close }

class IConfirmAction {
  final IConfirmRole role;
  final String text;

  /// 主按钮只有一个。破坏性确认把主按钮换成危险色，而不是加一行红字提醒
  final bool primary;
  final bool danger;

  const IConfirmAction({
    required this.role,
    required this.text,
    required this.primary,
    required this.danger,
  });
}

/// 按钮从左到右的顺序。
///
/// 取消在左、确认在右：对话框是一条从左读到右的句子，确认是句尾的动作。
/// 反过来放的话，视线读完正文落在右边，右边却是「取消」——最容易点到的位置
/// 放的是放弃操作。
///
/// alert 只有一个按钮，而且它的语义是「我知道了」不是「确认执行」：
/// 给它配一个「取消」会让人以为还有的选，实际上点哪个结果都一样。
List<IConfirmAction> confirmActions(
  IConfirmKind kind, {
  String confirmText = '确定',
  String cancelText = '取消',
  bool danger = false,
}) {
  final ok = IConfirmAction(
    role: IConfirmRole.confirm,
    text: confirmText,
    primary: true,
    danger: danger,
  );
  if (kind == IConfirmKind.alert) return [ok];
  return [
    IConfirmAction(
      role: IConfirmRole.cancel,
      text: cancelText,
      primary: false,
      danger: false,
    ),
    ok,
  ];
}

/// 校验输入框的值，返回错误文案；通过时返回 null。
///
/// 顺序是必填 → 格式 → 自定义，一次只报一条。三条一起报会让用户先修下面那条、
/// 结果上面那条还在，看起来像改不动；而且自定义校验往往假设值已经非空。
String? validatePromptValue(
  String value, {
  bool required = false,
  RegExp? pattern,
  String? Function(String value)? validate,
  String? requiredMessage,
  String? patternMessage,
}) {
  final trimmed = value.trim();
  if (required && trimmed.isEmpty) return requiredMessage ?? '此项必填';
  if (pattern != null && !pattern.hasMatch(value)) {
    return patternMessage ?? '格式不正确';
  }
  final custom = validate?.call(value);
  return (custom != null && custom.isNotEmpty) ? custom : null;
}

/// 关掉对话框算不算「同意」。
///
/// 一律不算：按返回键、点遮罩、点右上角的叉，三种都是「我不想继续」。
/// 把关闭当成确认的话，一次误触就执行了删除。
/// alert 是唯一的例外——它只有一个结果，关掉与点「我知道了」等价。
bool isConfirmed(IConfirmKind kind, IConfirmRole role) {
  if (kind == IConfirmKind.alert) return true;
  return role == IConfirmRole.confirm;
}
