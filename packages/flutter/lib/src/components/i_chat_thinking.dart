import 'package:flutter/material.dart';
import '../logic/thinking.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_config_provider.dart';
import 'i_icon.dart';
import 'i_loading.dart';

/// 推理过程，默认折叠。
///
/// 折叠是有意的：推理过程对排查问题很有用，但它不是答案。
/// 展开后用更小的字号与次级文字色，明确它从属于回答。
class IChatThinking extends StatefulWidget {
  const IChatThinking({
    super.key,
    required this.child,
    this.label = '',
    this.duration = '',
    this.pending = false,
    this.defaultOpen = false,
    this.steps = const [],
  });

  final Widget child;

  /// 标题。不传走字典里的「推理过程」——写死中文的话，换成英文字典后
  /// 这里会是整块界面里唯一还说中文的地方
  final String label;

  /// 推理耗时的展示文案，如「思考了 12 秒」
  final String duration;

  /// 仍在推理中：标题旁的点持续呼吸
  final bool pending;
  final bool defaultOpen;

  /// 分步轨迹。给了就按步展示，每步可单独展开；不给则仍是 child 那一整段文字
  final List<IThinkingStep> steps;

  @override
  State<IChatThinking> createState() => _IChatThinkingState();
}

class _IChatThinkingState extends State<IChatThinking> {
  late bool _open = widget.defaultOpen;
  late List<String> _openSteps = defaultOpenSteps(widget.steps);

  @override
  void didUpdateWidget(IChatThinking old) {
    super.didUpdateWidget(old);
    // 步骤换了一批就重算默认展开：出错的那步是新出现的，用户此刻要看的正是它
    final changed = old.steps.length != widget.steps.length ||
        [for (var i = 0; i < widget.steps.length; i++) old.steps[i].status != widget.steps[i].status]
            .contains(true);
    if (changed) _openSteps = defaultOpenSteps(widget.steps);
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final locale = IConfigProvider.localeOf(context);
    final summary = summarizeThinking(widget.steps);
    // 折叠时把进度顶在标题上：折叠不该连「走到第几步」一起藏掉
    final progress = summary.total > 0 ? '${summary.activeIndex + 1}/${summary.total}' : '';

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
                      widget.label.isEmpty ? locale.thinking : widget.label,
                      style: TextStyle(
                        color: c.textSecondary,
                        fontSize: IDesignTokensLight.fontSizeSm,
                      ),
                    ),
                  ),
                  if (progress.isNotEmpty) ...[
                    Text(
                      progress,
                      style: TextStyle(
                        color: c.textTertiary,
                        fontSize: IDesignTokensLight.fontSizeXs,
                      ),
                    ),
                    const SizedBox(width: IDesignTokensLight.spacing2),
                  ],
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
                child: widget.steps.isEmpty ? widget.child : _steps(c),
              ),
            ),
        ],
      ),
    );
  }

  /// 左边一条细竖线把几步串起来：它们是一条按顺序走的路径，不是并列的清单。
  /// 这条线是结构，不是状态标记——每一步的状态在图标与文字上，不在线上。
  Widget _steps(IColors c) => Container(
        padding: const EdgeInsets.only(left: IDesignTokensLight.spacing3),
        decoration: BoxDecoration(
          border: Border(left: BorderSide(color: c.hairline)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [for (final step in widget.steps) _step(c, step)],
        ),
      );

  Widget _step(IColors c, IThinkingStep step) {
    final open = _openSteps.contains(step.key);
    final (fg, bg) = switch (step.status) {
      IThinkingStepStatus.error => (c.danger, c.dangerSubtle),
      IThinkingStepStatus.running => (c.brand, c.brandSubtle),
      IThinkingStepStatus.done => (c.textTertiary, c.bg),
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          // 没有细节可看的那几步不该显得能点
          onTap: step.detail == null
              ? null
              : () => setState(() => _openSteps = toggleThinkingStep(_openSteps, step.key)),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: IDesignTokensLight.spacing1),
            child: Row(
              children: [
                // 图标压在路径上：它标的就是「走到这一步」
                Transform.translate(
                  offset: const Offset(-IDesignTokensLight.spacing3 - 10, 0),
                  child: Container(
                    width: 20,
                    height: 20,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
                    child: step.status == IThinkingStepStatus.running
                        ? const ILoading(size: ISize.sm)
                        : IIcon(thinkingStepIcon(step.kind), size: 13, color: fg),
                  ),
                ),
                Expanded(
                  child: Transform.translate(
                    offset: const Offset(-IDesignTokensLight.spacing3 + 2, 0),
                    child: Text(
                      step.title,
                      style: TextStyle(
                        color: c.textSecondary,
                        fontSize: IDesignTokensLight.fontSizeSm,
                      ),
                    ),
                  ),
                ),
                if (step.detail != null)
                  AnimatedRotation(
                    turns: open ? 0.25 : 0,
                    duration: const Duration(milliseconds: 150),
                    child: IIcon('chevron-right', size: 12, color: c.textTertiary),
                  ),
              ],
            ),
          ),
        ),
        if (step.detail != null && open)
          Padding(
            padding: const EdgeInsets.only(
              left: IDesignTokensLight.spacing2,
              bottom: IDesignTokensLight.spacing2,
            ),
            child: Text(
              step.detail!,
              style: TextStyle(
                color: c.textTertiary,
                fontSize: IDesignTokensLight.fontSizeSm,
                height: 1.8,
              ),
            ),
          ),
      ],
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
