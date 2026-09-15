import 'dart:async';
import 'dart:ui' show FontFeature;

import 'package:flutter/material.dart';
import '../logic/elapsed.dart';
import '../logic/lifecycle.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_button.dart';
import 'i_icon.dart';

/// 一次运行停在哪儿。
///
/// 出字之前那段静止有好几种原因——在排队、在连接、断了正在重连、在等人点一下。
/// 只转一个圈的话它们长得一模一样，用户没有依据判断该继续等、该重试，
/// 还是该去检查网络。判定走 logic/lifecycle.dart，与 Web 端同一份规则。
class IRunStatus extends StatefulWidget {
  const IRunStatus({
    super.key,
    required this.status,
    this.queuePosition,
    this.connection,
    this.attempt = 0,
    this.retryAt,
    this.startedAt,
    this.cancelText = '取消',
    this.onCancel,
  });

  final IRunPhase status;

  /// 队列里前面还有几个。不给表示服务端没有队列信息，界面就不编一个出来
  final int? queuePosition;
  final IConnectionPhase? connection;

  /// 第几次连接尝试，从 0 起
  final int attempt;

  /// 下一次重试的时刻（毫秒时间戳）
  final int? retryAt;

  /// 这次运行开始等待的时刻。给了才显示「已等 N 秒」
  final int? startedAt;
  final String cancelText;
  final VoidCallback? onCancel;

  @override
  State<IRunStatus> createState() => _IRunStatusState();
}

class _IRunStatusState extends State<IRunStatus> {
  Timer? _timer;
  int _now = DateTime.now().millisecondsSinceEpoch;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  /// 对齐到整秒而不是固定 1000ms：固定间隔会累积漂移，等上两分钟秒数会明显偏慢
  void _schedule() {
    _timer?.cancel();
    _timer = Timer(Duration(milliseconds: elapsedInterval(_now)), () {
      if (!mounted) return;
      setState(() => _now = DateTime.now().millisecondsSinceEpoch);
    });
  }

  String _waitedText(int ms) {
    final parts = elapsedParts(ms);
    return parts.minutes > 0
        ? '已等 ${parts.minutes} 分 ${parts.seconds} 秒'
        : '已等 ${parts.seconds} 秒';
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final notice = describeRun(
      status: widget.status,
      now: _now,
      queuePosition: widget.queuePosition,
      connection: widget.connection,
      attempt: widget.attempt,
      retryAt: widget.retryAt,
      startedAt: widget.startedAt,
    );

    // 只在还没结束时走时钟：终态之后每秒重算一次，除了耗电什么也不做
    if (notice.busy) {
      _schedule();
    } else {
      _timer?.cancel();
    }

    final (ink, tint) = switch (notice.tone) {
      INoticeTone.progress => (c.brand, c.brandSubtle),
      INoticeTone.success => (c.success, c.successSubtle),
      INoticeTone.danger => (c.danger, c.dangerSubtle),
      INoticeTone.neutral => (c.textSecondary, c.bgSubtle),
    };

    final showWaited = widget.startedAt != null && shouldShowElapsed(notice.waited);
    final reduced = MediaQuery.of(context).disableAnimations;

    return Semantics(
      liveRegion: true,
      label: notice.detail.isEmpty ? notice.label : '${notice.label}，${notice.detail}',
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing4,
          vertical: IDesignTokensLight.spacing3,
        ),
        decoration: BoxDecoration(
          color: c.bgElevated,
          border: Border.all(color: c.hairline),
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 28,
              height: 28,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    decoration: BoxDecoration(color: tint, shape: BoxShape.circle),
                  ),
                  IIcon(notice.icon, size: 16, color: ink),
                  /*
                   * 转圈画在图标外圈，而不是把图标换成一个转圈：
                   * 图标说的是「停在哪一步」，转圈说的是「还在动」，两件事都要看得见。
                   * 关了动效就留一整圈淡环，而不是凭空消失。
                   */
                  if (notice.busy)
                    SizedBox(
                      width: 28,
                      height: 28,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        value: reduced ? 1 : null,
                        color: reduced ? ink.withValues(alpha: 0.35) : ink,
                        backgroundColor: Colors.transparent,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: IDesignTokensLight.spacing3),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    notice.label,
                    style: TextStyle(fontSize: IDesignTokensLight.fontSizeMd, color: c.text),
                  ),
                  if (notice.detail.isNotEmpty)
                    Text(
                      notice.detail,
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeSm,
                        color: c.textSecondary,
                      ),
                    ),
                ],
              ),
            ),
            if (showWaited)
              Padding(
                padding: const EdgeInsets.only(right: IDesignTokensLight.spacing3),
                child: Text(
                  _waitedText(notice.waited),
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeSm,
                    color: c.textTertiary,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ),
            if (notice.cancelable)
              IButton(
                size: IButtonSize.sm,
                onPressed: widget.onCancel,
                child: Text(widget.cancelText),
              ),
          ],
        ),
      ),
    );
  }
}
