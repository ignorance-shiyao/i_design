import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../logic/otp.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 验证码输入。
///
/// 分格能让人一眼看出要填几位，也不必数自己填到第几位；代价是粘贴、删除都得自己处理。
/// 这些规则在 logic/otp，与 Web 各端共用同一份。
class IInputOtp extends StatefulWidget {
  const IInputOtp({
    super.key,
    this.value = '',
    this.onChanged,
    this.onCompleted,
    this.length = 6,
    this.mode = OtpMode.numeric,
    this.password = false,
    this.disabled = false,
    this.invalid = false,
  });

  final String value;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onCompleted;
  final int length;
  final OtpMode mode;

  /// 用圆点遮住已输入的字符，格数仍然可见
  final bool password;
  final bool disabled;
  final bool invalid;

  @override
  State<IInputOtp> createState() => _IInputOtpState();
}

class _IInputOtpState extends State<IInputOtp> {
  late List<String> _cells = otpFromText(widget.value, widget.length, widget.mode);
  late final List<FocusNode> _nodes =
      List.generate(widget.length, (_) => FocusNode(), growable: false);
  late final List<TextEditingController> _controllers = List.generate(
    widget.length,
    (i) => TextEditingController(text: _cells[i]),
    growable: false,
  );

  @override
  void didUpdateWidget(IInputOtp old) {
    super.didUpdateWidget(old);
    // 外部改值（清空重填、自动填充）时同步进来
    if (widget.value != otpValue(_cells)) {
      _cells = otpFromText(widget.value, widget.length, widget.mode);
      for (var i = 0; i < widget.length; i++) {
        _controllers[i].text = _cells[i];
      }
    }
  }

  @override
  void dispose() {
    for (final node in _nodes) {
      node.dispose();
    }
    for (final controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  void _commit(List<String> cells, int focus) {
    setState(() => _cells = cells);
    for (var i = 0; i < widget.length; i++) {
      if (_controllers[i].text != cells[i]) _controllers[i].text = cells[i];
    }
    _nodes[focus].requestFocus();
    final full = otpValue(cells);
    widget.onChanged?.call(full);
    if (full.isNotEmpty) widget.onCompleted?.call(full);
  }

  void _onChanged(int index, String raw) {
    // 粘贴进来的是一整串：按公共规则分配到各格
    if (raw.length > 1) {
      final cells = otpFromText(raw, widget.length, widget.mode);
      final filled = cells.where((c) => c.isNotEmpty).length;
      _commit(cells, filled < widget.length ? filled : widget.length - 1);
      return;
    }

    final char = raw.isNotEmpty && isOtpChar(raw, widget.mode) ? raw : '';
    if (char.isEmpty && _cells[index].isNotEmpty) {
      final back = otpBackspace(_cells, index);
      _commit(back.cells, back.index);
      return;
    }

    final cells = [..._cells];
    cells[index] = char;
    _commit(cells, char.isEmpty ? index : otpNextIndex(index, widget.length));
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < widget.length; i++) ...[
          if (i > 0) const SizedBox(width: IDesignTokensLight.spacing2),
          SizedBox(
            width: 44,
            height: 52,
            child: TextField(
              controller: _controllers[i],
              focusNode: _nodes[i],
              enabled: !widget.disabled,
              obscureText: widget.password,
              textAlign: TextAlign.center,
              keyboardType: widget.mode == OtpMode.numeric
                  ? TextInputType.number
                  : TextInputType.text,
              inputFormatters: [LengthLimitingTextInputFormatter(widget.length)],
              style: TextStyle(
                color: c.text,
                fontSize: IDesignTokensLight.fontSizeXl,
                fontFamily: 'monospace',
              ),
              decoration: InputDecoration(
                contentPadding: EdgeInsets.zero,
                filled: true,
                fillColor: widget.disabled ? c.bgSubtle : c.bgElevated,
                enabledBorder: OutlineInputBorder(
                  borderSide: BorderSide(color: widget.invalid ? c.danger : c.border),
                  borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: BorderSide(color: widget.invalid ? c.danger : c.brand),
                  borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
                ),
              ),
              onChanged: (raw) => _onChanged(i, raw),
            ),
          ),
        ],
      ],
    );
  }
}
