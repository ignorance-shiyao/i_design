import 'package:flutter/material.dart';
import '../logic/toolchip.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';
import 'i_config_provider.dart';
import 'i_icon.dart';
import 'i_loading.dart';

/// 工具芯片：把一串工具调用压成一行行芯片。
///
/// 与 IChatToolCall 的分工：**芯片是折叠态，卡片是展开态**。
/// 智能体一次回答里可能调十几次工具，每次都摊成一张卡片，读者要滚三屏才看得到
/// 结论；全藏起来又没人知道它动了什么。
class IToolChips extends StatelessWidget {
  const IToolChips({
    super.key,
    required this.items,
    this.max = 0,
    this.expanded = false,
    this.onExpand,
    this.onSelect,
  });

  final List<IToolChipItem> items;

  /// 超过这个数量就折叠，留一个「还有 N 个」的按钮；0 表示不折叠
  final int max;
  final bool expanded;
  final VoidCallback? onExpand;
  final ValueChanged<IToolChipItem>? onSelect;

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final locale = IConfigProvider.localeOf(context);
    final clipped = max > 0 && items.length > max && !expanded;
    final shown = clipped ? items.take(max).toList() : items;
    // 折叠时把被藏起来那部分的统计顶在按钮上：折叠不该等于把信息删掉
    final hidden = summarizeToolChips(items.skip(shown.length).toList());
    final hiddenStat = toolChipStat(hidden.added, hidden.removed);

    return Wrap(
      spacing: IDesignTokensLight.spacing2,
      runSpacing: IDesignTokensLight.spacing2,
      children: [
        for (final item in shown) _chip(c, item),
        if (clipped)
          _shell(
            c,
            onTap: onExpand,
            children: [
              Text(
                locale.toolMoreText(items.length - shown.length),
                style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeXs),
              ),
              if (hiddenStat.isNotEmpty) ...[
                const SizedBox(width: IDesignTokensLight.spacing2),
                Text(
                  hiddenStat,
                  style: TextStyle(color: c.textSecondary, fontSize: IDesignTokensLight.fontSizeXs),
                ),
              ],
              if (hidden.failed > 0) ...[
                const SizedBox(width: IDesignTokensLight.spacing2),
                _pill(c, locale.toolFailedText(hidden.failed), c.dangerSubtle),
              ],
            ],
          ),
      ],
    );
  }

  Widget _chip(IColors c, IToolChipItem item) {
    final (fg, bg) = switch (item.status) {
      IToolChipStatus.error => (c.danger, c.dangerSubtle),
      IToolChipStatus.running => (c.brand, c.brandSubtle),
      IToolChipStatus.success => (c.success, c.successSubtle),
    };

    return _shell(
      c,
      onTap: onSelect == null ? null : () => onSelect!(item),
      children: [
        // 状态落在图标那一格：形状不同（勾 / 叉 / 转圈），颜色只是第三条线索
        Container(
          width: 20,
          height: 20,
          alignment: Alignment.center,
          decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
          child: item.status == IToolChipStatus.running
              ? const ILoading(size: ISize.sm)
              : IIcon(toolChipIcon(item.status), size: 13, color: fg),
        ),
        const SizedBox(width: IDesignTokensLight.spacing2),
        Flexible(
          child: Text(
            item.label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: c.text,
              fontSize: IDesignTokensLight.fontSizeXs,
              fontFamily: 'monospace',
            ),
          ),
        ),
        // 统计用文字而不是只用颜色：灰度打印与色觉障碍下「+13 −4」谁都读得出来
        if (item.added > 0) ...[
          const SizedBox(width: IDesignTokensLight.spacing2),
          _pill(c, '+${item.added}', c.successSubtle),
        ],
        if (item.removed > 0) ...[
          const SizedBox(width: IDesignTokensLight.spacing1),
          _pill(c, '−${item.removed}', c.dangerSubtle),
        ],
      ],
    );
  }

  /// 芯片的外壳：四边等宽的发丝线，状态不靠加粗某一条边表达
  Widget _shell(IColors c, {required List<Widget> children, VoidCallback? onTap}) {
    return Material(
      color: c.bgElevated,
      borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
      child: InkWell(
        borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(color: c.hairline),
            borderRadius: BorderRadius.circular(IDesignTokensLight.radiusFull),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: IDesignTokensLight.spacing3,
            vertical: IDesignTokensLight.spacing1,
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: children),
        ),
      ),
    );
  }

  /// 淡底色块 + 正文色：12px 的小字直接染成语义色，在浅底上只有 2.1:1
  Widget _pill(IColors c, String text, Color bg) => Container(
        padding: const EdgeInsets.symmetric(horizontal: IDesignTokensLight.spacing1),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(IDesignTokensLight.radiusSm),
        ),
        child: Text(
          text,
          style: TextStyle(color: c.text, fontSize: IDesignTokensLight.fontSizeXs),
        ),
      );
}
