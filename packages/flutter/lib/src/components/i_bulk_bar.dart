import 'package:flutter/material.dart';
import '../logic/bulk.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_button.dart';
import 'i_icon.dart';

/// 列表页上方的批量操作条（astra.md 的 B07）。
///
/// 它的第一职责不是摆按钮，是把「对谁做」说清楚。列表页上「全选」这个词有
/// 三种含义：勾中的这几行、当前这一页、符合当前筛选的全部；三者在屏幕上差别
/// 极小而后果差着数量级，所以作用域在这里是一个显式的值，摘要永远写在按钮
/// 前面——读者的视线从前往后，把范围写在按钮后面等于让他先点后读。
///
/// 第二职责是把部分失败摊开。批量操作十有八九是部分成功，结果不该弹成一个
/// 「确定」就消失的提示：失败的那几条还要照着去处理，重试也只能发这几条。
///
/// 判断全在 logic/bulk.dart，与 Web 端同一份规则。
class IBulkBar extends StatefulWidget {
  const IBulkBar({
    super.key,
    this.scope = IBulkScope.selected,
    this.pageIds = const [],
    this.selectedIds = const [],
    this.matchedTotal = 0,
    this.filtered = false,
    this.outcome,
    this.busy = false,
    this.maxFailures = 5,
    this.actionsBuilder,
    this.onScopeChange,
    this.onExecute,
    this.onRetry,
    this.onClear,
  });

  /// 当前作用域。受控：这是整条的核心状态，不能由组件自己猜
  final IBulkScope scope;
  final List<Object> pageIds;
  final List<Object> selectedIds;

  /// 符合当前筛选的总条数，由服务端给
  final int matchedTotal;
  final bool filtered;

  /// 上一轮的执行结果。给了就把成功与失败摊在条下面
  final IBulkOutcome? outcome;
  final bool busy;

  /// 失败清单最多列几条，再多就折成一句
  final int maxFailures;

  /// 这一条上的操作按钮。Web 端是具名插槽，这里是一个 builder
  final Widget Function(BuildContext context, IBulkSelection selection, VoidCallback run)?
      actionsBuilder;
  final void Function(IBulkScope scope)? onScopeChange;

  /// 执行。selection.ids 为 null 表示「全部匹配」——调用方要把筛选条件发给
  /// 服务端，而不是自己凑一份名单。
  final void Function(IBulkSelection selection)? onExecute;

  /// 只重试失败的那些
  final void Function(List<Object> ids)? onRetry;
  final VoidCallback? onClear;

  @override
  State<IBulkBar> createState() => _IBulkBarState();
}

class _IBulkBarState extends State<IBulkBar> {
  bool _asking = false;

