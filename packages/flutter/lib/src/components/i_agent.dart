import 'dart:async';

import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import '../logic/agent.dart';
import '../logic/elapsed.dart';
import 'i_icon.dart';
import 'i_button.dart';

/// 智能体卡片的共同外观：它们都是「插在对话流里的卡片」，
/// 因此用同一种描边与圆角，不各自造一套。
class _AgentCard extends StatelessWidget {
  const _AgentCard({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    return Container(
      padding: const EdgeInsets.all(IDesignTokensLight.spacing4),
      decoration: BoxDecoration(
        color: c.bgElevated,
        border: Border.all(color: c.hairline),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
      ),
      child: child,
    );
  }
}

/// 征求确认：智能体行动前的人类介入。
///
/// 「能否继续」走共享的 canAdvance——填了自由输入也算已回答，
/// 否则用户写完「其他」却发现继续按钮仍是灰的。
class IApprovalCard extends StatefulWidget {
  const IApprovalCard({
    super.key,
    required this.questions,
    this.expiresAt,
    this.version,
    this.currentVersion,
    this.confirmText = '继续',
    this.skipText = '跳过',
    this.renewText = '重新发起',
    this.reviewText = '查看新版本',
    this.onComplete,
    this.onRenew,
    this.onReview,
    this.onClose,
  });

  final List<IApprovalQuestion> questions;

  /// 过期时刻（毫秒时间戳）。不给表示这条确认不过期。
  ///
  /// 这张卡片会在屏幕上待很久——人切到别的应用、锁了屏。回来时那个动作
  /// 可能已经不该再执行了，而卡片长得和刚发出来时一模一样：按钮还亮着。
  final int? expiresAt;

  /// 这条确认是针对哪个版本发出的
  final int? version;

  /// 被确认的东西现在是第几版。与 version 不同就说明前提变了
  final int? currentVersion;
  final String confirmText;
  final String skipText;
  final String renewText;
  final String reviewText;

  /// 全部答完后一次性给出，键为问题 id
  final void Function(Map<String, List<String>>)? onComplete;

  /// 过期了：请调用方重新发起同一次确认
  final VoidCallback? onRenew;

  /// 版本变了：请调用方把新版本摊开给人看，而不是续期旧的
  final VoidCallback? onReview;
  final VoidCallback? onClose;

  @override
  State<IApprovalCard> createState() => _IApprovalCardState();
}

class _IApprovalCardState extends State<IApprovalCard> {
  int _index = 0;
  List<String> _selected = [];
  final TextEditingController _custom = TextEditingController();
  final Map<String, List<String>> _answers = {};

  /*
   * 自己走的时钟，只为倒计时。交给使用方传「还剩几秒」等于要求每个页面
   * 自己开一个定时器，而且各家的进位还会不一样。
   */
  Timer? _timer;
  int _now = DateTime.now().millisecondsSinceEpoch;

  @override
  void dispose() {
    _timer?.cancel();
    _custom.dispose();
    super.dispose();
  }

  /// 只在还剩时间时走表：过期或版本失效之后再跳，除了耗电什么也不做
  void _schedule() {
    _timer?.cancel();
    _timer = Timer(Duration(milliseconds: elapsedInterval(_now)), () {
      if (!mounted) return;
      setState(() => _now = DateTime.now().millisecondsSinceEpoch);
    });
  }

  void _commit(List<String> values) {
    final current = widget.questions[_index];
    _answers[current.id] = values;
    if (_index == widget.questions.length - 1) {
      widget.onComplete?.call(_answers);
    } else {
      setState(() {
        _index += 1;
        _selected = [];
        _custom.clear();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    if (widget.questions.isEmpty) return const SizedBox.shrink();
    final current = widget.questions[_index];
    final gate = approvalGate(
      now: _now,
      expiresAt: widget.expiresAt,
      version: widget.version,
      currentVersion: widget.currentVersion,
    );
    if (gate.state == IApprovalGateState.expiring) {
      _schedule();
    } else {
      _timer?.cancel();
    }
    // 不能拍板时连「下一题」都停掉：翻到最后一题再发现按钮是灰的更让人恼火
    final advanceable = gate.decidable && canAdvance(current, _selected, _custom.text);

    return _AgentCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  current.title,
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeMd,
                    fontWeight: FontWeight.w500,
                    color: c.text,
                  ),
                ),
              ),
              if (widget.onClose != null)
                GestureDetector(
                  onTap: widget.onClose,
                  child: IIcon('close', size: 14, color: c.textTertiary),
                ),
            ],
          ),
          const SizedBox(height: IDesignTokensLight.spacing3),

