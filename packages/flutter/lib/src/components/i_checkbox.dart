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

@immutable
class ICheckboxOption<T> {
  const ICheckboxOption({required this.value, required this.label, this.disabled = false});

  final T value;
  final String label;
  final bool disabled;
}

/// 一组可多选的选项。
///
/// [max] 达到上限后未选中项自动禁用，已选中的仍可取消——
/// 不让用户陷入「既不能选也不知道该取消谁」的死角。这条规则与 Web 端一致。
class ICheckboxGroup<T> extends StatelessWidget {
  const ICheckboxGroup({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
    this.direction = Axis.horizontal,
    this.max = 0,
    this.enabled = true,
  });

  final List<ICheckboxOption<T>> options;
  final List<T> value;
  final ValueChanged<List<T>> onChanged;
  final Axis direction;
  final int max;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final atMax = max > 0 && value.length >= max;

    void toggle(T item, bool checked) {
      final next = List<T>.from(value);
      checked ? next.add(item) : next.remove(item);
      onChanged(next);
    }

    final children = [
      for (final option in options)
        Builder(builder: (context) {
          final checked = value.contains(option.value);
          final usable = enabled && !option.disabled && !(atMax && !checked);
          return ICheckbox(
            checked: checked,
            label: option.label,
            onChanged: usable ? (next) => toggle(option.value, next) : null,
          );
        }),
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
