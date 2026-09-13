import 'dart:async';

import 'package:flutter/material.dart';
import '../logic/elapsed.dart';
import 'i_config_provider.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

/// 加载指示器。
///
/// 区域加载优先于全屏加载——保留已渲染的内容，用户才知道自己还在原来的位置。
/// 包裹 [child] 时渲染为区域遮罩。
class ILoading extends StatefulWidget {
  const ILoading({
    super.key,
    this.child,
    this.loading = true,
    this.text,
    this.size = ISize.md,
    this.elapsed = false,
  });

  final Widget? child;
  final bool loading;
  final String? text;
  final ISize size;

  /// 显示已等待时长。
  ///
  /// 智能体的一次调用动辄十几秒，只转圈不给数字的话，三秒和三十秒看起来一样，
  /// 于是有人反复点，或者以为卡死了退出重进。
  final bool elapsed;

  @override
  State<ILoading> createState() => _ILoadingState();
}

class _ILoadingState extends State<ILoading> {
  Timer? _timer;
  DateTime? _since;
  int _waited = 0;

  @override
  void initState() {
    super.initState();
    if (widget.loading && widget.elapsed) _start();
  }

  @override
  void didUpdateWidget(ILoading old) {
    super.didUpdateWidget(old);
    final on = widget.loading && widget.elapsed;
    if (on && _timer == null) _start();
    if (!on) _stop();
  }

  @override
  void dispose() {
    _stop();
    super.dispose();
  }

  void _start() {
    _since = DateTime.now();
    _tick();
  }

  void _stop() {
    _timer?.cancel();
    _timer = null;
  }

  /// 按目标时刻反算而不是累加间隔：应用切到后台时定时器会被节流，
  /// 累加的写法回到前台一看会明显偏慢。
  void _tick() {
    final ms = DateTime.now().difference(_since!).inMilliseconds;
    if (mounted) setState(() => _waited = ms);
    _timer = Timer(Duration(milliseconds: elapsedInterval(ms)), _tick);
  }

  double get _diameter => switch (widget.size) {
        ISize.sm => 12.0,
        ISize.md => 18.0,
        ISize.lg => 26.0,
      };

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final locale = IConfigProvider.localeOf(context);
    final parts = elapsedParts(_waited);
    final elapsedText = widget.elapsed && shouldShowElapsed(_waited)
        ? (parts.minutes > 0
            ? '${parts.minutes}${locale.minuteUnit} ${parts.seconds}${locale.secondUnit}'
            : '${parts.seconds}${locale.secondUnit}')
        : null;

    final indicator = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: _diameter,
          height: _diameter,
          child: CircularProgressIndicator(strokeWidth: 2, color: c.brand),
        ),
        if (widget.text != null) ...[
          const SizedBox(width: IDesignTokensLight.spacing2),
          Text(
            widget.text!,
            style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeSm),
          ),
        ],
        if (elapsedText != null) ...[
          const SizedBox(width: IDesignTokensLight.spacing2),
          Text(
            elapsedText,
            style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeXs),
          ),
        ],
      ],
    );

    if (widget.child == null) return indicator;

    return Stack(
      children: [
        widget.child!,
        if (widget.loading)
          Positioned.fill(
            child: ColoredBox(
              color: c.bg.withValues(alpha: 0.72),
              child: Center(child: indicator),
            ),
          ),
      ],
    );
  }
}
