import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 对话框：打断当前流程，要求用户先处理一件事。
///
/// Flutter 的浮层走 showDialog 而非组件树内的条件渲染，
/// 因此这里提供一个静态方法，语义与 Web 端的 v-model 控制显隐等价。
class IModal extends StatelessWidget {
  const IModal({
    super.key,
    required this.child,
    this.title,
    this.footer,
    this.width = 480,
    this.closable = true,
  });

  final Widget child;
  final String? title;
  final Widget? footer;
  final double width;
  final bool closable;

  /// [barrierDismissible] 对应 Web 端的 maskClosable；
  /// 表单与破坏性确认场景应传 false，避免误点遮罩丢失已填内容。
  static Future<T?> show<T>(
    BuildContext context, {
    required Widget child,
    String? title,
    Widget? footer,
    double width = 480,
    bool closable = true,
    bool barrierDismissible = true,
  }) {
    return showDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: (_) => IModal(
        title: title,
        footer: footer,
        width: width,
        closable: closable,
        child: child,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    return Dialog(
      backgroundColor: c.bgElevated,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: width),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (title != null || closable)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: IDesignTokensLight.spacing5,
                  vertical: IDesignTokensLight.spacing4,
                ),
                decoration: BoxDecoration(border: Border(bottom: BorderSide(color: c.hairline))),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        title ?? '',
                        style: TextStyle(
                          color: c.text,
                          fontSize: IDesignTokensLight.fontSizeLg,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (closable)
                      GestureDetector(
                        onTap: () => Navigator.of(context).pop(),
                        child: IIcon('close', size: 18, color: c.textTertiary, semanticLabel: '关闭'),
                      ),
                  ],
                ),
              ),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(IDesignTokensLight.spacing5),
                child: DefaultTextStyle(
                  style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeMd),
                  child: child,
                ),
              ),
            ),
            if (footer != null)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: IDesignTokensLight.spacing5,
                  vertical: IDesignTokensLight.spacing3,
                ),
                decoration: BoxDecoration(border: Border(top: BorderSide(color: c.hairline))),
                child: Row(mainAxisAlignment: MainAxisAlignment.end, children: [footer!]),
              ),
          ],
        ),
      ),
    );
  }
}
