import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 页面骨架：顶栏、侧栏、正文、底栏。
///
/// 只摆位置，不管内容——页面级的结构一旦被组件塞进具体内容，换一个产品就只能重写。
/// 侧栏收起时只留图标宽度，不整个藏掉：入口消失比变窄更难找回来。
class ILayout extends StatelessWidget {
  const ILayout({
    super.key,
    required this.content,
    this.header,
    this.aside,
    this.footer,
    this.asideOnRight = false,
    this.collapsed = false,
    this.asideWidth = 232,
    this.collapsedWidth = 64,
    this.headerHeight = 64,
  });

  final Widget content;
  final Widget? header;
  final Widget? aside;
  final Widget? footer;
  final bool asideOnRight;
  final bool collapsed;
  final double asideWidth;
  final double collapsedWidth;
  final double headerHeight;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    final asideBox = aside == null
        ? null
        : AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: collapsed ? collapsedWidth : asideWidth,
            padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing4),
            decoration: BoxDecoration(
              color: c.bgElevated,
              border: Border(
                right: asideOnRight ? BorderSide.none : BorderSide(color: c.hairline),
                left: asideOnRight ? BorderSide(color: c.hairline) : BorderSide.none,
              ),
            ),
            child: aside,
          );

    final row = Expanded(
      child: Row(
        children: [
          if (asideBox != null && !asideOnRight) asideBox,
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(IDesignTokensLight.spacing6),
              child: content,
            ),
          ),
          if (asideBox != null && asideOnRight) asideBox,
        ],
      ),
    );

    return Container(
      color: c.bg,
      child: Column(
        children: [
          if (header != null)
            Container(
              height: headerHeight,
              padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing6),
              decoration: BoxDecoration(
                color: c.bgElevated,
                border: Border(bottom: BorderSide(color: c.hairline)),
              ),
              alignment: Alignment.centerLeft,
              child: header,
            ),
          row,
          if (footer != null)
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: IDesignTokensLight.spacing6,
                vertical: IDesignTokensLight.spacing4,
              ),
              decoration: BoxDecoration(
                color: c.bgElevated,
                border: Border(top: BorderSide(color: c.hairline)),
              ),
              child: DefaultTextStyle(
                style: TextStyle(
                  color: c.textSecondary,
                  fontSize: IDesignTokensLight.fontSizeSm,
                ),
                child: footer!,
              ),
            ),
        ],
      ),
    );
  }
}