  @override
  void didUpdateWidget(IBulkBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    // 范围一变，之前那次确认就不作数了——它复述的条数已经不对
    if (_asking &&
        (oldWidget.scope != widget.scope ||
            oldWidget.matchedTotal != widget.matchedTotal ||
            oldWidget.selectedIds.length != widget.selectedIds.length)) {
      _asking = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final selection = bulkSelection(
      scope: widget.scope,
      pageIds: widget.pageIds,
      selectedIds: widget.selectedIds,
      matchedTotal: widget.matchedTotal,
      filtered: widget.filtered,
    );
    if (selection.count == 0 && widget.outcome == null) return const SizedBox.shrink();

    final matched = widget.scope == IBulkScope.matched;
    final escalatable = !matched &&
        canEscalate(
          pageIds: widget.pageIds,
          selectedIds: widget.selectedIds,
          matchedTotal: widget.matchedTotal,
        );

    void run() {
      if (selection.needsConfirm && !_asking) {
        setState(() => _asking = true);
        return;
      }
      setState(() => _asking = false);
      widget.onExecute?.call(selection);
    }

    final outcome = widget.outcome;
    final failures = outcome == null
        ? const <IBulkFailure>[]
        : outcome.failed.take(widget.maxFailures).toList();
    final hidden =
        outcome == null ? 0 : (outcome.failed.length - widget.maxFailures).clamp(0, 1 << 30);

    return Semantics(
      container: true,
      label: '批量操作',
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing4,
          vertical: IDesignTokensLight.spacing3,
        ),
        decoration: BoxDecoration(
          // 跨出「看得见的范围」的那一档用警告底色，但底色不是唯一线索——
          // 摘要那句话本身就写着「全部 8000 项」
          color: matched ? c.warningSubtle : c.bgElevated,
          border: Border.all(color: c.hairline),
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusLg),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                if (matched) ...[
                  Container(
                    width: 22,
                    height: 22,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: c.bgElevated, shape: BoxShape.circle),
                    child: IIcon('warning-triangle', size: 14, color: c.warning),
                  ),
                  const SizedBox(width: IDesignTokensLight.spacing2),
                ],
                // 摘要在最前面，在按钮之前：范围写在按钮后面等于让人先点后读
                Expanded(
                  child: Text(
                    selection.summary,
                    style: TextStyle(
                      fontSize: IDesignTokensLight.fontSizeSm,
                      fontWeight: FontWeight.w500,
                      color: c.text,
                    ),
                  ),
                ),
                if (widget.actionsBuilder != null)
                  widget.actionsBuilder!(context, selection, run)
                else
                  IButton(
                    label: '执行',
                    size: IButtonSize.sm,
                    variant: IButtonVariant.primary,
                    loading: widget.busy,
                    onPressed: widget.busy || selection.count == 0 ? null : run,
                  ),
              ],
            ),
            const SizedBox(height: IDesignTokensLight.spacing2),
            Wrap(
              spacing: IDesignTokensLight.spacing2,
              runSpacing: IDesignTokensLight.spacing2,
              children: [
                // 只在「当前页已全勾上、匹配总数更多」时给这个入口
                if (escalatable)
                  IButton(
                    label: escalateLabel(widget.matchedTotal, filtered: widget.filtered),
                    size: IButtonSize.sm,
                    variant: IButtonVariant.text,
                    onPressed: () => widget.onScopeChange?.call(IBulkScope.matched),
                  ),
                if (matched)
                  IButton(
                    label: '仅保留已勾选的 ${widget.selectedIds.length} 项',
                    size: IButtonSize.sm,
                    variant: IButtonVariant.text,
                    onPressed: () => widget.onScopeChange?.call(IBulkScope.selected),
                  ),
                if (selection.count > 0)
                  IButton(
                    label: '取消选择',
                    size: IButtonSize.sm,
                    variant: IButtonVariant.text,
                    onPressed: widget.onClear,
                  ),
              ],
            ),

            // 确认就地展开在条下面：用户点的是这条上的按钮，答案就该出现在这条上
            if (_asking) ...[
              const SizedBox(height: IDesignTokensLight.spacing2),
              _Panel(
                tint: c.dangerSubtle,
                ink: c.danger,
                icon: 'warning-triangle',
                text: selection.confirmMessage,
                liveRegion: true,
                trailing: Wrap(
                  spacing: IDesignTokensLight.spacing2,
                  children: [
                    IButton(
                      label: '再看看',
                      size: IButtonSize.sm,
                      onPressed: () => setState(() => _asking = false),
                    ),
                    IButton(
                      label: '确认执行',
                      size: IButtonSize.sm,
                      variant: IButtonVariant.danger,
                      onPressed: run,
                    ),
                  ],
                ),
              ),
            ],

            if (outcome != null) ...[
              const SizedBox(height: IDesignTokensLight.spacing2),
              _Panel(
                tint: outcome.kind == IBulkOutcomeKind.allOk ? c.successSubtle : c.dangerSubtle,
                ink: outcome.kind == IBulkOutcomeKind.allOk ? c.success : c.danger,
                icon: outcome.kind == IBulkOutcomeKind.allOk ? 'check-circle' : 'error-circle',
                text: outcome.summary,
                liveRegion: true,
                // 重试只发失败项：成功项再执行一次，扣款与发货这类动作就是事故
                trailing: outcome.retryIds.isEmpty
                    ? null
                    : IButton(
                        label: '只重试失败的 ${outcome.retryIds.length} 项',
                        size: IButtonSize.sm,
                        loading: widget.busy,
                        onPressed: () => widget.onRetry?.call(outcome.retryIds),
                      ),
              ),
              if (failures.isNotEmpty) ...[
                const SizedBox(height: IDesignTokensLight.spacing2),
                for (final item in failures)
                  Text(
                    '${item.id} —— ${item.reason}',
                    style: TextStyle(
                      fontSize: IDesignTokensLight.fontSizeXs,
                      color: c.textSecondary,
                    ),
                  ),
                if (hidden > 0)
                  Text(
                    '还有 $hidden 项失败，展开列表查看',
                    style: TextStyle(
                      fontSize: IDesignTokensLight.fontSizeXs,
                      color: c.textSecondary,
                    ),
                  ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

class _Panel extends StatelessWidget {
  const _Panel({
    required this.tint,
    required this.ink,
    required this.icon,
    required this.text,
    this.trailing,
    this.liveRegion = false,
  });

  final Color tint;
  final Color ink;
  final String icon;
  final String text;
  final Widget? trailing;
  final bool liveRegion;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    return Semantics(
      liveRegion: liveRegion,
      label: text,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing3,
          vertical: IDesignTokensLight.spacing2,
        ),
        decoration: BoxDecoration(
          color: tint,
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
        ),
        child: Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: IDesignTokensLight.spacing2,
          runSpacing: IDesignTokensLight.spacing2,
          children: [
            Container(
              width: 22,
              height: 22,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: c.bgElevated, shape: BoxShape.circle),
              child: IIcon(icon, size: 14, color: ink),
            ),
            Text(
              text,
              style: TextStyle(fontSize: IDesignTokensLight.fontSizeSm, color: c.text),
            ),
            if (trailing != null) trailing!,
          ],
        ),
      ),
    );
  }
}
