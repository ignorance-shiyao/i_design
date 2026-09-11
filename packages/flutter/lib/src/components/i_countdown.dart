import 'dart:async';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import '../logic/countdown.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

enum ICountdownTone { normal, brand, success, danger }

/// 倒计时。
///
/// 每一跳都从绝对截止时刻重算，而不是把上一次的值减掉一个间隔：
/// 后者每跳都会积累几毫秒误差，挂一晚上能差出好几秒；应用被切到后台时
/// 定时器还会被系统压慢，回来就直接错了。
/// 取整与格式化规则在 logic/countdown，与 Web 端共用同一套。
class ICountdown extends StatefulWidget {
  const ICountdown({
    super.key,
    required this.value,
    this.format = 'HH:mm:ss',
    this.title = '',
    this.prefix = '',
    this.suffix = '',
    this.tone = ICountdownTone.normal,
    this.compact = false,
    this.running = true,
    this.onChange,
    this.onFinish,
  });

  /// 截止时刻的时间戳（毫秒）
  final int value;

  /// 模板：DD / HH / mm / ss / SSS，小写单字母不补零
  final String format;
  final String title;
  final String prefix;
  final String suffix;
  final ICountdownTone tone;

  /// 略小一号，用于密集的指标卡
  final bool compact;

  /// 暂停。重新打开时走的仍是绝对时刻，不会「补回」暂停期间的时间
  final bool running;
  final ValueChanged<int>? onChange;
  final VoidCallback? onFinish;

  @override
  State<ICountdown> createState() => _ICountdownState();
}

class _ICountdownState extends State<ICountdown> {
  Timer? _timer;
  late int _remaining = _read();

  int _read() => countdownRemaining(widget.value, DateTime.now().millisecondsSinceEpoch);

  @override
  void initState() {
    super.initState();
    _restart();
  }

  @override
  void didUpdateWidget(ICountdown old) {
    super.didUpdateWidget(old);
    if (old.value != widget.value ||
        old.running != widget.running ||
        old.format != widget.format) {
      _restart();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _restart() {
    _timer?.cancel();
    _timer = null;
    final left = _read();
    setState(() => _remaining = left);
    if (!widget.running || left <= 0) return;
    _schedule(left);
  }

  /// 每次只排下一跳，间隔对齐到下一个整单位边界——固定 1000ms 会累积漂移，
  /// 一秒刷一次、每次晚几毫秒，几分钟后显示的秒数就跳格了。
  void _schedule(int left) {
    _timer = Timer(
      Duration(milliseconds: countdownInterval(left, widget.format.contains('S'))),
      _tick,
    );
  }

  void _tick() {
    final left = _read();
    final wasRunning = _remaining > 0;
    setState(() => _remaining = left);
    widget.onChange?.call(left);
    if (left <= 0) {
      _timer?.cancel();
      _timer = null;
      // 只在真正走到零的那一次回调：截止时刻早已过去时不该触发，
      // 否则重建一次就把「结束」的副作用再跑一遍
      if (wasRunning) widget.onFinish?.call();
      return;
    }
    _schedule(left);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final finished = _remaining <= 0;
    final color = finished
        ? c.textTertiary
        : switch (widget.tone) {
            ICountdownTone.normal => c.text,
            ICountdownTone.brand => c.brand,
            ICountdownTone.success => c.success,
            ICountdownTone.danger => c.danger,
          };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (widget.title.isNotEmpty) ...[
          Text(
            widget.title,
            style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeSm),
          ),
          const SizedBox(height: IDesignTokensLight.spacing2),
        ],
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.prefix.isNotEmpty) _affix(widget.prefix, c),
            Text(
              formatCountdown(_remaining, widget.format),
              style: TextStyle(
                color: color,
                fontSize: widget.compact
                    ? IDesignTokensLight.fontSize2xl
                    : IDesignTokensLight.fontSize3xl,
                fontWeight: FontWeight.w600,
                height: 1.2,
                // 秒位每秒都在变，比例数位会让整行字左右抖动
                fontFeatures: const [ui.FontFeature.tabularFigures()],
              ),
            ),
            if (widget.suffix.isNotEmpty) _affix(widget.suffix, c),
          ],
        ),
      ],
    );
  }

  Widget _affix(String text, IColors c) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing1),
        child: Text(
          text,
          style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeLg),
        ),
      );
}
