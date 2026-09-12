import 'package:flutter/material.dart';
import '../logic/confirm.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_button.dart';
import 'i_input.dart';

/// 命令式确认框。
///
/// 这一端不需要「往根节点挂一个容器」——showDialog 本来就是命令式的，
/// 而且自带返回键关闭与焦点管理。按钮编排与校验规则来自 logic/confirm，
/// 因此各端的按钮顺序、破坏性配色、校验时机完全一致。
class IConfirmDialog extends StatefulWidget {
  const IConfirmDialog({
    super.key,
    required this.kind,
    this.title = '',
    this.content = '',
    this.confirmText,
    this.cancelText,
    this.danger = false,
    this.placeholder = '',
    this.defaultValue = '',
    this.required = false,
    this.pattern,
    this.validate,
    this.requiredMessage,
    this.patternMessage,
  });

  final IConfirmKind kind;
  final String title;
  final String content;
  final String? confirmText;
  final String? cancelText;

  /// 破坏性操作：删除、清空、解绑这类做完撤不回来的
  final bool danger;

  final String placeholder;
  final String defaultValue;
  final bool required;
  final RegExp? pattern;
  final String? Function(String value)? validate;
  final String? requiredMessage;
  final String? patternMessage;

  @override
  State<IConfirmDialog> createState() => _IConfirmDialogState();
}

class _IConfirmDialogState extends State<IConfirmDialog> {
  late String _value = widget.defaultValue;
  String? _error;

  void _settle(IConfirmRole role) {
    if (widget.kind == IConfirmKind.prompt && role == IConfirmRole.confirm) {
      final error = validatePromptValue(
        _value,
        required: widget.required,
        pattern: widget.pattern,
        validate: widget.validate,
        requiredMessage: widget.requiredMessage,
        patternMessage: widget.patternMessage,
      );
      if (error != null) {
        setState(() => _error = error);
        return;
      }
    }
    Navigator.of(context).pop(isConfirmed(widget.kind, role) ? _value : null);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final actions = confirmActions(
      widget.kind,
      confirmText: widget.confirmText ??
          (widget.kind == IConfirmKind.alert ? '知道了' : '确定'),
      cancelText: widget.cancelText ?? '取消',
      danger: widget.danger,
    );

    return AlertDialog(
      backgroundColor: c.bgElevated,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      title: widget.title.isEmpty
          ? null
          : Text(
              widget.title,
              style: TextStyle(
                color: c.text,
                fontSize: IDesignTokensLight.fontSizeLg,
                fontWeight: FontWeight.w600,
              ),
            ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.content.isNotEmpty)
            Text(
              widget.content,
              style: TextStyle(
                color: c.textSecondary,
                fontSize: IDesignTokensLight.fontSizeMd,
                height: 1.6,
              ),
            ),
          if (widget.kind == IConfirmKind.prompt) ...[
            const SizedBox(height: IDesignTokensLight.spacing4),
            IInput(
              value: _value,
              placeholder: widget.placeholder,
              invalid: _error != null,
              onChanged: (next) => setState(() {
                _value = next;
                // 改了就把错误清掉：留着旧错误会让人以为改了也没用
                _error = null;
              }),
            ),
            if (_error != null) ...[
              const SizedBox(height: IDesignTokensLight.spacing2),
              // 错误文案跟在输入框下面，而不是只把边框变红——只变色的话，
              // 色觉障碍用户看到的是「按了确定没反应」
              Text(
                _error!,
                style: TextStyle(
                  color: c.danger,
                  fontSize: IDesignTokensLight.fontSizeSm,
                ),
              ),
            ],
          ],
        ],
      ),
      actions: [
        for (final action in actions)
          IButton(
            child: Text(action.text),
            variant: action.primary
                ? (action.danger ? IButtonVariant.danger : IButtonVariant.primary)
                : IButtonVariant.secondary,
            onPressed: () => _settle(action.role),
          ),
      ],
    );
  }
}

/// 二选一。用户取消时返回 false
Future<bool> iConfirm(
  BuildContext context, {
  String title = '',
  String content = '',
  String? confirmText,
  String? cancelText,
  bool danger = false,
  bool? barrierDismissible,
}) async {
  final result = await showDialog<String>(
    context: context,
    // 破坏性确认默认不允许点遮罩关闭：那一下太容易误触，而它旁边就是「确定」
    barrierDismissible: barrierDismissible ?? !danger,
    builder: (_) => IConfirmDialog(
      kind: IConfirmKind.confirm,
      title: title,
      content: content,
      confirmText: confirmText,
      cancelText: cancelText,
      danger: danger,
    ),
  );
  return result != null;
}

/// 只有一个「知道了」。关掉与点按钮等价
Future<void> iAlert(
  BuildContext context, {
  String title = '',
  String content = '',
  String? confirmText,
}) =>
    showDialog<String>(
      context: context,
      builder: (_) => IConfirmDialog(
        kind: IConfirmKind.alert,
        title: title,
        content: content,
        confirmText: confirmText,
      ),
    );

/// 带输入框。返回输入的值；取消时返回 null，校验不过不会关闭
Future<String?> iPrompt(
  BuildContext context, {
  String title = '',
  String content = '',
  String placeholder = '',
  String defaultValue = '',
  String? confirmText,
  String? cancelText,
  bool required = false,
  RegExp? pattern,
  String? Function(String value)? validate,
  String? requiredMessage,
  String? patternMessage,
}) =>
    showDialog<String>(
      context: context,
      builder: (_) => IConfirmDialog(
        kind: IConfirmKind.prompt,
        title: title,
        content: content,
        placeholder: placeholder,
        defaultValue: defaultValue,
        confirmText: confirmText,
        cancelText: cancelText,
        required: required,
        pattern: pattern,
        validate: validate,
        requiredMessage: requiredMessage,
        patternMessage: patternMessage,
      ),
    );
