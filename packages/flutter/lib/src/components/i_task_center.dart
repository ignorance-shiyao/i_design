import 'dart:ui' show FontFeature;
import 'package:flutter/material.dart';
import '../logic/taskcenter.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_button.dart';
import 'i_icon.dart';

/// 异步任务中心（astra.md 的 B18）。
///
/// 任务怎么跑、通知怎么发、点过去落到哪个页面，都在调用方手里——
/// 这个组件不碰任何 IO。它摆出三件事：每条任务的任务号与影响的业务对象
/// （追踪行里逐条写着）、只数「要人处理的」因而有归零之日的角标、
/// 结束的任务那个点得下去的出口，而不是一句「完成了」。
///
/// 判断全在 logic/taskcenter.dart，与 Web 端同一份规则。
class ITaskCenter extends StatefulWidget {
  const ITaskCenter({
    super.key,
    required this.tasks,
    this.title = '任务中心',
    this.formatTime,
    this.showTrail = false,
    this.onOpen,
    this.onInspect,
    this.onRetry,
    this.onCancel,
    this.onTasksChanged,
  });

  final List<IAsyncTask> tasks;
  final String title;

  /// 把时间戳排成人话。放在调用方：时区是各端从系统拿的
  final String Function(int ms)? formatTime;
  final bool showTrail;
  final void Function(ITaskTarget target, IAsyncTask task)? onOpen;

  /// 没有业务对象时点「查看任务详情」
  final void Function(IAsyncTask task)? onInspect;
  final void Function(IAsyncTask task)? onRetry;
  final void Function(IAsyncTask task)? onCancel;
  final void Function(List<IAsyncTask> tasks)? onTasksChanged;

  @override
  State<ITaskCenter> createState() => _ITaskCenterState();
}

/* 状态图标同时给形状与文字：灰度打印下失败与完成是同一个灰 */
const Map<ITaskState, String> _icons = {
  ITaskState.queued: 'clock',
  ITaskState.running: 'refresh',
  ITaskState.succeeded: 'check',
  ITaskState.failed: 'error-circle',
  ITaskState.cancelled: 'close',
};
const Map<ITaskState, String> _stateLabels = {
  ITaskState.queued: '排队中',
  ITaskState.running: '进行中',
  ITaskState.succeeded: '已完成',
  ITaskState.failed: '失败',
  ITaskState.cancelled: '已取消',
};

class _ITaskCenterState extends State<ITaskCenter> {
  final Set<String> _opened = {};

