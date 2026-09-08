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

@immutable
class IRadioOption<T> {
  const IRadioOption({required this.value, required this.label, this.disabled = false});

  final T value;
  final String label;
  final bool disabled;
}

/// 一组互斥选项。
///
/// 与 ISelect 的分工同 Web 端：选项少于三个时用单选框，用户可以少一次点击；
/// 更多时用下拉，否则一屏放不下。
class IRadioGroup<T> extends StatelessWidget {
  const IRadioGroup({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
    this.direction = Axis.horizontal,
    this.enabled = true,
  });

  final List<IRadioOption<T>> options;
  final T? value;
  final ValueChanged<T> onChanged;
  final Axis direction;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final children = [
      for (final option in options)
        IRadio<T>(
          value: option.value,
          groupValue: value,
          label: option.label,
          onChanged: enabled && !option.disabled ? onChanged : null,
        ),
    ];

    return direction == Axis.horizontal
        ? Wrap(
            spacing: IDesignTokensLight.spacing5,
            runSpacing: IDesignTokensLight.spacing3,
            children: children,
          )
        : Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              for (var i = 0; i < children.length; i++) ...[
                if (i > 0) const SizedBox(height: IDesignTokensLight.spacing3),
                children[i],
              ],
            ],
          );
  }
}
