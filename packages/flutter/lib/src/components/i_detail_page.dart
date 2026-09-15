import 'package:flutter/material.dart';
import '../logic/detail.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_button.dart';
import 'i_icon.dart';
import 'i_tag.dart';

/// 一条记录摊开之后的页面骨架（astra.md 的 B12）。
///
/// 它不管字段怎么排——字段组、关联列表、时间轴都由调用方填进 child。
/// 它管的是四件事，每一件都在 logic/detail.dart 里判：这条记录现在能做什么、
/// 看到的这一份还作不作数、从哪儿来回哪儿去、上一条 / 下一条。
///
/// 版面顺序是刻意的：返回入口与「第几条」在最上面（用户是从列表点进来的，
/// 第一反应是「我在哪、怎么回去」），然后标题与状态，再是失效提示，最后才是动作。
/// 把动作放在失效提示上面的话，用户会先点、再读到「这份已经旧了」。
class IDetailPage extends StatelessWidget {
  const IDetailPage({
    super.key,
    required this.title,
    required this.status,
    required this.child,
    this.statusTone = ITagType.normal,
    this.summary = '',
    this.actions = const [],
    this.permissions = const [],
    this.seenRevision = 0,
    this.currentRevision = 0,
    this.exists = true,
    this.denied = const {},
    this.siblingIds = const [],
    this.currentId = '',
    this.returnTicket = '',
    this.extra,
    this.onAction,
    this.onRefresh,
    this.onBack,
    this.onNavigate,
  });

  final String title;

  /// 状态的显示名。同时也是「没有可执行操作」那句话里的那个词
  final String status;
  final ITagType statusTone;
  final String summary;

  /// 这一页有哪些动作。状态不允许的不会出现，没权限的出现但停用
  final List<IDetailActionSpec> actions;
  final List<String> permissions;
  final int seenRevision;
  final int currentRevision;
  final bool exists;

  /// 业务规则挡下的动作：键是动作 key，值是给人看的原因
  final Map<String, String> denied;

  /// 列表里这一批的 id，用来算上一条 / 下一条
  final List<String> siblingIds;
  final String currentId;

  /// 从列表带过来的返回票据（packReturn 的产物）
  final String returnTicket;
  final Widget? extra;
  final Widget child;

  /// 点了某个动作。停用的动作不会触发
  final void Function(String key)? onAction;
  final VoidCallback? onRefresh;

  /// 回列表。带上解出来的票据，调用方照它还原筛选与滚动位置
  final void Function(IReturnTicket? ticket)? onBack;
  final void Function(String id)? onNavigate;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final freshness = recordFreshness(
      seenRevision: seenRevision,
      currentRevision: currentRevision,
      exists: exists,
    );
    final resolved = detailActions(
      actions,
      status: status,
      permissions: permissions,
      freshness: freshness.kind,
      denied: denied,
    );

    /*
     * 灰按钮的理由按原因归并：同一个原因挡住三个动作时不说三遍。
     * 写在按钮下面而不是只挂提示——触摸屏没有悬停。
     */
    final grouped = <String, List<String>>{};
    for (final action in resolved) {
      if (!action.disabled) continue;
      grouped.putIfAbsent(action.reason, () => []).add(action.label);
    }

    final neighbours = detailNeighbours(siblingIds, currentId);
    final ticket = unpackReturn(returnTicket);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Semantics(
          container: true,
          label: '记录导航',
          child: Row(
            children: [
              IButton(
                label: returnLabel(ticket),
                size: IButtonSize.sm,
                variant: IButtonVariant.text,
                onPressed: () => onBack?.call(ticket),
              ),
              if (neighbours.position.isNotEmpty) ...[
                const SizedBox(width: IDesignTokensLight.spacing2),
                Text(
                  neighbours.position,
                  style: TextStyle(
                    fontSize: IDesignTokensLight.fontSizeSm,
                    color: c.textSecondary,
                  ),
                ),
              ],
              const Spacer(),
              // 到头了按钮停用而不是消失：消失会让人以为是页面坏了
              Semantics(
                label: neighbours.prevId != null ? '上一条' : neighbours.edgeHint,
                child: IButton(
                  label: '上一条',
                  size: IButtonSize.sm,
                  onPressed: neighbours.prevId == null
                      ? null
                      : () => onNavigate?.call(neighbours.prevId!),
                ),
              ),
              const SizedBox(width: IDesignTokensLight.spacing1),
              Semantics(
                label: neighbours.nextId != null ? '下一条' : neighbours.edgeHint,
                child: IButton(
                  label: '下一条',
                  size: IButtonSize.sm,
                  onPressed: neighbours.nextId == null
                      ? null
                      : () => onNavigate?.call(neighbours.nextId!),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: IDesignTokensLight.spacing4),

        Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: IDesignTokensLight.spacing3,
          runSpacing: IDesignTokensLight.spacing2,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: IDesignTokensLight.fontSizeXl,
                fontWeight: FontWeight.w500,
                color: c.text,
              ),
            ),
            ITag(type: statusTone, child: Text(status)),
            if (extra != null) extra!,
          ],
        ),
        if (summary.isNotEmpty) ...[
          const SizedBox(height: IDesignTokensLight.spacing2),
          Text(
            summary,
            style: TextStyle(fontSize: IDesignTokensLight.fontSizeSm, color: c.textSecondary),
          ),
        ],

