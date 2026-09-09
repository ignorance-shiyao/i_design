import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 多行输入。
///
/// 与 IInput 的差别只在行数与计数器，因此边框、圆角、色彩全部复用同一批令牌，
/// 免得两个输入类组件在同一个表单里看起来像来自不同的库。
class ITextarea extends StatelessWidget {
  const ITextarea({
    super.key,
    this.controller,
    this.onChanged,
    this.placeholder = '',
    this.rows = 3,
    this.maxLength,
    this.enabled = true,
    this.invalid = false,
  });

  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final String placeholder;
  final int rows;

  /// 传入后右下角显示计数；超出由 TextField 自身拦截
  final int? maxLength;
  final bool enabled;
  final bool invalid;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    OutlineInputBorder outline(Color color) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
          borderSide: BorderSide(color: color),
        );

    return TextField(
      controller: controller,
      enabled: enabled,
      onChanged: onChanged,
      minLines: rows,
      maxLines: null,
      maxLength: maxLength,
      style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd),
      decoration: InputDecoration(
        hintText: placeholder,
        hintStyle: TextStyle(color: c.textTertiary),
        filled: true,
        fillColor: enabled ? c.bg : c.bgMuted,
        counterStyle: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
        contentPadding: const EdgeInsets.all(IDesignTokensLight.spacing3),
        enabledBorder: outline(invalid ? c.danger : c.borderStrong),
        focusedBorder: outline(invalid ? c.danger : c.brand),
        disabledBorder: outline(c.border),
      ),
    );
  }
}
