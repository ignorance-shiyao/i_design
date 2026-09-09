import 'package:flutter/material.dart';
import '../theme/i_theme.dart';
import '../tokens/tokens.dart';

enum IEmptyType { empty, search, error, permission }

/// 空状态：解释为什么这里没有内容，并给出下一步。
///
/// 插画是位图资源，Flutter 侧由使用方通过 [assetBuilder] 提供
/// （打进 assets 或走网络），组件只负责按 type 决定用哪一张与说什么。
class IEmpty extends StatelessWidget {
  const IEmpty({
    super.key,
    this.type = IEmptyType.empty,
    this.title,
    this.description,
    this.action,
    this.assetBuilder,
    this.compact = false,
  });

  final IEmptyType type;
  final String? title;
  final String? description;
  final Widget? action;

  /// 传入图片文件名（如 no-data@2x.webp），返回对应的 Widget
  final Widget Function(String fileName)? assetBuilder;
  final bool compact;

  (String, String, String) get _preset => switch (type) {
        IEmptyType.empty => ('暂无数据', '这里还没有内容，创建第一条试试。', 'no-data@2x.webp'),
        IEmptyType.search => ('没有匹配结果', '换个关键词，或减少筛选条件。', 'search-empty@2x.webp'),
        IEmptyType.error => ('加载失败', '请检查网络后重试。', 'load-failed@2x.webp'),
        IEmptyType.permission => ('无访问权限', '请联系管理员申请该资源的访问权限。', 'no-permission@2x.webp'),
      };

  @override
  Widget build(BuildContext context) {
    final c = iColorsOf(context);
    final (presetTitle, presetDesc, file) = _preset;

    return Padding(
      padding: EdgeInsets.symmetric(
        vertical: compact ? IDesignTokensLight.spacing6 : IDesignTokensLight.spacing12,
        horizontal: IDesignTokensLight.spacing6,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (assetBuilder != null)
            SizedBox(width: compact ? 120 : 180, child: assetBuilder!(file)),
          const SizedBox(height: IDesignTokensLight.spacing3),
          Text(
            title ?? presetTitle,
            style: TextStyle(color: c.text, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: IDesignTokensLight.spacing1),
          Text(
            description ?? presetDesc,
            textAlign: TextAlign.center,
            style: TextStyle(color: c.textTertiary, fontSize: IDesignTokensLight.fontSizeSm),
          ),
          if (action != null) ...[
            const SizedBox(height: IDesignTokensLight.spacing4),
            action!,
          ],
        ],
      ),
    );
  }
}
