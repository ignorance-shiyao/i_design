import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

enum IAlertType { info, success, warning, danger }

/// 页面内的持续提示。需要用户立刻响应的场景请用对话框。
class IAlert extends StatelessWidget {
  const IAlert({
    super.key,
    required this.child,
    this.type = IAlertType.info,
    this.title,
    this.onClose,
  });

  final Widget child;
  final IAlertType type;
  final String? title;

  /// 传入后显示关闭按钮；是否真的移除由使用方决定
  final VoidCallback? onClose;

  (Color, Color, String) _style(IColors c) => switch (type) {
        IAlertType.info => (c.info, c.infoSubtle, 'info-circle'),
        IAlertType.success => (c.success, c.successSubtle, 'check-circle'),
        IAlertType.warning => (c.warning, c.warningSubtle, 'warning-triangle'),
        IAlertType.danger => (c.danger, c.dangerSubtle, 'error-circle'),
      };

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final (accent, background, icon) = _style(c);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: IDesignTokensLight.spacing4,
        vertical: IDesignTokensLight.spacing3,
      ),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        border: Border(left: BorderSide(color: accent, width: 3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 2, right: IDesignTokensLight.spacing3),
            child: IIcon(icon, size: 18, color: accent),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (title != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: IDesignTokensLight.spacing1),
                    child: Text(
                      title!,
                      style: TextStyle(color: c.text, fontWeight: FontWeight.w600),
                    ),
                  ),
                DefaultTextStyle(
                  style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeMd),
                  child: child,
                ),
              ],
            ),
          ),
          if (onClose != null)
            GestureDetector(
              onTap: onClose,
              child: IIcon('close', size: 16, color: c.textTertiary, semanticLabel: '关闭'),
            ),
        ],
      ),
    );
  }
}
