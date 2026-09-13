import 'dart:async';

import 'package:flutter/material.dart';
import '../logic/screen.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';
import 'i_loading.dart';

/// 智能体屏幕：看着智能体操作一块屏幕。
///
/// 这件事有一个不明显的难点：**一张静止的画面，看起来和一张卡住的画面
/// 一模一样。** 智能体在想事情、网络断了、进程挂了——三种情况下画面都不动，
/// 而用户只能干等。所以这个组件真正花力气的地方不是画面本身，
/// 是围着画面的那几行字：现在在做什么、画面是什么时候的、还能不能插手。
class IAgentScreen extends StatefulWidget {
  const IAgentScreen({
    super.key,
    this.state = AgentScreenState.connecting,
    this.action = '',
    this.frame,
    this.updatedAt = 0,
    this.frameWidth,
    this.frameHeight,
    this.title = '智能体屏幕',
    this.onTakeOver,
  });

  final AgentScreenState state;

  /// 当前在做什么。有它就显示它——「工作中」三个字没有信息量
  final String action;

  /// 当前画面。没有时显示占位，框的大小不变
  final ImageProvider? frame;

  /// 画面的时间戳（毫秒）
  final int updatedAt;
  final double? frameWidth;
  final double? frameHeight;
  final String title;
  final VoidCallback? onTakeOver;

  @override
  State<IAgentScreen> createState() => _IAgentScreenState();
}

class _IAgentScreenState extends State<IAgentScreen> {
  Timer? _timer;
  int _now = DateTime.now().millisecondsSinceEpoch;

  @override
  void initState() {
    super.initState();
    // 自己走一个秒表：画面的时间戳不变，但「几秒前」得一直往前走
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now().millisecondsSinceEpoch);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final status = screenStatusText(widget.state, widget.action);
    final age = widget.updatedAt == 0 ? '' : frameAge(_now, widget.updatedAt);
    final stale =
        widget.updatedAt != 0 && frameStale(_now, widget.updatedAt, widget.state);
    final busy = widget.state == AgentScreenState.connecting ||
        widget.state == AgentScreenState.working;

    final statusColor = switch (widget.state) {
      AgentScreenState.error => c.danger,
      AgentScreenState.done => c.success,
      _ => c.text,
    };

    return Container(
      padding: const EdgeInsets.all(IDesignTokensLight.spacing3),
      decoration: BoxDecoration(
        color: c.bgElevated,
        // 四边等宽的发丝线：现在什么状态由图标与文字说，不靠加粗某一边
        border: Border.all(color: c.hairline),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // 连接中与操作中用转圈，其余用图标：转圈本身就说明「还在动」
              if (busy)
                const ILoading(size: ISize.sm)
              else
                IIcon(name: screenStatusIcon(widget.state), size: 14, color: statusColor),
              const SizedBox(width: IDesignTokensLight.spacing1),
              Expanded(
                child: Text(
                  status,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: statusColor, fontSize: IDesignTokensLight.fontSizeSm),
                ),
              ),
              // 画面的时间戳：不写出来，用户会把一次卡死当成智能体在思考
              if (age.isNotEmpty) ...[
                if (stale) ...[
                  IIcon(name: 'warning-triangle', size: 12, color: c.warning),
                  const SizedBox(width: IDesignTokensLight.spacing1),
                ],
                Text(
                  age,
                  style: TextStyle(
                    color: stale ? c.warning : c.textTertiary,
                    fontSize: IDesignTokensLight.fontSizeXs,
                  ),
                ),
                const SizedBox(width: IDesignTokensLight.spacing2),
              ],
              _takeOverButton(c),
            ],
          ),
          const SizedBox(height: IDesignTokensLight.spacing2),
          AspectRatio(
            aspectRatio: screenAspect(widget.frameWidth, widget.frameHeight),
            child: Container(
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                color: c.bgSubtle,
                border: Border.all(color: c.hairline),
                borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
              ),
              child: Stack(
                children: [
                  Positioned.fill(
                    child: widget.frame != null
                        ? Image(image: widget.frame!, fit: BoxFit.contain)
                        // 没有画面时占位，框的大小不变——大小一变，连上那一刻整页就跳了
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              if (widget.state == AgentScreenState.connecting)
                                const ILoading(size: ISize.md)
                              else
                                IIcon(
                                  name: screenStatusIcon(widget.state),
                                  size: 20,
                                  color: c.textTertiary,
                                ),
                              const SizedBox(height: IDesignTokensLight.spacing2),
                              Text(
                                status,
                                style: TextStyle(
                                  color: c.textTertiary,
                                  fontSize: IDesignTokensLight.fontSizeSm,
                                ),
                              ),
                            ],
                          ),
                  ),
                  // 卡住的提醒压在画面上：用户此刻正看着画面，挤在头部容易被略过
                  if (stale)
                    Positioned(
                      left: IDesignTokensLight.spacing2,
                      right: IDesignTokensLight.spacing2,
                      bottom: IDesignTokensLight.spacing2,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: IDesignTokensLight.spacing2,
                          vertical: IDesignTokensLight.spacing1,
                        ),
                        decoration: BoxDecoration(
                          // 纯色底，不用渐变：这是一个控件的底色，不是氛围
                          color: c.warningSubtle,
                          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            IIcon(name: 'warning-triangle', size: 14, color: c.warning),
                            const SizedBox(width: IDesignTokensLight.spacing1),
                            Flexible(
                              child: Text(
                                frameStaleText(_now, widget.updatedAt),
                                style: TextStyle(
                                  color: c.warning,
                                  fontSize: IDesignTokensLight.fontSizeXs,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// 接不了管时变淡且不可点，不隐藏——按钮消失会让这一行左右跳
  Widget _takeOverButton(IColors c) {
    final enabled = canTakeOver(widget.state);
    return Semantics(
      label: '接管这块屏幕',
      button: true,
      enabled: enabled,
      child: Opacity(
        opacity: enabled ? 1 : 0.4,
        child: GestureDetector(
          onTap: enabled ? widget.onTakeOver : null,
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: IDesignTokensLight.spacing2,
              vertical: 2,
            ),
            decoration: BoxDecoration(
              color: c.bgElevated,
              border: Border.all(color: c.hairline),
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IIcon(name: 'user', size: 13, color: c.textSecondary),
                const SizedBox(width: IDesignTokensLight.spacing1),
                Text(
                  '接管',
                  style: TextStyle(
                    color: c.textSecondary,
                    fontSize: IDesignTokensLight.fontSizeXs,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
