import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';
import 'i_button.dart';

enum INotificationType { info, success, warning, danger }

class INotificationAction {
  const INotificationAction({required this.label, required this.onPressed});
  final String label;
  final VoidCallback onPressed;
}

/// 通知：屏幕角落、带标题与操作，可长期停留。
///
/// 与 IToast 的分界——一句话的结果反馈用 Toast（自动消失）；
/// 需要用户读完、甚至去点一下的用它。
class INotification extends StatelessWidget {
  const INotification({
    super.key,
    required this.title,
    this.description,
    this.type = INotificationType.info,
    this.actions = const [],
    this.onClose,
  });

  final String title;
  final String? description;
  final INotificationType type;
  final List<INotificationAction> actions;
  final VoidCallback? onClose;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    // 状态由图标与其淡底表达，不改整块底色，也不加边线
    final (Color tone, Color toneSubtle, String icon) = switch (type) {
      INotificationType.success => (c.success, c.successSubtle, 'check-circle'),
      INotificationType.warning => (c.warning, c.warningSubtle, 'warning-triangle'),
      INotificationType.danger => (c.danger, c.dangerSubtle, 'error-circle'),
      INotificationType.info => (c.info, c.infoSubtle, 'info-circle'),
    };

    return Container(
      width: 340,
      padding: const EdgeInsets.all(IDesignTokensLight.spacing4),
      decoration: BoxDecoration(
        color: c.bgElevated,
        border: Border.all(color: c.hairline),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: toneSubtle,
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
            ),
            child: IIcon(name: icon, size: 18, color: tone),
          ),
          const SizedBox(width: IDesignTokensLight.spacing3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeMd,
                    fontWeight: FontWeight.w500,
                    color: c.text,
                  ),
                ),
                if (description != null) ...[
                  const SizedBox(height: IDesignTokensLight.spacing1),
                  Text(
                    description!,
                    style: TextStyle(
                      fontSize: IDesignTokensLight.fontSizeSm,
                      color: c.textSecondary,
                      height: 1.6,
                    ),
                  ),
                ],
                if (actions.isNotEmpty) ...[
                  const SizedBox(height: IDesignTokensLight.spacing3),
                  Row(
                    children: [
                      for (final action in actions) ...[
                        IButton(
                          label: action.label,
                          size: IButtonSize.sm,
                          onPressed: action.onPressed,
                        ),
                        const SizedBox(width: IDesignTokensLight.spacing2),
                      ],
                    ],
                  ),
                ],
              ],
            ),
          ),
          if (onClose != null)
            GestureDetector(
              onTap: onClose,
              child: IIcon(name: 'close', size: 14, color: c.textTertiary),
            ),
        ],
      ),
    );
  }
}

/// 通知的挂载点：放在应用根部一次，之后用 [INotificationLayer.show] 推入。
///
/// Flutter 没有 Web 那样的全局 DOM 容器，所以宿主必须显式挂一层；
/// 与 Web 端一致，容器本身不拦截点击，否则右上角整块区域都点不了。
class INotificationLayer extends StatefulWidget {
  const INotificationLayer({super.key, required this.child});

  final Widget child;

  static final GlobalKey<_INotificationLayerState> _key =
      GlobalKey<_INotificationLayerState>();

  /// 推入一条通知；带操作时默认不自动关闭——正要去点，它消失了
  static void show(
    String title, {
    String? description,
    INotificationType type = INotificationType.info,
    List<INotificationAction> actions = const [],
    Duration? duration,
  }) {
    _key.currentState?._push(
      title,
      description: description,
      type: type,
      actions: actions,
      duration: duration ??
          (actions.isEmpty ? const Duration(milliseconds: 4500) : Duration.zero),
    );
  }

  @override
  State<INotificationLayer> createState() => _INotificationLayerState();
}

class _INotificationEntry {
  _INotificationEntry(this.id, this.widget);
  final int id;
  final INotification widget;
}

class _INotificationLayerState extends State<INotificationLayer> {
  final List<_INotificationEntry> _items = [];
  int _seed = 0;

  void _push(
    String title, {
    String? description,
    required INotificationType type,
    required List<INotificationAction> actions,
    required Duration duration,
  }) {
    final id = ++_seed;
    setState(() {
      _items.add(_INotificationEntry(
        id,
        INotification(
          title: title,
          description: description,
          type: type,
          actions: actions,
          onClose: () => _close(id),
        ),
      ));
    });
    if (duration > Duration.zero) {
      Future.delayed(duration, () => _close(id));
    }
  }

  void _close(int id) {
    if (!mounted) return;
    setState(() => _items.removeWhere((e) => e.id == id));
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        Positioned(
          top: IDesignTokensLight.spacing6,
          right: IDesignTokensLight.spacing6,
          child: IgnorePointer(
            // 只有卡片本身接收点击，容器不拦截
            ignoring: _items.isEmpty,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                for (final entry in _items) ...[
                  Material(color: Colors.transparent, child: entry.widget),
                  const SizedBox(height: IDesignTokensLight.spacing3),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}