          /*
           * 失效说明放在选项上方而不是按钮旁边：读者是先看选项再看按钮的，
           * 放在下面等于让他把一遍选项白读了。状态落在图标那一格——
           * 图标形状 + 淡底色块，文字标签永远在，颜色只是第三条线索。
           */
          if (gate.state != IApprovalGateState.open) ...[
            _ApprovalGateNotice(
              gate: gate,
              renewText: widget.renewText,
              reviewText: widget.reviewText,
              onRenew: widget.onRenew,
              onReview: widget.onReview,
            ),
            const SizedBox(height: IDesignTokensLight.spacing3),
          ],

          for (final option in current.options)
            InkWell(
              onTap: gate.decidable
                  ? () => setState(() {
                        _selected = toggleApprovalValue(current, _selected, option.value);
                      })
                  : null,
              borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
              child: Container(
                padding: const EdgeInsets.all(IDesignTokensLight.spacing2),
                decoration: BoxDecoration(
                  color: _selected.contains(option.value) ? c.brandSubtle : null,
                  borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
                ),
                child: Row(
                  children: [
                    IIcon(
                      _selected.contains(option.value)
                          ? 'check-circle'
                          : (current.multiple ? 'plus' : 'info-circle'),
                      size: 16,
                      color: _selected.contains(option.value)
                          ? c.brand
                          : c.textTertiary,
                    ),
                    const SizedBox(width: IDesignTokensLight.spacing2),
                    Text(
                      option.label,
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeMd,
                        color: _selected.contains(option.value) ? c.brand : c.text,
                      ),
                    ),
                    if (option.hint != null) ...[
                      const SizedBox(width: IDesignTokensLight.spacing2),
                      Text(
                        option.hint!,
                        style: TextStyle(
                          fontSize: IDesignTokensLight.fontSizeSm,
                          color: c.textTertiary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

          // 自由输入：预设选项之外总有第三种答案，不给出口只会逼用户随便选一个
          if (current.allowCustom) ...[
            const SizedBox(height: IDesignTokensLight.spacing2),
            TextField(
              controller: _custom,
              enabled: gate.decidable,
              onChanged: (_) => setState(() {}),
              style: TextStyle(
                fontSize: IDesignTokensLight.fontSizeMd,
                color: c.text,
              ),
              decoration: InputDecoration(
                hintText: current.customPlaceholder ?? '其他……',
                isDense: true,
                contentPadding:
                    const EdgeInsets.all(IDesignTokensLight.spacing2),
                border: OutlineInputBorder(
                  borderRadius:
                      BorderRadius.circular(IDesignTokensLight.radiusMd),
                  borderSide: BorderSide(color: c.hairline),
                ),
              ),
            ),
          ],

          const SizedBox(height: IDesignTokensLight.spacing4),
          Row(
            children: [
              if (widget.questions.length > 1)
                Text(
                  approvalProgress(_index, widget.questions.length),
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeSm,
                    color: c.textTertiary,
                  ),
                ),
              const Spacer(),
              if (current.skippable) ...[
                IButton(
                  label: widget.skipText,
                  size: IButtonSize.sm,
                  onPressed: gate.decidable ? () => _commit(const []) : null,
                ),
                const SizedBox(width: IDesignTokensLight.spacing2),
              ],
              IButton(
                label: _index == widget.questions.length - 1
                    ? widget.confirmText
                    : '下一题',
                size: IButtonSize.sm,
                variant: IButtonVariant.primary,
                onPressed: advanceable ? () => _commit(_selected) : null,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// 「这条确认还作不作数」。
///
/// 两种失效用不同的图标而不是只换颜色：等太久了是时钟，内容变了是版本记录。
/// 每一态都带文字标签，灰度与色觉障碍都只能靠那几个字。
class _ApprovalGateNotice extends StatelessWidget {
  const _ApprovalGateNotice({
    required this.gate,
    required this.renewText,
    required this.reviewText,
    this.onRenew,
    this.onReview,
  });

  final IApprovalGate gate;
  final String renewText;
  final String reviewText;
  final VoidCallback? onRenew;
  final VoidCallback? onReview;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final (ink, tint) = switch (gate.state) {
      IApprovalGateState.expiring => (c.warning, c.warningSubtle),
      IApprovalGateState.expired || IApprovalGateState.stale => (c.danger, c.dangerSubtle),
      IApprovalGateState.open => (c.textSecondary, c.bgElevated),
    };

    return Semantics(
      liveRegion: true,
      label: gate.detail.isEmpty ? gate.label : '\${gate.label}，\${gate.detail}',
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing3,
          vertical: IDesignTokensLight.spacing2,
        ),
        decoration: BoxDecoration(
          color: c.bgSubtle,
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        ),
        child: Row(
          children: [
            Container(
              width: 22,
              height: 22,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: tint, shape: BoxShape.circle),
              child: IIcon(
                gate.state == IApprovalGateState.stale ? 'history' : 'clock',
                size: 14,
                color: ink,
              ),
            ),
            const SizedBox(width: IDesignTokensLight.spacing2),
            Expanded(
              child: Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: IDesignTokensLight.spacing2,
                children: [
                  Text(
                    gate.label,
                    style: TextStyle(
                      fontSize: IDesignTokensLight.fontSizeSm,
                      fontWeight: FontWeight.w500,
                      color: c.text,
                    ),
                  ),
                  if (gate.detail.isNotEmpty)
                    Text(
                      gate.detail,
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeSm,
                        color: c.textSecondary,
                      ),
                    ),
                ],
              ),
            ),
            if (gate.action == IApprovalGateAction.renew)
              IButton(label: renewText, size: IButtonSize.sm, onPressed: onRenew),
            if (gate.action == IApprovalGateAction.review)
              IButton(label: reviewText, size: IButtonSize.sm, onPressed: onReview),
          ],
        ),
      ),
    );
  }
}

/// 任务行：智能体任务的实时状态。
class IAgentTasks extends StatefulWidget {
  const IAgentTasks({
    super.key,
    required this.tasks,
    this.showSummary = true,
    this.onSelect,
  });

  final List<IAgentTask> tasks;
  final bool showSummary;
  final ValueChanged<IAgentTask>? onSelect;

  @override
  State<IAgentTasks> createState() => _IAgentTasksState();
}

class _IAgentTasksState extends State<IAgentTasks> {
  final Set<String> _open = {};

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final summary = summarizeTasks(widget.tasks);

    // 状态同时用形状与颜色：只靠颜色的话，灰绿两色在灰度打印下分不出来
    Widget mark(IAgentTask task) {
      final (Color tone, Color toneSubtle, Widget inner) = switch (task.status) {
        IAgentTaskStatus.completed => (
            c.success,
            c.successSubtle,
            IIcon('check', size: 13, color: c.success)
          ),
        IAgentTaskStatus.failed => (
            c.danger,
            c.dangerSubtle,
            IIcon('close', size: 13, color: c.danger)
          ),
        IAgentTaskStatus.running => (
            c.textSecondary,
            Colors.transparent,
            SizedBox(
              width: 12,
              height: 12,
              child: CircularProgressIndicator(strokeWidth: 2, color: c.brand),
            )
          ),
        IAgentTaskStatus.pending => (
            c.textSecondary,
            Colors.transparent,
            Text(
              '${task.step ?? ''}',
              style: TextStyle(
                fontSize: IDesignTokensLight.fontSizeXs,
                color: c.textSecondary,
              ),
            )
          ),
      };
      return Container(
        width: 22,
        height: 22,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: toneSubtle,
          shape: BoxShape.circle,
          border: toneSubtle == Colors.transparent
              ? Border.all(color: c.border)
              : null,
        ),
        child: inner,
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final task in widget.tasks) ...[
          InkWell(
            onTap: () {
              widget.onSelect?.call(task);
              if (task.detail == null) return;
              setState(() {
                if (_open.contains(task.id)) {
                  _open.remove(task.id);
                } else {
                  _open.add(task.id);
                }
              });
            },
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: IDesignTokensLight.spacing4,
                vertical: IDesignTokensLight.spacing3,
              ),
              decoration: BoxDecoration(
                color: c.bgElevated,
                border: Border.all(color: c.hairline),
                borderRadius:
                    BorderRadius.circular(IDesignTokensLight.radiusFull),
              ),
              child: Row(
                children: [
                  mark(task),
                  const SizedBox(width: IDesignTokensLight.spacing3),
                  Expanded(
                    child: Text(
                      task.title,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeMd,
                        color: c.text,
                      ),
                    ),
                  ),
                  if (task.meta != null)
                    Text(
                      task.meta!,
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeSm,
                        color: c.textTertiary,
                      ),
                    ),
                  if (task.detail != null) ...[
                    const SizedBox(width: IDesignTokensLight.spacing2),
                    AnimatedRotation(
                      turns: _open.contains(task.id) ? 0.25 : 0,
                      duration: IDesignTokensLight.motionFast,
                      child: IIcon('chevron-right',
                          size: 14, color: c.textTertiary),
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (task.detail != null && _open.contains(task.id))
            Padding(
              padding: const EdgeInsets.only(
                left: 52,
                top: IDesignTokensLight.spacing2,
                bottom: IDesignTokensLight.spacing2,
              ),
              child: Text(
                task.detail!,
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeSm,
                  color: c.textSecondary,
                  height: 1.6,
                ),
              ),
            ),
          const SizedBox(height: IDesignTokensLight.spacing2),
        ],
        if (widget.showSummary && widget.tasks.isNotEmpty)
          Text(
            '${summary.completed} / ${summary.total} 已完成'
            '${summary.failed > 0 ? ' · ${summary.failed} 项失败' : ''}'
            '${summary.running > 0 ? ' · ${summary.running} 项进行中' : ''}',
            style: TextStyle(
              fontSize: IDesignTokensLight.fontSizeSm,
              color: c.textTertiary,
            ),
          ),
      ],
    );
  }
}

/// 建议卡：智能体的主动建议 + 置信度计量。
class IRecommendCard extends StatelessWidget {
  const IRecommendCard({
    super.key,
    required this.title,
    required this.body,
    this.confidence = 0.8,
    this.acceptText = '采纳',
    this.alternativeText = '换一个',
    this.showAlternative = true,
    this.onAccept,
    this.onAlternative,
  });

