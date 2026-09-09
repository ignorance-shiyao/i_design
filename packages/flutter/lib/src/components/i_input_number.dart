import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../logic/number.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 数字输入。
///
/// 与 IInput 的差别不只是限定字符：步进、精度与边界这些规则一旦分散到业务里，
/// 同一个「库存」字段在两个页面会有两种取整方式。规则来自 logic/number.dart，
/// 与 Web 端同源。
class IInputNumber extends StatefulWidget {
  const IInputNumber({
    super.key,
    required this.value,
    required this.onChanged,
    this.min = double.negativeInfinity,
    this.max = double.infinity,
    this.step = 1,
    this.precision = 0,
    this.size = ISize.md,
    this.enabled = true,
    this.invalid = false,
    this.placeholder = '',
    this.hideStep = false,
  });

  final double? value;
  final ValueChanged<double?> onChanged;
  final double min;
  final double max;
  final double step;

  /// 小数位；步进与失焦时都按它取整
  final int precision;
  final ISize size;
  final bool enabled;
  final bool invalid;
  final String placeholder;

  /// 隐藏两侧的加减按钮，只保留键盘输入
  final bool hideStep;

  @override
  State<IInputNumber> createState() => _IInputNumberState();
}

class _IInputNumberState extends State<IInputNumber> {
  late final TextEditingController _controller =
      TextEditingController(text: _textOf(widget.value));
  final FocusNode _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    _focus.addListener(() {
      setState(() {});
      // 失焦时才规整：输入过程中可能是 "-" 或 "1." 这类还不能解析的中间态
      if (!_focus.hasFocus) _normalize();
    });
  }

  @override
  void didUpdateWidget(IInputNumber old) {
    super.didUpdateWidget(old);
    // 外部改值时同步文本框，但正在输入时不要抢：会把光标顶到末尾
    if (widget.value != old.value && !_focus.hasFocus) {
      _controller.text = _textOf(widget.value);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  String _textOf(double? value) {
    if (value == null) return '';
    return widget.precision > 0
        ? value.toStringAsFixed(widget.precision)
        : value.toStringAsFixed(0);
  }

  void _normalize() {
    final text = _controller.text.trim();
    if (text.isEmpty) {
      widget.onChanged(null);
      return;
    }
    final parsed = double.tryParse(text);
    if (parsed == null) {
      _controller.text = _textOf(widget.value);
      return;
    }
    final next = roundTo(clampNumber(parsed, widget.min, widget.max), widget.precision);
    _controller.text = _textOf(next);
    widget.onChanged(next);
  }

  void _stepBy(double direction) {
    if (!widget.enabled) return;
    final next = stepValue(
      widget.value ?? 0,
      direction * widget.step,
      widget.min,
      widget.max,
      widget.precision,
    );
    _controller.text = _textOf(next);
    widget.onChanged(next);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final border = widget.invalid
        ? c.danger
        : (_focus.hasFocus ? c.brand : c.borderStrong);

    Widget stepButton(String icon, double direction, bool usable, String label) => InkWell(
          onTap: usable ? () => _stepBy(direction) : null,
          child: Container(
            width: 28,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              border: Border(
                left: direction > 0 ? BorderSide(color: c.hairline) : BorderSide.none,
                right: direction < 0 ? BorderSide(color: c.hairline) : BorderSide.none,
              ),
            ),
            child: IIcon(
              icon,
              size: 14,
              color: usable ? c.textTertiary : c.border,
              semanticLabel: label,
            ),
          ),
        );

    final canMinus = widget.enabled && (widget.value == null || widget.value! > widget.min);
    final canPlus = widget.enabled && (widget.value == null || widget.value! < widget.max);

    return Container(
      height: iControlHeight(widget.size),
      decoration: BoxDecoration(
        color: widget.enabled ? c.bg : c.bgMuted,
        border: Border.all(color: border),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      ),
      clipBehavior: Clip.antiAlias,
      child: Row(
        children: [
          if (!widget.hideStep) stepButton('minus', -1, canMinus, '减少'),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing3),
              child: TextField(
                controller: _controller,
                focusNode: _focus,
                enabled: widget.enabled,
                textAlign: TextAlign.left,
                keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                inputFormatters: [
                  // 允许负号与小数点，其余字符直接挡掉
                  FilteringTextInputFormatter.allow(RegExp(r'[0-9.\-]')),
                ],
                style: TextStyle(
                  color: widget.enabled ? c.text : c.textTertiary,
                  fontSize: iFontSize(widget.size),
                ),
                decoration: InputDecoration(
                  isDense: true,
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                  hintText: widget.placeholder,
                  hintStyle: TextStyle(color: c.textTertiary),
                ),
                onSubmitted: (_) => _normalize(),
              ),
            ),
          ),
          if (!widget.hideStep) stepButton('plus', 1, canPlus, '增加'),
        ],
      ),
    );
  }
}
