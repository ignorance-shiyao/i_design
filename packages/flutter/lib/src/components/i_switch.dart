import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 开关：在两个互斥状态间切换，且立即生效。
/// 若变更需要提交后才生效，请改用复选框——这条规则七端一致。
class ISwitch extends StatelessWidget {
  const ISwitch({super.key, required this.value, this.onChanged});

  final bool value;
  final ValueChanged<bool>? onChanged;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final enabled = onChanged != null;

    return Semantics(
      toggled: value,
      child: Opacity(
        opacity: enabled ? 1 : 0.5,
        child: GestureDetector(
          onTap: enabled ? () => onChanged!(!value) : null,
          child: AnimatedContainer(
            duration: IDesignTokensLight.motionBase,
            width: 40,
            height: 22,
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              color: value ? c.brand : c.borderStrong,
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
            ),
            child: AnimatedAlign(
              duration: IDesignTokensLight.motionBase,
              alignment: value ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                width: 18,
                height: 18,
                decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
