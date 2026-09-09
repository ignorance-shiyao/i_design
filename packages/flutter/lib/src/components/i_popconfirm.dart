import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_button.dart';
import 'i_icon.dart';

/// 气泡确认：就地确认一次轻量的、可能有后果的操作。
///
/// 与 IModal 的分工同 Web 端一致——删一行用 Popconfirm，删整个项目用 Modal。
/// Flutter 没有锚定浮层的通用能力，这里用 showMenu 挂在触发点旁边，
/// 位置由触发器的屏幕坐标算出，因此不会飘到屏幕另一头。
class IPopconfirm extends StatelessWidget {
  const IPopconfirm({
    super.key,
    required this.child,
    required this.title,
    this.description,
    this.onConfirm,
    this.onCancel,
    this.confirmText = '确定',
    this.cancelText = '取消',
    this.danger = false,
  });

  final Widget child;
  final String title;
  final String? description;
  final VoidCallback? onConfirm;
  final VoidCallback? onCancel;
  final String confirmText;
  final String cancelText;

  /// 破坏性操作：图标与确认按钮转为危险色
  final bool danger;

  Future<void> _open(BuildContext context) async {
    final c = iColorsOf(context);
    final box = context.findRenderObject() as RenderBox;
    final overlay = Overlay.of(context).context.findRenderObject() as RenderBox;
    final topLeft = box.localToGlobal(Offset.zero, ancestor: overlay);

    final confirmed = await showMenu<bool>(
      context: context,
      color: c.bgElevated,
      position: RelativeRect.fromLTRB(
        topLeft.dx,
        topLeft.dy + box.size.height + IDesignTokensLight.spacing2,
        overlay.size.width - topLeft.dx - box.size.width,
        0,
      ),
      constraints: const BoxConstraints(minWidth: 240, maxWidth: 280),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      items: [
        PopupMenuItem<bool>(
          enabled: false,
          padding: EdgeInsets.zero,
          child: Padding(
            padding: const EdgeInsets.all(IDesignTokensLight.spacing4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    IIcon(
                      danger ? 'warning-triangle' : 'help-circle',
                      size: 16,
                      color: danger ? c.warning : c.info,
                    ),
                    const SizedBox(width: IDesignTokensLight.spacing2),
                    Expanded(
                      child: Text(
                        title,
                        style: TextStyle(
                          color: c.text,
                          fontSize: IDesignTokensLight.fontSizeMd,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
                if (description != null)
                  Padding(
                    padding: const EdgeInsets.only(
                      left: 24,
                      top: IDesignTokensLight.spacing1,
                    ),
                    child: Text(
                      description!,
                      style: TextStyle(
                        color: c.textSecondary,
                        fontSize: IDesignTokensLight.fontSizeSm,
                        height: 1.6,
                      ),
                    ),
                  ),
                const SizedBox(height: IDesignTokensLight.spacing4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    IButton(
                      size: IButtonSize.sm,
                      variant: IButtonVariant.text,
                      onPressed: () => Navigator.of(context).pop(false),
                      child: Text(cancelText),
                    ),
                    const SizedBox(width: IDesignTokensLight.spacing2),
                    IButton(
                      size: IButtonSize.sm,
                      variant: danger ? IButtonVariant.danger : IButtonVariant.primary,
                      onPressed: () => Navigator.of(context).pop(true),
                      child: Text(confirmText),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );

    // 点遮罩关闭返回 null：既不算确认也不算取消，与 Web 端一致
    if (confirmed == true) {
      onConfirm?.call();
    } else if (confirmed == false) {
      onCancel?.call();
    }
  }

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: () => _open(context),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        child: child,
      );
}
