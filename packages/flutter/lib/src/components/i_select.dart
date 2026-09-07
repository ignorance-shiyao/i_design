import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

@immutable
class ISelectOption {
  const ISelectOption({required this.value, required this.label, this.disabled = false});

  final String value;
  final String label;
  final bool disabled;
}

/// 下拉选择。
///
/// 面板用 showMenu 而非自绘浮层：系统菜单自带屏幕边界避让与返回键关闭，
/// 自绘一份只会在小屏上把选项顶出可视区。
class ISelect extends StatelessWidget {
  const ISelect({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
    this.placeholder = '请选择',
    this.size = ISize.md,
    this.enabled = true,
    this.invalid = false,
    this.clearable = false,
  });

  final List<ISelectOption> options;
  final String? value;
  final ValueChanged<String?> onChanged;
  final String placeholder;
  final ISize size;
  final bool enabled;
  final bool invalid;
  final bool clearable;

  Future<void> _open(BuildContext context) async {
    final box = context.findRenderObject() as RenderBox;
    final overlay = Overlay.of(context).context.findRenderObject() as RenderBox;
    final topLeft = box.localToGlobal(Offset.zero, ancestor: overlay);
    final c = iColorsOf(context);

    final picked = await showMenu<String>(
      context: context,
      color: c.bgElevated,
      position: RelativeRect.fromLTRB(
        topLeft.dx,
        topLeft.dy + box.size.height,
        overlay.size.width - topLeft.dx - box.size.width,
        0,
      ),
      constraints: BoxConstraints(minWidth: box.size.width),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      items: [
        for (final option in options)
          PopupMenuItem<String>(
            value: option.value,
            enabled: !option.disabled,
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    option.label,
                    style: TextStyle(
                      color: option.disabled
                          ? c.textTertiary
                          : (option.value == value ? c.brand : c.text),
                      fontSize: iFontSize(size),
                    ),
                  ),
                ),
                if (option.value == value) IIcon('check', size: 14, color: c.brand),
              ],
            ),
          ),
      ],
    );

    if (picked != null) onChanged(picked);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    // 不用 firstOrNull：那是 package:collection 的扩展，这里不额外引依赖
    ISelectOption? selected;
    for (final option in options) {
      if (option.value == value) {
        selected = option;
        break;
      }
    }
    final showClear = clearable && enabled && selected != null;

    return InkWell(
      onTap: enabled ? () => _open(context) : null,
      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      child: Container(
        height: iControlHeight(size),
        padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing3),
        decoration: BoxDecoration(
          color: enabled ? c.bg : c.bgMuted,
          border: Border.all(color: invalid ? c.danger : c.borderStrong),
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                selected?.label ?? placeholder,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: selected == null
                      ? c.textTertiary
                      : (enabled ? c.text : c.textTertiary),
                  fontSize: iFontSize(size),
                ),
              ),
            ),
            const SizedBox(width: IDesignTokensLight.spacing2),
            if (showClear)
              GestureDetector(
                onTap: () => onChanged(null),
                child: IIcon('close', size: 14, color: c.textTertiary, semanticLabel: '清除'),
              )
            else
              IIcon('chevron-down', size: 14, color: c.textTertiary),
          ],
        ),
      ),
    );
  }
}
