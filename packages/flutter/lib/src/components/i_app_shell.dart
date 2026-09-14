import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 应用骨架：顶栏、侧栏导航、面包屑、页面操作槽、窄屏抽屉（astra.md 的 B01）。
///
/// 宽屏侧栏常驻，窄屏收进抽屉——与 Web 端同一条规则：挤窄之后每一项只剩两三个字，
/// 认不出来还占着地方。断点按 LayoutBuilder 的实际宽度判定，而不是按设备类型：
/// 平板横竖屏、桌面分屏都会跨过这条线。
///
/// 组件不认识路由：点导航只回调，由调用方决定怎么跳。
class IAppNavItem {
  const IAppNavItem({
    required this.key,
    required this.label,
    this.icon,
    this.children = const [],
  });

  final String key;
  final String label;
  final IconData? icon;

  /// 二级导航。只支持两级——三级以上的树在侧栏里没人找得到
  final List<IAppNavItem> children;
}

class IAppShell extends StatefulWidget {
  const IAppShell({
    super.key,
    required this.nav,
    required this.current,
    required this.onNavigate,
    required this.child,
    this.crumbs = const [],
    this.title = '',
    this.user = '',
    this.actions = const [],
    this.topbar,
    this.breakpoint = 720,
  });

  final List<IAppNavItem> nav;

  /// 当前选中的导航项 key。深链恢复时由调用方解析出来传进来
  final String current;
  final ValueChanged<String> onNavigate;
  final Widget child;
  final List<String> crumbs;
  final String title;
  final String user;

  /// 页面操作槽：新建、导出这类按钮固定落在这里
  final List<Widget> actions;

  /// 顶栏中段：切换器、搜索、环境标记，各家都不一样
  final Widget? topbar;
  final double breakpoint;

  @override
  State<IAppShell> createState() => _IAppShellState();
}

class _IAppShellState extends State<IAppShell> {
  final GlobalKey<ScaffoldState> _scaffold = GlobalKey<ScaffoldState>();

  List<IAppNavItem> get _flat => [
        for (final item in widget.nav) ...[
          item,
          ...item.children,
        ]
      ];

  /// 二级选中时它的父项也要看得出来，否则用户不知道自己在哪一块里
  String get _activeParent {
    for (final item in widget.nav) {
      if (item.key == widget.current) return item.key;
      if (item.children.any((c) => c.key == widget.current)) return item.key;
    }
    return '';
  }

  Widget _navList(IColors c, {required bool inDrawer}) => ListView(
        padding: const EdgeInsets.all(IDesignTokensLight.spacing3),
        children: [
          for (final item in widget.nav) ...[
            _navButton(c, item, child: false, inDrawer: inDrawer),
            for (final sub in item.children) _navButton(c, sub, child: true, inDrawer: inDrawer),
          ]
        ],
      );

  Widget _navButton(IColors c, IAppNavItem item, {required bool child, required bool inDrawer}) {
    final on = item.key == widget.current;
    final parent = !child && _activeParent == item.key;
    return InkWell(
      onTap: () {
        if (inDrawer) Navigator.of(context).pop();
        widget.onNavigate(item.key);
      },
      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      child: Container(
        padding: EdgeInsets.only(
          left: child ? IDesignTokensLight.spacing6 : IDesignTokensLight.spacing3,
          right: IDesignTokensLight.spacing3,
          top: IDesignTokensLight.spacing2,
          bottom: IDesignTokensLight.spacing2,
        ),
        decoration: BoxDecoration(
          color: on ? c.brandSubtle : Colors.transparent,
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        ),
        child: Row(
          children: [
            if (item.icon != null && !child) ...[
              Icon(item.icon, size: 16, color: on ? c.brand : c.textSecondary),
              const SizedBox(width: IDesignTokensLight.spacing2),
            ],
            Text(
              item.label,
              style: TextStyle(
                color: on ? c.brand : (parent ? c.text : c.textSecondary),
                fontSize: child ? IDesignTokensLight.fontSizeXs : IDesignTokensLight.fontSizeSm,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    return LayoutBuilder(
      builder: (context, constraints) {
        // 按实际宽度判定，不按设备类型：平板横竖屏、桌面分屏都会跨过这条线
        final wide = constraints.maxWidth >= widget.breakpoint;
        return Scaffold(
          key: _scaffold,
          backgroundColor: c.bg,
          drawer: wide ? null : Drawer(child: SafeArea(child: _navList(c, inDrawer: true))),
          appBar: AppBar(
            backgroundColor: c.bgElevated,
            automaticallyImplyLeading: !wide,
            title: Row(
              children: [
                if (widget.title.isNotEmpty)
                  Text(
                    widget.title,
                    style: TextStyle(
                      color: c.text,
                      fontSize: IDesignTokensLight.fontSizeMd,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                if (widget.topbar != null) ...[
                  const SizedBox(width: IDesignTokensLight.spacing4),
                  Expanded(child: widget.topbar!),
                ] else
                  const Spacer(),
                if (widget.user.isNotEmpty && wide)
                  Text(
                    widget.user,
                    style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeSm),
                  ),
              ],
            ),
          ),
          body: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (wide)
                SizedBox(
                  width: 208,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      border: Border(right: BorderSide(color: c.hairline)),
                    ),
                    child: _navList(c, inDrawer: false),
                  ),
                ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(IDesignTokensLight.spacing4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              [
                                if (widget.title.isNotEmpty) widget.title,
                                ...widget.crumbs,
                              ].join(' / '),
                              style: TextStyle(
                                color: c.textTertiary,
                                fontSize: IDesignTokensLight.fontSizeXs,
                              ),
                            ),
                          ),
                          ...widget.actions,
                        ],
                      ),
                      const SizedBox(height: IDesignTokensLight.spacing4),
                      Expanded(child: widget.child),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
