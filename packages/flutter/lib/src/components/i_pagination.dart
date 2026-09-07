import 'package:flutter/material.dart';
import '../logic/pagination.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_icon.dart';

/// 分页：把长列表切成可控的片段。
///
/// 页码序列、边界收敛与区间文案来自 logic/pagination.dart——
/// 那是 @i-design/common 同名规则的 Dart 移植，由跨端一致性校验保证两者不分叉。
class IPagination extends StatelessWidget {
  const IPagination({
    super.key,
    required this.current,
    required this.total,
    this.pageSize = 10,
    this.maxVisible = 5,
    this.onChanged,
    this.showTotal = true,
  });

  final int current;
  final int total;
  final int pageSize;
  final int maxVisible;
  final ValueChanged<int>? onChanged;
  final bool showTotal;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final pageCount = pageCountOf(total, pageSize);
    final page = clampPage(current, pageCount);
    final items = buildPages(page, pageCount, maxVisible);

    void go(int next) {
      final target = clampPage(next, pageCount);
      if (target != page) onChanged?.call(target);
    }

    Widget cell({required Widget child, VoidCallback? onTap, bool active = false}) {
      return GestureDetector(
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minWidth: 30),
          height: 30,
          margin: const EdgeInsets.only(right: IDesignTokensLight.spacing1),
          padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing2),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: active ? c.brand : c.bg,
            border: Border.all(color: active ? c.brand : c.border),
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusMd),
          ),
          child: DefaultTextStyle(
            style: TextStyle(
              color: active ? Colors.white : c.textSecondary,
              fontSize: IDesignTokensLight.fontSizeMd,
            ),
            child: child,
          ),
        ),
      );
    }

    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        if (showTotal)
          Padding(
            padding: const EdgeInsets.only(right: IDesignTokensLight.spacing3),
            child: Text(
              rangeText(page, pageSize, total),
              style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeSm),
            ),
          ),
        cell(
          child: IIcon('chevron-left', size: 15, color: c.textSecondary),
          onTap: page == 1 ? null : () => go(page - 1),
        ),
        for (final item in items)
          if (item.isPage)
            cell(
              child: Text('${item.page}'),
              active: item.page == page,
              onTap: () => go(item.page!),
            )
          else
            cell(
              child: IIcon('more', size: 15, color: c.textTertiary),
              // 省略号一次跳跃一个窗口，比逐页点击快得多
              onTap: () => go(page + (item.isLeftGap ? -maxVisible : maxVisible)),
            ),
        cell(
          child: IIcon('chevron-right', size: 15, color: c.textSecondary),
          onTap: page == pageCount ? null : () => go(page + 1),
        ),
      ],
    );
  }
}
