import 'package:flutter/material.dart';
import '../logic/overlay.dart';
import '../logic/selection.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 选区操作：选中一段文字，就地把它交给智能体。
///
/// 走 [SelectionArea] 的 `contextMenuBuilder`，而不是自己再造一套选择手柄：
/// 长按起选、拖动手柄改范围、双击选词——这些行为在每个平台上各有惯例，
/// 自己实现必然与系统不一致，而用户对「选字」的肌肉记忆来自系统而不是这个库。
/// 这里替换的只是选完之后弹出来的那一排动作。
///
/// 选区的清理、字数上限、引文省略、动作条摆哪边都走公共层，与 Web 端逐字一致。
class ISelectionActions extends StatelessWidget {
  const ISelectionActions({
    super.key,
    required this.actions,
    required this.child,
    this.max = selectionMax,
    this.onSelect,
  });

  final List<SelectionActionData> actions;

  /// 可被选中的内容
  final Widget child;

  /// 选区上限；超过就只提示、不给动作
  final int max;

  /// 选了哪个动作、对哪段文字。怎么改写由调用方决定，组件不碰内容
  final void Function(SelectionActionData action, String text)? onSelect;

  @override
  Widget build(BuildContext context) {
    return SelectionArea(
      contextMenuBuilder: (context, state) {
        final raw = state.selectedContent ?? '';
        if (!hasSelection(raw, max: max) && !selectionTooLong(raw, max: max)) {
          return const SizedBox.shrink();
        }
        final anchor = state.contextMenuAnchors.primaryAnchor;
        final media = MediaQuery.of(context).size;
        // 锚点是一个点，不是一块区域；宽高给 0 让公共层按同一套规则夹回屏幕
        final at = selectionAnchor(
          IOverlayRect(anchor.dx, anchor.dy, 0, 0),
          _kBarWidth,
          _kBarHeight,
          media.width,
          media.height,
        );
        return Stack(
          children: [
            Positioned(
              left: at.x,
              top: at.y,
              child: _bar(context, state, raw),
            ),
          ],
        );
      },
      child: child,
    );
  }

  Widget _bar(BuildContext context, SelectableRegionState state, String raw) {
    final c = iColorsOf(context);
    final tooLong = selectionTooLong(raw, max: max);

    return Material(
      color: Colors.transparent,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 520),
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing2,
          vertical: IDesignTokensLight.spacing1,
        ),
        decoration: BoxDecoration(
          color: c.bgElevated,
          // 四边等宽的发丝线：开在上还是开在下由位置本身说明，不靠加粗某一边
          border: Border.all(color: c.hairline),
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
          boxShadow: const [
            BoxShadow(color: Color(0x1F000000), blurRadius: 12, offset: Offset(0, 4)),
          ],
        ),
        child: tooLong
            // 说清楚为什么没有按钮：一排灰按钮不告诉用户该怎么办
            ? Text(
                '选中了 ${selectionCount(raw)} 字，超过 $max 字就不好逐句核对了，选短一些',
                style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeXs),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // 引文回显：让用户确认按钮作用在哪一段上，而不是凭记忆
                  Flexible(
                    child: Text(
                      selectionExcerpt(raw),
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: c.textTertiary,
                        fontSize: IDesignTokensLight.fontSizeXs,
                      ),
                    ),
                  ),
                  Container(
                    width: 1,
                    height: 16,
                    margin: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing1),
                    color: c.hairline,
                  ),
                  for (final action in actions) _action(c, state, action, raw),
                ],
              ),
      ),
    );
  }

  Widget _action(
    IColors c,
    SelectableRegionState state,
    SelectionActionData action,
    String raw,
  ) {
    return Opacity(
      opacity: action.disabled ? 0.4 : 1,
      child: GestureDetector(
        onTap: action.disabled
            ? null
            : () {
                onSelect?.call(action, cleanSelection(raw));
                // 选完就收起：动作条留在原地会挡住刚刚被改写的那段话
                state.hideToolbar();
              },
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: IDesignTokensLight.spacing2,
            vertical: IDesignTokensLight.spacing1,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (action.icon.isNotEmpty) ...[
                IIcon(name: action.icon, size: 13, color: c.text),
                const SizedBox(width: IDesignTokensLight.spacing1),
              ],
              Text(
                action.label,
                style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeXs),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// 动作条尺寸的估值。Flutter 端量不到未渲染的组件，给一个够用的数交给公共层夹回屏幕
const double _kBarWidth = 240;
const double _kBarHeight = 40;
