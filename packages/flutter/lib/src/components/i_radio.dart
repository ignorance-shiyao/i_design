import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 单选框。选项超过 5 个时改用下拉——单选框的优势是把选项一次摊开，
/// 选项一多这个优势就不存在了。
class IRadio<T> extends StatelessWidget {
  const IRadio({
    super.key,
    required this.value,
    required this.groupValue,
    this.onChanged,
    this.label,
  });

  final T value;
  final T? groupValue;
  final ValueChanged<T>? onChanged;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final enabled = onChanged != null;
    final checked = value == groupValue;

    return Semantics(
      checked: checked,
      inMutuallyExclusiveGroup: true,
      child: Opacity(
        opacity: enabled ? 1 : 0.5,
        child: GestureDetector(
          onTap: enabled && !checked ? () => onChanged!(value) : null,
          behavior: HitTestBehavior.opaque,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 16,
                height: 16,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: c.bg,
                  border: Border.all(color: checked ? c.brand : c.borderStrong),
                  shape: BoxShape.circle,
                ),
                child: checked
                    ? Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(color: c.brand, shape: BoxShape.circle),
                      )
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
