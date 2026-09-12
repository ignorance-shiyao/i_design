import 'package:flutter/material.dart';
import '../logic/float.dart';
import '../theme/i_theme.dart';
import 'i_icon.dart';

/// 悬浮操作按钮的一个次级动作。
class IFloatAction {
  const IFloatAction({required this.key, required this.label, this.icon});

  final String key;

  /// 文字说明，同时用作无障碍名——颜色与位置都不能替代它
  final String label;
  final String? icon;
}

/// 悬浮操作按钮。
///
/// 一页只该有一个：它代表「这一页最主要的那件事」。出现两个就等于没有主次，
/// 用户还得先读一遍才知道点哪个——那还不如放回工具栏里。
///
/// 带 actions 时点击展开一组次级动作，每个都带文字标签：
/// 一排只有图标的圆点，是这类组件最常见的失败形态。
class IFloatButton extends StatefulWidget {
  const IFloatButton({
    super.key,
    this.icon = 'plus',
    this.text = '',
    this.actions = const [],
    this.onPressed,
    this.onSelect,
  });

  final String icon;

  /// 带文字时按钮拉长；只有图标时收成正圆
  final String text;
  final List<IFloatAction> actions;

  /// 没有 actions 时点击的回调
  final VoidCallback? onPressed;
  final ValueChanged<String>? onSelect;

  @override
  State<IFloatButton> createState() => _IFloatButtonState();
}

class _IFloatButtonState extends State<IFloatButton> {
  bool _expanded = false;

  void _toggle() {
    if (widget.actions.isEmpty) {
      widget.onPressed?.call();
      return;
    }
    setState(() => _expanded = !_expanded);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    // Stack 自下而上叠：动作按主按钮中心的偏移量定位，与 Web 端同一份几何
    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.bottomRight,
      children: [
        for (var i = 0; i < widget.actions.length; i++)
          Positioned(
            right: 0,
            bottom: floatActionShift(i) - kFloatActionSize / 2,
            child: AnimatedOpacity(
              opacity: _expanded ? 1 : 0,
              duration: Duration(
                milliseconds: 200 + floatActionDelay(i, widget.actions.length),
              ),
              child: IgnorePointer(
                ignoring: !_expanded,
                child: _action(c, widget.actions[i]),
              ),
            ),
          ),
        _main(c),
      ],
    );
  }

  Widget _action(IColors c, IFloatAction action) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // 文字标签常驻：一排只有图标的圆点谁也认不出来，触屏上也没有悬停这一步
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: c.bgElevated,
            borderRadius: BorderRadius.circular(6),
            boxShadow: const [BoxShadow(blurRadius: 8, color: Color(0x14141822))],
          ),
          child: Text(action.label, style: TextStyle(fontSize: 12, color: c.textSecondary)),
        ),
        const SizedBox(width: kFloatActionGap),
        GestureDetector(
          onTap: () {
            setState(() => _expanded = false);
            widget.onSelect?.call(action.key);
          },
          child: Semantics(
            button: true,
            label: action.label,
            child: Container(
              width: kFloatActionSize,
              height: kFloatActionSize,
              decoration: BoxDecoration(
                color: c.bgElevated,
                shape: BoxShape.circle,
                border: Border.all(color: c.border),
                boxShadow: const [BoxShadow(blurRadius: 12, color: Color(0x1A141822))],
              ),
              child: Center(
                child: action.icon == null
                    // 没给图标时用文字首字兜底，而不是留一个空圆
                    ? Text(action.label.characters.first, style: TextStyle(color: c.text))
                    : IIcon(action.icon!, size: 18, color: c.text),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _main(IColors c) {
    final round = widget.text.isEmpty;
    return GestureDetector(
      onTap: _toggle,
      child: Semantics(
        button: true,
        expanded: widget.actions.isEmpty ? null : _expanded,
        label: widget.text.isEmpty ? '主操作' : widget.text,
        child: AnimatedRotation(
          turns: _expanded ? 0.125 : 0,
          duration: const Duration(milliseconds: 200),
          child: Container(
            height: kFloatButtonSize,
            width: round ? kFloatButtonSize : null,
            padding: round ? null : const EdgeInsets.symmetric(horizontal: 20),
            decoration: BoxDecoration(
              // 纯色：渐变在不同直径的圆上观感会变，主题换色后也更难保证对比度
              color: c.brand,
              borderRadius: BorderRadius.circular(kFloatButtonSize / 2),
              boxShadow: const [BoxShadow(blurRadius: 24, color: Color(0x29141822))],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // 饱和底色上一律白字，与主按钮同一条规则
                IIcon(widget.icon, size: 22, color: Colors.white),
                if (!round) ...[
                  const SizedBox(width: 8),
                  Text(
                    widget.text,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
