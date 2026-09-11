import 'package:flutter/material.dart';
import '../logic/range.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 区间输入：两个输入框共用一圈边框，中间一个分隔符。
///
/// 不做成两个独立的输入框并排：那样用户看到的是两个字段，
/// 而「起」和「止」是同一个字段的两端——校验、清空、聚焦态都该作为一个整体。
class IRangeInput extends StatefulWidget {
  const IRangeInput({
    super.key,
    required this.value,
    this.onChanged,
    this.placeholders = const ['开始', '结束'],
    this.separator = '—',
    this.disabled = false,
    this.invalid = false,
    this.autoOrder = true,
  });

  final List<String> value;
  final ValueChanged<List<String>>? onChanged;
  final List<String> placeholders;
  final String separator;
  final bool disabled;
  final bool invalid;

  /// 失焦时若起大于止就自动对调；输入过程中不做——
  /// 用户把 100 改成 10 的中途数值会短暂小于起点，那时对调会把刚敲的字搬走。
  final bool autoOrder;

  @override
  State<IRangeInput> createState() => _IRangeInputState();
}

class _IRangeInputState extends State<IRangeInput> {
  late final TextEditingController _start = TextEditingController(text: widget.value[0]);
  late final TextEditingController _end = TextEditingController(text: widget.value[1]);
  final FocusNode _startFocus = FocusNode();
  final FocusNode _endFocus = FocusNode();
  bool _focused = false;

  @override
  void initState() {
    super.initState();
    for (final node in [_startFocus, _endFocus]) {
      node.addListener(_onFocusChange);
    }
  }

  void _onFocusChange() {
    final focused = _startFocus.hasFocus || _endFocus.hasFocus;
    if (focused == _focused) return;
    setState(() => _focused = focused);
    if (focused || !widget.autoOrder) return;
    final ordered = orderRange([_start.text, _end.text]);
    if (ordered[0] == _start.text && ordered[1] == _end.text) return;
    _start.text = ordered[0];
    _end.text = ordered[1];
    widget.onChanged?.call(ordered);
  }

  @override
  void dispose() {
    _start.dispose();
    _end.dispose();
    _startFocus.dispose();
    _endFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final border = widget.invalid
        ? c.danger
        : _focused
            ? c.brand
            : c.border;

    Widget field(
      TextEditingController controller,
      FocusNode node,
      String hint, {
      required bool end,
    }) =>
        Expanded(
          child: TextField(
            controller: controller,
            focusNode: node,
            enabled: !widget.disabled,
            textAlign: end ? TextAlign.right : TextAlign.left,
            style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeMd),
            decoration: InputDecoration(
              isDense: true,
              border: InputBorder.none,
              hintText: hint,
              hintStyle: TextStyle(color: c.textTertiary),
            ),
            onChanged: (_) => widget.onChanged?.call([_start.text, _end.text]),
          ),
        );

    return Container(
      height: IDesignTokensLight.controlHeightMd,
      padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing3),
      decoration: BoxDecoration(
        color: widget.disabled ? c.bgSubtle : c.bgElevated,
        border: Border.all(color: border),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      ),
      child: Row(
        children: [
          field(_start, _startFocus, widget.placeholders[0], end: false),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing2),
            child: Text(
              widget.separator,
              style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeMd),
            ),
          ),
          field(_end, _endFocus, widget.placeholders[1], end: true),
        ],
      ),
    );
  }
}
