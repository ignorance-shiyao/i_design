import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

enum ISkeletonVariant { text, paragraph, card, list, avatar }

/// 骨架屏：在内容到达前占住它将要出现的位置。
///
/// 与 ILoading 的分工：区域里结构已知时用骨架屏，它能避免内容到达时的布局跳动；
/// 结构未知或等待很短时用加载指示器。
class ISkeleton extends StatefulWidget {
  const ISkeleton({
    super.key,
    this.child,
    this.loading = true,
    this.variant = ISkeletonVariant.paragraph,
    this.rows = 3,
    this.animated = true,
  });

  final Widget? child;
  final bool loading;
  final ISkeletonVariant variant;
  final int rows;
  final bool animated;

  @override
  State<ISkeleton> createState() => _ISkeletonState();
}

class _ISkeletonState extends State<ISkeleton> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  );

  @override
  void initState() {
    super.initState();
    if (widget.animated) _controller.repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Widget _bar(IColors c, {double? width, double height = 14}) => Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: c.bgMuted,
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        ),
      );

  @override
  Widget build(BuildContext context) {
    if (!widget.loading) return widget.child ?? const SizedBox.shrink();
    final c = iColorsOf(context);

    final children = switch (widget.variant) {
      ISkeletonVariant.text => [_bar(c, width: 120)],
      ISkeletonVariant.paragraph => List.generate(
          widget.rows,
          // 末行更短，视觉上更接近真实段落
          (i) => Padding(
            padding: const EdgeInsets.only(bottom: IDesignTokensLight.spacing3),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: i == widget.rows - 1 ? 0.62 : 1,
              child: _bar(c),
            ),
          ),
        ),
      ISkeletonVariant.avatar => [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(color: c.bgMuted, shape: BoxShape.circle),
              ),
              const SizedBox(width: IDesignTokensLight.spacing3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _bar(c, width: 120),
                    const SizedBox(height: IDesignTokensLight.spacing2),
                    _bar(c, width: 180, height: 10),
                  ],
                ),
              ),
            ],
          ),
        ],
      ISkeletonVariant.list => List.generate(
          widget.rows,
          (_) => Padding(
            padding: const EdgeInsets.only(bottom: IDesignTokensLight.spacing3),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(color: c.bgMuted, shape: BoxShape.circle),
                ),
                const SizedBox(width: IDesignTokensLight.spacing3),
                Expanded(child: _bar(c)),
              ],
            ),
          ),
        ),
      ISkeletonVariant.card => [
          Container(
            height: 120,
            decoration: BoxDecoration(
              color: c.bgMuted,
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
            ),
          ),
          const SizedBox(height: IDesignTokensLight.spacing3),
          _bar(c, width: 160),
        ],
    };

    final content = Column(crossAxisAlignment: CrossAxisAlignment.start, children: children);
    if (!widget.animated) return content;

    // 微光扫过而非整体闪烁——闪烁在长列表里会形成密集的明暗跳动
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) => Opacity(
        opacity: 0.65 + 0.35 * (0.5 - (0.5 - _controller.value).abs()) * 2,
        child: child,
      ),
      child: content,
    );
  }
}
