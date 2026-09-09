import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

enum IDrawerPlacement { left, right, top, bottom }

/// 抽屉：从屏幕边缘滑出的面板。
///
/// 与对话框的取舍：需要保留主页面上下文、或内容较长需要滚动时用抽屉；
/// 需要用户立刻二选一时用对话框。
class IDrawer extends StatelessWidget {
  const IDrawer({
    super.key,
    required this.child,
    this.title,
    this.footer,
    this.placement = IDrawerPlacement.right,
    this.size = 380,
    this.closable = true,
  });

  final Widget child;
  final String? title;
  final Widget? footer;
  final IDrawerPlacement placement;
  final double size;
  final bool closable;

  static Future<T?> show<T>(
    BuildContext context, {
    required Widget child,
    String? title,
    Widget? footer,
    IDrawerPlacement placement = IDrawerPlacement.right,
    double size = 380,
    bool closable = true,
    bool barrierDismissible = true,
  }) {
    final alignment = switch (placement) {
      IDrawerPlacement.left => Alignment.centerLeft,
      IDrawerPlacement.right => Alignment.centerRight,
      IDrawerPlacement.top => Alignment.topCenter,
      IDrawerPlacement.bottom => Alignment.bottomCenter,
    };
    final begin = switch (placement) {
      IDrawerPlacement.left => const Offset(-1, 0),
      IDrawerPlacement.right => const Offset(1, 0),
      IDrawerPlacement.top => const Offset(0, -1),
      IDrawerPlacement.bottom => const Offset(0, 1),
    };

    return showGeneralDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      barrierLabel: title ?? '抽屉',
      barrierColor: const Color(0x73141822),
      transitionDuration: IDesignTokensLight.motionSlow,
      pageBuilder: (_, __, ___) => Align(
        alignment: alignment,
        child: IDrawer(
          title: title,
          footer: footer,
          placement: placement,
          size: size,
          closable: closable,
          child: child,
        ),
      ),
      transitionBuilder: (_, animation, __, child) => SlideTransition(
        position: Tween<Offset>(begin: begin, end: Offset.zero)
            .animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)),
        child: child,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final horizontal = placement == IDrawerPlacement.left || placement == IDrawerPlacement.right;

    return Material(
      color: c.bgElevated,
      child: SizedBox(
        width: horizontal ? size : double.infinity,
        height: horizontal ? double.infinity : size,
        child: SafeArea(
          child: Column(
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
              Expanded(
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
      ),
    );
  }
}
