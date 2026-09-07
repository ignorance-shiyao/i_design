import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

enum IToastType { info, success, warning, error, loading }

/// 轻提示。
///
/// 走 Overlay 而不是 SnackBar：SnackBar 固定贴底且一次只显示一条，
/// 与 Web 端「顶部居中、可叠放」的行为对不上。这里自持一个队列，
/// 因此同一段代码连发三条时，三端看到的都是三条依次堆叠。
class IToast {
  IToast._();

  static final List<OverlayEntry> _entries = [];

  static void show(
    BuildContext context,
    String message, {
    IToastType type = IToastType.info,
    Duration duration = const Duration(seconds: 3),
  }) {
    final overlay = Overlay.of(context);
    late OverlayEntry entry;

    entry = OverlayEntry(
      builder: (context) {
        final index = _entries.indexOf(entry);
        return Positioned(
          top: MediaQuery.of(context).padding.top +
              IDesignTokensLight.spacing4 +
              // 按队列位置下移，后来的排在下面而不是盖住前一条
              (index < 0 ? 0 : index) * 48,
          left: 0,
          right: 0,
          child: _ToastCard(message: message, type: type),
        );
      },
    );

    _entries.add(entry);
    overlay.insert(entry);

    // loading 类型不自动消失：它表示一件还没结束的事
    if (type != IToastType.loading) {
      Future.delayed(duration, () => dismiss(entry));
    }
  }

  static void dismiss(OverlayEntry entry) {
    if (!_entries.remove(entry)) return;
    entry.remove();
    // 移除中间一条后，其余的位置要重算
    for (final rest in _entries) {
      rest.markNeedsBuild();
    }
  }

  static void clear() {
    for (final entry in List<OverlayEntry>.from(_entries)) {
      dismiss(entry);
    }
  }
}

class _ToastCard extends StatelessWidget {
  const _ToastCard({required this.message, required this.type});

  final String message;
  final IToastType type;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    final (Color tint, String? icon) = switch (type) {
      IToastType.info => (c.info, 'info-circle'),
      IToastType.success => (c.success, 'check-circle'),
      IToastType.warning => (c.warning, 'warning-triangle'),
      IToastType.error => (c.danger, 'error-circle'),
      IToastType.loading => (c.textSecondary, null),
    };

    return Align(
      alignment: Alignment.topCenter,
      child: Material(
        color: Colors.transparent,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing4),
          padding: const EdgeInsets.symmetric(
            horizontal: IDesignTokensLight.spacing4,
            vertical: IDesignTokensLight.spacing3,
          ),
          decoration: BoxDecoration(
            color: c.bgElevated,
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
            border: Border.all(color: c.border),
            boxShadow: const [
              BoxShadow(color: Color(0x1F141822), blurRadius: 16, offset: Offset(0, 4)),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null)
                IIcon(icon, size: 16, color: tint)
              else
                SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: tint),
                ),
              const SizedBox(width: IDesignTokensLight.spacing2),
              Flexible(
                child: Text(
                  message,
                  style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
