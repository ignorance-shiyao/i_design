import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 单行输入框。占位符用于示例而非说明，必要的解释放在标签或下方提示里。
class IInput extends StatelessWidget {
  const IInput({
    super.key,
    this.controller,
    this.value,
    this.onChanged,
    this.placeholder = '',
    this.size = ISize.md,
    this.enabled = true,
    this.invalid = false,
    this.obscureText = false,
    this.keyboardType,
  });

  final TextEditingController? controller;
  final String? value;
  final ValueChanged<String>? onChanged;
  final String placeholder;
  final ISize size;
  final bool enabled;

  /// 校验失败态：边框转为危险色
  final bool invalid;
  final bool obscureText;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final border = invalid ? c.danger : c.borderStrong;

    OutlineInputBorder outline(Color color) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
          borderSide: BorderSide(color: color),
        );

    return SizedBox(
      height: iControlHeight(size),
      child: TextField(
        controller: controller,
        enabled: enabled,
        obscureText: obscureText,
        keyboardType: keyboardType,
        onChanged: onChanged,
        style: TextStyle(color: c.text, fontSize: iFontSize(size)),
        decoration: InputDecoration(
          hintText: placeholder,
          hintStyle: TextStyle(color: c.textTertiary, fontSize: iFontSize(size)),
          filled: true,
          fillColor: enabled ? c.bg : c.bgMuted,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: IDesignTokensLight.spacing3,
            vertical: IDesignTokensLight.spacing2,
          ),
          enabledBorder: outline(border),
          focusedBorder: outline(invalid ? c.danger : c.brand),
          disabledBorder: outline(c.border),
        ),
      ),
    );
  }
}
