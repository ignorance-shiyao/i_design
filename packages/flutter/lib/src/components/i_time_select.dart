import 'package:flutter/material.dart';
import '../logic/time_select.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_select_input.dart';

/// 固定间隔的时间下拉。
///
/// 与 ITimePicker 的分工：能选任意时刻的用 TimePicker，只在若干个整点或半点里挑的
/// 用这个——用三列滚轮去选「上午九点半」既慢又容易滑过头。
class ITimeSelect extends StatefulWidget {
  const ITimeSelect({
    super.key,
    this.value = '',
    this.onChanged,
    this.start = '09:00',
    this.end = '18:00',
    this.step = 30,
    this.minTime,
    this.maxTime,
    this.placeholder = '选择时间',
    this.disabled = false,
    this.invalid = false,
  });

  final String value;
  final ValueChanged<String>? onChanged;
  final String start;
  final String end;
  final int step;

  /// 早于它的不可选，用于「结束时间不能早于开始时间」
  final String? minTime;
  final String? maxTime;
  final String placeholder;
  final bool disabled;
  final bool invalid;

  @override
  State<ITimeSelect> createState() => _ITimeSelectState();
}

class _ITimeSelectState extends State<ITimeSelect> {
  bool _open = false;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final options = timeSelectOptions(
      start: widget.start,
      end: widget.end,
      step: widget.step,
      minTime: widget.minTime,
      maxTime: widget.maxTime,
    );

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // 外壳复用 ISelectInput：聚焦态、清除键、箭头都该与其他选择器一致
        ISelectInput(
          value: widget.value,
          placeholder: widget.placeholder,
          open: _open,
          disabled: widget.disabled,
          invalid: widget.invalid,
          clearable: true,
          onTap: () => setState(() => _open = !_open),
          onClear: () => widget.onChanged?.call(''),
        ),
        if (_open)
          Container(
            constraints: const BoxConstraints(maxHeight: 240),
            margin: const EdgeInsets.only(top: IDesignTokensLight.spacing1),
            decoration: BoxDecoration(
              color: c.bgElevated,
              border: Border.all(color: c.border),
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
            ),
            child: ListView.builder(
              shrinkWrap: true,
              padding: const EdgeInsets.all(IDesignTokensLight.spacing1),
              itemCount: options.length,
              itemBuilder: (context, index) {
                final option = options[index];
                final active = option.value == widget.value;
                return InkWell(
                  onTap: option.disabled
                      ? null
                      : () {
                          widget.onChanged?.call(option.value);
                          setState(() => _open = false);
                        },
                  child: Container(
                    height: 32,
                    alignment: Alignment.centerLeft,
                    padding: const EdgeInsets.symmetric(
                      horizontal: IDesignTokensLight.spacing3,
                    ),
                    decoration: BoxDecoration(
                      color: active ? c.brandSubtle : null,
                      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
                    ),
                    child: Text(
                      option.value,
                      style: TextStyle(
                        // 不可选的点仍然占位、只是变灰
                        color: option.disabled
                            ? c.textTertiary
                            : active
                                ? c.brand
                                : c.text,
                        fontSize: IDesignTokensLight.fontSizeMd,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }
}
