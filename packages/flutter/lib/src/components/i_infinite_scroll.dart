import 'package:flutter/material.dart';
import '../logic/scroll.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 无限滚动。
///
/// 触发判定走公共层，与 Web、小程序逐条一致：加载中／已加载完／出错时不再触发，
/// 内容没撑满容器时直接触发（否则第一页太短就没有滚动条，永远划不到底）。
class IInfiniteScroll extends StatefulWidget {
  const IInfiniteScroll({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    this.status = LoadStatus.idle,
    this.threshold = kLoadThreshold,
    this.onLoad,
    this.onRetry,
    this.empty = false,
  });

  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final LoadStatus status;

  /// 距底多少像素开始加载
  final double threshold;
  final VoidCallback? onLoad;
  final VoidCallback? onRetry;

  /// 一条都没有时，「没有更多了」要换成「暂无内容」
  final bool empty;

  @override
  State<IInfiniteScroll> createState() => _IInfiniteScrollState();
}

class _IInfiniteScrollState extends State<IInfiniteScroll> {
  final _controller = ScrollController();

  @override
  void initState() {
    super.initState();
    _controller.addListener(_check);
    // 首帧后查一次：第一页可能根本没撑满，那时不会有任何滚动事件
    WidgetsBinding.instance.addPostFrameCallback((_) => _check());
  }

  @override
  void didUpdateWidget(IInfiniteScroll old) {
    super.didUpdateWidget(old);
    // 内容变了要复查：新到的一页如果还是没撑满，仍然一个滚动事件都不会有
    if (old.itemCount != widget.itemCount || old.status != widget.status) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _check());
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _check() {
    if (!_controller.hasClients) return;
    final position = _controller.position;
    final should = shouldLoadMore(
      scrollTop: position.pixels,
      clientHeight: position.viewportDimension,
      // maxScrollExtent 是「还能滚多远」，加上一屏才是内容总高
      scrollHeight: position.maxScrollExtent + position.viewportDimension,
      status: widget.status,
      threshold: widget.threshold,
    );
    if (should) widget.onLoad?.call();
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final hint = loadHint(widget.status, empty: widget.empty);

    return ListView.builder(
      controller: _controller,
      // 多出来的一行是底部状态区。它一直占位，而不是加载时才插进来——
      // 插进来会把列表往上顶一下，用户正在读的那一行会跳走
      itemCount: widget.itemCount + 1,
      itemBuilder: (context, i) {
        if (i < widget.itemCount) return widget.itemBuilder(context, i);
        return Semantics(
          liveRegion: true,
          child: Container(
            alignment: Alignment.center,
            constraints: const BoxConstraints(minHeight: 44),
            padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing3),
            child: switch (widget.status) {
              LoadStatus.loading => Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    const SizedBox(width: IDesignTokensLight.spacing2),
                    Text(hint, style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeSm)),
                  ],
                ),
              LoadStatus.error => GestureDetector(
                  onTap: widget.onRetry,
                  child: Text(
                    hint,
                    style: TextStyle(
                      color: c.brand,
                      fontSize: IDesignTokensLight.fontSizeSm,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              LoadStatus.finished =>
                Text(hint, style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeSm)),
              LoadStatus.idle => const SizedBox.shrink(),
            },
          ),
        );
      },
    );
  }
}
