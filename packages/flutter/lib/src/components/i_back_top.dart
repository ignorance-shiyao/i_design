import 'package:flutter/material.dart';
import '../logic/affix.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 回到顶部。
///
/// 默认滚过一屏才出现：不足一屏时用户自己往回划两下就到顶了，
/// 这时冒出一个按钮属于帮倒忙——它遮住的内容比它省下的力气多。
class IBackTop extends StatefulWidget {
  const IBackTop({
    super.key,
    required this.controller,
    this.threshold,
    this.duration = const Duration(milliseconds: 320),
  });

  final ScrollController controller;

  /// 滚过多少像素才露出来。不传则用一屏高
  final double? threshold;
  final Duration duration;

  @override
  State<IBackTop> createState() => _IBackTopState();
}

class _IBackTopState extends State<IBackTop> {
  bool _visible = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_check);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_check);
    super.dispose();
  }

  void _check() {
    if (!widget.controller.hasClients) return;
    final position = widget.controller.position;
    final next = shouldShowBackTop(
      position.pixels,
      position.viewportDimension,
      threshold: widget.threshold,
    );
    if (next != _visible) setState(() => _visible = next);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    return AnimatedOpacity(
      opacity: _visible ? 1 : 0,
      duration: const Duration(milliseconds: 200),
      child: IgnorePointer(
        ignoring: !_visible,
        child: GestureDetector(
          onTap: () => widget.controller.animateTo(
            0,
            duration: widget.duration,
            // 与 Web 端同一条缓动：匀速滚动看起来像被拖拽，减速才像「到站」
            curve: Curves.easeOutCubic,
          ),
          child: Semantics(
            button: true,
            label: '回到顶部',
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: c.bgElevated,
                shape: BoxShape.circle,
                border: Border.all(color: c.border),
                boxShadow: const [BoxShadow(blurRadius: 12, color: Color(0x1A141822))],
              ),
              child: Center(child: IIcon('chevron-up', size: 18, color: c.textSecondary)),
            ),
          ),
        ),
      ),
    );
  }
}
