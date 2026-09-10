import 'package:flutter/material.dart';
import '../logic/calendar.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 日历。
///
/// 标记用「淡底色块 + 文字」，不给整格换底色：换底色会和「选中」「今天」
/// 抢同一个视觉通道，三者叠在一起时读者分不出哪个是哪个。
class ICalendar extends StatefulWidget {
  const ICalendar({
    super.key,
    this.value,
    this.onChanged,
    this.mode = 'single',
    this.marks = const [],
    this.weekStart = 1,
    this.min = '',
    this.max = '',
  });

  /// 单选传 IDateRange(start: iso)；范围选传起止两端
  final IDateRange? value;
  final ValueChanged<IDateRange>? onChanged;

  /// 'single' 或 'range'
  final String mode;

  /// 日程标记
  final List<ICalendarMark> marks;
  final int weekStart;

  /// 可选范围之外的日期禁用
  final String min;
  final String max;

  @override
  State<ICalendar> createState() => _ICalendarState();
}

class _ICalendarState extends State<ICalendar> {
  late DateTime _view = parseISO(widget.value?.start) ?? DateTime.now();

  IDateRange get _range => widget.value ?? const IDateRange();

  bool _disabled(String iso) =>
      (widget.min.isNotEmpty && iso.compareTo(widget.min) < 0) ||
      (widget.max.isNotEmpty && iso.compareTo(widget.max) > 0);

  void _pick(String iso) {
    if (_disabled(iso)) return;
    widget.onChanged?.call(
      widget.mode == 'range' ? selectRange(_range, iso) : IDateRange(start: iso),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final cells = buildCalendar(_view, weekStart: widget.weekStart);
    final grouped = groupMarks(widget.marks);
    final labels = weekdayLabels(weekStart: widget.weekStart);

    return Container(
      decoration: BoxDecoration(
        color: c.bgElevated,
        border: Border.all(color: c.border),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: IDesignTokensLight.spacing4,
              vertical: IDesignTokensLight.spacing3,
            ),
            decoration: BoxDecoration(border: Border(bottom: BorderSide(color: c.hairline))),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _nav(c, 'chevron-left', '上个月', () => setState(() => _view = addMonths(_view, -1))),
                Text(
                  '${_view.year} 年 ${_view.month} 月',
                  style: TextStyle(
                    color: c.text,
                    fontSize: IDesignTokensLight.fontSizeMd,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                _nav(c, 'chevron-right', '下个月', () => setState(() => _view = addMonths(_view, 1))),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(IDesignTokensLight.spacing2),
            child: Column(
              children: [
                Row(
                  children: [
                    for (final label in labels)
                      Expanded(
                        child: Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing2),
                            child: Text(
                              label,
                              style: TextStyle(
                                color: c.textTertiary,
                                fontSize: IDesignTokensLight.fontSizeXs,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                for (var week = 0; week < 6; week++)
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      for (var i = week * 7; i < week * 7 + 7; i++)
                        Expanded(child: _cell(c, cells[i], grouped[cells[i].iso] ?? const [])),
                    ],
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _nav(IColors c, String icon, String label, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        child: SizedBox(
          width: 28,
          height: 28,
          child: Center(child: IIcon(icon, size: 16, semanticLabel: label, color: c.textSecondary)),
        ),
      );

  Widget _cell(IColors c, ICalendarCell cell, List<ICalendarMark> marks) {
    final edge = isRangeEdge(cell.iso, _range);
    final inRange = widget.mode == 'range' && isInRange(cell.iso, _range);
    final off = _disabled(cell.iso);

    Color markBg(String type) => switch (type) {
          'success' => c.successSubtle,
          'warning' => c.warningSubtle,
          'danger' => c.dangerSubtle,
          _ => c.brandSubtle,
        };
    Color markInk(String type) => switch (type) {
          'success' => c.success,
          'warning' => c.warning,
          'danger' => c.danger,
          _ => c.brand,
        };

    return Semantics(
      selected: edge != null,
      button: true,
      child: GestureDetector(
        onTap: off ? null : () => _pick(cell.iso),
        child: Container(
          constraints: const BoxConstraints(minHeight: 64),
          padding: const EdgeInsets.all(IDesignTokensLight.spacing1),
          color: inRange ? c.brandSubtle : null,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                decoration: BoxDecoration(
                  color: edge != null ? c.brand : null,
                  borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
                  // 今天用一圈描边，选中用实心：两者可以同时成立，得能分得开
                  border: cell.today && edge == null ? Border.all(color: c.brand) : null,
                ),
                child: Text(
                  '${cell.day}',
                  style: TextStyle(
                    color: edge != null
                        ? c.onMedia
                        : off
                            ? c.textTertiary.withValues(alpha: 0.4)
                            : cell.outside
                                ? c.textTertiary
                                : c.text,
                    fontSize: IDesignTokensLight.fontSizeSm,
                  ),
                ),
              ),
              // 标记必须带文字：只靠色点的话，色觉障碍用户与灰度打印都读不出类型
              for (final mark in marks.take(2))
                Container(
                  margin: const EdgeInsets.only(top: 2),
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    color: markBg(mark.type),
                    borderRadius: BorderRadius.circular(3),
                  ),
                  child: Text(
                    mark.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: markInk(mark.type),
                      fontSize: IDesignTokensLight.fontSizeXs,
                    ),
                  ),
                ),
              if (marks.length > 2)
                Text(
                  '+${marks.length - 2}',
                  style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
