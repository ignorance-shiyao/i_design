import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 选择器外壳：长得像输入框、点开是一个面板。
///
/// Select、Cascader、TreeSelect 外面那一层是同一件东西——一个可聚焦的框、
/// 里面是单行文本或一排标签、右侧一个箭头与清除键。各自写一遍的结果是
/// 聚焦态、清除键位置、禁用色一个个对不齐，因此单独成件。
///
/// 面板开合由调用方持有：它才知道选完要不要关。
class ISelectInput extends StatelessWidget {
  const ISelectInput({
    super.key,
    this.value = '',
    this.placeholder = '请选择',
    this.open = false,
    this.disabled = false,
    this.invalid = false,
    this.clearable = false,
    this.onTap,
    this.onClear,
    this.tags = const [],
  });

  final String value;
  final String placeholder;
  final bool open;
  final bool disabled;
  final bool invalid;
  final bool clearable;
  final VoidCallback? onTap;
  final VoidCallback? onClear;

  /// 多选的标签由调用方渲染：标签长什么样、能不能删，是上层的事
  final List<Widget> tags;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final border = invalid
        ? c.danger
        : open
            ? c.brand
            : c.border;

    return GestureDetector(
      onTap: disabled ? null : onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: IDesignTokensLight.controlHeightMd),
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing3,
          vertical: IDesignTokensLight.spacing1,
        ),
        decoration: BoxDecoration(
          color: disabled ? c.bgSubtle : c.bgElevated,
          border: Border.all(color: border),
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        ),
        child: Row(
          children: [
            Expanded(
              child: tags.isNotEmpty
                  ? Wrap(
                      spacing: IDesignTokensLight.spacing1,
                      runSpacing: IDesignTokensLight.spacing1,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: tags,
                    )
                  : Text(
                      value.isEmpty ? placeholder : value,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: disabled || value.isEmpty ? c.textTertiary : c.text,
                        fontSize: IDesignTokensLight.fontSizeMd,
                      ),
                    ),
            ),
            if (clearable && value.isNotEmpty && !disabled)
              GestureDetector(
                onTap: onClear,
                child: Padding(
                  padding: const EdgeInsets.only(right: IDesignTokensLight.spacing1),
                  child: IIcon('close', size: 14, color: c.textTertiary),
                ),
              ),
            // 展开时箭头翻过来：方向本身就是「还能往下看」的提示
            AnimatedRotation(
              turns: open ? 0.5 : 0,
              duration: const Duration(milliseconds: 120),
              child: IIcon('chevron-down', size: 16, color: c.textTertiary),
            ),
          ],
        ),
      ),
    );
  }
}
