import 'package:flutter/material.dart';
import '../logic/page_state.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_button.dart';
import 'i_empty.dart';
import 'i_icon.dart';
import 'i_skeleton.dart';

/// 一块内容区的七种样子：加载中、空、无权限、失败、离线、部分成功、数据过期。
///
/// 判定在 logic/page_state.dart，与 Web 端同一套规则；这里只负责渲染。
/// 状态用「图标 + 淡底色块 + 文字标签」表达，不用加粗边线，
/// 颜色也不是唯一线索——灰度下同样读得出这是哪一种。
class IPageState extends StatelessWidget {
  const IPageState({
    super.key,
    this.loading = false,
    this.online = true,
    this.errorCode,
    this.errorMessage,
    this.hasError = false,
    this.loaded = 0,
    this.failed = 0,
    this.fetchedAt,
    this.staleAfter,
    this.emptyType = IEmptyType.empty,
    this.title,
    this.onAction,
    this.child,
  });

  final bool loading;
  final bool online;
  final Object? errorCode;
  final String? errorMessage;
  final bool hasError;
  final int loaded;
  final int failed;
  final int? fetchedAt;
  final int? staleAfter;
  final IEmptyType emptyType;
  final String? title;
  final void Function(IPageStateAction action)? onAction;
  final Widget? child;

  static const Map<IPageStateKind, String> _icons = {
    IPageStateKind.offline: 'offline',
    IPageStateKind.forbidden: 'lock',
    IPageStateKind.failed: 'error-circle',
    IPageStateKind.partial: 'warning-triangle',
    IPageStateKind.stale: 'history',
  };

  static const Map<IPageStateKind, String> _labels = {
    IPageStateKind.offline: '离线',
    IPageStateKind.forbidden: '无权限',
    IPageStateKind.failed: '加载失败',
    IPageStateKind.partial: '部分成功',
    IPageStateKind.stale: '数据已过期',
  };

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final state = iPageState(
      loading: loading,
      online: online,
      errorCode: errorCode,
      errorMessage: errorMessage,
      hasError: hasError,
      loaded: loaded,
      failed: failed,
      fetchedAt: fetchedAt,
      staleAfter: staleAfter,
    );

    final children = <Widget>[];

    // 骨架屏只在一条数据都没有时占位；已有数据时刷新不该先变成一片白
    if (state.kind == IPageStateKind.loading && !state.keepsContent) {
      children.add(const ISkeleton(rows: 4));
    } else if (state.kind == IPageStateKind.empty) {
      children.add(IEmpty(type: emptyType, title: title));
    } else if (state.kind != IPageStateKind.ready) {
      children.add(_note(context, c, state));
    }

    if (state.keepsContent && child != null) children.add(child!);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (var i = 0; i < children.length; i++) ...[
          if (i > 0) const SizedBox(height: ISpacing.s3),
          children[i],
        ],
      ],
    );
  }

  Widget _note(BuildContext context, IColors c, IPageStateResult state) {
    final danger = state.kind == IPageStateKind.failed;
    final warning = state.kind == IPageStateKind.partial || state.kind == IPageStateKind.forbidden;
    final tint = danger ? c.danger : (warning ? c.warning : c.textSecondary);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: ISpacing.s4, vertical: ISpacing.s3),
      decoration: BoxDecoration(
        color: c.bgElevated,
        borderRadius: BorderRadius.circular(IRadius.md),
        border: Border.all(color: c.hairline),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: tint.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(IRadius.full),
            ),
            child: IIcon(name: _icons[state.kind] ?? 'info-circle', size: 18, color: tint),
          ),
          const SizedBox(width: ISpacing.s3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  (title == null || title!.isEmpty) ? (_labels[state.kind] ?? '') : title!,
                  style: TextStyle(color: c.text, fontSize: IFontSize.sm, fontWeight: FontWeight.w500),
                ),
                Text(state.reason, style: TextStyle(color: c.textSecondary, fontSize: IFontSize.sm)),
              ],
            ),
          ),
          if (state.action != null)
            IButton(
              variant: IButtonVariant.secondary,
              size: IButtonSize.sm,
              onPressed: () => onAction?.call(state.action!),
              child: Text(iPageStateActionLabels[state.action!] ?? ''),
            ),
        ],
      ),
    );
  }
}
