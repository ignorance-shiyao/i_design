import 'package:flutter/material.dart';
import '../logic/finetune.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';
import 'i_select.dart';
import 'i_switch.dart';

/// 属性检查器：智能体生成之后，人接着微调。
///
/// 与一张普通表单差在一件事上：**随时看得出「哪几项被我改过」，并且能单独
/// 退回去**。没有这条，用户调了七八下之后就不敢再动了——他不知道自己已经
/// 偏离原始结果多远，也不知道怎么退回某一项。
///
/// 改动不是只给一个颜色：改过的那一项旁边多出一个写着原值的「退回」按钮，
/// 标题上写着「改了 3 项」。灰度打印与色觉障碍下都读得出来。
class IFineTuneCard extends StatelessWidget {
  const IFineTuneCard({
    super.key,
    required this.fields,
    required this.original,
    required this.values,
    this.title = '微调',
    this.onValuesChanged,
    this.onReset,
  });

  final List<FineTuneFieldData> fields;

  /// 智能体给出的原始值。退回时回到这里
  final Map<String, Object?> original;
  final Map<String, Object?> values;
  final String title;
  final ValueChanged<Map<String, Object?>>? onValuesChanged;

  /// 整份退回。与逐项退回分开，好让调用方决定要不要二次确认
  final VoidCallback? onReset;

  void _set(FineTuneFieldData field, Object? value) {
    // 夹范围与吸步长在逻辑层做：拖的和敲的必须得到同一个值
    onValuesChanged?.call({...values, field.key: clampFieldValue(field, value)});
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final changed = changedKeys(fields, original, values).toSet();

    return Container(
      padding: const EdgeInsets.all(IDesignTokensLight.spacing4),
      decoration: BoxDecoration(
        color: c.bgElevated,
        // 四边等宽的发丝线：改没改过由「退回」按钮与那行字说，不靠加粗某一边
        border: Border.all(color: c.hairline),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                title,
                style: TextStyle(
                  color: c.text,
                  fontSize: IDesignTokensLight.fontSizeMd,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: IDesignTokensLight.spacing2),
              // 改了几项写成字：一个小圆点说不清改了多少，也说不清改了哪几项
              Expanded(
                child: Text(
                  fineTuneSummary(changed.length),
                  style: TextStyle(
                    color: c.textTertiary,
                    fontSize: IDesignTokensLight.fontSizeXs,
                  ),
                ),
              ),
              // 没什么可退回时变淡且不可点，不隐藏——按钮消失会让标题行左右跳
              Opacity(
                opacity: changed.isEmpty ? 0.4 : 1,
                child: _pill(
                  c,
                  '全部退回',
                  changed.isEmpty ? null : onReset,
                  semantics: '把所有属性退回原始结果',
                ),
              ),
            ],
          ),
          const SizedBox(height: IDesignTokensLight.spacing3),
          for (final field in fields) _row(c, field, changed.contains(field.key)),
        ],
      ),
    );
  }

  Widget _row(IColors c, FineTuneFieldData field, bool isChanged) {
    return Container(
      margin: const EdgeInsets.only(bottom: IDesignTokensLight.spacing2),
      padding: const EdgeInsets.symmetric(vertical: 2),
      decoration: BoxDecoration(
        // 改过的行垫一块淡底：颜色是第三条线索，前两条是「退回」按钮与标题上那行字
        color: isChanged ? c.brandSubtle : null,
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  field.label,
                  style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeSm),
                ),
                if (field.hint.isNotEmpty)
                  Text(
                    field.hint,
                    style: TextStyle(
                      color: c.textTertiary,
                      fontSize: IDesignTokensLight.fontSizeXs,
                    ),
                  ),
              ],
            ),
          ),
          Expanded(flex: 3, child: _control(c, field)),
          const SizedBox(width: IDesignTokensLight.spacing2),
          // 改过的那一项才有退回按钮：没改的项上也摆一个灰按钮会让整列看起来全是可退回的
          if (isChanged)
            _pill(
              c,
              formatFieldValue(field, original[field.key]),
              () => onValuesChanged?.call(resetField(original, values, field.key)),
              icon: 'undo',
              semantics: '把${field.label}退回 ${formatFieldValue(field, original[field.key])}',
            )
          else
            Text(
              formatFieldValue(field, values[field.key]),
              style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
            ),
        ],
      ),
    );
  }

  Widget _control(IColors c, FineTuneFieldData field) {
    switch (field.kind) {
      case FineTuneKind.number:
        // 滑块旁边写着当前值：只给一个滑块位置，读者读不出这一项现在是多少
        return Row(
          children: [
            Expanded(
              child: Slider(
                min: field.min ?? 0,
                max: field.max ?? 1,
                divisions: field.step != null && field.step! > 0 && field.max != null
                    ? (((field.max! - (field.min ?? 0)) / field.step!).round()).clamp(1, 1000)
                    : null,
                value: fieldRatio(field, values[field.key]) * ((field.max ?? 1) - (field.min ?? 0)) +
                    (field.min ?? 0),
                onChanged: field.disabled ? null : (v) => _set(field, v),
              ),
            ),
            Text(
              formatFieldValue(field, values[field.key]),
              style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeXs),
            ),
          ],
        );
      case FineTuneKind.switchKind:
        return Align(
          alignment: Alignment.centerLeft,
          child: ISwitch(
            value: values[field.key] == true,
            onChanged: field.disabled ? null : (v) => _set(field, v),
          ),
        );
      case FineTuneKind.select:
        return ISelect(
          value: values[field.key]?.toString(),
          options: [
            for (final o in field.options) ISelectOption(value: o.value, label: o.label),
          ],
          enabled: !field.disabled,
          onChanged: (v) => _set(field, v),
        );
      default:
        return TextField(
          controller: TextEditingController(text: values[field.key]?.toString() ?? ''),
          enabled: !field.disabled,
          style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeXs),
          onSubmitted: (v) => _set(field, v),
        );
    }
  }

  Widget _pill(
    IColors c,
    String label,
    VoidCallback? onTap, {
    String icon = 'undo',
    String semantics = '',
  }) {
    return Semantics(
      label: semantics.isEmpty ? label : semantics,
      button: true,
      enabled: onTap != null,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: IDesignTokensLight.spacing2,
            vertical: 2,
          ),
          decoration: BoxDecoration(
            color: c.bgElevated,
            border: Border.all(color: c.hairline),
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IIcon(name: icon, size: 12, color: c.textSecondary),
              const SizedBox(width: IDesignTokensLight.spacing1),
              Text(
                label,
                style: TextStyle(
                  color: c.textSecondary,
                  fontSize: IDesignTokensLight.fontSizeXs,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
