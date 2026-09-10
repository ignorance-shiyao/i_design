import 'package:flutter/material.dart';
import '../logic/indexbar.dart';

/// 索引栏。
///
/// 分组顺序与手指命中都来自 logic/indexbar：「#」排最后、按格命中而非按最近。
/// 这两条各端一旦自己实现就会出现两种表现。
class IIndexBar<T> extends StatefulWidget {
  const IIndexBar({
    super.key,
    required this.items,
    required this.indexOf,
    required this.itemBuilder,
    this.height = 360,
    this.itemHeight = 44,
    this.titleHeight = 28,
  });

  final List<T> items;

  /// 从条目里取出用于分组的字段（通常是拼音首字母）
  final String Function(T) indexOf;
  final Widget Function(BuildContext context, T item) itemBuilder;
  final double height;

  /// 定高才能不量元素直接算每个分组的位置
  final double itemHeight;
  final double titleHeight;

  @override
  State<IIndexBar<T>> createState() => _IIndexBarState<T>();
}

class _IIndexBarState<T> extends State<IIndexBar<T>> {
  final ScrollController _controller = ScrollController();
  final GlobalKey _barKey = GlobalKey();
  int _active = 0;

  /// 手指按在字母条上时才显示的大字提示
  String? _hint;

  late List<IIndexGroup<T>> _groups;
  late List<double> _offsets;

  @override
  void initState() {
    super.initState();
    _rebuild();
    _controller.addListener(_onScroll);
  }

  @override
  void didUpdateWidget(IIndexBar<T> old) {
    super.didUpdateWidget(old);
    if (old.items != widget.items) _rebuild();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _rebuild() {
    _groups = groupByIndex<T>(widget.items, widget.indexOf);
    // 定高，位置直接累加算出来，不必等一帧去量
    var y = 0.0;
    _offsets = _groups.map((g) {
      final at = y;
      y += widget.titleHeight + g.items.length * widget.itemHeight;
      return at;
    }).toList();
  }

  void _onScroll() {
    final next = activeIndex(_offsets, _controller.position.pixels);
    if (next != _active) setState(() => _active = next);
  }

  void _jump(int index) {
    if (index < 0 || index >= _groups.length) return;
    setState(() {
      _active = index;
      _hint = _groups[index].key;
    });
    _controller.jumpTo(
      _offsets[index].clamp(0.0, _controller.position.maxScrollExtent),
    );
  }

  /*
   * 用「落在哪一格」而不是「离哪个字母最近」：
   * 最近判定在两格交界处会来回跳，手指几乎没动、列表却在两个分组之间反复横跳。
   */
  void _onBarTouch(Offset globalPosition) {
    final box = _barKey.currentContext?.findRenderObject() as RenderBox?;
    if (box == null) return;
    final local = box.globalToLocal(globalPosition);
    _jump(indexAt(local.dy, box.size.height, _groups.length));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final rows = <Widget>[];
    for (final group in _groups) {
      rows.add(SizedBox(
        height: widget.titleHeight,
        child: Align(
          alignment: Alignment.centerLeft,
          child: Text(group.key, style: theme.textTheme.labelSmall),
        ),
      ));
      for (final item in group.items) {
        rows.add(SizedBox(
          height: widget.itemHeight,
          child: widget.itemBuilder(context, item),
        ));
      }
    }

    return SizedBox(
      height: widget.height,
      child: Stack(
        children: <Widget>[
          ListView(controller: _controller, children: rows),
          Positioned(
            top: 0,
            bottom: 0,
            right: 0,
            // 字母条对读屏隐藏：它是给手指用的快捷入口，读屏使用者靠分组标题
            // 本身就能导航，把字母再念一遍只会把列表淹掉。
            child: ExcludeSemantics(
              child: GestureDetector(
                onVerticalDragStart: (d) => _onBarTouch(d.globalPosition),
                onVerticalDragUpdate: (d) => _onBarTouch(d.globalPosition),
                onVerticalDragEnd: (_) => setState(() => _hint = null),
                onTapDown: (d) => _onBarTouch(d.globalPosition),
                onTapUp: (_) => setState(() => _hint = null),
                child: Container(
                  key: _barKey,
                  width: 24,
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: <Widget>[
                      for (var i = 0; i < _groups.length; i++)
                        Text(
                          _groups[i].key,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: i == _active
                                ? theme.colorScheme.primary
                                : theme.textTheme.labelSmall?.color,
                            fontWeight: i == _active ? FontWeight.w600 : null,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          // 手指按住时的大字提示：字母条本身太窄，手指正好盖住自己点的那个字母
          if (_hint != null)
            Center(
              child: Container(
                width: 56,
                height: 56,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: theme.colorScheme.inverseSurface.withValues(alpha: 0.8),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _hint!,
                  style: theme.textTheme.headlineSmall
                      ?.copyWith(color: theme.colorScheme.onInverseSurface),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
