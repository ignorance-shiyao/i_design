import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 输入框的固定前后缀：https:// 、.com、元这类不由用户填写的部分。
///
/// 留在输入框里的话既占位置，又会连同用户输入一起被提交。
/// 前后缀与输入框拼成一个整体，相接的两边不要圆角。
class IInputAdornment extends StatelessWidget {
  const IInputAdornment({super.key, required this.child, this.prepend, this.append});

  final Widget child;
  final String? prepend;
  final String? append;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    Widget part(String text, {required bool leading}) => Container(
          padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing3),
          decoration: BoxDecoration(
            color: c.bgSubtle,
            border: Border.all(color: c.border),
            borderRadius: BorderRadius.horizontal(
              left: leading ? Radius.circular(IDesignTokensLight.radiusMd) : Radius.zero,
              right: leading ? Radius.zero : Radius.circular(IDesignTokensLight.radiusMd),
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            text,
            style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeMd),
          ),
        );

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (prepend != null) part(prepend!, leading: true),
          Expanded(child: child),
          if (append != null) part(append!, leading: false),
        ],
      ),
    );
  }
}
