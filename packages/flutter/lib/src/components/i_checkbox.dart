import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 多选框。单独使用表示一个确认项，成组使用表示筛选或批量选择。
class ICheckbox extends StatelessWidget {
  const ICheckbox({
    super.key,
    required this.checked,
    this.onChanged,
    this.label,
    this.indeterminate = false,
  });

  final bool checked;
  final ValueChanged<bool>? onChanged;
  final String? label;

  /// 半选态，仅影响视觉，常用于「全选」父项
  final bool indeterminate;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final enabled = onChanged != null;
    final active = checked || indeterminate;

    return Semantics(
      checked: checked,
      mixed: indeterminate,
      child: Opacity(
        opacity: enabled ? 1 : 0.5,
        child: GestureDetector(
          onTap: enabled ? () => onChanged!(!checked) : null,
          behavior: HitTestBehavior.opaque,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 16,
                height: 16,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: active ? c.brand : c.bg,
                  border: Border.all(color: active ? c.brand : c.borderStrong),
                  borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
                ),
                child: indeterminate
                    ? Container(width: 8, height: 2, color: Colors.white)
                    : checked
                        ? const IIcon('check', size: 12, color: Colors.white, strokeWidth: 3)
                        : null,
              ),
              if (label != null) ...[
                const SizedBox(width: IDesignTokensLight.spacing2),
                Text(label!, style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
