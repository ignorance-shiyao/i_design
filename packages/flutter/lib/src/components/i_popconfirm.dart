import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../logic/overlay.dart';
import '../tokens/tokens.dart';
import 'i_button.dart';
import 'i_icon.dart';

/// 气泡确认：就地确认一次轻量的、可能有后果的操作。
///
/// 与 IModal 的分工同 Web 端一致——删一行用 Popconfirm，删整个项目用 Modal。
///
/// 位置由共享的 resolveOverlay 算出（与 Web 端同一套规则：空间不足翻到对侧、
/// 贴边推回可用区），再交给 showMenu 呈现——此前只是「挂在触发点下方」，
/// 触发器靠近屏幕底部时面板会被裁掉。
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

    // 面板高度按内容估一个上界：showMenu 之前量不到未渲染的尺寸。
    // 估高只影响「翻不翻转」的判断，偏大比偏小安全——宁可提前翻转，
    // 也不要面板贴出屏幕。
    const estimatedHeight = 160.0;
    final pos = resolveOverlay(
      trigger: IOverlayRect(
        topLeft.dx,
        topLeft.dy,
        box.size.width,
        box.size.height,
      ),
      popup: const IOverlayRect(0, 0, 260, estimatedHeight),
      viewport: IOverlayRect(0, 0, overlay.size.width, overlay.size.height),
      placement: IPlacement.bottom,
      align: IOverlayAlign.start,
    );

    final confirmed = await showMenu<bool>(
      context: context,
      color: c.bgElevated,
      position: RelativeRect.fromLTRB(
        pos.x,
        pos.y,
        overlay.size.width - pos.x - 260,
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
