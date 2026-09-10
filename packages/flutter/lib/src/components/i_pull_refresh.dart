import 'package:flutter/material.dart';
import '../logic/pullrefresh.dart';

/// 下拉刷新。
///
/// Flutter 自带 RefreshIndicator，但它的阈值、位移曲线与文案由 Material 规范定，
/// 与其余端对不上：同一个产品在 iOS 上拉 60px 触发、在这里要拉 100px。
/// 因此手势与判定走公共层的 logic/pullrefresh，只有绘制是 Flutter 自己的。
class IPullRefresh extends StatefulWidget {
  const IPullRefresh({
    super.key,
    required this.child,
    required this.onRefresh,
    this.threshold = kPullThreshold,
    this.max = kPullMax,
    this.disabled = false,
  });

  final Widget child;

  /// 刷新逻辑由调用方给出；Future 完成即视为刷新结束——
  /// 组件不猜什么时候算刷新完了
  final Future<void> Function() onRefresh;

  /// 拉到这里松手才刷新
  final double threshold;

  /// 最多能拉这么远
  final double max;
  final bool disabled;

  @override
  State<IPullRefresh> createState() => _IPullRefreshState();
}

class _IPullRefreshState extends State<IPullRefresh> {
  double _distance = 0;
  IPullStatus _status = IPullStatus.idle;
  double _startY = 0;
  bool _pulling = false;
  bool _atTop = true;

  /// 只在列表已经滚到顶部时才接管手势。
  /// 不判断的话，用户在列表中间往下滑会被下拉刷新吃掉：
  /// 列表不动、顶上却冒出提示，看起来像卡住了。
  bool _onScrollNotification(ScrollNotification notification) {
    if (notification.depth == 0) _atTop = notification.metrics.pixels <= 0;
    return false;
  }

  void _onStart(DragStartDetails details) {
    if (widget.disabled || _status == IPullStatus.refreshing || !_atTop) return;
    _pulling = true;
    _startY = details.globalPosition.dy;
  }

  void _onUpdate(DragUpdateDetails details) {
    if (!_pulling) return;
    final delta = details.globalPosition.dy - _startY;
    if (delta <= 0) {
      // 反向滑动交还给列表：这时用户是想往下看，不是想刷新
      _pulling = false;
      setState(() {
        _distance = 0;
        _status = IPullStatus.idle;
      });
      return;
    }
    final next = pullDistance(delta, max: widget.max);
    setState(() {
      _distance = next;
      _status = pullStatus(next, threshold: widget.threshold);
    });
  }

  Future<void> _onEnd(DragEndDetails details) async {
    if (!_pulling) return;
    _pulling = false;
    if (!shouldRefresh(_distance, threshold: widget.threshold)) {
      setState(() {
        _distance = 0;
        _status = IPullStatus.idle;
      });
      return;
    }
    // 停在阈值处而不是收回零：收回零的话指示器立刻消失，用户会再拉一次
    setState(() {
      _distance = refreshingOffset(threshold: widget.threshold);
      _status = IPullStatus.refreshing;
    });
    await widget.onRefresh();
    if (!mounted) return;
    setState(() => _status = IPullStatus.done);
    await Future<void>.delayed(const Duration(milliseconds: 300));
    if (!mounted) return;
    setState(() {
      _distance = 0;
      _status = IPullStatus.idle;
    });
  }

  @override
  Widget build(BuildContext context) {
    final hint = pullHint(_status);
    final theme = Theme.of(context);
    return NotificationListener<ScrollNotification>(
      onNotification: _onScrollNotification,
      child: GestureDetector(
        onVerticalDragStart: _onStart,
        onVerticalDragUpdate: _onUpdate,
        onVerticalDragEnd: _onEnd,
        child: ClipRect(
          child: Stack(
            children: <Widget>[
              // 提示区留在内容下方，靠内容位移露出来，而不是插进布局。
              // 插进来的话，刷新开始那一刻列表会整块往下跳一次。
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                height: widget.threshold,
                child: Semantics(
                  liveRegion: true,
                  child: Center(
                    child: _status == IPullStatus.refreshing
                        ? Row(
                            mainAxisSize: MainAxisSize.min,
                            children: <Widget>[
                              const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                              const SizedBox(width: 8),
                              Text(hint, style: theme.textTheme.bodySmall),
                            ],
                          )
                        : Text(hint, style: theme.textTheme.bodySmall),
                  ),
                ),
              ),
              AnimatedContainer(
                // 拖动中不做过渡，松手回弹才做：带着过渡拖，手感是黏的
                duration: Duration(milliseconds: _pulling ? 0 : 200),
                curve: Curves.easeOut,
                transform: Matrix4.translationValues(0, _distance, 0),
                child: widget.child,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
