import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

enum ILinkTheme { normal, brand, success, warning, danger }

enum ILinkSize { sm, md, lg }

/// 下划线时机。默认一直有——颜色不能是「这是个链接」的唯一线索，
/// 色觉障碍用户与灰度屏都读不出纯靠颜色的链接。
enum ILinkUnderline { always, hover, never }

/// 文字链接。
///
/// Flutter 没有 CSS 的 :hover 概念，hover 档用 MouseRegion 自己维护——
/// 触屏上不会触发，因此它在移动端等同于「从不」，这与 Web 端表现一致。
class ILink extends StatefulWidget {
  const ILink({
    super.key,
    required this.text,
    this.onTap,
    this.theme = ILinkTheme.brand,
    this.size = ILinkSize.md,
    this.underline = ILinkUnderline.always,
    this.disabled = false,
    this.prefixIcon,
    this.suffixIcon,
  });

  final String text;
  final VoidCallback? onTap;
  final ILinkTheme theme;
  final ILinkSize size;
  final ILinkUnderline underline;
  final bool disabled;
  final IconData? prefixIcon;
  final IconData? suffixIcon;

  @override
  State<ILink> createState() => _ILinkState();
}

class _ILinkState extends State<ILink> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    final color = widget.disabled
        ? c.textTertiary
        : switch (widget.theme) {
            ILinkTheme.normal => c.text,
            ILinkTheme.brand => c.brand,
            ILinkTheme.success => c.success,
            ILinkTheme.warning => c.warning,
            ILinkTheme.danger => c.danger,
          };

    final fontSize = switch (widget.size) {
      ILinkSize.sm => IDesignTokensLight.fontSizeSm,
      ILinkSize.md => IDesignTokensLight.fontSizeMd,
      ILinkSize.lg => IDesignTokensLight.fontSizeLg,
    };

    final underlined = !widget.disabled &&
        switch (widget.underline) {
          ILinkUnderline.always => true,
          ILinkUnderline.hover => _hovered,
          ILinkUnderline.never => false,
        };

    final content = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (widget.prefixIcon != null) ...[
          Icon(widget.prefixIcon, size: 14, color: color),
          const SizedBox(width: IDesignTokensLight.spacing1),
        ],
        Text(
          widget.text,
          style: TextStyle(
            color: color,
            fontSize: fontSize,
            decoration: underlined ? TextDecoration.underline : TextDecoration.none,
            decorationColor: color,
          ),
        ),
        if (widget.suffixIcon != null) ...[
          const SizedBox(width: IDesignTokensLight.spacing1),
          Icon(widget.suffixIcon, size: 14, color: color),
        ],
      ],
    );

    return MouseRegion(
      cursor: widget.disabled ? SystemMouseCursors.forbidden : SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.disabled ? null : widget.onTap,
        child: content,
      ),
    );
  }
}
