import 'dart:async';
import 'dart:ui' show FontFeature;

import 'package:flutter/material.dart';
import '../logic/keypad.dart' as logic;
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 数字键盘。
///
/// 用手机拨号盘的顺序（1 在左上）而不是计算器的顺序（7 在左上）：
/// 输入金额和验证码时，用户的肌肉记忆来自拨号盘。
class INumberKeypad extends StatefulWidget {
  const INumberKeypad({
    super.key,
    this.value = '',
    this.onChanged,
    this.decimals = 2,
    this.maxLength = 12,
    this.negative = false,
    this.confirmText = '',
    this.onConfirm,
  });

  final String value;
  final ValueChanged<String>? onChanged;

  /// 最多几位小数。0 表示不允许小数点
  final int decimals;

  /// 最大长度，按字符数算（含小数点与负号）
  final int maxLength;

  /// 允许负数，键盘上多一个 +/- 键
  final bool negative;

  /// 右侧的确认列。金额场景常见，验证码场景不需要
  final String confirmText;
  final ValueChanged<String>? onConfirm;

  @override
  State<INumberKeypad> createState() => _INumberKeypadState();
}

class _INumberKeypadState extends State<INumberKeypad> {
  Timer? _delay;
  Timer? _repeat;
  late String _value = widget.value;

  @override
  void didUpdateWidget(INumberKeypad old) {
    super.didUpdateWidget(old);
    if (old.value != widget.value) _value = widget.value;
  }

  @override
  void dispose() {
    _holdEnd();
    super.dispose();
  }

  void _press(String key) {
    if (key.isEmpty) return;
    final next = logic.pressKey(
      _value,
      key,
      decimals: widget.decimals,
      maxLength: widget.maxLength,
      negative: widget.negative,
    );
    setState(() => _value = next);
    widget.onChanged?.call(next);
  }

  /// 长按删除键连续退格：输错一长串时一下一下点太慢
  void _holdStart(String key) {
    if (key != 'backspace') return;
    _delay = Timer(const Duration(milliseconds: 400), () {
      _repeat = Timer.periodic(const Duration(milliseconds: 80), (_) => _press('backspace'));
    });
  }

  void _holdEnd() {
    _delay?.cancel();
    _repeat?.cancel();
    _delay = null;
    _repeat = null;
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final rows = logic.keypadRows(decimals: widget.decimals, negative: widget.negative);

    return Semantics(
      container: true,
      label: '数字键盘',
      child: Container(
        padding: const EdgeInsets.all(IDesignTokensLight.spacing2),
        decoration: BoxDecoration(
          color: c.bgSubtle,
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (final row in rows)
                    Padding(
                      padding: const EdgeInsets.only(bottom: IDesignTokensLight.spacing2),
                      child: Row(
                        children: [
                          for (final key in row)
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: IDesignTokensLight.spacing1,
                                ),
                                child: _key(c, key),
                              ),
                            ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            if (widget.confirmText.isNotEmpty) ...[
              const SizedBox(width: IDesignTokensLight.spacing2),
              // 确认键竖跨整列：它是这块键盘上唯一一个「结束输入」的键，得比数字键显眼
              SizedBox(
                width: 76,
                child: GestureDetector(
                  onTap: () => widget.onConfirm?.call(_value),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: IDesignTokensLight.spacing2),
                    decoration: BoxDecoration(
                      color: c.brand,
                      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      widget.confirmText,
                      style: TextStyle(color: c.onMedia, fontSize: IDesignTokensLight.fontSizeMd),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _key(IColors c, String key) {
    // 占位格不渲染成按钮，否则读屏会念出一个没有名字的按钮
    if (key.isEmpty) return const SizedBox(height: 48);
    final fn = key == 'backspace' || key == 'sign';
    return Semantics(
      button: true,
      label: logic.keyLabel(key),
      child: GestureDetector(
        onTap: () => _press(key),
        onTapDown: (_) => _holdStart(key),
        onTapUp: (_) => _holdEnd(),
        onTapCancel: _holdEnd,
        child: Container(
          height: 48,
          decoration: BoxDecoration(
            // 功能键用淡底色区分，而不是加重边框
            color: fn ? c.bgSubtle : c.bgElevated,
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
          ),
          alignment: Alignment.center,
          child: key == 'backspace'
              ? IIcon('close', size: 18, color: c.textSecondary)
              : Text(
                  key == 'sign' ? '+/−' : key,
                  style: TextStyle(
                    color: fn ? c.textSecondary : c.text,
                    fontSize: IDesignTokensLight.fontSizeXl,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
        ),
      ),
    );
  }
}
