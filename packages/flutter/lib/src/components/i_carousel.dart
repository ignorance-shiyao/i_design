import 'dart:async';

import 'package:flutter/material.dart';
import '../logic/carousel.dart' as logic;
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

class ICarouselItem {
  const ICarouselItem({required this.key, this.label = ''});
  final String key;
  final String label;
}

/// 走马灯（移动端也叫 Swiper）。
///
/// 轨道整条平移，而不是逐张淡入淡出：平移能让人看出「下一张从右边来」，
/// 方向感是这个组件比一排卡片多出来的唯一信息。
class ICarousel extends StatefulWidget {
  const ICarousel({
    super.key,
    required this.items,
    this.builder,
    this.index,
    this.onIndexChanged,
    this.interval = Duration.zero,
    this.loop = true,
    this.height = 200,
    this.maxDots = 7,
    this.arrows = false,
  });

  final List<ICarouselItem> items;
  final Widget Function(BuildContext context, ICarouselItem item, int index)? builder;
  final int? index;
  final ValueChanged<int>? onIndexChanged;

  /// 自动播放间隔；Duration.zero 表示不自动播放
  final Duration interval;
  final bool loop;
  final double height;

  /// 指示点最多显示几个，超出就只显示当前页附近的一段
  final int maxDots;

  /// 触摸端默认关掉箭头：手势本身已经够用，箭头只会一直挡住图片两侧
  final bool arrows;

  @override
  State<ICarousel> createState() => _ICarouselState();
}

class _ICarouselState extends State<ICarousel> {
  int _uncontrolled = 0;
  double _width = 0;
  double _dragDx = 0;
  int? _dragStartMs;
  Timer? _timer;

  int get _index => widget.index ?? _uncontrolled;
  int get _count => widget.items.length;
  bool get _dragging => _dragStartMs != null;

  @override
  void initState() {
    super.initState();
    _schedule();
  }

  @override
  void didUpdateWidget(ICarousel old) {
    super.didUpdateWidget(old);
    if (old.interval != widget.interval || old.items.length != widget.items.length) _schedule();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _setIndex(int next) {
    setState(() => _uncontrolled = next);
    widget.onIndexChanged?.call(next);
    _schedule();
  }

  void _go(int delta) => _setIndex(logic.nextIndex(_index, _count, delta, loop: widget.loop));

  /*
   * 一次性的 Timer 而不是 Timer.periodic：
   * periodic 在页面卡顿后会把攒下的几次一起补发，画面会连翻好几张。
   */
  void _schedule() {
    _timer?.cancel();
    final reduced = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    final playing = logic.shouldAutoplay(
      enabled: widget.interval > Duration.zero,
      count: _count,
      dragging: _dragging,
      reducedMotion: reduced,
    );
    if (!playing) return;
    _timer = Timer(widget.interval, () => _go(1));
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final dots = logic.dotRange(_index, _count, max: widget.maxDots);
    final offset = logic.rubberBand(
      logic.trackOffset(_index, _dragDx, _width == 0 ? 1 : _width),
      _count,
      loop: widget.loop,
    );
    final atStart = !widget.loop && _index == 0;
    final atEnd = !widget.loop && _index == _count - 1;

    return LayoutBuilder(
      builder: (context, constraints) {
        _width = constraints.maxWidth;
        return SizedBox(
          height: widget.height,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
            child: Stack(
              children: [
                GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onHorizontalDragStart: (_) {
                    if (_count <= 1) return;
                    setState(() {
                      _dragStartMs = DateTime.now().millisecondsSinceEpoch;
                      _dragDx = 0;
                    });
                    _schedule();
                  },
                  onHorizontalDragUpdate: (d) {
                    if (!_dragging) return;
                    setState(() => _dragDx += d.delta.dx);
                  },
                  onHorizontalDragEnd: (_) {
                    if (!_dragging) return;
                    // 位移与速度任一达标就翻页：只看位移会把最自然的短促轻扫判成「没划够」
                    final elapsed =
                        (DateTime.now().millisecondsSinceEpoch - _dragStartMs!).toDouble();
                    final direction = logic.resolveSwipe(_dragDx, _width, elapsed);
                    setState(() {
                      _dragStartMs = null;
                      _dragDx = 0;
                    });
                    if (direction != 0) _go(direction);
                    else _schedule();
                  },
                  child: Container(
                    color: c.bgSubtle,
                    // 拖动中不给动画：留着过渡的话每一帧都在追赶手指，看起来像有延迟
                    child: _dragging
                        ? _track(context, offset, constraints.maxWidth)
                        : AnimatedSlide(
                            offset: Offset(-offset, 0),
                            duration: const Duration(milliseconds: 280),
                            curve: Curves.easeOut,
                            child: _slides(context, constraints.maxWidth),
                          ),
                  ),
                ),

                if (widget.arrows && _count > 1) ...[
                  _arrow(c, 'chevron-left', '上一张', atStart, () => _go(-1), left: true),
                  _arrow(c, 'chevron-right', '下一张', atEnd, () => _go(1), left: false),
                ],

                if (_count > 1)
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: IDesignTokensLight.spacing3,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        for (final dot in dots.items)
                          Semantics(
                            label: '第 ${dot + 1} 张，共 $_count 张',
                            selected: dot == dots.active,
                            button: true,
                            child: GestureDetector(
                              onTap: () => _setIndex(dot),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 160),
                                margin: const EdgeInsets.symmetric(
                                  horizontal: IDesignTokensLight.spacing1,
                                ),
                                // 当前页拉长而不是只变色：色觉障碍或灰度打印下形状差异仍读得出来
                                width: dot == dots.active ? 18 : 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: dot == dots.active
                                      ? c.onMedia
                                      : c.onMedia.withValues(alpha: 0.55),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _track(BuildContext context, double offset, double width) => Transform.translate(
        offset: Offset(-offset * width, 0),
        child: _slides(context, width),
      );

  Widget _slides(BuildContext context, double width) => OverflowBox(
        alignment: Alignment.centerLeft,
        maxWidth: width * (_count == 0 ? 1 : _count),
        child: Row(
          children: [
            for (var i = 0; i < _count; i++)
              SizedBox(
                width: width,
                height: widget.height,
                child: Semantics(
                  label: widget.items[i].label.isEmpty ? '第 ${i + 1} 张' : widget.items[i].label,
                  child: widget.builder?.call(context, widget.items[i], i) ??
                      Center(
                        child: Text(
                          widget.items[i].label,
                          style: TextStyle(
                            color: iColorsOf(context).textSecondary,
                            fontSize: IDesignTokensLight.fontSizeMd,
                          ),
                        ),
                      ),
                ),
              ),
          ],
        ),
      );

  Widget _arrow(
    IColors c,
    String icon,
    String label,
    bool disabled,
    VoidCallback onTap, {
    required bool left,
  }) =>
      Positioned(
        left: left ? IDesignTokensLight.spacing3 : null,
        right: left ? null : IDesignTokensLight.spacing3,
        top: 0,
        bottom: 0,
        child: Center(
          child: Opacity(
            // 到头的箭头隐藏而不是变灰：一个点不动的灰按钮更容易被反复点
            opacity: disabled ? 0 : 1,
            child: GestureDetector(
              onTap: disabled ? null : onTap,
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  // 半透明底而不是实心：压在图片上时实心块会挖掉一角内容
                  color: c.bgElevated.withValues(alpha: 0.82),
                  shape: BoxShape.circle,
                ),
                child: Center(child: IIcon(icon, size: 16, semanticLabel: label)),
              ),
            ),
          ),
        ),
      );
}
