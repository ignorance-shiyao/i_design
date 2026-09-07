import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

enum IFormLayout { vertical, horizontal }

/// 表单容器：只负责统一布局与标签宽度，校验交给 IFormItem。
///
/// 不把校验状态收进这里，是因为 Flutter 已有 Form / FormField 这套机制，
/// 再造一层状态树只会和它打架。
class IForm extends InheritedWidget {
  const IForm({
    super.key,
    required super.child,
    this.layout = IFormLayout.vertical,
    this.labelWidth = 88,
    this.disabled = false,
  });

  final IFormLayout layout;

  /// 仅 horizontal 生效
  final double labelWidth;
  final bool disabled;

  static IForm? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<IForm>();

  @override
  bool updateShouldNotify(IForm old) =>
      layout != old.layout || labelWidth != old.labelWidth || disabled != old.disabled;
}

/// 表单项：标签 + 控件 + 错误/提示文字。
class IFormItem extends StatelessWidget {
  const IFormItem({
    super.key,
    required this.child,
    this.label,
    this.required = false,
    this.error,
    this.help,
  });

  final Widget child;
  final String? label;
  final bool required;

  /// 有值即视为校验失败，覆盖 help 显示
  final String? error;
  final String? help;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final form = IForm.maybeOf(context);
    final horizontal = form?.layout == IFormLayout.horizontal;

    final labelWidget = label == null
        ? null
        : RichText(
            text: TextSpan(
              style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd),
              children: [
                if (required)
                  TextSpan(text: '* ', style: TextStyle(color: c.danger)),
                TextSpan(text: label!),
              ],
            ),
          );

    final footer = error != null || help != null
        ? Padding(
            padding: const EdgeInsets.only(top: IDesignTokensLight.spacing1),
            child: Text(
              error ?? help!,
              style: TextStyle(
                color: error != null ? c.danger : c.textTertiary,
                fontSize: IDesignTokensLight.fontSizeSm,
              ),
            ),
          )
        : null;

    final control = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [child, if (footer != null) footer],
    );

    return Padding(
      padding: const EdgeInsets.only(bottom: IDesignTokensLight.spacing4),
      child: horizontal
          ? Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: form!.labelWidth,
                  // 与控件首行文字对齐，而不是与整块顶端对齐
                  child: Padding(
                    padding: const EdgeInsets.only(top: IDesignTokensLight.spacing2),
                    child: labelWidget ?? const SizedBox.shrink(),
                  ),
                ),
                const SizedBox(width: IDesignTokensLight.spacing3),
                Expanded(child: control),
              ],
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (labelWidget != null) ...[
                  labelWidget,
                  const SizedBox(height: IDesignTokensLight.spacing2),
                ],
                control,
              ],
            ),
    );
  }
}
