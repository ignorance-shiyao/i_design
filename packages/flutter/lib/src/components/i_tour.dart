import 'package:flutter/material.dart';
import '../logic/overlay.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_button.dart';
import 'i_icon.dart';

/// 新手引导。
///
/// 目标用 GlobalKey 指定而不是选择器字符串：Flutter 里没有选择器，
/// 硬造一套「名字 → 元素」的注册表只会多出一处可能失配的地方。
class ITourTarget {
  const ITourTarget({
    required this.key,
    required this.title,
    required this.description,
    this.placement = IPlacement.bottom,
  });

  final GlobalKey key;
  final String title;
  final String description;
  final IPlacement placement;
}

class ITour extends StatelessWidget {
  const ITour({
    super.key,
    required this.targets,
    required this.index,
    this.onIndexChanged,
    this.padding = 6,
    this.onFinish,
    this.onSkip,
  });

  final List<ITourTarget> targets;

  /// 当前步；-1 表示不显示
  final int index;
  final ValueChanged<int>? onIndexChanged;

  /// 高亮框向外扩多少
  final double padding;
  final VoidCallback? onFinish;
  final VoidCallback? onSkip;

  void _next() {
    final target = tourNext(index, targets.length);
    onIndexChanged?.call(target);
    // 到末步返回 -1 而不是停住：停在末步时按钮点下去没有任何变化，
    // 用户不知道是走完了还是卡住了
    if (target == -1) onFinish?.call();
  }

  void _prev() => onIndexChanged?.call(tourPrev(index));

  void _skip() {
    onIndexChanged?.call(-1);
    onSkip?.call();
  }

  @override
  Widget build(BuildContext context) {
    if (index < 0 || index >= targets.length) return const SizedBox.shrink();
    final step = targets[index];
    final c = iColorsOf(context);
    final screen = MediaQuery.sizeOf(context);

    // 目标不存在（页面还没渲染到那一块）：不画洞，气泡居中，引导仍然能走完
    final box = step.key.currentContext?.findRenderObject() as RenderBox?;
    ITourHole? hole;
    if (box != null && box.hasSize) {
      final origin = box.localToGlobal(Offset.zero);
      hole = tourHole(origin & box.size, padding: padding);
    }

    return Stack(
      children: [
        // 遮罩挖洞用 BlendMode.dstOut：四条挡板拼出来的洞对不上圆角，
        // 目标是圆角按钮时四个角会漏出暗色的直角，很显眼
        Positioned.fill(
          child: GestureDetector(
            onTap: _skip,
            child: ColorFiltered(
              colorFilter: const ColorFilter.mode(Colors.black54, BlendMode.srcOut),
              child: Stack(
                children: [
                  Positioned.fill(
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Colors.black,
                        backgroundBlendMode: BlendMode.dstOut,
                      ),
                    ),
                  ),
                  if (hole != null)
                    Positioned(
                      left: hole.x,
                      top: hole.y,
                      width: hole.width,
                      height: hole.height,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.black,
                          borderRadius: BorderRadius.circular(hole.radius),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),

        // 高亮框再描一圈：只挖洞的话，浅色背景上洞与页面几乎看不出边界
        if (hole != null)
          Positioned(
            left: hole.x,
            top: hole.y,
            width: hole.width,
            height: hole.height,
            child: IgnorePointer(
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: c.brand, width: 2),
                  borderRadius: BorderRadius.circular(hole.radius),
                ),
              ),
            ),
          ),

        _popup(context, c, step, hole, screen),
      ],
    );
  }

  Widget _popup(
    BuildContext context,
    IColors c,
    ITourTarget step,
    ITourHole? hole,
    Size screen,
  ) {
    const width = 300.0;
    const estimated = 168.0;

    double left = (screen.width - width) / 2;
    double top = (screen.height - estimated) / 2;
    if (hole != null) {
      final resolved = resolveOverlay(
        trigger: IOverlayRect(hole.x, hole.y, hole.width, hole.height),
        popup: const IOverlayRect(0, 0, width, estimated),
        viewport: IOverlayRect(0, 0, screen.width, screen.height),
        placement: step.placement,
        offset: padding + 10,
      );
      left = resolved.x;
      top = resolved.y;
    }

    return Positioned(
      left: left,
      top: top,
      width: width,
      child: Material(
        color: c.bgElevated,
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
        elevation: 8,
        child: Padding(
          padding: const EdgeInsets.all(IDesignTokensLight.spacing4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      step.title,
                      style: TextStyle(
                        color: c.text,
                        fontSize: IDesignTokensLight.fontSizeMd,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: _skip,
                    child: IIcon('close', size: 14, semanticLabel: '跳过引导', color: c.textTertiary),
                  ),
                ],
              ),
              const SizedBox(height: IDesignTokensLight.spacing2),
              Text(
                step.description,
                style: TextStyle(
                  color: c.textSecondary,
                  fontSize: IDesignTokensLight.fontSizeSm,
                  height: 1.7,
                ),
              ),
              const SizedBox(height: IDesignTokensLight.spacing4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // 进度写成「2 / 5」而不是画一排点：引导通常不长，数字比点更省认知
                  Text(
                    '${index + 1} / ${targets.length}',
                    style: TextStyle(
                      color: c.textTertiary,
                      fontSize: IDesignTokensLight.fontSizeXs,
                    ),
                  ),
                  Row(
                    children: [
                      if (index > 0)
                        IButton(
                          child: const Text('上一步'),
                          size: IButtonSize.sm,
                          variant: IButtonVariant.text,
                          onPressed: _prev,
                        ),
                      const SizedBox(width: IDesignTokensLight.spacing2),
                      IButton(
                        child: Text(index == targets.length - 1 ? '我知道了' : '下一步'),
                        size: IButtonSize.sm,
                        variant: IButtonVariant.primary,
                        onPressed: _next,
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
