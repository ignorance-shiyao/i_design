import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 推理过程，默认折叠。
///
/// 折叠是有意的：推理过程对排查问题很有用，但它不是答案。
/// 展开后用更小的字号与次级文字色，明确它从属于回答。
class IChatThinking extends StatefulWidget {
  const IChatThinking({
    super.key,
    required this.child,
    this.label = '推理过程',
    this.duration = '',
    this.pending = false,
    this.defaultOpen = false,
  });

  final Widget child;
  final String label;

  /// 推理耗时的展示文案，如「思考了 12 秒」
  final String duration;

  /// 仍在推理中：标题旁的点持续呼吸
  final bool pending;
  final bool defaultOpen;

  @override
  State<IChatThinking> createState() => _IChatThinkingState();
}

class _IChatThinkingState extends State<IChatThinking> {
  late bool _open = widget.defaultOpen;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);

    return Container(
      decoration: BoxDecoration(
        color: c.bgSubtle,
        border: Border.all(color: c.hairline),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          InkWell(
            onTap: () => setState(() => _open = !_open),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: IDesignTokensLight.spacing3,
                vertical: IDesignTokensLight.spacing2,
              ),
              child: Row(
                children: [
                  if (widget.pending) ...[
                    _Pulse(color: c.brand),
                    const SizedBox(width: IDesignTokensLight.spacing2),
                  ],
                  AnimatedRotation(
                    turns: _open ? 0.25 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: IIcon('chevron-right', size: 14, color: c.textSecondary),
                  ),
                  const SizedBox(width: IDesignTokensLight.spacing2),
                  Expanded(
                    child: Text(
                      widget.label,
                      style: TextStyle(
                        color: c.textSecondary,
                        fontSize: IDesignTokensLight.fontSizeSm,
                      ),
                    ),
                  ),
                  if (widget.duration.isNotEmpty)
                    Text(
                      widget.duration,
                      style: TextStyle(
                        color: c.textTertiary,
                        fontSize: IDesignTokensLight.fontSizeXs,
                      ),
                    ),
                ],
              ),
            ),
          ),
          if (_open)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                IDesignTokensLight.spacing3,
                0,
                IDesignTokensLight.spacing3,
                IDesignTokensLight.spacing3,
              ),
              child: DefaultTextStyle(
                style: TextStyle(
                  color: c.textTertiary,
                  fontSize: IDesignTokensLight.fontSizeSm,
                  height: 1.8,
                ),
                child: widget.child,
              ),
            ),
        ],
      ),
    );
  }
}

class _Pulse extends StatefulWidget {
  const _Pulse({required this.color});

  final Color color;

  @override
  State<_Pulse> createState() => _PulseState();
}

class _PulseState extends State<_Pulse> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduced = MediaQuery.of(context).disableAnimations;
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) => Opacity(
        opacity: reduced ? 1 : 0.25 + 0.75 * _controller.value,
        child: Container(
          width: 6,
          height: 6,
          decoration: BoxDecoration(color: widget.color, shape: BoxShape.circle),
        ),
      ),
    );
  }
}