        // 失效提示在动作上面：放下面的话，用户会先点、再读到「这份已经旧了」
        if (freshness.kind != IRecordFreshness.fresh) ...[
          const SizedBox(height: IDesignTokensLight.spacing3),
          _Stale(
            state: freshness,
            onRefresh: onRefresh,
            onBack: () => onBack?.call(ticket),
          ),
        ],

        const SizedBox(height: IDesignTokensLight.spacing3),
        if (resolved.isNotEmpty)
          Wrap(
            spacing: IDesignTokensLight.spacing2,
            runSpacing: IDesignTokensLight.spacing2,
            children: [
              for (final action in resolved)
                Semantics(
                  label: action.disabled ? '${action.label}，${action.reason}' : action.label,
                  child: IButton(
                    label: action.label,
                    size: IButtonSize.sm,
                    variant: switch (action.kind) {
                      IDetailActionKind.primary => IButtonVariant.primary,
                      IDetailActionKind.danger => IButtonVariant.danger,
                      IDetailActionKind.standard => IButtonVariant.secondary,
                    },
                    onPressed: action.disabled ? null : () => onAction?.call(action.key),
                  ),
                ),
            ],
          )
        else
          // 空白一片会让人以为页面没加载完
          Text(
            noActionHint(status),
            style: TextStyle(fontSize: IDesignTokensLight.fontSizeSm, color: c.textTertiary),
          ),

        if (grouped.isNotEmpty) ...[
          const SizedBox(height: IDesignTokensLight.spacing2),
          for (final entry in grouped.entries)
            Text(
              '${entry.value.join('、')}不可用：${entry.key}',
              style: TextStyle(
                fontSize: IDesignTokensLight.fontSizeSm,
                color: c.textSecondary,
              ),
            ),
        ],

        const SizedBox(height: IDesignTokensLight.spacing4),
        Flexible(child: child),
      ],
    );
  }
}

/// 失效提示：图标 + 淡底色块，文字标签永远在，颜色只是第三条线索
class _Stale extends StatelessWidget {
  const _Stale({required this.state, this.onRefresh, this.onBack});

  final IFreshnessState state;
  final VoidCallback? onRefresh;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final deleted = state.kind == IRecordFreshness.deleted;
    final ink = deleted ? c.danger : c.warning;

    return Semantics(
      liveRegion: true,
      label: '${state.label}，${state.detail}',
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(
          horizontal: IDesignTokensLight.spacing3,
          vertical: IDesignTokensLight.spacing2,
        ),
        decoration: BoxDecoration(
          color: deleted ? c.dangerSubtle : c.warningSubtle,
          border: Border.all(color: c.hairline),
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
              child: IIcon(deleted ? 'error-circle' : 'history', size: 14, color: ink),
            ),
            Text(
              state.label,
              style: TextStyle(
                fontSize: IDesignTokensLight.fontSizeSm,
                fontWeight: FontWeight.w500,
                color: c.text,
              ),
            ),
            Text(
              state.detail,
              style: TextStyle(
                fontSize: IDesignTokensLight.fontSizeSm,
                color: c.textSecondary,
              ),
            ),
            if (state.action == IFreshnessAction.refresh)
              IButton(label: '刷新看最新', size: IButtonSize.sm, onPressed: onRefresh),
            if (state.action == IFreshnessAction.back)
              IButton(label: '回到列表', size: IButtonSize.sm, onPressed: onBack),
          ],
        ),
      ),
    );
  }
}