  String _time(int ms) =>
      widget.formatTime?.call(ms) ??
      DateTime.fromMillisecondsSinceEpoch(ms).toString().substring(0, 16);

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final ordered = taskOrder(widget.tasks);
    final badge = taskBadge(widget.tasks);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            Text(
              widget.title,
              style: TextStyle(fontSize: IDesignTokensLight.fontSizeMd, color: c.text),
            ),
            const SizedBox(width: IDesignTokensLight.spacing2),
            // 角标只数要人处理的：把进行中的算进去，它永远回不到零
            if (badge.count > 0)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5),
                decoration: BoxDecoration(
                  // 实心底与字色成对取，不写死白字（见 CLAUDE.md）：
                  // 危险红上的白字只有 2.84:1，连图形的下限都到不了
                  color: IDesignTokensLight.colorDangerSolid,
                  borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
                ),
                child: Text(
                  '${badge.count}',
                  style: const TextStyle(
                    fontSize: IDesignTokensLight.fontSizeXs,
                    color: IDesignTokensLight.colorOnDanger,
                  ),
                ),
              ),
            const SizedBox(width: IDesignTokensLight.spacing2),
            Expanded(
              child: Semantics(
                liveRegion: true,
                child: Text(
                  badge.text,
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeSm,
                    color: c.textSecondary,
                  ),
                ),
              ),
            ),
            if (badge.count > 0)
              IButton(
                label: '全部标为已读',
                size: IButtonSize.sm,
                onPressed: () => widget.onTasksChanged?.call(markAllSeen(widget.tasks)),
              ),
          ],
        ),
        const SizedBox(height: IDesignTokensLight.spacing3),

        if (ordered.isEmpty)
          Padding(
            padding: const EdgeInsets.all(IDesignTokensLight.spacing8),
            child: Center(
              child: Text(
                '还没有任务。导出、导入这类要跑一会儿的动作会出现在这里。',
                style: TextStyle(
                  fontSize: IDesignTokensLight.fontSizeSm,
                  color: c.textTertiary,
                ),
              ),
            ),
          )
        else
          for (final task in ordered) _item(context, task, c),
      ],
    );
  }

  Widget _item(BuildContext context, IAsyncTask task, IColors c) {
    final notice = taskNotice(task);
    final active = isActive(task);
    final unseen = !active && !task.seen;
    final trailOpen = widget.showTrail || _opened.contains(task.id);

    final Color iconColor = switch (task.state) {
      ITaskState.running || ITaskState.queued => c.brand,
      ITaskState.succeeded => c.success,
      ITaskState.failed => c.danger,
      ITaskState.cancelled => c.textSecondary,
    };
    final Color iconBg = switch (task.state) {
      ITaskState.running || ITaskState.queued => c.brandSubtle,
      ITaskState.succeeded => c.successSubtle,
      ITaskState.failed => c.dangerSubtle,
      ITaskState.cancelled => c.bgSubtle,
    };

    return Container(
      margin: const EdgeInsets.only(bottom: IDesignTokensLight.spacing2),
      padding: const EdgeInsets.all(IDesignTokensLight.spacing3),
      decoration: BoxDecoration(
        color: unseen ? c.bgSubtle : c.bgElevated,
        border: Border.all(color: c.hairline),
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 28,
                height: 28,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
                child: IIcon(_icons[task.state] ?? 'clock', size: 16, color: iconColor),
              ),
              const SizedBox(width: IDesignTokensLight.spacing3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: IDesignTokensLight.spacing2,
                      children: [
                        Text(
                          task.title,
                          style: TextStyle(
                            fontSize: IDesignTokensLight.fontSizeMd,
                            color: c.text,
                          ),
                        ),
                        // 状态文字与图标同时给：颜色不能是唯一线索
                        Text(
                          _stateLabels[task.state] ?? '',
                          style: TextStyle(
                            fontSize: IDesignTokensLight.fontSizeXs,
                            color: c.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      notice?.description ??
                          (task.target == null
                              ? '任务 ${task.id}'
                              : '${task.target!.kind}「${task.target!.label}」'),
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeSm,
                        color: c.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: IDesignTokensLight.spacing2),
          Wrap(
            spacing: IDesignTokensLight.spacing2,
            runSpacing: IDesignTokensLight.spacing2,
            children: [
              if (active)
                IButton(
                  label: '取消',
                  size: IButtonSize.sm,
                  onPressed: () => widget.onCancel?.call(task),
                )
              else ...[
                if (task.state == ITaskState.failed)
                  IButton(
                    label: '重试',
                    size: IButtonSize.sm,
                    onPressed: () => widget.onRetry?.call(task),
                  ),
                // 出口永远有：没有业务对象时至少能去任务详情
                IButton(
                  label: notice?.actionLabel ?? '查看任务详情',
                  size: IButtonSize.sm,
                  variant: IButtonVariant.primary,
                  onPressed: () {
                    // 看过了就从角标里去掉——「看过」不等于「处理完了」
                    widget.onTasksChanged?.call(markSeen(widget.tasks, task.id));
                    final target = task.target;
                    if (target != null) {
                      widget.onOpen?.call(target, task);
                    } else {
                      widget.onInspect?.call(task);
                    }
                  },
                ),
              ],
              IButton(
                label: trailOpen ? '收起' : '追踪',
                size: IButtonSize.sm,
                onPressed: () => setState(() {
                  if (!_opened.remove(task.id)) _opened.add(task.id);
                }),
              ),
            ],
          ),

          // 追踪行：任务号排第一，用户打给客服时能报出来的只有它
          if (trailOpen) ...[
            const SizedBox(height: IDesignTokensLight.spacing2),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(
                horizontal: IDesignTokensLight.spacing3,
                vertical: IDesignTokensLight.spacing2,
              ),
              decoration: BoxDecoration(
                color: c.bgSubtle,
                borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (final line in taskTrail(task, _time))
                    Text(
                      line,
                      style: TextStyle(
                        fontSize: IDesignTokensLight.fontSizeXs,
                        color: c.textTertiary,
                        fontFeatures: const [FontFeature.tabularFigures()],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
