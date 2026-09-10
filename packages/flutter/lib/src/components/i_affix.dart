import 'package:flutter/material.dart';
import '../logic/affix.dart';

/// 固钉。
///
/// 判定走公共层，与 Web、小程序同一条阈值。
/// 吸住时内容脱离原位，因此外层要撑出一块等高的占位——
/// 不占位的话下面的内容会整块往上跳一次，而那一跳正好发生在用户滚动时。
class IAffix extends StatefulWidget {
  const IAffix({
    super.key,
    required this.child,
    this.top = 0,
    this.bottom,
    this.controller,
    this.onChanged,
  });

  final Widget child;

  /// 距视口顶部多少像素时吸住
  final double top;

  /// 距视口底部多少像素时吸住。与 top 二选一
  final double? bottom;

  /// 所在的滚动控制器。不传时从最近的 Scrollable 取
  final ScrollController? controller;
  final ValueChanged<bool>? onChanged;

  @override
  State<IAffix> createState() => _IAffixState();
}

class _IAffixState extends State<IAffix> {
  final _key = GlobalKey();
  IAffixState _state = const IAffixState(mode: IAffixMode.none, offset: 0);
  double _placeholder = 0;
  ScrollPosition? _position;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _position?.removeListener(_measure);
    _position = widget.controller?.position ?? Scrollable.maybeOf(context)?.position;
    _position?.addListener(_measure);
    WidgetsBinding.instance.addPostFrameCallback((_) => _measure());
  }

  @override
  void dispose() {
    _position?.removeListener(_measure);
    super.dispose();
  }

  void _measure() {
    final box = _key.currentContext?.findRenderObject() as RenderBox?;
    final position = _position;
    if (box == null || !box.hasSize || position == null) return;

    final next = resolveAffix(
      // 元素在滚动内容里的位置 = 当前屏幕位置 + 已滚过的距离
      offsetTop: box.localToGlobal(Offset.zero).dy + position.pixels,
      height: box.size.height,
      scrollTop: position.pixels,
      viewportHeight: position.viewportDimension,
      top: widget.bottom == null ? widget.top : null,
      bottom: widget.bottom,
    );

    if (next == _state) return;
    if (next.mode != _state.mode) widget.onChanged?.call(next.mode != IAffixMode.none);
    setState(() {
      _state = next;
      _placeholder = next.mode == IAffixMode.none ? 0 : box.size.height;
    });
  }

  @override
  Widget build(BuildContext context) {
    final content = KeyedSubtree(key: _key, child: widget.child);
    if (_state.mode == IAffixMode.none) return content;

    // 吸住后用一块等高的占位顶住原来的位置，浮起的那份交给调用方的 Stack
    return SizedBox(height: _placeholder);
  }

  /// 吸住时应当浮在哪一层。调用方把它放进页面级的 Stack 里
  Widget? floating() {
    if (_state.mode == IAffixMode.none) return null;
    return Positioned(
      top: _state.mode == IAffixMode.top ? _state.offset : null,
      bottom: _state.mode == IAffixMode.bottom ? _state.offset : null,
      left: 0,
      right: 0,
      child: widget.child,
    );
  }
}
