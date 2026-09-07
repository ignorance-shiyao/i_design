import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 日期选择。
///
/// 日历面板直接用 showDatePicker：系统面板已经处理了本地化、闰年、
/// 手势与读屏，自绘一份只会在这些细节上退步。这里负责的是触发器的外观，
/// 让它和 IInput / ISelect 在同一个表单里看起来是一套。
class IDatePicker extends StatelessWidget {
  const IDatePicker({
    super.key,
    required this.value,
    required this.onChanged,
    this.placeholder = '请选择日期',
    this.size = ISize.md,
    this.enabled = true,
    this.invalid = false,
    this.clearable = false,
    this.firstDate,
    this.lastDate,
  });

  final DateTime? value;
  final ValueChanged<DateTime?> onChanged;
  final String placeholder;
  final ISize size;
  final bool enabled;
  final bool invalid;
  final bool clearable;
  final DateTime? firstDate;
  final DateTime? lastDate;

  static String _format(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Future<void> _open(BuildContext context) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: value ?? now,
      firstDate: firstDate ?? DateTime(now.year - 10),
      lastDate: lastDate ?? DateTime(now.year + 10),
    );
    if (picked != null) onChanged(picked);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final showClear = clearable && enabled && value != null;

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
            IIcon('calendar', size: 14, color: c.textTertiary),
            const SizedBox(width: IDesignTokensLight.spacing2),
            Expanded(
              child: Text(
                value == null ? placeholder : _format(value!),
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: value == null ? c.textTertiary : c.text,
                  fontSize: iFontSize(size),
                ),
              ),
            ),
            if (showClear)
              GestureDetector(
                onTap: () => onChanged(null),
                child: IIcon('close', size: 14, color: c.textTertiary, semanticLabel: '清除'),
              ),
          ],
        ),
      ),
    );
  }
}
