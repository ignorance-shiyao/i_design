import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import '../logic/overlay.dart';

/// 气泡卡片：承载比文字提示更复杂的内容。
///
/// 与 ITooltip 的分界和 Web 端一致——只有一句话说明用 Tooltip，
/// 需要标题、段落或可交互元素时用 Popover。
///
/// 位置由 logic/overlay 的 resolveOverlay 算出，与 Web 端同一套规则：
/// 空间不足翻到对侧、贴边推回可用区。因此同一个设计在两端落点一致，
/// 而不是各自「看起来差不多」。
class IPopover extends StatefulWidget {
  const IPopover({
    super.key,
    required this.child,
    required this.content,
    this.title,
    this.placement = IPlacement.top,
    this.width = 240,
  });

  final Widget child;
  final Widget content;
  final String? title;
  final IPlacement placement;

  /// 浮层宽度需要预先给定：定位要在渲染前算，拿不到自适应后的尺寸
  final double width;

  @override
  State<IPopover> createState() => _IPopoverState();
}

class _IPopoverState extends State<IPopover> {
  OverlayEntry? _entry;

  @override
  void dispose() {
    _remove();
    super.dispose();
  }

  void _remove() {
    _entry?.remove();
    _entry = null;
  }

  void _toggle() {
    if (_entry != null) {
      _remove();
      return;
    }

    final box = context.findRenderObject() as RenderBox;
    final overlayBox =
        Overlay.of(context).context.findRenderObject() as RenderBox;
    final topLeft = box.localToGlobal(Offset.zero, ancestor: overlayBox);
    final c = iColorsOf(context);

    // 高度按内容估一个上界：Overlay 里量不到未渲染的尺寸，
    // 估高只影响「翻不翻转」的判断，偏大比偏小安全——宁可提前翻转，
    // 也不要浮层贴出屏幕。
    const estimatedHeight = 120.0;
    final pos = resolveOverlay(
      trigger: IOverlayRect(
        topLeft.dx,
        topLeft.dy,
        box.size.width,
        box.size.height,
      ),
      popup: IOverlayRect(0, 0, widget.width, estimatedHeight),
      viewport: IOverlayRect(
        0,
        0,
        overlayBox.size.width,
        overlayBox.size.height,
      ),
      placement: widget.placement,
    );

    _entry = OverlayEntry(
      builder: (context) => Stack(
        children: [
          // 点击浮层外任意位置关闭
          Positioned.fill(
            child: GestureDetector(
              behavior: HitTestBehavior.translucent,
              onTap: _remove,
            ),
          ),
          Positioned(
            left: pos.x,
            top: pos.y,
            width: widget.width,
            child: Material(
              color: Colors.transparent,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: IDesignTokensLight.spacing4,
                  vertical: IDesignTokensLight.spacing3,
                ),
                decoration: BoxDecoration(
                  color: c.bgElevated,
                  border: Border.all(color: c.border),
                  borderRadius:
                      BorderRadius.circular(IDesignTokensLight.radiusMd),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (widget.title != null) ...[
                      Text(
                        widget.title!,
                        style: TextStyle(
                          fontSize: IDesignTokensLight.fontSizeSm,
                          fontWeight: FontWeight.w600,
                          color: c.text,
                        ),
                      ),
                      const SizedBox(height: IDesignTokensLight.spacing1),
                    ],
                    DefaultTextStyle(
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeSm,
                        color: c.textSecondary,
                      ),
                      child: widget.content,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
    Overlay.of(context).insert(_entry!);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: _toggle,
      child: widget.child,
    );
  }
}
