import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 可选中的标签：长得像标签，行为像多选框。
///
/// 选中态用填充色而不是加一圈粗边——粗边会让选中项的视觉面积变大，
/// 一排标签选中几个之后，间距看起来就不匀了。
class ICheckTag extends StatelessWidget {
  const ICheckTag({
    super.key,
    required this.label,
    this.checked = false,
    this.onChanged,
    this.round = false,
    this.disabled = false,
  });

  final String label;
  final bool checked;
  final ValueChanged<bool>? onChanged;
  final bool round;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    return Semantics(
      button: true,
      selected: checked,
      child: GestureDetector(
        onTap: disabled ? null : () => onChanged?.call(!checked),
        child: Container(
          constraints: const BoxConstraints(minHeight: 28),
          padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing3),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: checked ? c.brandSubtle : c.bgSubtle,
            border: Border.all(color: checked ? Colors.transparent : c.hairline),
            borderRadius: BorderRadius.circular(
              round ? IDesignTokensLight.radiusFull : IDesignTokensLight.radiusMd,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: disabled
                  ? c.textTertiary
                  : checked
                      ? c.brand
                      : c.textSecondary,
              fontSize: IDesignTokensLight.fontSizeSm,
            ),
          ),
        ),
      ),
    );
  }
}