  final String title;
  final Widget body;

  /// 0–1 的置信度；分三档展示，不显示精确数字
  final double confidence;
  final String acceptText;
  final String alternativeText;
  final bool showAlternative;
  final VoidCallback? onAccept;
  final VoidCallback? onAlternative;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final level = confidenceOf(confidence);
    final tone = switch (level.level) {
      IConfidenceLevel.high => c.success,
      IConfidenceLevel.medium => c.warning,
      IConfidenceLevel.low => c.textTertiary,
    };

    return _AgentCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: IDesignTokensLight.fontSizeMd,
              fontWeight: FontWeight.w500,
              color: c.text,
            ),
          ),
          const SizedBox(height: IDesignTokensLight.spacing2),
          DefaultTextStyle(
            style: TextStyle(
              fontSize: IDesignTokensLight.fontSizeMd,
              color: c.textSecondary,
              height: 1.6,
            ),
            child: body,
          ),
          const SizedBox(height: IDesignTokensLight.spacing4),
          Row(
            children: [
              // 格子是视觉线索，文字才是主要表达——灰度下只剩文字可读
              for (var n = 1; n <= 3; n++) ...[
                Container(
                  width: 3,
                  height: 4.0 + n * 3,
                  decoration: BoxDecoration(
                    color: n <= level.bars ? tone : c.border,
                    borderRadius: BorderRadius.circular(1),
                  ),
                ),
                const SizedBox(width: 2),
              ],
              const SizedBox(width: IDesignTokensLight.spacing1),
              Text(
                level.label,
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeSm,
                  color: tone,
                ),
              ),
              const Spacer(),
              if (showAlternative) ...[
                IButton(
                  label: alternativeText,
                  size: IButtonSize.sm,
                  onPressed: onAlternative,
                ),
                const SizedBox(width: IDesignTokensLight.spacing2),
              ],
              IButton(
                label: acceptText,
                size: IButtonSize.sm,
                variant: IButtonVariant.primary,
                onPressed: onAccept,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
