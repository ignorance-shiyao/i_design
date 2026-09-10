import 'dart:ui' show FontFeature;

import 'package:flutter/material.dart';
import '../logic/time.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 时间选择。
///
/// 三列并排而不是一个长下拉：时分秒拉成一条列表有八万多项，
/// 滚到想要的那一刻比手打还慢。取值判定全部走公共层，与 Web 端逐值一致。
class ITimePicker extends StatefulWidget {
  const ITimePicker({
    super.key,
    this.value = '',
    this.onChanged,
    this.placeholder = '选择时间',
    this.showSecond = true,
    this.hourStep = 1,
    this.minuteStep = 1,
    this.secondStep = 1,
    this.min = '',
    this.max = '',
    this.disabled = false,
  });

  /// HH:mm 或 HH:mm:ss；空串表示未选
  final String value;
  final ValueChanged<String>? onChanged;
  final String placeholder;
  final bool showSecond;
  final int hourStep;
  final int minuteStep;
  final int secondStep;

  /// 可选范围，含端点
  final String min;
  final String max;
  final bool disabled;

  @override
  State<ITimePicker> createState() => _ITimePickerState();
}

class _ITimePickerState extends State<ITimePicker> {
  bool _open = false;

  ITimeValue? get _min => widget.min.isEmpty ? null : parseTime(widget.min);
  ITimeValue? get _max => widget.max.isEmpty ? null : parseTime(widget.max);

  /// 未选时落在范围起点，而不是 00:00——那可能根本不可选
  ITimeValue get _draft =>
      (widget.value.isEmpty ? null : parseTime(widget.value)) ?? _min ?? kTimeZero;

  int _stepOf(String unit) => switch (unit) {
        'hour' => widget.hourStep,
        'minute' => widget.minuteStep,
        _ => widget.secondStep,
      };

  void _commit(ITimeValue next) {
    final clamped = clampTime(
      next,
      min: _min,
      max: _max,
      hourStep: widget.hourStep,
      minuteStep: widget.minuteStep,
      secondStep: widget.secondStep,
      showSecond: widget.showSecond,
    );
    widget.onChanged?.call(formatTime(clamped, showSecond: widget.showSecond));
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final units = widget.showSecond ? ['hour', 'minute', 'second'] : ['hour', 'minute'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: widget.disabled ? null : () => setState(() => _open = !_open),
          child: Container(
            height: IDesignTokensLight.controlHeightMd,
            padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing3),
            decoration: BoxDecoration(
              color: widget.disabled ? c.bgSubtle : c.bgElevated,
              border: Border.all(color: _open ? c.brand : c.border),
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IIcon('clock', size: 15, color: c.textTertiary),
                const SizedBox(width: IDesignTokensLight.spacing2),
                Text(
                  widget.value.isEmpty ? widget.placeholder : widget.value,
                  style: TextStyle(
                    color: widget.value.isEmpty ? c.textTertiary : c.text,
                    fontSize: IDesignTokensLight.fontSizeMd,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ],
            ),
          ),
        ),
        if (_open) ...[
          const SizedBox(height: IDesignTokensLight.spacing1),
          Container(
            decoration: BoxDecoration(
              color: c.bgElevated,
              border: Border.all(color: c.border),
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  height: 200,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [for (final unit in units) _column(c, unit)],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: IDesignTokensLight.spacing3,
                    vertical: IDesignTokensLight.spacing2,
                  ),
                  decoration: BoxDecoration(
                    border: Border(top: BorderSide(color: c.hairline)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // 「此刻」不是装饰：绝大多数时间输入填的就是现在，让人少滚三列
                      GestureDetector(
                        onTap: () {
                          final now = DateTime.now();
                          _commit(ITimeValue(
                            hour: now.hour,
                            minute: now.minute,
                            second: now.second,
                          ));
                        },
                        child: Text(
                          '此刻',
                          style: TextStyle(
                            color: c.textSecondary,
                            fontSize: IDesignTokensLight.fontSizeSm,
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => setState(() => _open = false),
                        child: Text(
                          '确定',
                          style: TextStyle(
                            color: c.brand,
                            fontSize: IDesignTokensLight.fontSizeSm,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _column(IColors c, String unit) {
    final values = timeColumn(unit, step: _stepOf(unit));
    final current = _draft;
    final active = switch (unit) {
      'hour' => current.hour,
      'minute' => current.minute,
      _ => current.second,
    };
    // 打开时把当前值滚进视野：不滚的话选 23:45 打开看到的是 00 开头那一列，
    // 用户会以为值丢了，而它在下面五百像素处
    final controller = ScrollController(
      initialScrollOffset: (values.indexOf(active) * 32 - 84).clamp(0, double.infinity),
    );

    return Container(
      width: 56,
      decoration: unit == 'hour' ? null : BoxDecoration(border: Border(left: BorderSide(color: c.hairline))),
      child: ListView.builder(
        controller: controller,
        padding: const EdgeInsets.only(bottom: 168),
        itemCount: values.length,
        itemExtent: 32,
        itemBuilder: (context, i) {
          final value = values[i];
          final enabled = isUnitEnabled(unit, value, current, min: _min, max: _max);
          final isActive = value == active;
          return GestureDetector(
            onTap: enabled
                ? () => _commit(switch (unit) {
                      'hour' => current.copyWith(hour: value),
                      'minute' => current.copyWith(minute: value),
                      _ => current.copyWith(second: value),
                    })
                : null,
            child: Container(
              alignment: Alignment.center,
              // 当前项用淡底色块加字重，不用一条重边线
              color: isActive ? c.brandSubtle : null,
              child: Text(
                value.toString().padLeft(2, '0'),
                style: TextStyle(
                  color: !enabled
                      ? c.textTertiary.withValues(alpha: 0.45)
                      : (isActive ? c.brand : c.textSecondary),
                  fontSize: IDesignTokensLight.fontSizeSm,
                  fontWeight: isActive ? FontWeight.w500 : FontWeight.w400,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
